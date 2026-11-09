import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import type { FieldMapping } from '../types/conversion';
import { conversionKeys } from './conversionKeys';
import { projectKeys } from '@/features/projects/queries/projectKeys';

export function useFieldMapping(projectId: string, screenId: string, enabled = true) {
  return useQuery<FieldMapping[]>({
    queryKey: conversionKeys.fieldMapping(projectId, screenId),
    queryFn: () => conversionService.getFieldMappings(projectId, screenId),
    enabled: enabled && Boolean(projectId) && Boolean(screenId),
  });
}

export function useSaveFieldMapping(projectId: string, screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mappings: FieldMapping[]) =>
      conversionService.saveFieldMapping(projectId, screenId, mappings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversionKeys.fieldMapping(projectId, screenId) });
      queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.screens(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useReconvertScreen(projectId: string, screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mappings: FieldMapping[]) =>
      conversionService.reconvert(projectId, screenId, mappings),
    onSuccess: (data) => {
      queryClient.setQueryData(conversionKeys.job(projectId, screenId), data.job);
      queryClient.invalidateQueries({ queryKey: conversionKeys.fieldMapping(projectId, screenId) });
      queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.screens(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
