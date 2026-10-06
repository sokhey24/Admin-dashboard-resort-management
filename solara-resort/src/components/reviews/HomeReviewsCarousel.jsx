import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GuestReviewCard } from './GuestReviewCard.jsx';
import { paginateItems } from '../../util/paginateList.js';

const HOME_REVIEWS_PAGE_SIZE = 3;

export function HomeReviewsCarousel({ items, language, verifiedLabel, t }) {
  const [page, setPage] = useState(1);

  const list = Array.isArray(items) ? items : [];

  const pagination = useMemo(
    () => paginateItems(list, page, HOME_REVIEWS_PAGE_SIZE),
    [list, page]
  );

  useEffect(() => {
    setPage(1);
  }, [list.length]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  if (list.length === 0) return null;

  const prevDisabled = pagination.page <= 1;
  const nextDisabled = pagination.page >= pagination.totalPages;
  const showNav = pagination.totalPages > 1;

  const prevLabel = t?.('home.reviewsPrev', 'Previous reviews') ?? 'Previous reviews';
  const nextLabel = t?.('home.reviewsNext', 'Next reviews') ?? 'Next reviews';
  const pageLabel =
    language === 'km'
      ? `${pagination.page} / ${pagination.totalPages}`
      : `${pagination.page} / ${pagination.totalPages}`;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 sm:gap-4">
        {showNav && (
          <button
            type="button"
            disabled={prevDisabled}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="hidden sm:flex shrink-0 w-11 h-11 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm hover:border-gold/50 hover:text-gold disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text transition-colors cursor-pointer"
            aria-label={prevLabel}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>
        )}

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch auto-rows-fr">
          {pagination.items.map((entry) => (
            <GuestReviewCard
              key={entry.review.id ?? entry.key}
              review={entry.review}
              language={language}
              verifiedLabel={entry.verifiedLabel ?? verifiedLabel}
              variant="room"
            />
          ))}
        </div>

        {showNav && (
          <button
            type="button"
            disabled={nextDisabled}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="hidden sm:flex shrink-0 w-11 h-11 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm hover:border-gold/50 hover:text-gold disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text transition-colors cursor-pointer"
            aria-label={nextLabel}
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        )}
      </div>

      {showNav && (
        <div className="flex sm:hidden items-center justify-center gap-4 mt-6">
          <button
            type="button"
            disabled={prevDisabled}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-border bg-surface disabled:opacity-35 cursor-pointer"
            aria-label={prevLabel}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[11px] text-muted tabular-nums min-w-[4rem] text-center">{pageLabel}</span>
          <button
            type="button"
            disabled={nextDisabled}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-border bg-surface disabled:opacity-35 cursor-pointer"
            aria-label={nextLabel}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {showNav && (
        <p className="hidden sm:block text-center text-[11px] text-muted tabular-nums mt-6">
          {language === 'km'
            ? `ទំព័រ ${pagination.page} នៃ ${pagination.totalPages}`
            : `Page ${pagination.page} of ${pagination.totalPages}`}
        </p>
      )}
    </div>
  );
}
