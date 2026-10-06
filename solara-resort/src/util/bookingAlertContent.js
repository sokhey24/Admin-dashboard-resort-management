import { formatBookingStayDate } from './bookingAvailability.js';

export function formatBookingStayRange(checkIn, checkOut, lang = 'en') {
  const start = formatBookingStayDate(checkIn, lang);
  const end = formatBookingStayDate(checkOut, lang);
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  return `${start} – ${end}`;
}

/**
 * Normalized payment-due alert payload shared by Sanctuary Alerts and booking sync.
 */
export function createPaymentBookingAlert(booking, lang = 'en') {
  const roomName = booking?.roomName || '—';
  const stayRange = formatBookingStayRange(booking?.checkIn, booking?.checkOut, lang);

  const title = lang === 'km' ? 'ត្រូវបង់ប្រាក់' : 'Payment required';

  const detailBlock = stayRange ? `${roomName}\n${stayRange}` : roomName;
  const message =
    lang === 'km'
      ? `${detailBlock}\n\nបង់ប្រាក់ដើម្បីបញ្ជាក់ការកក់បន្ទប់របស់អ្នក។`
      : `${detailBlock}\n\nPlease complete your payment to confirm your reservation.`;

  return {
    type: 'payment_required',
    bookingApiId: booking.apiId,
    title,
    message,
    roomName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    date: booking.checkIn,
  };
}
