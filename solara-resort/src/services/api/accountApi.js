import axiosClient from './axiosClient.js';

export async function fetchProfile() {
  const { data } = await axiosClient.get('profile');
  return data?.data ?? data;
}

export async function updateProfile(payload) {
  const { data } = await axiosClient.put('profile', payload);
  return data?.data ?? data;
}

/** POST /api/profile/avatar — multipart field `avatar` */
export async function uploadProfileAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await axiosClient.post('profile/avatar', formData);
  return data?.data ?? data;
}

/** DELETE /api/profile/avatar */
export async function deleteProfileAvatar() {
  const { data } = await axiosClient.delete('profile/avatar');
  return data?.data ?? data;
}

/** POST /api/auth/change-password */
export async function changePasswordAuth(payload) {
  const { data } = await axiosClient.post('auth/change-password', payload);
  return data;
}

/** POST /api/profile/change-password */
export async function changePasswordProfile(payload) {
  const { data } = await axiosClient.post('profile/change-password', payload);
  return data;
}

export async function fetchPreferences() {
  const { data } = await axiosClient.get('profile/preferences');
  return data?.data?.preferences ?? data?.preferences ?? null;
}

export async function updatePreferences(payload) {
  const { data } = await axiosClient.put('profile/preferences', payload);
  return data?.data?.preferences ?? data?.preferences ?? null;
}
