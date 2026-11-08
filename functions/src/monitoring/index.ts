import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { db, verifyWorkspaceRole } from '../auth/permissions';
import { evaluateMonitorAlerts } from '../notifications';

/**
 * Execute an actual HTTP health check against a single monitor's target URL
 * and record the real latency, HTTP status code, and uptime percentage.
 */
export async function executeMonitorCheckInternal(
  workspaceId: string,
  monitorId: string
): Promise<{
  statusCode: number;
  responseTimeMs: number;
  success: boolean;
  status: 'operational' | 'degraded' | 'down';
  errorMessage?: string;
}> {
  const monitorRef = db.doc(`workspaces/${workspaceId}/monitors/${monitorId}`);
  const monitorSnap = await monitorRef.get();
  if (!monitorSnap.exists) {
    throw new HttpsError('not-found', 'Monitor not found.');
  }

  const monitor = monitorSnap.data()!;
  const targetUrl = String(monitor.url || '');
  const method = String(monitor.method || 'GET').toUpperCase();
  const timeoutMs = Number(monitor.timeoutMs || 10000);
  const expectedStatus = Number(monitor.expectedStatus || 200);

  const startTime = Date.now();
  let statusCode = 0;
  let success = false;
  let errorMessage = '';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'DeployHQ-UptimeMonitor/1.0',
      },
    });
    statusCode = response.status;
    success = statusCode === expectedStatus || (expectedStatus === 200 && statusCode >= 200 && statusCode < 300);
    if (!success) {
      errorMessage = `Received HTTP ${statusCode} (expected ${expectedStatus})`;
    }
  } catch (err: any) {
    statusCode = 0;
    success = false;
    errorMessage = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : String(err?.message || 'Connection failed');
  } finally {
    clearTimeout(timer);
  }

  const responseTimeMs = Math.max(1, Date.now() - startTime);
  const checkRef = db.collection(`workspaces/${workspaceId}/monitorChecks`).doc();

  await checkRef.set({
    id: checkRef.id,
    workspaceId,
    monitorId,
    status: success ? 'operational' : 'down',
    statusCode,
    responseTimeMs,
    latencyMs: responseTimeMs,
    success,
    up: success,
    errorMessage: errorMessage || null,
    checkedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Compute actual uptime percentage and average response time from stored check results
  const recentChecksSnap = await db
    .collection(`workspaces/${workspaceId}/monitorChecks`)
    .where('monitorId', '==', monitorId)
    .orderBy('checkedAt', 'desc')
    .limit(50)
    .get();

  const checks = recentChecksSnap.docs.map((d) => d.data());
  const totalChecks = Math.max(1, checks.length);
  const successfulChecks = checks.filter((c) => c.success).length;
  const uptimePercentage = Number(((successfulChecks / totalChecks) * 100).toFixed(2));
  const avgLatencyMs = Math.round(
    checks.reduce((acc, c) => acc + Number(c.responseTimeMs || c.latencyMs || 0), 0) / totalChecks
  );

  const nextStatus: 'operational' | 'degraded' | 'down' = !success
    ? 'down'
    : responseTimeMs > 1200
    ? 'degraded'
    : 'operational';

  const previousStatus = monitor.status;

  await monitorRef.update({
    status: nextStatus,
    uptimePercentage,
    uptime: uptimePercentage,
    avgLatencyMs,
    latencyMs: responseTimeMs,
    lastStatusCode: statusCode,
    lastError: errorMessage || null,
    lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await evaluateMonitorAlerts({
    workspaceId,
    monitorId,
    monitorName: monitor.name,
    projectId: monitor.projectId,
    previousStatus,
    currentStatus: nextStatus,
    responseTimeMs,
    errorMessage,
  });

  return {
    statusCode,
    responseTimeMs,
    success,
    status: nextStatus,
    errorMessage: errorMessage || undefined,
  };
}

/**
 * Callable function to run an immediate live HTTP check for a monitor.
 */
export const runMonitorHealthCheckNow = onCall(async (request) => {
  const { workspaceId, monitorId } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin', 'developer']);
  return executeMonitorCheckInternal(workspaceId, monitorId);
});

/**
 * Scheduled Cloud Function that executes HTTP health checks for all enabled monitors.
 */
export const scheduledUptimeHealthChecks = onSchedule('every 5 minutes', async () => {
  const monitorsSnap = await db
    .collectionGroup('monitors')
    .where('enabled', '==', true)
    .limit(50)
    .get();

  for (const docSnap of monitorsSnap.docs) {
    const workspaceRef = docSnap.ref.parent.parent;
    if (!workspaceRef) continue;
    try {
      await executeMonitorCheckInternal(workspaceRef.id, docSnap.id);
    } catch {
      // Continue processing remaining monitors
    }
  }
});

/**
 * HTTP Endpoint `/api/ingest/errors` to ingest application errors with SHA-256 fingerprint deduplication.
 */
export const ingestErrorEvent = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-DeployHQ-Key');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const {
    workspaceId,
    projectId,
    projectName,
    environment = 'production',
    message,
    type = 'Error',
    stackTrace = '',
    requestUrl = '',
    browser = 'Node.js / Browser Runtime',
    release = '',
  } = req.body || {};

  if (!workspaceId || !projectId || !message) {
    res.status(400).json({ error: 'workspaceId, projectId, and message are required.' });
    return;
  }

  const firstStackLine = String(stackTrace).split('\n')[0] || '';
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${projectId}:${type}:${message}:${firstStackLine}`)
    .digest('hex')
    .slice(0, 24);

  const errorDocId = `err_${fingerprint}`;
  const errorRef = db.doc(`workspaces/${workspaceId}/errors/${errorDocId}`);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(errorRef);
    if (existing.exists) {
      const prevCount = Number(existing.data()?.count || 1);
      tx.update(errorRef, {
        count: prevCount + 1,
        eventCount: prevCount + 1,
        status: 'unresolved',
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      tx.set(errorRef, {
        id: errorDocId,
        workspaceId,
        projectId,
        projectName: projectName || projectId,
        environment,
        title: `${type}: ${String(message).slice(0, 120)}`,
        message: String(message).slice(0, 3500),
        type: String(type).slice(0, 100),
        level: 'error',
        severity: 'high',
        status: 'unresolved',
        fingerprint,
        stackTrace: String(stackTrace).slice(0, 18000),
        release: String(release).slice(0, 120),
        count: 1,
        eventCount: 1,
        affectedUsers: 1,
        context: {
          requestUrl: String(requestUrl).slice(0, 500),
          browser: String(browser).slice(0, 200),
        },
        firstSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  res.status(200).json({ status: 'ingested', fingerprint, errorId: errorDocId });
});

