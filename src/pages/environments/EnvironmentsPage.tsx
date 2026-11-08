import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  GitBranch,
  Globe,
  ShieldAlert,
  UploadCloud,
  Download,
  FileCode,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  saveEnvironmentVariable,
  batchSaveEnvironmentVariables,
  removeEnvironmentVariable,
} from '@/services/firebase/firestoreService';
import { StatusBadge } from '@/pages/dashboard/OverviewPage';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { EnvironmentType, EnvironmentVariableMeta } from '@/types';

const ENV_TIERS: EnvironmentType[] = ['production', 'staging', 'preview', 'development'];

export const EnvironmentsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    activeWorkspace,
    projects,
    deployments,
    environments,
    canWrite,
    showToast,
  } = useWorkspace();

  const [selectedEnv, setSelectedEnv] = useState<'all' | EnvironmentType>('all');
  const [selectedProj, setSelectedProj] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Add/Edit Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [varProjectId, setVarProjectId] = useState(projects[0]?.id || '');
  const [varEnv, setVarEnv] = useState<EnvironmentType>('production');
  const [varKey, setVarKey] = useState('');
  const [varValue, setVarValue] = useState('');
  const [varIsSecret, setVarIsSecret] = useState(true);

  // Bulk Import Modal State
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkEnvContent, setBulkEnvContent] = useState('');
  const [bulkTargetEnv, setBulkTargetEnv] = useState<EnvironmentType>('production');
  const [bulkProjectId, setBulkProjectId] = useState(projects[0]?.id || '');

  // Explicit Confirmation Modal for deleting/modifying production variables
  const [confirmDeleteVar, setConfirmDeleteVar] = useState<EnvironmentVariableMeta | null>(null);

  const filteredVars = useMemo(() => {
    return environments.filter((ev) => {
      const matchEnv = selectedEnv === 'all' || ev.environment === selectedEnv;
      const matchProj = selectedProj === 'all' || ev.projectId === selectedProj;
      const matchSearch =
        !search.trim() || ev.key.toLowerCase().includes(search.toLowerCase());
      return matchEnv && matchProj && matchSearch;
    });
  }, [environments, selectedEnv, selectedProj, search]);

  const handleSaveVar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    await saveEnvironmentVariable({
      workspaceId: activeWorkspace.id,
      projectId: varProjectId || projects[0]?.id || 'default',
      environment: varEnv,
      key: varKey,
      rawValue: varValue,
      isSecret: varIsSecret,
      actorName: user?.displayName || 'Developer',
    });
    setVarKey('');
    setVarValue('');
    setAddModalOpen(false);
    showToast(`Environment variable ${varKey.toUpperCase()} saved`, 'success');
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || !bulkEnvContent.trim()) return;

    const lines = bulkEnvContent.split('\n');
    const parsed: Array<{ key: string; value: string; isSecret: boolean }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;

      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      parsed.push({
        key,
        value,
        isSecret: !key.startsWith('NEXT_PUBLIC_') && !key.startsWith('VITE_'),
      });
    }

    if (parsed.length === 0) {
      showToast('No valid KEY=VALUE pairs found in pasted content.', 'error');
      return;
    }

    await batchSaveEnvironmentVariables({
      workspaceId: activeWorkspace.id,
      projectId: bulkProjectId || projects[0]?.id || 'default',
      environment: bulkTargetEnv,
      variables: parsed,
      actorName: user?.displayName || 'Developer',
    });

    setBulkEnvContent('');
    setBulkImportOpen(false);
    showToast(`Imported ${parsed.length} environment variables to ${bulkTargetEnv.toUpperCase()}`, 'success');
  };

  const handleExportEnv = () => {
    const activeTier = selectedEnv === 'all' ? 'production' : selectedEnv;
    const targets = environments.filter((e) => e.environment === activeTier);
    if (targets.length === 0) {
      showToast(`No variables defined for ${activeTier}`, 'info');
      return;
    }

    const content = [
      `# DeployHQ Export — ${activeWorkspace.name} (${activeTier})`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      ...targets.map((t) => `${t.key}=${t.maskedValue}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.${activeTier}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded .env.${activeTier} template`, 'success');
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteVar) return;
    await removeEnvironmentVariable(activeWorkspace.id, confirmDeleteVar.id);
    showToast(`Deleted variable ${confirmDeleteVar.key}`, 'info');
    setConfirmDeleteVar(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Environments & Secrets
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage Development, Preview, Staging, and Production tiers and server-encrypted
            environment variables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportEnv}
            className="px-3 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download .env template for active filter"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .env</span>
          </button>
          <button
            type="button"
            disabled={!canWrite}
            onClick={() => {
              setBulkProjectId(projects[0]?.id || '');
              setBulkImportOpen(true);
            }}
            className="px-3 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-text-secondary hover:text-text-primary disabled:opacity-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Bulk Import (.env)</span>
          </button>
          <button
            type="button"
            disabled={!canWrite}
            onClick={() => {
              setVarProjectId(projects[0]?.id || '');
              setAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Variable
          </button>
        </div>
      </div>

      {/* 4 Environment Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        {ENV_TIERS.map((tier) => {
          const latestDep = deployments.find((d) => d.environment === tier);
          const count = environments.filter((e) => e.environment === tier).length;
          return (
            <div
              key={tier}
              className="p-4 rounded-xl bg-card border border-border flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm capitalize text-text-primary">{tier}</span>
                <StatusBadge status={latestDep?.status || 'idle'} />
              </div>

              <div className="space-y-1 text-[11px] text-text-secondary">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> Branch
                  </span>
                  <span className="font-mono text-text-primary">
                    {latestDep?.branch || (tier === 'production' ? 'main' : tier)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Active Build
                  </span>
                  <span className="font-mono text-text-secondary">
                    {latestDep ? latestDep.id : 'None'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-text-muted">{count} encrypted keys</span>
                <button
                  type="button"
                  onClick={() => setSelectedEnv(selectedEnv === tier ? 'all' : tier)}
                  className="text-primary hover:underline font-medium"
                >
                  {selectedEnv === tier ? 'Show All' : `Filter ${tier}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Environment Variables Filter & Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden text-xs">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search variable key..."
                aria-label="Search environment variables"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-main border border-border text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <select
              aria-label="Filter by environment tier"
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
            >
              <option value="all">All Environments</option>
              {ENV_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by project"
              value={selectedProj}
              onChange={(e) => setSelectedProj(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredVars.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <KeyRound className="w-8 h-8 text-text-muted mx-auto" />
            <div className="font-semibold text-text-primary">No environment variables found</div>
            <p className="text-text-secondary">
              Add encrypted environment variables scoped to Development, Preview, Staging, or
              Production.
            </p>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Environment variables table"
            className="table-wrapper"
          >
            <table className="text-left text-xs">
              <thead className="bg-elevated text-text-secondary border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-medium">Variable Key</th>
                  <th className="py-3 px-4 font-medium">Environment</th>
                  <th className="py-3 px-4 font-medium">Project</th>
                  <th className="py-3 px-4 font-medium">Value / Masked Preview</th>
                  <th className="py-3 px-4 font-medium">Updated By</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVars.map((ev) => {
                  const proj = projects.find((p) => p.id === ev.projectId);
                  const revealed = Boolean(revealedIds[ev.id]);
                  return (
                    <tr key={ev.id} className="hover:bg-elevated/50">
                      <th className="py-3 px-4 font-mono font-semibold text-text-primary">
                        {ev.key}
                      </th>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-main border border-border font-mono text-[10px] uppercase text-text-secondary">
                          {ev.environment}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {proj?.name || ev.projectId}
                      </td>
                      <td className="py-3 px-4 font-mono text-text-secondary">
                        {ev.isSecret && !revealed ? '••••••••••••' : ev.maskedValue}
                      </td>
                      <td className="py-3 px-4 text-text-muted">{ev.updatedBy}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {ev.isSecret && (
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedIds((prev) => ({ ...prev, [ev.id]: !prev[ev.id] }))
                              }
                              title={revealed ? 'Hide preview' : 'Show masked preview'}
                              className="p-1.5 rounded bg-main hover:bg-border border border-border text-text-secondary"
                            >
                              {revealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ev.key);
                              showToast(`Copied key "${ev.key}"`, 'success');
                            }}
                            title="Copy variable key"
                            className="p-1.5 rounded bg-main hover:bg-border border border-border text-text-secondary"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteVar(ev)}
                              title="Delete variable"
                              className="p-1.5 rounded bg-status-error/15 text-status-error border border-status-error/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Variable Modal */}
      <ModalDialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Encrypted Environment Variable"
        description="Raw values are stored exclusively in server-side secret storage and never exposed to client queries."
      >
        <form onSubmit={handleSaveVar} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Project</label>
              <select
                value={varProjectId}
                onChange={(e) => setVarProjectId(e.target.value)}
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
              <label className="block text-text-secondary mb-1 font-medium">
                Target Environment
              </label>
              <select
                value={varEnv}
                onChange={(e) => setVarEnv(e.target.value as EnvironmentType)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                {ENV_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Variable Key</label>
            <input
              type="text"
              required
              value={varKey}
              onChange={(e) => setVarKey(e.target.value)}
              placeholder="DATABASE_URL"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Variable Value</label>
            <input
              type={varIsSecret ? 'password' : 'text'}
              required
              value={varValue}
              onChange={(e) => setVarValue(e.target.value)}
              placeholder="postgres://user:pass@host:5432/db"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-text-primary"
            />
          </div>

          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={varIsSecret}
              onChange={(e) => setVarIsSecret(e.target.checked)}
            />
            <span>Mask value as sensitive secret (Recommended)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-elevated text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
            >
              Save Variable
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Bulk Import Modal */}
      <ModalDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        title="Bulk Import Environment Variables"
        description="Paste lines formatted as KEY=VALUE or KEY='VALUE'. Comments starting with # and blank lines will be ignored."
      >
        <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Project</label>
              <select
                value={bulkProjectId}
                onChange={(e) => setBulkProjectId(e.target.value)}
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
              <label className="block text-text-secondary mb-1 font-medium">
                Target Environment Tier
              </label>
              <select
                value={bulkTargetEnv}
                onChange={(e) => setBulkTargetEnv(e.target.value as EnvironmentType)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                {ENV_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-text-secondary font-medium">Paste .env Content</label>
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <FileCode className="w-3 h-3" /> Standard dotenv format
              </span>
            </div>
            <textarea
              required
              rows={8}
              value={bulkEnvContent}
              onChange={(e) => setBulkEnvContent(e.target.value)}
              placeholder={`# Database configuration\nDATABASE_URL=postgres://user:secret@db.example.com:5432/main\nREDIS_HOST=10.0.1.4\nJWT_SECRET=super-secret-key-123\nNEXT_PUBLIC_APP_URL=https://app.example.com`}
              className="w-full px-3 py-2 rounded-lg bg-main border border-border font-mono text-[11px] text-text-primary resize-y focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Keys starting with <code className="text-primary">NEXT_PUBLIC_</code> or{' '}
              <code className="text-primary">VITE_</code> are treated as public; all others are encrypted and masked.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBulkImportOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-elevated text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Import Variables
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Explicit Confirmation Modal before deleting production/environment variables */}
      <ModalDialog
        open={Boolean(confirmDeleteVar)}
        onClose={() => setConfirmDeleteVar(null)}
        title="Confirm Variable Deletion"
        description="Deleting an environment variable may impact subsequent deployments."
        preventLightDismiss
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Are you sure you want to permanently delete{' '}
              <strong className="font-mono">{confirmDeleteVar?.key}</strong> from the{' '}
              <strong className="uppercase">{confirmDeleteVar?.environment}</strong> environment?
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setConfirmDeleteVar(null)}
              className="px-3.5 py-2 rounded-lg bg-elevated text-text-primary font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirmed}
              className="px-4 py-2 rounded-lg bg-status-error text-white font-medium"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
};

