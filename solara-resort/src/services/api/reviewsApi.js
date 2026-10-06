import axiosClient from './axiosClient.js';

export async function fetchGuestReviews(params = {}) {
  const { data } = await axiosClient.get('customer/reviews', { params });
  return data;
}

export async function submitGuestReview(payload) {
  const { data } = await axiosClient.post('customer/reviews', payload);
  return data?.data ?? data;
}

export async function fetchMyGuestReviews(params = {}) {
  const { data } = await axiosClient.get('customer/reviews/mine', { params });
  return data;
}

export async function updateGuestReview(reviewId, payload) {
  const { data } = await axiosClient.patch(`customer/reviews/${reviewId}`, payload);
  return data?.data ?? data;
}

export async function deleteGuestReview(reviewId) {
  await axiosClient.delete(`customer/reviews/${reviewId}`);
}
