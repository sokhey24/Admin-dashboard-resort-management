import React from 'react';
import { StarRatingDisplay } from './StarRating.jsx';

function formatReviewMonth(value, language) {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function GuestReviewCard({ review, language, verifiedLabel, variant = 'banner' }) {
  if (!review) return null;

  const dateLabel = formatReviewMonth(review.createdAt, language);
  const metaLine = [review.guestName, dateLabel].filter(Boolean).join(' · ');
  const subtitleLine =
    review.roomLabel || review.locationLabel || review.stayMeta || '';

  if (variant === 'room') {
    return (
      <article
        className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full w-full"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 shrink-0 w-full">
          <img
            src={review.avatar}
            alt={review.guestName}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          {verifiedLabel && (
            <div className="absolute top-3.5 left-3.5 bg-slate-950/80 backdrop-blur-md text-gold-light border border-gold/30 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded">
              {verifiedLabel}
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-xs text-slate-100 font-semibold truncate">{review.guestName}</p>
            {dateLabel && (
              <p className="text-[10px] text-slate-300 font-light truncate">{dateLabel}</p>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0 gap-3">
          <StarRatingDisplay value={review.rating} size="md" />
          {review.title && (
            <h3 className="text-lg font-semibold font-serif text-text group-hover:text-gold transition-colors tracking-tight line-clamp-2 leading-snug">
              &ldquo;{review.title}&rdquo;
            </h3>
          )}
          {review.comment && (
            <p className="text-xs text-muted line-clamp-3 leading-relaxed flex-1">
              &ldquo;{review.comment}&rdquo;
            </p>
          )}
          {(subtitleLine || review.locationLabel) && (
            <div className="pt-3 mt-auto border-t border-border/60 text-[11px] text-muted space-y-0.5">
              {subtitleLine && <p className="line-clamp-1">{subtitleLine}</p>}
              {review.locationLabel && review.roomLabel && (
                <p className="text-gold/90 line-clamp-1">{review.locationLabel}</p>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className="relative rounded-[var(--radius-modal)] overflow-hidden border border-gold/40 bg-gradient-to-r from-slate-950 via-surface to-slate-950 shadow-xl hover:border-gold/60 transition-colors"
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex-1 p-8 sm:p-10 text-left space-y-4 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StarRatingDisplay value={review.rating} size="lg" />
            {verifiedLabel && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">
                {verifiedLabel}
              </span>
            )}
          </div>

          {review.title && (
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-text dark:text-white tracking-tight leading-snug">
              &ldquo;{review.title}&rdquo;
            </h3>
          )}

          {review.comment && (
            <p className="text-xs sm:text-sm text-muted dark:text-slate-300 leading-relaxed font-light line-clamp-4 sm:line-clamp-3">
              &ldquo;{review.comment}&rdquo;
            </p>
          )}

          <div className="pt-2 space-y-1 border-t border-border/60 dark:border-white/10">
            {metaLine && (
              <p className="text-xs font-semibold text-text dark:text-white">{metaLine}</p>
            )}
            {subtitleLine && (
              <p className="text-[11px] text-muted dark:text-slate-400 leading-relaxed">{subtitleLine}</p>
            )}
            {review.locationLabel && review.roomLabel && (
              <p className="text-[11px] text-gold/90">{review.locationLabel}</p>
            )}
          </div>
        </div>

        <div className="relative w-full lg:w-56 xl:w-64 shrink-0 min-h-[140px] lg:min-h-0 border-t lg:border-t-0 lg:border-l border-gold/20">
          <img
            src={review.avatar}
            alt={review.guestName}
            className="absolute inset-0 w-full h-full object-cover opacity-90 lg:opacity-100"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </article>
  );
}
