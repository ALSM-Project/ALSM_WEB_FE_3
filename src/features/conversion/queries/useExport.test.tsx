import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { exportService } from '../services/export.service';
import type { ExportConfiguration } from '../types/export';
import { useExportPreview, useDownloadZipBundle } from './useExport';

vi.mock('../services/export.service', () => ({
  exportService: {
    fetchExportPreviewFromApi: vi.fn(),
    downloadZipBundleFromApi: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const sampleConfig: ExportConfiguration = {
  projectId: 'proj-1',
  projectName: 'Test Project',
  outputOption: 'scaffold',
  frameworkTarget: 'react-19',
  stylingOption: 'tailwind',
  includeTypeScriptStrict: true,
  includeUnitTests: true,
  includeStorybook: false,
  includeDocumentation: true,
  selectedScreenIds: ['scr-1', 'scr-2'],
};

describe('useExport hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches export preview from API via useExportPreview', async () => {
    const mockPreview = {
      fileTree: [
        {
          path: 'src',
          name: 'src',
          type: 'dir' as const,
          size: '1 file',
        },
      ],
      metrics: {
        totalFiles: 1,
        totalLoc: 50,
        estimatedSizeKb: 10,
        selectedScreensCount: 2,
      },
    };

    vi.mocked(exportService.fetchExportPreviewFromApi).mockResolvedValue(mockPreview);

    const { result } = renderHook(
      () => useExportPreview('proj-1', sampleConfig),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPreview);
    expect(exportService.fetchExportPreviewFromApi).toHaveBeenCalledWith(sampleConfig);
  });

  it('downloads zip bundle from API via useDownloadZipBundle', async () => {
    const mockBlob = new Blob(['mock-data'], { type: 'application/zip' });
    vi.mocked(exportService.downloadZipBundleFromApi).mockResolvedValue(mockBlob);

    const { result } = renderHook(
      () => useDownloadZipBundle('proj-1'),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ config: sampleConfig });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockBlob);
    expect(exportService.downloadZipBundleFromApi).toHaveBeenCalledWith(sampleConfig, undefined);
  });
});
