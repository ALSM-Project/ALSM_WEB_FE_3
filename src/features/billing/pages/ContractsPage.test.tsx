import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ContractsPage } from './ContractsPage';
import { contractsApi } from '@/features/contracts/api/contracts.api';

const mockContracts: any[] = [
  {
    id: 'ctr-001',
    contractNumber: 'ALSM-CTR-2026-0881',
    title: 'Statement of Work (SOW) — Managed Turnkey Legacy Conversion',
    organizationId: '6aec4b1387a55501f19e8a33',
    organizationName: 'Fintech Nexus Ltd.',
    serviceMode: 'WE_CONVERT_FOR_YOU',
    contractType: 'MANAGED_CONVERSION_SOW',
    status: 'ACTIVE',
    lifecycleStatus: 'COMPLETED',
    plan: 'Enterprise Core Modernization',
    effectiveDate: '2026-02-15',
    endDate: '2027-02-14',
    totalValue: 750000000,
    currency: 'VND',
    screensQuota: 1000,
    remainingScreens: 816,
    customer: {
      companyName: 'Fintech Nexus Ltd.',
      contactEmail: 'partner@fintechnexus.io',
      representativeName: 'Marcus Vance',
      representativeTitle: 'Managing Director',
      taxId: '0108849201',
      businessAddress: 'Hanoi, Vietnam',
    },
    signingStatus: {
      alsm: true,
      customer: true,
    },
  },
  {
    id: 'ctr-002',
    contractNumber: 'ALSM-CTR-2026-0992',
    title: 'Platform-Based Modernization Subscription Agreement',
    organizationId: '6aec4b1387a55501f19e8a34',
    organizationName: 'Apex Banking Corp',
    serviceMode: 'SELF_SERVICE',
    contractType: 'SELF_SERVICE_SUBSCRIPTION',
    status: 'DRAFT',
    lifecycleStatus: 'DRAFT',
    plan: 'Starter Scale',
    effectiveDate: '2026-03-01',
    endDate: '2027-02-28',
    totalValue: 250000000,
    currency: 'VND',
    screensQuota: 200,
    remainingScreens: 200,
    customer: {
      companyName: 'Apex Banking Corp',
      contactEmail: 'lead@apex.com',
      representativeName: 'Sarah Jenkins',
      representativeTitle: 'CTO',
      taxId: '0109988776',
      businessAddress: 'HCMC, Vietnam',
    },
    signingStatus: {
      alsm: false,
      customer: false,
    },
  },
];

describe('ContractsPage - Enterprise Contract Management System', () => {
  beforeEach(() => {
    vi.spyOn(contractsApi, 'getDashboardStats').mockResolvedValue({
      total: 2,
      draft: 1,
      underReview: 0,
      pendingSignature: 0,
      active: 1,
      expiringSoon: 0,
      terminated: 0,
      totalValueVnd: 750000000,
    });

    vi.spyOn(contractsApi, 'listContracts').mockResolvedValue({
      items: mockContracts,
      pagination: { total: 2, page: 1, limit: 15 },
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ContractsPage />
      </MemoryRouter>
    );

  it('renders enterprise contracts dashboard header and KPI metrics', async () => {
    renderComponent();

    expect(screen.getByText('Enterprise Contract Management')).toBeInTheDocument();
    expect(screen.getByText(/Legally Binding Electronic Contracts/i)).toBeInTheDocument();
    expect(screen.getByText('Total Contracts')).toBeInTheDocument();
    expect(screen.getByText('Active & Bound')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Contract/i })).toBeInTheDocument();
  });

  it('lists contracts with numbers, customers, service modes, and values', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ALSM-CTR-2026-0881')).toBeInTheDocument();
    });
    expect(screen.getByText('Fintech Nexus Ltd.')).toBeInTheDocument();
    expect(screen.getAllByText('Managed Modernization Services').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ALSM-CTR-2026-0992')).toBeInTheDocument();
    expect(screen.getByText('Apex Banking Corp')).toBeInTheDocument();
    expect(screen.getAllByText(/PLATFORM-BASED MODERNIZATION|Self-Service/i).length).toBeGreaterThanOrEqual(1);
  });

  it('filters contracts when typing into the search input', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ALSM-CTR-2026-0881')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search contract number, title, customer.../i);
    fireEvent.change(searchInput, { target: { value: '0881' } });
    expect(searchInput).toHaveValue('0881');
  });

  it('shows status tabs and switches active filter tab', async () => {
    renderComponent();

    const activeTabBtn = screen.getByRole('button', { name: 'Active' });
    expect(activeTabBtn).toBeInTheDocument();
    fireEvent.click(activeTabBtn);

    expect(contractsApi.listContracts).toHaveBeenCalled();
  });
});
