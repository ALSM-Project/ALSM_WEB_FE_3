import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ExportCodePage } from './ExportCodePage';

const mocks = vi.hoisted(() => {
  const mockScreens: LegacyScreen[] = [
    {
      id: 'scr-login',
      projectId: 'proj-acme',
      name: 'LoginScreen.bms',
      sourceType: 'BMS',
      status: 'Completed',
      framework: 'React',
      lastUpdated: '1 day ago',
    },
    {
      id: 'scr-dashboard',
      projectId: 'proj-acme',
      name: 'Dashboard.bms',
      sourceType: 'BMS',
      status: 'Processing',
      framework: 'React',
      lastUpdated: '10 mins ago',
    },
    {
      id: 'scr-cobol',
      projectId: 'proj-acme',
      name: 'CBACT01C.cbl',
      sourceType: 'COBOL',
      status: 'Completed',
      framework: 'React',
      lastUpdated: '1 day ago',
    },
  ];
  return {
    getScreens: vi.fn().mockResolvedValue(mockScreens),
    fetchExportPreviewFromApi: vi.fn().mockResolvedValue({
      fileTree: [
        {
          path: 'src',
          name: 'src',
          type: 'dir',
          size: '2 files',
          children: [
            {
              path: 'src/LoginScreen.tsx',
              name: 'LoginScreen.tsx',
              type: 'file',
              size: '2.5 KB',
              language: 'typescript',
              content: 'export const LoginScreen = () => <div>Login</div>;',
            },
          ],
        },
      ],
      metrics: {
        totalFiles: 2,
        totalLoc: 120,
        estimatedSizeKb: 15,
        selectedScreensCount: 2,
      },
    }),
    downloadZipBundleFromApi: vi.fn().mockResolvedValue(new Blob(['mock-zip-content'], { type: 'application/zip' })),
    downloadBlob: vi.fn(),
  };
});

vi.mock('../services/conversion.service', () => ({
  conversionService: { getScreens: mocks.getScreens },
}));

vi.mock('../services/export.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/export.service')>();
  return {
    ...actual,
    exportService: {
      ...actual.exportService,
      fetchExportPreviewFromApi: mocks.fetchExportPreviewFromApi,
      downloadZipBundleFromApi: mocks.downloadZipBundleFromApi,
      downloadBlob: mocks.downloadBlob,
    },
  };
});

describe('ExportCodePage', () => {
  const renderWithRouter = (initialRoute = '/projects/proj-acme/export') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/projects/:projectId/export" element={<ExportCodePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.downloadZipBundleFromApi.mockResolvedValue(new Blob(['mock-zip-content'], { type: 'application/zip' }));
  });

  it('renders the Export Code Package heading and initial configuration', async () => {
    renderWithRouter();

    expect(await screen.findByRole('heading', { name: /Export Code Package/i })).toBeInTheDocument();
    expect(screen.getByText(/Ready to Export/i)).toBeInTheDocument();
    expect(screen.getByText(/Full Maven \/ Spring Boot Scaffold/i)).toBeInTheDocument();
    expect(screen.getByText(/Standalone Java Classes & Models/i)).toBeInTheDocument();
    expect(screen.getByText(/Modular Spring Batch Job Suite/i)).toBeInTheDocument();
  });

  it('switches between output formats and updates selection', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });
    const standaloneOption = screen.getByText(/Standalone Java Classes & Models/i);
    fireEvent.click(standaloneOption);

    const radioInputs = screen.getAllByRole('radio');
    const standaloneRadio = radioInputs[1] as HTMLInputElement;
    expect(standaloneRadio.checked).toBe(true);
  });

  it('allows clearing all screens and disables the download button', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });

    const clearButton = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearButton);

    const downloadButtons = screen.getAllByRole('button', { name: /Generate & Download Bundle/i });
    downloadButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('shows a completed COBOL screen as selectable, not excluded from export', async () => {
    renderWithRouter();

    const cobolRow = await screen.findByText('CBACT01C.cbl');
    expect(cobolRow).toBeInTheDocument();
    expect(screen.getByText('COBOL')).toBeInTheDocument();

    const selectReadyBtn = screen.getByRole('button', { name: /Select Ready/i });
    fireEvent.click(selectReadyBtn);

    expect(screen.getByText(/PROGRAM SELECTION \(2\/3\)/i)).toBeInTheDocument();
  });

  it('allows selecting ready screens', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });

    const selectReadyBtn = screen.getByRole('button', { name: /Select Ready/i });
    fireEvent.click(selectReadyBtn);

    const downloadButtons = screen.getAllByRole('button', { name: /Generate & Download Bundle/i });
    downloadButtons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it('starts export, opens progress modal, and triggers browser download on success', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });

    const downloadBtn = screen.getAllByRole('button', { name: /Generate & Download Bundle/i })[0];
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(mocks.downloadZipBundleFromApi).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mocks.downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/\.zip$/),
      );
    });

    expect(await screen.findByText(/Java Package Ready/i)).toBeInTheDocument();
  });

  it('displays error in modal when bundle compilation fails and allows retry', async () => {
    mocks.downloadZipBundleFromApi.mockRejectedValueOnce(new Error('Zip compilation failed on server'));

    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });

    const downloadBtn = screen.getAllByRole('button', { name: /Generate & Download Bundle/i })[0];
    fireEvent.click(downloadBtn);

    expect(await screen.findByText(/Export Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Zip compilation failed on server/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    expect(retryBtn).toBeInTheDocument();

    mocks.downloadZipBundleFromApi.mockResolvedValue(new Blob(['mock-zip-content'], { type: 'application/zip' }));
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(mocks.downloadZipBundleFromApi).toHaveBeenCalledTimes(2);
    });
  });
});
