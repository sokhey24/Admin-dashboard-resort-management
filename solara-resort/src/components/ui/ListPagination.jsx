import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Client-side pagination for account lists (bookings, notifications).
 */
export function ListPagination({
  page,
  totalPages,
  total,
  startIndex,
  endIndex,
  onPageChange,
  language = 'en',
  className = '',
}) {
  if (totalPages <= 1 || total <= 0) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const rangeLabel =
    language === 'km'
      ? `${startIndex}–${endIndex} នៃ ${total}`
      : `${startIndex}–${endIndex} of ${total}`;

  const pageLabel =
    language === 'km' ? `ទំព័រ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`;

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border ${className}`}
      aria-label={language === 'km' ? 'ទំព័របញ្ជី' : 'List pagination'}
    >
      <p className="text-[11px] text-muted tabular-nums">{rangeLabel}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={prevDisabled}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-[var(--radius-button)] border border-border bg-surface text-text disabled:opacity-40 disabled:cursor-not-allowed hover:border-gold/40 cursor-pointer transition-colors"
          aria-label={language === 'km' ? 'ទំព័រមុន' : 'Previous page'}
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
          {language === 'km' ? 'មុន' : 'Previous'}
        </button>
        <span className="text-[11px] text-muted tabular-nums min-w-[5.5rem] text-center">{pageLabel}</span>
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-[var(--radius-button)] border border-border bg-surface text-text disabled:opacity-40 disabled:cursor-not-allowed hover:border-gold/40 cursor-pointer transition-colors"
          aria-label={language === 'km' ? 'ទំព័របន្ទាប់' : 'Next page'}
        >
          {language === 'km' ? 'បន្ទាប់' : 'Next'}
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
