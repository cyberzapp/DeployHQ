import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { db, verifyWorkspaceRole } from '../auth/permissions';

const vercelWebhookSecret = defineSecret('VERCEL_WEBHOOK_SECRET');

/**
 * Connect a Vercel account using a verified Vercel Access Token (and optional Team ID).
 * Validates credentials against `https://api.vercel.com/v2/user` before marking connected.
 */
export const connectVercelIntegration = onCall(async (request) => {
  const { workspaceId, apiToken, teamId } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin']);

  if (!apiToken || typeof apiToken !== 'string') {
    throw new HttpsError('invalid-argument', 'A valid Vercel API token is required.');
  }

  const userRes = await fetch('https://api.vercel.com/v2/user', {
    headers: {
      Authorization: `Bearer ${apiToken.trim()}`,
    },
  });

  if (!userRes.ok) {
    throw new HttpsError(
      'unauthenticated',
      'Vercel API token verification failed. Please check the token permissions.'
    );
  }

  const userJson = (await userRes.json()) as {
    user: { username: string; email: string; name?: string; uid: string };
  };

  const batch = db.batch();
  const secretRef = db.doc(`workspaces/${workspaceId}/integrationSecrets/vercel`);
  batch.set(secretRef, {
    provider: 'vercel',
    apiToken: apiToken.trim(),
    teamId: teamId ? String(teamId).trim() : null,
    updatedBy: request.auth!.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const integrationRef = db.doc(`workspaces/${workspaceId}/integrations/vercel`);
  batch.set(integrationRef, {
    id: 'vercel',
    provider: 'vercel',
    status: 'connected',
    accountName: userJson.user.username || userJson.user.email,
    teamId: teamId ? String(teamId).trim() : null,
    connectedBy: request.auth!.uid,
    connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const activityRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
  batch.set(activityRef, {
    type: 'vercel_connected',
    title: `Vercel account @${userJson.user.username} connected`,
    actorId: request.auth!.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    status: 'connected',
    accountName: userJson.user.username,
  };
});

/**
 * List accessible Vercel projects and optionally synchronize deployment history.
 */
export const syncVercelProjectsAndDeployments = onCall(async (request) => {
  const { workspaceId, projectId } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin', 'developer']);

  const secretSnap = await db.doc(`workspaces/${workspaceId}/integrationSecrets/vercel`).get();
  if (!secretSnap.exists || !secretSnap.data()?.apiToken) {
    throw new HttpsError('failed-precondition', 'Vercel integration is not connected.');
  }

  const { apiToken, teamId } = secretSnap.data() as { apiToken: string; teamId?: string };
  const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';

  const projectsRes = await fetch(`https://api.vercel.com/v9/projects${teamQuery}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (projectsRes.status === 429) {
    throw new HttpsError('resource-exhausted', 'Vercel API rate limit exceeded. Try again shortly.');
  }
  if (!projectsRes.ok) {
    throw new HttpsError('unavailable', 'Failed to fetch projects from Vercel API.');
  }

  const projectsJson = (await projectsRes.json()) as { projects: Array<Record<string, any>> };

  // If a specific DeployHQ project is linked to a Vercel project, import its recent deployments
  if (projectId) {
    const projectSnap = await db.doc(`workspaces/${workspaceId}/projects/${projectId}`).get();
    const vercelProjectId = projectSnap.data()?.vercelProjectId;
    if (vercelProjectId) {
      const depQuery = teamId
        ? `?projectId=${encodeURIComponent(vercelProjectId)}&limit=15&teamId=${encodeURIComponent(teamId)}`
        : `?projectId=${encodeURIComponent(vercelProjectId)}&limit=15`;
      const depRes = await fetch(`https://api.vercel.com/v6/deployments${depQuery}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });

      if (depRes.ok) {
        const depData = (await depRes.json()) as { deployments: Array<Record<string, any>> };
        const batch = db.batch();
        for (const d of depData.deployments || []) {
          const statusMap: Record<string, string> = {
            READY: 'ready',
            BUILDING: 'building',
            ERROR: 'failed',
            QUEUED: 'queued',
            CANCELED: 'cancelled',
          };
          const depRef = db.doc(`workspaces/${workspaceId}/deployments/${d.uid}`);
          const durationSec =
            d.buildingAt && d.ready ? Math.max(1, Math.round((d.ready - d.buildingAt) / 1000)) : 42;
          batch.set(
            depRef,
            {
              id: d.uid,
              providerDeploymentId: d.uid,
              projectId,
              projectName: projectSnap.data()?.name || d.name,
              branch: d.meta?.githubCommitRef || 'main',
              commitHash: (d.meta?.githubCommitSha || d.uid).slice(0, 7),
              commitMessage: d.meta?.githubCommitMessage || 'Imported from Vercel',
              environment: d.target === 'production' ? 'production' : 'preview',
              status: statusMap[d.state] || 'ready',
              durationSeconds: durationSec,
              triggeredBy: d.creator?.username || 'vercel',
              triggerSource: 'vercel_sync',
              url: d.url ? `https://${d.url}` : '',
              createdAt: d.created
                ? admin.firestore.Timestamp.fromMillis(d.created)
                : admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        await batch.commit();
      }
    }
  }

  return {
    vercelProjects: (projectsJson.projects || []).map((p) => ({
      id: p.id,
      name: p.name,
      framework: p.framework || 'other',
      updatedAt: p.updatedAt,
    })),
  };
});

/**
 * Trigger or Redeploy a deployment on Vercel via Cloud Functions.
 */
export const triggerProviderDeployment = onCall(async (request) => {
  const { workspaceId, projectId, branch, environment, redeployFromId } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin', 'developer']);

  const projectSnap = await db.doc(`workspaces/${workspaceId}/projects/${projectId}`).get();
  if (!projectSnap.exists) {
    throw new HttpsError('not-found', 'Project not found.');
  }
  const project = projectSnap.data()!;

  const secretSnap = await db.doc(`workspaces/${workspaceId}/integrationSecrets/vercel`).get();
  if (!secretSnap.exists || !secretSnap.data()?.apiToken) {
    throw new HttpsError(
      'failed-precondition',
      'Vercel provider is not connected. Connect your Vercel API token in Integrations before triggering live provider deployments.'
    );
  }

  const { apiToken, teamId } = secretSnap.data() as { apiToken: string; teamId?: string };
  const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';

  const bodyPayload: Record<string, any> = {
    name: project.vercelProjectName || project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    target: environment === 'production' ? 'production' : undefined,
  };

  if (redeployFromId) {
    bodyPayload.deploymentId = redeployFromId;
  } else if (project.githubRepoId && project.repository) {
    bodyPayload.gitSource = {
      type: 'github',
      repoId: project.githubRepoId,
      ref: branch || project.defaultBranch || 'main',
    };
  }

  const vercelRes = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!vercelRes.ok) {
    const errBody = await vercelRes.text();
    throw new HttpsError('aborted', `Vercel API deployment error: ${errBody}`);
  }

  const vercelDep = (await vercelRes.json()) as Record<string, any>;
  const depRef = db.collection(`workspaces/${workspaceId}/deployments`).doc(vercelDep.id);

  await depRef.set({
    id: vercelDep.id,
    providerDeploymentId: vercelDep.id,
    projectId,
    projectName: project.name,
    branch: branch || project.defaultBranch || 'main',
    commitHash: (vercelDep.meta?.githubCommitSha || vercelDep.id).slice(0, 7),
    commitMessage: redeployFromId
      ? `Redeploy of ${redeployFromId}`
      : vercelDep.meta?.githubCommitMessage || 'Triggered via DeployHQ',
    environment: environment || 'production',
    status: 'building',
    durationSeconds: 0,
    triggeredBy: request.auth!.token.email || request.auth!.uid,
    triggerSource: redeployFromId ? 'redeploy' : 'manual',
    url: vercelDep.url ? `https://${vercelDep.url}` : `https://${project.productionDomain}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { deploymentId: depRef.id, status: 'building', url: vercelDep.url };
});

/**
 * Cancel an active Vercel deployment.
 */
export const cancelProviderDeployment = onCall(async (request) => {
  const { workspaceId, deploymentId } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin', 'developer']);

  const depRef = db.doc(`workspaces/${workspaceId}/deployments/${deploymentId}`);
  const depSnap = await depRef.get();
  if (!depSnap.exists) {
    throw new HttpsError('not-found', 'Deployment not found.');
  }

  const providerDepId = depSnap.data()?.providerDeploymentId;
  const secretSnap = await db.doc(`workspaces/${workspaceId}/integrationSecrets/vercel`).get();

  if (providerDepId && secretSnap.exists && secretSnap.data()?.apiToken) {
    const { apiToken, teamId } = secretSnap.data() as { apiToken: string; teamId?: string };
    const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
    const cancelRes = await fetch(
      `https://api.vercel.com/v12/deployments/${encodeURIComponent(providerDepId)}/cancel${teamQuery}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );
    if (!cancelRes.ok) {
      throw new HttpsError('aborted', 'Failed to cancel deployment on Vercel provider.');
    }
  } else {
    throw new HttpsError(
      'failed-precondition',
      'Cannot cancel deployment without an active Vercel provider connection.'
    );
  }

  await depRef.update({
    status: 'cancelled',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { deploymentId, status: 'cancelled' };
});

/**
 * Vercel Webhook processor with signature check.
 */
export const vercelWebhook = onRequest(
  { secrets: [vercelWebhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const signature = req.headers['x-vercel-signature'] as string | undefined;
    const secret = vercelWebhookSecret.value() || process.env.VERCEL_WEBHOOK_SECRET;

    if (!secret || !signature) {
      res.status(401).json({ error: 'Missing Vercel webhook signature' });
      return;
    }

    const digest = crypto.createHmac('sha1', secret).update(req.rawBody).digest('hex');
    if (signature !== digest) {
      res.status(401).json({ error: 'Invalid Vercel webhook signature' });
      return;
    }

    const eventId = req.body?.id;
    if (eventId) {
      const dedupRef = db.doc(`webhookDeliveries/vercel_${eventId}`);
      if ((await dedupRef.get()).exists) {
        res.status(200).json({ status: 'duplicate_ignored' });
        return;
      }
      await dedupRef.set({
        provider: 'vercel',
        eventId,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ status: 'processed' });
  }
);

/**
 * Scheduled reconciliation for active building deployments on Vercel.
 */
export const reconcileVercelDeployments = onSchedule('every 5 minutes', async () => {
  const buildingSnap = await db
    .collectionGroup('deployments')
    .where('status', 'in', ['building', 'queued'])
    .limit(30)
    .get();

  for (const depDoc of buildingSnap.docs) {
    const dep = depDoc.data();
    const workspaceRef = depDoc.ref.parent.parent;
    if (!workspaceRef || !dep.providerDeploymentId) continue;

    const secretSnap = await db.doc(`workspaces/${workspaceRef.id}/integrationSecrets/vercel`).get();
    if (!secretSnap.exists || !secretSnap.data()?.apiToken) continue;

    const { apiToken, teamId } = secretSnap.data() as { apiToken: string; teamId?: string };
    const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';

    try {
      const res = await fetch(
        `https://api.vercel.com/v13/deployments/${encodeURIComponent(dep.providerDeploymentId)}${teamQuery}`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      );
      if (!res.ok) continue;
      const d = (await res.json()) as Record<string, any>;
      const statusMap: Record<string, string> = {
        READY: 'ready',
        BUILDING: 'building',
        ERROR: 'failed',
        QUEUED: 'queued',
        CANCELED: 'cancelled',
      };
      const nextStatus = statusMap[d.readyState || d.state] || dep.status;
      if (nextStatus !== dep.status) {
        await depDoc.ref.update({
          status: nextStatus,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch {
      // Ignore transient network errors during background reconciliation
    }
  }
});

