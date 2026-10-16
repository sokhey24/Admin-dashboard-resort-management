import axiosClient from './axiosClient.js';

export async function submitActivityBooking(payload) {
  const { data } = await axiosClient.post('customer/activity-bookings', payload);
  return data;
}
