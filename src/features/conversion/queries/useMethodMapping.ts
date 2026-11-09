import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import type { MethodMappingEntry, MethodMappingView } from '../types/conversion';
import { conversionKeys } from './conversionKeys';
import { projectKeys } from '@/features/projects/queries/projectKeys';

export function useMethodMapping(projectId: string, screenId: string, enabled = true) {
  return useQuery<MethodMappingView>({
    queryKey: conversionKeys.methodMapping(projectId, screenId),
    queryFn: () => conversionService.getMethodMapping(projectId, screenId),
    enabled: enabled && Boolean(projectId) && Boolean(screenId),
  });
}

export function useSaveMethodMapping(projectId: string, screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: MethodMappingEntry[]) =>
      conversionService.saveMethodMapping(projectId, screenId, entries),
    onSuccess: (data) => {
      queryClient.setQueryData(conversionKeys.methodMapping(projectId, screenId), data);
      queryClient.invalidateQueries({ queryKey: conversionKeys.methodMapping(projectId, screenId) });
      queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.screens(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
