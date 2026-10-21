import axiosClient from './axiosClient.js';

export async function submitContactInquiry(payload) {
  const { data } = await axiosClient.post('customer/contact-inquiries', payload);
  return data;
}
