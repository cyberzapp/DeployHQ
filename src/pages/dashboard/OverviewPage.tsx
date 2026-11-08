import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Plus,
  ExternalLink,
  GitBranch,
  Clock,
  ArrowUpRight,
  Terminal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status.toLowerCase();
  if (s === 'ready' || s === 'operational' || s === 'healthy' || s === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-status-success/15 text-status-success border border-status-success/30">
        <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  if (s === 'building' || s === 'degraded' || s === 'queued') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-status-warning/15 text-status-warning border border-status-warning/30">
        <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  if (s === 'failed' || s === 'down' || s === 'unresolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-status-error/15 text-status-error border border-status-error/30">
        <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-elevated text-text-secondary border border-border">
      <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const {
    projects,
    deployments,
    monitors,
    errors,
    activity,
    selectedProjectId,
  } = useWorkspace();
  const navigate = useNavigate();

  const [chartWindow, setChartWindow] = useState<'24h' | '7d' | '30d'>('7d');

  const filteredProjects = selectedProjectId
    ? projects.filter((p) => p.id === selectedProjectId)
    : projects;
  const filteredDeployments = selectedProjectId
    ? deployments.filter((d) => d.projectId === selectedProjectId)
    : deployments;
  const filteredMonitors = selectedProjectId
    ? monitors.filter((m) => m.projectId === selectedProjectId)
    : monitors;
  const filteredErrors = selectedProjectId
    ? errors.filter((e) => e.projectId === selectedProjectId)
    : errors;

  // Derived KPI metrics strictly from stored workspace records
  const totalProjects = filteredProjects.length;
  const totalDeployments = filteredDeployments.length;
  const successfulDeployments = filteredDeployments.filter((d) => d.status === 'ready').length;
  const failedDeployments = filteredDeployments.filter((d) => d.status === 'failed').length;
  const downMonitors = filteredMonitors.filter((m) => m.status === 'down').length;
  const unresolvedErrors = filteredErrors.filter((e) => e.status === 'unresolved').length;
  const activeIncidents = downMonitors + unresolvedErrors;
  const monitoredServices = filteredMonitors.length;

  const successRate =
    totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;

  // Build chart buckets from actual stored deployments
  const chartData = useMemo(() => {
    const bucketCount = chartWindow === '24h' ? 6 : chartWindow === '7d' ? 7 : 10;
    const now = Date.now();
    const stepMs =
      chartWindow === '24h'
        ? 4 * 3600 * 1000
        : chartWindow === '7d'
        ? 24 * 3600 * 1000
        : 3 * 24 * 3600 * 1000;

    return Array.from({ length: bucketCount }).map((_, idx) => {
      const end = now - (bucketCount - 1 - idx) * stepMs;
      const start = end - stepMs;
      const dateObj = new Date(end);
      const label =
        chartWindow === '24h'
          ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const inBucket = filteredDeployments.filter((d) => {
        const ts = d.createdAt ? new Date(d.createdAt).getTime() : now;
        return ts >= start && ts <= end;
      });

      return {
        label,
        Successful: inBucket.filter((d) => d.status === 'ready').length,
        Failed: inBucket.filter((d) => d.status === 'failed').length,
        Pending: inBucket.filter((d) => d.status === 'building' || d.status === 'queued').length,
      };
    });
  }, [filteredDeployments, chartWindow]);

  const kpiCards = [
    {
      title: 'Total Projects',
      value: totalProjects,
      sub: `${filteredProjects.filter((p) => p.status === 'healthy').length} healthy in production`,
      icon: FolderGit2,
      accent: 'text-primary',
    },
    {
      title: 'Total Deployments',
      value: totalDeployments,
      sub: `${successRate}% overall success rate`,
      icon: Rocket,
      accent: 'text-status-info',
    },
    {
      title: 'Successful Deployments',
      value: successfulDeployments,
      sub: totalDeployments > 0 ? 'Verified on provider' : 'No deployments yet',
      icon: CheckCircle2,
      accent: 'text-status-success',
    },
    {
      title: 'Failed Deployments',
      value: failedDeployments,
      sub: failedDeployments > 0 ? 'Inspect build logs' : 'Zero build failures',
      icon: XCircle,
      accent: 'text-status-error',
    },
    {
      title: 'Active Incidents',
      value: activeIncidents,
      sub: `${downMonitors} monitors down • ${unresolvedErrors} open errors`,
      icon: AlertTriangle,
      accent: activeIncidents > 0 ? 'text-status-warning' : 'text-status-success',
    },
    {
      title: 'Monitored Services',
      value: monitoredServices,
      sub:
        monitoredServices > 0
          ? `${(
              filteredMonitors.reduce((s, m) => s + m.uptimePercentage, 0) / monitoredServices
            ).toFixed(2)}% avg uptime`
          : 'No HTTP checks configured',
      icon: Activity,
      accent: 'text-status-info',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Good morning, {user?.displayName || 'Developer'}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Here's what's happening across your projects.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/deployments?trigger=true')}
            className="px-3.5 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-xs font-medium text-text-primary flex items-center gap-2 transition-colors"
          >
            <Rocket className="w-3.5 h-3.5 text-primary" />
            Trigger Deployment
          </button>
          <button
            type="button"
            onClick={() => navigate('/projects?create=true')}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Project
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-4 rounded-xl bg-card border border-border shadow-subtle flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-secondary">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.accent}`} />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold font-mono text-text-primary">
                  {card.value}
                </div>
                <div className="text-[11px] text-text-muted mt-1 truncate">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment Activity Chart + Recent Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Deployment Activity</h2>
              <p className="text-xs text-text-secondary">
                Calculated from stored deployment records across environments
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-main border border-border text-xs">
              {(['24h', '7d', '30d'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setChartWindow(w)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    chartWindow === w
                      ? 'bg-elevated text-text-primary border border-border'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Last {w}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242B38" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#929BAC', fontSize: 11 }}
                  axisLine={{ stroke: '#242B38' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
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
                    color: '#F4F6FA',
                  }}
                />
                <Bar dataKey="Successful" stackId="a" fill="#22C58B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Failed" stackId="a" fill="#F06464" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill="#F5B942" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Workspace Activity</h2>
              <p className="text-xs text-text-secondary">Real-time audit stream</p>
            </div>
            <Link to="/deployments" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-64 pr-1">
            {activity.length === 0 ? (
              <div className="text-xs text-text-muted py-8 text-center">
                No workspace events recorded yet.
              </div>
            ) : (
              activity.slice(0, 7).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-main border border-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text-primary truncate">
                      {act.actorName || 'System'}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted shrink-0">
                      {act.createdAt
                        ? new Date(act.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'just now'}
                    </span>
                  </div>
                  <p className="text-text-secondary leading-snug">{act.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Deployments Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Recent Deployments</h2>
            <p className="text-xs text-text-secondary">
              Latest builds, commit hashes, and live status across environments
            </p>
          </div>
          <Link
            to="/deployments"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            All Deployments
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filteredDeployments.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Rocket className="w-8 h-8 text-text-muted mx-auto" />
            <div className="text-sm font-medium text-text-primary">No deployments recorded yet</div>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Connect a GitHub repository and Vercel project to trigger or import your first
              deployment.
            </p>
            <button
              type="button"
              onClick={() => navigate('/deployments?trigger=true')}
              className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-medium"
            >
              Trigger First Deployment
            </button>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Recent deployments table"
            className="table-wrapper"
          >
            <table className="text-left text-xs">
              <thead className="bg-elevated text-text-secondary border-b border-border">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Project</th>
                  <th className="py-2.5 px-4 font-medium">Deployment ID</th>
                  <th className="py-2.5 px-4 font-medium">Branch & Commit</th>
                  <th className="py-2.5 px-4 font-medium">Environment</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium">Created</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeployments.slice(0, 6).map((dep) => (
                  <tr key={dep.id} className="hover:bg-elevated/50 transition-colors">
                    <th className="py-3 px-4 font-medium text-text-primary">
                      <Link to={`/projects/${dep.projectId}`} className="hover:text-primary">
                        {dep.projectName}
                      </Link>
                    </th>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      <Link to={`/deployments/${dep.id}`} className="hover:text-primary">
                        {dep.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-text-primary">
                        <GitBranch className="w-3 h-3 text-primary" />
                        <span>{dep.branch}</span>
                        <span className="text-text-muted">({dep.commitHash})</span>
                      </div>
                      <div className="text-[11px] text-text-secondary truncate max-w-xs">
                        {dep.commitMessage}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-main border border-border font-mono text-[11px] text-text-secondary capitalize">
                        {dep.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={dep.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-text-muted" />
                        {Math.round((dep.durationMs || 0) / 1000)}s
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {dep.createdAt
                        ? new Date(dep.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/deployments/${dep.id}`}
                          className="px-2.5 py-1 rounded bg-main hover:bg-border border border-border text-text-primary font-medium inline-flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3" />
                          Logs
                        </Link>
                        {dep.url && (
                          <a
                            href={dep.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${dep.projectName} deployment URL`}
                            className="p-1 rounded bg-main hover:bg-border border border-border text-text-secondary hover:text-text-primary"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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

      {/* Project Health Overview */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Project Health Overview</h2>
            <p className="text-xs text-text-secondary">
              Uptime, response time, and error rate across registered applications
            </p>
          </div>
          <Link to="/monitoring" className="text-xs font-medium text-primary hover:underline">
            Open Monitoring →
          </Link>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No projects created in this workspace yet.
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Project health overview table"
            className="table-wrapper"
          >
            <table className="text-left text-xs">
              <thead className="bg-elevated text-text-secondary border-b border-border">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Project Name</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Response Time</th>
                  <th className="py-2.5 px-4 font-medium">Uptime</th>
                  <th className="py-2.5 px-4 font-medium">Open Errors</th>
                  <th className="py-2.5 px-4 font-medium">Production Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.map((proj) => {
                  const mon = monitors.find((m) => m.projectId === proj.id);
                  const projErrors = errors.filter(
                    (e) => e.projectId === proj.id && e.status === 'unresolved'
                  );
                  return (
                    <tr key={proj.id} className="hover:bg-elevated/50">
                      <th className="py-3 px-4 font-medium text-text-primary">
                        <Link to={`/projects/${proj.id}`} className="hover:text-primary">
                          {proj.name}
                        </Link>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-main border border-border text-text-muted">
                          {proj.framework}
                        </span>
                      </th>
                      <td className="py-3 px-4">
                        <StatusBadge status={mon ? mon.status : proj.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-text-primary">
                        {mon ? `${mon.avgLatencyMs}ms` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-status-success">
                        {mon ? `${mon.uptimePercentage}%` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={
                            projErrors.length > 0 ? 'text-status-error font-semibold' : 'text-text-muted'
                          }
                        >
                          {projErrors.length} unresolved
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-text-secondary">
                        <a
                          href={proj.productionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          {proj.domain}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

