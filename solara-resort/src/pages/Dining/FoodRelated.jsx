import React, { useEffect, useMemo, useState } from 'react';
import { getMenuItemById } from '../../data/diningData.js';
import { formatCurrency } from '../../util/currency.js';
import { paginateItems } from '../../util/paginateList.js';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';

const DEFAULT_PAGE_SIZE = 4;

/**
 * Same-category dishes first, then other menu items (excluding current).
 */
export function getRelatedFoodItems(currentDish, allDishes) {
  if (!currentDish || !allDishes?.length) return [];

  const sameCategory = allDishes.filter(
    (item) => item.category === currentDish.category && item.id !== currentDish.id
  );
  const other = allDishes.filter(
    (item) => item.category !== currentDish.category && item.id !== currentDish.id
  );

  return [...sameCategory, ...other];
}

function RelatedFoodCard({
  full,
  currency,
  t,
  viewLabel,
  buyNowLabel,
  addToCartLabel,
  onSelectDish,
  onBuyNow,
  onAddToCart,
}) {
  const viewLabelText = viewLabel ?? t('dining.viewDish', 'View');
  const secondaryLabelText = onAddToCart
    ? (addToCartLabel ?? t('dining.addToCart', 'Add to Cart'))
    : (buyNowLabel ?? t('dining.buyNow', 'Buy Now'));

  return (
    <article
      className="group flex flex-col bg-surface border border-border rounded-[var(--radius-card)] p-3 sm:p-4 hover:border-gold/30 transition-colors h-full"
    >
      <img
        src={full.image}
        alt={full.name}
        className="w-full h-36 rounded-lg object-cover shrink-0"
        loading="lazy"
      />
      <div className="min-w-0 flex-1 flex flex-col pt-3">
        <p className="text-[10px] uppercase tracking-wider text-gold font-medium truncate">
          {t(`dining.category.${full.category}`, full.categoryLabel || full.category)}
        </p>
        <p className="text-sm font-serif font-bold text-text group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
          {full.name}
        </p>
        <p className="text-xs text-muted font-light line-clamp-2 mt-1 flex-1">
          {full.description}
        </p>
        <p className="text-xs text-primary font-semibold mt-2">
          {formatCurrency(full.price, currency)}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="flex-1"
            onClick={() => onSelectDish?.(full.id)}
          >
            {viewLabelText}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            className="flex-1"
            onClick={() =>
              onAddToCart ? onAddToCart(full.id) : onBuyNow?.(full.id)
            }
          >
            {secondaryLabelText}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function FoodRelated({
  currentDish,
  dishes,
  currency,
  t,
  pageSize = DEFAULT_PAGE_SIZE,
  onSelectDish,
  onBuyNow,
  onAddToCart,
  viewLabel,
  buyNowLabel,
  addToCartLabel,
}) {
  const [page, setPage] = useState(1);

  const related = useMemo(
    () => getRelatedFoodItems(currentDish, dishes),
    [currentDish, dishes]
  );

  useEffect(() => {
    setPage(1);
  }, [currentDish?.id]);

  const pagination = useMemo(
    () => paginateItems(related, page, pageSize),
    [related, page, pageSize]
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  if (!currentDish || related.length === 0) {
    return null;
  }

  const sameCategoryCount = related.filter((item) => item.category === currentDish.category).length;
  const title =
    sameCategoryCount > 0
      ? t('dining.moreFromCategory', 'More from this category')
      : t('dining.otherDishes', 'You may also like');

  const visible = pagination.items;

  return (
    <section className="mt-16 sm:mt-20 border-t border-border pt-12" aria-labelledby="food-related-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <h2 id="food-related-heading" className="text-xl sm:text-2xl font-serif font-bold text-text">
          {title}
        </h2>
        {pagination.total > 0 && (
          <p className="text-xs text-muted tabular-nums">
            {`Showing ${pagination.startIndex}–${pagination.endIndex} of ${pagination.total} dishes`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visible.map((item) => {
          const full = item.price != null ? item : (getMenuItemById(item.id) ?? item);
          return (
            <RelatedFoodCard
              key={item.id}
              full={full}
              currency={currency}
              t={t}
              viewLabel={viewLabel}
              buyNowLabel={buyNowLabel}
              addToCartLabel={addToCartLabel}
              onSelectDish={onSelectDish}
              onBuyNow={onBuyNow}
              onAddToCart={onAddToCart}
            />
          );
        })}
      </div>

      {pagination.showPagination && (
        <Pagination
          className="mt-10"
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
