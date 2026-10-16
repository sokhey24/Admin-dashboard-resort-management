import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { DISH_CATEGORIES, popularDishes } from '../data/diningData.js';
import { DINING_PAGE_IMAGES } from '../constants/diningPageImages.js';
import { ROUTES } from '../config/routes.js';
import { DishCard } from '../components/dining/DishCard.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';

export const MenuListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, currency } = useApp();

  const initialCategory = searchParams.get('category') || 'all';
  const [activeCategory, setActiveCategory] = useState(
    DISH_CATEGORIES.some((c) => c.id === initialCategory) ? initialCategory : 'all'
  );

  const categories = DISH_CATEGORIES.map((cat) => ({
    ...cat,
    label: t(`dining.category.${cat.id}`, cat.label),
  }));

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return popularDishes;
    return popularDishes.filter((d) => d.category === activeCategory);
  }, [activeCategory]);

  const categoryLabelFor = (categoryId) => {
    const cat = DISH_CATEGORIES.find((c) => c.id === categoryId);
    return t(`dining.category.${categoryId}`, cat?.label ?? categoryId);
  };

  const setCategory = (id) => {
    setActiveCategory(id);
    if (id === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: id });
    }
  };

  const menuGallery = [
    { src: DINING_PAGE_IMAGES.wokBeefChili, alt: 'Wok-seared beef with chili and herbs' },
    { src: DINING_PAGE_IMAGES.thaiRedCurry, alt: 'Thai red curry with coconut and basil' },
    { src: DINING_PAGE_IMAGES.goldenHerbSoup, alt: 'Golden herb broth' },
    { src: DINING_PAGE_IMAGES.savoryCongee, alt: 'Savory rice porridge with greens' },
    { src: DINING_PAGE_IMAGES.latteArt, alt: 'Artisan latte' },
    { src: DINING_PAGE_IMAGES.tropicalBlueCocktail, alt: 'Tropical blue refreshment' },
  ];

  return (
    <div className="w-full bg-bg pb-24 pt-24 sm:pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-10 rounded-2xl overflow-hidden border border-border shadow-sm">
          {menuGallery.map((photo) => (
            <div key={photo.alt} className="aspect-[4/3] sm:aspect-square overflow-hidden bg-surface">
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="mb-10">
          <button
            type="button"
            onClick={() => navigate(ROUTES.dining)}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-primary transition-colors cursor-pointer mb-6"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t('dining.backToDining', 'Back to Dining')}
          </button>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text mb-3">
            {t('dining.fullMenuTitle', 'Full Menu')}
          </h1>
          <p className="text-sm text-muted font-light max-w-2xl leading-relaxed">
            {t(
              'dining.fullMenuDesc',
              'Browse every dish across our restaurants—filter by cuisine, then open a plate for ingredients and chef notes.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-[var(--radius-button)] text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={t('dining.categoryEmptyTitle', 'No dishes in this category')}
            description={t('dining.categoryEmptyDesc', 'Try another category or view the full menu.')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {filtered.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                currency={currency}
                categoryLabel={categoryLabelFor(dish.category)}
                actionLabel={t('dining.viewDish', 'View dish')}
                onAction={() => navigate(ROUTES.menuDetail(dish.id))}
                onOpen={() => navigate(ROUTES.menuDetail(dish.id))}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to={ROUTES.dining}>
            <Button variant="outline" size="md">
              {t('dining.bookTable', 'Book a table')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
