import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ModernizationDashboardPage } from './ModernizationDashboardPage';
import { ManagedDashboardPage } from '@/features/managed/pages/ManagedDashboardPage';

/**
 * AdaptiveDashboardPage
 *
 * Dynamically switches the customer dashboard between:
 * - PLATFORM-BASED MODERNIZATION: Developer conversion workspace (Upload, Projects, Screens Analyzed, Quotas, Conversion Modules)
 * - MANAGED MODERNIZATION SERVICES: Turnkey delivery portal (SOW Stages, Team Lead oversight, Milestones, Deliverables)
 */
export const AdaptiveDashboardPage: React.FC = () => {
  const { activeWorkspace, serviceMode } = useWorkspace();
  const isManaged = activeWorkspace === 'MANAGED' || serviceMode === 'WE_CONVERT_FOR_YOU';

  if (isManaged) {
    return <ManagedDashboardPage />;
  }

  return <ModernizationDashboardPage />;
};

export default AdaptiveDashboardPage;
