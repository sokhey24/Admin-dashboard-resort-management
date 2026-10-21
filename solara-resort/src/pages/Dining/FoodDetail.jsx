import React from 'react';
import { Clock, Leaf, X } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { StarRatingDisplay } from '../../components/reviews/StarRating.jsx';
import { FavoriteButton } from '../../components/catalog/FavoriteButton.jsx';
import { formatCurrency } from '../../util/currency.js';

export function FoodDetail({
  dish,
  t,
  currency,
  onReserve,
  onBuyNow,
  onAddToCart,
  onView,
  onViewMenu,
  onClose,
  showClose = false,
  headingAs = 'h2',
}) {
  if (!dish) return null;

  const Title = headingAs;

  return (
    <div className="relative">
      {showClose && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-0 right-0 p-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-muted hover:text-text transition-colors cursor-pointer z-10"
          aria-label={t('dining.closeDishDetail', 'Close dish details')}
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        <div className="relative aspect-[4/3] lg:aspect-square rounded-[var(--radius-card)] overflow-hidden border border-border shadow-sm bg-slate-900">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          {dish.id && (
            <div className="absolute top-3.5 right-3.5 z-10">
              <FavoriteButton kind="dish" id={dish.id} size="lg" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <p className="text-[10px] uppercase tracking-wider text-gold font-medium">
            {t(`dining.category.${dish.category}`, dish.categoryLabel)}
          </p>
          <Title className="text-3xl sm:text-4xl font-serif font-bold text-text leading-tight pr-10">
            {dish.name}
          </Title>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-2xl font-semibold text-primary">
              {formatCurrency(dish.price, currency)}
            </span>
            {typeof dish.rating === 'number' && Number.isFinite(dish.rating) ? (
              <div className="flex items-center gap-2">
                <StarRatingDisplay value={Math.round(dish.rating)} size="lg" />
                <span className="text-sm text-muted">{dish.rating.toFixed(1)}</span>
              </div>
            ) : null}
          </div>
          <p className="text-sm text-text-secondary font-light leading-relaxed">
            {dish.longDescription}
          </p>

          {dish.dietary?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dish.dietary.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                >
                  <Leaf className="w-3 h-3" aria-hidden />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {dish.ingredients?.length > 0 ? (
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-5 space-y-3">
              <h3 className="text-sm font-serif font-bold text-text">
                {t('dining.ingredients', 'Ingredients')}
              </h3>
              <ul className="text-xs text-muted font-light space-y-1.5 list-disc list-inside">
                {dish.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {dish.chefNote && (
            <p className="text-xs text-muted font-light flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 text-gold mt-0.5" aria-hidden />
              <span>{dish.chefNote}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {onView && (
              <Button variant="outline" size="md" type="button" onClick={onView}>
                {t('dining.viewDish', 'View')}
              </Button>
            )}
            {(onAddToCart || onBuyNow || onReserve) && (
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={onAddToCart || onBuyNow || onReserve}
              >
                {onAddToCart
                  ? t('dining.addToCart', 'Add to Cart')
                  : t('dining.buyNow', 'Buy Now')}
              </Button>
            )}
            {onViewMenu && (
              <Button variant="outline" size="md" type="button" onClick={onViewMenu}>
                {t('dining.viewFullMenu', 'View Full Menu')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
