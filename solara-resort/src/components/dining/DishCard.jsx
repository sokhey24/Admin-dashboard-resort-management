import React from 'react';
import { Button } from '../ui/Button.jsx';
import { StarRatingDisplay } from '../reviews/StarRating.jsx';
import { FavoriteButton } from '../catalog/FavoriteButton.jsx';
import { formatCurrency } from '../../util/currency.js';

export function DishCard({
  dish,
  currency,
  categoryLabel,
  viewLabel = 'View',
  buyNowLabel = 'Buy Now',
  addToCartLabel = 'Add to Cart',
  onView,
  onAddToCart,
  onBuyNow,
  /** @deprecated use onView / onBuyNow */
  actionLabel,
  onAction,
  onOpen,
}) {
  const handleView = () => {
    if (onView) onView();
    else if (onOpen) onOpen();
    else if (onAction && actionLabel) onAction();
  };

  const handleSecondary = (e) => {
    e.stopPropagation();
    if (onAddToCart) onAddToCart();
    else if (onBuyNow) onBuyNow();
    else if (onAction) onAction();
  };

  const secondaryLabel = onAddToCart ? addToCartLabel : buyNowLabel;

  return (
    <article className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:border-gold/25 transition-colors flex flex-col h-full">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden shrink-0 w-full">
        <button
          type="button"
          onClick={handleView}
          disabled={!onView && !onOpen && !onAction}
          className={`relative block w-full h-full text-left ${
            onView || onOpen || onAction ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
        </button>
        {dish.id && (
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton kind="dish" id={dish.id} size="sm" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 gap-2">
        {categoryLabel && (
          <p className="text-[10px] uppercase tracking-wider text-gold font-medium">{categoryLabel}</p>
        )}
        <div className="flex items-start justify-between gap-2">
          {onView || onOpen ? (
            <button
              type="button"
              onClick={handleView}
              className="text-base font-serif font-bold text-text leading-snug text-left hover:text-primary transition-colors cursor-pointer"
            >
              {dish.name}
            </button>
          ) : (
            <h3 className="text-base font-serif font-bold text-text leading-snug">{dish.name}</h3>
          )}
          <span className="text-sm font-semibold text-primary shrink-0">
            {formatCurrency(dish.price, currency)}
          </span>
        </div>
        {typeof dish.rating === 'number' && Number.isFinite(dish.rating) ? (
          <div className="flex items-center gap-2">
            <StarRatingDisplay value={Math.round(dish.rating)} size="sm" />
            <span className="text-[11px] text-muted">{dish.rating.toFixed(1)}</span>
          </div>
        ) : null}
        <p className="text-xs text-muted font-light line-clamp-3 flex-1">{dish.description}</p>
        <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-border">
          <Button variant="outline" size="sm" type="button" className="flex-1" onClick={handleView}>
            {viewLabel}
          </Button>
          <Button variant="primary" size="sm" type="button" className="flex-1" onClick={handleSecondary}>
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
