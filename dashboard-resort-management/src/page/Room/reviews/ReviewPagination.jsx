export default function ReviewPagination({
  dark,
  page,
  lastPage,
  from,
  to,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  itemLabel = "items",
}) {
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  const pages = visiblePages(page, lastPage);

  return (
    <div className={`px-1 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
      <span>Showing {total === 0 ? 0 : from}–{to} of {total} {itemLabel}</span>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className={`h-8 rounded-lg border text-xs px-2 ${dark ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-[#D9E2EC] text-[#486581]"}`}
          aria-label="Items per page"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={pageBtn}>Previous</button>
        {pages.map((item, idx) =>
          item === "…" ? (
            <span key={`e-${idx}`} className="px-1">…</span>
          ) : (
            <button
              type="button"
              key={item}
              onClick={() => onPageChange(item)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${page === item ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`}
            >
              {item}
            </button>
          )
        )}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= lastPage} className={pageBtn}>Next</button>
      </div>
    </div>
  );
}

function visiblePages(current, last) {
  if (last <= 7) return Array.from({ length: Math.max(last, 1) }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < last - 1) pages.push("…");
  pages.push(last);
  return pages;
}
