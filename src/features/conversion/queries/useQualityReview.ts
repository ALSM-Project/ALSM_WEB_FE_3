import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qualityReviewService } from '../services/quality-review.service';
import type {
  ConversionQualityReviewResponse,
  SubmitQualityReviewPayload,
} from '../types/quality-review';
import { qualityReviewKeys } from './qualityReviewKeys';
import { projectKeys } from '@/features/projects/queries/projectKeys';

export function useConversionQualityReview(
  projectId: string,
  conversionJobId: string | undefined,
  enabled = true,
) {
  return useQuery<ConversionQualityReviewResponse>({
    queryKey: qualityReviewKeys.byJob(projectId, conversionJobId ?? 'none'),
    queryFn: () => qualityReviewService.getQualityReview(projectId, conversionJobId as string),
    enabled: enabled && Boolean(projectId) && Boolean(conversionJobId),
  });
}

export function useSubmitQualityReview(
  projectId: string,
  conversionJobId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitQualityReviewPayload) =>
      qualityReviewService.submitQualityReview(
        projectId,
        conversionJobId as string,
        payload,
      ),
    onSuccess: () => {
      if (conversionJobId) {
        queryClient.invalidateQueries({
          queryKey: qualityReviewKeys.byJob(projectId, conversionJobId),
        });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.screens(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
