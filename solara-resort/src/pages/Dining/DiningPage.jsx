import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { DINING_PAGE_IMAGES, DINING_SPACE_GALLERY } from '../../constants/diningPageImages.js';
import { useApp } from '../../context/AppContext.jsx';
import {
  DINING_RESTAURANTS,
  DISH_CATEGORIES,
  DINING_POPULAR_PAGE_SIZE,
  popularDishes,
  DINING_RATING_SUMMARY,
} from '../../data/diningData.js';
import { DiningHero } from '../../components/dining/DiningHero.jsx';
import { DiningQuickFilters } from '../../components/dining/DiningQuickFilters.jsx';
import { PopularDishes } from '../../components/dining/PopularDishes.jsx';
import { RestaurantSpace } from '../../components/dining/RestaurantSpace.jsx';
import { CustomerReviews } from '../../components/dining/CustomerReviews.jsx';
import { ReservationCTA } from '../../components/dining/ReservationCTA.jsx';
import { CardlistSummaryOrder } from './CardlistSummaryOrder.jsx';
import { useDiningCart } from './useDiningCart.js';
import { useDiningCheckout } from '../../hooks/useDiningCheckout.js';
import { useWebsiteContent } from '../../hooks/useWebsiteContent.js';
import { pickMarketingList } from '../../util/marketingContent.js';
import { resolveActivityImage } from '../../util/media.js';

export const DiningPage = () => {
  const navigate = useNavigate();
  const { addToast, t, currency, user, bookings, localize } = useApp();
  const { diningVenues: cmsVenues, loading: cmsLoading } = useWebsiteContent();

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

  const cmsVenueList = useMemo(
    () => pickMarketingList(cmsVenues, cmsLoading, []),
    [cmsVenues, cmsLoading]
  );

  const venueCatalog = useMemo(() => {
    const cms = cmsVenueList;
    if (cms.length > 0) {
      return cms.map((v) => {
        const item = localize ? localize(v) : v;
        return {
          id: v.id,
          label: item.name || v.name,
          image: resolveActivityImage(v.image) || v.image,
          cuisine: item.cuisine,
          description: item.description,
          hours: item.hours,
          priceLevel: v.priceLevel,
        };
      });
    }
    return DINING_RESTAURANTS.map((r) => ({ ...r, image: null, cuisine: '', description: '', hours: '', priceLevel: '' }));
  }, [cmsVenueList, localize]);

  const [restaurantId, setRestaurantId] = useState(DINING_RESTAURANTS[0].id);

  useEffect(() => {
    if (venueCatalog.length > 0 && !venueCatalog.some((v) => v.id === restaurantId)) {
      setRestaurantId(venueCatalog[0].id);
    }
  }, [venueCatalog, restaurantId]);
  const [lunchTime, setLunchTime] = useState('12:00');
  const [dinnerTime, setDinnerTime] = useState('19:30');

  const scrollToId = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (window.location.hash === '#table-reservation') {
      scrollToId('table-reservation');
    }
  }, [scrollToId]);

  const handleAddToCart = useCallback(
    (dishId) => {
      const added = addToCart(dishId);
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

  const dishCategories = DISH_CATEGORIES.map((cat) => ({
    ...cat,
    label: t(`dining.category.${cat.id}`, cat.label),
  }));

  return (
    <div className="w-full bg-bg relative">
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

      <DiningHero
        image={DINING_PAGE_IMAGES.hero}
        eyebrow={t('dining.heroEyebrow', 'DINING AT SOLARA')}
        title={t(
          'dining.heroTitle',
          'Mark the season and Khmer classics, explore the way Cambodia eats.'
        )}
        bookLabel={t('dining.bookTable', 'Book a table')}
        menuLabel={t('dining.viewMenu', 'View the menu')}
        onBookTable={() => scrollToId('table-reservation')}
        onViewMenu={() => navigate(ROUTES.menuList)}
      />

      {cmsVenueList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
              {t('home.diningTag', 'Epicurean Artistry')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text">
              {t('home.diningVenuesTitle', 'Our Restaurants & Lounges')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {venueCatalog.map((venue) => (
              <article
                key={venue.id}
                className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden flex flex-col"
              >
                {venue.image && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    <img
                      src={venue.image}
                      alt={venue.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    {venue.cuisine && (
                      <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider text-gold-light bg-slate-950/80 px-2 py-1 rounded">
                        {venue.cuisine}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-serif font-semibold text-text group-hover:text-gold transition-colors">
                    {venue.label}
                  </h3>
                  {venue.description && (
                    <p className="text-[11px] text-muted line-clamp-3 leading-relaxed">{venue.description}</p>
                  )}
                  <div className="mt-auto pt-2 flex justify-between text-[11px] text-muted border-t border-border">
                    <span>{venue.hours}</span>
                    {venue.priceLevel && <span className="text-gold font-semibold">{venue.priceLevel}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <DiningQuickFilters
        restaurants={venueCatalog.map((v) => ({ id: v.id, label: v.label }))}
        restaurantId={restaurantId}
        lunchTime={lunchTime}
        dinnerTime={dinnerTime}
        onRestaurantChange={setRestaurantId}
        onLunchTimeChange={setLunchTime}
        onDinnerTimeChange={setDinnerTime}
        restaurantLabel={t('dining.quickRestaurant', 'Restaurant')}
        lunchLabel={t('dining.lunchTitle', 'Lunch')}
        dinnerLabel={t('dining.dinnerTitle', 'Dinner')}
      />

      <PopularDishes
        dishes={popularDishes}
        categories={dishCategories}
        currency={currency}
        t={t}
        pageSize={DINING_POPULAR_PAGE_SIZE}
        onReserve={() => scrollToId('table-reservation')}
        onAddToCart={handleAddToCart}
      />

      <RestaurantSpace
        photos={DINING_SPACE_GALLERY}
        eyebrow={t('dining.spaceEyebrow', 'Ambiance')}
        title={t('dining.theSpace', 'The space')}
        subtitle={t(
          'dining.theSpaceDesc',
          'Open-air pavilions, teak terraces, and candlelit salons framed by ocean breeze and tropical gardens.'
        )}
      />

      <CustomerReviews summary={DINING_RATING_SUMMARY} t={t} />

      <ReservationCTA t={t} addToast={addToast} />

      <div className="pb-24" />
    </div>
  );
};
