import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const messaging = admin.messaging();

export type WorkspaceRole = 'owner' | 'admin' | 'developer' | 'viewer';

export async function verifyWorkspaceRole(
  workspaceId: string,
  uid: string | undefined,
  allowedRoles: WorkspaceRole[]
): Promise<{ role: WorkspaceRole }> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
  if (!workspaceId) {
    throw new HttpsError('invalid-argument', 'workspaceId is required.');
  }

  const memberSnap = await db
    .doc(`workspaces/${workspaceId}/members/${uid}`)
    .get();

  if (!memberSnap.exists) {
    throw new HttpsError(
      'permission-denied',
      'You are not a member of this workspace.'
    );
  }

  const role = memberSnap.data()?.role as WorkspaceRole;
  if (!allowedRoles.includes(role)) {
    throw new HttpsError(
      'permission-denied',
      `Insufficient permissions. Required one of: ${allowedRoles.join(', ')}`
    );
  }

  return { role };
}

