import { asList, paginationFrom } from "../Room/roomHelpers";

export { asList, paginationFrom };

export const PAY_PAGE_SIZE = 10;
export const PAY_STATUSES = ["all", "paid", "pending", "failed", "refunded"];
export const PAY_METHODS = [
  { value: "", label: "All methods" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "qr_code", label: "KHQR / QR" },
  { value: "online", label: "Online" },
];

export function fmtAmt(v) {
  return `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function methodLabel(value) {
  if (!value) return "—";
  const found = PAY_METHODS.find((m) => m.value === value);
  if (found?.label) return found.label;
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function roomSummary(payment) {
  const rooms = payment?.reference?.rooms;
  if (!Array.isArray(rooms) || rooms.length === 0) return "—";
  return rooms.map((r) => r.room_number).filter(Boolean).join(", ") || "—";
}

export function bookingCode(payment) {
  return payment?.reference?.booking_code ?? (payment?.reference?.booking_id ? `BK-${payment.reference.booking_id}` : "—");
}

export function orderCode(payment) {
  return payment?.reference?.order_code ?? "—";
}

export function tableSummary(payment) {
  return payment?.reference?.table?.table_number ?? "—";
}

export function venueName(payment) {
  if (payment?.source === "restaurant") {
    return payment?.reference?.restaurant?.name ?? "—";
  }
  return payment?.reference?.resort?.name ?? "—";
}

export function sourceLabel(payment) {
  return payment?.source === "restaurant" ? "Restaurant" : "Resort";
}

export function buildPaymentQuery({ page, perPage, search, status, method, resortId, bookingId, filter, source }) {
  const params = new URLSearchParams();
  params.set("page", String(page || 1));
  params.set("per_page", String(perPage || PAY_PAGE_SIZE));
  if (source) params.set("source", source);
  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);
  if (method) params.set("payment_method", method);
  if (resortId) params.set("resort_id", String(resortId));
  if (bookingId) params.set("booking_id", String(bookingId));
  if (filter?.date) params.set("date", filter.date);
  if (filter?.month) params.set("month", String(filter.month));
  if (filter?.year) params.set("year", String(filter.year));
  return params.toString();
}
