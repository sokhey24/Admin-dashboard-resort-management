import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeroSection } from '../components/ui/HeroSection.jsx';
import { RoomCard } from '../components/room/RoomCard.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { RoomCardSkeleton } from '../components/ui/Skeleton.jsx';
import { formatCurrency } from '../util/currency.js';
import { useApp } from '../context/AppContext.jsx';
import { usePaginationMeta, useRoomTypes, useRoomsList } from '../hooks/useCatalog.js';
import { useSearchCriteria } from '../hooks/useSearch.js';
import { roomCatalogParamsFromCriteria } from '../util/searchParams.js';
import { Pagination } from '../components/common/Pagination.jsx';
import villaImage from '../assets/images/villa_ocean_luxury_1790692975563.jpg';
import { StaggerItem } from '../components/motion/StaggerItem.jsx';

export const RoomsPage = () => {
  const [searchParams] = useSearchParams();
  const { currency, t, language } = useApp();

  const typeParam = searchParams.get('type') || '';
  const [selectedTypeId, setSelectedTypeId] = useState(typeParam);
  const [maxPrice, setMaxPrice] = useState(800);
  const [page, setPage] = useState(1);

  const criteria = useSearchCriteria();
  const { roomTypes, loading: typesLoading } = useRoomTypes({ per_page: 50 });

  const roomParams = useMemo(
    () =>
      roomCatalogParamsFromCriteria(criteria, {
        page,
        per_page: 12,
        ...(selectedTypeId ? { room_type_id: selectedTypeId } : {}),
      }),
    [page, selectedTypeId, criteria]
  );

  const { rooms, meta, loading, error, reload } = useRoomsList(roomParams);
  const { page: currentPage, lastPage, total } = usePaginationMeta(meta);

  const roomTypeOptions = useMemo(() => {
    const all = { value: '', label: t('rooms.allQuarters', 'All Quarters') };
    const fromApi = roomTypes.map((rt) => ({
      value: String(rt.id),
      label: rt.name,
    }));
    return [all, ...fromApi];
  }, [roomTypes, t]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => room.pricePerNight <= maxPrice);
  }, [rooms, maxPrice]);

  const maxPriceSlider = useMemo(() => {
    const peak = rooms.reduce((m, r) => Math.max(m, r.pricePerNight), 800);
    return Math.max(800, Math.ceil(peak / 50) * 50);
  }, [rooms]);

  return (
    <div className="w-full pb-24">
      <HeroSection
        image={villaImage}
        badge={t('rooms.allQuarters', 'Private Quarters')}
        title={t('rooms.pageTitle', 'Luxury Villas, Suites & Bungalows')}
        subtitle={t(
          'rooms.pageSubtitle',
          'Unsurpassed craftsmanship, private infinity pools, and expansive vistas designed for undisturbed tranquility.'
        )}
        heightClass="min-h-[440px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 mb-8 border-b border-border">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface border border-border rounded-[var(--radius-button)]">
            {roomTypeOptions.map((opt) => (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => {
                  setSelectedTypeId(opt.value);
                  setPage(1);
                }}
                disabled={typesLoading && opt.value}
                className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  selectedTypeId === opt.value
                    ? 'bg-gold text-slate-950 font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs w-full md:w-auto">
            <span className="text-muted shrink-0">{t('resorts.budget', 'Budget')}:</span>
            <input
              type="range"
              min="50"
              max={maxPriceSlider}
              step="50"
              value={Math.min(maxPrice, maxPriceSlider)}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-gold cursor-pointer w-36"
            />
            <span className="font-serif font-bold text-gold shrink-0">
              {t('rooms.upTo', 'Up to')} {formatCurrency(maxPrice, currency)}
            </span>
          </div>
        </div>

        {error && (
          <ErrorState
            title={t('rooms.loadErrorTitle', 'Unable to load rooms')}
            message={error}
            onRetry={reload}
          />
        )}

        {!error && loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </div>
        )}

        {!error && !loading && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs text-muted">
                {language === 'km'
                  ? `បង្ហាញបន្ទប់ និងវីឡាចំនួន ${filteredRooms.length}`
                  : `Displaying ${filteredRooms.length} on this page · ${total || rooms.length} total`}
              </p>
              {selectedTypeId && (
                <button
                  onClick={() => setSelectedTypeId('')}
                  className="text-xs text-gold hover:underline cursor-pointer"
                >
                  {t('common.reset', 'Clear Type Filter')}
                </button>
              )}
            </div>

            {filteredRooms.length === 0 ? (
              <EmptyState
                title={t('resorts.noFoundTitle', 'No Accommodations Found')}
                description={t(
                  'resorts.noFoundDesc',
                  'No villas or suites match your selected type and budget. Try broadening your criteria.'
                )}
                actionText={t('common.reset', 'Reset filters')}
                onAction={() => {
                  setSelectedTypeId('');
                  setMaxPrice(maxPriceSlider);
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch auto-rows-fr">
                {filteredRooms.map((room, index) => (
                  <StaggerItem key={room.id} index={index}>
                    <RoomCard room={room} />
                  </StaggerItem>
                ))}
              </div>
            )}

            {lastPage > 1 && (
              <Pagination
                className="pt-10"
                page={currentPage}
                totalPages={lastPage}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
