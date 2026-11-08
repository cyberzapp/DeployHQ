import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  Check,
  Building2,
  GitBranch,
  Cloud,
  FolderPlus,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  createProject,
  connectGitHubAccountWithToken,
  connectVercelAccountWithToken,
} from '@/services/firebase/firestoreService';
import { SupportedFramework } from '@/types';

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const { activeWorkspace, createNewWorkspace, showToast } = useWorkspace();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string>(activeWorkspace.id);

  // Step 1: Workspace
  const [wsName, setWsName] = useState('Nova Cloud Engineering');
  const [wsSlug, setWsSlug] = useState('nova-cloud');
  const [wsType, setWsType] = useState<'personal' | 'team'>('team');

  // Step 2: GitHub
  const [ghToken, setGhToken] = useState('');
  const [ghConnectedUser, setGhConnectedUser] = useState<string | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);

  // Step 3: Vercel
  const [vercelToken, setVercelToken] = useState('');
  const [vercelConnectedUser, setVercelConnectedUser] = useState<string | null>(null);
  const [vercelError, setVercelError] = useState<string | null>(null);

  // Step 4: First Project
  const [projectName, setProjectName] = useState('nova-api-service');
  const [framework, setFramework] = useState<SupportedFramework>('Next.js');
  const [repository, setRepository] = useState('nova-cloud/nova-api-service');
  const [domain, setDomain] = useState('api.novacloud.dev');

  const steps = [
    { num: 1, title: 'Create Workspace', icon: Building2 },
    { num: 2, title: 'Connect GitHub', icon: GitBranch },
    { num: 3, title: 'Connect Vercel', icon: Cloud },
    { num: 4, title: 'First Project', icon: FolderPlus },
    { num: 5, title: 'Finish Setup', icon: CheckCircle2 },
  ];

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const ws = await createNewWorkspace(wsName, wsSlug, wsType === 'team' ? 'pro' : 'free');
    setCreatedWorkspaceId(ws.id);
    setStep(2);
  };

  const handleConnectGitHub = async () => {
    setGhError(null);
    try {
      const res = await connectGitHubAccountWithToken(
        createdWorkspaceId,
        ghToken,
        user?.uid || 'usr_owner'
      );
      setGhConnectedUser(res.accountName);
      showToast(`Connected GitHub @${res.accountName}`, 'success');
      setStep(3);
    } catch (err: any) {
      setGhError(err?.message || 'GitHub verification failed');
    }
  };

  const handleConnectVercel = async () => {
    setVercelError(null);
    try {
      const res = await connectVercelAccountWithToken(
        createdWorkspaceId,
        vercelToken,
        user?.uid || 'usr_owner'
      );
      setVercelConnectedUser(res.accountName);
      showToast(`Connected Vercel @${res.accountName}`, 'success');
      setStep(4);
    } catch (err: any) {
      setVercelError(err?.message || 'Vercel verification failed');
    }
  };

  const handleStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject(
      createdWorkspaceId,
      {
        name: projectName,
        description: 'Created during workspace onboarding',
        framework,
        repository,
        repoUrl: `https://github.com/${repository}`,
        branch: 'main',
        productionBranch: 'main',
        buildCommand: 'npm run build',
        installCommand: 'npm ci',
        outputDir: framework === 'Next.js' ? '.next' : 'dist',
        rootDir: './',
        domain,
        productionUrl: `https://${domain}`,
        region: 'iad1 (US East)',
        autoDeploy: true,
        createdBy: user?.uid || 'usr_owner',
      },
      user?.displayName || 'Alex Mercer'
    );
    await completeOnboarding(createdWorkspaceId);
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-main text-text-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold">DeployHQ Workspace Setup</h1>
              <p className="text-xs text-text-secondary">
                Configure your workspace, source control, and deployment provider.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="text-xs text-text-secondary hover:text-text-primary underline"
          >
            Skip to Dashboard →
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div
                key={s.num}
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  active
                    ? 'bg-primary/15 border-primary text-primary font-medium'
                    : done
                    ? 'bg-card border-status-success/40 text-status-success'
                    : 'bg-card border-border text-text-muted'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-elevated text-xs">
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Step 1: Create your Workspace
                </h2>
                <p className="text-text-secondary mt-0.5">
                  A workspace houses your repositories, deployment pipelines, monitors, and team members.
                </p>
              </div>
              <div>
                <label className="block text-text-secondary mb-1 font-medium">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => {
                    setWsName(e.target.value);
                    setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary mb-1 font-medium">Workspace URL Slug</label>
                <div className="flex items-center rounded-lg bg-main border border-border px-3 py-2">
                  <span className="text-text-muted font-mono">deployhq.dev/</span>
                  <input
                    type="text"
                    required
                    value={wsSlug}
                    onChange={(e) => setWsSlug(e.target.value)}
                    className="bg-transparent text-text-primary font-mono focus:outline-none flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-text-secondary mb-1.5 font-medium">Workspace Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWsType('personal')}
                    className={`p-3 rounded-lg border text-left ${
                      wsType === 'personal'
                        ? 'border-primary bg-primary/10 text-text-primary'
                        : 'border-border bg-main text-text-secondary'
                    }`}
                  >
                    <div className="font-semibold">Personal Developer</div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      For solo builders and side projects.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWsType('team')}
                    className={`p-3 rounded-lg border text-left ${
                      wsType === 'team'
                        ? 'border-primary bg-primary/10 text-text-primary'
                        : 'border-border bg-main text-text-secondary'
                    }`}
                  >
                    <div className="font-semibold">Engineering Team</div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      Multi-user RBAC roles, audit logs, and shared alerts.
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
                >
                  Continue to GitHub Setup
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Step 2: Connect GitHub Account
                </h2>
                <p className="text-text-secondary mt-0.5">
                  DeployHQ requests minimum repository read & webhook permissions (<code className="font-mono text-primary">repo:status</code>, <code className="font-mono text-primary">admin:repo_hook</code>). Tokens are stored exclusively in server-side Cloud Functions Secret Storage.
                </p>
              </div>

              {ghError && (
                <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error">
                  {ghError}
                </div>
              )}

              <div>
                <label className="block text-text-secondary mb-1 font-medium">
                  GitHub Personal Access Token (Verified live against api.github.com/user)
                </label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-3.5 py-2 rounded-lg bg-elevated hover:bg-border text-text-secondary"
                >
                  Skip for now (Connect later)
                </button>
                <button
                  type="button"
                  onClick={handleConnectGitHub}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
                >
                  Verify & Connect GitHub
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Step 3: Connect Deployment Provider (Vercel)
                </h2>
                <p className="text-text-secondary mt-0.5">
                  Connect your Vercel account to import deployment history, stream build logs, and
                  trigger production rollbacks. Requires <code className="font-mono text-primary">deployments:read</code> and <code className="font-mono text-primary">deployments:write</code>.
                </p>
              </div>

              {vercelError && (
                <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error">
                  {vercelError}
                </div>
              )}

              <div>
                <label className="block text-text-secondary mb-1 font-medium">
                  Vercel API Access Token (Verified live against api.vercel.com/v2/user)
                </label>
                <input
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="vercel_pat_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-3.5 py-2 rounded-lg bg-elevated hover:bg-border text-text-secondary"
                >
                  Skip for now (Connect later)
                </button>
                <button
                  type="button"
                  onClick={handleConnectVercel}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
                >
                  Verify & Connect Vercel
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleStep4} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Step 4: Create First Project
                </h2>
                <p className="text-text-secondary mt-0.5">
                  Register your application repository and production domain.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Project Name</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Framework</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value as SupportedFramework)}
                    className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary"
                  >
                    {['Next.js', 'React', 'Vite', 'Vue', 'Nuxt', 'SvelteKit', 'Angular', 'Node.js', 'Other'].map(
                      (fw) => (
                        <option key={fw} value={fw}>
                          {fw}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">
                    GitHub Repository
                  </label>
                  <input
                    type="text"
                    required
                    value={repository}
                    onChange={(e) => setRepository(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">
                    Production Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-3.5 py-2 rounded-lg bg-elevated text-text-secondary"
                >
                  Skip Project Creation
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
                >
                  Create Project & Finish
                </button>
              </div>
            </form>
          )}

          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-status-success/15 border border-status-success/40 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-status-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Workspace Ready for Production
                </h2>
                <p className="text-text-secondary mt-1 max-w-md mx-auto">
                  Your workspace <strong>{wsName}</strong> is configured.
                  {ghConnectedUser && ` GitHub (@${ghConnectedUser}) connected.`}
                  {vercelConnectedUser && ` Vercel (@${vercelConnectedUser}) connected.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/overview')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium"
              >
                Open Command Center Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

