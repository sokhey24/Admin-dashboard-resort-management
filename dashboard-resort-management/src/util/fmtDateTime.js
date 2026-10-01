/**
 * Format a datetime string to "YYYY-MM-DD hh:mm:ss AM/PM" in local time
 */
export function fmtDateTime(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  const pad = n => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm   = pad(d.getMonth() + 1);
  const dd   = pad(d.getDate());
  const h    = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = pad(h % 12 || 12);
  return `${yyyy}-${mm}-${dd} ${h12}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
}
