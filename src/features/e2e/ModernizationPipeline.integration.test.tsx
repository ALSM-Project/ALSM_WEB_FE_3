import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ScreensListPage } from '@/features/screens/pages/ScreensListPage';
import { ConvertScreenPage } from '@/features/conversion/pages/ConvertScreenPage';
import { InitialQualityReviewPage } from '@/features/conversion/pages/InitialQualityReviewPage';
import { FieldMappingPage } from '@/features/conversion/pages/FieldMappingPage';
import { MethodMappingPage } from '@/features/conversion/pages/MethodMappingPage';
import { DiagnosticsPage } from '@/features/diagnostics/pages/DiagnosticsPage';
import { ExportCodePage } from '@/features/conversion/pages/ExportCodePage';

import { conversionService } from '@/features/conversion/services/conversion.service';
import { qualityReviewService } from '@/features/conversion/services/quality-review.service';
import { diagnosticsService } from '@/features/diagnostics/services/diagnostics.service';
import { exportService } from '@/features/conversion/services/export.service';
import { projectService } from '@/features/projects/services/project.service';

import type { LegacyScreen } from '@/features/screens/types/screen';
import type { FieldMapping, MethodMappingView } from '@/features/conversion/types/conversion';
import { ConversionQualityReviewStatus } from '@/features/conversion/types/quality-review';

// Mock services for full workflow integration test
vi.mock('@/features/conversion/services/conversion.service');
vi.mock('@/features/conversion/services/quality-review.service');
vi.mock('@/features/diagnostics/services/diagnostics.service');
vi.mock('@/features/conversion/services/export.service');
vi.mock('@/features/projects/services/project.service');

const mockScreens: LegacyScreen[] = [
  {
    id: 'scr-bms-1',
    projectId: 'proj-e2e',
    name: 'ACCT010.bms',
    sourceType: 'BMS',
    status: 'Ready',
    framework: 'React',
    lastUpdated: 'Just now',
  },
  {
    id: 'scr-cobol-1',
    projectId: 'proj-e2e',
    name: 'CBACT01C.cbl',
    sourceType: 'COBOL',
    status: 'Ready',
    framework: 'React',
    lastUpdated: 'Just now',
  },
];

const mockFieldMappings: FieldMapping[] = [
  {
    id: 'fm-1',
    legacyField: { name: 'ACCTNO', type: 'ALPHA_NUMERIC', length: 16, position: 'Ln 05, Col 21' },
    componentMapping: {
      componentType: 'Text Field',
      labelText: 'Account Number',
      isRequired: true,
      minLength: 1,
      maxLength: 16,
      regexPattern: '^[0-9]+$',
    },
  },
];

const mockMethodMappingView: MethodMappingView = {
  projectId: 'proj-e2e',
  screenId: 'scr-cobol-1',
  hasGeneratedCode: true,
  entries: [
    {
      relativePath: 'cobolprogramclasses/cbact01c/Cbact01cTasklet.java',
      kind: 'CLASS',
      originalName: 'Cbact01cTasklet',
      targetName: 'Cbact01cTasklet',
    },
  ],
  updatedBy: null,
  updatedAt: null,
};

