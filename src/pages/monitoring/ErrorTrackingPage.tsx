import React, { useState, useMemo } from 'react';
import {
  Terminal,
  AlertOctagon,
  CheckCircle2,
  Plus,
  Search,
  Fingerprint,
  Code2,
  Zap,
  BookOpen,
  Copy,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  ingestApplicationError,
  updateErrorStatus,
} from '@/services/firebase/firestoreService';
import { StatusBadge } from '@/pages/dashboard/OverviewPage';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { EnvironmentType, ErrorEventRecord } from '@/types';

export const ErrorTrackingPage: React.FC = () => {
  const { activeWorkspace, projects, errors, canWrite, showToast } = useWorkspace();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [selectedError, setSelectedError] = useState<ErrorEventRecord | null>(
    errors[0] || null
  );
  const [ingestOpen, setIngestOpen] = useState(false);
  const [sdkModalOpen, setSdkModalOpen] = useState(false);
  const [sdkTab, setSdkTab] = useState<'node' | 'browser' | 'curl'>('node');

  // Ingest Error Form
  const [errProjectId, setErrProjectId] = useState(projects[0]?.id || '');
  const [errEnv, setErrEnv] = useState<EnvironmentType>('production');
  const [errType, setErrType] = useState('DatabaseTimeoutError');
  const [errMessage, setErrMessage] = useState(
    'Query read timeout after 3000ms on primary replica'
  );
  const [errStack, setErrStack] = useState(
    `DatabaseTimeoutError: Query read timeout after 3000ms on primary replica\n    at PoolClient.query (/app/node_modules/pg/lib/client.js:526:17)\n    at OrderRepository.findByUser (/app/src/repositories/orderRepo.ts:74:12)`
  );

  const handleSendTestError = async () => {
    if (!canWrite) return;
    const proj = projects[0];
    const testErrors = [
      {
        type: 'UnhandledPromiseRejection',
        message: 'Failed to fetch telemetry batch: Gateway 504 Timeout',
        stack: `UnhandledPromiseRejection: Failed to fetch telemetry batch: Gateway 504 Timeout\n    at async TelemetryClient.flush (/app/src/lib/telemetry.ts:88:14)\n    at async runBatchWorker (/app/src/workers/telemetryWorker.ts:42:7)`,
      },
      {
        type: 'TypeError',
        message: "Cannot read properties of undefined (reading 'jwtToken')",
        stack: `TypeError: Cannot read properties of undefined (reading 'jwtToken')\n    at verifySession (/app/src/auth/session.ts:62:28)\n    at authenticateMiddleware (/app/src/middleware/auth.ts:19:11)`,
      },
      {
        type: 'PostgreSQLError',
        message: 'connection to server at "10.0.4.12", port 5432 failed: FATAL: remaining connection slots are reserved for non-replication superuser connections',
        stack: `PostgreSQLError: connection to server at "10.0.4.12", port 5432 failed\n    at Connection.parseE (/app/node_modules/pg/lib/connection.js:614:13)\n    at Connection.parseMessage (/app/node_modules/pg/lib/connection.js:413:19)`,
      },
    ];
    const pick = testErrors[Math.floor(Math.random() * testErrors.length)];
    const rec = await ingestApplicationError({
      workspaceId: activeWorkspace.id,
      projectId: proj?.id || 'default-service',
      projectName: proj?.name || 'Production Gateway',
      environment: 'production',
      type: pick.type,
      message: pick.message,
      stackTrace: pick.stack,
    });
    setSelectedError(rec);
    showToast(`Test error captured: ${pick.type} (Count: ${rec.count})`, 'success');
  };

  const filteredErrors = useMemo(() => {
    return errors.filter((e) => {
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchSearch =
        !search.trim() ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.fingerprint.toLowerCase().includes(search.toLowerCase()) ||
        e.projectName.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [errors, statusFilter, search]);

  const totalOccurrences = errors.reduce((s, e) => s + e.count, 0);
  const unresolvedCount = errors.filter((e) => e.status === 'unresolved').length;
  const affectedProjectsCount = new Set(errors.map((e) => e.projectId)).size;

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === errProjectId) || projects[0];
    const rec = await ingestApplicationError({
      workspaceId: activeWorkspace.id,
      projectId: proj?.id || 'proj_default',
      projectName: proj?.name || 'default-service',
      environment: errEnv,
      type: errType,
      message: errMessage,
      stackTrace: errStack,
    });
    setSelectedError(rec);
    setIngestOpen(false);
    showToast(
      `Ingested & fingerprinted error (${rec.fingerprint.slice(0, 8)} • count: ${rec.count})`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Error Tracking & Stack Traces
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Deduplicated exception groups via deterministic fingerprinting, stack trace inspection,
            and release resolution.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSdkModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>SDK Setup</span>
          </button>
          <button
            type="button"
            disabled={!canWrite}
            onClick={handleSendTestError}
            className="px-3 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-text-secondary hover:text-status-warning disabled:opacity-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Simulate runtime exception and test fingerprint grouping"
          >
            <Zap className="w-3.5 h-3.5 text-status-warning" />
            <span>Send Test Error</span>
          </button>
          <button
            type="button"
            disabled={!canWrite}
            onClick={() => setIngestOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Custom Event</span>
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Unique Fingerprinted Issues</div>
          <div className="text-2xl font-mono font-semibold text-text-primary mt-1">
            {errors.length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Unresolved Issues</div>
          <div className="text-2xl font-mono font-semibold text-status-error mt-1">
            {unresolvedCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Total Event Frequency</div>
          <div className="text-2xl font-mono font-semibold text-status-warning mt-1">
            {totalOccurrences}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-text-secondary">Affected Projects</div>
          <div className="text-2xl font-mono font-semibold text-status-info mt-1">
            {affectedProjectsCount}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-card border border-border rounded-xl p-3 text-xs">
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search error message, fingerprint..."
            aria-label="Search errors"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-main border border-border text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <select
          aria-label="Filter by error resolution status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
        >
          <option value="all">All Statuses</option>
          <option value="unresolved">Unresolved Only</option>
          <option value="resolved">Resolved Only</option>
        </select>
      </div>

      {/* Split View: Error List + Stack Trace Inspector */}
      <div className="grid lg:grid-cols-5 gap-5 text-xs">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {filteredErrors.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <AlertOctagon className="w-8 h-8 text-text-muted mx-auto" />
              <div className="font-semibold text-text-primary">Zero matching errors</div>
              <p className="text-text-secondary">All application services are running cleanly.</p>
            </div>
          ) : (
            filteredErrors.map((err) => (
              <button
                key={err.id}
                type="button"
                onClick={() => setSelectedError(err)}
                className={`w-full p-4 text-left space-y-1.5 transition-colors ${
                  selectedError?.id === err.id ? 'bg-primary/10' : 'hover:bg-elevated/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-semibold text-text-primary line-clamp-1">
                    {err.type}
                  </span>
                  <StatusBadge status={err.status} />
                </div>
                <p className="text-text-secondary line-clamp-2">{err.message}</p>
                <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                  <span>{err.projectName}</span>
                  <span className="font-mono">{err.count} events</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Stack Trace Detail Viewer */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 space-y-4">
          {!selectedError ? (
            <div className="text-center py-12 text-text-muted">
              Select an error group to inspect its stack trace and metadata.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-status-error">
                      {selectedError.type}
                    </span>
                    <StatusBadge status={selectedError.status} />
                  </div>
                  <p className="text-text-primary font-medium">{selectedError.message}</p>
                </div>

                {canWrite && (
                  <button
                    type="button"
                    onClick={async () => {
                      const next =
                        selectedError.status === 'resolved' ? 'unresolved' : 'resolved';
                      await updateErrorStatus(activeWorkspace.id, selectedError.id, next);
                      setSelectedError({ ...selectedError, status: next });
                      showToast(`Marked issue as ${next}`, 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-border border border-border text-text-primary font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    {selectedError.status === 'resolved' ? 'Reopen Issue' : 'Mark Resolved'}
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-main border border-border">
                  <div className="text-text-muted flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-primary" /> Fingerprint
                  </div>
                  <div className="font-mono text-text-primary mt-1 truncate">
                    {selectedError.fingerprint}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-main border border-border">
                  <div className="text-text-muted">Occurrences / Users</div>
                  <div className="font-mono text-text-primary mt-1">
                    {selectedError.count} events • {selectedError.affectedUsers} users
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-main border border-border">
                  <div className="text-text-muted">Environment & Release</div>
                  <div className="font-mono text-text-primary mt-1">
                    {selectedError.environment} ({selectedError.release || 'HEAD'})
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-text-secondary font-medium flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  Stack Trace
                </div>
                <pre className="p-4 rounded-lg bg-[#07090E] border border-border font-mono text-[11px] text-text-primary overflow-x-auto leading-relaxed">
                  {selectedError.stackTrace}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ingest Error Modal */}
      <ModalDialog
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        title="Ingest Application Error Event"
        description="Simulates sending an exception payload to POST /api/ingest/errors. Identical fingerprints increment the existing group counter."
      >
        <form onSubmit={handleIngestSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Project</label>
              <select
                value={errProjectId}
                onChange={(e) => setErrProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Environment</label>
              <select
                value={errEnv}
                onChange={(e) => setErrEnv(e.target.value as EnvironmentType)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="preview">Preview</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Exception Type</label>
            <input
              type="text"
              required
              value={errType}
              onChange={(e) => setErrType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Error Message</label>
            <input
              type="text"
              required
              value={errMessage}
              onChange={(e) => setErrMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Stack Trace</label>
            <textarea
              rows={4}
              required
              value={errStack}
              onChange={(e) => setErrStack(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIngestOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-elevated text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              Ingest & Fingerprint Error
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* SDK Setup & Snippets Modal */}
      <ModalDialog
        open={sdkModalOpen}
        onClose={() => setSdkModalOpen(false)}
        title="DeployHQ Error Tracking SDK Setup"
        description="Integrate automatic exception capture and deterministic error fingerprinting into your backend or frontend services."
      >
        <div className="space-y-4 text-xs">
          {/* Tabs */}
          <div className="flex border-b border-border gap-2">
            {[
              { id: 'node', label: 'Node.js / Express' },
              { id: 'browser', label: 'React / Next.js / Browser' },
              { id: 'curl', label: 'cURL / REST API' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSdkTab(tab.id as any)}
                className={`pb-2 font-medium border-b-2 transition-colors ${
                  sdkTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {sdkTab === 'node' && (
            <div className="space-y-3">
              <p className="text-text-secondary">
                Install the SDK client or import the typed helper from <code className="text-primary font-mono">src/sdk/deployhq-client.ts</code>:
              </p>
              <div className="relative">
                <pre className="p-3.5 rounded-lg bg-main border border-border font-mono text-[11px] text-text-primary overflow-x-auto">
{`import { DeployHQClient } from '@deployhq/sdk';

// Initialize at server bootstrap
DeployHQClient.init({
  workspaceId: '${activeWorkspace.id}',
  projectId: '${projects[0]?.id || 'project_id'}',
  environment: process.env.NODE_ENV || 'production',
  release: process.env.COMMIT_SHA || 'v1.0.0',
});

// Express error handling middleware
app.use((err, req, res, next) => {
  DeployHQClient.captureException(err, {
    path: req.path,
    method: req.method,
  });
  res.status(500).json({ error: 'Internal Server Error' });
});`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`import { DeployHQClient } from '@deployhq/sdk';\n\nDeployHQClient.init({\n  workspaceId: '${activeWorkspace.id}',\n  projectId: '${projects[0]?.id || 'project_id'}',\n  environment: process.env.NODE_ENV || 'production',\n});`);
                    showToast('Copied Node.js snippet', 'success');
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded bg-elevated hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                  title="Copy snippet"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {sdkTab === 'browser' && (
            <div className="space-y-3">
              <p className="text-text-secondary">
                Set up global unhandled rejection & window onerror listeners in your frontend entrypoint:
              </p>
              <div className="relative">
                <pre className="p-3.5 rounded-lg bg-main border border-border font-mono text-[11px] text-text-primary overflow-x-auto">
{`import { DeployHQClient } from '@/sdk/deployhq-client';

DeployHQClient.init({
  workspaceId: '${activeWorkspace.id}',
  projectId: '${projects[0]?.id || 'project_id'}',
  environment: import.meta.env.MODE || 'production',
  attachGlobalListeners: true, // Auto-captures window.onerror & promise rejections
});

// Explicit exception capture inside React Error Boundaries
try {
  riskyOperation();
} catch (error) {
  DeployHQClient.captureException(error, { component: 'CheckoutModal' });
}`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`DeployHQClient.init({\n  workspaceId: '${activeWorkspace.id}',\n  projectId: '${projects[0]?.id || 'project_id'}',\n  environment: 'production',\n  attachGlobalListeners: true,\n});`);
                    showToast('Copied Browser snippet', 'success');
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded bg-elevated hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                  title="Copy snippet"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {sdkTab === 'curl' && (
            <div className="space-y-3">
              <p className="text-text-secondary">
                Directly POST JSON payloads to the Cloud Function ingestion endpoint:
              </p>
              <div className="relative">
                <pre className="p-3.5 rounded-lg bg-main border border-border font-mono text-[11px] text-text-primary overflow-x-auto">
{`curl -X POST "https://ingest-errors-api.deployhq.dev/v1/events" \\
  -H "Content-Type: application/json" \\
  -H "X-DeployHQ-Workspace: ${activeWorkspace.id}" \\
  -d '{
    "projectId": "${projects[0]?.id || 'project_id'}",
    "projectName": "${projects[0]?.name || 'web-app'}",
    "environment": "production",
    "type": "NetworkTimeoutError",
    "message": "Upstream socket hang up during POST /v2/orders",
    "stackTrace": "NetworkTimeoutError: Upstream socket hang up\\n    at Socket.onTimeout (/src/http.ts:44:11)"
  }'`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`curl -X POST "https://ingest-errors-api.deployhq.dev/v1/events" \\\n  -H "Content-Type: application/json" \\\n  -d '{"workspaceId":"${activeWorkspace.id}","projectId":"${projects[0]?.id || 'project_id'}","type":"TestError","message":"Sample message"}'`);
                    showToast('Copied cURL command', 'success');
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded bg-elevated hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                  title="Copy cURL command"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setSdkModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
};
