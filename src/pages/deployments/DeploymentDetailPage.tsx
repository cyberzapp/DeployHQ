import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Rocket,
  GitBranch,
  ExternalLink,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
  Copy,
  Download,
  Pause,
  Play,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Hash,
  Undo2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  subscribeDeploymentLogs,
  triggerDeploymentAction,
  cancelDeploymentAction,
} from '@/services/firebase/firestoreService';
import { StatusBadge } from '@/pages/dashboard/OverviewPage';
import { DeploymentLogEntry, DeploymentTimelineStep } from '@/types';
import { ModalDialog } from '@/components/ui/ModalDialog';

export const DeploymentDetailPage: React.FC = () => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const { user } = useAuth();
  const { activeWorkspace, deployments, canWrite, showToast } = useWorkspace();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<DeploymentLogEntry[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('Critical regression fix');
  const [isRollingBack, setIsRollingBack] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const deployment = deployments.find((d) => d.id === deploymentId);

  const previousHealthyDeployment = deployments.find(
    (d) =>
      d.projectId === deployment?.projectId &&
      d.id !== deployment?.id &&
      d.status === 'ready' &&
      d.environment === deployment?.environment
  );

  const rollbackTarget = deployment?.status === 'failed' ? previousHealthyDeployment : deployment;

  useEffect(() => {
    if (!deploymentId) return;
    const unsub = subscribeDeploymentLogs(activeWorkspace.id, deploymentId, (items) => {
      setLogs(items);
    });
    return () => unsub();
  }, [activeWorkspace.id, deploymentId]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!deployment) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
        <div className="text-sm font-semibold text-text-primary">Deployment record not found</div>
        <Link to="/deployments" className="text-xs text-primary hover:underline">
          ← Back to Deployments
        </Link>
      </div>
    );
  }

  const defaultTimeline: DeploymentTimelineStep[] = [
    { step: 'queued', label: '1. Deployment queued', status: 'completed', timestamp: '00:00.1s' },
    { step: 'fetch', label: '2. Source code fetched', status: 'completed', timestamp: '00:02.4s' },
    { step: 'install', label: '3. Dependencies installed', status: 'completed', timestamp: '00:13.6s' },
    {
      step: 'build',
      label: '4. Build started',
      status: deployment.status === 'failed' ? 'failed' : 'completed',
      timestamp: '00:31.2s',
    },
    {
      step: 'complete',
      label: '5. Build completed',
      status:
        deployment.status === 'ready'
          ? 'completed'
          : deployment.status === 'building'
          ? 'running'
          : 'pending',
      timestamp: deployment.status === 'ready' ? '00:39.8s' : '—',
    },
    {
      step: 'publish',
      label: '6. Deployment published',
      status: deployment.status === 'ready' ? 'completed' : 'pending',
      timestamp: deployment.status === 'ready' ? '00:42.0s' : '—',
    },
  ];

  const timeline = deployment.metadata?.timeline || defaultTimeline;

  const filteredLogs = logs.filter((l) => {
    const matchLevel =
      levelFilter === 'all' ||
      l.level === levelFilter ||
      (levelFilter === 'info' && l.level === 'success');
    const matchText =
      !logSearch.trim() || l.message.toLowerCase().includes(logSearch.toLowerCase());
    return matchLevel && matchText;
  });

  const handleCopyLogs = async () => {
    const text = filteredLogs
      .map((l) => `${l.timestamp} [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    showToast('Build logs copied to clipboard', 'success');
  };

  const handleDownloadLogs = () => {
    const text = filteredLogs
      .map((l) => `${l.timestamp} [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deployment.id}-build.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Link to="/deployments" className="hover:text-text-primary inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Deployments
        </Link>
        <span>/</span>
        <span className="font-mono text-text-primary">{deployment.id}</span>
      </div>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-mono font-semibold text-text-primary">{deployment.id}</h1>
            <StatusBadge status={deployment.status} />
            <span className="px-2 py-0.5 rounded bg-main border border-border font-mono text-xs text-text-secondary capitalize">
              {deployment.environment}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
            <span>
              Project:{' '}
              <Link
                to={`/projects/${deployment.projectId}`}
                className="text-text-primary font-medium hover:text-primary"
              >
                {deployment.projectName}
              </Link>
            </span>
            <span className="font-mono flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-primary" />
              {deployment.branch}@{deployment.commitHash}
            </span>
            {deployment.url && (
              <a
                href={deployment.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-primary hover:underline inline-flex items-center gap-1"
              >
                {deployment.url}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(deployment.status === 'building' || deployment.status === 'queued') && canWrite && (
            <button
              type="button"
              onClick={async () => {
                await cancelDeploymentAction(activeWorkspace.id, deployment.id);
                showToast('Deployment cancelled', 'info');
              }}
              className="px-3 py-2 rounded-lg bg-status-error/15 text-status-error border border-status-error/30 font-medium flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Build
            </button>
          )}
          {deployment.status === 'failed' && previousHealthyDeployment && canWrite && (
            <button
              type="button"
              onClick={() => setRollbackModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-status-error/20 hover:bg-status-error/30 text-status-error border border-status-error/40 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Emergency Rollback to {previousHealthyDeployment.commitHash}
            </button>
          )}

          {deployment.status === 'ready' && canWrite && (
            <button
              type="button"
              onClick={() => setRollbackModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-card hover:bg-elevated text-text-primary border border-border font-medium flex items-center gap-1.5 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5 text-primary" />
              Rollback Target
            </button>
          )}

          <button
            type="button"
            disabled={!canWrite}
            onClick={async () => {
              try {
                const next = await triggerDeploymentAction({
                  workspaceId: activeWorkspace.id,
                  projectId: deployment.projectId,
                  branch: deployment.branch,
                  environment: deployment.environment,
                  actorName: user?.displayName || 'Developer',
                  redeployFromId: deployment.id,
                });
                showToast(`Redeploy ${next.id} started`, 'success');
                navigate(`/deployments/${next.id}`);
              } catch (err: any) {
                showToast(err?.message || 'Redeploy failed', 'error');
              }
            }}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Redeploy
          </button>
        </div>
      </div>

      {/* Metadata + 6-Step Deployment Timeline */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-xs">
          <h2 className="text-sm font-semibold text-text-primary">Deployment Metadata</h2>
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary">Commit Message</span>
              <span className="text-text-primary font-medium text-right max-w-[200px] truncate">
                {deployment.commitMessage}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary">Trigger Source</span>
              <span className="font-mono text-text-primary uppercase">{deployment.trigger}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary">Triggered By</span>
              <span className="text-text-primary">{deployment.triggeredBy}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary">Build Duration</span>
              <span className="font-mono text-text-primary">
                {Math.round((deployment.durationMs || 0) / 1000)}s
              </span>
            </div>
            {deployment.rollbackFromId && (
              <div className="flex justify-between py-1.5 border-b border-border bg-primary/10 px-2 rounded">
                <span className="text-primary font-medium flex items-center gap-1">
                  <Undo2 className="w-3 h-3" />
                  Rolled back from
                </span>
                <Link
                  to={`/deployments/${deployment.rollbackFromId}`}
                  className="font-mono text-primary hover:underline"
                >
                  {deployment.rollbackFromId}
                </Link>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-text-secondary">Created At</span>
              <span className="font-mono text-text-secondary">
                {deployment.createdAt
                  ? new Date(deployment.createdAt).toLocaleString()
                  : 'Just now'}
              </span>
            </div>
          </div>
        </div>

        {/* 6-Step Pipeline Timeline */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Deployment Pipeline Timeline</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {timeline.map((step, i) => (
              <div
                key={step.step + i}
                className="p-3 rounded-lg bg-main border border-border text-xs flex items-start gap-2.5"
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                ) : step.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
                ) : step.status === 'running' ? (
                  <Rocket className="w-4 h-4 text-status-warning animate-pulse shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-medium text-text-primary">{step.label}</div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">
                    {step.durationMs ? `${(step.durationMs / 1000).toFixed(1)}s` : step.timestamp || 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal-Inspired Real-Time Log Viewer */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-elevated border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">Build & Runtime Logs</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-main border border-border text-status-success">
              LIVE STREAM
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter log lines..."
                aria-label="Filter log lines"
                className="pl-8 pr-2.5 py-1 rounded bg-main border border-border text-text-primary text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <select
              aria-label="Filter by log level"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded bg-main border border-border text-text-secondary"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>

            <button
              type="button"
              onClick={() => setAutoScroll((a) => !a)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1 transition-colors ${
                autoScroll
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-main border-border text-text-secondary'
              }`}
              title="Toggle automatic scrolling to latest log line"
            >
              {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {autoScroll ? 'Auto-scroll' : 'Paused'}
            </button>

            <button
              type="button"
              onClick={() => setShowLineNumbers((n) => !n)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1 transition-colors ${
                showLineNumbers
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-main border-border text-text-secondary'
              }`}
              title="Toggle line numbers"
            >
              <Hash className="w-3 h-3" />
              <span>Lines</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMaximized((m) => !m)}
              className="px-2.5 py-1 rounded bg-main hover:bg-border border border-border text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
              title={isMaximized ? 'Restore height' : 'Expand terminal view'}
            >
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              <span>{isMaximized ? 'Collapse' : 'Expand'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLogs}
              className="px-2.5 py-1 rounded bg-main hover:bg-border border border-border text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>

            <button
              type="button"
              onClick={handleDownloadLogs}
              className="px-2.5 py-1 rounded bg-main hover:bg-border border border-border text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>

        <div
          ref={logContainerRef}
          className={`p-4 bg-[#07090E] font-mono text-xs overflow-y-auto space-y-1.5 transition-all ${
            isMaximized ? 'h-[70vh]' : 'max-h-96'
          }`}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-text-muted py-8 text-center font-sans">
              No log lines match the current search or level filters.
            </div>
          ) : (
            filteredLogs.map((line, idx) => {
              const colorClass =
                line.level === 'error'
                  ? 'text-status-error bg-status-error/10 px-2 py-0.5 rounded'
                  : line.level === 'warning'
                  ? 'text-status-warning'
                  : line.level === 'success'
                  ? 'text-status-success font-medium'
                  : 'text-text-secondary';
              return (
                <div key={line.id} className={`flex items-start gap-2.5 leading-relaxed ${colorClass}`}>
                  {showLineNumbers && (
                    <span className="text-text-muted/50 select-none shrink-0 w-8 text-right font-mono text-[11px]">
                      {idx + 1}
                    </span>
                  )}
                  <span className="text-text-muted select-none shrink-0 w-24 text-[11px]">
                    {line.timestamp}
                  </span>
                  <span className="uppercase text-[10px] w-14 shrink-0 select-none opacity-80">
                    [{line.level}]
                  </span>
                  <span className="break-all">{line.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rollback Safety Confirmation Modal */}
      {rollbackModalOpen && rollbackTarget && (
        <ModalDialog
          open={true}
          onClose={() => setRollbackModalOpen(false)}
          title="Instant Zero-Downtime Rollback"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-text-primary">Production Traffic Redirection</div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  You are initiating a zero-downtime rollback for <strong>{deployment.projectName}</strong>.
                  Global Anycast edge nodes will redirect live web traffic to the previous known healthy container build.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-main border border-border">
              <div>
                <span className="text-text-muted block text-[10px]">CURRENT DEPLOYMENT</span>
                <span className="font-mono text-status-error font-medium">{deployment.commitHash}</span>
                <span className="text-[10px] text-text-muted block">({deployment.status})</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">TARGET ROLLBACK BUILD</span>
                <span className="font-mono text-status-success font-semibold">{rollbackTarget.commitHash}</span>
                <span className="text-[10px] text-text-muted block truncate">{rollbackTarget.commitMessage}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-text-secondary font-medium">Rollback Incident Reason</label>
              <input
                type="text"
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="e.g. Critical regression in checkout API"
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary text-xs"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Critical API Regression', 'High Memory Usage', 'Broken Asset Bundles', 'Auth Token Invalidation'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setRollbackReason(tag)}
                    className="px-2 py-0.5 rounded text-[10px] bg-card border border-border text-text-secondary hover:text-text-primary"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setRollbackModalOpen(false)}
                className="px-3 py-2 rounded-lg bg-card border border-border hover:bg-elevated text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRollingBack}
                onClick={async () => {
                  setIsRollingBack(true);
                  try {
                    const next = await triggerDeploymentAction({
                      workspaceId: activeWorkspace.id,
                      projectId: rollbackTarget.projectId,
                      branch: rollbackTarget.branch,
                      environment: rollbackTarget.environment,
                      actorName: user?.displayName || 'Developer',
                      redeployFromId: rollbackTarget.id,
                      isRollback: true,
                      commitMessage: `Rollback to ${rollbackTarget.commitHash} (${rollbackReason.trim()})`,
                    });
                    showToast(`Zero-downtime rollback ${next.id} initiated!`, 'success');
                    setRollbackModalOpen(false);
                    navigate(`/deployments/${next.id}`);
                  } catch (err: any) {
                    showToast(err?.message || 'Rollback failed', 'error');
                  } finally {
                    setIsRollingBack(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-status-error hover:bg-status-error/90 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {isRollingBack ? 'Dispatching Rollback...' : 'Execute Instant Rollback'}
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
