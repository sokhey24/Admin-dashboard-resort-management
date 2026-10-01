import axiosClient from './axiosClient.js';
import { resolveStorageUrl } from '../../util/media.js';

export async function fetchResorts(params = {}) {
  const { data } = await axiosClient.get('customer/resorts', { params });
  return data;
}

export async function fetchBranches(params = {}) {
  const { data } = await axiosClient.get('customer/branches', { params });
  return data;
}

export async function fetchBranch(branchId) {
  const { data } = await axiosClient.get(`customer/branches/${branchId}`);
  return data?.data ?? data;
}

export async function fetchBranchRooms(branchId, params = {}) {
  const { data } = await axiosClient.get(`customer/branches/${branchId}/rooms`, { params });
  return data;
}

export async function fetchResort(resortId) {
  const { data } = await axiosClient.get(`customer/resorts/${resortId}`);
  return data?.data ?? data;
}

export async function fetchRooms(params = {}) {
  const { data } = await axiosClient.get('customer/rooms', { params });
  return data;
}

export async function fetchRoom(roomId) {
  const { data } = await axiosClient.get(`customer/rooms/${roomId}`);
  return data?.data ?? data;
}

export async function fetchRoomTypes(params = {}) {
  const { data } = await axiosClient.get('customer/room-types', { params });
  return data;
}

export async function fetchResortGallery(resortId) {
  const { data } = await axiosClient.get('customer/gallery');
  const rows = Array.isArray(data) ? data : data?.data ?? [];
  return rows.filter((photo) => Number(photo.resort_id) === Number(resortId));
}

export function galleryPhotoUrl(photo) {
  return resolveStorageUrl(photo?.path);
}
