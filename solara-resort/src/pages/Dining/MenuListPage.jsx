import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { DINING_PAGE_IMAGES } from '../../constants/diningPageImages.js';
import { ROUTES } from '../../config/routes.js';
import { DishCard } from '../../components/dining/DishCard.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ListPagination } from '../../components/ui/ListPagination.jsx';
import { paginateItems } from '../../util/paginateList.js';
import { CardlistSummaryOrder } from './CardlistSummaryOrder.jsx';
import { useDiningCart } from './useDiningCart.js';
import { useDiningMenu } from '../../hooks/useDiningMenu.js';
import { useDiningCheckout } from '../../hooks/useDiningCheckout.js';

const MENU_LIST_PAGE_SIZE = 8;

/** Full Menu — `/dining/menu` */
export const MenuListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, currency, addToast, language, user, bookings } = useApp();
  const [listPage, setListPage] = useState(1);

  const {
    items: cartItems,
    addToCart,
    increment,
    decrement,
    removeItem,
    clearCart,
    total: cartTotal,
    totalCount,
  } = useDiningCart();

  const { categories: apiCategories, menuItems, loading, error, reload } = useDiningMenu();

  const categories = useMemo(
    () => [
      { id: 'all', label: t('dining.category.all', 'All') },
      ...apiCategories.map((cat) => ({
        id: String(cat.id),
        label: cat.name,
      })),
    ],
    [apiCategories, t]
  );

  const initialCategory = searchParams.get('category') || 'all';
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    const known = categories.some((c) => c.id === activeCategory);
    if (!known) setActiveCategory('all');
  }, [categories, activeCategory]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return menuItems;
    return menuItems.filter((d) => d.category === activeCategory);
  }, [activeCategory, menuItems]);

  const menuPagination = useMemo(
    () => paginateItems(filtered, listPage, MENU_LIST_PAGE_SIZE),
    [filtered, listPage]
  );

  useEffect(() => {
    if (listPage > menuPagination.totalPages) {
      setListPage(menuPagination.totalPages);
    }
  }, [listPage, menuPagination.totalPages]);

  const categoryLabelFor = (categoryId) => {
    const cat = categories.find((c) => c.id === String(categoryId));
    return cat?.label ?? categoryId;
  };

  const setCategory = (id) => {
    setActiveCategory(id);
    setListPage(1);
    if (id === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: id });
    }
  };

  const handleAddToCart = useCallback(
    (dish) => {
      const added = addToCart(dish);
      if (added) {
        addToast?.(t('dining.addedToCart', 'Added to your order'), 'success');
      }
    },
    [addToCart, addToast, t]
  );

  const { checkoutLoading, handleCheckoutConfirm, activeBooking } = useDiningCheckout({
    cartItems,
    clearCart,
    addToast,
    t,
    user,
    bookings,
  });

  const menuGallery = [
    { src: DINING_PAGE_IMAGES.wokBeefChili, alt: 'Wok-seared beef with chili and herbs' },
    { src: DINING_PAGE_IMAGES.thaiRedCurry, alt: 'Thai red curry with coconut and basil' },
    { src: DINING_PAGE_IMAGES.goldenHerbSoup, alt: 'Golden herb broth' },
    { src: DINING_PAGE_IMAGES.savoryCongee, alt: 'Savory rice porridge with greens' },
    { src: DINING_PAGE_IMAGES.latteArt, alt: 'Artisan latte' },
    { src: DINING_PAGE_IMAGES.tropicalBlueCocktail, alt: 'Tropical blue refreshment' },
  ];

  return (
    <div className="w-full bg-bg pb-24 pt-24 sm:pt-28 relative">
      <CardlistSummaryOrder
        items={cartItems}
        currency={currency}
        t={t}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={removeItem}
        onCheckoutConfirm={handleCheckoutConfirm}
        onCartClear={clearCart}
        checkoutLoading={checkoutLoading}
        canChargeToRoom={Boolean(activeBooking)}
        total={cartTotal}
        totalCount={totalCount}
      />

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

        {loading ? (
          <p className="text-sm text-muted text-center py-16">{t('dining.menuLoading', 'Loading menu…')}</p>
        ) : error ? (
          <ErrorState
            title={t('dining.menuLoadError', 'Unable to load menu')}
            message={error}
            onRetry={reload}
            retryText={t('common.tryAgain', 'Try again')}
          />
        ) : menuItems.length === 0 ? (
          <EmptyState
            title={t('dining.menuEmptyTitle', 'Menu coming soon')}
            description={t(
              'dining.menuEmptyDesc',
              'Our culinary team is finalizing the menu. Check back shortly for seasonal dishes and chef specials.'
            )}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t('dining.categoryEmptyTitle', 'No dishes in this category')}
            description={t('dining.categoryEmptyDesc', 'Try another category or view the full menu.')}
          />
        ) : (
          <div id="menu-list-grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {menuPagination.items.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  currency={currency}
                  categoryLabel={categoryLabelFor(dish.category)}
                  viewLabel={t('dining.viewDish', 'View')}
                  addToCartLabel={t('dining.addToCart', 'Add to Cart')}
                  onView={() => navigate(ROUTES.menuDetail(dish.id))}
                  onAddToCart={() => handleAddToCart(dish)}
                />
              ))}
            </div>
            {menuPagination.showPagination && (
              <ListPagination
                className="mt-8"
                page={menuPagination.page}
                totalPages={menuPagination.totalPages}
                total={menuPagination.total}
                startIndex={menuPagination.startIndex}
                endIndex={menuPagination.endIndex}
                language={language}
                onPageChange={(nextPage) => {
                  setListPage(nextPage);
                  document.getElementById('menu-list-grid')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              />
            )}
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
