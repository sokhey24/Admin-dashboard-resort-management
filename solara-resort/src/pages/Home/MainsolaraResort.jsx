import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  BedDouble,
  Users,
  Maximize2,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { CatalogNightlyPrice } from '../../components/catalog/CatalogNightlyPrice.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { RoomCardSkeleton, Skeleton } from '../../components/ui/Skeleton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { paginateItems } from '../../util/paginateList.js';

const ROOMS_PAGE_SIZE = 3;

function MainSolaraRoomTile({ room, currency, branchLocation, onExplore }) {
  const { t, localize } = useApp();
  const item = localize ? localize(room) : room;
  const guests = (item.capacity?.adults ?? 0) + (item.capacity?.children ?? 0);
  const locationLabel = item.branchLocation ?? branchLocation;

  return (
    <article
      className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 shrink-0">
        {item.featuredImage ? (
          <img
            src={item.featuredImage}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-muted px-4 text-center">
            {t('catalog.noImage', 'Image not provided')}
          </div>
        )}
        <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider bg-slate-950/80 text-gold border border-gold/30 px-2 py-0.5 rounded">
          {item.type}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-serif font-bold text-text">{item.name}</h3>
        {locationLabel && (
          <p className="text-xs text-muted flex items-center gap-1.5 -mt-1">
            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
            <span>
              {t('catalog.location', 'Location')}:{' '}
              <span className="text-text-secondary font-medium">{locationLabel}</span>
            </span>
          </p>
        )}
        <CatalogNightlyPrice
          salePrice={item.pricePerNight}
          listPrice={item.listPricePerNight}
          discountPercent={item.discountPercent}
          currency={currency}
          size="sm"
        />
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gold shrink-0" />
            {guests} {t('search.guests', 'Guests')}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-gold shrink-0" />
            {item.bedType}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5 text-gold shrink-0" />
            {item.sizeSqm} m²
          </span>
          <span className="flex items-center gap-1 truncate">
            <Eye className="w-3.5 h-3.5 text-gold shrink-0" />
            {item.view}
          </span>
        </div>
        <ul className="text-[11px] text-muted space-y-1 flex-1">
          {(item.amenities || []).slice(0, 3).map((a) => (
            <li key={a} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
              {a}
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="w-full mt-auto" onClick={onExplore}>
          {t('mainSolara.exploreRooms', 'Explore live availability')}
        </Button>
      </div>
    </article>
  );
}

function FlagshipSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-16 w-full max-w-lg rounded-[var(--radius-card)]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Skeleton className="lg:col-span-3 aspect-[16/10] lg:min-h-[320px] rounded-[var(--radius-card)]" />
        <div className="lg:col-span-2 flex gap-2 lg:flex-col">
          <Skeleton className="w-28 lg:w-full aspect-[4/3] rounded-[var(--radius-button)]" />
          <Skeleton className="w-28 lg:w-full aspect-[4/3] rounded-[var(--radius-button)] hidden lg:block" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius-card)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RoomCardSkeleton />
        <RoomCardSkeleton />
        <RoomCardSkeleton />
      </div>
    </div>
  );
}

