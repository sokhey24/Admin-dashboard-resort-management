import {
  roomPageSubTextClass,
  roomPaginationNavClass,
  roomPaginationPageClass,
  roomCellTextClass,
} from "../roomHelpers";

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
  const pageBtn = roomPaginationNavClass(dark);

  const pages = visiblePages(page, lastPage);

  return (
    <div className={`px-1 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm ${roomPageSubTextClass(dark)}`}>
      <span>Showing {total === 0 ? 0 : from}–{to} of {total} {itemLabel}</span>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className={`h-8 rounded-lg border text-xs px-2 ${dark ? "bg-brand-card-dark border-brand-border-dark text-gray-200" : "bg-brand-card-light border-brand-border-light"} ${roomCellTextClass(dark)}`}
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
              className={`w-8 h-8 rounded-lg text-xs font-medium ${roomPaginationPageClass(dark, page === item)}`}
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
