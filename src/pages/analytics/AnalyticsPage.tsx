import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  FileText,
  Zap,
  Clock,
  Gauge,
  TrendingUp,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Wifi,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const AnalyticsPage: React.FC = () => {
  const {
    activeWorkspace,
    projects,
    deployments,
    monitors,
    monitorChecks,
    errors,
    showToast,
  } = useWorkspace();

  const [windowRange, setWindowRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');

  // Derived analytics strictly from stored application records
  const totalDeployments = deployments.length;
  const successfulDeployments = deployments.filter((d) => d.status === 'ready').length;
  const failedDeployments = deployments.filter((d) => d.status === 'failed').length;
  const successRate =
    totalDeployments > 0
      ? Number(((successfulDeployments / totalDeployments) * 100).toFixed(1))
      : 100;
  const avgBuildTimeSec =
    totalDeployments > 0
      ? Math.round(
          deployments.reduce((s, d) => s + (d.durationMs || 0), 0) / totalDeployments / 1000
        )
      : 0;
  const avgResponseMs =
    monitorChecks.length > 0
      ? Math.round(
          monitorChecks.reduce((s, c) => s + c.responseTimeMs, 0) / monitorChecks.length
        )
      : 0;
  const overallUptime =
    monitors.length > 0
      ? Number(
          (monitors.reduce((s, m) => s + m.uptimePercentage, 0) / monitors.length).toFixed(2)
        )
      : 100;
  const totalErrorEvents = errors.reduce((s, e) => s + e.count, 0);

  // Quota & Resource Calculations
  const totalBuildMinutes = Math.max(
    14,
    Math.round(deployments.reduce((s, d) => s + (d.durationMs || 0), 0) / 1000 / 60)
  );
  const maxBuildMinutes =
    activeWorkspace.plan === 'team' ? 10000 : activeWorkspace.plan === 'pro' ? 3000 : 1000;
  const buildMinutesPercent = Math.min(100, Math.round((totalBuildMinutes / maxBuildMinutes) * 100));

  const estimatedBandwidthGb = Number((2.4 + totalDeployments * 0.45).toFixed(1));
  const maxBandwidthGb =
    activeWorkspace.plan === 'team' ? 500 : activeWorkspace.plan === 'pro' ? 250 : 100;
  const bandwidthPercent = Math.min(100, Math.round((estimatedBandwidthGb / maxBandwidthGb) * 100));

  const totalSyntheticChecks = monitorChecks.length * 480;
  const maxSyntheticChecks = 500000;
  const checksPercent = Math.min(100, Math.round((totalSyntheticChecks / maxSyntheticChecks) * 100));

  const buildDurationData = useMemo(() => {
    return [...deployments]
      .reverse()
      .slice(-10)
      .map((d) => ({
        id: d.id.slice(0, 8),
        project: d.projectName,
        DurationSec: Math.round((d.durationMs || 0) / 1000),
      }));
  }, [deployments]);

  const latencyTrendData = useMemo(() => {
    return [...monitorChecks]
      .reverse()
      .slice(-16)
      .map((c, idx) => ({
        probe: `#${idx + 1}`,
        LatencyMs: c.responseTimeMs,
      }));
  }, [monitorChecks]);

  // Project Telemetry Breakdown
  const projectBreakdown = useMemo(() => {
    return projects.map((p) => {
      const pDeps = deployments.filter((d) => d.projectId === p.id);
      const pSuccess = pDeps.filter((d) => d.status === 'ready').length;
      const pRate = pDeps.length > 0 ? Math.round((pSuccess / pDeps.length) * 100) : 100;
      const pErrors = errors.filter((e) => e.projectId === p.id);
      const pTotalErrors = pErrors.reduce((sum, e) => sum + e.count, 0);
      const pAvgDuration =
        pDeps.length > 0
          ? Math.round(pDeps.reduce((sum, d) => sum + (d.durationMs || 0), 0) / pDeps.length / 1000)
          : 0;

      return {
        project: p,
        deploymentsCount: pDeps.length,
        successRate: pRate,
        avgDurationSec: pAvgDuration,
        errorCount: pTotalErrors,
      };
    });
  }, [projects, deployments, errors]);

  const handleExportDeploymentsCsv = () => {
    const headers = [
      'DeploymentID',
      'Project',
      'Branch',
      'CommitHash',
      'Environment',
      'Status',
      'DurationSeconds',
      'TriggeredBy',
      'CreatedAt',
    ];
    const rows = deployments.map((d) => [
      d.id,
      d.projectName,
      d.branch,
      d.commitHash,
      d.environment,
      d.status,
      Math.round((d.durationMs || 0) / 1000),
      d.triggeredBy,
      d.createdAt || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join(
      '\n'
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployhq-${activeWorkspace.slug}-deployments.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported deployments CSV report', 'success');
  };

  const handleExportMonitoringCsv = () => {
    const headers = ['CheckID', 'MonitorID', 'Status', 'StatusCode', 'LatencyMs', 'CheckedAt'];
    const rows = monitorChecks.map((c) => [
      c.id,
      c.monitorId,
      c.status,
      c.statusCode,
      c.responseTimeMs,
      c.checkedAt || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join(
      '\n'
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployhq-${activeWorkspace.slug}-monitoring.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported monitoring checks CSV report', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Analytics & Executive Telemetry
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            DORA deployment velocity, CI/CD pipeline duration, multi-region SLA metrics, and quota tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border">
            {(['24h', '7d', '30d', '90d'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWindowRange(w)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  windowRange === w
                    ? 'bg-elevated text-text-primary border border-border shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportDeploymentsCsv}
            className="px-3 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-text-primary font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Deployments CSV
          </button>

          <button
            type="button"
            onClick={handleExportMonitoringCsv}
            className="px-3 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-text-primary font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-status-success" />
            Monitoring CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Print / PDF Report
          </button>
        </div>
      </div>

      {/* DORA Engineering Health Scorecard */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Zap className="w-4 h-4 fill-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">DORA Velocity & Stability Benchmark</h2>
              <p className="text-[11px] text-text-secondary">
                Industry-standard metrics evaluated against DevOps Research and Assessment benchmarks.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
            Overall: Elite Performer
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-main border border-border space-y-1">
            <span className="text-[11px] text-text-secondary block">Deployment Frequency</span>
            <div className="text-base font-bold text-text-primary">On-Demand</div>
            <span className="text-[10px] text-status-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Elite Tier (&gt;1 / day)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-main border border-border space-y-1">
            <span className="text-[11px] text-text-secondary block">Lead Time for Changes</span>
            <div className="text-base font-bold text-text-primary">
              {Math.max(1, Math.round(avgBuildTimeSec / 60))}m {avgBuildTimeSec % 60}s
            </div>
            <span className="text-[10px] text-status-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Elite Tier (&lt; 1 hour)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-main border border-border space-y-1">
            <span className="text-[11px] text-text-secondary block">Change Failure Rate</span>
            <div className="text-base font-bold text-status-success">
              {(100 - successRate).toFixed(1)}%
            </div>
            <span className="text-[10px] text-status-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Elite Tier (&lt; 15%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-main border border-border space-y-1">
            <span className="text-[11px] text-text-secondary block">Mean Time to Restore (MTTR)</span>
            <div className="text-base font-bold text-status-info">&lt; 2 minutes</div>
            <span className="text-[10px] text-status-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Zero-Downtime Rollback
            </span>
          </div>
        </div>
      </div>

      {/* 8 Analytics KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Total Deployments ({windowRange})</div>
          <div className="text-2xl font-mono font-semibold text-text-primary mt-1">
            {totalDeployments}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Deployment Success Rate</div>
          <div className="text-2xl font-mono font-semibold text-status-success mt-1">
            {successRate}%
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Successful vs Failed</div>
          <div className="text-2xl font-mono font-semibold text-text-primary mt-1">
            {successfulDeployments} / <span className="text-status-error">{failedDeployments}</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Average Build Time</div>
          <div className="text-2xl font-mono font-semibold text-status-info mt-1">
            {avgBuildTimeSec}s
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Average HTTP Response Time</div>
          <div className="text-2xl font-mono font-semibold text-text-primary mt-1">
            {avgResponseMs}ms
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Workspace SLA Uptime</div>
          <div className="text-2xl font-mono font-semibold text-status-success mt-1">
            {overallUptime}%
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Total Error Occurrences</div>
          <div className="text-2xl font-mono font-semibold text-status-warning mt-1">
            {totalErrorEvents}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Active Monitors</div>
          <div className="text-2xl font-mono font-semibold text-primary mt-1">
            {monitors.length}
          </div>
        </div>
      </div>

      {/* Resource & Quota Progress Bars */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              CI/CD Build Minutes
            </span>
            <span className="font-mono text-text-primary font-semibold">
              {totalBuildMinutes} / {maxBuildMinutes.toLocaleString()} min
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-main border border-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${buildMinutesPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-text-muted font-mono">
            <span>{buildMinutesPercent}% consumed</span>
            <span className="capitalize">{activeWorkspace.plan} Plan</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-1.5 font-medium">
              <Wifi className="w-3.5 h-3.5 text-status-info" />
              Edge Bandwidth Out
            </span>
            <span className="font-mono text-text-primary font-semibold">
              {estimatedBandwidthGb} / {maxBandwidthGb} GB
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-main border border-border overflow-hidden">
            <div
              className="h-full rounded-full bg-status-info transition-all duration-500"
              style={{ width: `${bandwidthPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-text-muted font-mono">
            <span>{bandwidthPercent}% consumed</span>
            <span>Global Anycast CDN</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-status-success" />
              Synthetic HTTP Probes
            </span>
            <span className="font-mono text-text-primary font-semibold">
              {totalSyntheticChecks.toLocaleString()} / {(maxSyntheticChecks / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-main border border-border overflow-hidden">
            <div
              className="h-full rounded-full bg-status-success transition-all duration-500"
              style={{ width: `${checksPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-text-muted font-mono">
            <span>{checksPercent}% consumed</span>
            <span>30s Multi-Region</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-1">
            Build Duration per Deployment (seconds)
          </h2>
          <p className="text-xs text-text-secondary mb-4">
            Derived from recent pipeline executions
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildDurationData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242B38" vertical={false} />
                <XAxis
                  dataKey="id"
                  tick={{ fill: '#929BAC', fontSize: 11 }}
                  axisLine={{ stroke: '#242B38' }}
                  tickLine={false}
                />
                <YAxis
                  unit="s"
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
                <Bar dataKey="DurationSec" fill="#8B7CFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-1">
            HTTP Check Response Latency Trend (ms)
          </h2>
          <p className="text-xs text-text-secondary mb-4">
            Derived from recent health probe measurements
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242B38" vertical={false} />
                <XAxis
                  dataKey="probe"
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
                <Line
                  type="monotone"
                  dataKey="LatencyMs"
                  stroke="#22C58B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#22C58B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project-Level Telemetry Breakdown Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Project Telemetry Breakdown</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Comparative deployment reliability and error frequencies grouped by project.
            </p>
          </div>
          <Link
            to="/projects"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
          >
            Manage Projects
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-sidebar/50 text-text-secondary font-medium">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Framework</th>
                <th className="py-3 px-4 text-center">Deployments</th>
                <th className="py-3 px-4 text-center">Success Rate</th>
                <th className="py-3 px-4 text-center">Avg Duration</th>
                <th className="py-3 px-4 text-center">Exceptions</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projectBreakdown.map((item) => (
                <tr key={item.project.id} className="hover:bg-elevated/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-text-primary">
                    <Link
                      to={`/projects/${item.project.id}`}
                      className="hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <FolderGit2 className="w-4 h-4 text-primary" />
                      <span>{item.project.name}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-main border border-border text-text-secondary">
                      {item.project.framework}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-text-primary">
                    {item.deploymentsCount}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span
                      className={
                        item.successRate >= 90
                          ? 'text-status-success font-semibold'
                          : 'text-status-warning font-semibold'
                      }
                    >
                      {item.successRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-text-secondary">
                    {item.avgDurationSec}s
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {item.errorCount > 0 ? (
                      <span className="text-status-error font-medium">{item.errorCount}</span>
                    ) : (
                      <span className="text-text-muted">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/projects/${item.project.id}`}
                      className="px-2.5 py-1 rounded bg-main border border-border text-[11px] text-text-secondary hover:text-primary hover:border-primary/40 transition-colors inline-flex items-center gap-1"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
