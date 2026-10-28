import { Award, Clock, HeartHandshake, Leaf, Shield, Sparkles, Waves } from 'lucide-react';
import { resolveActivityImage } from './media.js';

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

export function getCmsScalar(grouped, section, key) {
  const v = grouped?.[section]?.[key]?.value;
  if (v == null || String(v).trim() === '') return null;
  return String(v);
}

export function getCmsMediaUrl(grouped, section, key) {
  const row = grouped?.[section]?.[key];
  const url = row?.image_url ?? null;
  if (!url) return null;
  return resolveActivityImage(url) || url;
}

/** Prefer CMS copy; fall back to i18n defaults by language. */
export function cmsText(grouped, section, enKey, kmKey, language, fallbackEn, fallbackKm) {
  const en = getCmsScalar(grouped, section, enKey);
  const km = kmKey ? getCmsScalar(grouped, section, kmKey) : null;
  if (language === 'km') {
    if (km) return km;
    if (en) return en;
    return fallbackKm ?? fallbackEn;
  }
  if (en) return en;
  return fallbackEn;
}

export function withResolvedListImages(items, imageKey = 'image') {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const src = item?.[imageKey];
    const resolved = src ? resolveActivityImage(src) || src : src;
    return resolved && resolved !== src ? { ...item, [imageKey]: resolved } : item;
  });
}

export function selectMarketingLists(grouped) {
  return {
    activities: withResolvedListImages(parseMarketingList(grouped, 'activities')),
    services: withResolvedListImages(parseMarketingList(grouped, 'services')),
    diningVenues: withResolvedListImages(parseMarketingList(grouped, 'dining'), 'image'),
    reviews: parseMarketingList(grouped, 'reviews'),
  };
}

const TRUST_ICON_MAP = {
  Award,
  Shield,
  Clock,
  Waves,
  Sparkles,
};

export function resolveTrustIcon(iconName) {
  return TRUST_ICON_MAP[iconName] || Award;
}

/** CMS trust_bar.items or four default i18n pillars. */
export function resolveTrustPillars(grouped, { t, localize, language }) {
  const cmsItems = parseMarketingList(grouped, 'trust_bar');
  if (cmsItems.length > 0) {
    return cmsItems.map((raw) => {
      const item = localize ? localize(raw) : raw;
      return {
        icon: resolveTrustIcon(item.icon),
        title: item.title || '',
        description: item.description || '',
      };
    });
  }

  return [
    {
      icon: Award,
      title: t('trust.awardTitle', 'World Luxury Award Winner'),
      description: t('trust.awardDesc', 'Excellence in hospitality 2026'),
    },
    {
      icon: Shield,
      title: t('trust.rateTitle', 'Best Rate Guaranteed'),
      description: t('trust.rateDesc', 'Exclusive direct booking perks'),
    },
    {
      icon: Clock,
      title: t('trust.butlerTitle', '24/7 Dedicated Butler'),
      description: t('trust.butlerDesc', 'Personalized concierge guild'),
    },
    {
      icon: Waves,
      title: t('trust.boatTitle', 'Private Island Speedboat'),
      description: t('trust.boatDesc', 'VIP maritime & fleet transfers'),
    },
  ];
}

export function resolvePromoContent(grouped, { t, language }) {
  const hasCms =
    getCmsScalar(grouped, 'promo', 'title') ||
    getCmsScalar(grouped, 'promo', 'tag') ||
    getCmsMediaUrl(grouped, 'promo', 'image');

  const ctaPath = getCmsScalar(grouped, 'promo', 'cta_path') || '/booking';

  return {
    active: Boolean(hasCms),
    tag: cmsText(grouped, 'promo', 'tag', 'tag_km', language, t('home.promoTag', 'Seasonal Resident Privileges')),
    title: cmsText(
      grouped,
      'promo',
      'title',
      'title_km',
      language,
      t('home.promoTitle', 'Stay Four Nights, Savor the Fourth with Our Compliments')
    ),
    description: cmsText(
      grouped,
      'promo',
      'description',
      'description_km',
      language,
      t(
        'home.promoDesc',
        'Reserve any private pool villa or overwater bungalow for four consecutive nights and receive your fourth night complimentary, alongside daily Champagne breakfast, roundtrip speedboat transfers, and a 60-minute couples massage.'
      )
    ),
    ctaLabel: cmsText(grouped, 'promo', 'cta_label', 'cta_label_km', language, t('home.promoCta', 'Reserve Privileged Stay')),
    validUntil: cmsText(
      grouped,
      'promo',
      'valid_until',
      'valid_until_km',
      language,
      t('home.promoValid', 'Valid for stays through December 2026.')
    ),
    imageUrl: getCmsMediaUrl(grouped, 'promo', 'image'),
    ctaPath,
  };
}

const VALUE_ICONS = [Leaf, HeartHandshake, Award];

