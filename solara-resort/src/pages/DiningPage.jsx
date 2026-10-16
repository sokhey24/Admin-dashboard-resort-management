import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { DINING_PAGE_IMAGES, DINING_SPACE_GALLERY } from '../constants/diningPageImages.js';
import { useApp } from '../context/AppContext.jsx';
import {
  DINING_RESTAURANTS,
  DISH_CATEGORIES,
  DINING_POPULAR_PAGE_SIZE,
  popularDishes,
  DINING_RATING_SUMMARY,
} from '../data/diningData.js';
import { DiningHero } from '../components/dining/DiningHero.jsx';
import { DiningQuickFilters } from '../components/dining/DiningQuickFilters.jsx';
import { PopularDishes } from '../components/dining/PopularDishes.jsx';
import { RestaurantSpace } from '../components/dining/RestaurantSpace.jsx';
import { CustomerReviews } from '../components/dining/CustomerReviews.jsx';
import { ReservationCTA } from '../components/dining/ReservationCTA.jsx';

export const DiningPage = () => {
  const navigate = useNavigate();
  const { addToast, t, currency } = useApp();

  const [restaurantId, setRestaurantId] = useState(DINING_RESTAURANTS[0].id);
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

  const dishCategories = DISH_CATEGORIES.map((cat) => ({
    ...cat,
    label: t(`dining.category.${cat.id}`, cat.label),
  }));

  return (
    <div className="w-full bg-bg">
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

      <DiningQuickFilters
        restaurants={DINING_RESTAURANTS}
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
