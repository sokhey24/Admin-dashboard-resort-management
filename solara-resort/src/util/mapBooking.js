import { KHR_RATE } from './currency.js';
import { resolveResortFeaturedImage, resolveRoomFeaturedImage } from './media.js';

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function roomLabel(room) {
  if (!room) return '—';
  const typeName = room.room_type?.name || room.roomType?.name || 'Room';
  const number = room.room_number || room.roomNumber;
  return number ? `${typeName} · ${number}` : typeName;
}

function mapRoomsFromBooking(booking) {
  const rooms = Array.isArray(booking?.rooms) ? booking.rooms : [];
  return rooms.map((room) => ({
    id: room.id,
    label: roomLabel(room),
    roomNumber: room.room_number || room.roomNumber || '',
    image: resolveRoomFeaturedImage(room),
  }));
}

export function mapQuoteToSummary(quote, currency = 'USD') {
  if (!quote) return null;

  const roomLines = Array.isArray(quote.rooms) ? quote.rooms : [];
  const roomStayTotal = roomLines.reduce(
    (sum, line) => sum + Number(line.gross_subtotal ?? line.subtotal ?? 0),
    0
  );

  const totalUsd = Number(quote.total ?? 0);

  return {
    nights: quote.nights,
    roomStayTotal,
    roomLines,
    subtotal: Number(quote.subtotal ?? 0),
    discount: Number(quote.discount ?? 0),
    roomDiscount: Number(quote.room_discount_total ?? 0),
    couponDiscount: Number(quote.coupon_discount ?? 0),
    couponCode: quote.coupon_code || null,
    discountedSubtotal: Number(quote.discounted_subtotal ?? 0),
    tax: Number(quote.tax ?? 0),
    serviceCharge: Number(quote.service_charge ?? 0),
    total: totalUsd,
    totalKHR:
      quote.total_khr != null ? Number(quote.total_khr) : Math.round(totalUsd * KHR_RATE),
    currency: quote.currency || currency,
    resortId: quote.resort_id,
    branchId: quote.branch_id ?? null,
    raw: quote,
  };
}

export function mapBookingFromApi(booking) {
  if (!booking) return null;

  const roomList = mapRoomsFromBooking(booking);
  const room = booking.rooms?.[0];
  const roomName =
    roomList.length > 1
      ? roomList.map((r) => r.label).join(', ')
      : roomList[0]?.label || roomLabel(room);
  const total = Number(booking.total_amount ?? 0);
  const subtotal = Number(booking.subtotal ?? 0);
  const discount = Number(booking.discount ?? 0);
  const roomDiscount = Number(booking.room_discount_total ?? 0);
  const couponDiscount = Math.max(0, roundMoney(discount - roomDiscount));
  const balanceDue = Number(booking.balance_due ?? total);

  const guestInfo = parseGuestInfo(booking.special_requests);
  const branchName = booking.branch?.name || booking.branch_name || '';
  const branchLocation = booking.branch
    ? [booking.branch.city, booking.branch.province].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')
    : '';
  const brandName = booking.resort?.brand_name || booking.resort?.name || 'Solara Resort & Spa';

  return {
    id: booking.booking_code || String(booking.id),
    apiId: booking.id,
    resortId: booking.resort_id,
    branchId: booking.branch_id || booking.branch?.id || null,
    branchName,
    branchLocation,
    brandName,
    resortName: branchName ? `${brandName} — ${branchName}` : brandName,
    roomId: room?.id,
    roomNumber: roomList[0]?.roomNumber || room?.room_number || '',
    roomName,
    rooms: roomList,
    roomImage:
      roomList[0]?.image ||
      resolveRoomFeaturedImage(room) ||
      resolveResortFeaturedImage(booking.resort) ||
      null,
    checkIn: formatDate(booking.check_in),
    checkOut: formatDate(booking.check_out),
    nights: booking.nights,
    guests: {
      adults: booking.adults ?? 1,
      children: booking.children ?? 0,
      rooms: booking.rooms?.length ?? 1,
    },
    status: booking.status,
    paymentStatus: booking.payment_status,
    balanceDue,
    guestInfo,
    pricing: {
      subtotal,
      nightsTotal: subtotal,
      discount,
      roomDiscount,
      couponDiscount,
      discountedSubtotal: Math.max(0, roundMoney(subtotal - discount)),
      tax: Number(booking.tax_amount ?? 0),
      serviceFee: Number(booking.service_charge_amount ?? 0),
      totalUSD: total,
      totalKHR: Math.round(total * KHR_RATE),
    },
    reviewEligibility: booking.review_eligibility ?? { can_review: false, rooms: [] },
    raw: booking,
  };
}

/** Matches Laravel `Booking::getPaymentStatusAttribute()` balance threshold. */
export const BOOKING_BALANCE_EPSILON = 0.009;

const NON_PAYABLE_BOOKING_STATUSES = new Set(['cancelled', 'completed']);

/** True when the guest still owes a balance and may use the KHQR payment flow. */
export function bookingNeedsPayment(booking) {
  if (!booking || booking.apiId == null) return false;
  if (NON_PAYABLE_BOOKING_STATUSES.has(booking.status)) return false;

  const balanceRaw = booking.balanceDue;
  if (balanceRaw == null || balanceRaw === '') return false;
  const balance = Number(balanceRaw);
  if (!Number.isFinite(balance) || balance <= BOOKING_BALANCE_EPSILON) return false;

  const paymentStatus = String(booking.paymentStatus ?? '').toLowerCase();
  if (paymentStatus === 'paid') return false;

  return true;
}

function parseGuestInfo(specialRequests) {
  const text = specialRequests || '';
  const lines = text.split('\n').map((l) => l.trim());
  const pick = (prefix) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));
    return line ? line.slice(prefix.length).trim() : '';
  };

  const guestLine = pick('Guest:');
  const parts = guestLine.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  const freeform = lines
    .filter(
      (l) =>
        l &&
        !/^guest:/i.test(l) &&
        !/^email:/i.test(l) &&
        !/^phone:/i.test(l) &&
        !/^estimated arrival:/i.test(l)
    )
    .join('\n');

  return {
    firstName,
    lastName,
    email: pick('Email:'),
    phone: pick('Phone:'),
    arrivalTime: pick('Estimated arrival:'),
    specialRequests: freeform,
  };
}

export function buildSpecialRequests({ firstName, lastName, email, phone, arrivalTime, specialRequests }) {
  return [
    `Guest: ${firstName} ${lastName}`.trim(),
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Estimated arrival: ${arrivalTime}`,
    specialRequests || '',
  ]
    .filter(Boolean)
    .join('\n');
}
