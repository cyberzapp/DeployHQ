import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Rocket,
  BarChart3,
  Terminal,
  Activity,
  KeyRound,
  Globe,
  Settings,
  ExternalLink,
  GitBranch,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Copy,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  triggerDeploymentAction,
  updateProjectSettings,
  deleteProject,
  saveEnvironmentVariable,
  verifyCustomDomainDns,
} from '@/services/firebase/firestoreService';
import { StatusBadge } from '@/pages/dashboard/OverviewPage';
import { EnvironmentType } from '@/types';
import { ModalDialog } from '@/components/ui/ModalDialog';

type ProjectTab =
  | 'overview'
  | 'deployments'
  | 'analytics'
  | 'logs'
  | 'monitoring'
  | 'env'
  | 'domains'
  | 'settings';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const {
    activeWorkspace,
    projects,
    deployments,
    monitors,
    errors,
    environments,
    canWrite,
    canAdmin,
    showToast,
  } = useWorkspace();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const [newDomain, setNewDomain] = useState('');
  const [envKey, setEnvKey] = useState('');
  const [envVal, setEnvVal] = useState('');
  const [envTarget, setEnvTarget] = useState<EnvironmentType>('production');

  const project = projects.find((p) => p.id === projectId);

  const [buildCommand, setBuildCommand] = useState(project?.buildCommand || 'npm run build');
  const [installCommand, setInstallCommand] = useState(project?.installCommand || 'npm ci');
  const [outputDir, setOutputDir] = useState(project?.outputDir || 'dist');

  const [verifyingDomains, setVerifyingDomains] = useState<Record<string, boolean>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [dnsResults, setDnsResults] = useState<
    Record<
      string,
      {
        isConfigured: boolean;
        records: Array<{ name: string; type: number; data: string; TTL: number }>;
        expectedCname: string;
        checkedAt: string;
      }
    >
  >({});

  const handleVerifyDns = async (domainToTest: string) => {
    setVerifyingDomains((prev) => ({ ...prev, [domainToTest]: true }));
    try {
      const res = await verifyCustomDomainDns(domainToTest);
      setDnsResults((prev) => ({ ...prev, [domainToTest]: res }));
      if (res.isConfigured) {
        showToast(`DNS is correctly configured for ${domainToTest}`, 'success');
      } else {
        showToast(
          `CNAME record for ${domainToTest} not detected yet. DNS propagation can take 1-5 minutes.`,
          'info'
        );
      }
    } catch {
      showToast(`DNS lookup failed for ${domainToTest}`, 'error');
    } finally {
      setVerifyingDomains((prev) => ({ ...prev, [domainToTest]: false }));
    }
  };

  if (!project) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
        <div className="text-sm font-semibold text-text-primary">Project not found</div>
        <Link to="/projects" className="text-xs text-primary hover:underline">
          ← Return to Projects
        </Link>
      </div>
    );
  }

  const projectDeployments = deployments.filter((d) => d.projectId === project.id);
  const projectMonitors = monitors.filter((m) => m.projectId === project.id);
  const projectErrors = errors.filter((e) => e.projectId === project.id);
  const projectEnvs = environments.filter((e) => e.projectId === project.id);

  const tabs: { id: ProjectTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: FolderGit2 },
    { id: 'deployments', label: `Deployments (${projectDeployments.length})`, icon: Rocket },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'logs', label: 'Logs & Errors', icon: Terminal },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'env', label: `Environment Variables (${projectEnvs.length})`, icon: KeyRound },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTriggerBuild = async () => {
    try {
      const dep = await triggerDeploymentAction({
        workspaceId: activeWorkspace.id,
        projectId: project.id,
        branch: project.branch,
        environment: 'production',
        actorName: user?.displayName || 'Developer',
      });
      showToast(`Deployment ${dep.id} started`, 'success');
      navigate(`/deployments/${dep.id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to trigger deployment', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Project Header */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-text-primary">{project.name}</h1>
            <StatusBadge status={project.status} />
            <span className="text-[11px] px-2 py-0.5 rounded bg-main border border-border text-text-secondary">
              {project.framework}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
            <a
              href={project.productionUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-primary hover:underline inline-flex items-center gap-1"
            >
              {project.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="font-mono flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-text-muted" />
              {project.repository} ({project.branch})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canWrite}
            onClick={handleTriggerBuild}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            Deploy Now
          </button>
        </div>
      </div>

      {/* 8 Project Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-4 text-xs">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Build & Runtime Summary</h2>
            <p className="text-text-secondary">{project.description || 'Production web service'}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-main border border-border">
                <div className="text-text-muted">Build Command</div>
                <div className="font-mono font-semibold text-text-primary mt-1">
                  {project.buildCommand}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-main border border-border">
                <div className="text-text-muted">Output Directory</div>
                <div className="font-mono font-semibold text-text-primary mt-1">
                  {project.outputDir}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-main border border-border">
                <div className="text-text-muted">Primary Region</div>
                <div className="font-mono font-semibold text-text-primary mt-1">
                  {project.region}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">Service Telemetry</h2>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary">Total Deployments</span>
              <span className="font-mono text-text-primary">{projectDeployments.length}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary">Active Monitors</span>
              <span className="font-mono text-text-primary">{projectMonitors.length}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-text-secondary">Unresolved Errors</span>
              <span className="font-mono text-status-error">
                {projectErrors.filter((e) => e.status === 'unresolved').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Deployments */}
      {activeTab === 'deployments' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Project Deployments</h2>
            <button
              type="button"
              onClick={handleTriggerBuild}
              className="px-3 py-1.5 rounded-lg bg-primary text-white font-medium"
            >
              Trigger Build
            </button>
          </div>
          <div className="divide-y divide-border">
            {projectDeployments.map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <Link
                    to={`/deployments/${d.id}`}
                    className="font-mono font-semibold text-primary hover:underline"
                  >
                    {d.id}
                  </Link>
                  <span className="ml-2 text-text-secondary">{d.commitMessage}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-text-muted">
                    {d.branch}@{d.commitHash}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === 'analytics' && (
        <div className="bg-card border border-border rounded-xl p-5 grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-main border border-border">
            <div className="text-text-secondary">Deployment Success Rate</div>
            <div className="text-2xl font-mono font-semibold text-status-success mt-1">
              {projectDeployments.length > 0
                ? Math.round(
                    (projectDeployments.filter((d) => d.status === 'ready').length /
                      projectDeployments.length) *
                      100
                  )
                : 100}
              %
            </div>
          </div>
          <div className="p-4 rounded-lg bg-main border border-border">
            <div className="text-text-secondary">Avg Build Duration</div>
            <div className="text-2xl font-mono font-semibold text-text-primary mt-1">
              {projectDeployments.length > 0
                ? Math.round(
                    projectDeployments.reduce((s, d) => s + d.durationMs, 0) /
                      projectDeployments.length /
                      1000
                  )
                : 0}
              s
            </div>
          </div>
          <div className="p-4 rounded-lg bg-main border border-border">
            <div className="text-text-secondary">Observed Uptime</div>
            <div className="text-2xl font-mono font-semibold text-status-info mt-1">
              {projectMonitors[0]?.uptimePercentage ?? 100}%
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Logs & Errors */}
      {activeTab === 'logs' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-xs">
          <h2 className="text-sm font-semibold text-text-primary">Project Error Events</h2>
          {projectErrors.length === 0 ? (
            <p className="text-text-muted">No errors recorded for this project.</p>
          ) : (
            projectErrors.map((err) => (
              <div key={err.id} className="p-3 rounded-lg bg-main border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-status-error">{err.title}</span>
                  <StatusBadge status={err.status} />
                </div>
                <pre className="text-[11px] font-mono text-text-secondary overflow-x-auto pt-1">
                  {err.stackTrace}
                </pre>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Monitoring */}
      {activeTab === 'monitoring' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Uptime Monitors</h2>
            <Link to="/monitoring" className="text-primary hover:underline">
              Manage All Monitors →
            </Link>
          </div>
          {projectMonitors.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-lg bg-main border border-border flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-text-primary">{m.name}</div>
                <div className="font-mono text-text-muted mt-0.5">{m.url}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-status-success">{m.uptimePercentage}% uptime</span>
                <span className="font-mono text-text-primary">{m.avgLatencyMs}ms</span>
                <StatusBadge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Environment Variables */}
      {activeTab === 'env' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-text-primary">
            Encrypted Environment Variables
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!envKey.trim() || !envVal.trim()) return;
              await saveEnvironmentVariable({
                workspaceId: activeWorkspace.id,
                projectId: project.id,
                environment: envTarget,
                key: envKey,
                rawValue: envVal,
                isSecret: true,
                actorName: user?.displayName || 'Developer',
              });
              setEnvKey('');
              setEnvVal('');
              showToast('Encrypted environment variable saved', 'success');
            }}
            className="grid sm:grid-cols-4 gap-2.5"
          >
            <input
              type="text"
              required
              value={envKey}
              onChange={(e) => setEnvKey(e.target.value)}
              placeholder="STRIPE_SECRET_KEY"
              className="px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
            <input
              type="password"
              required
              value={envVal}
              onChange={(e) => setEnvVal(e.target.value)}
              placeholder="Secret value"
              className="px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
            <select
              value={envTarget}
              onChange={(e) => setEnvTarget(e.target.value as EnvironmentType)}
              className="px-3 py-2 rounded-lg bg-main border border-border text-text-secondary"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="preview">Preview</option>
              <option value="development">Development</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium"
            >
              Add Variable
            </button>
          </form>

          <div className="divide-y divide-border">
            {projectEnvs.map((ev) => (
              <div key={ev.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-text-primary">{ev.key}</span>
                  <span className="px-2 py-0.5 rounded bg-main border border-border text-[10px] uppercase font-mono text-text-secondary">
                    {ev.environment}
                  </span>
                </div>
                <span className="font-mono text-text-muted">{ev.maskedValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Domains */}
      {activeTab === 'domains' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-5 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Custom Domains & SSL Configuration</h2>
            <p className="text-text-secondary mt-0.5">
              Connect apex domains or subdomains. DeployHQ automatically provisions wildcard TLS certificates and routes edge traffic.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newDomain.trim()) return;
              const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
              const updatedDomains = Array.from(
                new Set([...(project.domains || [project.domain]), clean])
              );
              await updateProjectSettings(activeWorkspace.id, project.id, {
                domains: updatedDomains,
                domain: clean,
                productionUrl: `https://${clean}`,
              });
              setNewDomain('');
              showToast(`Custom domain ${clean} attached. Configure DNS records below.`, 'success');
            }}
            className="flex gap-2 max-w-md"
          >
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. app.mycompany.com or edge.domain.dev"
              className="flex-1 px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Domain
            </button>
          </form>

          {/* Domains Listing with DNS Diagnostic */}
          <div className="space-y-4">
            {(project.domains || [project.domain]).map((dom) => {
              const isPrimary = dom === project.domain;
              const result = dnsResults[dom];
              const isVerifying = Boolean(verifyingDomains[dom]);
              const isApex = !dom.includes('.') || dom.split('.').length === 2;
              const hostName = isApex ? '@' : dom.split('.')[0];

              return (
                <div
                  key={dom}
                  className="rounded-xl bg-main border border-border p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="font-mono font-semibold text-sm text-text-primary">{dom}</span>
                      {isPrimary && (
                        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium">
                          Primary
                        </span>
                      )}
                      <a
                        href={`https://${dom}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-muted hover:text-text-primary"
                        title="Open live URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isVerifying}
                        onClick={() => handleVerifyDns(dom)}
                        className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-border border border-border text-text-secondary hover:text-text-primary text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-primary' : ''}`} />
                        <span>{isVerifying ? 'Checking DNS...' : 'Verify DNS'}</span>
                      </button>

                      {!isPrimary && (project.domains || []).length > 1 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = (project.domains || []).filter((d) => d !== dom);
                            await updateProjectSettings(activeWorkspace.id, project.id, {
                              domains: updated,
                            });
                            showToast(`Removed domain ${dom}`, 'info');
                          }}
                          className="p-1.5 rounded-lg bg-card hover:bg-status-error/15 border border-border hover:border-status-error/30 text-text-muted hover:text-status-error transition-colors"
                          title="Remove domain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DNS Record Configuration Helper */}
                  <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-text-secondary">
                      <span className="font-medium text-text-primary">Required DNS Record</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-status-success" /> Auto-renewing TLS 1.3
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-main border border-border">
                        <span className="text-text-muted block text-[10px]">Type</span>
                        <span className="font-mono font-semibold text-text-primary">CNAME</span>
                      </div>
                      <div className="p-2 rounded bg-main border border-border">
                        <span className="text-text-muted block text-[10px]">Host / Name</span>
                        <span className="font-mono font-semibold text-text-primary">{hostName}</span>
                      </div>
                      <div className="p-2 rounded bg-main border border-border sm:col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-text-muted block text-[10px]">Value / Target</span>
                          <span className="font-mono font-semibold text-text-primary">cname.deployhq.dev</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('cname.deployhq.dev');
                            showToast('Copied CNAME target "cname.deployhq.dev"', 'success');
                          }}
                          className="p-1 text-text-muted hover:text-text-primary"
                          title="Copy CNAME value"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Live DoH Result */}
                    {result && (
                      <div className={`mt-2 p-2.5 rounded text-[11px] border flex items-center justify-between ${
                        result.isConfigured
                          ? 'bg-status-success/10 border-status-success/30 text-status-success'
                          : 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                      }`}>
                        <div className="flex items-center gap-2">
                          {result.isConfigured ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            {result.isConfigured
                              ? `DNS Resolved: CNAME points correctly to ${result.records[0]?.data || 'cname.deployhq.dev'}`
                              : `DNS Propagating: Google DoH has not indexed CNAME for ${dom} yet.`}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-75 font-mono">
                          {new Date(result.checkedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 8: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-text-primary">Build Configuration</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-text-secondary mb-1">Build Command</label>
              <input
                type="text"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1">Install Command</label>
              <input
                type="text"
                value={installCommand}
                onChange={(e) => setInstallCommand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1">Output Directory</label>
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
              />
            </div>
          </div>
          <div className="flex items-center justify-start pt-3 border-t border-border">
            <button
              type="button"
              onClick={async () => {
                await updateProjectSettings(activeWorkspace.id, project.id, {
                  buildCommand,
                  installCommand,
                  outputDir,
                });
                showToast('Build settings saved', 'success');
              }}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
            >
              Save Build Settings
            </button>
          </div>

          {/* Danger Zone */}
          {canAdmin && (
            <div className="mt-8 border border-status-error/40 rounded-xl p-5 bg-status-error/5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-error" />
                <h3 className="text-sm font-semibold text-status-error">Danger Zone</h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-status-error/20">
                <div>
                  <div className="font-medium text-text-primary">Delete this Project</div>
                  <p className="text-text-secondary text-[11px] mt-0.5 max-w-md">
                    Permanently delete <strong>{project.name}</strong>, all associated deployment artifacts,
                    {projectDeployments.length} deployment records, and {projectEnvs.length} environment variables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteText('');
                    setDeleteModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-status-error hover:bg-status-error/90 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Project...
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Project Safety Confirmation Modal */}
      {deleteModalOpen && (
        <ModalDialog
          open={true}
          onClose={() => setDeleteModalOpen(false)}
          title={`Delete Project: ${project.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Irreversible Action
              </div>
              <p className="text-[11px] text-text-secondary">
                This action cannot be undone. All active deployments, custom domains, monitoring checks, and encrypted
                environment secrets for <strong>{project.name}</strong> will be permanently deleted.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-text-secondary font-medium">
                To verify, type <span className="font-mono text-text-primary font-bold">"{project.name}"</span> or{' '}
                <span className="font-mono text-text-primary font-bold">"{project.slug}"</span> below:
              </label>
              <input
                type="text"
                placeholder={project.name}
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-status-error text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-2 rounded-lg bg-card border border-border hover:bg-elevated text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isDeleting ||
                  (confirmDeleteText.trim() !== project.name && confirmDeleteText.trim() !== project.slug)
                }
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteProject(activeWorkspace.id, project.id);
                    showToast(`Project ${project.name} deleted`, 'info');
                    setDeleteModalOpen(false);
                    navigate('/projects');
                  } catch (err: any) {
                    showToast(err?.message || 'Failed to delete project', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-status-error hover:bg-status-error/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Deleting...' : 'I understand, delete this project'}
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};

