import React, { useMemo } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { formatCurrency } from '../util/currency.js';
import { ACTIVITIES_FIXTURE } from '../data/activitiesData.js';
import { useApp } from '../context/AppContext.jsx';

const CARD_MIN_COUNT = 8;

function buildMarqueeList(activities) {
  if (!activities.length) return [];
  let list = [...activities];
  while (list.length < CARD_MIN_COUNT) {
    list = [...list, ...activities];
  }
  return [...list, ...list];
}

function ActivityMarqueeCard({ activity, currency, t, onSelect }) {
  return (
    <article
      className="group w-[280px] sm:w-[280px] shrink-0 bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden shadow-sm flex flex-col h-full snap-start"
    >
      <button
        type="button"
        onClick={() => onSelect?.(activity)}
        className="text-left flex flex-col h-full cursor-pointer"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 shrink-0">
          <img
            src={activity.image}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          {activity.category && (
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] uppercase tracking-wider text-gold-light px-2.5 py-1 rounded border border-gold/30 max-w-[85%] truncate">
              {activity.category}
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1 gap-2">
          <div className="flex items-center justify-between text-xs text-muted gap-2">
            {activity.duration && (
              <span className="inline-flex items-center gap-1 min-w-0 truncate">
                <Clock className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                {activity.duration}
              </span>
            )}
            <span className="font-semibold text-gold shrink-0">
              {formatCurrency(activity.pricePerPerson, currency)}
            </span>
          </div>
          <h3 className="text-lg font-serif font-semibold text-text group-hover:text-gold transition-colors line-clamp-2">
            {activity.title}
          </h3>
          <p className="text-xs text-muted leading-relaxed line-clamp-2 flex-1">
            {activity.description}
          </p>
          <span className="text-[11px] text-gold-light pt-1 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            {t('common.learnMore', 'Learn More')}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </span>
        </div>
      </button>
    </article>
  );
}

const Activity_home = ({
  activities: activitiesProp,
  currency,
  t,
  onViewAll,
  onActivitySelect,
}) => {
  const { language, localize } = useApp();

  const activities = useMemo(() => {
    const source =
      activitiesProp?.length > 0
        ? activitiesProp
        : ACTIVITIES_FIXTURE.map((item) => (localize ? localize(item) : item));
    return source;
  }, [activitiesProp, language, localize]);

  const marqueeItems = useMemo(() => buildMarqueeList(activities), [activities]);

  if (activities.length === 0) {
    return null;
  }

  return (
    <section
      className="border-t border-border pt-16 pb-16 sm:pb-20"
      aria-label={t('home.activitiesTitle', 'Curated Guest Experiences')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
              {t('home.activitiesTag', 'Unforgettable Journeys')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight">
              {t('home.activitiesMarqueeTitle', 'Experiences in Motion')}
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2 max-w-xl">
              {t(
                'home.activitiesMarqueeDesc',
                'Swipe through curated adventures—wellness, culture, and coastal escapes crafted for Solara guests.'
              )}
            </p>
          </div>
          {onViewAll && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onViewAll}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('home.viewAllActivities', 'View All Experiences')}
            </Button>
          )}
        </div>
      </div>

      <div className="activity-marquee-mask relative overflow-hidden">
        <div
          className="activity-marquee-track flex w-max gap-6 px-4 sm:px-6 lg:px-8"
          role="list"
        >
          {marqueeItems.map((activity, index) => (
            <div key={`${activity.id}-${index}`} role="listitem">
              <ActivityMarqueeCard
                activity={activity}
                currency={currency}
                t={t}
                onSelect={onActivitySelect}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only">
        {t(
          'home.activitiesMarqueeA11y',
          'Activity cards scroll automatically from right to left. Hover to pause.'
        )}
      </p>
    </section>
  );
};

export default Activity_home;
