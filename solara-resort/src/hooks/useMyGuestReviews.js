import { useQuery } from '@tanstack/react-query';
import { fetchMyGuestReviews } from '../services/api/reviewsApi.js';
import { getApiErrorMessage } from '../services/api/errors.js';
import { reviewKeys } from '../features/reviews/queryKeys.js';
import { mapGuestReviewsPage } from '../util/mapGuestReview.js';

export function useMyGuestReviews(params = { per_page: 20 }, options = {}) {
  const normalized = { per_page: 20, ...params };
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: reviewKeys.list({ scope: 'mine', ...normalized }),
    queryFn: async () => {
      const payload = await fetchMyGuestReviews(normalized);
      return mapGuestReviewsPage(payload);
    },
    enabled,
    retry: 1,
    staleTime: 30_000,
  });

  return {
    reviews: query.data?.rows ?? [],
    loading: query.isLoading,
    error: query.isError ? getApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}
