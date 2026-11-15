import React from 'react';
import { useCapabilities } from '@/context/BootstrapContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ProjectOverviewPage } from './ProjectOverviewPage';
import { ManagedProjectDetailPage } from '@/features/managed/pages/ManagedProjectDetailPage';

/**
 * AdaptiveProjectDetailPage
 *
 * Big Tech Entitlements + Capabilities:
 * Dynamically renders the appropriate project detail page based on capabilities:
 * - can('deliverable.view') && !can('screen.convert') -> ManagedProjectDetailPage (Turnkey deliverables, SOW milestones)
 * - Otherwise -> ProjectOverviewPage (Screen conversion workbench, AST mapping)
 */
export const AdaptiveProjectDetailPage: React.FC = () => {
  const { can } = useCapabilities();
  const { activeWorkspace, serviceMode } = useWorkspace();

  const isManaged =
    can('deliverable.view') ||
    activeWorkspace === 'MANAGED' ||
    serviceMode === 'WE_CONVERT_FOR_YOU';

  if (isManaged) {
    return <ManagedProjectDetailPage />;
  }

  return <ProjectOverviewPage />;
};

export default AdaptiveProjectDetailPage;
