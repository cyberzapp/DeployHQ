import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  Plus,
  Trash2,
  CheckCheck,
  Mail,
  Smartphone,
  Inbox,
  Send,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  createAlertRule,
  toggleAlertRule,
  deleteAlertRule,
  markNotificationRead,
  markAllNotificationsRead,
  dispatchTestAlertNotification,
} from '@/services/firebase/firestoreService';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { AlertConditionType } from '@/types';

const CONDITION_LABELS: Record<AlertConditionType, string> = {
  deployment_failed: 'Deployment Failed',
  production_deployment_completed: 'Production Deployment Completed',
  website_unavailable: 'Website Unavailable',
  response_time_exceeds: 'Response Time Exceeds Threshold (ms)',
  error_rate_exceeds: 'Error Rate Exceeds Threshold (%)',
  monitor_down: 'Monitoring Service Goes Down',
  monitor_recovered: 'Monitoring Service Recovers',
};

export const AlertsPage: React.FC = () => {
  const {
    activeWorkspace,
    projects,
    alerts,
    notifications,
    canWrite,
    showToast,
  } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [condition, setCondition] = useState<AlertConditionType>('deployment_failed');
  const [threshold, setThreshold] = useState(500);
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [inAppChannel, setInAppChannel] = useState(true);
  const [emailChannel, setEmailChannel] = useState(true);
  const [pushChannel, setPushChannel] = useState(true);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const channels: string[] = [];
    if (inAppChannel) channels.push('in_app');
    if (emailChannel) channels.push('email');
    if (pushChannel) channels.push('push');

    await createAlertRule(activeWorkspace.id, {
      name: name.trim(),
      projectId: projectId || undefined,
      type: condition.includes('monitor') || condition.includes('response') ? 'uptime' : 'deployment',
      condition,
      threshold: Number(threshold),
      channel: channels.length > 1 ? 'all' : ((channels[0] as any) || 'in_app'),
      channels,
      severity,
      enabled: true,
    });
    setName('');
    setCreateOpen(false);
    showToast('Alert rule created and armed', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Alerts & Notification Rules
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure real-time triggers for failed builds, downtime incidents, latency thresholds,
            and error spikes.
          </p>
        </div>
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => setCreateOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Alert Rule
        </button>
      </div>

      {/* Delivery Channels Status */}
      <div className="grid sm:grid-cols-3 gap-3.5 text-xs">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-text-primary">In-App Notification Center</div>
            <div className="text-text-secondary">Real-time Firestore listener stream</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-text-primary">Browser Push (Firebase FCM)</div>
            <div className="text-text-secondary">Dispatched on verified delivery</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-status-info/15 border border-status-info/30 flex items-center justify-center text-status-info">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-text-primary">Transactional Email Alerts</div>
            <div className="text-text-secondary">Routed to workspace member emails</div>
          </div>
        </div>
      </div>

      {/* Alert Rules Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden text-xs">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Configured Alert Rules</h2>
        </div>

        {alerts.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Bell className="w-8 h-8 text-text-muted mx-auto" />
            <div className="font-semibold text-text-primary">No alert rules configured</div>
            <p className="text-text-secondary">
              Create your first alert rule to receive notifications when deployments fail or latency
              exceeds thresholds.
            </p>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Configured alert rules table"
            className="table-wrapper"
          >
            <table className="text-left text-xs">
              <thead className="bg-elevated text-text-secondary border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-medium">Alert Name</th>
                  <th className="py-3 px-4 font-medium">Condition</th>
                  <th className="py-3 px-4 font-medium">Threshold</th>
                  <th className="py-3 px-4 font-medium">Channels</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.map((rule) => (
                  <tr key={rule.id} className="hover:bg-elevated/50">
                    <th className="py-3 px-4 font-medium text-text-primary">{rule.name}</th>
                    <td className="py-3 px-4 text-text-secondary">
                      {CONDITION_LABELS[rule.condition] || rule.condition}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-primary">
                      {rule.condition === 'response_time_exceeds'
                        ? `> ${rule.threshold}ms`
                        : rule.condition === 'error_rate_exceeds'
                        ? `> ${rule.threshold}%`
                        : 'Immediate'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {(rule.channels || ['in_app']).map((ch) => (
                          <span
                            key={ch}
                            className="px-2 py-0.5 rounded bg-main border border-border font-mono text-[10px] uppercase text-text-secondary"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          rule.enabled
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-elevated text-text-muted'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                await dispatchTestAlertNotification(
                                  activeWorkspace.id,
                                  rule.name,
                                  CONDITION_LABELS[rule.condition] || rule.condition,
                                  rule.severity || 'warning'
                                );
                                showToast(`Dispatched test alert for "${rule.name}"`, 'success');
                              }}
                              className="px-2 py-1 rounded bg-main hover:bg-elevated border border-border text-text-secondary hover:text-primary flex items-center gap-1 transition-colors"
                              title="Test trigger this alert rule"
                            >
                              <Send className="w-3 h-3 text-primary" />
                              <span>Test</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await toggleAlertRule(activeWorkspace.id, rule.id, !rule.enabled);
                                showToast(
                                  rule.enabled ? 'Alert rule disabled' : 'Alert rule enabled',
                                  'info'
                                );
                              }}
                              className="px-2.5 py-1 rounded bg-main hover:bg-border border border-border text-text-secondary"
                            >
                              {rule.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteAlertRule(activeWorkspace.id, rule.id);
                                showToast('Alert rule deleted', 'info');
                              }}
                              className="p-1.5 rounded bg-status-error/15 text-status-error border border-status-error/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert History & Notification Feed */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Alert History & Feed</h2>
            <p className="text-text-secondary">
              Triggered alert deliveries across this workspace
            </p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead(activeWorkspace.id)}
              className="flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div key={n.id} className="py-3 flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-text-primary">{n.title}</div>
                <p className="text-text-secondary mt-0.5">{n.message}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono text-text-muted">
                  {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'Just now'}
                </span>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(activeWorkspace.id, n.id)}
                    className="px-2.5 py-1 rounded bg-primary/15 text-primary font-medium"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Alert Modal */}
      <ModalDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Configure Alert Rule"
        description="Trigger notifications when deployment or monitoring conditions occur."
      >
        <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Alert Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="High API Latency > 500ms"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Scope Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                <option value="">All Workspace Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AlertConditionType)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                {Object.entries(CONDITION_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Threshold Value</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1.5 font-medium">
              Notification Channels
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppChannel}
                  onChange={(e) => setInAppChannel(e.target.checked)}
                />
                <span>In-App Center</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailChannel}
                  onChange={(e) => setEmailChannel(e.target.checked)}
                />
                <span>Email</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushChannel}
                  onChange={(e) => setPushChannel(e.target.checked)}
                />
                <span>Browser Push (FCM)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-elevated text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
            >
              Save Alert Rule
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

