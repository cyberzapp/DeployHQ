import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Rocket,
  Search,
  GitBranch,
  Clock,
  ExternalLink,
  RotateCcw,
  Terminal,
  XCircle,
  History,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  triggerDeploymentAction,
  cancelDeploymentAction,
} from '@/services/firebase/firestoreService';
import { StatusBadge } from '@/pages/dashboard/OverviewPage';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { EnvironmentType } from '@/types';

export const DeploymentsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    activeWorkspace,
    projects,
    deployments,
    integrations,
    canWrite,
    showToast,
  } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<'all' | '24h' | '7d' | '30d'>('all');

  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [selectedProjId, setSelectedProjId] = useState(projects[0]?.id || '');
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('Manual deployment triggered from DeployHQ');
  const [environment, setEnvironment] = useState<EnvironmentType>('production');

  const vercelIntegration = integrations.find((i) => i.provider === 'vercel');

  useEffect(() => {
    if (searchParams.get('trigger') === 'true') {
      setTriggerModalOpen(true);
      searchParams.delete('trigger');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredDeployments = useMemo(() => {
    const now = Date.now();
    return deployments.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        d.id.toLowerCase().includes(q) ||
        d.commitHash.toLowerCase().includes(q) ||
        d.projectName.toLowerCase().includes(q) ||
        d.commitMessage.toLowerCase().includes(q);
      const matchProj = projectFilter === 'all' || d.projectId === projectFilter;
      const matchEnv = envFilter === 'all' || d.environment === envFilter;
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;

      let matchDate = true;
      if (dateRange !== 'all' && d.createdAt) {
        const ts = new Date(d.createdAt).getTime();
        const maxAge =
          dateRange === '24h'
            ? 24 * 3600000
            : dateRange === '7d'
            ? 7 * 24 * 3600000
            : 30 * 24 * 3600000;
        matchDate = now - ts <= maxAge;
      }

      return matchSearch && matchProj && matchEnv && matchStatus && matchDate;
    });
  }, [deployments, search, projectFilter, envFilter, statusFilter, dateRange]);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dep = await triggerDeploymentAction({
        workspaceId: activeWorkspace.id,
        projectId: selectedProjId || projects[0]?.id,
        branch,
        commitMessage,
        environment,
        actorName: user?.displayName || 'Developer',
      });
      setTriggerModalOpen(false);
      showToast(`Deployment ${dep.id} queued`, 'success');
      navigate(`/deployments/${dep.id}`);
    } catch (err: any) {
      showToast(err?.message || 'Deployment failed to start', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Deployments</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Inspect build timelines, real-time logs, commit hashes, and trigger rollbacks.
          </p>
        </div>
        <button
          type="button"
          disabled={!canWrite || projects.length === 0}
          onClick={() => {
            setSelectedProjId(projects[0]?.id || '');
            setTriggerModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Rocket className="w-3.5 h-3.5" />
          Trigger Deployment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 bg-card border border-border rounded-xl p-3 text-xs">
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, commit hash, project..."
            aria-label="Search deployments"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-main border border-border text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <select
          aria-label="Filter by project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by environment"
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
        >
          <option value="all">All Environments</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="preview">Preview</option>
          <option value="development">Development</option>
        </select>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
        >
          <option value="all">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="building">Building</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          aria-label="Filter by date range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
        >
          <option value="all">All Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Deployments Table */}
      {filteredDeployments.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <Rocket className="w-9 h-9 text-text-muted mx-auto" />
          <h2 className="text-sm font-semibold text-text-primary">No deployments found</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Trigger a new deployment or adjust your filter criteria to inspect build pipelines.
          </p>
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Deployments list table"
          className="bg-card border border-border rounded-xl table-wrapper"
        >
          <table className="text-left text-xs">
            <thead className="bg-elevated text-text-secondary border-b border-border">
              <tr>
                <th className="py-3 px-4 font-medium">Deployment ID</th>
                <th className="py-3 px-4 font-medium">Project</th>
                <th className="py-3 px-4 font-medium">Branch & Commit</th>
                <th className="py-3 px-4 font-medium">Environment</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Duration</th>
                <th className="py-3 px-4 font-medium">Triggered By</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeployments.map((dep) => (
                <tr key={dep.id} className="hover:bg-elevated/50">
                  <th className="py-3 px-4 font-mono text-primary">
                    <Link to={`/deployments/${dep.id}`} className="hover:underline">
                      {dep.id}
                    </Link>
                  </th>
                  <td className="py-3 px-4 font-medium text-text-primary">
                    <Link to={`/projects/${dep.projectId}`} className="hover:text-primary">
                      {dep.projectName}
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
                  <td className="py-3 px-4 text-text-secondary">
                    <div>{dep.triggeredBy}</div>
                    <div className="text-[10px] text-text-muted">
                      {dep.createdAt ? new Date(dep.createdAt).toLocaleString() : 'Just now'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        to={`/deployments/${dep.id}`}
                        className="px-2.5 py-1 rounded bg-main hover:bg-border border border-border text-text-primary inline-flex items-center gap-1"
                      >
                        <Terminal className="w-3 h-3" />
                        Inspect
                      </Link>
                      {(dep.status === 'building' || dep.status === 'queued') && canWrite && (
                        <button
                          type="button"
                          onClick={async () => {
                            await cancelDeploymentAction(activeWorkspace.id, dep.id);
                            showToast(`Cancelled deployment ${dep.id}`, 'info');
                          }}
                          title="Cancel deployment"
                          className="p-1 rounded bg-status-error/15 text-status-error border border-status-error/30"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {dep.status === 'ready' && canWrite && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const next = await triggerDeploymentAction({
                                workspaceId: activeWorkspace.id,
                                projectId: dep.projectId,
                                branch: dep.branch,
                                environment: dep.environment,
                                actorName: user?.displayName || 'Developer',
                                redeployFromId: dep.id,
                                isRollback: true,
                              });
                              showToast(`Rollback deployment ${next.id} started`, 'success');
                              navigate(`/deployments/${next.id}`);
                            } catch (err: any) {
                              showToast(err?.message || 'Rollback failed', 'error');
                            }
                          }}
                          title="Roll back to this deployment"
                          className="p-1 rounded bg-main hover:bg-border border border-border text-text-secondary hover:text-text-primary"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {dep.url && (
                        <a
                          href={dep.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open deployment URL"
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

      {/* Trigger Deployment Modal */}
      <ModalDialog
        open={triggerModalOpen}
        onClose={() => setTriggerModalOpen(false)}
        title="Trigger Provider Deployment"
        description="Dispatch a new build through your connected deployment provider."
      >
        <form onSubmit={handleTrigger} className="space-y-4 text-xs">
          {!activeWorkspace.isDemo && !vercelIntegration?.connected && (
            <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning">
              Vercel integration is not yet connected for this workspace. Connect your Vercel API
              token in{' '}
              <Link to="/integrations" className="underline font-semibold">
                Integrations
              </Link>{' '}
              to trigger live provider builds.
            </div>
          )}

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Project</label>
            <select
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.repository})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Git Branch</label>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">
                Target Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="preview">Preview</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Commit / Note</label>
            <input
              type="text"
              required
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTriggerModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-elevated text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" />
              Start Build
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

