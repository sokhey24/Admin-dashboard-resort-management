import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button.jsx';
import { DishCard } from './DishCard.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { ROUTES } from '../../config/routes.js';
import { DINING_POPULAR_PAGE_SIZE, getCategoryLabel } from '../../data/diningData.js';
import { paginateItems } from '../../util/paginateList.js';

export function PopularDishes({
  dishes,
  categories,
  currency,
  t,
  onReserve,
  pageSize = DINING_POPULAR_PAGE_SIZE,
}) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return dishes;
    return dishes.filter((d) => d.category === activeCategory);
  }, [dishes, activeCategory]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  const pagination = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  const visible = pagination.items;

  const goToFullMenu = () => {
    if (activeCategory === 'all') {
      navigate(ROUTES.menuList);
    } else {
      navigate(`${ROUTES.menuList}?category=${activeCategory}`);
    }
  };

  const goToDish = (dishId) => {
    navigate(ROUTES.menuDetail(dishId));
  };

  return (
    <section id="dining-menu" className="py-16 sm:py-20 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <h2 className="text-3xl font-serif font-bold text-text">
            {t('dining.popularDishes', 'Popular Dishes')}
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">
            {t(
              'dining.popularDishesDesc',
              'Seasonal highlights from our live kitchen—filter by category to explore the way Cambodia eats.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-[var(--radius-button)] text-xs font-medium transition-colors cursor-pointer ${activeCategory === cat.id
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title={t('dining.categoryEmptyTitle', 'No dishes in this category')}
            description={t('dining.categoryEmptyDesc', 'Try another category or view the full menu.')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {visible.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                currency={currency}
                categoryLabel={getCategoryLabel(dish.category)}
                actionLabel={t('dining.reserveToEnjoy', 'Reserve to Dine')}
                onAction={onReserve}
                onOpen={() => goToDish(dish.id)}
              />
            ))}
          </div>
        )}

        {pagination.showPagination && (
          <Pagination
            className="mt-10"
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}

        {filtered.length > pageSize && (
          <div className="text-center mt-10">
            <Button variant="outline" size="md" onClick={goToFullMenu}>
              {t('dining.viewFullMenu', 'View Full Menu')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
