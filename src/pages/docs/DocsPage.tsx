import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  BookOpen,
  Terminal,
  ShieldCheck,
  Globe,
  KeyRound,
  Webhook,
  Activity,
  Layers,
  Copy,
  Check,
  Search,
  ExternalLink,
  ArrowRight,
  Code2,
  Server,
  Lock,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface DocSection {
  id: string;
  category: string;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

export const DocsPage: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      category: 'Overview',
      title: 'Introduction & Quickstart',
      badge: 'Core',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">
            DeployHQ is an all-in-one developer deployment and observability platform. It brings
            multi-cloud deployments (GitHub + Vercel), continuous synthetic HTTP uptime monitoring,
            deterministic exception fingerprinting, and zero-knowledge encrypted environment secrets
            into one centralized, high-velocity dashboard.
          </p>

          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <h3 className="font-semibold text-text-primary text-sm">3-Minute Quickstart</h3>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary text-xs">
              <li>
                <strong className="text-text-primary">Create or Select a Workspace:</strong> Workspaces isolate your team, RBAC roles, projects, and subscription billing.
              </li>
              <li>
                <strong className="text-text-primary">Connect Source Control:</strong> Link your GitHub account via OAuth or verify a Personal Access Token with <code className="text-primary font-mono">repo</code> permissions.
              </li>
              <li>
                <strong className="text-text-primary">Deploy Your First Project:</strong> Pick any Next.js, Vite, React, Vue, SvelteKit, or Node.js repository. DeployHQ automatically infers build commands and output directories.
              </li>
              <li>
                <strong className="text-text-primary">Configure Proactive Health Checks:</strong> Set up automated HTTP probes with custom latency thresholds and Slack / Email alert dispatches.
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-elevated border border-border space-y-2">
            <div className="flex items-center gap-2 text-text-primary font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Dual-Mode Architecture</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              When Firebase environment variables are not yet configured, DeployHQ seamlessly runs on an
              isolated in-memory Demo Workspace (<code className="text-primary font-mono">ws-demo-showcase</code>). Once Firebase credentials or the Firebase Emulator Suite is supplied, it connects to live Firebase services without code modifications.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'cli-tool',
      category: 'Developer Tools',
      title: 'DeployHQ CLI Reference',
      badge: 'v2.4',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            The DeployHQ Command-Line Interface allows you to initialize configurations, trigger builds,
            pull/push encrypted environment variables, and inspect uptime health directly from your terminal.
          </p>

          {/* Installation */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Installation & Execution
            </h3>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-[#07090E] border border-border font-mono text-xs text-text-primary overflow-x-auto">
{`# Run directly with zero installation
npx deployhq-cli@latest --help

# Or install globally across your machine
npm install -g deployhq-cli`}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard('npx deployhq-cli@latest --help', 'cli-install')}
                className="absolute top-2.5 right-2.5 p-1.5 rounded bg-elevated hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                title="Copy command"
              >
                {copiedKey === 'cli-install' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Commands Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Core CLI Commands
            </h3>
            <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden text-xs">
              <div className="p-3.5 space-y-1">
                <div className="font-mono font-bold text-primary">deployhq init</div>
                <p className="text-text-secondary">
                  Interactively inspects the current repository, auto-detects framework and build settings, and creates a local <code className="text-text-primary font-mono">deployhq.json</code> configuration file.
                </p>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-mono font-bold text-primary">deployhq deploy [--prod]</div>
                <p className="text-text-secondary">
                  Packages the project, validates environment variable presence, and initiates an immediate deployment pipeline on DeployHQ edge workers.
                </p>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-mono font-bold text-primary">deployhq env pull [environment]</div>
                <p className="text-text-secondary">
                  Securely downloads encrypted environment variables for the specified tier (default: <code className="text-text-primary font-mono">development</code>) into your local <code className="text-text-primary font-mono">.env.local</code>.
                </p>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-mono font-bold text-primary">deployhq env push [environment]</div>
                <p className="text-text-secondary">
                  Parses your local <code className="text-text-primary font-mono">.env</code> file, encrypts keys server-side with AES-256, and uploads them to the targeted environment tier.
                </p>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-mono font-bold text-primary">deployhq status</div>
                <p className="text-text-secondary">
                  Outputs the current deployment ID, active git branch, live production URL, response latency, and health check SLA status.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'error-sdk',
      category: 'Observability',
      title: 'Error Tracking & Client SDK',
      badge: 'SDK',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            DeployHQ features a lightweight, zero-dependency client SDK for Node.js, Next.js, and browser
            applications. Exceptions are automatically fingerprinted via SHA-256 to prevent alert fatigue
            by grouping identical stack traces.
          </p>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              1. Node.js & Express Setup
            </h3>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-[#07090E] border border-border font-mono text-xs text-text-primary overflow-x-auto">
{`import { DeployHQClient } from '@/sdk/deployhq-client';

// Bootstrap once during server initialization
DeployHQClient.init({
  workspaceId: 'YOUR_WORKSPACE_ID',
  projectId: 'YOUR_PROJECT_ID',
  environment: process.env.NODE_ENV || 'production',
  release: process.env.GIT_COMMIT_SHA || 'v1.0.0',
});

// Express error-handling middleware
app.use((err, req, res, next) => {
  DeployHQClient.captureException(err, {
    method: req.method,
    url: req.originalUrl,
  });
  res.status(500).json({ error: 'Internal Server Error' });
});`}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard(`import { DeployHQClient } from '@/sdk/deployhq-client';\n\nDeployHQClient.init({\n  workspaceId: 'YOUR_WORKSPACE_ID',\n  projectId: 'YOUR_PROJECT_ID',\n  environment: 'production',\n});`, 'sdk-node')}
                className="absolute top-2.5 right-2.5 p-1.5 rounded bg-elevated hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                title="Copy snippet"
              >
                {copiedKey === 'sdk-node' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              2. Browser & React Setup with Auto-Listeners
            </h3>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-[#07090E] border border-border font-mono text-xs text-text-primary overflow-x-auto">
{`import { DeployHQClient } from '@/sdk/deployhq-client';

DeployHQClient.init({
  workspaceId: 'YOUR_WORKSPACE_ID',
  projectId: 'YOUR_PROJECT_ID',
  environment: import.meta.env.MODE || 'production',
  attachGlobalListeners: true, // Automatically captures window.onerror & unhandled rejections
});

// Or capture exceptions manually inside React Error Boundaries
try {
  runCriticalOperation();
} catch (error) {
  DeployHQClient.captureException(error, { component: 'CheckoutModal' });
}`}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard(`DeployHQClient.init({\n  workspaceId: 'YOUR_WORKSPACE_ID',\n  projectId: 'YOUR_PROJECT_ID',\n  attachGlobalListeners: true,\n});`, 'sdk-browser')}
                className="absolute top-2.5 right-2.5 p-1.5 rounded bg-elevated hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                title="Copy snippet"
              >
                {copiedKey === 'sdk-browser' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              3. Direct REST Ingestion API
            </h3>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-[#07090E] border border-border font-mono text-xs text-text-primary overflow-x-auto">
{`POST /api/ingest/errors
Content-Type: application/json
X-DeployHQ-Workspace: YOUR_WORKSPACE_ID

{
  "projectId": "proj_prod_api",
  "projectName": "Payment Microservice",
  "environment": "production",
  "type": "NetworkTimeoutError",
  "message": "Gateway timeout connecting to upstream bank API after 5000ms",
  "stackTrace": "NetworkTimeoutError: Gateway timeout\\n    at Socket.onTimeout (/src/http.ts:44:11)"
}`}
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'webhooks',
      category: 'Integrations',
      title: 'Webhooks & HMAC Verification',
      badge: 'Security',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            DeployHQ ingests asynchronous push and deployment events from GitHub and Vercel. All payloads
            must be signed with cryptographic HMAC SHA-256 signatures to prevent spoofing. Duplicate deliveries
            are automatically dropped.
          </p>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Webhook Endpoints
            </h3>
            <div className="divide-y divide-border border border-border rounded-xl bg-card text-xs">
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-status-info/15 text-status-info font-mono text-[10px] font-bold">
                    POST
                  </span>
                  <code className="font-mono text-text-primary font-semibold">/api/webhooks/github</code>
                </div>
                <p className="text-text-secondary">
                  Handles <code className="text-primary font-mono">push</code> and <code className="text-primary font-mono">pull_request</code> events. Validates signature via header <code className="text-text-primary font-mono">X-Hub-Signature-256</code> against the configured webhook secret.
                </p>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-status-info/15 text-status-info font-mono text-[10px] font-bold">
                    POST
                  </span>
                  <code className="font-mono text-text-primary font-semibold">/api/webhooks/vercel</code>
                </div>
                <p className="text-text-secondary">
                  Receives <code className="text-primary font-mono">deployment.created</code>, <code className="text-primary font-mono">deployment.succeeded</code>, and <code className="text-primary font-mono">deployment.error</code> events. Validates signature via header <code className="text-text-primary font-mono">x-vercel-signature</code>.
                </p>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-status-info/15 text-status-info font-mono text-[10px] font-bold">
                    POST
                  </span>
                  <code className="font-mono text-text-primary font-semibold">/api/webhooks/razorpay</code>
                </div>
                <p className="text-text-secondary">
                  Processes <code className="text-primary font-mono">payment.captured</code> and subscription renewals. Validates payload signature via header <code className="text-text-primary font-mono">x-razorpay-signature</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'secrets',
      category: 'Security',
      title: 'Zero-Knowledge Secrets & .env Import',
      badge: 'Encrypted',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">
            DeployHQ isolates environment variables into 4 distinct tiers: <strong>Development</strong>, <strong>Preview</strong>, <strong>Staging</strong>, and <strong>Production</strong>.
          </p>

          <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-status-success">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Leak Client Guarantee</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Client Firestore queries to <code className="text-text-primary font-mono">environmentSecrets</code> and <code className="text-text-primary font-mono">integrationSecrets</code> are blocked by Firestore Security Rules (<code className="text-primary font-mono">allow read, write: if false;</code>). Only server-side Cloud Functions running with Service Account privileges can read raw secrets during build time.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Bulk .env Parser Format
            </h3>
            <p className="text-xs text-text-secondary">
              DeployHQ supports bulk importing standard dotenv formatted strings. Comments (<code className="text-primary font-mono">#</code>) and empty lines are automatically skipped. Keys starting with <code className="text-primary font-mono">NEXT_PUBLIC_</code> or <code className="text-primary font-mono">VITE_</code> remain unmasked; all other keys are automatically masked as encrypted secrets.
            </p>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-[#07090E] border border-border font-mono text-xs text-text-primary overflow-x-auto">
{`# Database configuration
DATABASE_URL=postgres://user:secret123@aws.aurora:5432/main
REDIS_HOST=10.0.4.12
JWT_SECRET="super-secret-production-signing-token"

# Public frontend variables
NEXT_PUBLIC_APP_URL=https://app.deployhq.live
VITE_ANALYTICS_ID=analytics_9981`}
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dns-domains',
      category: 'Infrastructure',
      title: 'Custom Domains & DNS-over-HTTPS',
      badge: 'Networking',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">
            Attach apex domains (e.g. <code className="text-primary font-mono">company.com</code>) or subdomains (<code className="text-primary font-mono">app.company.com</code>) to any project. DeployHQ provisions wildcard TLS 1.3 certificates and edge caching rules.
          </p>

          <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-xs">
            <h3 className="font-semibold text-text-primary">Required DNS Records</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-main border border-border">
                <span className="text-text-muted block text-[10px]">Type</span>
                <span className="font-bold text-text-primary">CNAME</span>
              </div>
              <div className="p-2.5 rounded-lg bg-main border border-border">
                <span className="text-text-muted block text-[10px]">Host</span>
                <span className="font-bold text-text-primary">@ or subdomain</span>
              </div>
              <div className="p-2.5 rounded-lg bg-main border border-border sm:col-span-2">
                <span className="text-text-muted block text-[10px]">Value</span>
                <span className="font-bold text-text-primary">cname.deployhq.dev</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h3 className="font-semibold text-text-primary">Real-Time DoH Verification</h3>
            <p className="text-text-secondary leading-relaxed">
              When you click <strong>"Verify DNS"</strong> in your Project Workspace, DeployHQ executes an authoritative query against Google DNS (<code className="text-primary font-mono">https://dns.google/resolve?name=domain&type=CNAME</code>), inspecting TTL and Answer records in real time to give you instant propagation feedback without needing local dig/nslookup tools.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'rbac-security',
      category: 'Administration',
      title: 'Workspace RBAC & Permissions Matrix',
      badge: 'Roles',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">
            DeployHQ workspaces enforce a 4-tier Role-Based Access Control (RBAC) hierarchy across all
            application features and server APIs.
          </p>

          <div className="overflow-x-auto rounded-xl border border-border bg-card text-xs">
            <table className="w-full text-left">
              <thead className="bg-elevated border-b border-border text-text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Permission Action</th>
                  <th className="py-3 px-3 font-semibold text-center text-status-success">Owner</th>
                  <th className="py-3 px-3 font-semibold text-center text-primary">Admin</th>
                  <th className="py-3 px-3 font-semibold text-center text-status-info">Developer</th>
                  <th className="py-3 px-3 font-semibold text-center text-text-muted">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text-secondary">
                <tr>
                  <td className="py-2.5 px-4 font-medium text-text-primary">Trigger / Cancel Deployments</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-text-primary">Edit Encrypted Environment Variables</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-text-primary">Connect GitHub / Vercel Integrations</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-text-primary">Invite / Remove Workspace Members</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-text-primary">Manage Billing & Razorpay Subscriptions</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-text-primary">Delete Workspace & Purge Assets</td>
                  <td className="py-2.5 px-3 text-center text-status-success font-bold">✓</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                  <td className="py-2.5 px-3 text-center text-text-muted">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(
    (sec) =>
      !searchQuery.trim() ||
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <div className="min-h-screen bg-[#090B10] text-[#F4F6FA] selection:bg-[#8B7CFF]/30 font-sans">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090B10]/85 border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Rocket className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm sm:text-base text-text-primary">DeployHQ</span>
            </Link>
            <span className="text-text-muted text-xs">/</span>
            <span className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Documentation
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/status"
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-status-success/40 text-text-secondary hover:text-text-primary font-medium flex items-center gap-1.5 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-status-success" />
              <span>Status (99.98%)</span>
            </Link>
            <Link
              to="/overview"
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>Console Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-card border border-border text-xs text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <nav className="space-y-1 text-xs" aria-label="Documentation Navigation">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionId(sec.id)}
                className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                  activeSectionId === sec.id
                    ? 'bg-primary/15 text-primary font-semibold border border-primary/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
                }`}
              >
                <span>{sec.title}</span>
                {sec.badge && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-main border border-border text-text-muted">
                    {sec.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-border flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                {activeSection.category}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary mt-1">
                {activeSection.title}
              </h1>
            </div>
            {activeSection.badge && (
              <span className="px-2.5 py-1 rounded-md bg-elevated border border-border font-mono text-xs text-text-secondary">
                {activeSection.badge}
              </span>
            )}
          </div>

          {activeSection.content}
        </main>
      </div>
    </div>
  );
};
