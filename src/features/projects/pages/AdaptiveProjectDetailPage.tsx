import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ProjectOverviewPage } from './ProjectOverviewPage';
import { ManagedProjectDetailPage } from '@/features/managed/pages/ManagedProjectDetailPage';

/**
 * AdaptiveProjectDetailPage
 *
 * Dynamically switches the project view between:
 * - PLATFORM-BASED MODERNIZATION: Screen conversion workbench (BMS/COBOL files, AST mapping, Live Preview Studio, Code Generation)
 * - MANAGED MODERNIZATION SERVICES: Turnkey delivery governance (SOW Milestones, Deliverable packages, Acceptance Sign-off)
 */
export const AdaptiveProjectDetailPage: React.FC = () => {
  const { activeWorkspace, serviceMode } = useWorkspace();
  const isManaged = activeWorkspace === 'MANAGED' || serviceMode === 'WE_CONVERT_FOR_YOU';

  if (isManaged) {
    return <ManagedProjectDetailPage />;
  }

  return <ProjectOverviewPage />;
};

export default AdaptiveProjectDetailPage;
