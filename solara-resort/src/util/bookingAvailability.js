/**
 * Parse safe room-unavailability metadata from a 422 booking/quote API response.
 */
export function parseRoomAvailabilityFromError(error) {
  const rooms = error?.response?.data?.availability?.unavailable_rooms;
  if (!Array.isArray(rooms) || rooms.length === 0) return null;
  return rooms;
}

export function formatBookingStayDate(isoDate, language = 'en') {
  if (!isoDate) return '';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  const locale = language === 'km' ? 'km-KH' : 'en-US';
  return parsed.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function addDaysToIsoDate(isoDate, days) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  parsed.setDate(parsed.getDate() + days);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nightsBetweenIso(checkIn, checkOut) {
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const diff = Math.round((b - a) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff);
}
