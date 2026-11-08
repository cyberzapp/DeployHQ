import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Rocket,
  ShieldCheck,
  Activity,
  Terminal,
  Zap,
  GitBranch,
  Globe,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  BarChart3,
  KeyRound,
  Check,
  ChevronDown,
  Sparkles,
  Server,
  Cloud,
  Cpu,
  Copy,
  ExternalLink,
  Play,
  RotateCcw,
  BellRing,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [annualBilling, setAnnualBilling] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState<'deploy' | 'monitor' | 'errors' | 'secrets'>('deploy');
  const [demoDeployState, setDemoDeployState] = useState<'building' | 'ready'>('ready');
  const [demoDeployProgress, setDemoDeployProgress] = useState(100);

  // Simulated live deployment animation
  const triggerDemoBuild = () => {
    setDemoDeployState('building');
    setDemoDeployProgress(15);
    setTimeout(() => setDemoDeployProgress(45), 600);
    setTimeout(() => setDemoDeployProgress(80), 1200);
    setTimeout(() => {
      setDemoDeployProgress(100);
      setDemoDeployState('ready');
    }, 1800);
  };

  const copyCliCommand = () => {
    navigator.clipboard.writeText('npx deployhq-cli@latest init');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-[#F4F6FA] selection:bg-[#8B7CFF]/30 selection:text-[#FFFFFF] overflow-x-hidden font-sans">
      {/* Ambient Radial Gradient Glows */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#8B7CFF]/15 via-[#8B7CFF]/5 to-transparent blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-tl from-[#55A6FF]/10 to-transparent blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 1. Sticky Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090B10]/80 border-b border-[#242B38]/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#8B7CFF]/20 border border-[#8B7CFF]/50 flex items-center justify-center text-[#8B7CFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,124,255,0.3)]">
                <Rocket className="w-4 h-4 text-[#8B7CFF]" />
              </div>
              <span className="font-semibold tracking-tight text-sm sm:text-base text-[#F4F6FA] flex items-center gap-2">
                DeployHQ
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#171C27] text-[#929BAC] border border-[#242B38]">
                  v2.4
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs text-[#929BAC]" aria-label="Main Navigation">
              <a href="#features" className="hover:text-[#F4F6FA] transition-colors">Features</a>
              <a href="#architecture" className="hover:text-[#F4F6FA] transition-colors">Architecture</a>
              <a href="#demo" className="hover:text-[#F4F6FA] transition-colors">Live Sandbox</a>
              <a href="#comparison" className="hover:text-[#F4F6FA] transition-colors">Comparison</a>
              <a href="#pricing" className="hover:text-[#F4F6FA] transition-colors">Pricing</a>
              <Link to="/docs" className="hover:text-[#F4F6FA] transition-colors">Documentation</Link>
              <a href="#faq" className="hover:text-[#F4F6FA] transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {user ? (
              <Link
                to="/overview"
                className="px-4 py-2 rounded-lg bg-[#8B7CFF] hover:bg-[#7A6AE6] text-white font-medium flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(139,124,255,0.3)]"
              >
                <span>Console Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[#929BAC] hover:text-[#F4F6FA] font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-2 rounded-lg bg-[#8B7CFF] hover:bg-[#7A6AE6] text-white font-medium flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(139,124,255,0.3)]"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#11151E] border border-[#242B38] text-xs text-[#929BAC] hover:border-[#8B7CFF]/50 transition-colors cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-[#22C58B] animate-pulse" />
          <span className="text-[#F4F6FA] font-medium">DeployHQ 2.0 Released</span>
          <span className="text-[#657084]">|</span>
          <span className="text-[#8B7CFF] flex items-center gap-1">
            Zero-Config Edge Deployments <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F4F6FA] max-w-4xl mx-auto leading-[1.1]">
          Ship faster. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#8B7CFF] via-[#55A6FF] to-[#22C58B] bg-clip-text text-transparent">
            Monitor smarter.
          </span>{' '}
          Stay in control.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#929BAC] leading-relaxed">
          The unified developer deployment and monitoring platform. Connect your GitHub repositories,
          inspect live streaming build logs, conduct timed HTTP uptime probes, track fingerprinted errors,
          and safeguard encrypted secrets — from one polished command center.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#8B7CFF] hover:bg-[#7A6AE6] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(139,124,255,0.4)]"
          >
            <Rocket className="w-4 h-4" />
            <span>Deploy Free Project</span>
          </Link>
          <Link
            to="/overview"
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-[#11151E] hover:bg-[#171C27] border border-[#242B38] text-[#F4F6FA] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-[#55A6FF]" />
            <span>Launch Live Sandbox</span>
          </Link>
        </div>

        {/* CLI Quickstart Bar */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-lg bg-[#0D1017] border border-[#242B38] font-mono text-xs text-[#929BAC]">
            <span className="text-[#8B7CFF] select-none">$</span>
            <span className="text-[#F4F6FA]">npx deployhq-cli@latest init</span>
            <button
              type="button"
              onClick={copyCliCommand}
              className="p-1 rounded hover:bg-[#171C27] text-[#929BAC] hover:text-[#F4F6FA] transition-colors"
              title="Copy CLI bootstrap command"
              aria-label="Copy CLI bootstrap command"
            >
              {copiedCli ? <Check className="w-3.5 h-3.5 text-[#22C58B]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Interactive Hero Command Center Simulator */}
      <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl bg-[#0D1017] border border-[#242B38] shadow-[0_20px_70px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Mock Browser/Terminal Window Titlebar */}
          <div className="px-4 py-3 bg-[#11151E] border-b border-[#242B38] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#F06464]/80" />
                <span className="w-3 h-3 rounded-full bg-[#F5B942]/80" />
                <span className="w-3 h-3 rounded-full bg-[#22C58B]/80" />
              </div>
              <span className="text-[11px] font-mono text-[#657084] ml-2 hidden sm:inline">
                deployhq.live/console/production-gateway
              </span>
            </div>

            {/* Interactive Simulator Mode Tabs */}
            <div className="flex items-center gap-1 bg-[#090B10] p-1 rounded-lg border border-[#242B38] text-[11px]">
              <button
                type="button"
                onClick={() => setActiveDemoTab('deploy')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeDemoTab === 'deploy'
                    ? 'bg-[#171C27] text-[#8B7CFF] border border-[#242B38]'
                    : 'text-[#929BAC] hover:text-[#F4F6FA]'
                }`}
              >
                1. Deployment Pipeline
              </button>
              <button
                type="button"
                onClick={() => setActiveDemoTab('monitor')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeDemoTab === 'monitor'
                    ? 'bg-[#171C27] text-[#22C58B] border border-[#242B38]'
                    : 'text-[#929BAC] hover:text-[#F4F6FA]'
                }`}
              >
                2. HTTP Health Probes
              </button>
              <button
                type="button"
                onClick={() => setActiveDemoTab('errors')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeDemoTab === 'errors'
                    ? 'bg-[#171C27] text-[#F06464] border border-[#242B38]'
                    : 'text-[#929BAC] hover:text-[#F4F6FA]'
                }`}
              >
                3. Error Tracking
              </button>
              <button
                type="button"
                onClick={() => setActiveDemoTab('secrets')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeDemoTab === 'secrets'
                    ? 'bg-[#171C27] text-[#55A6FF] border border-[#242B38]'
                    : 'text-[#929BAC] hover:text-[#F4F6FA]'
                }`}
              >
                4. Encrypted Secrets
              </button>
            </div>
          </div>

          {/* Interactive Screen Content */}
          <div className="p-5 sm:p-7 min-h-[360px] flex flex-col justify-between text-xs font-mono">
            {activeDemoTab === 'deploy' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242B38]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-[#F4F6FA] font-sans">
                      production-api-gateway
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#171C27] border border-[#242B38] text-[10px] text-[#929BAC]">
                      main (c8a91f4)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        demoDeployState === 'building'
                          ? 'bg-[#F5B942]/15 text-[#F5B942] animate-pulse'
                          : 'bg-[#22C58B]/15 text-[#22C58B]'
                      }`}
                    >
                      {demoDeployState === 'building' ? 'Building...' : 'Ready (Active)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={triggerDemoBuild}
                    disabled={demoDeployState === 'building'}
                    className="px-3 py-1.5 rounded-lg bg-[#8B7CFF] hover:bg-[#7A6AE6] disabled:opacity-50 text-white font-sans font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${demoDeployState === 'building' ? 'animate-spin' : ''}`} />
                    <span>Redeploy Commit</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#11151E] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#8B7CFF] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${demoDeployProgress}%` }}
                  />
                </div>

                {/* Simulated Log Terminal */}
                <div className="p-4 rounded-xl bg-[#07090E] border border-[#242B38] space-y-1.5 text-[11px] leading-relaxed max-h-56 overflow-y-auto">
                  <div className="text-[#657084]">00:00.1s [INFO] Triggered via GitHub push webhook to refs/heads/main</div>
                  <div className="text-[#657084]">00:02.4s [INFO] Cloning repository into ephemeral sandbox container</div>
                  <div className="text-[#657084]">00:05.8s [INFO] Injecting 14 encrypted environment secrets into process.env</div>
                  <div className="text-[#55A6FF]">00:12.3s [BUILD] Running vite build --mode production</div>
                  <div className="text-[#929BAC]">00:24.7s [BUILD] ✓ 2,293 modules transformed in 2.81s</div>
                  <div className="text-[#929BAC]">00:31.9s [BUILD] Generating immutable asset chunks for global CDN edge</div>
                  {demoDeployState === 'building' ? (
                    <div className="text-[#F5B942] animate-pulse">00:34.2s [RUNNING] Verifying TLS 1.3 certificates and edge route caches...</div>
                  ) : (
                    <div className="text-[#22C58B] font-semibold">
                      00:36.0s [SUCCESS] Deployment ready • Production domain: https://api.deployhq.live
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeDemoTab === 'monitor' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242B38]">
                  <div>
                    <div className="font-semibold text-sm text-[#F4F6FA] font-sans">
                      Global Synthetic HTTP Probes
                    </div>
                    <div className="text-[#657084] text-[11px] font-sans">
                      Timed 30s checks across 3 geographical edge regions
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#22C58B]/15 text-[#22C58B] border border-[#22C58B]/30 font-bold text-[11px]">
                    99.992% SLA UPTIME
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#11151E] border border-[#242B38]">
                    <div className="text-[#929BAC] font-sans">US East (N. Virginia)</div>
                    <div className="text-xl font-bold text-[#22C58B] mt-1">21ms</div>
                    <div className="text-[10px] text-[#657084] mt-1">HTTP 200 OK • TLS Valid</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#11151E] border border-[#242B38]">
                    <div className="text-[#929BAC] font-sans">EU Central (Frankfurt)</div>
                    <div className="text-xl font-bold text-[#22C58B] mt-1">34ms</div>
                    <div className="text-[10px] text-[#657084] mt-1">HTTP 200 OK • TLS Valid</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#11151E] border border-[#242B38]">
                    <div className="text-[#929BAC] font-sans">AP South (Mumbai)</div>
                    <div className="text-xl font-bold text-[#55A6FF] mt-1">42ms</div>
                    <div className="text-[10px] text-[#657084] mt-1">HTTP 200 OK • TLS Valid</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#242B38] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#22C58B]" />
                    <span className="text-[#F4F6FA]">SSL Certificate auto-renewal: Active (Renews in 74 days)</span>
                  </div>
                  <span className="text-[#929BAC]">P95 Latency: 38ms</span>
                </div>
              </div>
            )}

            {activeDemoTab === 'errors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#242B38]">
                  <div>
                    <div className="font-semibold text-sm text-[#F4F6FA] font-sans">
                      Deterministic Grouping & Stack Trace Inspector
                    </div>
                    <div className="text-[#657084] text-[11px] font-sans">
                      Deduplicated by SHA-256 exception signature
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#F06464]/15 text-[#F06464] border border-[#F06464]/30 font-semibold">
                    1 Unresolved Issue
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#11151E] border border-[#242B38] space-y-2">
                  <div className="flex items-center justify-between text-[#F4F6FA]">
                    <span className="font-bold text-[#F06464]">DatabaseTimeoutError</span>
                    <span className="text-[#929BAC]">42 events • 18 users affected</span>
                  </div>
                  <div className="text-[#929BAC]">
                    Query read timeout after 3000ms on secondary read replica (cluster-eu-1)
                  </div>
                  <pre className="p-3 rounded-lg bg-[#07090E] text-[11px] text-[#929BAC] overflow-x-auto border border-[#242B38]">
{`DatabaseTimeoutError: Query read timeout after 3000ms
  at PoolClient.query (/app/node_modules/pg/lib/client.js:526:17)
  at OrderRepository.findByUser (/app/src/repositories/orderRepo.ts:74:12)`}
                  </pre>
                </div>
              </div>
            )}

            {activeDemoTab === 'secrets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#242B38]">
                  <div>
                    <div className="font-semibold text-sm text-[#F4F6FA] font-sans">
                      Encrypted Secrets & Bulk .env Importer
                    </div>
                    <div className="text-[#657084] text-[11px] font-sans">
                      Raw secrets stored server-side in Google Secret Storage. Client read/write blocked.
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#55A6FF]/15 text-[#55A6FF] border border-[#55A6FF]/30 font-medium">
                    AES-256 ENCRYPTED
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'DATABASE_URL', masked: 'postgres://admin:••••••••@pg.aurora.aws:5432/main', env: 'production' },
                    { key: 'JWT_SIGNING_SECRET', masked: 'sec_live_••••••••••••••••••••••••••••••••', env: 'production' },
                    { key: 'RAZORPAY_KEY_SECRET', masked: 'rzp_sec_••••••••••••••••••••', env: 'production' },
                  ].map((s) => (
                    <div
                      key={s.key}
                      className="p-3 rounded-lg bg-[#11151E] border border-[#242B38] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-3.5 h-3.5 text-[#8B7CFF]" />
                        <span className="font-bold text-[#F4F6FA]">{s.key}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#090B10] text-[10px] text-[#657084] uppercase">
                          {s.env}
                        </span>
                      </div>
                      <span className="text-[#657084]">{s.masked}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Social Proof & Performance Bar */}
      <section className="py-12 border-y border-[#242B38] bg-[#0D1017]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#F4F6FA] tracking-tight">
              &lt; 35ms
            </div>
            <div className="text-xs text-[#929BAC]">Average Global Edge Latency</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#22C58B] tracking-tight">
              99.99%
            </div>
            <div className="text-xs text-[#929BAC]">Platform SLA Availability</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#55A6FF] tracking-tight">
              1.2M+
            </div>
            <div className="text-xs text-[#929BAC]">Webhooks Processed Monthly</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#8B7CFF] tracking-tight">
              5,000+
            </div>
            <div className="text-xs text-[#929BAC]">Engineers & SaaS Startups</div>
          </div>
        </div>
      </section>

      {/* 5. Features Bento Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B7CFF]">
            Engineered for High-Velocity Teams
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F6FA]">
            Everything you need to ship, monitor, and scale with confidence.
          </p>
          <p className="text-sm text-[#929BAC]">
            Consolidate 5 disparate developer tools into one cohesive, high-performance workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Multi-Cloud Deployments (Span 2) */}
          <div className="md:col-span-2 p-7 rounded-2xl bg-[#11151E] border border-[#242B38] space-y-4 hover:border-[#8B7CFF]/40 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B7CFF]/15 border border-[#8B7CFF]/30 flex items-center justify-center text-[#8B7CFF]">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA]">
                Instant Multi-Cloud Deployment Engine
              </h3>
              <p className="text-xs text-[#929BAC] leading-relaxed">
                Seamlessly deploy Next.js, Vite, React, Vue, SvelteKit, and Node.js applications.
                Every commit generates isolated preview environments, live streaming build logs,
                and one-click rollback checkpoints.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#090B10] border border-[#242B38] font-mono text-[11px] text-[#929BAC] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-[#8B7CFF]" />
                <span>git push origin main → Automatic Production Deployment</span>
              </span>
              <span className="text-[#22C58B]">Deployed in 38s</span>
            </div>
          </div>

          {/* Card 2: Uptime & SLA */}
          <div className="p-7 rounded-2xl bg-[#11151E] border border-[#242B38] space-y-4 hover:border-[#22C58B]/40 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#22C58B]/15 border border-[#22C58B]/30 flex items-center justify-center text-[#22C58B]">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA]">Continuous Synthetic Probes</h3>
              <p className="text-xs text-[#929BAC] leading-relaxed">
                Run automated HTTP health checks every 30 seconds. Track P95/P99 latency regressions,
                receive instant alerts for 5xx errors, and monitor TLS expiry before outages happen.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090B10] border border-[#242B38] font-mono text-[11px] text-[#22C58B] flex items-center justify-between">
              <span>SLA Target: 99.99%</span>
              <span className="w-2 h-2 rounded-full bg-[#22C58B] animate-pulse" />
            </div>
          </div>

          {/* Card 3: Fingerprinted Error Tracking */}
          <div className="p-7 rounded-2xl bg-[#11151E] border border-[#242B38] space-y-4 hover:border-[#F06464]/40 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F06464]/15 border border-[#F06464]/30 flex items-center justify-center text-[#F06464]">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA]">Deterministic Error Grouping</h3>
              <p className="text-xs text-[#929BAC] leading-relaxed">
                Eliminate log spam. DeployHQ fingerprints unhandled exceptions into deduplicated issue
                groups with rich stack traces and browser telemetry via our zero-dependency SDK.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090B10] border border-[#242B38] font-mono text-[11px] text-[#F06464] flex items-center justify-between">
              <span>POST /api/ingest/errors</span>
              <span className="text-[#657084]">Auto-Deduplicated</span>
            </div>
          </div>

          {/* Card 4: Encrypted Secrets Engine */}
          <div className="p-7 rounded-2xl bg-[#11151E] border border-[#242B38] space-y-4 hover:border-[#55A6FF]/40 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#55A6FF]/15 border border-[#55A6FF]/30 flex items-center justify-center text-[#55A6FF]">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA]">Zero-Knowledge Secrets</h3>
              <p className="text-xs text-[#929BAC] leading-relaxed">
                Manage development, preview, and production variables. Import standard `.env` files in
                one click. Raw secrets are encrypted server-side and never exposed to client-side reads.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090B10] border border-[#242B38] font-mono text-[11px] text-[#55A6FF] flex items-center justify-between">
              <span>AES-256 Server Encryption</span>
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5: DNS & Custom Domains */}
          <div className="p-7 rounded-2xl bg-[#11151E] border border-[#242B38] space-y-4 hover:border-[#8B7CFF]/40 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B7CFF]/15 border border-[#8B7CFF]/30 flex items-center justify-center text-[#8B7CFF]">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA]">Live DNS-over-HTTPS Verification</h3>
              <p className="text-xs text-[#929BAC] leading-relaxed">
                Attach apex domains or subdomains with live Google DoH resolution diagnostics.
                Automated TLS 1.3 certificate provisioning ensures your endpoints are always secure.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090B10] border border-[#242B38] font-mono text-[11px] text-[#22C58B] flex items-center justify-between">
              <span>CNAME cname.deployhq.dev</span>
              <span>TLS 1.3 Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Architecture & Pipeline Breakdown */}
      <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#242B38] space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#55A6FF]">
            Architecture & Security
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F6FA]">
            Built on a hardened, enterprise-ready infrastructure.
          </p>
          <p className="text-sm text-[#929BAC]">
            A zero-trust model where secrets remain strictly in backend storage and pipelines execute in sandboxes.
          </p>
        </div>

        {/* Pipeline Step Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {[
            { step: '01', title: 'Git Push', desc: 'HMAC SHA-256 verified GitHub/Vercel webhook triggers deployment event' },
            { step: '02', title: 'Sandbox Build', desc: 'Ephemeral worker executes build script and packages static assets' },
            { step: '03', title: 'Secret Injection', desc: 'Server-side Secret Storage securely injects production environment keys' },
            { step: '04', title: 'Edge Routing', desc: 'Assets distributed globally with immutable caching and security headers' },
            { step: '05', title: 'Proactive Probing', desc: 'Synthetic health checks ping endpoints to verify zero-downtime cutover' },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="p-5 rounded-xl bg-[#11151E] border border-[#242B38] space-y-2 relative"
            >
              <div className="font-mono text-sm font-bold text-[#8B7CFF]">{item.step}</div>
              <div className="font-semibold text-sm text-[#F4F6FA]">{item.title}</div>
              <p className="text-[11px] text-[#929BAC] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Stack Comparison Table */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#242B38] space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#22C58B]">
            Why DeployHQ?
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F6FA]">
            Replace your fragmented toolchain with one command center.
          </p>
          <p className="text-sm text-[#929BAC]">
            Stop juggling 5 different dashboards, separate billing invoices, and fractured alert channels.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#242B38] bg-[#11151E]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171C27] border-b border-[#242B38] text-[#929BAC]">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Capability</th>
                <th className="py-3.5 px-5 font-semibold text-[#8B7CFF]">DeployHQ Unified Platform</th>
                <th className="py-3.5 px-5 font-semibold text-[#657084]">Fragmented Toolchain (Vercel + Sentry + Datadog + Vault)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242B38] text-[#929BAC]">
              <tr>
                <td className="py-3.5 px-5 font-medium text-[#F4F6FA]">Deployment & Rollbacks</td>
                <td className="py-3.5 px-5 text-[#22C58B] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Native Git & Webhook streaming
                </td>
                <td className="py-3.5 px-5 text-[#657084]">Vercel / Netlify / Custom CI</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-[#F4F6FA]">HTTP Uptime & SLA Probes</td>
                <td className="py-3.5 px-5 text-[#22C58B] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Built-in 30s probes & P95 graphs
                </td>
                <td className="py-3.5 px-5 text-[#657084]">Datadog / Better Uptime (Extra $50-200/mo)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-[#F4F6FA]">Fingerprinted Error Tracking</td>
                <td className="py-3.5 px-5 text-[#22C58B] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Built-in with zero-dependency SDK
                </td>
                <td className="py-3.5 px-5 text-[#657084]">Sentry / Bugsnag (Extra $29-99/mo)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-[#F4F6FA]">Encrypted Secrets Management</td>
                <td className="py-3.5 px-5 text-[#22C58B] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Server-side AES-256 + .env bulk import
                </td>
                <td className="py-3.5 px-5 text-[#657084]">Doppler / HashiCorp Vault (Complex configuration)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-[#F4F6FA]">Unified Invoicing & Seats</td>
                <td className="py-3.5 px-5 text-[#22C58B] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Single consolidated invoice
                </td>
                <td className="py-3.5 px-5 text-[#657084]">4-5 disparate vendor invoices</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#242B38] space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B7CFF]">
            Simple, Transparent Pricing
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F6FA]">
            Scale from weekend project to global enterprise.
          </p>
          <p className="text-sm text-[#929BAC]">
            No surprise overage fees. Choose the tier that matches your team’s deployment velocity.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs ${!annualBilling ? 'text-[#F4F6FA] font-semibold' : 'text-[#929BAC]'}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnualBilling(!annualBilling)}
              className="w-12 h-6 rounded-full bg-[#171C27] border border-[#242B38] p-1 flex items-center transition-colors"
              aria-label="Toggle annual billing discount"
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#8B7CFF] transition-transform ${
                  annualBilling ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs flex items-center gap-1.5 ${annualBilling ? 'text-[#F4F6FA] font-semibold' : 'text-[#929BAC]'}`}>
              <span>Annual</span>
              <span className="px-2 py-0.5 rounded-full bg-[#22C58B]/15 text-[#22C58B] text-[10px] font-bold">
                Save 20% + 2 Months Free
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Free Tier */}
          <div className="p-7 rounded-2xl bg-[#11151E] border border-[#242B38] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#F4F6FA]">Hobby</h3>
                <p className="text-[#929BAC] mt-1">For side projects, prototypes, and individual developers.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-[#F4F6FA]">₹0</span>
                <span className="text-[#657084]">/ month</span>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-[#242B38] text-[#929BAC]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Up to 2 active projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> 3 HTTP uptime monitors (5m intervals)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> 7-day deployment & log history
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Encrypted environment secrets
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Community support
                </li>
              </ul>
            </div>
            <Link
              to="/signup"
              className="w-full py-2.5 rounded-lg bg-[#171C27] hover:bg-[#242B38] border border-[#242B38] text-[#F4F6FA] font-medium text-center transition-colors block"
            >
              Start for Free
            </Link>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="p-7 rounded-2xl bg-[#11151E] border-2 border-[#8B7CFF] flex flex-col justify-between space-y-6 relative shadow-[0_0_40px_rgba(139,124,255,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#8B7CFF] text-white text-[10px] font-bold tracking-wider uppercase">
              Most Popular
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#F4F6FA]">Pro</h3>
                <p className="text-[#929BAC] mt-1">For fast-growing startups and professional engineering teams.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-[#F4F6FA]">
                  {annualBilling ? '₹2,000' : '₹2,400'}
                </span>
                <span className="text-[#657084]">/ month</span>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-[#242B38] text-[#929BAC]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Up to 20 active projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> 25 HTTP uptime monitors (1m intervals)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> 30-day deployment & log retention
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Advanced DORA metrics & P95 latency
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Up to 10 workspace team members
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Razorpay verified billing & priority support
                </li>
              </ul>
            </div>
            <Link
              to="/signup"
              className="w-full py-2.5 rounded-lg bg-[#8B7CFF] hover:bg-[#7A6AE6] text-white font-medium text-center transition-colors block shadow-[0_0_20px_rgba(139,124,255,0.3)]"
            >
              Start 14-Day Free Pro Trial
            </Link>
          </div>

          {/* Team / Scale Tier */}
          <div className="p-7 rounded-2xl bg-[#11151E] border border-[#242B38] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#F4F6FA]">Team</h3>
                <p className="text-[#929BAC] mt-1">For software agencies and scaling engineering organizations.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-[#F4F6FA]">
                  {annualBilling ? '₹6,580' : '₹7,900'}
                </span>
                <span className="text-[#657084]">/ month</span>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-[#242B38] text-[#929BAC]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Up to 100 active projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> 150 monitors (30s high-frequency intervals)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> 90-day log & audit retention
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> Granular RBAC (Owner, Admin, Developer, Viewer)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C58B]" /> 24/7 dedicated engineering support & custom SLA
                </li>
              </ul>
            </div>
            <Link
              to="/signup"
              className="w-full py-2.5 rounded-lg bg-[#171C27] hover:bg-[#242B38] border border-[#242B38] text-[#F4F6FA] font-medium text-center transition-colors block"
            >
              Get Started with Team
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-[#242B38] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8B7CFF]">
            Common Questions
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F6FA]">
            Frequently Asked Questions
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {[
            {
              q: 'How does DeployHQ connect to my GitHub and Vercel repositories?',
              a: 'DeployHQ uses official GitHub OAuth (or personal access tokens verified directly against api.github.com) to access repository branches, listen for webhook commit triggers with HMAC SHA-256 validation, and automatically track deployments without exposing credentials.',
            },
            {
              q: 'How are my environment variables and secrets secured?',
              a: 'All secrets are encrypted with AES-256 before being stored in server-side secret collections. Client-side queries are completely blocked in Firestore security rules (allow read, write: if false;), ensuring that API tokens and database URIs never leak to browsers.',
            },
            {
              q: 'Can I test DeployHQ locally before deploying to Firebase?',
              a: 'Yes! DeployHQ includes an isolated in-memory Demo Workspace that lets you evaluate all dashboard features without credentials, and fully supports the Firebase Local Emulator Suite (Firestore, Functions, Auth, Storage) for local development.',
            },
            {
              q: 'How does the error tracking system compare to Sentry?',
              a: 'DeployHQ includes a lightweight, typed client SDK with zero dependencies. Unhandled exceptions are automatically fingerprinted via SHA-256 based on error types and normalized stack traces, deduplicating repetitive alerts into clean issue groups.',
            },
            {
              q: 'How do custom domains and SSL verification work?',
              a: 'DeployHQ executes real-time DNS-over-HTTPS (DoH) queries against Google DNS (https://dns.google/resolve) to verify your CNAME configuration before cutover, and provisions auto-renewing TLS 1.3 certificates automatically.',
            },
          ].map((item, idx) => (
            <details
              key={idx}
              className="group p-4 rounded-xl bg-[#11151E] border border-[#242B38] transition-colors open:border-[#8B7CFF]/50"
            >
              <summary className="font-semibold text-[#F4F6FA] cursor-pointer flex items-center justify-between list-none">
                <span>{item.q}</span>
                <ChevronDown className="w-4 h-4 text-[#929BAC] group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-[#929BAC] leading-relaxed pt-2 border-t border-[#242B38]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. Pre-Footer Call to Action Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl p-8 sm:p-12 bg-gradient-to-r from-[#171C27] via-[#11151E] to-[#171C27] border border-[#8B7CFF]/40 text-center space-y-6 shadow-[0_0_60px_rgba(139,124,255,0.15)]">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F4F6FA]">
            Ready to ship faster and stay in control?
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-[#929BAC] leading-relaxed">
            Join thousands of developers and teams who deploy their production infrastructure with DeployHQ.
            Get started in less than 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-lg bg-[#8B7CFF] hover:bg-[#7A6AE6] text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(139,124,255,0.4)]"
            >
              <Rocket className="w-4 h-4" />
              <span>Create Free Account</span>
            </Link>
            <Link
              to="/overview"
              className="px-5 py-3 rounded-lg bg-[#090B10] hover:bg-[#11151E] border border-[#242B38] text-[#F4F6FA] font-medium text-xs sm:text-sm transition-colors"
            >
              Explore Live Demo Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="border-t border-[#242B38] bg-[#07090E] text-xs text-[#929BAC] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#8B7CFF]/20 border border-[#8B7CFF]/50 flex items-center justify-center text-[#8B7CFF]">
                <Rocket className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-[#F4F6FA]">DeployHQ</span>
            </div>
            <p className="text-[11px] text-[#657084] max-w-sm">
              The developer deployment & monitoring platform. Ship faster. Monitor smarter. Stay in control.
            </p>
            <Link
              to="/status"
              className="inline-flex items-center gap-2 text-[11px] text-[#22C58B] hover:underline"
            >
              <span className="w-2 h-2 rounded-full bg-[#22C58B] animate-pulse" />
              <span>All Systems Operational • 99.98% SLA (Live Status)</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            <div className="font-semibold text-[#F4F6FA]">Product</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#features" className="hover:text-[#F4F6FA] transition-colors">Deployments</a></li>
              <li><a href="#features" className="hover:text-[#F4F6FA] transition-colors">Uptime Probes</a></li>
              <li><a href="#features" className="hover:text-[#F4F6FA] transition-colors">Error Tracking</a></li>
              <li><a href="#features" className="hover:text-[#F4F6FA] transition-colors">Encrypted Secrets</a></li>
              <li><a href="#features" className="hover:text-[#F4F6FA] transition-colors">Custom Domains</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-semibold text-[#F4F6FA]">Integrations</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/integrations" className="hover:text-[#F4F6FA] transition-colors">GitHub OAuth</Link></li>
              <li><Link to="/integrations" className="hover:text-[#F4F6FA] transition-colors">Vercel API</Link></li>
              <li><Link to="/billing" className="hover:text-[#F4F6FA] transition-colors">Razorpay Orders</Link></li>
              <li><Link to="/logs" className="hover:text-[#F4F6FA] transition-colors">Node.js SDK</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-semibold text-[#F4F6FA]">Resources</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/docs" className="hover:text-[#F4F6FA] transition-colors">Developer Docs & CLI</Link></li>
              <li><Link to="/status" className="hover:text-[#F4F6FA] transition-colors">System Status (99.98% SLA)</Link></li>
              <li><a href="#architecture" className="hover:text-[#F4F6FA] transition-colors">Architecture Guide</a></li>
              <li><a href="#comparison" className="hover:text-[#F4F6FA] transition-colors">Tool Comparison</a></li>
              <li><a href="#faq" className="hover:text-[#F4F6FA] transition-colors">Support & FAQ</a></li>
              <li><Link to="/overview" className="hover:text-[#F4F6FA] transition-colors">Live Sandbox</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-[#242B38] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#657084]">
          <div>
            © {new Date().getFullYear()} DeployHQ Cloud Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#929BAC] cursor-pointer">Security Policy</span>
            <span className="hover:text-[#929BAC] cursor-pointer">Privacy Notice</span>
            <span className="hover:text-[#929BAC] cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
