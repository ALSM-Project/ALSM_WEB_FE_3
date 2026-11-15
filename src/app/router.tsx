import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '@/shared/layouts/AppLayout';
import PublicLayout from '@/shared/layouts/PublicLayout';
import AccountSettingsLayout from '@/shared/layouts/AccountSettingsLayout';
import { GuestRoute, ProtectedRoute, RoleGuard, CapabilityGuard, ContractStatusGuard, PasswordCallbackPage, AuthCallbackPage } from './guards';

// Feature Modules
import { LandingPage, RegisterPage, LoginPage, PasswordRecoveryPage, FaqPage, ContactPage, ResetPasswordPage, VerifyEmailPage } from '@/features/auth';
import { DocsPage, WorkspaceDocsPage } from '@/features/docs';

import {
  ProfileInfoPage,
  PreferencesPage,
  ChangePasswordPage,
  TwoFactorAuthenticationPage,
  ActiveSessionsPage,
} from '@/features/account';
import {
  ModernizationDashboardPage,
  AdaptiveDashboardPage,
  ProjectsListPage,
  ProjectOverviewPage,
  AdaptiveProjectDetailPage,
  CreateProjectPage,
  DeleteProjectPage,
  ProjectFilesPage,
} from '@/features/projects';
import { UploadSourcePage, ScreensListPage } from '@/features/screens';
import {
  ConvertScreenPage,
  BulkConvertPage,
  ResultInspectionPage,
  VersionHistoryPage,
  PreviewStudioPage,
  FieldMappingPage,
  MethodMappingPage,
  ExportCodePage,
  ReviewFindingsPage,
  InitialQualityReviewPage,
} from '@/features/conversion';
import { WorkspaceContactPage } from '@/features/contact';
import { DiagnosticsPage } from '@/features/diagnostics';
import { Web1WorkspacePreview } from '@/features/preview/Web1WorkspacePreview';
import { InvoicesPage, ContractsPage, RequestEnterprisePage, TrialActivationPage, UsageStatsPage } from '@/features/billing';
import { CreateContractWizardPage } from '@/features/contracts/pages/CreateContractWizardPage';
import { ContractDetailPage } from '@/features/contracts/pages/ContractDetailPage';
import { MeetingsPage, CreateMeetingRequestPage } from '@/features/meetings';
import { ConversationsPage } from '@/features/conversations';
import {
  OrganizationProfilePage,
  OrganizationMembersPage,
  OrganizationTeamsPage,
  OrganizationProjectsPage,
  OrganizationRolesPage,
  OrganizationAnalyticsPage,
  OrganizationAuditLogsPage,
} from '@/features/organization';
import {
  ManagedDashboardPage,
  ManagedProjectsListPage,
  ManagedProjectDetailPage,
} from '@/features/managed';
import { DeliverablesPage } from '@/features/deliverables/pages/DeliverablesPage';
import { DownloadsPage } from '@/features/downloads/pages/DownloadsPage';
import { ServiceCatalogPage } from '@/features/catalog/pages/ServiceCatalogPage';
import {
  ConversionRequestsListPage,
  SubmitConversionRequestPage,
  ConversionRequestDetailPage,
} from '@/features/conversion-requests';

