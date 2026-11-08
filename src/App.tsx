import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthScreen } from '@/pages/auth/AuthPages';
import { OnboardingPage } from '@/pages/auth/OnboardingPage';
import { OverviewPage } from '@/pages/dashboard/OverviewPage';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

const LandingPage = lazy(() =>
  import('@/pages/marketing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const DocsPage = lazy(() =>
  import('@/pages/docs/DocsPage').then((m) => ({ default: m.DocsPage }))
);
const StatusPage = lazy(() =>
  import('@/pages/status/StatusPage').then((m) => ({ default: m.StatusPage }))
);
const ActivityPage = lazy(() =>
  import('@/pages/activity/ActivityPage').then((m) => ({ default: m.ActivityPage }))
);
const ProjectsPage = lazy(() =>
  import('@/pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import('@/pages/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const DeploymentsPage = lazy(() =>
  import('@/pages/deployments/DeploymentsPage').then((m) => ({ default: m.DeploymentsPage }))
);
const DeploymentDetailPage = lazy(() =>
  import('@/pages/deployments/DeploymentDetailPage').then((m) => ({
    default: m.DeploymentDetailPage,
  }))
);
const MonitoringPage = lazy(() =>
  import('@/pages/monitoring/MonitoringPage').then((m) => ({ default: m.MonitoringPage }))
);
const ErrorTrackingPage = lazy(() =>
  import('@/pages/monitoring/ErrorTrackingPage').then((m) => ({ default: m.ErrorTrackingPage }))
);
const AlertsPage = lazy(() =>
  import('@/pages/monitoring/AlertsPage').then((m) => ({ default: m.AlertsPage }))
);
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const IntegrationsPage = lazy(() =>
  import('@/pages/integrations/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage }))
);
const EnvironmentsPage = lazy(() =>
  import('@/pages/environments/EnvironmentsPage').then((m) => ({ default: m.EnvironmentsPage }))
);
const TeamPage = lazy(() =>
  import('@/pages/team/TeamPage').then((m) => ({ default: m.TeamPage }))
);
const BillingPage = lazy(() =>
  import('@/pages/billing/BillingPage').then((m) => ({ default: m.BillingPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-main text-text-primary flex items-center justify-center text-xs text-text-secondary">
        Verifying session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Suspense fallback={<DashboardSkeleton />}>
              <Routes>
                {/* Public Marketing & Documentation Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/status" element={<StatusPage />} />

                {/* Public & Auth Routes */}
                <Route path="/login" element={<AuthScreen mode="login" />} />
                <Route path="/signup" element={<AuthScreen mode="signup" />} />
                <Route path="/forgot-password" element={<AuthScreen mode="forgot" />} />
                <Route path="/reset-password" element={<AuthScreen mode="reset" />} />
                <Route path="/verify-email" element={<AuthScreen mode="verify" />} />
                <Route path="/unauthorized" element={<AuthScreen mode="unauthorized" />} />

                {/* Onboarding Flow */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Workspace Application */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/overview" element={<OverviewPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/deployments" element={<DeploymentsPage />} />
                  <Route path="/deployments/:deploymentId" element={<DeploymentDetailPage />} />
                  <Route path="/monitoring" element={<MonitoringPage />} />
                  <Route path="/logs" element={<ErrorTrackingPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/environments" element={<EnvironmentsPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

