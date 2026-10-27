import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Waves,
  Shield,
  Clock,
  Award
} from 'lucide-react';
import { HeroSection } from '../../components/ui/HeroSection.jsx';
import { SearchWidget } from '../../features/search/components/SearchWidget.jsx';
import { BranchCard } from '../../components/branch/BranchCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useBranches, useBranchDetail } from '../../hooks/useCatalog.js';
import { useWebsiteContent } from '../../hooks/useWebsiteContent.js';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { ResortCardSkeleton, RoomCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { useGuestReviews } from '../../hooks/useGuestReviews.js';
import { HomeReviewsCarousel } from '../../components/reviews/HomeReviewsCarousel.jsx';
import { StarRatingDisplay } from '../../components/reviews/StarRating.jsx';
import heroImage from '../../assets/images/hero_solara_resort_1790692958491.jpg';
import { RevealOnScroll } from '../../components/motion/RevealOnScroll.jsx';
import { StaggerItem } from '../../components/motion/StaggerItem.jsx';
import { ROUTES } from '../../config/routes.js';
import { PopularDishes } from '../../components/dining/PopularDishes.jsx';
import {
  DISH_CATEGORIES,
  DINING_POPULAR_PAGE_SIZE,
  popularDishes,
} from '../../data/diningData.js';
import { MainsolaraResort } from './MainsolaraResort.jsx';
import Activity_home from '../../Feature_Activity_home/Activity_home.jsx';
import { CardlistSummaryOrder } from '../Dining/CardlistSummaryOrder.jsx';
import { useDiningCart } from '../Dining/useDiningCart.js';

/** Sanctuary regions for homepage grouping (Part A). */
const SANCTUARY_REGIONS = [
  {
    key: 'siem-reap',
    labelKey: 'home.sanctuaries.regionSiemReap',
    defaultLabel: 'Siem Reap',
    match: (haystack) => /siem|angkor/i.test(haystack),
  },
  {
    key: 'kampot',
    labelKey: 'home.sanctuaries.regionKampot',
    defaultLabel: 'Kampot',
    match: (haystack) => /kampot|bokor/i.test(haystack),
  },
  {
    key: 'kep',
    labelKey: 'home.sanctuaries.regionKep',
    defaultLabel: 'Kep',
    match: (haystack) => /\bkep\b/i.test(haystack),
  },
  {
    key: 'koh-rong',
    labelKey: 'home.sanctuaries.regionKohRong',
    defaultLabel: 'Koh Rong',
    match: (haystack) => /rong|sihanouk|island|beach/i.test(haystack),
  },
];

function branchRegionHaystack(branch) {
  return [branch?.destination, branch?.city, branch?.province, branch?.name, branch?.address]
    .filter(Boolean)
    .join(' ');
}

function resolveBranchRegionKey(branch) {
  const haystack = branchRegionHaystack(branch);
  const region = SANCTUARY_REGIONS.find((r) => r.match(haystack));
  return region?.key ?? null;
}

export const HomePage = () => {
  const navigate = useNavigate();
  const { currency, t, localize, language, addToast } = useApp();

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

  const handleDiningAddToCart = useCallback(
    (dishId) => {
      const added = addToCart(dishId);
      if (added) {
        addToast?.(t('dining.addedToCart', 'Added to your order'), 'success');
      }
    },
    [addToCart, addToast, t]
  );

  const handleDiningCheckoutConfirm = useCallback(
    ({ paymentMethod } = {}) => {
      clearCart();
      if (paymentMethod === 'khqr') {
        addToast?.(
          t(
            'dining.orderConfirmedKhqr',
            'QR payment noted — complete your table reservation on the dining page.'
          ),
          'success'
        );
      } else {
        addToast?.(
          t('dining.orderConfirmedCash', 'Order confirmed (cash). Pay at the table when served.'),
          'success'
        );
      }
      navigate(`${ROUTES.dining}#table-reservation`);
    },
    [clearCart, addToast, t, navigate]
  );

  const {
    branches: catalogBranches,
    loading: branchesLoading,
    error: branchesError,
    reload: reloadBranches,
  } = useBranches({ per_page: 50 });

  const {
    activities: cmsActivities,
    services: cmsServices,
    diningVenues: cmsDining,
    reviews: cmsReviews,
    error: cmsContentError,
  } = useWebsiteContent();

  const branchesByRegion = useMemo(() => {
    const map = new Map(SANCTUARY_REGIONS.map((r) => [r.key, []]));
    const unassigned = [];
    catalogBranches.forEach((branch) => {
      const key = resolveBranchRegionKey(branch);
      if (key) map.get(key).push(branch);
      else unassigned.push(branch);
    });
    return { map, unassigned };
  }, [catalogBranches]);

  const activeRegions = useMemo(
    () => SANCTUARY_REGIONS.filter((r) => (branchesByRegion.map.get(r.key)?.length ?? 0) > 0),
    [branchesByRegion]
  );

  const [sanctuaryRegionKey, setSanctuaryRegionKey] = useState(SANCTUARY_REGIONS[0].key);

  useEffect(() => {
    if (activeRegions.length === 0) return;
    const stillValid = activeRegions.some((r) => r.key === sanctuaryRegionKey);
    if (!stillValid) {
      setSanctuaryRegionKey(activeRegions[0].key);
    }
  }, [activeRegions, sanctuaryRegionKey]);

  const regionBranches = useMemo(() => {
    const inRegion = branchesByRegion.map.get(sanctuaryRegionKey) ?? [];
    if (inRegion.length > 0) return inRegion;
    return branchesByRegion.unassigned;
  }, [branchesByRegion, sanctuaryRegionKey]);

  const flagshipCandidate = useMemo(() => {
    if (!catalogBranches.length) return null;
    const featured = catalogBranches.find(
      (b) => b.raw?.featured || b.raw?.is_flagship || b.badge === 'Featured'
    );
    return featured ?? catalogBranches[0];
  }, [catalogBranches]);

  const {
    resort: flagshipDetail,
    rooms: flagshipRooms,
    loading: flagshipDetailLoading,
    error: flagshipDetailError,
    reload: reloadFlagshipDetail,
  } = useBranchDetail(flagshipCandidate?.id);

  const flagshipBranch = flagshipDetail ?? flagshipCandidate;
  const flagshipLoading =
    branchesLoading || (Boolean(flagshipCandidate?.id) && flagshipDetailLoading);
  const activities = cmsActivities.map((a) => (localize ? localize(a) : a));
  const services = cmsServices.map((s) => (localize ? localize(s) : s));
  const diningVenues = cmsDining.map((dv) => (localize ? localize(dv) : dv));
  const cmsReviewsLocalized = cmsReviews.map((rev) => (localize ? localize(rev) : rev));

  const {
    reviews: approvedGuestReviews,
    loading: guestReviewsLoading,
    error: guestReviewsError,
    summary: guestReviewsSummary,
    reload: reloadGuestReviews,
  } = useGuestReviews({ status: 'approved', per_page: 30 });

  const showGuestReviews = approvedGuestReviews.length > 0;
  const showCmsReviews =
    cmsReviewsLocalized.length > 0 &&
    !showGuestReviews &&
    !guestReviewsLoading &&
    !cmsContentError;

  const showGuestReviewSkeletons =
    guestReviewsLoading && !showGuestReviews && !showCmsReviews;
  const showReviewsSection =
    guestReviewsLoading ||
    showGuestReviews ||
    showCmsReviews ||
    Boolean(guestReviewsError);

  const guestReviewSummary = useMemo(() => {
    if (!showGuestReviews) return null;
    if (guestReviewsSummary?.totalReviews > 0) {
      return {
        avg: guestReviewsSummary.averageRating.toFixed(2),
        total: guestReviewsSummary.totalReviews,
      };
    }
    return null;
  }, [guestReviewsSummary, showGuestReviews]);

  const homeReviewCarouselItems = useMemo(() => {
    if (showGuestReviews) {
      return approvedGuestReviews.map((review) => ({
        key: `api-${review.id}`,
        review,
        verifiedLabel: t('home.verified', 'Verified'),
      }));
    }
    if (showCmsReviews) {
      return cmsReviewsLocalized.map((review) => ({
        key: `cms-${review.id}`,
        review: {
          id: review.id,
          guestName: review.author,
          avatar: review.avatar,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          stayMeta: [review.country, review.date].filter(Boolean).join(' · '),
          roomLabel: review.stayType || '',
        },
        verifiedLabel: undefined,
      }));
    }
    return [];
  }, [showGuestReviews, showCmsReviews, approvedGuestReviews, cmsReviewsLocalized, t]);

  const dishCategories = useMemo(
    () =>
      DISH_CATEGORIES.map((cat) => ({
        ...cat,
        label: t(`dining.category.${cat.id}`, cat.label),
      })),
    [t]
  );

  return (
    <div className="w-full flex flex-col relative">
      <CardlistSummaryOrder
        items={cartItems}
        currency={currency}
        t={t}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={removeItem}
        onCheckoutConfirm={handleDiningCheckoutConfirm}
        total={cartTotal}
        totalCount={totalCount}
      />

      {/* 1. HERO SECTION WITH SEARCH BAR */}
      <HeroSection
        image={heroImage}
        badge={t('brand.sub', 'Sanctuary of Mindful Luxury')}
        title={t('home.heroTitle', 'Find Your Sanctuary in Southeast Asia')}
        subtitle={t('home.heroSubtitle', 'Immerse yourself in world-class coastal villas, ancient forest pavilions, and tailored hospitality across Cambodia\'s most pristine horizons.')}
      >
        <SearchWidget />
      </HeroSection>

      {/* 2. VALUE PROPOSITION BAR / TRUST MARKERS */}
      <RevealOnScroll as="section" className="border-b border-border bg-surface/60 py-6" y={16}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <Award className="w-5 h-5 text-gold shrink-0" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">
                {t('trust.awardTitle', 'World Luxury Award Winner')}
              </span>
              <span className="text-[11px] text-muted">{t('trust.awardDesc', 'Excellence in hospitality 2026')}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Shield className="w-5 h-5 text-gold shrink-0" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">
                {t('trust.rateTitle', 'Best Rate Guaranteed')}
              </span>
              <span className="text-[11px] text-muted">{t('trust.rateDesc', 'Exclusive direct booking perks')}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Clock className="w-5 h-5 text-gold shrink-0" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">
                {t('trust.butlerTitle', '24/7 Dedicated Butler')}
              </span>
              <span className="text-[11px] text-muted">{t('trust.butlerDesc', 'Personalized concierge guild')}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Waves className="w-5 h-5 text-gold shrink-0" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">
                {t('trust.boatTitle', 'Private Island Speedboat')}
              </span>
              <span className="text-[11px] text-muted">{t('trust.boatDesc', 'VIP maritime & fleet transfers')}</span>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* 3. DESTINATIONS & SANCTUARIES (unified) */}
      <RevealOnScroll as="section" className="py-20 bg-bg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                {t('home.sanctuaries.tag', 'Idyllic Locales')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
                {t('home.sanctuaries.title', 'Solara Destinations & Sanctuaries')}
              </h2>
              <p className="text-sm text-muted mt-3 max-w-2xl leading-relaxed">
                {t(
                  'home.sanctuaries.subtitle',
                  'Discover our collection by region — each sanctuary reflects its landscape with live rates and amenities from the catalog.'
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/branches')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('home.allDestinations', 'All Locations')}
            </Button>
          </div>

          {/* Part A — regional sanctuaries */}
          <div className="mb-6">
            <h3 className="text-lg font-serif font-semibold text-text mb-4">
              {t('home.sanctuaries.byRegion', 'Explore by destination')}
            </h3>
            {activeRegions.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mb-8"
                role="tablist"
                aria-label={t('home.sanctuaries.regionTabs', 'Destination regions')}
              >
                {activeRegions.map((region) => {
                  const isActive = sanctuaryRegionKey === region.key;
                  const count = branchesByRegion.map.get(region.key)?.length ?? 0;
                  const label = t(region.labelKey, region.defaultLabel);
                  return (
                    <button
                      key={region.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSanctuaryRegionKey(region.key)}
                      className={`px-4 py-2 rounded-[var(--radius-button)] text-xs font-semibold uppercase tracking-wider border transition-colors ${
                        isActive
                          ? 'bg-gold/15 border-gold text-gold'
                          : 'bg-surface border-border text-muted hover:border-gold/40 hover:text-text'
                      }`}
                    >
                      {label}
                      <span className="ml-1.5 text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {branchesError && (
              <ErrorState message={branchesError} onRetry={reloadBranches} />
            )}

            {!branchesError && branchesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ResortCardSkeleton />
                <ResortCardSkeleton />
              </div>
            )}

            {!branchesError && !branchesLoading && catalogBranches.length === 0 && (
              <p className="text-center text-sm text-muted py-8">
                {t('home.sanctuaries.empty', 'Sanctuaries will appear when branches are published.')}
              </p>
            )}

            {!branchesError && !branchesLoading && regionBranches.length > 0 && (
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch auto-rows-fr"
                role="tabpanel"
              >
                {regionBranches.map((branch, idx) => (
                  <StaggerItem key={branch.id} index={idx}>
                    <BranchCard branch={branch} featured={false} />
                  </StaggerItem>
                ))}
              </div>
            )}

            {!branchesError && !branchesLoading && catalogBranches.length > 0 && regionBranches.length === 0 && (
              <p className="text-center text-sm text-muted py-8">
                {t('home.sanctuaries.noRegionMatch', 'No sanctuaries in this region yet.')}
              </p>
            )}
          </div>

          {/* Part B — flagship spotlight */}
          <MainsolaraResort
            embedded
            branch={flagshipBranch}
            rooms={flagshipRooms}
            loading={flagshipLoading}
            error={branchesError ? null : flagshipDetailError}
            onRetry={() => {
              if (branchesError) reloadBranches();
              else reloadFlagshipDetail();
            }}
          />
        </div>
      </RevealOnScroll>

      {/* 4. ACTIVITIES PREVIEW */}
      {activities.length > 0 && (
        <RevealOnScroll as="section" className="py-20 bg-surface/40 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                  {t('home.activitiesTag', 'Unforgettable Journeys')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
                  {t('home.activitiesTitle', 'Curated Guest Experiences')}
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/activities')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('home.viewAllActivities', 'View All Experiences')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activities.slice(0, 3).map((act) => (
                <div
                  key={act.id}
                  className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                    <img
                      src={act.image}
                      alt={act.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] uppercase tracking-wider text-gold-light px-2.5 py-1 rounded border border-gold/30">
                      {act.category}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted mb-2">
                        <span>{act.duration}</span>
                        <span className="font-semibold text-gold">
                          {formatCurrency(act.pricePerPerson, currency)} {t('common.perPerson', '/ person')}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-semibold text-text group-hover:text-gold transition-colors mb-2">
                        {act.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-4">
                        {act.description}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted">{act.schedule}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/activities')}
                      >
                        {t('common.learnMore', 'Learn More')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      )}

      {/* 7. SERVICES & WELLNESS SECTION */}
      {services.length > 0 && (
        <RevealOnScroll as="section" className="py-20 bg-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                {t('home.servicesTag', 'Holistic Hospitality')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight mb-4">
                {t('home.servicesTitle', 'Restorative Sanctuary Services')}
              </h2>
              <p className="text-sm text-muted">
                {t('home.servicesSubtitle', 'Designed around mindful wellness, private butler guild care, and seamless arrival logistics.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-surface border border-border p-8 rounded-[var(--radius-card)] flex flex-col sm:flex-row gap-6 items-start hover:border-gold/40 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-serif font-semibold text-text">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-gold-light italic">
                      {srv.tagline}
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      {srv.description}
                    </p>
                    <ul className="space-y-1.5 pt-2">
                      {srv.features.map((feat) => (
                        <li key={feat} className="text-xs text-text-secondary flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      )}

      {/* 8. DINING — POPULAR DISHES & VENUES */}
      <RevealOnScroll as="section" className="bg-surface/50 border-t border-border">
        <PopularDishes
          dishes={popularDishes}
          categories={dishCategories}
          currency={currency}
          t={t}
          pageSize={DINING_POPULAR_PAGE_SIZE}
          onAddToCart={handleDiningAddToCart}
        />

        <Activity_home
          activities={activities}
          currency={currency}
          t={t}
          onViewAll={() => navigate('/activities')}
          onActivitySelect={() => navigate('/activities')}
        />

        {diningVenues.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pt-4 border-t border-border">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                  {t('home.diningTag', 'Epicurean Artistry')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
                  {t('home.diningVenuesTitle', 'Our Restaurants & Lounges')}
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.dining)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('home.exploreDining', 'Explore Menus & Tables')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {diningVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    <img
                      src={venue.image}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] uppercase tracking-wider text-gold-light px-2.5 py-1 rounded">
                      {venue.cuisine}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-base font-serif font-semibold text-text group-hover:text-gold transition-colors mb-1.5">
                        {venue.name}
                      </h3>
                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed mb-3">
                        {venue.description}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border flex items-center justify-between text-[11px]">
                      <span className="text-muted">{venue.hours}</span>
                      <span className="font-semibold text-gold">{venue.priceLevel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </RevealOnScroll>

      {/* 9. PROMOTION / SPECIAL OFFER BANNER */}
      <RevealOnScroll as="section" className="py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[var(--radius-modal)] overflow-hidden border border-gold/40 p-8 sm:p-12 bg-gradient-to-r from-slate-950 via-surface to-slate-950 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4 text-left">
              <span className="text-xs uppercase tracking-[0.25em] text-gold font-bold inline-block">
                {t('home.promoTag', 'Seasonal Resident Privileges')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                {t('home.promoTitle', 'Stay Four Nights, Savor the Fourth with Our Compliments')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                {t('home.promoDesc', 'Reserve any private pool villa or overwater bungalow for four consecutive nights and receive your fourth night complimentary, alongside daily Champagne breakfast, roundtrip speedboat transfers, and a 60-minute couples massage.')}
              </p>
              <div className="pt-4 flex flex-wrap gap-4 items-center">
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => navigate('/booking')}
                >
                  {t('home.promoCta', 'Reserve Privileged Stay')}
                </Button>
                <span className="text-xs text-slate-400">
                  {t('home.promoValid', 'Valid for stays through December 2026.')}
                </span>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none hidden lg:block">
              <img
                src={MARKETING_IMAGES.hero}
                alt="Solara promotion"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* 10. REVIEWS / TESTIMONIALS */}
      {showReviewsSection && (
        <RevealOnScroll as="section" className="py-20 bg-surface/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                {showGuestReviews
                  ? t('home.guestReviewsTag', 'Real Guest Reviews')
                  : t('home.reviewsTag', 'Guest Impressions')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight mb-4">
                {showGuestReviews
                  ? t('home.guestReviewsTitle', 'Words from Our Guests')
                  : t('home.reviewsTitle', 'Words from Our Residents')}
              </h2>
              {showGuestReviews && guestReviewSummary ? (
                <div className="flex flex-col items-center justify-center gap-2 text-gold">
                  <StarRatingDisplay value={Math.round(Number(guestReviewSummary.avg))} size="lg" />
                  <span className="text-xs font-semibold text-text">
                    {guestReviewSummary.avg} · {guestReviewSummary.total}{' '}
                    {guestReviewSummary.total === 1
                      ? t('home.verifiedReview', 'verified review')
                      : t('home.verifiedReviews', 'verified reviews')}
                  </span>
                </div>
              ) : showCmsReviews ? (
                <p className="text-xs text-muted">
                  {t('home.cmsTestimonialsNote', 'Stories curated by our resort team')}
                </p>
              ) : null}
            </div>

            <div className="max-w-7xl mx-auto">
              {guestReviewsError && !showGuestReviews && !showCmsReviews && !guestReviewsLoading && (
                <ErrorState
                  title={t('home.reviewsErrorTitle', 'Unable to load guest reviews')}
                  message={guestReviewsError}
                  onRetry={reloadGuestReviews}
                />
              )}
              {showGuestReviewSkeletons && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <RoomCardSkeleton />
                  <RoomCardSkeleton />
                  <RoomCardSkeleton />
                </div>
              )}

              {!showGuestReviewSkeletons && homeReviewCarouselItems.length > 0 && (
                <HomeReviewsCarousel
                  items={homeReviewCarouselItems}
                  language={language}
                  t={t}
                />
              )}
            </div>
          </div>
        </RevealOnScroll>
      )}
    </div>
  );
};
