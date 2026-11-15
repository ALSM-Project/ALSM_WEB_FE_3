import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/services/api/apiClient';
import { AuthContext } from '@/app/providers';
import { RouteLoading } from '@/app/guards';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface BootstrapUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  orgRole: string;
  isPlatformAdmin?: boolean;
}

export interface BootstrapOrganization {
  id: string | null;
  name: string;
  tier?: string;
  status: string;
  slug?: string;
}

export interface BootstrapContract {
  id: string | null;
  contractNumber: string | null;
  serviceMode: 'SELF_SERVICE' | 'WE_CONVERT_FOR_YOU' | 'HYBRID';
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TRIAL' | 'NONE';
  validUntil?: string | null;
  isReadOnly: boolean;
}

export interface BootstrapQuotas {
  screensLimit: number;
  screensUsed: number;
  storageLimitMb: number;
  storageUsedMb: number;
  conversionsMonthlyLimit: number;
  conversionsUsed: number;
}

export interface BootstrapPayload {
  user: BootstrapUser;
  organization: BootstrapOrganization;
  contract: BootstrapContract;
  capabilities: string[];
  quotas: BootstrapQuotas;
  featureFlags: Record<string, boolean>;
  sourceTimestamp: string;
  navigationTree?: any[];
}

export interface BootstrapContextType {
  bootstrapData: BootstrapPayload | null;
  user: BootstrapUser | null;
  organization: BootstrapOrganization | null;
  contract: BootstrapContract | null;
  capabilities: string[];
  quotas: BootstrapQuotas | null;
  featureFlags: Record<string, boolean>;
  navigationTree?: any[];
  isLoading: boolean;
  error: string | null;
  can: (capability: string) => boolean;
  canAny: (capabilities: string[]) => boolean;
  canAll: (capabilities: string[]) => boolean;
  refreshBootstrap: () => Promise<void>;
}

const BootstrapContext = createContext<BootstrapContextType | undefined>(undefined);

export const BootstrapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth ? auth.isAuthenticated : true;
  const authLoading = auth ? auth.isLoading : false;
  const authUser = auth?.user;
  const [bootstrapData, setBootstrapData] = useState<BootstrapPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBootstrap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Calls authoritative single bootstrap endpoint via apiClient
      const data = await apiClient.get<BootstrapPayload>('/session/bootstrap');
      setBootstrapData(data);
    } catch (err: any) {
      console.error('Session bootstrap fetch failed:', err);
      setError(err?.message || 'Failed to load enterprise session bootstrap');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setIsLoading(false);
      setBootstrapData(null);
      return;
    }

    void fetchBootstrap();
  }, [isAuthenticated, authLoading, authUser?.id, fetchBootstrap]);

  const capabilitiesSet = useMemo(() => {
    return new Set<string>(bootstrapData?.capabilities || []);
  }, [bootstrapData?.capabilities]);

  const can = useCallback((capability: string): boolean => {
    if (!capability) return true;
    if (capabilitiesSet.has(capability)) return true;
    // Special wildcard handling (e.g. 'project.*')
    const prefix = capability.split('.')[0] + '.*';
    return capabilitiesSet.has(prefix);
  }, [capabilitiesSet]);

  const canAny = useCallback((capabilities: string[]): boolean => {
    return capabilities.some((c) => can(c));
  }, [can]);

  const canAll = useCallback((capabilities: string[]): boolean => {
    return capabilities.every((c) => can(c));
  }, [can]);

  const value: BootstrapContextType = {
    bootstrapData,
    user: bootstrapData?.user || null,
    organization: bootstrapData?.organization || null,
    contract: bootstrapData?.contract || null,
    capabilities: bootstrapData?.capabilities || [],
    quotas: bootstrapData?.quotas || null,
    featureFlags: bootstrapData?.featureFlags || {},
    navigationTree: bootstrapData?.navigationTree || [],
    isLoading,
    error,
    can,
    canAny,
    canAll,
    refreshBootstrap: fetchBootstrap,
  };

  // 1. While bootstrap is loading for an authenticated user: show full splash RouteLoading (no layout shift / zero flash)
  if (isAuthenticated && isLoading && !bootstrapData) {
    return <RouteLoading />;
  }

  // 2. On bootstrap error: show clean Error state with a Retry button
  if (error && !bootstrapData && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-[#E2E8F0] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A] mb-2">Không thể tải phiên làm việc</h3>
          <p className="text-sm text-[#64748B] mb-6">{error}</p>
          <button
            onClick={() => void fetchBootstrap()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại (Retry)
          </button>
        </div>
      </div>
    );
  }

  return (
    <BootstrapContext.Provider value={value}>
      {children}
    </BootstrapContext.Provider>
  );
};

export const useBootstrap = (): BootstrapContextType => {
  const context = useContext(BootstrapContext);
  if (!context) {
    return {
      bootstrapData: null,
      user: null,
      organization: null,
      contract: null,
      capabilities: [],
      quotas: null,
      featureFlags: {},
      isLoading: false,
      error: null,
      can: () => false,
      canAny: () => false,
      canAll: () => false,
      refreshBootstrap: async () => {},
    };
  }
  return context;
};

export const useCapabilities = () => {
  const { can, canAny, canAll, capabilities, contract, featureFlags } = useBootstrap();
  return { can, canAny, canAll, capabilities, contract, featureFlags };
};
