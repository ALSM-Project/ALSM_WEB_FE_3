import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayoutContent } from '../AppLayout';
import * as WorkspaceContextModule from '@/context/WorkspaceContext';

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: { fullName: 'Hoang Nguyen', email: 'hoang@example.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('@/context/Web1ThemeContext', () => ({
  useWeb1Theme: () => ({}),
  Web1ThemeProvider: ({ children }: any) => children,
}));

vi.mock('@/components/Sidebar/Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

vi.mock('@/shared/navigation/Breadcrumb', () => ({
  Breadcrumb: () => <div>Breadcrumb</div>,
}));

vi.mock('@/features/billing/services/billing.service', () => ({
  billingService: {
    getMyQuoteRequest: vi.fn().mockResolvedValue(null),
    getCurrentSubscription: vi.fn().mockResolvedValue(null),
  },
}));

describe('AppLayout Contract-Based Theme Background Adaptation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Pure White background (#FFFFFF / bg-white) for Contract 1: Platform-Based Modernization (SELF_SERVICE)', () => {
    vi.spyOn(WorkspaceContextModule, 'useWorkspace').mockReturnValue({
      activeWorkspace: 'SELF_SERVICE',
      serviceMode: 'SELF_SERVICE',
      activeContract: {
        id: 'ctr-1',
        contractNumber: 'ALSM-CTR-2026-343F',
        serviceMode: 'SELF_SERVICE',
      } as any,
      contractStatus: 'ACTIVE',
      isSuspended: false,
      isExpired: false,
      setActiveWorkspace: vi.fn(),
      isHybrid: false,
      canUseSelfService: true,
      canUseManaged: false,
      userRoles: ['USER'],
      userPermissions: [],
      organization: { id: 'org-1', name: 'Client Org' },
      isLoading: false,
      error: null,
      refreshContract: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <AppLayoutContent />
      </MemoryRouter>
    );

    const outerContainer = container.firstElementChild as HTMLElement;
    expect(outerContainer).toHaveClass('bg-white');
    expect(outerContainer.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(document.documentElement.style.getPropertyValue('--alsm-bg')).toBe('#FFFFFF');
    expect(document.body.style.backgroundColor).toBe('rgb(255, 255, 255)');
    const platformBadge = screen.getByText('PLATFORM-BASED MODERNIZATION').parentElement;
    expect(platformBadge).toHaveClass('text-[#244A70]');
    expect(platformBadge).toHaveClass('bg-[#EEF1F6]');
    expect(platformBadge).toHaveClass('border-[#DCE3EC]');
  });

  it('renders Web 2 corporate background (#F8FAFC / bg-[#F8FAFC]) for Contract 2: Managed Modernization Services (WE_CONVERT_FOR_YOU)', () => {
    vi.spyOn(WorkspaceContextModule, 'useWorkspace').mockReturnValue({
      activeWorkspace: 'MANAGED',
      serviceMode: 'WE_CONVERT_FOR_YOU',
      activeContract: {
        id: 'ctr-2',
        contractNumber: 'ALSM-CTR-2026-0A08',
        serviceMode: 'WE_CONVERT_FOR_YOU',
      } as any,
      contractStatus: 'ACTIVE',
      isSuspended: false,
      isExpired: false,
      setActiveWorkspace: vi.fn(),
      isHybrid: false,
      canUseSelfService: false,
      canUseManaged: true,
      userRoles: ['USER'],
      userPermissions: [],
      organization: { id: 'org-2', name: 'Managed Org' },
      isLoading: false,
      error: null,
      refreshContract: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <AppLayoutContent />
      </MemoryRouter>
    );

    const outerContainer = container.firstElementChild as HTMLElement;
    expect(outerContainer).toHaveClass('bg-[#F8FAFC]');
    expect(outerContainer.style.backgroundColor).toBe('rgb(248, 250, 252)');
    expect(document.documentElement.style.getPropertyValue('--alsm-bg')).toBe('#F8FAFC');
    expect(document.body.style.backgroundColor).toBe('rgb(248, 250, 252)');
    const managedBadge = screen.getByText('MANAGED MODERNIZATION SERVICES').parentElement;
    expect(managedBadge).toHaveClass('text-[#244A70]');
    expect(managedBadge).toHaveClass('bg-[#EEF1F6]');
    expect(managedBadge).toHaveClass('border-[#DCE3EC]');
  });
});
