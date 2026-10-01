import dayjs from "dayjs";
import config from "../../util/config";

export const REPORT_TYPES = [
  { value: "bookings", label: "Bookings" },
  { value: "revenue", label: "Revenue" },
  { value: "rooms", label: "Rooms" },
  { value: "guests", label: "Guests" },
];

export const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

export function presetToRange(key) {
  const today = dayjs().startOf("day");
  switch (key) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = today.subtract(1, "day");
      return { from: y, to: y };
    }
    case "this_week":
      return { from: today.startOf("week"), to: today };
    case "this_month":
      return { from: today.startOf("month"), to: today };
    case "last_month": {
      const start = today.subtract(1, "month").startOf("month");
      const end = start.endOf("month");
      return { from: start, to: end };
    }
    case "this_year":
      return { from: today.startOf("year"), to: today };
    default:
      return { from: today.startOf("month"), to: today };
  }
}

export function buildReportQuery(filters) {
  const p = new URLSearchParams();
  if (filters.dateFrom) p.set("date_from", filters.dateFrom);
  if (filters.dateTo) p.set("date_to", filters.dateTo);
  if (filters.resortId) p.set("resort_id", String(filters.resortId));
  if (filters.branchId) p.set("branch_id", String(filters.branchId));
  if (filters.page) p.set("page", String(filters.page));
  if (filters.perPage) p.set("per_page", String(filters.perPage));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function fmtMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n}%`;
}

export function downloadReportCsv(filters, token) {
  const qs = buildReportQuery(filters);
  const url = `${config.base_url}admin/reports/export${qs}`;
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "text/csv" } : { Accept: "text/csv" },
  }).then(async (res) => {
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `resort-report-${filters.dateFrom || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

export function statusPieData(byStatus) {
  if (!byStatus || typeof byStatus !== "object") return [];
  const colors = {
    pending: "#faad14",
    confirmed: "#1677ff",
    checked_in: "#52c41a",
    checked_out: "#13c2c2",
    cancelled: "#ff4d4f",
    completed: "#722ed1",
  };
  return Object.entries(byStatus)
    .filter(([, count]) => Number(count) > 0)
    .map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: Number(count),
      fill: colors[status] || "#829AB1",
    }));
}

export function roomStatusPie(byStatus) {
  if (!byStatus) return [];
  const colors = {
    available: "#52c41a",
    occupied: "#1677ff",
    reserved: "#faad14",
    maintenance: "#ff7875",
  };
  return Object.entries(byStatus)
    .filter(([, count]) => Number(count) > 0)
    .map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: Number(count),
      fill: colors[status] || "#829AB1",
    }));
}
