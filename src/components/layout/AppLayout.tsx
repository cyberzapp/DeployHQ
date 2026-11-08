import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Rocket,
  Activity,
  Terminal,
  BarChart3,
  Bell,
  Blocks,
  KeyRound,
  Users,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  HelpCircle,
  BookOpen,
  LifeBuoy,
  LogOut,
  CheckCheck,
  Sparkles,
  UserPlus,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/firebase/firestoreService';
import { ModalDialog } from '@/components/ui/ModalDialog';

export const AppLayout: React.FC = () => {
  const { user, signOut, updateUserProfileData } = useAuth();
  const {
    workspaces,
    activeWorkspace,
    currentRole,
    projects,
    notifications,
    selectedProjectId,
    setSelectedProjectId,
    switchWorkspace,
    createNewWorkspace,
    showToast,
  } = useWorkspace();

  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createWsModalOpen, setCreateWsModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create Workspace Form
  const [newWsName, setNewWsName] = useState('');
  const [newWsSlug, setNewWsSlug] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleTheme = async () => {
    const current = user?.preferences?.theme || 'dark';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    await updateUserProfileData({
      preferences: {
        ...user?.preferences,
        theme: nextTheme,
      },
    });
    showToast(`Theme switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} mode`, 'info');
  };

  const mainNav = [
    { label: 'Overview', to: '/overview', icon: LayoutDashboard },
    { label: 'Projects', to: '/projects', icon: FolderGit2 },
    { label: 'Deployments', to: '/deployments', icon: Rocket },
    { label: 'Monitoring', to: '/monitoring', icon: Activity },
    { label: 'Logs & Errors', to: '/logs', icon: Terminal },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Alerts', to: '/alerts', icon: Bell },
  ];

  const managementNav = [
    { label: 'Integrations', to: '/integrations', icon: Blocks },
    { label: 'Environments', to: '/environments', icon: KeyRound },
    { label: 'Team Members', to: '/team', icon: Users },
    { label: 'Audit Log', to: '/activity', icon: Shield },
    { label: 'Billing', to: '/billing', icon: CreditCard },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentBreadcrumb =
    pathSegments.length === 0
      ? 'Overview'
      : pathSegments.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ');

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const slug =
      newWsSlug.trim() ||
      newWsName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
    await createNewWorkspace(newWsName.trim(), slug, 'free');
    setNewWsName('');
    setNewWsSlug('');
    setCreateWsModalOpen(false);
    setWsDropdownOpen(false);
  };

  const filteredSearchProjects = globalSearch.trim()
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
          p.repository.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-main text-text-primary flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-border transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand + Workspace Switcher */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
            <Link to="/overview" className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
                <Rocket className="w-4 h-4 text-primary" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold text-sm tracking-tight text-text-primary">
                    DeployHQ
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-elevated text-text-secondary border border-border">
                    {activeWorkspace.plan}
                  </span>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label="Toggle sidebar width"
              className="hidden lg:flex p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close mobile menu"
              className="lg:hidden p-1 rounded-md text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setWsDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-card hover:bg-elevated border border-border text-left transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-text-primary truncate">
                    {activeWorkspace.name}
                  </div>
                  <div className="text-[11px] text-text-muted truncate flex items-center gap-1.5">
                    <span>/{activeWorkspace.slug}</span>
                    {activeWorkspace.isDemo && (
                      <span className="text-[10px] text-status-warning font-medium">
                        • Demo Data
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
              </button>

              {wsDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-lg bg-elevated border border-border shadow-elevated z-50 py-1.5 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    Switch Workspace
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setWsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-card ${
                        ws.id === activeWorkspace.id
                          ? 'text-primary font-medium'
                          : 'text-text-secondary'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.isDemo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning">
                          Demo
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setWsDropdownOpen(false);
                        setCreateWsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-primary hover:bg-card font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWsDropdownOpen(false);
                        navigate('/team');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-card"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Invite Members
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWsDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-card"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Workspace Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          <div>
            {!sidebarCollapsed && (
              <div className="px-2.5 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Platform
              </div>
            )}
            <div className="space-y-0.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'text-text-secondary hover:text-text-primary hover:bg-card'
                      }`
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div>
            {!sidebarCollapsed && (
              <div className="px-2.5 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Management
              </div>
            )}
            <div className="space-y-0.5">
              {managementNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'text-text-secondary hover:text-text-primary hover:bg-card'
                      }`
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Profile & Docs Section */}
        <div className="p-2.5 border-t border-border space-y-1">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1 pb-1">
              <Link
                to="/docs"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] text-text-secondary hover:text-text-primary hover:bg-card transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Docs
              </Link>
              <Link
                to="/status"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] text-text-secondary hover:text-text-primary hover:bg-card transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-status-success" />
                Status
              </Link>
              <button
                type="button"
                onClick={() =>
                  showToast('DeployHQ Support: support@deployhq.dev (SLA < 2h)', 'info')
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] text-text-secondary hover:text-text-primary hover:bg-card transition-colors"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                Help
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {(user?.displayName || 'A').charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-medium text-text-primary truncate">
                    {user?.displayName}
                  </div>
                  <div className="text-[10px] text-text-muted truncate flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-primary" />
                    <span className="capitalize">{currentRole}</span>
                  </div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                aria-label="Account settings"
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clearly labelled Demo Workspace banner */}
        {activeWorkspace.isDemo && (
          <div className="bg-primary/10 border-b border-primary/25 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-text-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                <strong>Demonstration Workspace:</strong> You are viewing realistic sample telemetry
                in <em>{activeWorkspace.name}</em>. Sample records are strictly isolated from
                production workspaces.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCreateWsModalOpen(true)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Create Real Workspace →
              </button>
              <Link
                to="/onboarding"
                className="text-xs text-text-secondary hover:text-text-primary underline"
              >
                Setup Wizard
              </Link>
            </div>
          </div>
        )}

        {/* Top Navigation Bar */}
        <header className="h-14 bg-sidebar/80 backdrop-blur border-b border-border px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-card"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs text-text-secondary truncate">
              <span className="font-medium text-text-muted hidden sm:inline">
                {activeWorkspace.slug}
              </span>
              <span className="hidden sm:inline text-text-muted">/</span>
              <span className="font-medium text-text-primary truncate">{currentBreadcrumb}</span>
            </div>

            {/* Project Filter Selector */}
            {projects.length > 0 && (
              <select
                aria-label="Filter by project"
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                className="hidden md:block ml-2 px-2.5 py-1 rounded-md bg-card border border-border text-xs text-text-secondary focus:outline-none focus:border-primary"
              >
                <option value="">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.framework})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right Top Controls */}
          <div className="flex items-center gap-2.5">
            {/* Global Search / Command Palette Trigger */}
            <button
              type="button"
              onClick={() => {
                setPaletteQuery('');
                setCommandPaletteOpen(true);
              }}
              className="hidden sm:flex items-center justify-between w-56 lg:w-64 px-3 py-1.5 rounded-lg bg-card hover:bg-elevated border border-border text-xs text-text-muted hover:text-text-primary transition-colors text-left"
              aria-label="Open command palette"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Search or jump to...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-main border border-border text-[10px] font-mono text-text-muted shrink-0">
                ⌘K
              </kbd>
            </button>

            {/* Quick-Create Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setQuickCreateOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New</span>
              </button>
              {quickCreateOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-elevated border border-border shadow-elevated py-1 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCreateOpen(false);
                      navigate('/projects?create=true');
                    }}
                    className="w-full px-3 py-2 text-left text-text-primary hover:bg-card flex items-center gap-2"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                    New Project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCreateOpen(false);
                      navigate('/deployments?trigger=true');
                    }}
                    className="w-full px-3 py-2 text-left text-text-primary hover:bg-card flex items-center gap-2"
                  >
                    <Rocket className="w-3.5 h-3.5 text-status-success" />
                    Trigger Deployment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCreateOpen(false);
                      navigate('/monitoring?create=true');
                    }}
                    className="w-full px-3 py-2 text-left text-text-primary hover:bg-card flex items-center gap-2"
                  >
                    <Activity className="w-3.5 h-3.5 text-status-info" />
                    Create Uptime Check
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCreateOpen(false);
                      navigate('/alerts?create=true');
                    }}
                    className="w-full px-3 py-2 text-left text-text-primary hover:bg-card flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5 text-status-warning" />
                    Configure Alert Rule
                  </button>
                </div>
              )}
            </div>

            {/* Notification Center Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Open notifications"
                className="relative p-1.5 rounded-lg bg-card hover:bg-elevated border border-border text-text-secondary hover:text-text-primary transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-error text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-elevated border border-border shadow-elevated z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">Notifications</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border text-text-secondary">
                        {unreadCount} unread
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllNotificationsRead(activeWorkspace.id)}
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-text-muted">
                        No notifications in this workspace.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const sevColor =
                          n.severity === 'critical'
                            ? 'bg-status-error/15 text-status-error border-status-error/30'
                            : n.severity === 'warning'
                            ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                            : n.severity === 'success'
                            ? 'bg-status-success/15 text-status-success border-status-success/30'
                            : 'bg-primary/15 text-primary border-primary/30';

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.read) markNotificationRead(activeWorkspace.id, n.id);
                              if (n.link) {
                                setNotifOpen(false);
                                navigate(n.link);
                              }
                            }}
                            className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-elevated/80 ${
                              n.read ? 'bg-card/40 text-text-secondary' : 'bg-card text-text-primary'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase border ${sevColor}`}>
                                  {n.severity || 'info'}
                                </span>
                                <span className="font-medium truncate">{n.title}</span>
                              </div>
                              {!n.read && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationRead(activeWorkspace.id, n.id);
                                  }}
                                  className="text-[10px] text-primary hover:underline shrink-0"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-text-secondary mt-1">{n.message}</p>
                            {n.link && (
                              <div className="flex items-center gap-1 text-[10px] text-primary font-mono mt-1.5">
                                <span>Inspect resource</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-1.5 rounded-lg bg-card hover:bg-elevated border border-border text-text-secondary hover:text-text-primary transition-colors"
              title={`Switch to ${user?.preferences?.theme === 'light' ? 'Dark' : 'Light'} mode`}
            >
              {user?.preferences?.theme === 'light' ? (
                <Moon className="w-4 h-4 text-primary" />
              ) : (
                <Sun className="w-4 h-4 text-status-warning" />
              )}
            </button>

            {/* Help Button */}
            <button
              type="button"
              onClick={() => setDocsModalOpen(true)}
              aria-label="Documentation and SDK help"
              className="p-1.5 rounded-lg bg-card hover:bg-elevated border border-border text-text-secondary hover:text-text-primary"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-label="User account menu"
                className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-semibold text-primary"
              >
                {(user?.displayName || 'A').charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-elevated border border-border shadow-elevated py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="font-medium text-text-primary truncate">
                      {user?.displayName}
                    </div>
                    <div className="text-[11px] text-text-muted truncate">{user?.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full px-3 py-2 text-left text-text-secondary hover:text-text-primary hover:bg-card flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Account Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/onboarding');
                    }}
                    className="w-full px-3 py-2 text-left text-text-secondary hover:text-text-primary hover:bg-card flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Onboarding Setup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      toggleTheme();
                    }}
                    className="w-full px-3 py-2 text-left text-text-secondary hover:text-text-primary hover:bg-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {user?.preferences?.theme === 'light' ? (
                        <Moon className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-status-warning" />
                      )}
                      <span>Theme: {user?.preferences?.theme === 'light' ? 'Light' : 'Dark'}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">Toggle</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut();
                      navigate('/login');
                    }}
                    className="w-full px-3 py-2 text-left text-status-error hover:bg-card flex items-center gap-2 border-t border-border mt-1 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Create Workspace Modal */}
      <ModalDialog
        open={createWsModalOpen}
        onClose={() => setCreateWsModalOpen(false)}
        title="Create New Workspace"
        description="Workspaces isolate projects, deployments, team members, and billing."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4 text-xs">
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Workspace Name</label>
            <input
              type="text"
              required
              autoFocus
              value={newWsName}
              onChange={(e) => {
                setNewWsName(e.target.value);
                setNewWsSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                );
              }}
              placeholder="e.g. FinTech Core Engineering"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary mb-1 font-medium">Workspace Slug</label>
            <input
              type="text"
              required
              value={newWsSlug}
              onChange={(e) => setNewWsSlug(e.target.value)}
              placeholder="fintech-core"
              className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateWsModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-elevated hover:bg-border text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Docs & Error Ingestion SDK Modal */}
      <ModalDialog
        open={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        title="DeployHQ Developer Documentation & Error Ingestion SDK"
        description="Integrate your applications with DeployHQ webhooks and error tracking."
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-main border border-border">
            <div className="font-semibold text-text-primary mb-1">
              1. HTTP Error Ingestion Endpoint
            </div>
            <p className="text-text-secondary mb-2">
              Send uncaught exceptions from Node.js, Next.js, or browser apps to automatically
              fingerprint and deduplicate errors:
            </p>
            <pre className="p-3 rounded bg-sidebar border border-border font-mono text-[11px] text-text-primary overflow-x-auto">
{`POST /api/ingest/errors
Content-Type: application/json

{
  "workspaceId": "${activeWorkspace.id}",
  "projectId": "${projects[0]?.id || 'proj_id'}",
  "environment": "production",
  "type": "TypeError",
  "message": "Cannot read properties of null",
  "stackTrace": "TypeError: Cannot read properties of null\\n  at handler (/app/index.js:42:11)"
}`}
            </pre>
          </div>
          <div className="p-3.5 rounded-lg bg-main border border-border">
            <div className="font-semibold text-text-primary mb-1">
              2. GitHub & Vercel Webhook Endpoints
            </div>
            <p className="text-text-secondary">
              Configure HMAC-signed webhooks pointing to{' '}
              <code className="font-mono text-primary">/api/webhooks/github</code> and{' '}
              <code className="font-mono text-primary">/api/webhooks/vercel</code>. Duplicate
              delivery IDs are automatically ignored.
            </p>
          </div>
        </div>
      </ModalDialog>

      {/* Global Command Palette (Cmd+K) Modal */}
      <ModalDialog
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        title="DeployHQ Command Center"
        description="Jump to any page, switch projects, or trigger quick deployment actions."
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          {/* Palette Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
              placeholder="Type a command or search (e.g. 'Deploy', 'Logs', 'Variables')..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-main border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 divide-y divide-border pr-1">
            {/* Quick Actions */}
            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-mono uppercase text-text-muted px-2 font-semibold">
                Quick Actions
              </div>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  navigate('/projects');
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Rocket className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-text-primary">Deploy New Application</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">
                  Jump to Projects
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  navigate('/environments');
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-3.5 h-3.5 text-status-warning" />
                  <span className="font-medium text-text-primary">Bulk Import .env Variables</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">
                  Jump to Environments
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  navigate('/logs');
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-3.5 h-3.5 text-status-error" />
                  <span className="font-medium text-text-primary">Simulate / Inspect Error Stack</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">
                  Jump to Logs & Errors
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  navigate('/docs');
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-3.5 h-3.5 text-status-info" />
                  <span className="font-medium text-text-primary">Documentation & CLI Reference</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">
                  Jump to Docs
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  navigate('/status');
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-3.5 h-3.5 text-status-success" />
                  <span className="font-medium text-text-primary">Global System Status & Uptime</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">
                  Jump to /status
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  toggleTheme();
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  {user?.preferences?.theme === 'light' ? (
                    <Moon className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-status-warning" />
                  )}
                  <span className="font-medium text-text-primary">
                    Switch to {user?.preferences?.theme === 'light' ? 'Dark' : 'Light'} Appearance
                  </span>
                </div>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">
                  Toggle Theme
                </span>
              </button>
            </div>

            {/* Navigation Pages */}
            <div className="space-y-1 pt-3">
              <div className="text-[10px] font-mono uppercase text-text-muted px-2 font-semibold">
                Navigation
              </div>
              {[...mainNav, ...managementNav]
                .filter(
                  (nav) =>
                    !paletteQuery.trim() ||
                    nav.label.toLowerCase().includes(paletteQuery.toLowerCase())
                )
                .map((nav) => {
                  const Icon = nav.icon;
                  return (
                    <button
                      key={nav.to}
                      type="button"
                      onClick={() => {
                        setCommandPaletteOpen(false);
                        navigate(nav.to);
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="text-text-primary">{nav.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">{nav.to}</span>
                    </button>
                  );
                })}
            </div>

            {/* Active Projects */}
            {projects.length > 0 && (
              <div className="space-y-1 pt-3">
                <div className="text-[10px] font-mono uppercase text-text-muted px-2 font-semibold">
                  Projects in {activeWorkspace.name}
                </div>
                {projects
                  .filter(
                    (p) =>
                      !paletteQuery.trim() ||
                      p.name.toLowerCase().includes(paletteQuery.toLowerCase()) ||
                      p.repository.toLowerCase().includes(paletteQuery.toLowerCase())
                  )
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setCommandPaletteOpen(false);
                        navigate(`/projects/${p.id}`);
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-elevated text-left flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-text-secondary" />
                        <div>
                          <span className="text-text-primary font-medium">{p.name}</span>
                          <span className="text-[10px] text-text-muted ml-2 font-mono">{p.framework}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-primary">{p.domain}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </ModalDialog>
    </div>
  );
};
