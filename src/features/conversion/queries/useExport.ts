import { useMutation, useQuery } from '@tanstack/react-query';
import { exportService } from '../services/export.service';
import type { ExportConfiguration, ExportFileItem, BundleMetrics } from '../types/export';
import { conversionKeys } from './conversionKeys';

export function useExportPreview(
  projectId: string,
  config: ExportConfiguration,
  enabled = true,
) {
  return useQuery<{ fileTree: ExportFileItem[]; metrics: BundleMetrics }>({
    queryKey: conversionKeys.exportPreview(projectId, {
      outputOption: config.outputOption,
      frameworkTarget: config.frameworkTarget,
      stylingOption: config.stylingOption,
      includeTypeScriptStrict: config.includeTypeScriptStrict,
      includeUnitTests: config.includeUnitTests,
      includeStorybook: config.includeStorybook,
      includeDocumentation: config.includeDocumentation,
      selectedScreenIds: config.selectedScreenIds,
    }),
    queryFn: () => exportService.fetchExportPreviewFromApi(config),
    enabled: enabled && Boolean(projectId) && config.selectedScreenIds.length > 0,
    staleTime: 30000,
  });
}

export function useDownloadZipBundle(_projectId?: string) {
  return useMutation({
    mutationFn: ({
      config,
      onProgress,
    }: {
      config: ExportConfiguration;
      onProgress?: (percent: number, stepLabel: string) => void;
    }) => exportService.downloadZipBundleFromApi(config, onProgress),
  });
}