export function resolveAboutCoreValues(grouped, { t, language }) {
  const defaults = [
    {
      icon: Leaf,
      title: t('about.zeroWasteTitle', 'Zero-Waste & Conservation'),
      description: t(
        'about.zeroWasteDesc',
        'We operate 100% single-use plastic free across all five retreats, with on-site reverse osmosis water purification and solar micro-grids.'
      ),
    },
    {
      icon: HeartHandshake,
      title: t('about.heritageGuildTitle', 'Local Heritage Craft Guild'),
      description: t(
        'about.heritageGuildDesc',
        'Over 80% of our architectural artisans and staff are from surrounding communities, preserving indigenous arts and ancient hospitality wisdom.'
      ),
    },
    {
      icon: Award,
      title: t('about.awardHonorTitle', 'Global Luxury Recognition'),
      description: t(
        'about.awardHonorDesc',
        'Recognized consecutively by Conde Nast Traveler and World Luxury Hotel Awards as Southeast Asia’s most mindful sanctuary retreat.'
      ),
    },
  ];

  const fromCms = [1, 2, 3].map((n) => {
    const title = cmsText(
      grouped,
      'about',
      `value${n}_title`,
      `value${n}_title_km`,
      language,
      defaults[n - 1]?.title
    );
    const description = cmsText(
      grouped,
      'about',
      `value${n}_desc`,
      `value${n}_desc_km`,
      language,
      defaults[n - 1]?.description
    );
    const hasRow = getCmsScalar(grouped, 'about', `value${n}_title`) || getCmsScalar(grouped, 'about', `value${n}_desc`);
    if (!hasRow) return { ...defaults[n - 1], fromCms: false };
    return {
      icon: VALUE_ICONS[n - 1] || Award,
      title,
      description,
      fromCms: true,
    };
  });

  const anyCms = fromCms.some((v) => v.fromCms);
  return anyCms ? fromCms.map(({ icon, title, description }) => ({ icon, title, description })) : defaults;
}

export function resolveContactDetails(grouped, { t, language, siteContact }) {
  const phonePrimary =
    getCmsScalar(grouped, 'contact', 'phone_primary_value') ||
    siteContact?.phone ||
    '+855 (0) 23 999 123';
  const phoneSecondary = getCmsScalar(grouped, 'contact', 'phone_secondary') || '+1 (800) 840-SOLARA';
  const emailPrimary =
    getCmsScalar(grouped, 'contact', 'email_primary') ||
    siteContact?.email ||
    'concierge@solararesorts.com';
  const emailSecondary =
    getCmsScalar(grouped, 'contact', 'email_secondary') || 'reservations@solararesorts.com';
  const address = cmsText(
    grouped,
    'contact',
    'address',
    'address_km',
    language,
    'Cambodia'
  );
  const hoursLabel = cmsText(
    grouped,
    'contact',
    'hours_label',
    'hours_label_km',
    language,
    t('contact.butlerHours', 'Butler Service Hours')
  );
  const hoursValue = cmsText(
    grouped,
    'contact',
    'hours_value',
    'hours_value_km',
    language,
    language === 'km' ? '២៤ ម៉ោង / ៧ ថ្ងៃក្នុងមួយសប្តាហ៍' : '24 Hours / 7 Days a Week'
  );
  const phoneLabel = cmsText(
    grouped,
    'contact',
    'phone_primary',
    'phone_primary_km',
    language,
    t('contact.tollFree', 'Worldwide Toll-Free')
  );
  const emailLabel = cmsText(
    grouped,
    'contact',
    'email_primary',
    'email_primary_km',
    language,
    t('contact.conciergeEmail', 'Concierge & Bookings')
  );

  const telHref = (num) => {
    const digits = String(num).replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : siteContact?.phoneHref;
  };

  return {
    phoneLabel,
    phonePrimary,
    phoneSecondary,
    phoneHref: telHref(phonePrimary),
    emailLabel,
    emailPrimary,
    emailSecondary,
    emailHref: `mailto:${emailPrimary}`,
    address,
    hoursLabel,
    hoursValue,
    facebookUrl: getCmsScalar(grouped, 'contact', 'facebook_url'),
    telegramUrl: getCmsScalar(grouped, 'contact', 'telegram_url'),
    instagramUrl: getCmsScalar(grouped, 'contact', 'instagram_url'),
    checkIn: getCmsScalar(grouped, 'footer', 'checkin') || '14:00',
    checkOut: getCmsScalar(grouped, 'footer', 'checkout') || '12:00',
    copyright: cmsText(
      grouped,
      'footer',
      'copyright',
      'copyright_km',
      language,
      null
    ),
    logoUrl: getCmsMediaUrl(grouped, 'footer', 'logo'),
  };
}

/**
 * Use CMS list when available; while loading or empty, use curated fixture catalog.
 */
export function pickMarketingList(cmsItems, loading, fixture) {
  if (cmsItems?.length > 0) return cmsItems;
  if (loading) return fixture;
  return fixture;
}
