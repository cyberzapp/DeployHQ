import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Plus,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  createMonitor,
  executeLiveHttpCheck,
  toggleMonitorPause,
} from '@/services/firebase/firestoreService';
import { StatusBadge } from '@/pages/dashboard/OverviewPage';
import { ModalDialog } from '@/components/ui/ModalDialog';

export const MonitoringPage: React.FC = () => {
  const {
    activeWorkspace,
    projects,
    monitors,
    monitorChecks,
    canWrite,
    showToast,
  } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(
    monitors[0]?.id || null
  );
  const [runningId, setRunningId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create Monitor Form
  const [monName, setMonName] = useState('');
  const [monUrl, setMonUrl] = useState('https://');
  const [monProjectId, setMonProjectId] = useState(projects[0]?.id || '');
  const [monMethod, setMonMethod] = useState<'GET' | 'HEAD' | 'POST'>('GET');
  const [monInterval, setMonInterval] = useState(60);
  const [monTimeout, setMonTimeout] = useState(5000);
  const [monExpectedStatus, setMonExpectedStatus] = useState(200);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeMonitor =
    monitors.find((m) => m.id === selectedMonitorId) || monitors[0] || null;

  // Compute global monitoring metrics strictly from stored check results
  const metrics = useMemo(() => {
    if (monitorChecks.length === 0) {
      return {
        uptimePct: 100,
        avgMs: 0,
        p95Ms: 0,
        minMs: 0,
        maxMs: 0,
        errorRatePct: 0,
        totalChecks: 0,
        failedChecks: 0,
        status2xx: 0,
        status5xx: 0,
      };
    }

    const latencies = monitorChecks.map((c) => c.responseTimeMs).sort((a, b) => a - b);
    const total = monitorChecks.length;
    const failed = monitorChecks.filter((c) => !c.success).length;
    const up = total - failed;
    const avgMs = Math.round(latencies.reduce((s, v) => s + v, 0) / total);
    const p95Idx = Math.min(total - 1, Math.floor(total * 0.95));
    const p95Ms = latencies[p95Idx] || avgMs;

    return {
      uptimePct: Number(((up / total) * 100).toFixed(2)),
      avgMs,
      p95Ms,
      minMs: latencies[0] || 0,
      maxMs: latencies[latencies.length - 1] || 0,
      errorRatePct: Number(((failed / total) * 100).toFixed(2)),
      totalChecks: total,
      failedChecks: failed,
      status2xx: monitorChecks.filter((c) => c.statusCode >= 200 && c.statusCode < 400).length,
      status5xx: monitorChecks.filter((c) => c.statusCode >= 500 || c.statusCode === 0).length,
    };
  }, [monitorChecks]);

  const selectedMonitorChecks = useMemo(() => {
    const list = activeMonitor
      ? monitorChecks.filter((c) => c.monitorId === activeMonitor.id)
      : monitorChecks;
    return [...list].reverse().slice(-24).map((c) => ({
      time: c.checkedAt
        ? new Date(c.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'now',
      ResponseTimeMs: c.responseTimeMs,
      statusCode: c.statusCode,
      success: c.success,
    }));
  }, [monitorChecks, activeMonitor]);

  const handleRunLiveCheck = async (monitorId: string) => {
    setRunningId(monitorId);
    try {
      const check = await executeLiveHttpCheck(activeWorkspace.id, monitorId);
      showToast(
        `HTTP check completed: ${check.statusCode || 'ERR'} (${check.responseTimeMs}ms)`,
        check.success ? 'success' : 'error'
      );
    } catch (err: any) {
      showToast(err?.message || 'Check failed', 'error');
    } finally {
      setRunningId(null);
    }
  };

  const handleCreateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === monProjectId);
    const created = await createMonitor(activeWorkspace.id, {
      name: monName,
      url: monUrl,
      projectId: proj?.id,
      projectName: proj?.name,
      method: monMethod,
      intervalSeconds: Number(monInterval),
      timeoutMs: Number(monTimeout),
      expectedStatus: Number(monExpectedStatus),
    });
    setSelectedMonitorId(created.id);
    setCreateOpen(false);
    setMonName('');
    setMonUrl('https://');
    showToast(`Created monitor "${created.name}" & executed first HTTP check`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Uptime & Health Monitoring
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real HTTP health checks, P95 latency telemetry, and status code distribution.
          </p>
        </div>
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => setCreateOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Uptime Check
        </button>
      </div>

      {/* Monitoring Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Overall Uptime</div>
          <div className="text-2xl font-mono font-semibold text-status-success mt-1">
            {metrics.uptimePct}%
          </div>
          <div className="text-[11px] text-text-muted mt-1">{metrics.totalChecks} checks stored</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Avg Response Time</div>
          <div className="text-2xl font-mono font-semibold text-text-primary mt-1">
            {metrics.avgMs}ms
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            Min {metrics.minMs}ms • Max {metrics.maxMs}ms
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">P95 Latency</div>
          <div className="text-2xl font-mono font-semibold text-status-info mt-1">
            {metrics.p95Ms}ms
          </div>
          <div className="text-[11px] text-text-muted mt-1">95th percentile</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Error Rate</div>
          <div
            className={`text-2xl font-mono font-semibold mt-1 ${
              metrics.errorRatePct > 1 ? 'text-status-error' : 'text-status-success'
            }`}
          >
            {metrics.errorRatePct}%
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {metrics.failedChecks} failed probes
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">HTTP 2xx / 3xx</div>
          <div className="text-2xl font-mono font-semibold text-status-success mt-1">
            {metrics.status2xx}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Healthy responses</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">HTTP 5xx / Timeouts</div>
          <div className="text-2xl font-mono font-semibold text-status-error mt-1">
            {metrics.status5xx}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Failed HTTP checks</div>
        </div>
      </div>

      {/* Response Time Analytics Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Response Time Analytics — {activeMonitor ? activeMonitor.name : 'All Monitors'}
            </h2>
            <p className="text-xs text-text-secondary">
              Measured latency (ms) across recent HTTP probes
            </p>
          </div>
          {activeMonitor && (
            <button
              type="button"
              disabled={runningId === activeMonitor.id}
              onClick={() => handleRunLiveCheck(activeMonitor.id)}
              className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-border border border-border text-xs font-medium text-text-primary flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-primary ${
                  runningId === activeMonitor.id ? 'animate-spin' : ''
                }`}
              />
              Run HTTP Probe Now
            </button>
          )}
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={selectedMonitorChecks} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B7CFF" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8B7CFF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#242B38" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#929BAC', fontSize: 11 }}
                axisLine={{ stroke: '#242B38' }}
                tickLine={false}
              />
              <YAxis
                unit="ms"
                tick={{ fill: '#929BAC', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171C27',
                  borderColor: '#242B38',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="ResponseTimeMs"
                stroke="#8B7CFF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#latencyGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monitored Services Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden text-xs">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Monitored Services</h2>
            <p className="text-xs text-text-secondary">
              Select a service row to inspect its response-time chart and check history
            </p>
          </div>
        </div>

        {monitors.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Activity className="w-8 h-8 text-text-muted mx-auto" />
            <div className="font-semibold text-text-primary">No uptime monitors configured</div>
            <p className="text-text-secondary max-w-md mx-auto">
              Add an HTTP endpoint check to monitor uptime, response latency, and status codes.
            </p>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Monitored services table"
            className="table-wrapper"
          >
            <table className="text-left text-xs">
              <thead className="bg-elevated text-text-secondary border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-medium">Service</th>
                  <th className="py-3 px-4 font-medium">Target URL</th>
                  <th className="py-3 px-4 font-medium">Current Status</th>
                  <th className="py-3 px-4 font-medium">Uptime</th>
                  <th className="py-3 px-4 font-medium">Response Time</th>
                  <th className="py-3 px-4 font-medium">Last Checked</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monitors.map((mon) => (
                  <tr
                    key={mon.id}
                    onClick={() => setSelectedMonitorId(mon.id)}
                    className={`cursor-pointer transition-colors ${
                      activeMonitor?.id === mon.id ? 'bg-primary/10' : 'hover:bg-elevated/50'
                    }`}
                  >
                    <th className="py-3 px-4 font-medium text-text-primary">
                      <div>{mon.name}</div>
                      {mon.lastError && (
                        <div className="text-[11px] text-status-error flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-xs">{mon.lastError}</span>
                        </div>
                      )}
                    </th>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      <a
                        href={mon.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary inline-flex items-center gap-1"
                      >
                        {mon.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={mon.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-status-success">
                      {mon.uptimePercentage}%
                    </td>
                    <td className="py-3 px-4 font-mono text-text-primary">
                      {mon.avgLatencyMs}ms (last {mon.latencyMs}ms)
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mon.lastCheckedAt
                          ? new Date(mon.lastCheckedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Pending'}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={runningId === mon.id}
                          onClick={() => handleRunLiveCheck(mon.id)}
                          className="px-2.5 py-1 rounded bg-main hover:bg-border border border-border text-text-primary inline-flex items-center gap-1"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${runningId === mon.id ? 'animate-spin' : ''}`}
                          />
                          Check Now
                        </button>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={async () => {
                              await toggleMonitorPause(
                                activeWorkspace.id,
                                mon.id,
                                !mon.enabled
                              );
                              showToast(
                                mon.enabled ? 'Monitor paused' : 'Monitor resumed',
                                'info'
                              );
                            }}
                            title={mon.enabled ? 'Pause monitor' : 'Resume monitor'}
                            className="p-1.5 rounded bg-main hover:bg-border border border-border text-text-secondary"
                          >
                            {mon.enabled ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </button>
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

      {/* Create Monitor Modal */}
      <ModalDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create HTTP Uptime Monitor"
        description="Scheduled Cloud Functions and on-demand probes verify HTTP status and latency."
      >
        <form onSubmit={handleCreateMonitor} className="space-y-4 text-xs">
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Monitor Name *</label>
            <input
              type="text"
              required
              value={monName}
              onChange={(e) => setMonName(e.target.value)}
              placeholder="Production API Healthcheck"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Target URL *</label>
            <input
              type="url"
              required
              value={monUrl}
              onChange={(e) => setMonUrl(e.target.value)}
              placeholder="https://api.example.com/health"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">HTTP Method</label>
              <select
                value={monMethod}
                onChange={(e) => setMonMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                <option value="GET">GET</option>
                <option value="HEAD">HEAD</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">
                Expected HTTP Status
              </label>
              <input
                type="number"
                value={monExpectedStatus}
                onChange={(e) => setMonExpectedStatus(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">
                Check Interval (seconds)
              </label>
              <select
                value={monInterval}
                onChange={(e) => setMonInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 1 minute</option>
                <option value={300}>Every 5 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Timeout (ms)</label>
              <input
                type="number"
                value={monTimeout}
                onChange={(e) => setMonTimeout(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
              />
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
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Create & Run Check
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

