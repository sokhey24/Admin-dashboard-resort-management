/**
 * Booking checkout reads selection from the URL first, then falls back to the draft.
 * Prices and totals are never taken from the URL or localStorage.
 */

export function parseBookingQuery(searchParams) {
  const sp = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams || '');

  const roomRaw = sp.get('roomId') || sp.get('room');
  const roomId = roomRaw ? Number(roomRaw) : null;

  const promo =
    sp.get('promo') || sp.get('coupon') || sp.get('coupon_code') || sp.get('couponCode') || '';

  const checkIn = sp.get('checkIn') || sp.get('check_in') || '';
  const checkOut = sp.get('checkOut') || sp.get('check_out') || '';

  const adultsRaw = sp.get('adults');
  const childrenRaw = sp.get('children');

  const updates = {};
  if (roomId && Number.isFinite(roomId) && roomId > 0) updates.roomId = roomId;
  if (checkIn) updates.checkIn = checkIn;
  if (checkOut) updates.checkOut = checkOut;
  if (adultsRaw) updates.adults = Math.max(1, Number(adultsRaw) || 1);
  if (childrenRaw !== null && childrenRaw !== '') updates.children = Math.max(0, Number(childrenRaw) || 0);
  if (promo) updates.couponCode = promo.trim();

  return {
    updates,
    hasUpdates: Object.keys(updates).length > 0,
  };
}

export function validateBookingStay({ roomId, roomIds, checkIn, checkOut, adults }) {
  const errors = [];

  const ids = Array.isArray(roomIds) && roomIds.length
    ? roomIds
    : roomId
      ? [roomId]
      : [];

  if (!ids.length) {
    errors.push('Select an accommodation before continuing.');
  }
  if (!checkIn || !checkOut) {
    errors.push('Check-in and check-out dates are required.');
  } else {
    const inDate = new Date(`${checkIn}T00:00:00`);
    const outDate = new Date(`${checkOut}T00:00:00`);
    if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) {
      errors.push('Enter valid check-in and check-out dates.');
    } else if (outDate <= inDate) {
      errors.push('Check-out must be after check-in.');
    }
  }
  if (!adults || adults < 1) {
    errors.push('At least one adult guest is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors[0] || '',
  };
}

export function buildBookingReturnPath(searchParams) {
  const qs = searchParams?.toString?.() || '';
  return qs ? `/booking?${qs}` : '/booking';
}

export function buildBookingPath({
  roomId,
  checkIn,
  checkOut,
  adults,
  children,
  couponCode,
} = {}) {
  const params = new URLSearchParams();
  if (roomId) params.set('roomId', String(roomId));
  if (checkIn) params.set('checkIn', checkIn);
  if (checkOut) params.set('checkOut', checkOut);
  if (adults) params.set('adults', String(adults));
  if (children != null && children !== '') params.set('children', String(children));
  const promo = typeof couponCode === 'string' ? couponCode.trim() : '';
  if (promo) params.set('promo', promo);
  const qs = params.toString();
  return qs ? `/booking?${qs}` : '/booking';
}

export function isBookingAvailabilityError(message) {
  if (!message || typeof message !== 'string') return false;
  return /not available/i.test(message);
}
