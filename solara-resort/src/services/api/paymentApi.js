import axiosClient from './axiosClient.js';

export async function createBookingKhqr(bookingId, gateway = 'aba-khqr') {
  const { data } = await axiosClient.post(`customer/bookings/${bookingId}/khqr`, { gateway });
  return data?.data ?? data;
}

export async function verifyKhqrByMd5(md5) {
  const { data } = await axiosClient.post('customer/khqr/verify', {
    md5: String(md5).toLowerCase(),
  });
  return data;
}

export async function verifyKhqrPayment(paymentId) {
  const { data } = await axiosClient.post(`customer/payments/${paymentId}/khqr/verify`);
  return data;
}

export async function createStripePaymentIntent(bookingId, clientRequestId) {
  const { data } = await axiosClient.post(`customer/bookings/${bookingId}/stripe/payment-intent`, {
    client_request_id: clientRequestId,
  });
  return data?.data ?? data;
}

export async function syncStripePayment(paymentId) {
  const { data } = await axiosClient.post(`customer/payments/${paymentId}/stripe/sync`);
  return data;
}
