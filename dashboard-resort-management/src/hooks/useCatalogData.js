import { useEffect } from "react";
import { useCatalogStore } from "../store/CatalogStore";

/**
 * Shared resort catalog (resorts, branches, room types, facilities) for dropdowns and filters.
 * Loaded once per session from MainLayout; pages can opt in with autoFetch or read cached data only.
 */
export function useCatalogData({ autoFetch = true } = {}) {
  const resorts = useCatalogStore((s) => s.resorts);
  const branches = useCatalogStore((s) => s.branches);
  const roomTypes = useCatalogStore((s) => s.roomTypes);
  const facilities = useCatalogStore((s) => s.facilities);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);

  useEffect(() => {
    if (autoFetch) {
      useCatalogStore.getState().fetchCatalog();
    }
  }, [autoFetch]);

  const store = useCatalogStore.getState;

  return {
    resorts,
    branches,
    roomTypes,
    facilities,
    loading,
    error,
    fetchCatalog: (force) => store().fetchCatalog(force),
    refreshResorts: () => store().refreshResorts(),
    refreshBranches: () => store().refreshBranches(),
    refreshRoomTypes: () => store().refreshRoomTypes(),
    refreshFacilities: () => store().refreshFacilities(),
    invalidateCatalog: () => store().invalidate(),
  };
}

export default useCatalogData;
