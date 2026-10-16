import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Leaf } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getMenuItemById, popularDishes } from '../data/diningData.js';
import { ROUTES } from '../config/routes.js';
import { Button } from '../components/ui/Button.jsx';
import { StarRatingDisplay } from '../components/reviews/StarRating.jsx';
import { formatCurrency } from '../util/currency.js';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const MenuDetailPage = () => {
  const { dishId } = useParams();
  const navigate = useNavigate();
  const { t, currency } = useApp();

  const dish = getMenuItemById(dishId);

  if (!dish) {
    return (
      <div className="w-full bg-bg pb-24 pt-28 max-w-3xl mx-auto px-4">
        <EmptyState
          title={t('dining.dishNotFoundTitle', 'Dish not found')}
          description={t('dining.dishNotFoundDesc', 'This menu item may have been removed or the link is incorrect.')}
        />
        <div className="text-center mt-8">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.menuList)}>
            {t('dining.backToMenu', 'Back to menu')}
          </Button>
        </div>
      </div>
    );
  }

  const related = popularDishes
    .filter((item) => item.category === dish.category && item.id !== dish.id)
    .slice(0, 3);

  const goReserve = () => {
    navigate(`${ROUTES.dining}#table-reservation`);
  };

  return (
    <div className="w-full bg-bg pb-24">
      <div className="pt-24 sm:pt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(ROUTES.menuList)}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-primary transition-colors cursor-pointer mb-8"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {t('dining.backToMenu', 'Back to menu')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="relative aspect-[4/3] lg:aspect-square rounded-[var(--radius-card)] overflow-hidden border border-border shadow-sm bg-slate-100">
            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium">
              {t(`dining.category.${dish.category}`, dish.categoryLabel)}
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text leading-tight">{dish.name}</h1>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-2xl font-semibold text-primary">{formatCurrency(dish.price, currency)}</span>
              <div className="flex items-center gap-2">
                <StarRatingDisplay value={Math.round(dish.rating)} size="lg" />
                <span className="text-sm text-muted">{dish.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary font-light leading-relaxed">{dish.longDescription}</p>

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

            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-5 space-y-3">
              <h2 className="text-sm font-serif font-bold text-text">{t('dining.ingredients', 'Ingredients')}</h2>
              <ul className="text-xs text-muted font-light space-y-1.5 list-disc list-inside">
                {dish.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted font-light flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 text-gold mt-0.5" aria-hidden />
              <span>{dish.chefNote}</span>
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="primary" size="md" onClick={goReserve}>
                {t('dining.reserveToEnjoy', 'Reserve to Dine')}
              </Button>
              <Button variant="outline" size="md" onClick={() => navigate(ROUTES.menuList)}>
                {t('dining.viewFullMenu', 'View Full Menu')}
              </Button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 sm:mt-20 border-t border-border pt-12">
            <h2 className="text-xl font-serif font-bold text-text mb-6">
              {t('dining.moreFromCategory', 'More from this category')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={ROUTES.menuDetail(item.id)}
                  className="group flex gap-4 bg-surface border border-border rounded-[var(--radius-card)] p-3 hover:border-gold/30 transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-serif font-bold text-text group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-primary font-semibold mt-1">{formatCurrency(item.price, currency)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
