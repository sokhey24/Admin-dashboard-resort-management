import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { request } from "../util/request";
import { asList } from "../util/asList";
import { useCatalogStore } from "./CatalogStore";

export const useBranchStore = create()(
  persist(
    (set, get) => ({
      selectedBranchId: null, // null = "All Branches", or integer ID
      branches: [],
      branchScopeLocked: false,
      scopedBranchName: null,
      loading: false,
      error: null,

      setSelectedBranchId: (id) => {
        const { branchScopeLocked } = get();
        if (branchScopeLocked && id === null) {
          return;
        }
        const numericId = id === null || id === undefined || id === "all" ? null : Number(id);
        set({ selectedBranchId: numericId });

        // Synchronize with CatalogStore so all existing modules remain in lockstep
        try {
          useCatalogStore.getState().setSelectedBranchId(numericId);
        } catch {
          // CatalogStore sync fallback
        }
      },

      setBranches: (branches) => {
        const list = Array.isArray(branches) ? branches : [];
        set({ branches: list });
        try {
          useCatalogStore.setState({ branches: list });
        } catch {
          // fallback
        }
      },

      initBranchScope: (profile, canBypassAll = false) => {
        if (!profile) return;

        const assigned = profile.assigned_branches ?? [];
        const primaryId = profile.primary_branch_id
          ?? assigned.find((b) => b.is_primary)?.id
          ?? assigned[0]?.id
          ?? null;

        // If user is super-admin or has global view permission, allow switching across all branches
        if (canBypassAll) {
          set({
            branchScopeLocked: false,
            scopedBranchName: null,
          });
          return;
        }

        // For scoped users, lock to assigned branch
        if (primaryId) {
          const primaryBranch = assigned.find((b) => Number(b.id) === Number(primaryId));
          set({
            selectedBranchId: Number(primaryId),
            branchScopeLocked: true,
            scopedBranchName: primaryBranch?.name ?? "Assigned Branch",
          });
          try {
            useCatalogStore.setState({
              selectedBranchId: Number(primaryId),
              branchScopeLocked: true,
            });
          } catch {
            // fallback
          }
        }
      },

      fetchBranches: async () => {
        set({ loading: true, error: null });
        try {
          const res = await request("admin/branches?per_page=200", "get");
          if (res?.errors) {
            set({ loading: false, error: res.errors.message ?? "Failed to fetch branches" });
            return [];
          }
          const list = asList(res);
          set({ branches: list, loading: false });

          try {
            useCatalogStore.setState({ branches: list });
          } catch {
            // fallback
          }
          return list;
        } catch (err) {
          set({ loading: false, error: err.message });
          return [];
        }
      },

      reset: () => set({
        selectedBranchId: null,
        branches: [],
        branchScopeLocked: false,
        scopedBranchName: null,
        loading: false,
        error: null,
      }),
    }),
    {
      name: "resort_selected_branch",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedBranchId: state.selectedBranchId }),
    }
  )
);
