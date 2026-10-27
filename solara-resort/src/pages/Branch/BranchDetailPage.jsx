import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  Share2,
  Clock,
  ShieldCheck,
  BedDouble,
  Sparkles,
  LayoutGrid,
  ConciergeBell,
  Waves,
  Leaf,
  Ship,
  UtensilsCrossed,
  Compass,
  MessageCircle,
} from 'lucide-react';
import {
  RoomCard,
  RoomCardGrid,
  ROOM_CARD_GRID_PAGE_SIZE,
} from '../../components/room/RoomCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { PageSkeleton } from '../../components/ui/Skeleton.jsx';
import { CatalogNightlyPrice } from '../../components/catalog/CatalogNightlyPrice.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useBranchDetail, useRoomTypes } from '../../hooks/useCatalog.js';
import { useGuestReviews } from '../../hooks/useGuestReviews.js';
import { useActivitiesCatalog } from '../../hooks/useActivitiesCatalog.js';
import { FavoriteButton } from '../../components/catalog/FavoriteButton.jsx';
import { BranchRelated } from '../../related/BranchRelated.jsx';
import { GuestReviewCard } from '../../components/reviews/GuestReviewCard.jsx';
import { StarRatingDisplay } from '../../components/reviews/StarRating.jsx';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { BranchQuickBookBar } from '../../components/branch/BranchQuickBookBar.jsx';
import { BranchConciergeModal } from '../../components/branch/BranchConciergeModal.jsx';
import { BranchLocationSection } from '../../components/branch/BranchLocationSection.jsx';
import { useBookingDraft } from '../../hooks/useBookingDraft.js';
import { resolveBranchStayCriteria } from '../../util/branchBooking.js';
import {
  filterBranchRoomsByGuests,
  filterBranchRoomsByType,
  getBranchRoomTypeFilterOptions,
} from '../../components/branch/branchRoomFilters.js';

const SECTION_NAV = [
  { id: 'overview', labelKey: 'resorts.navOverview', fallback: 'Overview' },
  { id: 'accommodations', labelKey: 'resorts.navAccommodations', fallback: 'Accommodations' },
  { id: 'amenities', labelKey: 'resorts.navAmenities', fallback: 'Amenities' },
  { id: 'dining', labelKey: 'resorts.navDining', fallback: 'Dining' },
  { id: 'experiences', labelKey: 'resorts.navExperiences', fallback: 'Experiences' },
  { id: 'location', labelKey: 'resorts.navLocation', fallback: 'Location & Map' },
  { id: 'reviews', labelKey: 'resorts.navReviews', fallback: 'Reviews' },
];

const PRIVILEGE_TILES = [
  {
    icon: ConciergeBell,
    match: /butler|concierge/i,
    titleKey: 'resorts.privilegeButler',
    titleFallback: 'Dedicated Butler',
    descKey: 'resorts.privilegeButlerDesc',
    descFallback: '24/7 guild care for every resident',
  },
  {
    icon: Waves,
    match: /pool|infinity/i,
    titleKey: 'resorts.privilegePool',
    titleFallback: 'Private Pool',
    descKey: 'resorts.privilegePoolDesc',
    descFallback: 'Temperature-controlled sanctuaries',
  },
  {
    icon: Leaf,
    match: /eco|sustain|green/i,
    titleKey: 'resorts.privilegeEco',
    titleFallback: 'Eco-certified',
    descKey: 'resorts.privilegeEcoDesc',
    descFallback: 'Plastic-free, solar-assisted operations',
  },
  {
    icon: Ship,
    match: /boat|speedboat|transfer/i,
    titleKey: 'resorts.privilegeTransfer',
    titleFallback: 'Speedboat Transfer',
    descKey: 'resorts.privilegeTransferDesc',
    descFallback: 'Seamless VIP arrival coordination',
  },
];

function buildRatingBars(averageRating) {
  const avg = Math.min(5, Math.max(1, Number(averageRating) || 4.9));
  return [5, 4, 3, 2, 1].map((star) => {
    const distance = Math.abs(star - avg);
    let pct = 12;
    if (star === 5) pct = avg >= 4.7 ? 72 : avg >= 4.3 ? 58 : 42;
    else if (star === 4) pct = avg >= 4.5 ? 22 : 28;
    else if (star === 3) pct = 6;
    else pct = Math.max(1, 8 - distance * 3);
    return { star, pct: Math.min(95, Math.round(pct)) };
  });
}

