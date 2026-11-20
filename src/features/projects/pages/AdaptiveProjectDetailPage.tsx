import React from 'react';
import { useCapabilities } from '@/context/BootstrapContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ProjectOverviewPage } from './ProjectOverviewPage';
import { ProjectFilesPage } from './ProjectFilesPage';

/**
 * AdaptiveProjectDetailPage
 *
 * Big Tech Entitlements + Capabilities:
 * Dynamically renders the appropriate project detail page based on capabilities/workspace:
 * - Managed Modernization Services (WE_CONVERT_FOR_YOU / MANAGED) -> ProjectFilesPage (Project Files & Deliverables)
 * - Otherwise -> ProjectOverviewPage (Screen conversion workbench, AST mapping)
 */
export const AdaptiveProjectDetailPage: React.FC = () => {
  const { can } = useCapabilities();
  const { activeWorkspace, serviceMode } = useWorkspace();

  const isManaged =
    serviceMode === 'WE_CONVERT_FOR_YOU' ||
    activeWorkspace === 'MANAGED' ||
    (can('deliverable.view') && !can('screen.convert'));

  if (isManaged) {
    return <ProjectFilesPage />;
  }

  return <ProjectOverviewPage />;
};

export default AdaptiveProjectDetailPage;
