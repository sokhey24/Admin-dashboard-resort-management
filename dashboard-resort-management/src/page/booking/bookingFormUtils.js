export const DEFAULT_BOOKING_TIME = "00:00";

export function normalizeTimeValue(time) {
  if (!time) return DEFAULT_BOOKING_TIME;
  const parts = String(time).trim().split(":");
  const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function stayDateOnly(dateStr) {
  if (!dateStr) return "";
  return String(dateStr).slice(0, 10);
}

export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr) return null;
  return `${stayDateOnly(dateStr)}T${normalizeTimeValue(timeStr)}:00`;
}

export function stayRangeMs(checkInDate, checkInTime, checkOutDate, checkOutTime) {
  const start = combineDateAndTime(checkInDate, checkInTime);
  const end = combineDateAndTime(checkOutDate, checkOutTime);
  if (!start || !end) return 0;
  return new Date(end).getTime() - new Date(start).getTime();
}

export const BOOKING_NEXT_STATUSES = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["completed", "cancelled"],
  checked_out: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export const formatBookingStatus = (s) =>
  !s ? "Pending" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
