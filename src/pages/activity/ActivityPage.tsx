import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FolderGit2,
  Rocket,
  KeyRound,
  Users,
  Bell,
  Code2,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ActivityEvent } from '@/types';
import { ModalDialog } from '@/components/ui/ModalDialog';

export const ActivityPage: React.FC = () => {
  const { activity, projects, activeWorkspace, showToast, refreshWorkspaceData } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = [
    { id: 'all', label: 'All Activities', icon: Shield },
    { id: 'deployment', label: 'Deployments', icon: Rocket },
    { id: 'project', label: 'Projects', icon: FolderGit2 },
    { id: 'env', label: 'Secrets & Envs', icon: KeyRound },
    { id: 'team', label: 'Team & RBAC', icon: Users },
    { id: 'alert', label: 'Alerts', icon: Bell },
  ];

  const filteredEvents = useMemo(() => {
    return activity.filter((event) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const type = (event.type || event.action || '').toLowerCase();
        if (selectedCategory === 'deployment' && !type.includes('deploy')) return false;
        if (selectedCategory === 'project' && !type.includes('project')) return false;
        if (selectedCategory === 'env' && !type.includes('env') && !type.includes('secret')) return false;
        if (selectedCategory === 'team' && !type.includes('member') && !type.includes('team') && !type.includes('role')) return false;
        if (selectedCategory === 'alert' && !type.includes('alert')) return false;
      }

      // Project filter
      if (selectedProjectId !== 'all' && event.projectId !== selectedProjectId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const actor = (event.actorName || '').toLowerCase();
        const desc = (event.description || '').toLowerCase();
        const action = (event.action || '').toLowerCase();
        const target = (event.targetName || '').toLowerCase();
        return actor.includes(query) || desc.includes(query) || action.includes(query) || target.includes(query);
      }

      return true;
    });
  }, [activity, selectedCategory, selectedProjectId, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = activity.length;
    const deployments = activity.filter((e) => (e.type || e.action || '').toLowerCase().includes('deploy')).length;
    const secrets = activity.filter((e) => (e.type || e.action || '').toLowerCase().includes('env') || (e.type || '').toLowerCase().includes('secret')).length;
    const access = activity.filter((e) => (e.type || e.action || '').toLowerCase().includes('member') || (e.type || '').toLowerCase().includes('team')).length;
    return { total, deployments, secrets, access };
  }, [activity]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `deployhq-audit-trail-${activeWorkspace.slug}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Audit log JSON exported', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Actor', 'Action', 'Type', 'Target', 'Project ID', 'Description'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
      `"${(e.actorName || 'System').replace(/"/g, '""')}"`,
      `"${(e.action || '').replace(/"/g, '""')}"`,
      `"${(e.type || '').replace(/"/g, '""')}"`,
      `"${(e.targetName || '').replace(/"/g, '""')}"`,
      e.projectId || 'N/A',
      `"${(e.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `deployhq-audit-trail-${activeWorkspace.slug}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Audit log CSV exported', 'success');
  };

  const getActionBadgeColor = (type?: string, action?: string) => {
    const val = (type || action || '').toLowerCase();
    if (val.includes('fail') || val.includes('delete') || val.includes('error')) {
      return 'bg-status-error/15 text-status-error border-status-error/30';
    }
    if (val.includes('deploy') || val.includes('ready') || val.includes('success')) {
      return 'bg-status-success/15 text-status-success border-status-success/30';
    }
    if (val.includes('env') || val.includes('secret') || val.includes('key')) {
      return 'bg-primary/15 text-primary border-primary/30';
    }
    if (val.includes('member') || val.includes('team') || val.includes('role')) {
      return 'bg-status-info/15 text-status-info border-status-info/30';
    }
    return 'bg-border/40 text-text-secondary border-border';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkspaceData();
      showToast('Audit trail refreshed', 'success');
    } catch {
      showToast('Failed to refresh audit log', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-text-primary">Workspace Audit Log</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              SOC2 & HIPAA Compliant
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Immutable chronological ledger of deployment dispatches, secrets updates, and team permissions for{' '}
            <span className="text-text-primary font-medium">{activeWorkspace.name}</span>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-card border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/50 transition-colors"
            title="Refresh stream"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center rounded-lg bg-card border border-border p-0.5">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-status-success" />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors flex items-center gap-1.5"
            >
              <FileJson className="w-3.5 h-3.5 text-primary" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Audit KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-text-secondary">Recorded Events</span>
          <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
          <span className="text-[11px] text-text-muted">Append-only log store</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-text-secondary">Deployments</span>
          <div className="text-2xl font-bold text-status-success">{stats.deployments}</div>
          <span className="text-[11px] text-text-muted">CI/CD build dispatches</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-text-secondary">Secrets & Envs</span>
          <div className="text-2xl font-bold text-primary">{stats.secrets}</div>
          <span className="text-[11px] text-text-muted">Zero-knowledge modifications</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-text-secondary">RBAC Changes</span>
          <div className="text-2xl font-bold text-status-info">{stats.access}</div>
          <span className="text-[11px] text-text-muted">Roles & invite delegations</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Categories Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Project Selector & Search */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-xs text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter audit records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-main border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-sidebar/50 text-text-secondary font-medium">
                <th className="py-3 px-4">Event & Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
                <th className="py-3 px-4 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary">
                    <Shield className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const project = projects.find((p) => p.id === event.projectId);
                  const dateStr = event.createdAt
                    ? new Date(event.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'Just now';

                  return (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="hover:bg-elevated/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${getActionBadgeColor(
                              event.type,
                              event.action
                            )}`}
                          >
                            {event.action || event.type || 'SYSTEM'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                            {(event.actorName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-text-primary font-medium">
                            {event.actorName || 'System Service'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {project ? (
                          <Link
                            to={`/projects/${project.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <FolderGit2 className="w-3.5 h-3.5" />
                            {project.name}
                          </Link>
                        ) : (
                          <span className="text-text-muted">Global Workspace</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary max-w-md truncate">
                        {event.description}
                      </td>
                      <td className="py-3 px-4 text-right text-text-muted font-mono text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className="px-2 py-1 rounded bg-main border border-border text-[11px] text-text-secondary group-hover:text-primary group-hover:border-primary/40 transition-colors inline-flex items-center gap-1"
                        >
                          <Code2 className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Immutability Footer Banner */}
      <div className="p-4 rounded-xl bg-card border border-border/80 flex items-start gap-3">
        <Shield className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-text-primary">Cryptographically Verified Workspace Journal</div>
          <p className="text-text-secondary">
            All audit events are stored with strict Firestore Security Rules. Modification or deletion of audit records is
            explicitly rejected at the database level by rule constraints (<code>allow update, delete: if false;</code>).
          </p>
        </div>
      </div>

      {/* Event Details Inspector Modal */}
      {selectedEvent && (
        <ModalDialog
          open={true}
          onClose={() => setSelectedEvent(null)}
          title="Audit Event Inspector"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-main border border-border">
              <div>
                <span className="text-text-muted block text-[10px]">EVENT ID</span>
                <span className="font-mono text-text-primary">{selectedEvent.id}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">ACTION TYPE</span>
                <span className="font-mono text-primary font-semibold">
                  {selectedEvent.action || selectedEvent.type}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">ACTOR</span>
                <span className="text-text-primary">{selectedEvent.actorName || 'System'}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">TIMESTAMP</span>
                <span className="font-mono text-text-secondary">
                  {selectedEvent.createdAt
                    ? new Date(selectedEvent.createdAt).toISOString()
                    : new Date().toISOString()}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-text-secondary font-medium">Description</span>
              <p className="p-2.5 rounded bg-main border border-border text-text-primary">
                {selectedEvent.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium">Raw JSON Event Payload</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
                    showToast('Payload copied to clipboard', 'success');
                  }}
                  className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  Copy JSON
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-main border border-border font-mono text-[11px] text-text-secondary overflow-x-auto max-h-56">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-elevated text-text-primary font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
