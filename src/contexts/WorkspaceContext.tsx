import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  DEMO_WORKSPACE_ID,
} from '@/services/firebase/demoSeedData';
import {
  listUserWorkspaces,
  getWorkspaceBundle,
  createWorkspace,
  subscribeRuntimeUpdates,
} from '@/services/firebase/firestoreService';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  Project,
  Deployment,
  Monitor,
  MonitorCheck,
  ErrorEventRecord,
  AlertRule,
  AppNotification,
  ActivityEvent,
  IntegrationMetadata,
  EnvironmentVariableMeta,
  WorkspaceSubscription,
  SubscriptionPlan,
} from '@/types';

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  currentRole: WorkspaceRole;
  canWrite: boolean;
  canAdmin: boolean;
  isOwner: boolean;
  members: WorkspaceMember[];
  projects: Project[];
  deployments: Deployment[];
  monitors: Monitor[];
  monitorChecks: MonitorCheck[];
  errors: ErrorEventRecord[];
  alerts: AlertRule[];
  notifications: AppNotification[];
  activity: ActivityEvent[];
  integrations: IntegrationMetadata[];
  environments: EnvironmentVariableMeta[];
  subscription: WorkspaceSubscription;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createNewWorkspace: (name: string, slug: string, plan?: SubscriptionPlan) => Promise<Workspace>;
  refreshWorkspaceData: () => Promise<void>;
  toastMessage: { title: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (title: string, type?: 'success' | 'error' | 'info') => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(DEMO_WORKSPACE_ID);
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof getWorkspaceBundle>> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback(
    (title: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToastMessage({ title, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.title === title ? null : prev));
      }, 4000);
    },
    []
  );

  const refreshWorkspaceData = useCallback(async () => {
    const currentUser = user || {
      uid: 'usr_alex_mercer_01',
      email: 'alex.mercer@deployhq.dev',
      displayName: 'Alex Mercer',
    };
    const wsList = await listUserWorkspaces(currentUser);
    setWorkspaces(wsList);
    const data = await getWorkspaceBundle(activeWorkspaceId);
    setBundle({ ...data });
  }, [user, activeWorkspaceId]);

  useEffect(() => {
    refreshWorkspaceData();
    const unsub = subscribeRuntimeUpdates(() => {
      refreshWorkspaceData();
    });
    return () => unsub();
  }, [refreshWorkspaceData]);

  const switchWorkspace = async (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setSelectedProjectId(null);
    const data = await getWorkspaceBundle(workspaceId);
    setBundle({ ...data });
  };

  const createNewWorkspace = async (name: string, slug: string, plan?: SubscriptionPlan) => {
    const currentUser = user || {
      uid: 'usr_alex_mercer_01',
      email: 'alex.mercer@deployhq.dev',
      displayName: 'Alex Mercer',
    };
    const created = await createWorkspace({ name, slug, plan }, currentUser);
    await switchWorkspace(created.id);
    showToast(`Workspace "${created.name}" created`, 'success');
    return created;
  };

  if (!bundle) {
    return (
      <div className="min-h-screen bg-main text-text-primary flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Initializing DeployHQ workspace...
        </div>
      </div>
    );
  }

  const memberRecord = bundle.members.find((m) => m.uid === user?.uid);
  const currentRole: WorkspaceRole = memberRecord?.role || 'owner';
  const canWrite = ['owner', 'admin', 'developer'].includes(currentRole);
  const canAdmin = ['owner', 'admin'].includes(currentRole);
  const isOwner = currentRole === 'owner';

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace: bundle.workspace,
        currentRole,
        canWrite,
        canAdmin,
        isOwner,
        members: bundle.members,
        projects: bundle.projects,
        deployments: bundle.deployments,
        monitors: bundle.monitors,
        monitorChecks: bundle.monitorChecks,
        errors: bundle.errors,
        alerts: bundle.alerts,
        notifications: bundle.notifications,
        activity: bundle.activity,
        integrations: bundle.integrations,
        environments: bundle.environments,
        subscription: bundle.subscription,
        selectedProjectId,
        setSelectedProjectId,
        switchWorkspace,
        createNewWorkspace,
        refreshWorkspaceData,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs font-medium shadow-elevated transition-all ${
            toastMessage.type === 'error'
              ? 'bg-card border-status-error/50 text-status-error'
              : toastMessage.type === 'info'
              ? 'bg-card border-status-info/50 text-status-info'
              : 'bg-card border-status-success/50 text-status-success'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === 'error'
                ? 'bg-status-error'
                : toastMessage.type === 'info'
                ? 'bg-status-info'
                : 'bg-status-success'
            }`}
          />
          <span className="text-text-primary">{toastMessage.title}</span>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