function localizedBranchName(branch, language) {
  const km = branch?.name_km || branch?.raw?.name_km;
  if (language === 'km' && km) return km;
  return branch?.name || '';
}

function localizedDescription(branch, language) {
  if (language === 'km' && branch?.description_km) return branch.description_km;
  return branch?.description || '';
}

export const BranchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency, toggleCurrency, addToast, t, language } = useApp();
  const { bookingDraft, beginBranchRoomBooking, primeBranchStay } = useBookingDraft();

  const { resort: branch, rooms: branchRooms, loading, error, reload } = useBranchDetail(id);
  const roomTypesParams = useMemo(() => {
    if (!id) return { per_page: 100 };
    const params = { per_page: 100, branch_id: id, assignable_to_branch: 1 };
    if (branch?.resortId) params.resort_id = branch.resortId;
    return params;
  }, [id, branch?.resortId]);
  const { roomTypes: catalogRoomTypes } = useRoomTypes(roomTypesParams);
  const { activities } = useActivitiesCatalog();
  const { reviews: allReviews, summary: reviewSummary, loading: reviewsLoading } = useGuestReviews(
    { status: 'approved', per_page: 24 },
    { enabled: Boolean(branch?.id) }
  );

  const [activePhoto, setActivePhoto] = useState('');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [roomFilter, setRoomFilter] = useState('all');
  const [stayGuestFilter, setStayGuestFilter] = useState(null);
  const [stayCriteria, setStayCriteria] = useState(() => resolveBranchStayCriteria(null, null));
  const [conciergeModalOpen, setConciergeModalOpen] = useState(false);
  const subNavRef = useRef(null);

  useEffect(() => {
    if (branch?.gallery?.[0]) {
      setActivePhoto(branch.gallery[0]);
    } else if (branch?.featuredImage) {
      setActivePhoto(branch.featuredImage);
    }
  }, [branch?.id, branch?.gallery, branch?.featuredImage]);

  useEffect(() => {
    setRoomFilter('all');
    setStayGuestFilter(null);
  }, [branch?.id]);

  useEffect(() => {
    if (!branch?.id) return;
    const stay = resolveBranchStayCriteria(null, bookingDraft);
    setStayCriteria(stay);
    primeBranchStay(branch, stay);
  }, [branch?.id, primeBranchStay]);

  useEffect(() => {
    if (roomFilter === 'all') return;
    const options = getBranchRoomTypeFilterOptions(branchRooms, catalogRoomTypes, {
      branchId: branch?.id,
      resortId: branch?.resortId,
    });
    if (!options.some((opt) => opt.value === roomFilter)) {
      setRoomFilter('all');
    }
  }, [branchRooms, catalogRoomTypes, branch?.id, branch?.resortId, roomFilter]);

  const sectionElementId = useCallback((sectionKey) => {
    if (sectionKey === 'accommodations') return 'available-rooms';
    return `branch-${sectionKey}`;
  }, []);

  useEffect(() => {
    if (!branch?.id) return undefined;

    const sectionIds = SECTION_NAV.map((item) => sectionElementId(item.id));
    const observers = [];

    sectionIds.forEach((sectionId) => {
      const el = document.getElementById(sectionId);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const navKey =
              sectionId === 'available-rooms' ? 'accommodations' : sectionId.replace('branch-', '');
            setActiveSection(navKey);
          }
        },
        { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [branch?.id, sectionElementId]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast(t('toast.linkCopied', 'Location link copied to clipboard'), 'success');
    }
  };

  const scrollToSection = useCallback(
    (sectionId) => {
      const el = document.getElementById(sectionElementId(sectionId));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [sectionElementId]
  );

  const filteredRooms = useMemo(() => {
    let list = filterBranchRoomsByType(branchRooms, roomFilter);
    if (stayGuestFilter) {
      list = filterBranchRoomsByGuests(
        list,
        stayGuestFilter.adults,
        stayGuestFilter.children
      );
    }
    return list;
  }, [branchRooms, roomFilter, stayGuestFilter]);

  const handleQuickBookApply = useCallback((criteria) => {
    setStayCriteria({
      checkIn: criteria.checkIn,
      checkOut: criteria.checkOut,
      adults: criteria.adults,
      children: criteria.children,
      roomsCount: criteria.roomsCount,
    });
    setStayGuestFilter({
      adults: criteria.adults,
      children: criteria.children,
    });
  }, []);

  const handleReserveRoom = useCallback(
    (room) => {
      if (!branch?.id) return;
      const path = beginBranchRoomBooking({ branch, room, stay: stayCriteria });
      addToast(
        `${t('toast.roomSelected', 'Selected for reservation')}: ${room.name}`,
        'success'
      );
      navigate(path);
    },
    [branch, stayCriteria, beginBranchRoomBooking, addToast, t, navigate]
  );

  const handleCheckAvailability = useCallback(() => {
    if (branchRooms.length === 0) {
      setConciergeModalOpen(true);
      return;
    }
    scrollToSection('accommodations');
  }, [branchRooms.length, scrollToSection]);

  const branchReviews = useMemo(() => {
    const name = branch?.name?.toLowerCase();
    if (!name) return [];
    return allReviews.filter((review) => {
      const branchMatch = review.branchName?.toLowerCase() === name;
      const locationMatch = review.locationLabel?.toLowerCase().includes(name);
      return branchMatch || locationMatch;
    });
  }, [allReviews, branch?.name]);

  const displayReviews = useMemo(
    () => (branchReviews.length > 0 ? branchReviews.slice(0, 4) : allReviews.slice(0, 4)),
    [branchReviews, allReviews]
  );

  const privilegeTiles = useMemo(() => {
    const amenities = branch?.amenities || [];
    return PRIVILEGE_TILES.map((tile) => ({
      ...tile,
      amenityLabel: amenities.find((item) => tile.match.test(String(item))) || null,
    }));
  }, [branch?.amenities]);

  const previewGallery = useMemo(() => {
    if (!branch) return [];
    return (branch.gallery?.length ? branch.gallery : [branch.featuredImage]).filter(Boolean);
  }, [branch]);

  const experienceCards = useMemo(() => {
    return (activities || []).slice(0, 3).map((item, index) => ({
      id: item.id || `exp-${index}`,
      title: language === 'km' && item.title_km ? item.title_km : item.title || item.name,
      subtitle:
        language === 'km' && item.subtitle_km
          ? item.subtitle_km
          : item.subtitle || item.description || '',
      image:
        item.image || item.featuredImage || previewGallery[index % previewGallery.length] || MARKETING_IMAGES.spa,
      href: item.href || '/activities',
    }));
  }, [activities, previewGallery, language]);

  if (loading) {
    return (
      <div className="w-full pb-24 pt-24">
        <PageSkeleton />
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="w-full pb-24 pt-28 max-w-3xl mx-auto px-4">
        <ErrorState
          title={t('resorts.detailErrorTitle', 'Location unavailable')}
          message={error || t('resorts.detailNotFound', 'This sanctuary branch could not be found.')}
          onRetry={reload}
        />
        <div className="text-center mt-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/branches')}>
            {t('resorts.backToList', 'Back to all locations')}
          </Button>
        </div>
      </div>
    );
  }

  const gallery = previewGallery;
  const heroImage = gallery[0] || branch.featuredImage;
  const branchName = localizedBranchName(branch, language);
  const destinationLabel =
    language === 'km' && branch.raw?.city_km ? branch.raw.city_km : branch.city || branch.destination;
  const descriptionBody =
    localizedDescription(branch, language) ||
    t(
      'resorts.defaultBranchStory',
      'Experience bespoke luxury hospitality crafted to harmonize with the landscape—nature, gastronomy, and holistic wellness in quiet balance.'
    );
  const ratingValue = Number(branch.rating ?? branch.stars ?? 0);
  const reviewsCount = Number(branch.reviewsCount ?? 0);
  const checkIn = branch.checkinTime || '14:00';
  const checkOut = branch.checkoutTime || '12:00';

  const avgForBars = reviewSummary?.averageRating || ratingValue || 4.9;
  const ratingBars = buildRatingBars(avgForBars);

  const diningCards = [
    {
      title: t('resorts.diningCard1Title', 'Azure Pavilion'),
      subtitle: t('resorts.diningCard1Desc', 'Coastal Khmer tasting menus at golden hour'),
      image: gallery[1] || MARKETING_IMAGES.dining,
    },
    {
      title: t('resorts.diningCard2Title', 'Lotus Private Chef'),
      subtitle: t('resorts.diningCard2Desc', 'In-villa degustation and wine pairing'),
      image: gallery[2] || MARKETING_IMAGES.dining,
    },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('brand.name', 'Solara Resort & Spa'),
        item: `${window.location.origin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('nav.branches', 'Our Locations'),
        item: `${window.location.origin}/branches`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: branchName,
        item: window.location.href,
      },
    ],
  };

  const accommodationsTitle = t('resorts.accommodationsTitle', 'Accommodations at {name}').replace(
    '{name}',
    branchName
  );

  return (
    <div className="w-full pb-24 bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero — full-bleed cinematic showcase */}
      <section className="relative w-full min-h-[min(88vh,920px)] lg:aspect-[16/9] lg:min-h-0 lg:max-h-[920px] overflow-hidden">
        <img
          src={heroImage}
          alt={branchName}
          className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/55 to-[#0a0e17]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e17]/80 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10 lg:pb-14 flex flex-col min-h-[min(88vh,920px)] lg:min-h-0 lg:h-full justify-end">
          <nav
            className="flex items-center gap-2 text-xs text-muted mb-6 flex-wrap"
            aria-label={t('common.breadcrumb', 'Breadcrumb')}
          >
            <Link to="/" className="hover:text-gold transition-colors font-medium">
              {t('brand.name', 'Solara Resort & Spa')}
            </Link>
            <span className="text-border">/</span>
            <Link to="/branches" className="hover:text-gold transition-colors">
              {t('nav.branches', 'Our Locations')}
            </Link>
            <span className="text-border">/</span>
            <span className="text-text-secondary">{destinationLabel}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {destinationLabel && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-[11px] uppercase tracking-widest text-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-gold" />
                    {destinationLabel}
                  </span>
                )}
                {ratingValue > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-gold/25 text-[11px] text-gold-light">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span className="font-semibold">{ratingValue.toFixed(2)}</span>
                    <span className="text-slate-300 font-normal">
                      · {reviewsCount} {t('resorts.guestReviews', 'guest reviews')}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-[0.18em] text-gold/90">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('resorts.sanctuaryBadge', 'Solara Sanctuary')}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.05]">
                {branchName}
              </h1>
              {branch.tagline && (
                <p className="mt-3 text-sm sm:text-base text-slate-300 font-light max-w-xl">
                  {language === 'km' && branch.raw?.tagline_km ? branch.raw.tagline_km : branch.tagline}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {gallery.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-slate-950/50 text-white hover:border-gold/50 backdrop-blur-md"
                  leftIcon={<LayoutGrid className="w-4 h-4" />}
                  onClick={() => {
                    setActivePhoto(gallery[0]);
                    setPhotoModalOpen(true);
                  }}
                >
                  {t('resorts.viewAllPhotos', 'View All Photos')} ({gallery.length})
                </Button>
              )}
              <FavoriteButton kind="resort" id={branch.id} size="lg" />
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-slate-950/40 text-white hover:border-gold/50 backdrop-blur-md"
                onClick={handleShare}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                {t('resorts.share', 'Share')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-30 -mt-8 sm:-mt-10 lg:-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BranchQuickBookBar
          branchId={branch.id}
          branchName={branchName}
          resortId={branch.resortId}
          branchRooms={branchRooms}
          catalogRoomTypes={catalogRoomTypes}
          roomTypeFilter={roomFilter}
          onRoomTypeFilterChange={setRoomFilter}
          onApplyStay={handleQuickBookApply}
        />
      </div>

      {/* Sticky anchor sub-navigation */}
      <div
        ref={subNavRef}
        className="sticky top-20 lg:top-24 z-40 border-b border-border bg-[#0a0e17]/92 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 overflow-x-auto scrollbar-none py-3">
          <nav className="flex items-center gap-1 min-w-0 flex-1" aria-label={t('resorts.sectionNav', 'Page sections')}>
            {SECTION_NAV.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-gold/15 text-gold border border-gold/35'
                      : 'text-muted hover:text-gold border border-transparent hover:border-gold/20'
                  }`}
                >
                  {t(item.labelKey, item.fallback)}
                </button>
              );
            })}
          </nav>
          <Button
            variant="gold"
            size="sm"
            className="shrink-0 shadow-md"
            onClick={() => scrollToSection('accommodations')}
          >
            {t('resorts.checkAvailability', 'Check Availability')}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 lg:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-14">
          <div className="lg:col-span-2 space-y-16 lg:space-y-20">
            {/* Overview */}
            <section id="branch-overview" className="scroll-mt-36 space-y-5">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                {t('resorts.storyEyebrow', 'Sanctuary Overview')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text leading-snug">
                {branch.tagline || `${branchName} · ${t('brand.name', 'Solara Resort & Spa')}`}
              </h2>
              <p className="text-sm sm:text-base text-muted leading-relaxed font-light whitespace-pre-line">
                {descriptionBody}
              </p>
              <p className="text-sm text-text-secondary/90 leading-relaxed font-light italic border-l-2 border-gold/40 pl-4">
                {t(
                  'resorts.architectureNote',
                  'Architecture draws from Khmer proportion, native stone, and open-air pavilions—composed for stillness and sea-or-forest horizons.'
                )}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)] bg-surface border border-border text-xs text-text">
                  <Clock className="w-4 h-4 text-gold shrink-0" />
                  {t('resorts.checkInLabel', 'Check-in')} {checkIn}
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)] bg-surface border border-border text-xs text-text">
                  <Clock className="w-4 h-4 text-gold shrink-0" />
                  {t('resorts.checkOutLabel', 'Check-out')} {checkOut}
                </span>
              </div>
            </section>
          </div>

          {/* Sticky privilege aside (aligned with overview) */}
          <aside className="lg:col-span-1 lg:row-start-1">
            <div className="sticky top-36 lg:top-40 space-y-6">
              <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-xl space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                    {t('resorts.directPrivilegeCard', 'Sanctuary Direct Privilege')}
                  </span>
                  {branch.startingPrice > 0 && (
                    <div>
                      <span className="text-xs text-muted block mb-1">
                        {t('resorts.nightlyFrom', 'Nightly from')}
                      </span>
                      <CatalogNightlyPrice
                        salePrice={branch.startingPrice}
                        listPrice={branch.startingPriceOriginal}
                        discountPercent={branch.startingPriceDiscountPercent}
                        currency={currency}
                        size="lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-border text-xs text-muted">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>{branch.address || branch.location}</span>
                  </div>
                  {branch.contactPhone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-gold shrink-0" />
                      <span>{branch.contactPhone}</span>
                    </div>
                  )}
                  {branch.contactEmail && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-gold shrink-0" />
                      <span className="truncate">{branch.contactEmail}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-[var(--radius-button)] bg-bg/60 border border-border/80 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-text font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('resorts.directBookingPerks', 'Solara Direct Booking Privileges:')}</span>
                  </div>
                  <ul className="text-muted space-y-1.5 text-[11px]">
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                      {t('resorts.perk1', 'Best rate guarantee always')}
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                      {t('resorts.perk2', 'Daily organic Champagne breakfast')}
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                      {t('resorts.perk3', 'Speedboat or VIP luxury transfer')}
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                      {t('resorts.perk4', 'Early check-in & late departure priority')}
                    </li>
                  </ul>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full shadow-md"
                  onClick={handleCheckAvailability}
                >
                  {branchRooms.length === 0
                    ? t('branches.conciergeModal.cta', 'Message Concierge')
                    : t('resorts.checkAvailability', 'Check Availability')}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                  onClick={() =>
                    branchRooms.length === 0
                      ? setConciergeModalOpen(true)
                      : navigate('/contact')
                  }
                >
                  {t('resorts.quickConcierge', 'Quick Concierge Inquiry')}
                </Button>
              </div>
            </div>
          </aside>

          {/* Accommodations — full width, 3 cards per row */}
          <section
            id="available-rooms"
            className="lg:col-span-3 scroll-mt-36 space-y-6"
            aria-labelledby="available-rooms-heading"
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-1">
                  {t('resorts.accommodationsEyebrow', 'Private Accommodations')}
                </span>
                <h3
                  id="available-rooms-heading"
                  className="text-2xl sm:text-3xl font-serif font-bold text-text"
                >
                  {accommodationsTitle}
                </h3>
                <p className="text-xs text-muted mt-2 max-w-xl">
                  {t(
                    'resorts.accommodationsSubtitle',
                    'Every reservation includes dedicated butler guild care, Champagne breakfast, and Solara direct privileges.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleCurrency}
                className="self-start sm:self-auto text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-surface text-gold hover:border-gold/40 transition-colors"
                aria-label={t('common.currency', 'Currency')}
              >
                {currency}
              </button>
            </div>

            {branchRooms.length === 0 ? (
              <div className="p-10 rounded-[var(--radius-card)] bg-gradient-to-b from-surface to-bg border border-gold/20 text-center space-y-4">
                <ConciergeBell className="w-10 h-10 text-gold mx-auto" />
                <p className="text-base font-serif font-semibold text-text">
                  {t(
                    'branches.conciergeModal.emptyTitle',
                    'No online inventory at this sanctuary'
                  )}
                </p>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                  {t(
                    'branches.conciergeModal.body',
                    'No quarters are open for instant booking right now. Our concierge team can secure releases, connecting villas, and celebration itineraries on your behalf.'
                  )}
                </p>
                <Button variant="gold" size="md" onClick={() => setConciergeModalOpen(true)}>
                  {t('branches.conciergeModal.cta', 'Message Concierge')}
                </Button>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 rounded-[var(--radius-card)] bg-surface border border-border text-center space-y-3">
                <BedDouble className="w-8 h-8 text-gold/60 mx-auto" />
                <p className="text-sm font-medium text-text">
                  {t(
                    'resorts.noRoomsFilterTitle',
                    'No quarters match your stay filters.'
                  )}
                </p>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  {t(
                    'resorts.noRoomsFilterDesc',
                    'Adjust dates, guests, or room type above to see available accommodations.'
                  )}
                </p>
                <Button variant="outline" size="sm" onClick={() => setRoomFilter('all')}>
                  {t('resorts.resetRoomFilters', 'Show all room types')}
                </Button>
              </div>
            ) : (
              <RoomCardGrid
                rooms={filteredRooms}
                pageSize={ROOM_CARD_GRID_PAGE_SIZE}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch auto-rows-fr"
                paginationClassName="pt-8"
                renderItem={(room) => (
                  <RoomCard
                    room={room}
                    stay={stayCriteria}
                    onReserve={handleReserveRoom}
                    reserveLabel={t('rooms.bookThisQuarter', 'Book This Quarter')}
                  />
                )}
              />
            )}
          </section>

          <div className="lg:col-span-2 space-y-16 lg:space-y-20">
            {/* Amenities bento */}
            <section id="branch-amenities" className="scroll-mt-36 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                  {t('branches.amenities', 'Branch Features & Inclusions')}
                </span>
                <h3 className="text-2xl font-serif font-bold text-text mt-1">
                  {t('resorts.keyPrivileges', 'Key Privileges')}
                </h3>
                <p className="text-xs text-muted mt-1">
                  {t('resorts.privilegesSubtitle', 'Curated conveniences reserved for Solara residents')}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {privilegeTiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <div
                      key={tile.titleKey}
                      className="group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 hover:border-gold/35 transition-colors"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-4 relative">
                        <div className="w-11 h-11 rounded-[var(--radius-button)] bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-text font-serif">
                            {tile.amenityLabel || t(tile.titleKey, tile.titleFallback)}
                          </h4>
                          <p className="text-xs text-muted mt-1 leading-relaxed">
                            {t(tile.descKey, tile.descFallback)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(branch.amenities || []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {branch.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-button)] bg-bg-secondary/80 border border-border/60 text-xs text-text-secondary"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Dining */}
            <section id="branch-dining" className="scroll-mt-36 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                  {t('resorts.diningEyebrow', 'On-Site Dining')}
                </span>
                <h3 className="text-2xl font-serif font-bold text-text mt-1">
                  {t('resorts.diningTitle', 'Signature Tables')}
                </h3>
                <p className="text-xs text-muted mt-1 max-w-xl">
                  {t(
                    'resorts.diningSubtitle',
                    'Seasonal Khmer-fusion cuisine and intimate chef’s tables steps from your villa.'
                  )}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {diningCards.map((card) => (
                  <article
                    key={card.title}
                    className="group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-transparent to-transparent pointer-events-none" />
                    </div>
                    <div className="p-5 flex items-start gap-3">
                      <UtensilsCrossed className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-serif font-semibold text-text">{card.title}</h4>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{card.subtitle}</p>
                        <Link
                          to="/dining"
                          className="inline-block mt-3 text-xs text-gold hover:text-gold-light transition-colors"
                        >
                          {t('home.exploreDining', 'Explore Menus & Tables')}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Experiences */}
            <section id="branch-experiences" className="scroll-mt-36 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                  {t('resorts.experiencesEyebrow', 'Curated Experiences')}
                </span>
                <h3 className="text-2xl font-serif font-bold text-text mt-1">
                  {t('resorts.experiencesTitle', 'Moments Crafted for You')}
                </h3>
                <p className="text-xs text-muted mt-1 max-w-xl">
                  {t(
                    'resorts.experiencesSubtitle',
                    'Wellness rituals, coastal adventures, and heritage encounters—curated by our concierge.'
                  )}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {experienceCards.map((card) => (
                  <Link
                    key={card.id}
                    to={card.href}
                    className="group block rounded-[var(--radius-card)] border border-border bg-surface overflow-hidden hover:border-gold/35 transition-colors"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-900">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-gold mb-1">
                        <Compass className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest">
                          {t('activities.heroEyebrow', 'Activities & Experiences')}
                        </span>
                      </div>
                      <h4 className="font-serif font-semibold text-text line-clamp-1">{card.title}</h4>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{card.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <BranchLocationSection branch={branch} branchName={branchName} />

            {/* Reviews */}
            <section id="branch-reviews" className="scroll-mt-36 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                    {t('resorts.reviewsEyebrow', 'Guest Impressions')}
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-text mt-1">
                    {t('resorts.reviewsTitle', 'Verified Resident Reviews')}
                  </h3>
                </div>
                {ratingValue > 0 && (
                  <div className="flex items-center gap-2 text-gold">
                    <StarRatingDisplay value={Math.round(ratingValue)} size="md" />
                    <span className="text-sm font-semibold">{ratingValue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 p-5 rounded-[var(--radius-card)] bg-surface border border-border space-y-3">
                  <p className="text-xs uppercase tracking-widest text-muted">
                    {t('resorts.ratingBreakdown', 'Rating breakdown')}
                  </p>
                  {ratingBars.map((row) => (
                    <div key={row.star} className="flex items-center gap-3 text-xs">
                      <span className="w-8 text-muted">{row.star}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-gold/80 rounded-full transition-all duration-500"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-muted">{row.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-3 space-y-4">
                  {reviewsLoading && displayReviews.length === 0 ? (
                    <p className="text-sm text-muted">{t('common.loading', 'Loading sanctuary...')}</p>
                  ) : displayReviews.length === 0 ? (
                    <p className="text-sm text-muted">
                      {t('resorts.noReviewsYet', 'Guest reviews will appear here after verified stays.')}
                    </p>
                  ) : (
                    displayReviews.map((review) => (
                      <GuestReviewCard
                        key={review.id}
                        review={review}
                        language={language}
                        verifiedLabel={t('home.verified', 'Verified Resident')}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <BranchRelated branch={branch} />

      <Modal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} maxWidth="5xl">
        <div className="space-y-4">
          <div className="w-full aspect-[16/10] overflow-hidden rounded-[var(--radius-button)] bg-slate-950">
            <img src={activePhoto} alt={branchName} className="w-full h-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
              {gallery.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActivePhoto(img)}
                  className={`aspect-[4/3] rounded overflow-hidden border-2 transition-colors ${
                    activePhoto === img ? 'border-gold' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <BranchConciergeModal
        isOpen={conciergeModalOpen}
        onClose={() => setConciergeModalOpen(false)}
        branch={branch}
        branchName={branchName}
      />
    </div>
  );
};

export default BranchDetailPage;