function renderAppWithRoute(initialRoute: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/projects/:projectId/screens" element={<ScreensListPage />} />
          <Route path="/projects/:projectId/screens/:screenId/convert" element={<ConvertScreenPage />} />
          <Route path="/projects/:projectId/screens/:screenId/quality-review" element={<InitialQualityReviewPage />} />
          <Route path="/projects/:projectId/screens/:screenId/mapping" element={<FieldMappingPage />} />
          <Route path="/projects/:projectId/screens/:screenId/method-mapping" element={<MethodMappingPage />} />
          <Route path="/projects/:projectId/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/projects/:projectId/export" element={<ExportCodePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ALSM_WEB_FE_3 End-to-End Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(projectService.getProjectById).mockResolvedValue({
      id: 'proj-e2e',
      name: 'E2E Modernization System',
      description: 'End to end testing project',
      conversionType: 'BMS_DSPF_TO_FRONTEND',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    vi.mocked(conversionService.getScreens).mockResolvedValue(mockScreens);
    vi.mocked(conversionService.getScreenById).mockImplementation(async (id) => {
      return mockScreens.find((s) => s.id === id) ?? null;
    });

    vi.mocked(conversionService.getLatestConversion).mockResolvedValue({
      id: 'job-latest-1',
      screenId: 'scr-bms-1',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    });

    vi.mocked(conversionService.getConversionResult).mockResolvedValue({
      conversionJobId: 'job-latest-1',
      files: [
        {
          relativePath: 'components/Acct010.tsx',
          content: 'export const Acct010 = () => <div>Account Screen</div>;',
        },
      ],
    });

    vi.mocked(conversionService.getFieldMappings).mockResolvedValue(mockFieldMappings);
    vi.mocked(conversionService.getMethodMapping).mockResolvedValue(mockMethodMappingView);

    vi.mocked(qualityReviewService.getQualityReview).mockResolvedValue({
      review: {
        id: 'rev-1',
        organizationId: 'org-e2e',
        projectId: 'proj-e2e',
        conversionJobId: 'job-latest-1',
        status: ConversionQualityReviewStatus.PENDING,
      },
      fileSummary: {
        fileCount: 1,
        totalLines: 40,
        toolVersion: '1.0.0',
      },
    });

    vi.mocked(diagnosticsService.getDiagnosticsLogs).mockResolvedValue([
      {
        id: 'diag-1',
        timestamp: '2026-10-29 12:00:00',
        screenName: 'ACCT010.bms',
        errorCode: 'ERR_BMS_MACRO',
        severity: 'Error',
        lineNumber: 14,
        offendingCode: 'DFHMDF POS=(5,21)',
        snippet: [{ lineNumber: 14, code: 'DFHMDF POS=(5,21)', isOffending: true }],
        suggestedPatch: {
          offendingLine: 'DFHMDF POS=(5,21)',
          suggestedLine: '<input className="form-control" />',
          reason: 'BMS macro converted to standard input component',
        },
        resolved: false,
      },
    ]);

    vi.mocked(exportService.fetchExportPreviewFromApi).mockResolvedValue({
      fileTree: [
        {
          path: 'src',
          name: 'src',
          type: 'dir',
          size: '1 file',
        },
      ],
      metrics: {
        totalFiles: 1,
        totalLoc: 40,
        estimatedSizeKb: 8,
        selectedScreensCount: 2,
      },
    });

    vi.mocked(exportService.downloadZipBundleFromApi).mockResolvedValue(
      new Blob(['zip-binary-data'], { type: 'application/zip' })
    );
  });

  it('1. Step: Screens Workspace correctly loads and displays assets', async () => {
    renderAppWithRoute('/projects/proj-e2e/screens');

    expect(await screen.findByText('ACCT010.bms')).toBeInTheDocument();
    expect(screen.getByText('Screens Workspace')).toBeInTheDocument();
  });

  it('2. Step: Field Mapping correctly displays fields and allows persistence', async () => {
    vi.mocked(conversionService.reconvert).mockResolvedValue({
      job: { id: 'job-new-2', status: 'QUEUED', createdAt: new Date().toISOString() },
      validation: {},
    });

    renderAppWithRoute('/projects/proj-e2e/screens/scr-bms-1/mapping');

    expect(await screen.findByRole('heading', { name: /Automated Field Mapping/i })).toBeInTheDocument();
    const acctnoElements = await screen.findAllByText('ACCTNO');
    expect(acctnoElements.length).toBeGreaterThanOrEqual(1);

    const saveBtn = screen.getByRole('button', { name: /Save & Re-convert/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(conversionService.reconvert).toHaveBeenCalledWith(
        'proj-e2e',
        'scr-bms-1',
        expect.any(Array),
      );
    });
    expect(await screen.findByText(/Field mapping saved! Re-conversion triggered/i)).toBeInTheDocument();
  });

  it('3. Step: Method Mapping renames COBOL target class and persists override', async () => {
    vi.mocked(conversionService.saveMethodMapping).mockResolvedValue({
      ...mockMethodMappingView,
      entries: [{ ...mockMethodMappingView.entries[0], targetName: 'AccountProcessorTasklet' }],
    });

    renderAppWithRoute('/projects/proj-e2e/screens/scr-cobol-1/method-mapping');

    expect(await screen.findByRole('heading', { name: /Method & Class Mapping Studio/i })).toBeInTheDocument();
    const saveBtn = screen.getByRole('button', { name: /Save Mapping/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(conversionService.saveMethodMapping).toHaveBeenCalledWith(
        'proj-e2e',
        'scr-cobol-1',
        expect.any(Array),
      );
    });
    expect(await screen.findByText(/saved and applied to the generated code/i)).toBeInTheDocument();
  });

  it('4. Step: Quality Review submits human acceptance decision with rating', async () => {
    vi.mocked(qualityReviewService.submitQualityReview).mockResolvedValue({
      id: 'rev-1',
      organizationId: 'org-e2e',
      projectId: 'proj-e2e',
      conversionJobId: 'job-latest-1',
      status: ConversionQualityReviewStatus.ACCEPTED,
      qualityScore: 5,
    });

    renderAppWithRoute('/projects/proj-e2e/screens/scr-bms-1/quality-review');

    expect(await screen.findByRole('heading', { name: /Initial Conversion Quality Review/i })).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: /Accept Quality/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(qualityReviewService.submitQualityReview).toHaveBeenCalledWith(
        'proj-e2e',
        'job-latest-1',
        expect.objectContaining({
          status: ConversionQualityReviewStatus.ACCEPTED,
        }),
      );
    });
  });

  it('5. Step: Diagnostics displays real error logs and applies patch resolution', async () => {
    vi.mocked(diagnosticsService.applyDiagnosticPatch).mockResolvedValue(undefined);

    renderAppWithRoute('/projects/proj-e2e/diagnostics');

    expect(await screen.findByRole('heading', { name: /Diagnostics & Error Logs/i })).toBeInTheDocument();
    expect(await screen.findByText('ERR_BMS_MACRO')).toBeInTheDocument();

    const applyPatchBtn = screen.getByRole('button', { name: /Apply Patch & Retry/i });
    fireEvent.click(applyPatchBtn);

    await waitFor(() => {
      expect(diagnosticsService.applyDiagnosticPatch).toHaveBeenCalledWith('diag-1', 'proj-e2e');
    });
    expect(await screen.findByText(/Patch successfully applied for ACCT010.bms/i)).toBeInTheDocument();
  });

  it('6. Step: Export Code Package previews and streams complete ZIP bundle', async () => {
    renderAppWithRoute('/projects/proj-e2e/export');

    expect(await screen.findByRole('heading', { name: /Export Code Package/i })).toBeInTheDocument();
    expect(screen.getByText(/Ready to Export/i)).toBeInTheDocument();

    const downloadBtn = screen.getAllByRole('button', { name: /Generate & Download Bundle/i })[0];
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(exportService.downloadZipBundleFromApi).toHaveBeenCalled();
      expect(exportService.downloadBlob).toHaveBeenCalled();
    });
    expect(await screen.findByText(/Java Package Ready|Code Package Ready/i)).toBeInTheDocument();
  });
});
