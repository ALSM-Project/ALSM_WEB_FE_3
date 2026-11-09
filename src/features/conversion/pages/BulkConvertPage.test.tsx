import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { BulkConvertPage } from './BulkConvertPage';

const mocks = vi.hoisted(() => ({
  getScreens: vi.fn(),
  bulkConvertScreens: vi.fn(),
  getProjectById: vi.fn(),
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
    bulkConvertScreens: mocks.bulkConvertScreens,
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: {
    getProjectById: mocks.getProjectById,
  },
}));

const screens: LegacyScreen[] = [
  { id: 'scr-1', projectId: 'proj-acme', name: 'LOGIN.bms', sourceType: 'BMS', status: 'Ready', framework: 'React', lastUpdated: 'just now' },
  { id: 'scr-2', projectId: 'proj-acme', name: 'ACCT.cbl', sourceType: 'COBOL', status: 'Ready', framework: 'React', lastUpdated: 'just now' },
  { id: 'scr-3', projectId: 'proj-acme', name: 'MENU.bms', sourceType: 'BMS', status: 'Completed', framework: 'React', lastUpdated: 'yesterday' },
];

describe('BulkConvertPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProjectById.mockResolvedValue(null);
  });

  const renderPage = (initialEntries: (string | { pathname: string; state?: unknown })[] = ['/projects/proj-acme/bulk-convert']) =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/projects/:projectId/bulk-convert" element={<BulkConvertPage />} />
            <Route path="/projects/:projectId/screens" element={<div>SCREENS_LIST_PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('shows a real error banner when starting the bulk conversion fails', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.bulkConvertScreens.mockRejectedValue(new Error('Conversion job could not be queued'));

    renderPage();
    const startButton = await screen.findByRole('button', { name: /Start Conversion/i });
    fireEvent.click(startButton);

    expect(await screen.findByText('Conversion job could not be queued')).toBeInTheDocument();
  });

  it('shows no error banner and navigates to screens list when starting the bulk conversion succeeds', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.bulkConvertScreens.mockResolvedValue([
      { id: 'job-1', screenId: 'scr-1', status: 'QUEUED', createdAt: '2026-09-25T00:00:00.000Z' },
      { id: 'job-2', screenId: 'scr-2', status: 'QUEUED', createdAt: '2026-09-25T00:00:00.000Z' },
    ]);

    renderPage();
    const startButton = await screen.findByRole('button', { name: /Start Conversion/i });
    fireEvent.click(startButton);

    expect(await screen.findByText('SCREENS_LIST_PAGE')).toBeInTheDocument();
    expect(mocks.bulkConvertScreens).toHaveBeenCalledWith('proj-acme', ['scr-1', 'scr-2']);
  });

  it('respects initial selection passed via location.state', async () => {
    mocks.getScreens.mockResolvedValue(screens);

    renderPage([
      {
        pathname: '/projects/proj-acme/bulk-convert',
        state: { selectedIds: ['scr-1'] },
      },
    ]);

    expect(await screen.findByText('LOGIN.bms')).toBeInTheDocument();
    expect(screen.getByText('1 screens selected')).toBeInTheDocument();
  });

  it('supports selecting and deselecting assets', async () => {
    mocks.getScreens.mockResolvedValue(screens);

    renderPage();

    expect(await screen.findByText('LOGIN.bms')).toBeInTheDocument();

    // Toggle off ACCT.cbl
    fireEvent.click(screen.getByText('ACCT.cbl'));
    expect(screen.getByText('1 screens selected')).toBeInTheDocument();

    // Toggle Select All
    fireEvent.click(screen.getByText(/Select All/i));
    expect(screen.getByText('3 screens selected')).toBeInTheDocument();

    // Toggle Select All off
    fireEvent.click(screen.getByText(/Select All/i));
    const startButton = screen.getByRole('button', { name: /Start Conversion \(0\)/i });
    expect(startButton).toBeDisabled();
  });

  it('displays Java 21 + Spring Boot target when project is COBOL_TO_JAVA', async () => {
    mocks.getProjectById.mockResolvedValue({
      id: 'proj-acme',
      name: 'Batch Banking Core',
      conversionType: 'COBOL_TO_JAVA',
      status: 'ACTIVE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    });
    mocks.getScreens.mockResolvedValue(screens);

    renderPage();

    expect(await screen.findByText('Java 21 + Spring Boot')).toBeInTheDocument();
    expect(screen.getByText('ALSM tool2java Pipeline')).toBeInTheDocument();
  });
});
