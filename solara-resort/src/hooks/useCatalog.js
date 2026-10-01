import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiErrorMessage } from '../services/api/errors.js';
import { catalogKeys } from '../features/catalog/queryKeys.js';
import {
  queryBranchDetailBundle,
  queryBranchesPage,
  queryResortDetailBundle,
  queryResortsPage,
  queryRoomDetail,
  queryRoomsPage,
  queryRoomTypes,
} from '../features/catalog/catalogQueries.js';

function stableParams(params) {
  return params ?? {};
}

export function useResorts(params, { enabled = true } = {}) {
  const normalized = stableParams(params);
  const query = useQuery({
    queryKey: catalogKeys.resorts(normalized),
    queryFn: () => queryResortsPage(normalized),
    enabled,
  });

  const resorts = query.data?.rows ?? [];
  const meta = query.data?.meta ?? null;

  return {
    resorts,
    meta,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? getApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}

export function useBranches(params, { enabled = true } = {}) {
  const normalized = stableParams(params);
  const query = useQuery({
    queryKey: catalogKeys.branches(normalized),
    queryFn: () => queryBranchesPage(normalized),
    enabled,
  });

  return {
    branches: query.data?.rows ?? [],
    meta: query.data?.meta ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? getApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}

export function useBranchDetail(branchId, stayParams = {}) {
  const id = branchId ? String(branchId) : '';
  const normalizedStay = stableParams(stayParams);
  const query = useQuery({
    queryKey: [...catalogKeys.branch(id), normalizedStay],
    queryFn: () => queryBranchDetailBundle(id, normalizedStay),
    enabled: Boolean(id),
  });

  return {
    resort: query.data?.resort ?? null,
    rooms: query.data?.rooms ?? [],
    loading: query.isLoading,
    error: query.isError
      ? getApiErrorMessage(query.error)
      : !id
        ? 'Branch not found.'
        : null,
    reload: () => query.refetch(),
  };
}

export function useResortDetail(resortId) {
  const id = resortId ? String(resortId) : '';
  const query = useQuery({
    queryKey: catalogKeys.resort(id),
    queryFn: () => queryResortDetailBundle(id),
    enabled: Boolean(id),
  });

  return {
    resort: query.data?.resort ?? null,
    rooms: query.data?.rooms ?? [],
    loading: query.isLoading,
    error: query.isError
      ? getApiErrorMessage(query.error)
      : !id
        ? 'Resort not found.'
        : null,
    reload: () => query.refetch(),
  };
}

export function useRoomsList(params, { enabled = true } = {}) {
  const normalized = stableParams(params);
  const query = useQuery({
    queryKey: catalogKeys.rooms(normalized),
    queryFn: () => queryRoomsPage(normalized),
    enabled,
  });

  return {
    rooms: query.data?.rows ?? [],
    meta: query.data?.meta ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? getApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}

export function useRoomTypes(params = { per_page: 50 }) {
  const normalized = stableParams(params);
  const query = useQuery({
    queryKey: catalogKeys.roomTypes(normalized),
    queryFn: () => queryRoomTypes(normalized),
  });

  return {
    roomTypes: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? getApiErrorMessage(query.error) : null,
    reload: () => query.refetch(),
  };
}

export function useRoomDetail(roomId) {
  const id = roomId ? String(roomId) : '';
  const query = useQuery({
    queryKey: catalogKeys.room(id),
    queryFn: () => queryRoomDetail(id),
    enabled: Boolean(id),
  });

  return {
    room: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? getApiErrorMessage(query.error)
      : !id
        ? 'Room not found.'
        : null,
    reload: () => query.refetch(),
  };
}

/** Laravel paginator helpers */
export function usePaginationMeta(meta) {
  return useMemo(() => {
    if (!meta) {
      return { page: 1, lastPage: 1, total: 0, perPage: 50 };
    }
    return {
      page: meta.current_page ?? 1,
      lastPage: meta.last_page ?? 1,
      total: meta.total ?? 0,
      perPage: meta.per_page ?? 50,
    };
  }, [meta]);
}
