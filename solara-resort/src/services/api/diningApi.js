import axiosClient from './axiosClient.js';
import { resolveStorageUrl } from '../../util/media.js';

export async function fetchFoodCategories() {
  const { data } = await axiosClient.get('customer/food-categories');
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function fetchMenuItems(params = {}) {
  const { data } = await axiosClient.get('customer/menu-items', { params });
  return Array.isArray(data) ? data : data?.data ?? [];
}

export function menuItemImageUrl(item) {
  return resolveStorageUrl(item?.image) || null;
}

export async function submitGuestTableReservation(payload) {
  const { data } = await axiosClient.post('customer/table-reservation-requests', payload);
  return data;
}
