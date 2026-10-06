/** Default page size for account reservation and alert lists. */
export const ACCOUNT_LIST_PAGE_SIZE = 5;

export function paginateItems(items, page, pageSize = ACCOUNT_LIST_PAGE_SIZE) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: list.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    pageSize,
    startIndex: total === 0 ? 0 : start + 1,
    endIndex: Math.min(start + pageSize, total),
    showPagination: total > pageSize,
  };
}
