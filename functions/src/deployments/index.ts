import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db, verifyWorkspaceRole } from '../auth/permissions';

/**
 * Securely creates or updates an environment variable.
 * Stores the raw value ONLY in `environmentSecrets/{envVarId}` (blocked from client reads in Firestore rules)
 * and stores only a masked preview in `environments/{envVarId}`.
 */
export const upsertEnvironmentVariable = onCall(async (request) => {
  const { workspaceId, projectId, environment, key, value, isSensitive = true, envVarId } =
    request.data || {};

  await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin', 'developer']);

  if (!projectId || !environment || !key || typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'projectId, environment, key, and value are required.'
    );
  }

  const sanitizedKey = String(key).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const maskedPreview = isSensitive
    ? value.length > 6
      ? `${value.slice(0, 2)}${'•'.repeat(8)}${value.slice(-2)}`
      : '••••••••••••'
    : value;

  const targetId = envVarId || db.collection(`workspaces/${workspaceId}/environments`).doc().id;
  const publicRef = db.doc(`workspaces/${workspaceId}/environments/${targetId}`);
  const secretRef = db.doc(`workspaces/${workspaceId}/environmentSecrets/${targetId}`);

  const batch = db.batch();
  batch.set(
    publicRef,
    {
      id: targetId,
      projectId,
      environment,
      key: sanitizedKey,
      maskedValue: maskedPreview,
      isSensitive: Boolean(isSensitive),
      updatedBy: request.auth!.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(secretRef, {
    id: targetId,
    projectId,
    environment,
    key: sanitizedKey,
    rawValue: value,
    updatedBy: request.auth!.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const activityRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
  batch.set(activityRef, {
    type: 'env_updated',
    title: `Environment variable ${sanitizedKey} configured (${environment})`,
    projectId,
    actorId: request.auth!.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: targetId,
    key: sanitizedKey,
    environment,
    maskedValue: maskedPreview,
  };
});

/**
 * Deletes an environment variable from both metadata and server-side secret storage.
 */
export const deleteEnvironmentVariable = onCall(async (request) => {
  const { workspaceId, envVarId } = request.data || {};
  await verifyWorkspaceRole(workspaceId, request.auth?.uid, ['owner', 'admin', 'developer']);

  if (!envVarId) {
    throw new HttpsError('invalid-argument', 'envVarId is required.');
  }

  const batch = db.batch();
  batch.delete(db.doc(`workspaces/${workspaceId}/environments/${envVarId}`));
  batch.delete(db.doc(`workspaces/${workspaceId}/environmentSecrets/${envVarId}`));
  await batch.commit();

  return { deleted: true, id: envVarId };
});

