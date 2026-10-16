import React from 'react';
import { ChevronRight } from 'lucide-react';
import { StarRatingDisplay } from '../reviews/StarRating.jsx';
import { formatCurrency } from '../../util/currency.js';

export function DishCard({ dish, currency, categoryLabel, actionLabel, onAction, onOpen }) {
  const handleOpen = () => {
    if (onOpen) onOpen();
  };

  return (
    <article className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:border-gold/25 transition-colors flex flex-col h-full">
      <button
        type="button"
        onClick={handleOpen}
        disabled={!onOpen}
        className={`relative aspect-[4/3] bg-slate-100 overflow-hidden shrink-0 w-full text-left ${onOpen ? 'cursor-pointer' : 'cursor-default'
          }`}
      >
        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
      </button>
      <div className="p-5 flex flex-col flex-1 gap-2">
        {categoryLabel && (
          <p className="text-[10px] uppercase tracking-wider text-gold font-medium">{categoryLabel}</p>
        )}
        <div className="flex items-start justify-between gap-2">
          {onOpen ? (
            <button
              type="button"
              onClick={handleOpen}
              className="text-base font-serif font-bold text-text leading-snug text-left hover:text-primary transition-colors cursor-pointer"
            >
              {dish.name}
            </button>
          ) : (
            <h3 className="text-base font-serif font-bold text-text leading-snug">{dish.name}</h3>
          )}
          <span className="text-sm font-semibold text-primary shrink-0">{formatCurrency(dish.price, currency)}</span>
        </div>
        <div className="flex items-center gap-2">
          <StarRatingDisplay value={Math.round(dish.rating)} size="sm" />
          <span className="text-[11px] text-muted">{dish.rating.toFixed(1)}</span>
        </div>
        <p className="text-xs text-muted font-light line-clamp-3 flex-1">{dish.description}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          {actionLabel}
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
        </button>
      </div>
    </article>
  );
}
