import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Rocket,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Terminal,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AuthScreen: React.FC<{
  mode: 'login' | 'signup' | 'forgot' | 'reset' | 'verify' | 'unauthorized';
}> = ({ mode }) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    resendVerificationEmail,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex.mercer@deployhq.dev');
  const [password, setPassword] = useState('••••••••••••');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        const dest = (location.state as any)?.from || '/overview';
        navigate(dest);
      } else if (mode === 'signup') {
        await signUpWithEmail(name, email, password);
        navigate('/onboarding');
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setStatusMsg(`Password reset instructions sent to ${email}.`);
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        setStatusMsg('Your password has been updated. Redirecting to sign in...');
        setTimeout(() => navigate('/login'), 1500);
      } else if (mode === 'verify') {
        await resendVerificationEmail();
        setStatusMsg('Verification email resent. Check your inbox.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'unauthorized') {
    return (
      <div className="min-h-screen bg-main text-text-primary flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 text-center space-y-4 shadow-elevated">
          <div className="w-12 h-12 rounded-xl bg-status-error/15 border border-status-error/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-status-error" />
          </div>
          <h1 className="text-lg font-semibold">Access Denied — Insufficient Role</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Your workspace membership role does not grant permission to perform this operation or
            access this resource. Contact your Workspace Owner or Admin to request role elevation.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/overview"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium"
            >
              Return to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main text-text-primary grid lg:grid-cols-2">
      {/* Left Side — Brand & Product Dashboard Illustration */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar border-r border-border relative overflow-hidden">
        <div>
          <Link to="/overview" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-base tracking-tight">DeployHQ</span>
          </Link>

          <div className="mt-14 max-w-lg">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-elevated border border-border text-[11px] text-primary font-mono mb-4">
              SHIP FASTER • MONITOR SMARTER • STAY IN CONTROL
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary leading-tight">
              Your deployments. One command center.
            </h1>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Connect GitHub repositories, orchestrate Vercel deployments, inspect real-time build
              logs, run automated HTTP health checks, and track production errors from one unified
              developer workspace.
            </p>
          </div>

          {/* Product Dashboard Illustration Card */}
          <div className="mt-10 rounded-xl bg-card border border-border shadow-elevated overflow-hidden">
            <div className="px-4 py-2.5 bg-elevated border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-status-error/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-status-warning/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-status-success/70" />
                <span className="ml-2 font-mono text-[11px] text-text-secondary">
                  deployhq://acme-cloud/nexus-web-platform
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-status-success/15 text-status-success font-mono text-[10px]">
                READY • 99.98% UPTIME
              </span>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-main border border-border">
                  <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-primary" />
                    Latest Deploy
                  </div>
                  <div className="mt-1 font-mono font-semibold text-text-primary">main@8a4f92c</div>
                  <div className="text-[10px] text-status-success mt-0.5">Published in 44s</div>
                </div>
                <div className="p-3 rounded-lg bg-main border border-border">
                  <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-status-success" />
                    Edge Latency
                  </div>
                  <div className="mt-1 font-mono font-semibold text-text-primary">79ms P95</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">iad1 • fra1 • sin1</div>
                </div>
                <div className="p-3 rounded-lg bg-main border border-border">
                  <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-status-info" />
                    Error Rate
                  </div>
                  <div className="mt-1 font-mono font-semibold text-text-primary">0.012%</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">Fingerprinted SHA-256</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-main border border-border font-mono text-[11px] space-y-1 text-text-secondary">
                <div className="text-text-muted">10:14:18.420 [INFO] ▲ Next.js 15.0.3 production build</div>
                <div className="text-text-muted">10:14:36.890 [INFO] ✓ Compiled 42 routes in 18.4s</div>
                <div className="text-status-success">
                  10:14:45.112 [READY] ✓ Aliased to https://app.acmecloud.dev
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-text-muted flex items-center justify-between pt-6 border-t border-border">
          <span>© 2026 DeployHQ Inc. Secured by Firebase & Cloud Functions.</span>
          <span>SOC2 • TLS 1.3</span>
        </div>
      </div>

      {/* Right Side — Authentication Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">DeployHQ</span>
            </div>

            <h2 className="text-xl font-semibold text-text-primary">
              {mode === 'login' && 'Sign in to DeployHQ'}
              {mode === 'signup' && 'Create your DeployHQ account'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Choose a new password'}
              {mode === 'verify' && 'Verify your email address'}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {mode === 'login' && 'Enter your developer credentials or continue with Google OAuth.'}
              {mode === 'signup' && 'Start managing deployments and uptime checks in minutes.'}
              {mode === 'forgot' && 'We will send a secure password reset link to your email.'}
              {mode === 'reset' && 'Enter a strong password of at least 8 characters.'}
              {mode === 'verify' && 'Confirm your email address to unlock full workspace access.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-xs text-status-error">
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-xs text-status-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={async () => {
                  await signInWithGoogle();
                  navigate(mode === 'signup' ? '/onboarding' : '/overview');
                }}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-card hover:bg-elevated border border-border text-xs font-medium text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 19.9 7.4 23 12 23z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border" />
                <span className="shrink mx-3 text-[11px] text-text-muted uppercase">
                  or with email
                </span>
                <div className="flex-grow border-t border-border" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block text-text-secondary mb-1.5 font-medium">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {mode !== 'reset' && mode !== 'verify' && (
              <div>
                <label className="block text-text-secondary mb-1.5 font-medium">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.dev"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-text-secondary font-medium">Password</label>
                  {mode === 'login' && (
                    <Link to="/forgot-password" className="text-primary hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <label className="block text-text-secondary mb-1.5 font-medium">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
            >
              <span>
                {mode === 'login' && 'Sign In to Workspace'}
                {mode === 'signup' && 'Create Account & Start Setup'}
                {mode === 'forgot' && 'Send Reset Link'}
                {mode === 'reset' && 'Update Password'}
                {mode === 'verify' && 'Resend Verification Email'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-xs text-center text-text-secondary pt-2 border-t border-border">
            {mode === 'login' && (
              <span>
                New to DeployHQ?{' '}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Create a developer account
                </Link>
              </span>
            )}
            {mode === 'signup' && (
              <span>
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </span>
            )}
            {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
              <Link to="/login" className="text-primary font-medium hover:underline">
                ← Back to sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

