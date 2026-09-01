import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useNotificationStore = create()(
  persist(
    (set, get) => ({
      notifications: [], // [{ id, booking_code, user_name, status, created_at, read }]

      addBookingNotification: (booking) => {
        const exists = get().notifications.find(n => n.id === `booking-${booking.id}`);
        if (exists) return;
        set(state => ({
          notifications: [
            {
              id:           `booking-${booking.id}`,
              booking_code: booking.booking_code ?? `BK-${booking.id}`,
              user_name:    booking.user?.name ?? "Guest",
              status:       booking.status,
              created_at:   booking.created_at,
              read:         false,
            },
            ...state.notifications,
          ].slice(0, 50),
        }));
      },

      syncFromBookings: (bookings) => {
        if (!Array.isArray(bookings)) return;
        bookings.forEach(b => {
          const exists = get().notifications.find(n => n.id === `booking-${b.id}`);
          if (!exists) {
            set(state => ({
              notifications: [
                {
                  id:           `booking-${b.id}`,
                  booking_code: b.booking_code ?? `BK-${b.id}`,
                  user_name:    b.user?.name ?? "Guest",
                  status:       b.status,
                  created_at:   b.created_at,
                  read:         false,
                },
                ...state.notifications,
              ].slice(0, 50),
            }));
          }
        });
      },

      markAllRead: () =>
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        })),

      markRead: (id) =>
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter(n => !n.read).length,
    }),
    {
      name:    "ResortNotifications",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
