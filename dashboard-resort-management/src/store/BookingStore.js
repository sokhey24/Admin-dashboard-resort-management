import { create } from "zustand";

export const useBookingStore = create((set, get) => ({
  bookings: [],
  checkoutTime: null,

  setBookings: (bookings) => set({ bookings }),
  setCheckoutTime: (time) => set({ checkoutTime: time }),

  updateBooking: (updated) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === updated.id ? { ...b, ...updated } : b
      ),
    })),

  getBooking: (id) => get().bookings.find((b) => b.id === id) ?? null,
}));
