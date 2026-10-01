import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const ProfileStore = create()(
  persist(
    (set) => ({
      profile:      null,
      access_token: null,
      permission:   [],   // flat array of permission strings e.g. ["admin.dashboard.view", ...]
      roles:        [],   // flat array of role name strings e.g. ["admin"]
      setProfile:      (params) => set({ profile: params }),
      setAccessToken:  (params) => set({ access_token: params }),
      setPermission:   (params) => set({ permission: Array.isArray(params) ? params : [] }),
      setRoles:        (params) => set({ roles: Array.isArray(params) ? params : [] }),
      logout: () => set({ profile: null, access_token: null, permission: [], roles: [] }),
    }),
    {
      name:    "ResortProfileStore",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
