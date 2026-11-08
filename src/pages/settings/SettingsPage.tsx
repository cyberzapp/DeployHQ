import React, { useState } from 'react';
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { updateWorkspaceDetails } from '@/services/firebase/firestoreService';

export const SettingsPage: React.FC = () => {
  const { user, updateUserProfileData, sendPasswordReset } = useAuth();
  const { activeWorkspace, canAdmin, showToast } = useWorkspace();

  const [tab, setTab] = useState<'profile' | 'workspace' | 'notifications' | 'appearance' | 'security'>('profile');

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [title, setTitle] = useState(user?.title || '');
  const [company, setCompany] = useState(user?.company || '');

  // Workspace state
  const [wsName, setWsName] = useState(activeWorkspace.name);
  const [wsSlug, setWsSlug] = useState(activeWorkspace.slug);
  const [wsDesc, setWsDesc] = useState(activeWorkspace.description || '');

  // Notification preferences
  const [emailAlerts, setEmailAlerts] = useState(user?.preferences?.emailAlerts ?? true);
  const [pushAlerts, setPushAlerts] = useState(user?.preferences?.pushAlerts ?? true);
  const [deployNotifs, setDeployNotifs] = useState(
    user?.preferences?.deploymentNotifications ?? true
  );

  const currentTheme = user?.preferences?.theme || 'dark';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfileData({ displayName, title, company });
    showToast('Profile settings updated', 'success');
  };

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdmin) return;
    await updateWorkspaceDetails(activeWorkspace.id, {
      name: wsName,
      slug: wsSlug,
      description: wsDesc,
    });
    showToast('Workspace settings saved', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">Settings</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Manage your developer profile, workspace configuration, notification preferences, and UI
          theme.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto text-xs">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'workspace', label: 'Workspace', icon: Building2 },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'security', label: 'Security', icon: Shield },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-medium border-b-2 transition-colors ${
                tab === item.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-card border border-border rounded-xl p-5 max-w-xl space-y-4 text-xs"
        >
          <h2 className="text-sm font-semibold text-text-primary">Developer Profile</h2>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-muted font-mono"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Role / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
          >
            Save Profile Changes
          </button>
        </form>
      )}

      {tab === 'workspace' && (
        <form
          onSubmit={handleSaveWorkspace}
          className="bg-card border border-border rounded-xl p-5 max-w-xl space-y-4 text-xs"
        >
          <h2 className="text-sm font-semibold text-text-primary">Workspace General Settings</h2>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Workspace Name</label>
            <input
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Workspace Slug</label>
            <input
              type="text"
              value={wsSlug}
              onChange={(e) => setWsSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Description</label>
            <textarea
              rows={3}
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!canAdmin}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium"
          >
            Update Workspace
          </button>
        </form>
      )}

      {tab === 'notifications' && (
        <div className="bg-card border border-border rounded-xl p-5 max-w-xl space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-text-primary">Notification Preferences</h2>
          <label className="flex items-center justify-between p-3 rounded-lg bg-main border border-border cursor-pointer">
            <div>
              <div className="font-medium text-text-primary">Deployment Status Notifications</div>
              <div className="text-text-secondary">
                Notify when production builds succeed or fail
              </div>
            </div>
            <input
              type="checkbox"
              checked={deployNotifs}
              onChange={(e) => setDeployNotifs(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-main border border-border cursor-pointer">
            <div>
              <div className="font-medium text-text-primary">Email Incident Digests</div>
              <div className="text-text-secondary">
                Send critical downtime and error rate alerts via email
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-main border border-border cursor-pointer">
            <div>
              <div className="font-medium text-text-primary">
                Browser Push Notifications (Firebase Cloud Messaging)
              </div>
              <div className="text-text-secondary">
                Receive instant desktop push alerts when services go down
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={(e) => setPushAlerts(e.target.checked)}
            />
          </label>
          <button
            type="button"
            onClick={async () => {
              await updateUserProfileData({
                preferences: {
                  ...user?.preferences,
                  emailAlerts,
                  pushAlerts,
                  deploymentNotifications: deployNotifs,
                },
              });
              showToast('Notification preferences saved', 'success');
            }}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
          >
            Save Preferences
          </button>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="bg-card border border-border rounded-xl p-5 max-w-xl space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-text-primary">Appearance & Color Scheme</h2>
          <p className="text-text-secondary">
            Select your preferred interface color scheme. Native scrollbars and form controls adapt
            automatically via CSS <code className="font-mono">color-scheme</code>.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon },
              { id: 'light', label: 'Light Mode', icon: Sun },
              { id: 'system', label: 'System Preference', icon: Monitor },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={async () => {
                    await updateUserProfileData({
                      preferences: {
                        ...user?.preferences,
                        theme: opt.id as 'dark' | 'light' | 'system',
                      },
                    });
                    showToast(`Appearance set to ${opt.label}`, 'success');
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 font-medium ${
                    currentTheme === opt.id
                      ? 'bg-primary/15 border-primary text-primary'
                      : 'bg-main border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-card border border-border rounded-xl p-5 max-w-xl space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-text-primary">
            Authentication & Session Security
          </h2>
          <div className="p-3.5 rounded-lg bg-main border border-border flex items-center justify-between">
            <div>
              <div className="font-medium text-text-primary">Password Reset</div>
              <div className="text-text-secondary">
                Send a password reset link to {user?.email}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (user?.email) {
                  await sendPasswordReset(user.email);
                  showToast(`Password reset email dispatched to ${user.email}`, 'success');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-border border border-border text-text-primary font-medium"
            >
              Send Reset Email
            </button>
          </div>
          <div className="p-3.5 rounded-lg bg-main border border-border flex items-center justify-between">
            <div>
              <div className="font-medium text-text-primary">Active Firebase Auth Session</div>
              <div className="text-text-secondary font-mono text-[11px]">
                UID: {user?.uid} • App Check Protected
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-status-success/15 text-status-success font-mono text-[10px]">
              VERIFIED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

