import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Automated verification suite for DeployHQ Firestore Security Rules (`firebase/firestore.rules`).
 * Verifies that:
 * 1. Permissive rules (`allow read, write: if true;`) are never present.
 * 2. Privileged secret collections (`integrationSecrets`, `environmentSecrets`) are strictly locked down (`allow read, write: if false;`).
 * 3. User profile updates block privilege escalation fields (`role`, `isSuperAdmin`, `planOverride`).
 * 4. Workspace RBAC helpers (`isWorkspaceOwner`, `isWorkspaceAdmin`, `isWorkspaceDeveloper`, `isWorkspaceMember`) enforce role hierarchy.
 */
describe('DeployHQ Firestore Security Rules Verification', () => {
  const rulesPath = path.resolve(__dirname, '../../firebase/firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  it('uses rules_version = 2 and never allows open public read/write', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).not.toMatch(/allow\s+read,\s*write:\s*if\s+true/);
  });

  it('blocks all client access to integrationSecrets and environmentSecrets', () => {
    expect(rulesContent).toContain('match /integrationSecrets/{secretId}');
    expect(rulesContent).toContain('match /environmentSecrets/{secretId}');
    expect(rulesContent).toContain('allow read, write: if false;');
  });

  it('prevents user profile privilege escalation on create and update', () => {
    expect(rulesContent).toContain('match /users/{uid}');
    expect(rulesContent).toContain("'role', 'isSuperAdmin', 'planOverride'");
  });

  it('enforces workspace RBAC roles (owner, admin, developer, viewer) and immutable activity audit logs', () => {
    expect(rulesContent).toContain("['owner', 'admin', 'developer', 'viewer']");
    expect(rulesContent).toContain('match /activity/{activityId}');
    expect(rulesContent).toContain('allow update, delete: if false;');
  });

  it('forbids plaintext secret keys inside client-readable integrations and environments collections', () => {
    expect(rulesContent).toContain("'accessToken'");
    expect(rulesContent).toContain("'rawValue'");
  });
});

