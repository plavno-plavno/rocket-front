/** Public API of the review-analytics feature (SDD-01T §3.5). */
export { ReviewsTrendCard } from './components/reviews-trend-card';
export type { ReviewsTrendCardProps } from './components/reviews-trend-card';
export {
  reviewAnalyticsSummaryQueryOptions,
  reviewTrendQueryOptions,
  reviewAnalyticsKeys
} from './api/queries';
