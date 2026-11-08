import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  Bell,
  ArrowRight,
  Shield,
  Server,
  Zap,
  Activity,
  ChevronRight,
  Check,
  Send,
  X,
} from 'lucide-react';
import { ModalDialog } from '@/components/ui/ModalDialog';

interface SystemComponent {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime90d: number;
  description: string;
  latencyMs: number;
  days: { date: string; status: 'operational' | 'degraded' | 'incident' }[];
}

export const StatusPage: React.FC = () => {
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<{ service: string; date: string; status: string } | null>(null);

  // Generate 90 days history for components
  const generate90Days = (degradedIndex?: number): { date: string; status: 'operational' | 'degraded' | 'incident' }[] => {
    const list = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isIncident = degradedIndex !== undefined && i === degradedIndex;
      list.push({
        date: d.toISOString().slice(0, 10),
        status: isIncident ? ('degraded' as const) : ('operational' as const),
      });
    }
    return list;
  };

  const components: SystemComponent[] = [
    {
      id: 'edge',
      name: 'Global Edge Network & CDN',
      category: 'Delivery',
      status: 'operational',
      uptime90d: 99.99,
      description: 'Anycast DNS and 310+ Point of Presence global edge routing',
      latencyMs: 14,
      days: generate90Days(),
    },
    {
      id: 'builder',
      name: 'Cloud Build Engine & Container Pipeline',
      category: 'CI/CD Engine',
      status: 'operational',
      uptime90d: 99.95,
      description: 'Distributed isolated Nix/Docker build execution pods',
      latencyMs: 24,
      days: generate90Days(14),
    },
    {
      id: 'webhooks',
      name: 'GitHub Webhooks & VCS Ingestion',
      category: 'Integrations',
      status: 'operational',
      uptime90d: 99.98,
      description: 'Real-time commit hook processing with HMAC verification',
      latencyMs: 18,
      days: generate90Days(),
    },
    {
      id: 'monitoring',
      name: 'HTTP Health Checkers & Synthetic Probes',
      category: 'Observability',
      status: 'operational',
      uptime90d: 100.0,
      description: 'Multi-region 30-second ping daemon and SSL expiry watcher',
      latencyMs: 12,
      days: generate90Days(),
    },
    {
      id: 'api',
      name: 'REST API & CLI Gateway',
      category: 'Platform Core',
      status: 'operational',
      uptime90d: 99.99,
      description: 'Developer API, CLI dispatch and authentication tokens',
      latencyMs: 19,
      days: generate90Days(),
    },
    {
      id: 'db',
      name: 'Encrypted Secrets Vault & State DB',
      category: 'Storage',
      status: 'operational',
      uptime90d: 100.0,
      description: 'AES-256 GCM encrypted environment stores and audit journals',
      latencyMs: 15,
      days: generate90Days(),
    },
  ];

  const regions = [
    { name: 'North America (iad1 - US East)', latency: '12ms', status: 'Optimal' },
    { name: 'Europe (fra1 - Frankfurt)', latency: '22ms', status: 'Optimal' },
    { name: 'Asia Pacific (sin1 - Singapore)', latency: '38ms', status: 'Optimal' },
    { name: 'South Asia (bom1 - Mumbai)', latency: '16ms', status: 'Optimal' },
  ];

  const pastIncidents = [
    {
      id: 'inc_3',
      title: 'Resolved: Upstream Container Registry Rate Limit during Peak Build Window',
      date: 'November 2, 2026',
      status: 'Resolved',
      severity: 'Minor',
      timeline: [
        {
          time: '14:22 UTC',
          text: 'Resolved: Docker Hub mirror fallback routes stabilized build execution times across all regions.',
        },
        {
          time: '13:45 UTC',
          text: 'Monitoring: Traffic was redirected through European mirror mirrors; build queue backlog cleared.',
        },
        {
          time: '13:10 UTC',
          text: 'Investigating: Intermittent latency observed on cold-boot container pulling from third-party image repositories.',
        },
      ],
    },
    {
      id: 'inc_2',
      title: 'Completed: Scheduled Infrastructure Maintenance & Edge SSL Rotation',
      date: 'October 18, 2026',
      status: 'Completed',
      severity: 'Maintenance',
      timeline: [
        {
          time: '04:00 UTC',
          text: 'Maintenance completed successfully. Zero customer downtime experienced.',
        },
        {
          time: '02:00 UTC',
          text: 'Commencing scheduled edge SSL cert renewals and Anycast routing optimization.',
        },
      ],
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim() || !subscriberEmail.includes('@')) return;
    setSubscribedSuccess(true);
    setTimeout(() => {
      setSubscribeModalOpen(false);
      setSubscribedSuccess(false);
      setSubscriberEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-main text-text-primary flex flex-col font-sans selection:bg-primary/20">
      {/* Top Status Header Bar */}
      <header className="border-b border-border/80 bg-sidebar/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
              <Zap className="w-4 h-4 fill-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-text-primary">DeployHQ</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-card border border-border text-text-secondary uppercase">
                  Status
                </span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubscribeModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/40 text-xs font-medium text-text-primary transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-primary" />
              Subscribe to Updates
            </button>
            <Link
              to="/overview"
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-medium text-white transition-colors flex items-center gap-1"
            >
              Dashboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Overall Status Banner */}
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-status-success" />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-status-success"></span>
              </span>
              <h1 className="text-xl font-bold text-text-primary">All Systems Operational</h1>
            </div>
            <p className="text-xs text-text-secondary">
              Verified continuously across 4 global edge regions. Average response time: <span className="font-mono text-text-primary">16ms</span>.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-text-muted block">Current Status Window</span>
            <span className="text-xs font-mono text-status-success font-semibold">99.98% Past 90 Days</span>
          </div>
        </div>

        {/* Global Edge Region Latencies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Global Edge Performance
            </h2>
            <span className="text-[11px] text-text-muted">Synthetic probe interval: 30s</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {regions.map((reg) => (
              <div key={reg.name} className="p-3 rounded-xl bg-card border border-border space-y-1">
                <div className="text-[11px] text-text-secondary truncate">{reg.name}</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold font-mono text-text-primary">{reg.latency}</span>
                  <span className="text-[10px] font-medium text-status-success flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {reg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Health & 90-Day Bars */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              Core System Components
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                Operational
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-warning" />
                Degraded
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {components.map((comp) => (
              <div key={comp.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{comp.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-main border border-border text-text-muted">
                        {comp.category}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{comp.description}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:text-right">
                    <div className="text-xs font-mono text-text-muted hidden sm:block">
                      {comp.latencyMs}ms avg
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Operational
                    </span>
                  </div>
                </div>

                {/* 90-Day Bar Visualizer */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-0.5 h-6">
                    {comp.days.map((day, idx) => {
                      const isOk = day.status === 'operational';
                      return (
                        <div
                          key={idx}
                          onMouseEnter={() =>
                            setHoveredDay({
                              service: comp.name,
                              date: day.date,
                              status: isOk ? '100% Operational (0 incidents)' : 'Minor degraded latency (resolved)',
                            })
                          }
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`flex-1 h-full rounded-sm transition-opacity hover:opacity-100 ${
                            isOk
                              ? 'bg-status-success/70 hover:bg-status-success'
                              : 'bg-status-warning/80 hover:bg-status-warning'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>90 days ago</span>
                    <span>{comp.uptime90d}% uptime</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hover Tooltip display */}
          {hoveredDay && (
            <div className="p-2.5 rounded-lg bg-elevated border border-border text-xs flex items-center justify-between">
              <span className="text-text-primary font-medium">{hoveredDay.service}</span>
              <span className="font-mono text-text-secondary">
                {hoveredDay.date} — <span className="text-status-success">{hoveredDay.status}</span>
              </span>
            </div>
          )}
        </div>

        {/* Historical Incidents & Maintenance */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Past Incidents & Maintenance
          </h2>

          <div className="space-y-3">
            {pastIncidents.map((inc) => (
              <div key={inc.id} className="p-5 rounded-xl bg-card border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{inc.title}</h3>
                    <span className="text-[11px] text-text-muted">{inc.date}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-card border border-border text-text-secondary self-start sm:self-auto">
                    {inc.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {inc.timeline.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-3 text-xs">
                      <span className="font-mono text-text-muted text-[11px] shrink-0 mt-0.5">{step.time}</span>
                      <span className="text-text-secondary">{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Status Page Footer */}
      <footer className="border-t border-border/80 py-8 bg-sidebar/50 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div>
            Powered by <span className="text-text-primary font-medium">DeployHQ Global Health Probe Network</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="hover:text-text-primary transition-colors">
              API Docs
            </Link>
            <Link to="/" className="hover:text-text-primary transition-colors">
              Platform Home
            </Link>
            <Link to="/overview" className="hover:text-text-primary transition-colors">
              Launch Console
            </Link>
          </div>
        </div>
      </footer>

      {/* Subscribe to Status Updates Modal */}
      {subscribeModalOpen && (
        <ModalDialog
          open={true}
          onClose={() => setSubscribeModalOpen(false)}
          title="Subscribe to Incident & Maintenance Alerts"
        >
          <div className="space-y-4 text-xs">
            <p className="text-text-secondary">
              Receive instant email notifications whenever an incident is reported, updated, or resolved on DeployHQ infrastructure.
            </p>

            {subscribedSuccess ? (
              <div className="p-4 rounded-xl bg-status-success/15 border border-status-success/30 text-status-success flex items-center gap-2 text-sm font-medium">
                <Check className="w-4 h-4" />
                Subscribed successfully! You will receive critical incident updates.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div>
                  <label className="block text-text-secondary mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="devops@yourteam.com"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-main border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubscribeModalOpen(false)}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Subscribe
                  </button>
                </div>
              </form>
            )}
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
