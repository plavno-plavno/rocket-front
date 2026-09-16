import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { reviewAnalyticsKeys } from './queries';
import { exportReviewAnalytics } from './service';

export const exportReviewAnalyticsMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...reviewAnalyticsKeys.all, 'export_review_analytics'],
    mutationFn: ({
      body,
      params
    }: {
      body: Parameters<typeof exportReviewAnalytics>[0];
      params?: Parameters<typeof exportReviewAnalytics>[1];
    }) => exportReviewAnalytics(body, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: reviewAnalyticsKeys.all })
  });
