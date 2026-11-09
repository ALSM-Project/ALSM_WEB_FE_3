import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';
import { projectKeys } from '@/features/projects/queries/projectKeys';

/** Creates a single conversion job. Never auto-retries (FE guideline 04 §16 — job creation is not idempotent). */
export function useCreateConversionJob(projectId: string, screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { inputReference?: string } = {}) =>
      conversionService.createConversion(projectId, { screenId, inputReference: input.inputReference }),
    onSuccess: (job) => {
      queryClient.setQueryData(conversionKeys.job(projectId, screenId), job);
      queryClient.invalidateQueries({ queryKey: projectKeys.screens(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: ['screens', projectId] });
    },
  });
}
