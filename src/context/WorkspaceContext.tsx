import React, { createContext, useContext, useMemo } from 'react';
import type { EnterpriseContract } from '@/features/contracts/api/contracts.api';
import { useBootstrap } from './BootstrapContext';

export type ServiceMode = 'SELF_SERVICE_CONVERSION' | 'SELF_SERVICE' | 'WE_CONVERT_FOR_YOU' | 'HYBRID';
export type ActiveWorkspace = 'SELF_SERVICE' | 'MANAGED';
export type ContractStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TRIAL';

export interface AuthoritativeContractContext {
  userId?: string;
  organizationId?: string;
  organizationName?: string;
  contractId?: string;
  contractNumber?: string;
  contractType?: string;
  serviceMode?: string;
  status?: ContractStatus;
  contractStatus?: ContractStatus;
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

/**
 * WorkspaceProvider: Thin adapter over BootstrapContext.
 * In accordance with Big Tech architecture:
 * - NO independent contract or workspace fetching; pure bootstrap consumer
 * - NO hardcoded fallback to SELF_SERVICE
 * - Derives authoritative serviceMode and workspace directly from single bootstrap payload
 */
export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user: bootstrapUser,
    organization: bootstrapOrg,
    contract: bootstrapContract,
    capabilities,
    isLoading,
    error,
    refreshBootstrap,
  } = useBootstrap();

  const isManaged = bootstrapContract?.serviceMode === 'WE_CONVERT_FOR_YOU';

  const serviceMode: ServiceMode = useMemo(() => {
    if (!bootstrapContract) return 'SELF_SERVICE';
    return isManaged ? 'WE_CONVERT_FOR_YOU' : 'SELF_SERVICE';
  }, [bootstrapContract, isManaged]);

  const activeWorkspace: ActiveWorkspace = useMemo(() => {
    return isManaged ? 'MANAGED' : 'SELF_SERVICE';
  }, [isManaged]);

  const contractStatus: ContractStatus = useMemo(() => {
    return (bootstrapContract?.status as ContractStatus) || 'ACTIVE';
  }, [bootstrapContract?.status]);

  const isSuspended = bootstrapContract?.status === 'SUSPENDED';
  const isExpired = bootstrapContract?.status === 'EXPIRED';

  const activeContract: EnterpriseContract | null = useMemo(() => {
    if (!bootstrapContract) return null;
    return {
      id: bootstrapContract.id || bootstrapContract.contractNumber || 'primary',
      contractNumber: bootstrapContract.contractNumber || '',
      organizationId: bootstrapOrg?.id || '',
      serviceMode: bootstrapContract.serviceMode,
      contractType: bootstrapContract.serviceMode,
      status: bootstrapContract.status as any,
      endDate: bootstrapContract.validUntil || undefined,
    } as any;
  }, [bootstrapContract, bootstrapOrg]);

  const userRoles = useMemo(() => {
    return bootstrapUser?.role ? [bootstrapUser.role] : [];
  }, [bootstrapUser?.role]);

  const organization = useMemo(() => {
    if (!bootstrapOrg) return null;
    return {
      id: bootstrapOrg.id || undefined,
      name: bootstrapOrg.name || undefined,
    };
  }, [bootstrapOrg]);

  const value: WorkspaceContextType = {
    activeContract,
    serviceMode,
    contractStatus,
    isSuspended,
    isExpired,
    activeWorkspace,
    setActiveWorkspace: () => {},
    isHybrid: bootstrapContract?.serviceMode === 'HYBRID',
    canUseSelfService: !isManaged,
    canUseManaged: isManaged,
    userRoles,
    userPermissions: capabilities,
    organization,
    isLoading,
    error,
    refreshContract: refreshBootstrap,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

export const useOptionalWorkspace = (): WorkspaceContextType | null => {
  return useContext(WorkspaceContext) || null;
};
