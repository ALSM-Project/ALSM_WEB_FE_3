import React from 'react';
import { useCapabilities } from '@/context/BootstrapContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ModernizationDashboardPage } from './ModernizationDashboardPage';
import { ManagedDashboardPage } from '@/features/managed/pages/ManagedDashboardPage';

/**
 * AdaptiveDashboardPage
 *
 * Big Tech Entitlements + Capabilities:
 * Dynamically renders the appropriate dashboard based on capabilities:
 * - can('dashboard.managed') -> ManagedDashboardPage (Turnkey delivery portal, deliverables, signoffs)
 * - Otherwise -> ModernizationDashboardPage (Self-service developer conversion workspace)
 */
export const AdaptiveDashboardPage: React.FC = () => {
  const { can } = useCapabilities();
  const { activeWorkspace, serviceMode } = useWorkspace();

  const isManaged =
    serviceMode === 'WE_CONVERT_FOR_YOU' ||
    (activeWorkspace === 'MANAGED' && can('dashboard.managed') && !can('screen.convert'));

  if (isManaged) {
    return <ManagedDashboardPage />;
  }

  return <ModernizationDashboardPage />;
};

export default AdaptiveDashboardPage;
