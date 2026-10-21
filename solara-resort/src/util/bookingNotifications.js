import { bookingNeedsPayment } from './mapBooking.js';
import { createPaymentBookingAlert } from './bookingAlertContent.js';

const PAYMENT_ALERT_PREFIX = 'booking-alert-payment-';

/**
 * Merge server-backed reservation alerts (payment due, etc.) with ephemeral client notifications.
 */
export function syncBookingNotifications(existing, bookings, lang = 'en') {
  const list = Array.isArray(bookings) ? bookings : [];
  const prior = existing || [];

  const manual = prior.filter(
    (n) => !n.server && !String(n.id).startsWith(PAYMENT_ALERT_PREFIX)
  );

  const readById = new Map(
    prior
      .filter((n) => String(n.id).startsWith(PAYMENT_ALERT_PREFIX))
      .map((n) => [n.id, Boolean(n.read)])
  );

  const paymentAlerts = list
    .filter(bookingNeedsPayment)
    .map((b) => {
      const id = `${PAYMENT_ALERT_PREFIX}${b.apiId}`;
      const content = createPaymentBookingAlert(b, lang);
      return {
        ...content,
        id,
        type: 'booking_payment',
        read: readById.get(id) ?? false,
      };
    });

  return [...paymentAlerts, ...manual];
}

export function pickUpcomingBooking(bookings) {
  const list = Array.isArray(bookings) ? bookings : [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return list
    .filter((b) => !['cancelled', 'completed'].includes(b.status))
    .filter((b) => {
      if (!b.checkOut) return true;
      const out = new Date(`${b.checkOut}T00:00:00`);
      return !Number.isNaN(out.getTime()) && out >= today;
    })
    .sort((a, b) => {
      const aIn = new Date(`${a.checkIn || ''}T00:00:00`).getTime();
      const bIn = new Date(`${b.checkIn || ''}T00:00:00`).getTime();
      return aIn - bIn;
    })[0];
}
