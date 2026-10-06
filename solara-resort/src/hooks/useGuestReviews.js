import { useQuery } from '@tanstack/react-query';
import { fetchGuestReviews } from '../services/api/reviewsApi.js';
import { getApiErrorMessage } from '../services/api/errors.js';
import { reviewKeys } from '../features/reviews/queryKeys.js';
import { mapGuestReviewsPage } from '../util/mapGuestReview.js';

export function useGuestReviews(params = { status: 'approved', per_page: 6 }, options = {}) {
  const normalized = { status: 'approved', per_page: 6, ...params };
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: reviewKeys.list(normalized),
    queryFn: async () => {
      const payload = await fetchGuestReviews(normalized);
      return mapGuestReviewsPage(payload);
    },
    enabled,
    retry: 1,
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return {
    reviews: query.data?.rows ?? [],
    meta: query.data?.meta ?? null,
    summary: query.data?.summary ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? getApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}
