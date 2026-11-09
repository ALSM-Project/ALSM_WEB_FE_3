import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { contractsApi } from '@/features/contracts/api/contracts.api';
import type { EnterpriseContract } from '@/features/contracts/api/contracts.api';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/services/api/apiClient';

export type ServiceMode = 'SELF_SERVICE_CONVERSION' | 'SELF_SERVICE' | 'WE_CONVERT_FOR_YOU' | 'HYBRID';
export type ActiveWorkspace = 'SELF_SERVICE' | 'MANAGED';
export type ContractStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TRIAL';

export interface AuthoritativeContractContext {
  userId?: string;
  organizationId?: string;
  organizationName?: string;
  contractId?: string;
  contractNumber?: string;
  contractType?: string; // 'SELF_SERVICE' | 'WE_CONVERT_FOR_YOU' | 'HYBRID'
  status?: ContractStatus;
  roles?: string[];
  permissions?: string[];
  isSuspended?: boolean;
  isExpired?: boolean;
}

export interface WorkspaceContextType {
  activeContract: EnterpriseContract | null;
  serviceMode: ServiceMode;
  contractStatus: ContractStatus;
  isSuspended: boolean;
  isExpired: boolean;
  activeWorkspace: ActiveWorkspace;
  setActiveWorkspace: (mode: ActiveWorkspace) => void;
  isHybrid: boolean;
  canUseSelfService: boolean;
  canUseManaged: boolean;
  userRoles: string[];
  userPermissions: string[];
  organization: { id?: string; name?: string } | null;
  isLoading: boolean;
  error: string | null;
  refreshContract: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = 'alsm_active_workspace';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activeContract, setActiveContract] = useState<EnterpriseContract | null>(null);
  const [contractContext, setContractContext] = useState<AuthoritativeContractContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize workspace from localStorage or default to SELF_SERVICE
  const [activeWorkspace, setActiveWorkspaceState] = useState<ActiveWorkspace>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'MANAGED' ? 'MANAGED' : 'SELF_SERVICE';
  });

  const fetchContract = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      // 1. Authoritative Backend Context Call
      let authoritativeContext: AuthoritativeContractContext | null = null;
      if (typeof apiClient?.get === 'function') {
        try {
          authoritativeContext = await apiClient.get<AuthoritativeContractContext>('/navigation/contract-context');
          if (authoritativeContext) {
            setContractContext(authoritativeContext);
          }
        } catch (e) {
          console.warn('Could not fetch authoritative contract context from /navigation/contract-context, using fallback:', e);
        }
      }

      // 2. Fallback / complementary detailed contract list call
      const list = await contractsApi.getContracts();
      if (list && list.length > 0) {
        const primary = list[0];
        setActiveContract(primary);
      }

      // 3. Resolve Service Mode from authoritative context or fallback contract (Strictly 2 Types: Platform-Based vs Managed)
      let resolvedMode: ServiceMode = 'SELF_SERVICE';
      if (authoritativeContext?.contractType) {
        const rawType = authoritativeContext.contractType.toUpperCase();
        if (rawType.includes('CONVERT') || rawType.includes('MANAGED')) {
          resolvedMode = 'WE_CONVERT_FOR_YOU';
        } else {
          resolvedMode = 'SELF_SERVICE';
        }
      } else if (list && list.length > 0) {
        const primary = list[0];
        const rawType = (primary.contractType || primary.serviceMode || '').toUpperCase();
        if (rawType.includes('MANAGED') || rawType.includes('CONVERT')) {
          resolvedMode = 'WE_CONVERT_FOR_YOU';
        } else {
          resolvedMode = 'SELF_SERVICE';
        }
      }

      // 4. Enforce workspace according to resolved mode
      if (resolvedMode === 'WE_CONVERT_FOR_YOU') {
        setActiveWorkspaceState('MANAGED');
        localStorage.setItem(STORAGE_KEY, 'MANAGED');
      } else {
        setActiveWorkspaceState('SELF_SERVICE');
        localStorage.setItem(STORAGE_KEY, 'SELF_SERVICE');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load organization contract.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const serviceMode: ServiceMode = useMemo(() => {
    if (contractContext?.contractType) {
      const raw = contractContext.contractType.toUpperCase();
      if (raw.includes('CONVERT') || raw.includes('MANAGED')) return 'WE_CONVERT_FOR_YOU';
      return 'SELF_SERVICE';
    }
    if (activeContract?.contractType) {
      const raw = (activeContract.contractType || '').toUpperCase();
      if (raw.includes('CONVERT') || raw.includes('MANAGED')) return 'WE_CONVERT_FOR_YOU';
      return 'SELF_SERVICE';
    }
    const rawMode = (activeContract?.serviceMode || '').toUpperCase();
    if (rawMode.includes('CONVERT') || rawMode.includes('MANAGED')) return 'WE_CONVERT_FOR_YOU';
    return 'SELF_SERVICE';
  }, [contractContext, activeContract]);

  const contractStatus: ContractStatus = useMemo(() => {
    if (contractContext?.status) {
      return contractContext.status;
    }
    return (activeContract?.status as ContractStatus) || 'ACTIVE';
  }, [contractContext, activeContract]);

  const isSuspended = Boolean(contractContext?.isSuspended || contractStatus === 'SUSPENDED');
  const isExpired = Boolean(contractContext?.isExpired || contractStatus === 'EXPIRED');

  const isHybrid = false;
  const canUseSelfService = serviceMode === 'SELF_SERVICE';
  const canUseManaged = serviceMode === 'WE_CONVERT_FOR_YOU';

  const userRoles = useMemo(() => contractContext?.roles || [], [contractContext]);
  const userPermissions = useMemo(() => contractContext?.permissions || [], [contractContext]);
  const organization = useMemo(() => {
    if (contractContext?.organizationId) {
      return {
        id: contractContext.organizationId,
        name: contractContext.organizationName || 'Acme Modernization Corp',
      };
    }
    return null;
  }, [contractContext]);

  const setActiveWorkspace = useCallback(
    (mode: ActiveWorkspace) => {
      // Security enforcement: User cannot switch modes if not granted in contract
      if (!isHybrid) {
        if (serviceMode === 'WE_CONVERT_FOR_YOU' && mode === 'SELF_SERVICE') {
          console.warn('Unauthorized workspace switch attempt blocked by contract policy.');
          return;
        }
        if (serviceMode === 'SELF_SERVICE' && mode === 'MANAGED') {
          console.warn('Unauthorized workspace switch attempt blocked by contract policy.');
          return;
        }
      }

      setActiveWorkspaceState(mode);
      localStorage.setItem(STORAGE_KEY, mode);
    },
    [isHybrid, serviceMode]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        activeContract,
        serviceMode,
        contractStatus,
        isSuspended,
        isExpired,
        activeWorkspace,
        setActiveWorkspace,
        isHybrid,
        canUseSelfService,
        canUseManaged,
        userRoles,
        userPermissions,
        organization,
        isLoading,
        error,
        refreshContract: fetchContract,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useOptionalWorkspace = (): WorkspaceContextType | undefined => {
  return useContext(WorkspaceContext);
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
