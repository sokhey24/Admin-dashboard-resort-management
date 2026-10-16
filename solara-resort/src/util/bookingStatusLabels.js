const BOOKING_STATUS_FALLBACK = {
  pending: 'Awaiting resort confirmation',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const PAYMENT_STATUS_FALLBACK = {
  paid: 'Paid in full',
  unpaid: 'Payment required',
  partially_paid: 'Partially paid',
};

export function bookingStatusLabel(status, t) {
  const key = String(status || 'pending').toLowerCase();
  const fallback = BOOKING_STATUS_FALLBACK[key] || key.replace(/_/g, ' ');
  const i18nKey = `confirm.bookingStatus.${key}`;
  return t?.(i18nKey, fallback) ?? fallback;
}

export function paymentStatusLabel(paymentStatus, t) {
  const key = String(paymentStatus || 'unpaid').toLowerCase();
  const fallback = PAYMENT_STATUS_FALLBACK[key] || key.replace(/_/g, ' ');
  const i18nKey = `confirm.paymentStatus.${key}`;
  return t?.(i18nKey, fallback) ?? fallback;
}