export const router = createBrowserRouter([
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/auth/password-callback', element: <PasswordCallbackPage /> },
  // Public Routes (Header & Layout for all visitors)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/contact', element: <ContactPage /> },
    ],
  },

  // Guest-only Routes (login / register / password recovery / email verification)
  {
    element: <GuestRoute />,
    children: [
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <PasswordRecoveryPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // Authenticated App Routes (Web 1 PoC Workspace)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Adaptive Modernization Workspace Entry Points (Auto-switches based on Contract: Platform-Based vs Managed)
          { path: '/dashboard', element: <AdaptiveDashboardPage /> },
          { path: '/workspace-preview', element: <Web1WorkspacePreview /> },
          { path: '/workspace/docs', element: <WorkspaceDocsPage /> },

          { path: '/workspace/contact', element: <WorkspaceContactPage /> },
          { path: '/projects', element: <ProjectsListPage /> },
          { path: '/projects/:projectId', element: <AdaptiveProjectDetailPage /> },
          { path: '/projects/:id', element: <AdaptiveProjectDetailPage /> },

          // Legacy Self-Service Routes (Preserved for backwards-compatibility)
          { path: '/self-service-dashboard', element: <ModernizationDashboardPage /> },
          { path: '/self-service-projects', element: <ProjectsListPage /> },
          { path: '/self-service-projects/:projectId', element: <ProjectOverviewPage /> },

          // Account Security Nested Subroutes
          {
            element: <AccountSettingsLayout />,
            children: [
              { path: '/account', element: <Navigate to="/account/profile" replace /> },
              { path: '/account/profile', element: <ProfileInfoPage /> },
              { path: '/account/preferences', element: <PreferencesPage /> },
              { path: '/account/security', element: <Navigate to="/account/security/password" replace /> },
              { path: '/account/security/password', element: <ChangePasswordPage /> },
              { path: '/account/security/2fa', element: <TwoFactorAuthenticationPage /> },
              { path: '/account/security/sessions', element: <ActiveSessionsPage /> },
            ],
          },

          // Self-Service & Workspace Direct Routes
          { path: '/screens', element: <ScreensListPage /> },
          { path: '/conversion-history', element: <BulkConvertPage /> },
          { path: '/project-files', element: <ProjectFilesPage /> },
          { path: '/conversion-queue', element: <BulkConvertPage /> },
          { path: '/conversion-results', element: <ResultInspectionPage /> },
          { path: '/diagnostics', element: <DiagnosticsPage /> },

          // Project & Conversion Pipeline Routes Guarded Against Suspended / Expired Contracts
          {
            element: <ContractStatusGuard allowSuspended={false} />,
            children: [
              { path: '/projects/new', element: <CreateProjectPage /> },
              { path: '/projects/:projectId/upload', element: <UploadSourcePage /> },
              { path: '/projects/:projectId/screens/:screenId/convert', element: <ConvertScreenPage /> },
              { path: '/projects/:projectId/screens/bulk-convert', element: <BulkConvertPage /> },
              { path: '/projects/:projectId/delete', element: <DeleteProjectPage /> },
              { path: '/conversion-requests/new', element: <SubmitConversionRequestPage /> },
            ],
          },

          // Inspection & Review Pipeline Routes (Read-Safe for Analysis)
          { path: '/projects/:projectId/screens', element: <ScreensListPage /> },
          { path: '/projects/:projectId/screens/:screenId/result', element: <ResultInspectionPage /> },
          // UC-31: Review Initial Conversion Quality — allowed for standard users (USER, MEMBER, ENGINEER, ADMIN, OWNER, etc.)
          {
            element: <RoleGuard allowedRoles={['USER', 'MEMBER', 'ENGINEER', 'ADMIN', 'OWNER', 'ENTERPRISE_CUSTOMER', 'ENTERPRISE_ADMIN', 'PARTNER', 'ORGANIZATION_OWNER']} />,
            children: [
              { path: '/projects/:projectId/screens/:screenId/quality-review', element: <InitialQualityReviewPage /> },
            ],
          },
          { path: '/projects/:projectId/screens/:screenId/history', element: <VersionHistoryPage /> },
          { path: '/projects/:projectId/screens/:screenId/preview', element: <PreviewStudioPage /> },
          { path: '/projects/:projectId/screens/:screenId/mapping', element: <FieldMappingPage /> },
          { path: '/projects/:projectId/screens/:screenId/method-mapping', element: <MethodMappingPage /> },
          { path: '/projects/:projectId/screens/:screenId/review', element: <ReviewFindingsPage /> },
          { path: '/projects/:projectId/export', element: <ExportCodePage /> },
          { path: '/projects/:projectId/diagnostics', element: <DiagnosticsPage /> },

          // Billing & Enterprise Upgrade Routes (UC-32 & UC-35) & Invoices & Contracts (S25)
          { path: '/billing/usage', element: <UsageStatsPage /> },
          { path: '/billing/upgrade', element: <RequestEnterprisePage /> },
          { path: '/billing/trial', element: <TrialActivationPage /> },
          { path: '/billing/invoices', element: <InvoicesPage /> },
          { path: '/billing/contracts', element: <ContractsPage /> },
          { path: '/billing/contracts/new', element: <CreateContractWizardPage /> },
          { path: '/billing/contracts/:id', element: <ContractDetailPage /> },
          { path: '/contracts', element: <Navigate to="/billing/contracts" replace /> },
          { path: '/contracts/new', element: <Navigate to="/billing/contracts/new" replace /> },
          { path: '/contracts/:id', element: <ContractDetailPage /> },
          { path: '/quotas', element: <Navigate to="/billing/usage" replace /> },
          { path: '/subscription', element: <Navigate to="/billing/contracts" replace /> },
          { path: '/upgrade-plan', element: <Navigate to="/billing/upgrade" replace /> },

          // Communication & Meeting Routes
          { path: '/meetings', element: <MeetingsPage /> },
          { path: '/meetings/new', element: <CreateMeetingRequestPage /> },
          { path: '/meeting', element: <Navigate to="/meetings" replace /> },
          { path: '/meeting-requests', element: <MeetingsPage /> },
          { path: '/meeting-requests/new', element: <CreateMeetingRequestPage /> },
          { path: '/conversations', element: <ConversationsPage /> },
          { path: '/support-requests', element: <WorkspaceContactPage /> },

          // Managed Modernization Services (Turnkey Managed) Routes
          { path: '/managed-dashboard', element: <ManagedDashboardPage /> },
          { path: '/managed-projects', element: <ManagedProjectsListPage /> },
          { path: '/managed-projects/:id', element: <ManagedProjectDetailPage /> },
          { path: '/project-progress', element: <ManagedProjectsListPage /> },
          { path: '/service-catalog', element: <ServiceCatalogPage /> },
          {
            element: <CapabilityGuard capability="deliverable.view" />,
            children: [
              { path: '/deliverables', element: <DeliverablesPage /> },
              { path: '/deliverables-sign-off', element: <Navigate to="/deliverables" replace /> },
              { path: '/downloads', element: <DownloadsPage /> },
            ],
          },
          {
            element: <CapabilityGuard capability="conversion_request.view" />,
            children: [
              { path: '/conversion-requests', element: <ConversionRequestsListPage /> },
              { path: '/conversion-requests/:requestId', element: <ConversionRequestDetailPage /> },
            ],
          },

          // Enterprise Organisation Routes (WEB_3) Guarded by Organization Capability
          {
            element: (
              <CapabilityGuard
                capability={[
                  'organization.view',
                  'organization.members.view',
                  'organization.teams.view',
                  'project.view',
                ]}
              />
            ),
            children: [
              { path: '/settings/organization', element: <OrganizationProfilePage /> },
              { path: '/organization/profile', element: <Navigate to="/settings/organization" replace /> },
              { path: '/organisation/profile', element: <Navigate to="/settings/organization" replace /> },
              { path: '/account/company', element: <Navigate to="/settings/organization" replace /> },
              { path: '/account/company-profile', element: <Navigate to="/settings/organization" replace /> },
              { path: '/settings/team', element: <OrganizationMembersPage /> },
              { path: '/settings/teams', element: <OrganizationTeamsPage /> },
              { path: '/settings/members', element: <OrganizationMembersPage /> },
              { path: '/organisation/members', element: <OrganizationMembersPage /> },
              { path: '/organization/members', element: <OrganizationMembersPage /> },
              { path: '/project-members', element: <Navigate to="/organization/members" replace /> },
              { path: '/organisation/teams', element: <OrganizationTeamsPage /> },
              { path: '/organization/teams', element: <OrganizationTeamsPage /> },
              { path: '/internal-teams', element: <Navigate to="/organization/teams" replace /> },
              { path: '/organisation/projects', element: <OrganizationProjectsPage /> },
              { path: '/organization/projects', element: <OrganizationProjectsPage /> },
              { path: '/settings/roles', element: <OrganizationRolesPage /> },
              { path: '/organisation/roles', element: <OrganizationRolesPage /> },
              { path: '/organization/roles', element: <OrganizationRolesPage /> },
              { path: '/organisation/analytics', element: <OrganizationAnalyticsPage /> },
              { path: '/organization/analytics', element: <OrganizationAnalyticsPage /> },
              { path: '/organisation/audit-logs', element: <OrganizationAuditLogsPage /> },
              { path: '/organization/audit-logs', element: <OrganizationAuditLogsPage /> },
              { path: '/project-activity', element: <Navigate to="/organization/audit-logs" replace /> },
            ],
          },

          // Partner Portal Route Aliases
          { path: '/portal/dashboard', element: <Navigate to="/dashboard" replace /> },
          { path: '/portal/projects', element: <Navigate to="/projects" replace /> },
          { path: '/portal/downloads', element: <Navigate to="/downloads" replace /> },
        ],
      },
    ],
  },

  // Fallback Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);

