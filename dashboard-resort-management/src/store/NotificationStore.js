import { create } from "zustand";
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../util/notificationApi";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (options = {}) => {
    const silent = Boolean(options.silent);
    if (!silent) set({ loading: true, error: null });
    const res = await fetchAdminNotifications({ per_page: 50, unread: options.unreadOnly });
    if (res?.status && res.status >= 400) {
      set({
        loading: false,
        error: res.errors?.message ?? "Failed to load notifications",
      });
      return;
    }
    set({
      notifications: Array.isArray(res?.data) ? res.data : [],
      unreadCount: typeof res?.unread_count === "number" ? res.unread_count : 0,
      loading: false,
      error: null,
    });
  },

  markRead: async (id) => {
    const res = await markAdminNotificationRead(id);
    if (res?.status && res.status >= 400) return;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount:
        typeof res?.unread_count === "number"
          ? res.unread_count
          : Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    const res = await markAllAdminNotificationsRead();
    if (res?.status && res.status >= 400) return;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => get().markAllRead(),
}));
