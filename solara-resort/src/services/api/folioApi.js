import { axiosClient } from './axiosClient.js';

export async function fetchGuestFolio(bookingApiId) {
  const { data } = await axiosClient.get(`/customer/bookings/${bookingApiId}/folio`);
  return data?.data ?? data;
}
