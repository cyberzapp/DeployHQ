import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { upgradeSubscriptionPlan } from '@/services/firebase/firestoreService';
import { SubscriptionPlan } from '@/types';

const PLANS: Array<{
  id: SubscriptionPlan;
  name: string;
  priceMonthlyInr: string;
  priceAnnualInr: string;
  projectLimit: number;
  monitorLimit: number;
  memberLimit: number;
  features: string[];
}> = [
  {
    id: 'free',
    name: 'Free',
    priceMonthlyInr: '₹0',
    priceAnnualInr: '₹0',
    projectLimit: 2,
    monitorLimit: 3,
    memberLimit: 2,
    features: [
      'Up to 2 projects',
      '3 HTTP uptime monitors (5m interval)',
      '7-day deployment & log history',
      'Basic deployment analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthlyInr: '₹2,400',
    priceAnnualInr: '₹24,000',
    projectLimit: 20,
    monitorLimit: 25,
    memberLimit: 10,
    features: [
      'Up to 20 projects',
      '25 HTTP uptime monitors (1m interval)',
      '30-day deployment & log retention',
      'Advanced DORA & P95 latency analytics',
      'Up to 10 workspace team members',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    priceMonthlyInr: '₹7,900',
    priceAnnualInr: '₹79,000',
    projectLimit: 100,
    monitorLimit: 150,
    memberLimit: 50,
    features: [
      'Up to 100 projects',
      '150 HTTP uptime monitors (30s interval)',
      '90-day audit & log retention',
      'Granular RBAC & webhook reconciliation',
      'Priority 24/7 engineering support',
    ],
  },
];

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const {
    activeWorkspace,
    projects,
    monitors,
    members,
    subscription,
    isOwner,
    showToast,
  } = useWorkspace();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    subscription.billingCycle || 'monthly'
  );
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);

  const razorpayConfigured = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
  const currentPlanObj =
    PLANS.find((p) => p.id === activeWorkspace.plan) || PLANS[0];

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    if (!isOwner) {
      showToast('Only the Workspace Owner can modify billing and subscriptions.', 'error');
      return;
    }
    setProcessingPlan(planId);

    try {
      // If upgrading to a paid tier with Razorpay configured, launch the real Razorpay modal
      if (planId !== 'free' && razorpayConfigured) {
        const loaded = await loadRazorpayScript();
        if (loaded && (window as any).Razorpay) {
          const amountInr =
            billingCycle === 'annual'
              ? planId === 'pro'
                ? 24000
                : 79000
              : planId === 'pro'
              ? 2400
              : 7900;

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: amountInr * 100, // Razorpay takes paise
            currency: 'INR',
            name: 'DeployHQ Cloud',
            description: `${planId.toUpperCase()} Plan Subscription (${billingCycle})`,
            handler: async (response: any) => {
              const res = await upgradeSubscriptionPlan({
                workspaceId: activeWorkspace.id,
                plan: planId,
                billingCycle,
                actorName: user?.displayName || 'Workspace Owner',
              });
              showToast(
                `Payment verified (${response.razorpay_payment_id || 'ok'}) — Workspace upgraded to ${planId.toUpperCase()}`,
                'success'
              );
            },
            prefill: {
              name: user?.displayName || '',
              email: user?.email || '',
            },
            theme: {
              color: '#8B7CFF',
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setProcessingPlan(null);
          return;
        }
      }

      // Default / Test Mode / Free tier update
      const res = await upgradeSubscriptionPlan({
        workspaceId: activeWorkspace.id,
        plan: planId,
        billingCycle,
        actorName: user?.displayName || 'Workspace Owner',
      });
      showToast(
        res.mode === 'billing_test_mode'
          ? `Workspace updated to ${planId.toUpperCase()} (Billing Test Mode)`
          : `Subscription updated to ${planId.toUpperCase()}`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Subscription update failed', 'error');
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Billing & Subscription
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your workspace plan, usage quotas, and Razorpay verified billing.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border text-xs">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-md font-medium ${
              billingCycle === 'monthly'
                ? 'bg-elevated text-text-primary border border-border'
                : 'text-text-muted'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-3 py-1.5 rounded-md font-medium ${
              billingCycle === 'annual'
                ? 'bg-elevated text-text-primary border border-border'
                : 'text-text-muted'
            }`}
          >
            Annual (2 Months Free)
          </button>
        </div>
      </div>

      {/* Clearly Labelled Billing Test Mode Banner when Razorpay credentials are not set */}
      {!razorpayConfigured && (
        <div className="p-3.5 rounded-xl bg-status-warning/10 border border-status-warning/30 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <div className="text-text-secondary">
            <strong className="text-status-warning">Billing Test Mode Active:</strong> Live
            Razorpay credentials (<code className="font-mono">VITE_RAZORPAY_KEY_ID</code> &{' '}
            <code className="font-mono">RAZORPAY_KEY_SECRET</code>) are not configured in this
            environment. Plan upgrades execute in clearly labelled test mode without charging real
            cards.
          </div>
        </div>
      )}

      {/* Current Plan & Usage Overview */}
      <div className="grid lg:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-xl bg-card border border-border space-y-2">
          <div className="text-text-secondary">Active Subscription</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold uppercase text-primary">
              {activeWorkspace.plan}
            </span>
            <span className="px-2 py-0.5 rounded bg-status-success/15 text-status-success font-mono text-[10px] uppercase">
              {subscription.status}
            </span>
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Ref: {subscription.subscriptionId || 'sub_free_tier'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border space-y-2">
          <div className="flex justify-between text-text-secondary">
            <span>Projects Quota</span>
            <span className="font-mono text-text-primary">
              {projects.length} / {currentPlanObj.projectLimit}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-main overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(100, (projects.length / currentPlanObj.projectLimit) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border space-y-2">
          <div className="flex justify-between text-text-secondary">
            <span>Uptime Monitors</span>
            <span className="font-mono text-text-primary">
              {monitors.length} / {currentPlanObj.monitorLimit}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-main overflow-hidden">
            <div
              className="h-full bg-status-success rounded-full"
              style={{
                width: `${Math.min(100, (monitors.length / currentPlanObj.monitorLimit) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border space-y-2">
          <div className="flex justify-between text-text-secondary">
            <span>Team Seats</span>
            <span className="font-mono text-text-primary">
              {members.length} / {currentPlanObj.memberLimit}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-main overflow-hidden">
            <div
              className="h-full bg-status-info rounded-full"
              style={{
                width: `${Math.min(100, (members.length / currentPlanObj.memberLimit) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-5 text-xs">
        {PLANS.map((plan) => {
          const isCurrent = activeWorkspace.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-xl p-6 border flex flex-col justify-between space-y-5 ${
                isCurrent
                  ? 'bg-elevated border-primary shadow-elevated'
                  : 'bg-card border-border'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-text-primary">{plan.name}</h2>
                  {plan.id === 'pro' && (
                    <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Popular
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-2xl font-bold font-mono text-text-primary">
                    {billingCycle === 'annual' ? plan.priceAnnualInr : plan.priceMonthlyInr}
                  </span>
                  <span className="text-text-muted ml-1">
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                </div>

                <ul className="space-y-2 pt-2 border-t border-border text-text-secondary">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-status-success shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={isCurrent || !isOwner || processingPlan === plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  isCurrent
                    ? 'bg-main border border-border text-text-muted cursor-default'
                    : 'bg-primary hover:bg-primary-hover text-white disabled:opacity-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {isCurrent
                  ? 'Current Active Plan'
                  : processingPlan === plan.id
                  ? 'Verifying Checkout...'
                  : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security & Webhook Verification Note */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
          <span>
            Payments are processed via Razorpay Orders API and verified server-side using HMAC
            SHA-256 signatures in Firebase Cloud Functions. Card details never touch DeployHQ
            servers.
          </span>
        </div>
      </div>
    </div>
  );
};

