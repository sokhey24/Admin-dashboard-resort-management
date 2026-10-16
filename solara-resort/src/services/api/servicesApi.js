import axiosClient from './axiosClient.js';

export async function submitServiceInquiry(payload) {
  const { data } = await axiosClient.post('customer/service-inquiries', payload);
  return data;
}
