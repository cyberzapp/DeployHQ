import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  LayoutGrid,
  List,
  GitBranch,
  ExternalLink,
  Rocket,
  Clock,
  Globe,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createProject, fetchGitHubRepositories, fetchVercelProjects } from '@/services/firebase/firestoreService';
import { StatusBadge } from '@/pages/dashboard/OverviewPage';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { SupportedFramework } from '@/types';

const FRAMEWORKS: SupportedFramework[] = [
  'Next.js',
  'React',
  'Vite',
  'Vue',
  'Nuxt',
  'SvelteKit',
  'Angular',
  'Node.js',
  'Other',
];

const STARTER_TEMPLATES: Array<{
  name: string;
  framework: SupportedFramework;
  repo: string;
  buildCommand: string;
  outputDir: string;
  description: string;
  badge: string;
}> = [
  {
    name: 'Next.js 15 App Router',
    framework: 'Next.js',
    repo: 'deployhq-starters/nextjs-app-router',
    buildCommand: 'next build',
    outputDir: '.next',
    description: 'Server components, edge SSR, and Tailwind CSS',
    badge: 'Popular',
  },
  {
    name: 'Vite + React SaaS UI',
    framework: 'Vite',
    repo: 'deployhq-starters/vite-react-saas',
    buildCommand: 'vite build',
    outputDir: 'dist',
    description: 'Instant HMR, TypeScript, and compact bundle sizing',
    badge: 'SPA',
  },
  {
    name: 'Node.js Express Microservice',
    framework: 'Node.js',
    repo: 'deployhq-starters/express-rest-api',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    description: 'REST API with JWT session auth and error SDK hooks',
    badge: 'Backend',
  },
  {
    name: 'SvelteKit Edge App',
    framework: 'SvelteKit',
    repo: 'deployhq-starters/sveltekit-edge',
    buildCommand: 'vite build',
    outputDir: 'build',
    description: 'Zero-overhead reactive UI and edge functions',
    badge: 'Edge',
  },
];

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { activeWorkspace, projects, deployments, monitors, canWrite, showToast } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('recent');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [createOpen, setCreateOpen] = useState(false);

  // Create Project Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState<SupportedFramework>('Next.js');
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('main');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [installCommand, setInstallCommand] = useState('npm ci');
  const [outputDir, setOutputDir] = useState('.next');
  const [rootDir, setRootDir] = useState('./');
  const [domain, setDomain] = useState('');
  const [region, setRegion] = useState('iad1 (US East)');
  const [selectedVercelProject, setSelectedVercelProject] = useState('');

  const [availableRepos, setAvailableRepos] = useState<
    Array<{ id: string; name: string; fullName: string; defaultBranch: string; language?: string; private: boolean }>
  >([]);
  const [availableVercelProjects, setAvailableVercelProjects] = useState<
    Array<{ id: string; name: string; framework: string }>
  >([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (createOpen) {
      setLoadingIntegrations(true);
      Promise.all([
        fetchGitHubRepositories(activeWorkspace.id),
        fetchVercelProjects(activeWorkspace.id),
      ])
        .then(([repos, vercels]) => {
          setAvailableRepos(repos);
          setAvailableVercelProjects(vercels);
        })
        .finally(() => setLoadingIntegrations(false));
    }
  }, [createOpen, activeWorkspace.id]);

  const handleSelectRepository = (repoFullName: string) => {
    setRepository(repoFullName);
    const chosen = availableRepos.find((r) => r.fullName === repoFullName);
    if (chosen) {
      const cleanName = chosen.name;
      setName(cleanName);
      setBranch(chosen.defaultBranch || 'main');
      const suggestedDomain = `${cleanName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.deployhq.dev`;
      setDomain(suggestedDomain);
      if (chosen.name.includes('vite') || chosen.name.includes('docs')) {
        setFramework('Vite');
        setOutputDir('dist');
        setBuildCommand('vite build');
      } else if (chosen.name.includes('next') || chosen.name.includes('web') || chosen.name.includes('app')) {
        setFramework('Next.js');
        setOutputDir('.next');
        setBuildCommand('npm run build');
      } else if (chosen.name.includes('svelte') || chosen.name.includes('worker')) {
        setFramework('SvelteKit');
        setOutputDir('build');
        setBuildCommand('npm run build');
      } else if (chosen.name.includes('api') || chosen.name.includes('gateway') || chosen.name.includes('node')) {
        setFramework('Node.js');
        setOutputDir('dist');
        setBuildCommand('npm run build');
      }
    }
  };

  const applyTemplate = (tmpl: typeof STARTER_TEMPLATES[0]) => {
    const slug = tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
    setName(slug);
    setFramework(tmpl.framework);
    setRepository(tmpl.repo);
    setBranch('main');
    setBuildCommand(tmpl.buildCommand);
    setInstallCommand('npm ci');
    setOutputDir(tmpl.outputDir);
    setDescription(tmpl.description);
    setDomain(`${slug}.deployhq.dev`);
    showToast(`Pre-filled configuration for ${tmpl.name}`, 'info');
  };

  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.repository.toLowerCase().includes(search.toLowerCase()) ||
          p.domain.toLowerCase().includes(search.toLowerCase());
        const matchesFw = frameworkFilter === 'all' || p.framework === frameworkFilter;
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesFw && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        const ta = a.lastDeployedAt ? new Date(a.lastDeployedAt).getTime() : 0;
        const tb = b.lastDeployedAt ? new Date(b.lastDeployedAt).getTime() : 0;
        return tb - ta;
      });
  }, [projects, search, frameworkFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      showToast('Viewer role cannot create projects.', 'error');
      return;
    }
    const cleanDomain =
      domain.trim() ||
      `${name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')}.vercel.app`;
    const created = await createProject(
      activeWorkspace.id,
      {
        name: name.trim(),
        description: description.trim(),
        framework,
        repository: repository.trim() || `org/${name.trim().toLowerCase()}`,
        repoUrl: `https://github.com/${repository.trim() || `org/${name.trim().toLowerCase()}`}`,
        branch: branch.trim() || 'main',
        productionBranch: branch.trim() || 'main',
        buildCommand: buildCommand.trim() || 'npm run build',
        installCommand: installCommand.trim() || 'npm ci',
        outputDir: outputDir.trim() || 'dist',
        rootDir: rootDir.trim() || './',
        domain: cleanDomain,
        productionUrl: `https://${cleanDomain.replace(/^https?:\/\//, '')}`,
        region,
        autoDeploy: true,
        createdBy: user?.uid || 'usr_owner',
      },
      user?.displayName || 'Developer'
    );
    showToast(`Project "${created.name}" created`, 'success');
    setCreateOpen(false);
    navigate(`/projects/${created.id}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Projects</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage repositories, build pipelines, production domains, and health checks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!canWrite}
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search projects, repos, domains..."
              aria-label="Search projects"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-main border border-border text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <select
            aria-label="Filter by framework"
            value={frameworkFilter}
            onChange={(e) => {
              setFrameworkFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
          >
            <option value="all">All Frameworks</option>
            {FRAMEWORKS.map((fw) => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
          >
            <option value="all">All Health States</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="failed">Failed</option>
          </select>

          <select
            aria-label="Sort projects"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
            className="px-2.5 py-1.5 rounded-lg bg-main border border-border text-text-secondary"
          >
            <option value="recent">Sort: Last Deployed</option>
            <option value="name">Sort: Alphabetical</option>
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-main border border-border">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`p-1.5 rounded ${
              viewMode === 'grid' ? 'bg-elevated text-primary' : 'text-text-muted'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`p-1.5 rounded ${
              viewMode === 'table' ? 'bg-elevated text-primary' : 'text-text-muted'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {paginated.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <FolderGit2 className="w-9 h-9 text-text-muted mx-auto" />
          <h2 className="text-sm font-semibold text-text-primary">No matching projects found</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Create a new project connected to your GitHub repository and Vercel deployment provider
            to begin tracking deployments and uptime.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium"
          >
            Create First Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((proj) => {
            const latestDep = deployments.find((d) => d.projectId === proj.id);
            const mon = monitors.find((m) => m.projectId === proj.id);
            return (
              <div
                key={proj.id}
                className="bg-card hover:bg-elevated/60 border border-border rounded-xl p-5 flex flex-col justify-between transition-colors shadow-subtle"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/projects/${proj.id}`}
                          className="text-sm font-semibold text-text-primary hover:text-primary truncate block"
                        >
                          {proj.name}
                        </Link>
                        <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                          <span>{proj.framework}</span>
                          <span>•</span>
                          <span>Vercel</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={proj.status} />
                  </div>

                  <div className="p-2.5 rounded-lg bg-main border border-border text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-muted flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Domain
                      </span>
                      <a
                        href={proj.productionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-text-primary hover:text-primary inline-flex items-center gap-1"
                      >
                        {proj.domain}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-muted flex items-center gap-1">
                        <GitBranch className="w-3 h-3" /> Repository
                      </span>
                      <span className="font-mono text-text-secondary truncate max-w-[180px]">
                        {proj.repository}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3 h-3 text-text-muted shrink-0" />
                    {latestDep ? (
                      <span className="truncate font-mono">
                        {latestDep.branch}@{latestDep.commitHash}
                      </span>
                    ) : (
                      <span>No builds yet</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {mon && (
                      <span className="font-mono text-status-success">
                        {mon.uptimePercentage}% up
                      </span>
                    )}
                    <Link
                      to={`/projects/${proj.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      Inspect →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Projects directory table"
          className="bg-card border border-border rounded-xl table-wrapper"
        >
          <table className="text-left text-xs">
            <thead className="bg-elevated text-text-secondary border-b border-border">
              <tr>
                <th className="py-3 px-4 font-medium">Project</th>
                <th className="py-3 px-4 font-medium">Framework</th>
                <th className="py-3 px-4 font-medium">Repository</th>
                <th className="py-3 px-4 font-medium">Production Domain</th>
                <th className="py-3 px-4 font-medium">Health Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((proj) => (
                <tr key={proj.id} className="hover:bg-elevated/50">
                  <th className="py-3 px-4 font-medium text-text-primary">
                    <Link to={`/projects/${proj.id}`} className="hover:text-primary">
                      {proj.name}
                    </Link>
                  </th>
                  <td className="py-3 px-4 text-text-secondary">{proj.framework}</td>
                  <td className="py-3 px-4 font-mono text-text-secondary">{proj.repository}</td>
                  <td className="py-3 px-4 font-mono text-text-primary">{proj.domain}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={proj.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/projects/${proj.id}`}
                      className="px-2.5 py-1 rounded bg-main border border-border text-text-primary hover:border-primary"
                    >
                      Open Workspace
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of{' '}
            {filtered.length} projects
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded bg-card border border-border disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-card border border-border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <ModalDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Project"
        description="Configure your GitHub repository, framework build pipeline, and deployment domain."
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
          {/* Quick Starter Templates */}
          <div className="space-y-1.5 p-3 rounded-xl bg-main border border-border">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                1-Click Official Starters
              </span>
              <span className="text-text-muted">Pre-configures build commands & framework</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {STARTER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="p-2.5 rounded-lg bg-card hover:bg-elevated border border-border hover:border-primary/50 text-left transition-colors group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary truncate">{tmpl.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-main border border-border text-primary font-mono shrink-0">
                      {tmpl.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted truncate mt-0.5">{tmpl.description}</span>
                </button>
              ))}
            </div>
          </div>

          {availableRepos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-text-secondary font-medium">
                  Select Connected GitHub Repository
                </label>
                <span className="text-[10px] text-primary font-mono">
                  {availableRepos.length} repos available
                </span>
              </div>
              <select
                aria-label="Select connected GitHub repository"
                value={repository}
                onChange={(e) => handleSelectRepository(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              >
                <option value="">-- Choose from GitHub or type manually below --</option>
                {availableRepos.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.fullName} ({repo.defaultBranch})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Project Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="checkout-service"
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Framework *</label>
              <select
                value={framework}
                onChange={(e) => {
                  const fw = e.target.value as SupportedFramework;
                  setFramework(fw);
                  setOutputDir(fw === 'Next.js' ? '.next' : fw === 'SvelteKit' ? 'build' : 'dist');
                }}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
              >
                {FRAMEWORKS.map((fw) => (
                  <option key={fw} value={fw}>
                    {fw}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1 font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Edge API and checkout web experience"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">
                GitHub Repository (owner/repo) *
              </label>
              <input
                type="text"
                required
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="acme-cloud/checkout-service"
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Default Branch *</label>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              />
            </div>
          </div>

          {availableVercelProjects.length > 0 && (
            <div>
              <label className="block text-text-secondary mb-1 font-medium">
                Link to Vercel Deployment Project (Optional)
              </label>
              <select
                value={selectedVercelProject}
                onChange={(e) => setSelectedVercelProject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              >
                <option value="">-- Auto-create / standalone --</option>
                {availableVercelProjects.map((vp) => (
                  <option key={vp.id} value={vp.name}>
                    {vp.name} ({vp.framework})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Install Command</label>
              <input
                type="text"
                value={installCommand}
                onChange={(e) => setInstallCommand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Build Command</label>
              <input
                type="text"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Output Directory</label>
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Root Directory</label>
              <input
                type="text"
                value={rootDir}
                onChange={(e) => setRootDir(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-1 font-medium">
                Production Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="checkout.acme.dev"
                className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
              <Rocket className="w-3.5 h-3.5" />
              Create Project
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

