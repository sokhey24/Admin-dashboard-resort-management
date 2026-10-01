import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Star,
  Sparkles,
  Waves,
  Shield,
  Clock,
  Award
} from 'lucide-react';
import { HeroSection } from '../components/ui/HeroSection.jsx';
import { SearchWidget } from '../features/search/components/SearchWidget.jsx';
import { BranchCard } from '../components/branch/BranchCard.jsx';
import { RoomCard } from '../components/room/RoomCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatCurrency } from '../util/currency.js';
import { useApp } from '../context/AppContext.jsx';
import { useBranches, useRoomsList } from '../hooks/useCatalog.js';
import { buildDestinationTiles } from '../util/mapCatalog.js';
import { useWebsiteContent } from '../hooks/useWebsiteContent.js';
import { MARKETING_IMAGES } from '../constants/marketingImages.js';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ResortCardSkeleton, RoomCardSkeleton } from '../components/ui/Skeleton.jsx';
import heroImage from '../assets/images/hero_solara_resort_1790692958491.jpg';

export const HomePage = () => {
  const navigate = useNavigate();
  const { currency, t, localize } = useApp();

  const {
    branches: catalogBranches,
    loading: branchesLoading,
    error: branchesError,
    reload: reloadBranches,
  } = useBranches({ per_page: 50 });

  const {
    rooms: catalogRooms,
    loading: roomsLoading,
    error: roomsError,
    reload: reloadRooms,
  } = useRoomsList({ per_page: 6 });

  const {
    activities: cmsActivities,
    services: cmsServices,
    diningVenues: cmsDining,
    reviews: cmsReviews,
  } = useWebsiteContent();

  const destinations = buildDestinationTiles(catalogBranches);
  const featuredBranches = catalogBranches.slice(0, 4);
  const activities = cmsActivities.map((a) => (localize ? localize(a) : a));
  const services = cmsServices.map((s) => (localize ? localize(s) : s));
  const diningVenues = cmsDining.map((dv) => (localize ? localize(dv) : dv));
  const reviews = cmsReviews.map((rev) => (localize ? localize(rev) : rev));

  return (
    <div className="w-full flex flex-col">
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
      <section className="border-b border-border bg-surface/60 py-6">
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
      </section>

      {/* 3. POPULAR DESTINATIONS */}
      <section className="py-20 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                {t('home.destinationsTag', 'Idyllic Locales')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
                {t('home.destinationsTitle', 'Explore Destinations')}
              </h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {branchesError && (
              <div className="col-span-full">
                <ErrorState message={branchesError} onRetry={reloadBranches} />
              </div>
            )}
            {!branchesError && branchesLoading && (
              <>
                <ResortCardSkeleton />
                <ResortCardSkeleton />
                <ResortCardSkeleton />
                <ResortCardSkeleton />
              </>
            )}
            {!branchesError && !branchesLoading && destinations.length === 0 && (
              <p className="col-span-full text-center text-xs text-muted py-8">
                {t('home.noDestinations', 'Destinations will appear when branches are published.')}
              </p>
            )}
            {!branchesError &&
              !branchesLoading &&
              destinations.map((dest) => (
              <div
                key={dest.name}
                onClick={() => navigate(`/branches?destination=${encodeURIComponent(dest.name)}`)}
                className="group relative h-96 rounded-[var(--radius-card)] overflow-hidden cursor-pointer border border-border/80 shadow-md hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="flex items-center justify-between text-xs text-gold-light mb-1">
                    <span>{dest.resortsCount} {dest.resortsCount === 1 ? t('common.sanctuary', 'Sanctuary') : t('common.sanctuaries', 'Sanctuaries')}</span>
                    <span>{t('common.from', 'From')} {formatCurrency(dest.startingPrice, currency)}</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold group-hover:text-gold transition-colors mb-2">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                    {dest.subtitle}
                  </p>
                </div>
              </div>
              ))}
          </div>
        </div>
      </section>

      {/* 4. POPULAR BRANCHES */}
      <section className="py-20 bg-surface/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                {t('brand.name', 'Solara Resort & Spa')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
                {t('home.resortsTitle', 'Our Signature Sanctuaries')}
              </h2>
            </div>
            <p className="text-sm text-muted max-w-md">
              {t('home.resortsSubtitle', 'Each Solara retreat is an architectural reflection of its landscape, honoring native materials, heritage craft, and understated luxury.')}
            </p>
          </div>

          {branchesError ? (
            <ErrorState message={branchesError} onRetry={reloadBranches} />
          ) : branchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <ResortCardSkeleton />
              <ResortCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredBranches.map((branch, idx) => (
                <BranchCard key={branch.id} branch={branch} featured={false} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/branches')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('home.viewAllResorts', 'View All Solara Sanctuaries')}
            </Button>
          </div>
        </div>
      </section>

      {/* 5. FEATURED ROOMS & VILLAS */}
      <section className="py-20 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                {t('home.roomsTag', 'Private Quarters')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
                {t('home.roomsTitle', 'Featured Accommodations')}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/rooms')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('home.exploreAllRooms', 'Explore All Rooms')}
            </Button>
          </div>

          {roomsError ? (
            <ErrorState message={roomsError} onRetry={reloadRooms} />
          ) : roomsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {catalogRooms.slice(0, 3).map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. ACTIVITIES PREVIEW */}
      {activities.length > 0 && (
      <section className="py-20 bg-surface/40 border-t border-border">
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
      </section>
      )}

      {/* 7. SERVICES & WELLNESS SECTION */}
      {services.length > 0 && (
      <section className="py-20 bg-bg">
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
      </section>
      )}

      {/* 8. DINING HIGHLIGHT */}
      {diningVenues.length > 0 && (
      <section className="py-20 bg-surface/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                {t('home.diningTag', 'Epicurean Artistry')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
                {t('home.diningTitle', 'Gastronomy by the Sea & Forest')}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dining')}
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
      </section>
      )}

      {/* 9. PROMOTION / SPECIAL OFFER BANNER */}
      <section className="py-16 bg-bg">
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
      </section>

      {/* 10. REVIEWS / TESTIMONIALS */}
      {reviews.length > 0 && (
      <section className="py-20 bg-surface/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
              {t('home.reviewsTag', 'Guest Impressions')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight mb-4">
              {t('home.reviewsTitle', 'Words from Our Residents')}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-gold">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold" />
              ))}
              <span className="ml-2 text-xs font-semibold text-text">
                {t('home.reviewsSummary', '4.94 Overall Rating across 1,040+ Verified Reviews')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-surface border border-border p-8 rounded-[var(--radius-card)] flex flex-col justify-between shadow-sm hover:border-gold/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1 text-gold mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-gold" />
                    ))}
                  </div>
                  <h4 className="text-sm font-semibold font-serif text-text mb-2">
                    "{review.title}"
                  </h4>
                  <p className="text-xs text-muted leading-relaxed mb-6 font-light">
                    "{review.comment}"
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="w-9 h-9 rounded-full object-cover border border-gold/30"
                    />
                    <div>
                      <p className="text-xs font-semibold text-text">{review.author}</p>
                      <p className="text-[10px] text-muted">{review.country} · {review.date}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gold font-medium bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                    {t('home.verified', 'Verified')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}
    </div>
  );
};
