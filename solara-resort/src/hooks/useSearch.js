import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '../context/AppContext.jsx';
import { catalogKeys } from '../features/catalog/queryKeys.js';
import { queryBranchesPage } from '../features/catalog/catalogQueries.js';
import { usePaginationMeta, useBranches } from './useCatalog.js';
import {
  applySearchCriteria,
  buildBranchesSearchPath,
  buildResortsSearchPath,
  parseSearchCriteria,
} from '../util/searchParams.js';
import { buildBranchFilterOptions, mapSortToApi, sortResortsClient } from '../util/mapCatalog.js';

/**
 * Resolved criteria: URL wins; dates/guests fall back to booking draft on marketing pages.
 */
export function useSearchCriteria() {
  const [searchParams] = useSearchParams();
  const { bookingDraft } = useApp();

  return useMemo(() => {
    const fromUrl = parseSearchCriteria(searchParams);
    return {
      branchId: fromUrl.branchId || bookingDraft.branchId || '',
      destination: fromUrl.destination,
      checkIn: fromUrl.checkIn || bookingDraft.checkIn || '',
      checkOut: fromUrl.checkOut || bookingDraft.checkOut || '',
      adults: fromUrl.adults || bookingDraft.adults || 2,
      children: fromUrl.children ?? bookingDraft.children ?? 0,
      rooms: fromUrl.rooms || bookingDraft.roomsCount || 1,
    };
  }, [searchParams, bookingDraft]);
}

export function useSearchDestinationOptions() {
  const { t } = useApp();
  const query = useQuery({
    queryKey: catalogKeys.branches({ per_page: 50, facet: 'destinations' }),
    queryFn: () => queryBranchesPage({ per_page: 50 }),
    staleTime: 5 * 60_000,
  });

  const rawBranches = query.data?.rows ?? [];

  const destinationOptions = useMemo(() => {
    return buildBranchFilterOptions(rawBranches, t('search.allDestinations', 'All Destinations')).filter(
      (opt) => opt.value !== undefined
    );
  }, [rawBranches, t]);

  const branchOptions = useMemo(() => {
    return [
      {
        value: '',
        branchId: '',
        destination: '',
        label: t('search.allDestinations', 'All Locations & Branches'),
      },
      ...rawBranches.map((b) => ({
        value: String(b.id),
        branchId: b.id,
        destination: b.city || b.destination,
        label: `${b.name} (${b.city || b.location})`,
        branch: b,
      })),
    ];
  }, [rawBranches, t]);

  return {
    destinationOptions,
    branchOptions,
    branches: rawBranches,
    loading: query.isLoading,
    error: query.isError,
  };
}

export function useSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const criteria = useSearchCriteria();
  const { updateBookingDraft, bookingDraft } = useApp();
  const { destinationOptions, branchOptions, loading: destinationsLoading } = useSearchDestinationOptions();

  const persistDraft = useCallback(
    (next) => {
      updateBookingDraft({
        ...(next.branchId ? { branchId: Number(next.branchId) } : {}),
        checkIn: next.checkIn,
        checkOut: next.checkOut,
        adults: next.adults,
        children: next.children,
        roomsCount: next.rooms,
      });
    },
    [updateBookingDraft]
  );

  const submitSearch = useCallback(
    (partial) => {
      const nextCriteria = {
        branchId: partial.branchId !== undefined ? partial.branchId : criteria.branchId,
        destination: partial.destination ?? criteria.destination,
        checkIn: partial.checkIn ?? criteria.checkIn,
        checkOut: partial.checkOut ?? criteria.checkOut,
        adults: partial.adults ?? partial.guests ?? criteria.adults,
        children: partial.children ?? criteria.children,
        rooms: partial.rooms ?? criteria.rooms,
      };

      persistDraft(nextCriteria);

      const mergedParams = applySearchCriteria(searchParams, nextCriteria);
      const path = buildBranchesSearchPath(nextCriteria, mergedParams);

      if (window.location.pathname.startsWith('/resorts') || window.location.pathname.startsWith('/branches')) {
        setSearchParams(mergedParams);
      } else {
        navigate(path);
      }

      return nextCriteria;
    },
    [criteria, navigate, persistDraft, searchParams, setSearchParams]
  );

  return {
    criteria,
    destinationOptions,
    branchOptions,
    destinationsLoading,
    submitSearch,
    status: destinationsLoading ? 'loading' : 'idle',
  };
}

/**
 * Resort / branch search results.
 */
export function useResortSearchResults({
  page,
  sort,
  maxPrice,
  minRating,
}) {
  const criteria = useSearchCriteria();

  const apiParams = useMemo(
    () => ({
      page,
      per_page: 12,
      ...(criteria.branchId ? { branch_id: criteria.branchId } : {}),
      ...(criteria.destination
        ? { city: criteria.destination, destination: criteria.destination }
        : {}),
      sort: mapSortToApi(sort),
    }),
    [page, criteria.branchId, criteria.destination, sort]
  );

  const { branches, meta, loading, error, reload, isFetching } = useBranches(apiParams);
  const { total } = usePaginationMeta(meta);

  const filteredResorts = useMemo(() => {
    const list = branches.filter((r) => {
      if (r.startingPrice > maxPrice) return false;
      if (minRating > 0 && (r.rating ?? 0) < minRating) return false;
      return true;
    });
    return sortResortsClient(list, sort);
  }, [branches, maxPrice, minRating, sort]);

  const status = useMemo(() => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (filteredResorts.length === 0) return 'empty';
    return 'results';
  }, [loading, error, filteredResorts.length]);

  return {
    criteria,
    resorts: filteredResorts,
    total,
    meta,
    status,
    loading,
    isFetching,
    error,
    reload,
  };
}
