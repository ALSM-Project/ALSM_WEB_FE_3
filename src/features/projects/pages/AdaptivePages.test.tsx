import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdaptiveDashboardPage } from './AdaptiveDashboardPage';
import { AdaptiveProjectDetailPage } from './AdaptiveProjectDetailPage';
import * as WorkspaceContextModule from '@/context/WorkspaceContext';

vi.mock('./ModernizationDashboardPage', () => ({
  ModernizationDashboardPage: () => <div data-testid="platform-based-dashboard">Modernization Dashboard (Platform-Based)</div>,
}));

vi.mock('@/features/managed/pages/ManagedDashboardPage', () => ({
  ManagedDashboardPage: () => <div data-testid="managed-dashboard">Managed Dashboard (Turnkey Services)</div>,
}));

vi.mock('./ProjectOverviewPage', () => ({
  ProjectOverviewPage: () => <div data-testid="platform-based-project-detail">Project Overview Workbench (Platform-Based)</div>,
}));

vi.mock('./ProjectFilesPage', () => ({
  ProjectFilesPage: () => <div data-testid="managed-project-detail">Managed Project Detail (Turnkey SOW)</div>,
}));

describe('Adaptive Modernization Architecture (Web 3 Contract Types)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdaptiveDashboardPage', () => {
    it('renders ModernizationDashboardPage when user has PLATFORM-BASED contract (SELF_SERVICE)', () => {
      vi.spyOn(WorkspaceContextModule, 'useWorkspace').mockReturnValue({
        activeWorkspace: 'SELF_SERVICE',
        serviceMode: 'SELF_SERVICE',
        isHybrid: false,
      } as any);

      render(
        <MemoryRouter>
          <AdaptiveDashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('platform-based-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('managed-dashboard')).not.toBeInTheDocument();
    });

    it('renders ManagedDashboardPage when user has MANAGED MODERNIZATION contract (WE_CONVERT_FOR_YOU)', () => {
      vi.spyOn(WorkspaceContextModule, 'useWorkspace').mockReturnValue({
        activeWorkspace: 'MANAGED',
        serviceMode: 'WE_CONVERT_FOR_YOU',
        isHybrid: false,
      } as any);

      render(
        <MemoryRouter>
          <AdaptiveDashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('managed-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('platform-based-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('AdaptiveProjectDetailPage', () => {
    it('renders ProjectOverviewPage (Screen workbench) for PLATFORM-BASED modernization', () => {
      vi.spyOn(WorkspaceContextModule, 'useWorkspace').mockReturnValue({
        activeWorkspace: 'SELF_SERVICE',
        serviceMode: 'SELF_SERVICE',
        isHybrid: false,
      } as any);

      render(
        <MemoryRouter>
          <AdaptiveProjectDetailPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('platform-based-project-detail')).toBeInTheDocument();
      expect(screen.queryByTestId('managed-project-detail')).not.toBeInTheDocument();
    });

    it('renders ManagedProjectDetailPage (SOW Milestones & Deliverables) for MANAGED services', () => {
      vi.spyOn(WorkspaceContextModule, 'useWorkspace').mockReturnValue({
        activeWorkspace: 'MANAGED',
        serviceMode: 'WE_CONVERT_FOR_YOU',
        isHybrid: false,
      } as any);

      render(
        <MemoryRouter>
          <AdaptiveProjectDetailPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('managed-project-detail')).toBeInTheDocument();
      expect(screen.queryByTestId('platform-based-project-detail')).not.toBeInTheDocument();
    });
  });
});
