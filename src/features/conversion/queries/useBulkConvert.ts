import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';
import { projectKeys } from '@/features/projects/queries/projectKeys';

/** Creates one conversion job per screen. Never auto-retries (FE guideline 04 §16). */
export function useBulkConvert(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (screenIds: string[]) => conversionService.bulkConvertScreens(projectId, screenIds),
    onSuccess: (jobs) => {
      for (const job of jobs) {
        if (job.screenId) {
          queryClient.setQueryData(conversionKeys.job(projectId, job.screenId), job);
        }
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.screens(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['screens', projectId] });
    },
  });
}
