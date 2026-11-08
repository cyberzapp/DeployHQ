export type WorkspaceRole = 'owner' | 'admin' | 'developer' | 'viewer';
export type SubscriptionPlan = 'free' | 'pro' | 'team';
export type EnvironmentType = 'development' | 'preview' | 'staging' | 'production';
export type DeploymentStatus = 'ready' | 'building' | 'failed' | 'queued' | 'cancelled';
export type MonitorStatus = 'operational' | 'degraded' | 'down' | 'paused';
export type SupportedFramework =
  | 'Next.js'
  | 'React'
  | 'Vite'
  | 'Vue'
  | 'Nuxt'
  | 'SvelteKit'
  | 'Angular'
  | 'Node.js'
  | 'Other';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  title?: string;
  company?: string;
  timezone?: string;
  defaultWorkspaceId?: string;
  onboardingCompleted?: boolean;
  preferences?: {
    theme?: 'dark' | 'light' | 'system';
    emailAlerts?: boolean;
    pushAlerts?: boolean;
    deploymentNotifications?: boolean;
    fcmToken?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: SubscriptionPlan;
  isDemo?: boolean;
  avatarUrl?: string;
  description?: string;
  memberCount?: number;
  projectCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface WorkspaceMember {
  uid: string;
  workspaceId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: WorkspaceRole;
  status: 'active' | 'invited';
  invitedBy?: string;
  joinedAt?: any;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  framework: SupportedFramework;
  repository: string;
  repoUrl?: string;
  branch: string;
  productionBranch: string;
  buildCommand: string;
  installCommand: string;
  outputDir: string;
  rootDir: string;
  domain: string;
  productionUrl: string;
  domains?: string[];
  status: 'healthy' | 'degraded' | 'building' | 'failed' | 'idle';
  region: string;
  autoDeploy: boolean;
  createdBy: string;
  lastDeployedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface DeploymentTimelineStep {
  step: string;
  label: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  timestamp: string;
  durationMs?: number;
}

export interface Deployment {
  id: string;
  workspaceId: string;
  projectId: string;
  projectName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  commitAuthor: string;
  environment: EnvironmentType;
  status: DeploymentStatus;
  durationMs: number;
  triggeredBy: string;
  trigger: 'git_push' | 'manual' | 'redeploy' | 'rollback' | 'webhook';
  url: string;
  errorMessage?: string;
  rollbackFromId?: string;
  metadata?: {
    provider?: 'vercel' | 'github';
    region?: string;
    timeline?: DeploymentTimelineStep[];
  };
  startedAt?: any;
  completedAt?: any;
  createdAt?: any;
}

export interface DeploymentLogEntry {
  id: string;
  deploymentId: string;
  sequence: number;
  level: 'info' | 'warning' | 'error' | 'success';
  step: string;
  message: string;
  timestamp: string;
  createdAt?: any;
}

export interface Monitor {
  id: string;
  workspaceId: string;
  projectId?: string;
  projectName?: string;
  name: string;
  url: string;
  method: 'GET' | 'HEAD' | 'POST';
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  enabled: boolean;
  status: MonitorStatus;
  uptimePercentage: number;
  avgLatencyMs: number;
  latencyMs: number;
  lastStatusCode?: number;
  lastError?: string | null;
  lastCheckedAt?: any;
  createdAt?: any;
}

export interface MonitorCheck {
  id: string;
  workspaceId: string;
  monitorId: string;
  status: 'operational' | 'degraded' | 'down';
  statusCode: number;
  responseTimeMs: number;
  latencyMs: number;
  success: boolean;
  up: boolean;
  errorMessage?: string | null;
  checkedAt?: any;
  createdAt?: any;
}

export interface ErrorEventRecord {
  id: string;
  workspaceId: string;
  projectId: string;
  projectName: string;
  environment: EnvironmentType;
  title: string;
  message: string;
  type: string;
  level: 'error' | 'warning' | 'fatal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'unresolved' | 'resolved';
  fingerprint: string;
  stackTrace: string;
  release?: string;
  count: number;
  affectedUsers: number;
  context?: {
    requestUrl?: string;
    browser?: string;
    runtime?: string;
  };
  firstSeenAt?: any;
  lastSeenAt?: any;
  resolvedAt?: any;
  createdAt?: any;
}

export type AlertConditionType =
  | 'deployment_failed'
  | 'production_deployment_completed'
  | 'website_unavailable'
  | 'response_time_exceeds'
  | 'error_rate_exceeds'
  | 'monitor_down'
  | 'monitor_recovered';

export interface AlertRule {
  id: string;
  workspaceId: string;
  projectId?: string;
  name: string;
  type: string;
  condition: AlertConditionType;
  threshold: number;
  channel: 'in_app' | 'push' | 'email' | 'all';
  channels: string[];
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  lastTriggeredAt?: any;
  createdAt?: any;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  title: string;
  message: string;
  type: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  link?: string;
  read: boolean;
  readAt?: any;
  createdAt?: any;
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  projectId?: string;
  actorId?: string;
  actorName?: string;
  action: string;
  type: string;
  targetName?: string;
  description: string;
  createdAt?: any;
}

export interface IntegrationMetadata {
  id: 'github' | 'vercel' | 'email' | 'slack';
  workspaceId: string;
  provider: 'github' | 'vercel' | 'email' | 'slack';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  connected: boolean;
  accountName?: string;
  accountAvatar?: string;
  connectedBy?: string;
  connectedAt?: any;
  lastSyncedAt?: any;
  config?: Record<string, any>;
}

export interface EnvironmentVariableMeta {
  id: string;
  workspaceId: string;
  projectId: string;
  environment: EnvironmentType;
  target: EnvironmentType;
  key: string;
  name: string;
  maskedValue: string;
  maskedPreview: string;
  isSecret: boolean;
  updatedBy: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface WorkspaceSubscription {
  id: string;
  workspaceId: string;
  plan: SubscriptionPlan;
  requestedPlan?: SubscriptionPlan;
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'incomplete' | 'pending' | 'checkout_requested' | 'canceled' | 'trialing';
  checkoutSessionId?: string;
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: any;
  currentPeriodEnd?: any;
  updatedAt?: any;
}

