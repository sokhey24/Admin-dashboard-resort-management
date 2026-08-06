import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const ProfileStore = create()(
  persist(
    (set) => ({
      profile: null,
      access_token: null,
      permission: null,
      setProfile: (params) => set({ profile: params }),
      setAccessToken: (params) => set({ access_token: params }),
      setPermission: (params) => set({ permission: params }),
      logout: () => set({ profile: null, access_token: null, permission: null }),
    }),
    {
      name: "ResortProfileStore",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
