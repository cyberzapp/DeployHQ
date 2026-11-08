import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  inviteWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from '@/services/firebase/firestoreService';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { WorkspaceRole } from '@/types';

const ROLE_DESCRIPTIONS: Record<WorkspaceRole, { label: string; perms: string[] }> = {
  owner: {
    label: 'Owner',
    perms: ['Full access', 'Billing management', 'Workspace deletion', 'Member & owner management'],
  },
  admin: {
    label: 'Admin',
    perms: [
      'Project management',
      'Integration management',
      'Deployment management',
      'Member management (Developer & Viewer)',
    ],
  },
  developer: {
    label: 'Developer',
    perms: [
      'View projects & metrics',
      'Trigger deployments & rollbacks',
      'Inspect logs & resolve errors',
      'Manage project settings & env vars',
    ],
  },
  viewer: {
    label: 'Viewer',
    perms: ['Read-only workspace access', 'View deployments & logs', 'View monitoring & analytics'],
  },
};

export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const {
    activeWorkspace,
    members,
    currentRole,
    canAdmin,
    isOwner,
    showToast,
  } = useWorkspace();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('developer');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdmin) return;
    await inviteWorkspaceMember(activeWorkspace.id, {
      email: inviteEmail,
      displayName: inviteName,
      role: inviteRole,
      invitedBy: user?.displayName || 'Workspace Admin',
    });
    setInviteEmail('');
    setInviteName('');
    setInviteOpen(false);
    showToast(`Invitation sent to ${inviteEmail} (${inviteRole})`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Team Members & Access Control
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Enforce workspace RBAC permissions server-side across projects, secrets, and billing.
          </p>
        </div>
        <button
          type="button"
          disabled={!canAdmin}
          onClick={() => setInviteOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Team Member
        </button>
      </div>

      {/* Role Permissions Matrix */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        {(Object.keys(ROLE_DESCRIPTIONS) as WorkspaceRole[]).map((r) => {
          const info = ROLE_DESCRIPTIONS[r];
          const isCurrent = currentRole === r;
          return (
            <div
              key={r}
              className={`p-4 rounded-xl border space-y-2.5 ${
                isCurrent ? 'bg-primary/10 border-primary/40' : 'bg-card border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-text-primary flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  {info.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-white font-medium">
                    Your Role
                  </span>
                )}
              </div>
              <ul className="space-y-1 text-text-secondary">
                {info.perms.map((p) => (
                  <li key={p} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Members Directory Table */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Workspace team members table"
        className="bg-card border border-border rounded-xl table-wrapper text-xs"
      >
        <table className="text-left text-xs">
          <thead className="bg-elevated text-text-secondary border-b border-border">
            <tr>
              <th className="py-3 px-4 font-medium">Member</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Joined</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => {
              const canModifyMember =
                isOwner || (canAdmin && m.role !== 'owner' && m.uid !== user?.uid);
              return (
                <tr key={m.uid} className="hover:bg-elevated/50">
                  <th className="py-3 px-4 font-medium text-text-primary">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-semibold">
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span>{m.displayName}</span>
                    </div>
                  </th>
                  <td className="py-3 px-4 font-mono text-text-secondary">{m.email}</td>
                  <td className="py-3 px-4">
                    {canModifyMember ? (
                      <select
                        aria-label={`Change role for ${m.displayName}`}
                        value={m.role}
                        onChange={async (e) => {
                          const nextRole = e.target.value as WorkspaceRole;
                          await updateWorkspaceMemberRole(activeWorkspace.id, m.uid, nextRole);
                          showToast(`Updated ${m.displayName} role to ${nextRole}`, 'success');
                        }}
                        className="px-2.5 py-1 rounded bg-main border border-border text-text-primary capitalize"
                      >
                        {isOwner && <option value="owner">Owner</option>}
                        <option value="admin">Admin</option>
                        <option value="developer">Developer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-main border border-border capitalize text-text-secondary">
                        {m.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                        m.status === 'active'
                          ? 'bg-status-success/15 text-status-success'
                          : 'bg-status-warning/15 text-status-warning'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-muted">
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Today'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canModifyMember && m.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await removeWorkspaceMember(activeWorkspace.id, m.uid);
                          showToast(`Removed ${m.displayName} from workspace`, 'info');
                        }}
                        title="Remove member"
                        className="p-1.5 rounded bg-status-error/15 text-status-error border border-status-error/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      <ModalDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Team Member"
        description="Assign an RBAC role enforced by Firestore Security Rules and Cloud Functions."
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Full Name *</label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Jordan Lee"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Work Email *</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="jordan.lee@company.dev"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Workspace Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            >
              {isOwner && <option value="admin">Admin — Manage projects, integrations, team</option>}
              <option value="developer">Developer — Deploy, view logs, edit project settings</option>
              <option value="viewer">Viewer — Read-only access to dashboards and metrics</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-elevated text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