export function MainsolaraResort({
  branch,
  rooms = [],
  loading = false,
  error = null,
  onRetry,
  embedded = false,
}) {
  const navigate = useNavigate();
  const { currency, t, localize } = useApp();
  const item = branch && localize ? localize(branch) : branch;
  const [roomPage, setRoomPage] = useState(1);
  const gallery = useMemo(() => {
    if (!item) return [];
    const urls = item.gallery?.length ? item.gallery : [item.featuredImage].filter(Boolean);
    return urls;
  }, [item]);
  const [heroImage, setHeroImage] = useState(gallery[0]);

  const roomPagination = useMemo(
    () => paginateItems(rooms, roomPage, ROOMS_PAGE_SIZE),
    [rooms, roomPage]
  );

  useEffect(() => {
    setRoomPage(1);
  }, [branch?.id]);

  useEffect(() => {
    setHeroImage(gallery[0] || null);
  }, [gallery]);

  useEffect(() => {
    if (roomPage > roomPagination.totalPages) {
      setRoomPage(roomPagination.totalPages);
    }
  }, [roomPage, roomPagination.totalPages]);

  const sectionClass = embedded
    ? 'pt-16 border-t border-border'
    : 'py-20 bg-bg border-y border-border';

  const branchLocationLabel =
    item?.location || item?.city || item?.destination || '';

  const detailPath = item?.detailPath || (item?.slug ? `/branches/${item.slug}` : '/branches');

  return (
    <section
      id="main-solara-sanctuary"
      className={sectionClass}
      aria-labelledby="main-solara-heading"
    >
      <div className={embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className="mb-8">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
            {t('home.sanctuaries.flagshipTag', 'Flagship Sanctuary Spotlight')}
          </span>
          <p className="text-sm text-muted max-w-2xl leading-relaxed">
            {t(
              'home.sanctuaries.flagshipSubtitle',
              'Our premier estate and its finest quarters — live rates, imagery, and amenities from the catalog.'
            )}
          </p>
        </div>

        {error && (
          <ErrorState
            message={error}
            onRetry={onRetry}
            title={t('home.sanctuaries.flagshipError', 'Unable to load flagship sanctuary')}
          />
        )}

        {loading && !error && <FlagshipSkeleton />}

        {!loading && !error && !item && (
          <p className="text-sm text-muted text-center py-8">
            {t('home.sanctuaries.noFlagship', 'Flagship sanctuary will appear when branches are published.')}
          </p>
        )}

        {!loading && !error && item && (
          <>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-2">
                  {t('mainSolara.badge', 'Flagship Estate')}
                </span>
                <h2
                  id="main-solara-heading"
                  className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-tight"
                >
                  {item.name}
                </h2>
                {item.tagline && (
                  <p className="text-sm text-gold font-medium mt-1">{item.tagline}</p>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-muted max-w-lg leading-relaxed">{item.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
              <div className="lg:col-span-3 rounded-[var(--radius-card)] overflow-hidden border border-border shadow-lg aspect-[16/10] lg:aspect-auto lg:min-h-[320px] relative bg-slate-900">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={item.name}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                    {t('catalog.noImage', 'Image not provided')}
                  </div>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="lg:col-span-2 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                  {gallery.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setHeroImage(src)}
                      className={`shrink-0 w-28 lg:w-full aspect-[4/3] rounded-[var(--radius-button)] overflow-hidden border-2 transition-all cursor-pointer ${
                        heroImage === src
                          ? 'border-gold opacity-100'
                          : 'border-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
                <MapPin className="w-4 h-4 text-gold" />
                <p className="font-medium text-text">{item.location}</p>
                {item.address && <p>{item.address}</p>}
              </div>
              <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
                <Clock className="w-4 h-4 text-gold" />
                <p>
                  {t('catalog.checkIn', 'Check-in')} {item.checkinTime} · {t('catalog.checkOut', 'Check-out')}{' '}
                  {item.checkoutTime}
                </p>
              </div>
              <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
                <Phone className="w-4 h-4 text-gold" />
                <p>{item.contactPhone || '—'}</p>
              </div>
              <div className="p-4 rounded-[var(--radius-card)] bg-surface border border-border text-xs text-muted space-y-2">
                <Mail className="w-4 h-4 text-gold" />
                <p className="truncate">{item.contactEmail || '—'}</p>
              </div>
            </div>

            {(item.amenities?.length ?? 0) > 0 && (
              <div className="mb-12">
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-3">
                  {t('branches.amenities', 'Branch Features & Inclusions')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {item.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-button)] bg-surface border border-border/60 text-xs text-text"
                    >
                      <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-1">
                    {t('rooms.allQuarters', 'Private Accommodations')}
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-text flex items-center gap-2">
                    <BedDouble className="w-6 h-6 text-gold" />
                    {t('mainSolara.roomsTitle', 'Sanctuary quarters')} — {item.name}
                  </h3>
                  <p className="text-xs text-muted mt-1 max-w-xl">
                    {t(
                      'mainSolara.showcaseNote',
                      'Live inventory and nightly rates from our catalog — reserve directly when you are ready.'
                    )}
                  </p>
                </div>
                <CatalogNightlyPrice
                  salePrice={item.startingPrice}
                  listPrice={item.hasStartingDiscount ? item.startingPriceOriginal : undefined}
                  discountPercent={item.startingPriceDiscountPercent}
                  currency={currency}
                  size="md"
                  align="end"
                />
              </div>

              {rooms.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">
                  {t('home.sanctuaries.noRooms', 'Rooms for this sanctuary will appear when published.')}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch auto-rows-fr">
                  {roomPagination.items.map((room) => (
                    <MainSolaraRoomTile
                      key={room.id}
                      room={room}
                      currency={currency}
                      branchLocation={branchLocationLabel}
                      onExplore={() => navigate(`/room/${room.id}`)}
                    />
                  ))}
                </div>
              )}

              {roomPagination.showPagination && (
                <Pagination
                  className="pt-8"
                  page={roomPagination.page}
                  totalPages={roomPagination.totalPages}
                  onPageChange={setRoomPage}
                />
              )}

              <div className="mt-10 flex flex-wrap gap-3 justify-center">
                <Button variant="gold" size="md" onClick={() => navigate(detailPath)}>
                  {t('home.sanctuaries.viewFlagship', 'Explore This Sanctuary')}
                </Button>
                <Button variant="outline" size="md" onClick={() => navigate('/rooms')}>
                  {t('home.exploreAllRooms', 'Explore All Rooms')}
                </Button>
                <Button variant="outline" size="md" onClick={() => navigate('/branches')}>
                  {t('home.viewAllResorts', 'View All Solara Sanctuaries')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default MainsolaraResort;
