import { REVIEWS as MARKETING_REVIEWS_FALLBACK } from '../__fixtures__/resortsData.fixture.js';

/**
 * Website CMS stores JSON arrays under section/key pairs (e.g. activities/items).
 */
export function parseMarketingList(grouped, section, key = 'items') {
  const entry = grouped?.[section]?.[key];
  const raw = entry?.value ?? entry;
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function selectMarketingLists(grouped) {
  const cmsReviews = parseMarketingList(grouped, 'reviews');
  return {
    activities: parseMarketingList(grouped, 'activities'),
    services: parseMarketingList(grouped, 'services'),
    diningVenues: parseMarketingList(grouped, 'dining'),
    reviews: cmsReviews.length > 0 ? cmsReviews : MARKETING_REVIEWS_FALLBACK,
  };
}
