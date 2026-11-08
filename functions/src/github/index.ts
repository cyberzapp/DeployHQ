import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { db, verifyWorkspaceRole } from '../auth/permissions';

const githubClientId = defineSecret('GITHUB_CLIENT_ID');
const githubClientSecret = defineSecret('GITHUB_CLIENT_SECRET');
const githubWebhookSecret = defineSecret('GITHUB_WEBHOOK_SECRET');

/**
 * Exchange GitHub OAuth code or Personal Access Token for verified GitHub connection.
 * Stores raw token strictly in `integrationSecrets/github` (inaccessible to clients).
 */
export const connectGitHubIntegration = onCall(
  { secrets: [githubClientId, githubClientSecret] },
  async (request) => {
    const { workspaceId, code, accessToken: directToken } = request.data || {};
    await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin']);

    let token = directToken as string | undefined;

    if (code && !token) {
      const clientId = githubClientId.value() || process.env.GITHUB_CLIENT_ID;
      const clientSecret = githubClientSecret.value() || process.env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new HttpsError(
          'failed-precondition',
          'GitHub OAuth client credentials are not configured in Cloud Secret Manager.'
        );
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });
      const tokenJson = (await tokenRes.json()) as { access_token?: string; error_description?: string };
      if (!tokenJson.access_token) {
        throw new HttpsError('unauthenticated', tokenJson.error_description || 'Failed to exchange GitHub OAuth code.');
      }
      token = tokenJson.access_token;
    }

    if (!token) {
      throw new HttpsError('invalid-argument', 'Either OAuth code or access token is required.');
    }

    // Verify token against GitHub API
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DeployHQ-Platform',
      },
    });

    if (!userRes.ok) {
      throw new HttpsError('unauthenticated', 'GitHub token verification failed.');
    }

    const ghUser = (await userRes.json()) as {
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
      name?: string;
    };

    const batch = db.batch();
    const secretRef = db.doc(`workspaces/${workspaceId}/integrationSecrets/github`);
    batch.set(secretRef, {
      provider: 'github',
      accessToken: token,
      updatedBy: request.auth!.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const publicIntegrationRef = db.doc(`workspaces/${workspaceId}/integrations/github`);
    batch.set(publicIntegrationRef, {
      id: 'github',
      provider: 'github',
      status: 'connected',
      accountName: ghUser.login,
      accountAvatar: ghUser.avatar_url,
      accountUrl: ghUser.html_url,
      connectedBy: request.auth!.uid,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const activityRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
    batch.set(activityRef, {
      type: 'github_connected',
      title: `GitHub account @${ghUser.login} connected`,
      actorId: request.auth!.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      status: 'connected',
      accountName: ghUser.login,
      accountAvatar: ghUser.avatar_url,
    };
  }
);

/**
 * List accessible repositories using stored server-side GitHub token.
 */
export const listGitHubRepositories = onCall(async (request) => {
  const { workspaceId } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, [
    'owner',
    'admin',
    'developer',
    'viewer',
  ]);

  const secretSnap = await db.doc(`workspaces/${workspaceId}/integrationSecrets/github`).get();
  if (!secretSnap.exists || !secretSnap.data()?.accessToken) {
    throw new HttpsError('failed-precondition', 'GitHub integration is not connected.');
  }

  const token = secretSnap.data()!.accessToken as string;
  const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'DeployHQ-Platform',
    },
  });

  if (!res.ok) {
    throw new HttpsError('unavailable', 'Unable to fetch repositories from GitHub.');
  }

  const repos = (await res.json()) as Array<Record<string, any>>;
  return {
    repositories: repos.map((r) => ({
      id: String(r.id),
      name: r.name,
      fullName: r.full_name,
      private: Boolean(r.private),
      defaultBranch: r.default_branch || 'main',
      url: r.html_url,
      updatedAt: r.updated_at,
      language: r.language,
    })),
  };
});

/**
 * List branches and latest commits for a connected repository.
 */
