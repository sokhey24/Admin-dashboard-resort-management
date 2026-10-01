const STATUS_STYLE = {
  pending:  { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200", dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  approved: { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",    dark: "bg-green-900/40 text-green-400 ring-green-700" },
  rejected: { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",            dark: "bg-red-900/40 text-red-400 ring-red-700" },
};

export const REVIEW_STATUS_LABELS = {
  pending: "Pending",
  approved: "Published",
  rejected: "Rejected",
};

export default function ReviewStatusBadge({ status, dark }) {
  const key = String(status || "").toLowerCase();
  const s = STATUS_STYLE[key] ?? STATUS_STYLE.pending;
  const label = REVIEW_STATUS_LABELS[key] ?? (status ? String(status).replace(/_/g, " ") : "Unknown");

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}
