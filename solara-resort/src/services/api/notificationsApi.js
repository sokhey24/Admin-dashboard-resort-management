import axiosClient from './axiosClient.js';

export async function fetchCustomerNotifications(params = {}) {
  const { data } = await axiosClient.get('customer/notifications', { params });
  return data;
}

export async function markCustomerNotificationRead(id) {
  const { data } = await axiosClient.patch(`customer/notifications/${id}/read`);
  return data;
}

export async function markAllCustomerNotificationsRead() {
  const { data } = await axiosClient.post('customer/notifications/read-all');
  return data;
}