export const getGitHubRepoDetails = onCall(async (request) => {
  const { workspaceId, repoFullName } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, [
    'owner',
    'admin',
    'developer',
    'viewer',
  ]);

  if (!repoFullName || !repoFullName.includes('/')) {
    throw new HttpsError('invalid-argument', 'Valid repoFullName (owner/repo) is required.');
  }

  const secretSnap = await db.doc(`workspaces/${workspaceId}/integrationSecrets/github`).get();
  if (!secretSnap.exists || !secretSnap.data()?.accessToken) {
    throw new HttpsError('failed-precondition', 'GitHub integration is not connected.');
  }

  const token = secretSnap.data()!.accessToken as string;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'DeployHQ-Platform',
  };

  const [branchesRes, commitsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${repoFullName}/branches?per_page=30`, { headers }),
    fetch(`https://api.github.com/repos/${repoFullName}/commits?per_page=15`, { headers }),
  ]);

  if (!branchesRes.ok || !commitsRes.ok) {
    throw new HttpsError('unavailable', 'Failed to fetch branches or commits from GitHub.');
  }

  const branches = (await branchesRes.json()) as Array<Record<string, any>>;
  const commits = (await commitsRes.json()) as Array<Record<string, any>>;

  return {
    branches: branches.map((b) => ({
      name: b.name,
      sha: b.commit?.sha,
      protected: Boolean(b.protected),
    })),
    commits: commits.map((c) => ({
      sha: c.sha,
      message: c.commit?.message || '',
      author: c.commit?.author?.name || c.author?.login || 'Unknown',
      date: c.commit?.author?.date,
      url: c.html_url,
    })),
  };
});

/**
 * GitHub Webhook processor with HMAC SHA-256 signature verification and idempotency check.
 */
export const githubWebhook = onRequest(
  { secrets: [githubWebhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const deliveryId = req.headers['x-github-delivery'] as string | undefined;
    const eventType = req.headers['x-github-event'] as string | undefined;
    const secret = githubWebhookSecret.value() || process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret || !signature || !deliveryId) {
      res.status(401).json({ error: 'Missing webhook signature or delivery ID' });
      return;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    const sigBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);
    if (
      sigBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, digestBuffer)
    ) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    // Deduplicate webhook delivery ID
    const deliveryRef = db.doc(`webhookDeliveries/github_${deliveryId}`);
    const existingDelivery = await deliveryRef.get();
    if (existingDelivery.exists) {
      res.status(200).json({ status: 'duplicate_ignored' });
      return;
    }

    await deliveryRef.set({
      provider: 'github',
      deliveryId,
      eventType: eventType || 'unknown',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const payload = req.body;
    const repoFullName = payload?.repository?.full_name;

    if (eventType === 'push' && repoFullName) {
      const ref = (payload.ref as string) || '';
      const branch = ref.replace('refs/heads/', '');
      const commitSha = (payload.after as string)?.slice(0, 7) || 'HEAD';
      const commitMessage = payload.head_commit?.message || 'Push event from GitHub';
      const pusher = payload.pusher?.name || 'github-webhook';

      const projectsSnap = await db
        .collectionGroup('projects')
        .where('repository', '==', repoFullName)
        .get();

      for (const projectDoc of projectsSnap.docs) {
        const project = projectDoc.data();
        const workspaceRef = projectDoc.ref.parent.parent;
        if (!workspaceRef) continue;

        const workspaceId = workspaceRef.id;
        await db.collection(`workspaces/${workspaceId}/activity`).add({
          type: 'git_push',
          title: `Push to ${repoFullName}@${branch} (${commitSha})`,
          projectId: projectDoc.id,
          projectName: project.name,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Auto-deploy if branch matches defaultBranch
        if (project.autoDeploy !== false && (!project.defaultBranch || project.defaultBranch === branch)) {
          const deploymentRef = db.collection(`workspaces/${workspaceId}/deployments`).doc();
          await deploymentRef.set({
            id: deploymentRef.id,
            projectId: projectDoc.id,
            projectName: project.name,
            branch,
            commitHash: commitSha,
            commitMessage,
            environment: branch === (project.defaultBranch || 'main') ? 'production' : 'preview',
            status: 'queued',
            durationSeconds: 0,
            triggeredBy: pusher,
            triggerSource: 'github_webhook',
            url: project.productionDomain ? `https://${project.productionDomain}` : '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    res.status(200).json({ status: 'processed', deliveryId });
  }
);

