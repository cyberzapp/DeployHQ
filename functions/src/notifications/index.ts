import * as admin from 'firebase-admin';
import { db, messaging } from '../auth/permissions';

interface MonitorAlertEvaluationInput {
  workspaceId: string;
  monitorId: string;
  monitorName: string;
  projectId?: string;
  previousStatus?: string;
  currentStatus: 'operational' | 'degraded' | 'down';
  responseTimeMs: number;
  errorMessage?: string;
}

/**
 * Evaluates configured alerts when a monitor check completes and dispatches notifications
 * only when the condition is met.
 */
export async function evaluateMonitorAlerts(input: MonitorAlertEvaluationInput): Promise<void> {
  const {
    workspaceId,
    monitorName,
    projectId,
    previousStatus,
    currentStatus,
    responseTimeMs,
    errorMessage,
  } = input;

  const alertsSnap = await db
    .collection(`workspaces/${workspaceId}/alerts`)
    .where('enabled', '==', true)
    .get();

  for (const alertDoc of alertsSnap.docs) {
    const alert = alertDoc.data();
    if (alert.projectId && projectId && alert.projectId !== projectId) {
      continue;
    }

    let triggered = false;
    let title = '';
    let body = '';

    if (
      (alert.condition === 'monitor_down' || alert.condition === 'website_unavailable') &&
      currentStatus === 'down'
    ) {
      triggered = true;
      title = `Monitor Down: ${monitorName}`;
      body = errorMessage || `${monitorName} failed its HTTP health check.`;
    } else if (
      alert.condition === 'monitor_recovered' &&
      previousStatus === 'down' &&
      currentStatus === 'operational'
    ) {
      triggered = true;
      title = `Monitor Recovered: ${monitorName}`;
      body = `${monitorName} is back online (${responseTimeMs}ms).`;
    } else if (
      alert.condition === 'response_time_exceeds' &&
      responseTimeMs > Number(alert.threshold || 500)
    ) {
      triggered = true;
      title = `High Response Latency: ${monitorName}`;
      body = `Response time ${responseTimeMs}ms exceeded threshold of ${alert.threshold}ms.`;
    }

    if (triggered) {
      const notifRef = db.collection(`workspaces/${workspaceId}/notifications`).doc();
      await notifRef.set({
        id: notifRef.id,
        workspaceId,
        title,
        message: body,
        type: alert.condition,
        severity: currentStatus === 'down' ? 'critical' : 'warning',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await alertDoc.ref.update({
        lastTriggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Attempt FCM push delivery if workspace members have registered FCM tokens
      try {
        const membersSnap = await db.collection(`workspaces/${workspaceId}/members`).get();
        for (const m of membersSnap.docs) {
          const userSnap = await db.doc(`users/${m.id}`).get();
          const fcmToken = userSnap.data()?.preferences?.fcmToken;
          if (fcmToken) {
            await messaging.send({
              token: fcmToken,
              notification: { title, body },
            });
          }
        }
      } catch {
        // Non-fatal if push token expired
      }
    }
  }
}

