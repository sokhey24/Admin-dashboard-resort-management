import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { HeroSection } from '../components/ui/HeroSection.jsx';
import { Button } from '../components/ui/Button.jsx';
import { MARKETING_IMAGES } from '../constants/marketingImages.js';
import { useApp } from '../context/AppContext.jsx';
import { ACTIVITIES_FIXTURE, ACTIVITY_CATEGORY_VALUES } from '../data/activitiesData.js';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ActivityFilters } from '../components/activities/ActivityFilters.jsx';
import { ActivityCard } from '../components/activities/ActivityCard.jsx';
import { ActivityBookingModal } from '../components/activities/ActivityBookingModal.jsx';
import { normalizeCategory } from '../components/activities/activityBookingUtils.js';
import { paginateItems } from '../util/paginateList.js';
import { ListPagination } from '../components/ui/ListPagination.jsx';
import { Sparkles } from 'lucide-react';

const ACTIVITIES_PAGE_SIZE = 6;

export const ActivitiesPage = () => {
  const { currency, t, localize, language, user } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listPage, setListPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const categories = useMemo(
    () =>
      ACTIVITY_CATEGORY_VALUES.map((value) => {
        const keyMap = {
          All: 'activities.categoryAll',
          Adventure: 'activities.categoryAdventure',
          Wellness: 'activities.categoryWellness',
          Culture: 'activities.categoryCulture',
          Nature: 'activities.categoryNature',
        };
        const defaults = {
          All: 'All',
          Adventure: 'Adventure',
          Wellness: 'Wellness',
          Culture: 'Culture',
          Nature: 'Nature',
        };
        return {
          value,
          label: t(keyMap[value], defaults[value]),
        };
      }),
    [t]
  );

  const introGalleryImages = useMemo(
    () => [
      { src: MARKETING_IMAGES.villa, alt: t('activities.categoryAdventure', 'Adventure') },
      { src: MARKETING_IMAGES.spa, alt: t('activities.categoryWellness', 'Wellness') },
      { src: MARKETING_IMAGES.dining, alt: t('activities.categoryCulture', 'Culture') },
    ],
    [t]
  );

  const filteredActivities = useMemo(() => {
    if (selectedCategory === 'All') return ACTIVITIES_FIXTURE;
    const target = normalizeCategory(selectedCategory);
    return ACTIVITIES_FIXTURE.filter((a) => normalizeCategory(a.category) === target);
  }, [selectedCategory]);

  useEffect(() => {
    setListPage(1);
  }, [selectedCategory]);

  const activitiesPagination = useMemo(
    () => paginateItems(filteredActivities, listPage, ACTIVITIES_PAGE_SIZE),
    [filteredActivities, listPage]
  );

  useEffect(() => {
    if (listPage > activitiesPagination.totalPages) {
      setListPage(activitiesPagination.totalPages);
    }
  }, [listPage, activitiesPagination.totalPages]);

  const pagedActivities = activitiesPagination.items;
  const filterEmpty = filteredActivities.length === 0;

  const openBookingModal = useCallback((rawActivity) => {
    setSelectedActivity(rawActivity);
  }, []);

  const closeBookingModal = useCallback(() => {
    setSelectedActivity(null);
  }, []);

  const scrollToCatalog = () => {
    document.getElementById('activities-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectedDisplay = selectedActivity
    ? (localize ? localize(selectedActivity) : selectedActivity)
    : null;

  return (
    <div className="w-full pb-24 overflow-x-hidden">
      <HeroSection
        image={MARKETING_IMAGES.villa}
        badge={t('activities.heroEyebrow', 'Activities & Experiences')}
        title={t('activities.heroTitle', 'Discover Unforgettable Experiences')}
        subtitle={t(
          'activities.heroSubtitle',
          'Craft meaningful moments at Solara Resort—from dawn wellness rituals to coastal adventures and living Khmer heritage.'
        )}
        heightClass="min-h-[440px] sm:min-h-[480px] lg:min-h-[520px]"
      >
        <Button variant="gold" size="md" type="button" onClick={scrollToCatalog} className="shadow-lg">
          {t('activities.exploreCta', 'Explore Experiences')}
        </Button>
      </HeroSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
        <section className="mb-10 sm:mb-14 text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {t('activities.introEyebrow', 'Solara Resort')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text tracking-tight">
            {t('activities.introTitle', 'Discover More at Solara')}
          </h2>
          <p className="text-sm text-muted leading-relaxed font-light">
            {t(
              'activities.introDesc',
              'Whether you seek adventure on the water, restorative wellness, immersive culture, tranquil nature, or family-friendly outings—our concierge curates experiences that match your pace.'
            )}
          </p>
          <ul className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              t('activities.introThemeAdventure', 'Adventure'),
              t('activities.introThemeWellness', 'Wellness'),
              t('activities.introThemeCulture', 'Culture'),
              t('activities.introThemeNature', 'Nature'),
              t('activities.introThemeFamily', 'Family'),
            ].map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-secondary bg-surface border border-border px-3 py-1.5 rounded-full"
              >
                <Sparkles className="w-3 h-3 text-gold shrink-0" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <header className="mb-8 sm:mb-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-text tracking-tight">
              {t('activities.exploreTitle', 'Resort experiences & adventures')}
            </h2>
            <p className="mt-2 text-sm text-muted font-light leading-relaxed">
              {t(
                'activities.exploreSubtitle',
                'Browse curated activities by category and reserve your preferred date with our concierge team.'
              )}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto lg:max-w-none lg:ml-auto w-full">
            {introGalleryImages.map((item, index) => (
              <div
                key={`intro-gallery-${index}`}
                className={`relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-slate-900 aspect-[3/4] shadow-sm ${
                  index === 1 ? 'sm:-translate-y-2' : ''
                }`}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
              </div>
            ))}
          </div>
        </header>

        <ActivityFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={(value) => {
            setSelectedCategory(value);
            setListPage(1);
          }}
          ariaLabel={t('activities.exploreTitle', 'Resort experiences & adventures')}
        />

        {filterEmpty ? (
          <EmptyState
            title={t('activities.emptyFilterTitle', 'No experiences found')}
            description={t('activities.emptyCategoryDesc', 'Try another category or view all experiences.')}
            actionText={t('activities.viewAllExperiences', 'View All Experiences')}
            onAction={() => {
              setSelectedCategory('All');
              setListPage(1);
            }}
          />
        ) : (
          <div id="activities-catalog">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pagedActivities.map((rawAct) => {
                const act = localize ? localize(rawAct) : rawAct;
                return (
                  <ActivityCard
                    key={rawAct.id}
                    activity={rawAct}
                    display={act}
                    currency={currency}
                    imageFallbackLabel={t('activities.imageFallback', 'Activity experience')}
                    perPersonLabel={t('common.perPerson', '/ person')}
                    reserveLabel={t('activities.reserveExp', 'Reserve Experience')}
                    onReserve={openBookingModal}
                  />
                );
              })}
            </div>
            {activitiesPagination.showPagination && (
              <ListPagination
                className="mt-10"
                page={activitiesPagination.page}
                totalPages={activitiesPagination.totalPages}
                total={activitiesPagination.total}
                startIndex={activitiesPagination.startIndex}
                endIndex={activitiesPagination.endIndex}
                language={language}
                onPageChange={(nextPage) => {
                  setListPage(nextPage);
                  document.getElementById('activities-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            )}
          </div>
        )}
      </div>

      <ActivityBookingModal
        isOpen={Boolean(selectedActivity)}
        activity={selectedActivity}
        display={selectedDisplay}
        currency={currency}
        t={t}
        user={user}
        onClose={closeBookingModal}
      />
    </div>
  );
};
