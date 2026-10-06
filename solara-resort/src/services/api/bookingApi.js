import axiosClient from './axiosClient.js';

export async function fetchBookingQuote(payload) {
  const { data } = await axiosClient.post('customer/booking/quote', payload);
  return data?.data ?? data;
}

export async function createBookingRequest(payload) {
  const { data } = await axiosClient.post('customer/bookings', payload);
  return data?.data ?? data;
}

export async function fetchBooking(bookingId) {
  const { data } = await axiosClient.get(`customer/bookings/${bookingId}`);
  return data?.data ?? data;
}

export async function fetchMyBookings() {
  const { data } = await axiosClient.get('customer/bookings');
  return data?.data ?? data;
}

export async function updateBookingRequest(bookingId, payload) {
  const { data } = await axiosClient.put(`customer/bookings/${bookingId}`, payload);
  return data?.data ?? data;
}
