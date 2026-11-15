import { Lock } from 'lucide-react';
import React, { useEffect, useRef, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getTargetHandoffUrl, redirectUserToPortal } from '@/app/providers';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useBootstrap } from '@/context/BootstrapContext';
import { tokenStore } from '@/services/api/tokenStore';
import { ChangePasswordPage } from '@/features/account/pages/ChangePasswordPage';
import { ROUTES } from '@/shared/constants/routes';

// Route guards (FE guideline 03 §5). The frontend guard is a UX concern only —
// the backend remains the real security boundary.

/** Wraps authenticated routes; redirects to /login and remembers returnTo. */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Don't redirect before bootstrap resolves (FE guideline 03 §8).
  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={ROUTES.PUBLIC.LOGIN} state={{ returnTo }} replace />;
  }

  // Cross-portal redirect if user belongs elsewhere (Web 1 or Web 2):
  const targetHandoff = getTargetHandoffUrl(user);
  if (targetHandoff) {
    redirectUserToPortal(targetHandoff);
    return <RouteLoading />;
  }

  if (user?.mustChangePassword) {
    if (location.pathname !== '/account/security/password') return <Navigate to="/account/security/password" replace />;
    return <ChangePasswordPage />;
  }
  return <Outlet />;
};

/** Wraps guest-only routes (login/register); redirects to FE1 for central SSO authentication. */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    const targetHandoff = getTargetHandoffUrl(user);
    if (targetHandoff) {
      redirectUserToPortal(targetHandoff);
      return <RouteLoading />;
    }
    if (user?.mustChangePassword) return <Navigate to="/account/security/password" replace />;
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export function RouteLoading(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export interface RoleGuardProps {
  allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] p-4 text-center">
        <div className="text-gray-400 mb-4">
          <Lock className="w-16 h-16 text-slate-400 mx-auto" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 max-w-md">You do not have the required permissions to view this page.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export interface CapabilityGuardProps {
  capability: string | string[];
  fallbackRoute?: string;
}

/**
 * Big Tech Capability Guard (Salesforce / AWS / Atlassian Entitlements pattern).
 * Evaluates whether current user + plan + contract possesses the specified capability.
 */
export const CapabilityGuard: React.FC<CapabilityGuardProps> = ({ capability, fallbackRoute }) => {
  const { can, isLoading } = useBootstrap();
  const navigate = useNavigate();

  const hasCapability = useMemo(() => {
    if (Array.isArray(capability)) {
      return capability.some((c) => can(c));
    }
    return can(capability);
  }, [capability, can]);

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!hasCapability) {
    const requiredCaps = Array.isArray(capability) ? capability.join(', ') : capability;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] p-4 text-center">
        <div className="text-gray-400 mb-4">
          <Lock className="w-16 h-16 text-slate-400 mx-auto" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          Your organization subscription plan or contract capabilities do not include this feature ({requiredCaps}).
        </p>
        <button
          onClick={() => (fallbackRoute ? navigate(fallbackRoute) : navigate(-1))}
          className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export interface ContractStatusGuardProps {
  allowSuspended?: boolean;
}

export const ContractStatusGuard: React.FC<ContractStatusGuardProps> = ({ allowSuspended = false }) => {
  const { isSuspended, isExpired, isLoading } = useWorkspace();
  const navigate = useNavigate();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!allowSuspended && (isSuspended || isExpired)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F7F9FC] p-6 text-center rounded-xl border border-amber-200 mt-6 mx-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isSuspended ? 'Contract Suspended' : 'Contract Expired'}
        </h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          Conversion operations and project updates are currently restricted due to your organization contract status.
          Please review your subscription terms or request assistance from our support team.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/billing/contracts')}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors cursor-pointer"
          >
            View Contracts
          </button>
          <button
            onClick={() => navigate('/workspace/contact')}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

/** Remediation handoff from the staff portal. Credentials never enter a query log. */
export const PasswordCallbackPage = () => {
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token'), refreshToken = params.get('refresh_token');
    window.history.replaceState(null, '', '/auth/password-callback');
    if (accessToken && refreshToken) {
      void tokenStore.acceptTokens({ accessToken, refreshToken, mustChangePassword: true, hasPassword: params.get('has_password') !== 'false' })
        .then(() => window.location.replace('/account/security/password'))
        .catch(() => window.location.replace('/login'));
    } else window.location.replace('/login');
  }, []);
  return <RouteLoading />;
};

export const AuthCallbackPage = () => {
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    window.history.replaceState(null, '', '/auth/callback');
    if (accessToken && refreshToken) {
      void tokenStore.acceptTokens({ accessToken, refreshToken })
        .then(() => window.location.replace('/dashboard'))
        .catch(() => window.location.replace('/login'));
    } else {
      window.location.replace('/login');
    }
  }, []);
  return <RouteLoading />;
};
