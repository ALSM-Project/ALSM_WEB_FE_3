import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { BootstrapProvider, useBootstrap } from './BootstrapContext';
import { CapabilityGuard } from '@/app/guards';
import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';

vi.mock('@/services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/services/api/tokenStore', () => ({
  tokenStore: {
    getAccessToken: vi.fn(),
    acceptTokens: vi.fn(),
  },
}));

const mockBootstrapPayload = {
  user: {
    id: 'user-001',
    email: 'alex@enterprise.com',
    fullName: 'Alex Doe',
    role: 'ENTERPRISE_ADMIN',
    orgRole: 'OWNER',
    isPlatformAdmin: false,
  },
  organization: {
    id: 'org-123',
    name: 'MegaCorp Modernization',
    tier: 'ENTERPRISE',
    status: 'ACTIVE',
  },
  contract: {
    id: 'CTR-999',
    contractNumber: 'CTR-999',
    serviceMode: 'WE_CONVERT_FOR_YOU' as const,
    status: 'ACTIVE' as const,
    validUntil: '2027-12-31T23:59:59.000Z',
    isReadOnly: false,
  },
  capabilities: [
    'dashboard.view',
    'dashboard.managed',
    'deliverable.view',
    'deliverable.download',
    'deliverable.signoff',
    'conversion_request.create',
    'conversion_request.view',
    'project.files.view',
    'organization.view',
  ],
  quotas: {
    screensLimit: 2500,
    screensUsed: 150,
    storageLimitMb: 10240,
    storageUsedMb: 450,
    conversionsMonthlyLimit: 500,
    conversionsUsed: 22,
  },
  featureFlags: {
    enableAstWorkbench: false,
    enableDeliverableSignoff: true,
  },
  sourceTimestamp: '2026-11-15T00:00:00.000Z',
};

const TestConsumer: React.FC = () => {
  const { user, organization, contract, can, quotas } = useBootstrap();
  return (
    <div>
      <div data-testid="user-email">{user?.email}</div>
      <div data-testid="org-name">{organization?.name}</div>
      <div data-testid="contract-mode">{contract?.serviceMode}</div>
      <div data-testid="can-signoff">{can('deliverable.signoff') ? 'YES' : 'NO'}</div>
      <div data-testid="can-convert">{can('screen.convert') ? 'YES' : 'NO'}</div>
      <div data-testid="quota-screens">{quotas?.screensLimit}</div>
    </div>
  );
};

describe('Big Tech Bootstrap & Capabilities Context Specification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /session/bootstrap on startup and exposes authoritative state and capabilities', async () => {
    vi.mocked(tokenStore.getAccessToken).mockReturnValue('mock-token');
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockBootstrapPayload);

    render(
      <MemoryRouter>
        <BootstrapProvider>
          <TestConsumer />
        </BootstrapProvider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('user-email')).toHaveTextContent('alex@enterprise.com');
    expect(screen.getByTestId('org-name')).toHaveTextContent('MegaCorp Modernization');
    expect(screen.getByTestId('contract-mode')).toHaveTextContent('WE_CONVERT_FOR_YOU');
    expect(screen.getByTestId('can-signoff')).toHaveTextContent('YES');
    expect(screen.getByTestId('can-convert')).toHaveTextContent('NO');
    expect(screen.getByTestId('quota-screens')).toHaveTextContent('2500');
  });

  it('CapabilityGuard grants access when user possesses capability', async () => {
    vi.mocked(tokenStore.getAccessToken).mockReturnValue('mock-token');
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockBootstrapPayload);

    render(
      <MemoryRouter initialEntries={['/deliverables']}>
        <BootstrapProvider>
          <Routes>
            <Route element={<CapabilityGuard capability="deliverable.view" />}>
              <Route path="/deliverables" element={<div>Authorized Deliverables View</div>} />
            </Route>
          </Routes>
        </BootstrapProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Authorized Deliverables View')).toBeInTheDocument();
  });

  it('CapabilityGuard blocks route and renders Access Denied when user lacks capability', async () => {
    vi.mocked(tokenStore.getAccessToken).mockReturnValue('mock-token');
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockBootstrapPayload);

    render(
      <MemoryRouter initialEntries={['/screen-compiler']}>
        <BootstrapProvider>
          <Routes>
            <Route element={<CapabilityGuard capability="screen.convert" />}>
              <Route path="/screen-compiler" element={<div>Screen Compiler Page</div>} />
            </Route>
          </Routes>
        </BootstrapProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Screen Compiler Page')).not.toBeInTheDocument();
  });
});
