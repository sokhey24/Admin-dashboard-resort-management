import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Star, RotateCcw, MapPin, Sparkles } from 'lucide-react';
import { HeroSection } from '../../components/ui/HeroSection.jsx';
import { BranchCard } from '../../components/branch/BranchCard.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { ResortCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { formatCurrency } from '../../util/currency.js';
import { useApp } from '../../context/AppContext.jsx';
import {
  BRANCHES_PAGE_SIZE,
  useSearchDestinationOptions,
  useResortSearchResults,
} from '../../hooks/useSearch.js';
import { SearchWidget } from '../../features/search/components/SearchWidget.jsx';
import { SearchStayNotice } from '../../features/search/components/SearchStayNotice.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { usePaginationMeta } from '../../hooks/useCatalog.js';
import {
  applyDestinationRegionParams,
  applySanctuaryTypeParams,
  sanctuaryRegionFromCriteria,
  sanctuaryRegionMatches,
} from '../../util/searchParams.js';
import {
  SANCTUARY_TYPE_PILLS,
  resolveActiveSanctuaryType,
  isSanctuaryTypePillActive,
} from '../../util/sanctuaryTypes.js';
import heroImage from '../../assets/images/hero_solara_resort_1790692958491.jpg';
import { StaggerItem } from '../../components/motion/StaggerItem.jsx';
import { RevealOnScroll } from '../../components/motion/RevealOnScroll.jsx';
import {
  BRANCH_LIST_GRID_CLASS,
  BRANCH_LIST_SKELETON_IMAGE_CLASS,
} from '../../constants/branchCardLayout.js';

export const BranchesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currency, t, language } = useApp();

  const sortParam = searchParams.get('sort') || 'recommended';
  const maxPriceParam = Number(searchParams.get('maxPrice')) || 1000;
  const ratingParam = Number(searchParams.get('minRating')) || 0;

  const [sort, setSort] = useState(sortParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [minRating, setMinRating] = useState(ratingParam);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const {
    criteria,
    resorts: filteredBranches,
    total,
    meta,
    status,
    error,
    reload,
  } = useResortSearchResults({ page, sort, maxPrice, minRating });

  const { page: currentPage, lastPage, total: totalFromApi, perPage } = usePaginationMeta(meta);
  const { destinationOptions: filterDestinationOptions, branchOptions } =
    useSearchDestinationOptions();

  const activeRegion = useMemo(
    () => sanctuaryRegionFromCriteria(criteria, branchOptions),
    [criteria, branchOptions]
  );

  const activeSanctuaryType = useMemo(() => resolveActiveSanctuaryType(criteria), [criteria]);

  const showingAllBranches =
    !criteria.branchId && !criteria.destination && !criteria.region;

  const destinationOptions = useMemo(
    () => [
      {
        value: '',
        label: t('search.allDestinations', 'All Locations & Branches'),
        count: totalFromApi || total || filteredBranches.length,
      },
      ...filterDestinationOptions
        .filter((opt) => opt.value !== '')
        .map((opt) => ({
          ...opt,
          count: opt.count ?? 0,
        })),
    ],
    [filterDestinationOptions, filteredBranches.length, total, totalFromApi, t]
  );

  const resultsSummary = useMemo(() => {
    if (status === 'loading') {
      return t('search.loadingResults', 'Locating sanctuaries…');
    }
    const totalCount = totalFromApi || total || filteredBranches.length;
    if (totalCount === 0) {
      return language === 'km' ? 'គ្មានសាខា' : 'No branches to show';
    }
    const pageSize = perPage || BRANCHES_PAGE_SIZE;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    if (language === 'km') {
      return `បង្ហាញ ${start}–${end} នៃ ${totalCount} សាខា`;
    }
    return `Showing ${start}–${end} of ${totalCount} branches`;
  }, [
    status,
    totalFromApi,
    total,
    filteredBranches.length,
    perPage,
    currentPage,
    language,
    t,
  ]);

  useEffect(() => {
    setSort(sortParam);
    setMaxPrice(maxPriceParam);
    setMinRating(ratingParam);
    setPage(1);
  }, [
    sortParam,
    maxPriceParam,
    ratingParam,
    criteria.destination,
    criteria.region,
    criteria.branchId,
    criteria.checkIn,
    criteria.checkOut,
  ]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setSort('recommended');
    setMaxPrice(1000);
    setMinRating(0);
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const syncDestinationFilter = (destination) => {
    setPage(1);
    const next = applyDestinationRegionParams(searchParams, destination || '');
    if (destination) {
      next.delete('region');
    }
    setSearchParams(next);
  };

  const syncSanctuaryTypeFilter = (typeId) => {
    setPage(1);
    setSearchParams(applySanctuaryTypeParams(searchParams, typeId || ''));
  };

  const isSidebarOptionActive = (opt) => {
    if (!opt.value) {
      return showingAllBranches;
    }
    if (criteria.branchId) {
      return false;
    }
    return (
      criteria.destination === opt.value ||
      sanctuaryRegionMatches(opt.value, criteria.destination)
    );
  };

  return (
    <div className="w-full pb-24">
      <HeroSection
        image={heroImage}
        badge={t('brand.name', 'SOLARA RESORT & SPA')}
        title={t('branches.pageTitle', 'Our Luxury Sanctuaries & Locations')}
        subtitle={t(
          'branches.pageSubtitle',
          'Explore our bespoke branches across Cambodia—from private island shores in Koh Rong to heritage pavilions in Siem Reap and mist-kissed highlands in Kampot.'
        )}
        heightClass="min-h-[460px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <SearchWidget />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-[var(--radius-card)] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 px-0.5 text-xs font-semibold text-gold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('branches.sanctuaryTypeTitle', 'Sanctuary Type / Region')}</span>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label={t('branches.sanctuaryTypeTitle', 'Sanctuary Type / Region')}
          >
            {SANCTUARY_TYPE_PILLS.map((pill) => {
              const isSelected = isSanctuaryTypePillActive(pill.id, criteria);
              return (
                <button
                  key={pill.id || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => syncSanctuaryTypeFilter(pill.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-gold/15 border-gold text-gold shadow-sm'
                      : 'bg-surface border-border text-muted hover:border-gold/40 hover:text-text'
                  }`}
                >
                  {t(pill.labelKey, pill.defaultLabel)}
                </button>
              );
            })}
          </div>

          {activeRegion && (
            <p className="mt-3 text-[11px] text-muted flex items-center gap-1.5 px-0.5">
              <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>
                {t('branches.filteredByDestination', 'Filtered by location')}:{' '}
                <span className="text-text font-medium">{activeRegion}</span>
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <SearchStayNotice criteria={criteria} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-border">
          <div>
            <h2 className="text-2xl font-serif font-bold text-text">
              {criteria.branchId
                ? t('branches.filteredBranch', 'Selected branch')
                : activeRegion
                  ? `${t('branches.titleInRegionPrefix', 'Sanctuaries in')} ${activeRegion}`
                  : activeSanctuaryType
                    ? t(
                        SANCTUARY_TYPE_PILLS.find((p) => p.id === activeSanctuaryType)?.labelKey ||
                          'branches.sanctuaryTypeAll',
                        SANCTUARY_TYPE_PILLS.find((p) => p.id === activeSanctuaryType)?.defaultLabel ||
                          'All Sanctuaries'
                      )
                    : t('branches.allBranchesTitle', 'All Solara Resort Branches')}
            </h2>
            <p className="text-xs text-muted mt-0.5">{resultsSummary}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-[var(--radius-button)] bg-surface border border-border text-xs text-text cursor-pointer"
            >
              <Filter className="w-4 h-4 text-gold" />
              <span>{t('resorts.filterTitle', 'Filters')}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted hidden sm:inline">{t('resorts.sort', 'Sort')}:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  updateParam('sort', e.target.value);
                }}
                className="bg-surface border border-border text-text text-xs rounded-[var(--radius-button)] px-3 py-2 focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="recommended">{t('resorts.recommended', 'Recommended')}</option>
                <option value="price-asc">{t('resorts.priceAsc', 'Price: Low to High')}</option>
                <option value="price-desc">{t('resorts.priceDesc', 'Price: High to Low')}</option>
                <option value="rating">{t('resorts.ratingDesc', 'Highest Guest Rating')}</option>
              </select>
            </div>
          </div>
        </div>

        {status === 'error' && (
          <ErrorState
            title={t('resorts.loadErrorTitle', 'Unable to load branches')}
            message={error}
            onRetry={reload}
          />
        )}

        {status === 'loading' && (
          <div className={BRANCH_LIST_GRID_CLASS}>
            {Array.from({ length: BRANCHES_PAGE_SIZE }, (_, i) => (
              <ResortCardSkeleton key={i} imageClassName={BRANCH_LIST_SKELETON_IMAGE_CLASS} />
            ))}
          </div>
        )}

        {(status === 'results' || status === 'empty') && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6 lg:col-span-1`}>
              <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text font-serif">
                    {t('branches.filterTitle', 'Filter Branches')}
                  </span>
                  {(!showingAllBranches || minRating > 0 || maxPrice < 1000) && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs text-gold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('common.reset', 'Reset')}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-text block">
                    {t('search.destination', 'Branch / Location')}
                  </label>
                  <div className="space-y-1.5 text-xs text-text-secondary">
                    {destinationOptions.map((opt) => (
                      <button
                        key={opt.value || 'all'}
                        type="button"
                        onClick={() => syncDestinationFilter(opt.value)}
                        className={`w-full text-left px-2.5 py-1.5 rounded transition-colors flex items-center justify-between cursor-pointer ${
                          isSidebarOptionActive(opt)
                            ? 'bg-gold/15 text-gold font-medium border border-gold/30'
                            : 'hover:bg-surface-hover text-muted hover:text-text'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {opt.count != null && (
                          <span className="text-[11px] opacity-70 shrink-0">{opt.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text">{t('resorts.budget', 'Nightly Budget')}</span>
                    <span className="text-gold font-semibold font-serif">
                      {t('rooms.upTo', 'Up to')} {formatCurrency(maxPrice, currency)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1000"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value));
                      updateParam('maxPrice', e.target.value);
                    }}
                    className="w-full accent-gold cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5 pt-4 border-t border-border">
                  <label className="text-xs font-medium text-text block">
                    {t('resorts.minRating', 'Minimum Rating')}
                  </label>
                  <div className="space-y-1.5">
                    {[0, 4.8, 4.9, 4.95].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          setMinRating(rate);
                          updateParam('minRating', rate > 0 ? String(rate) : '');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                          minRating === rate
                            ? 'bg-gold/15 text-gold font-medium border border-gold/30'
                            : 'hover:bg-surface-hover text-muted hover:text-text'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                        <span>
                          {rate === 0
                            ? t('resorts.anyRating', 'Any Rating')
                            : `${rate}+ ${t('resorts.stars', 'Stars')}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <main className="lg:col-span-3 space-y-6">
              {status === 'empty' ? (
                <EmptyState
                  title={t('resorts.noFoundTitle', 'No Branches Match Your Criteria')}
                  description={t(
                    'resorts.noFoundDesc',
                    "We couldn't find any branches matching your current filters. Try resetting your search parameters."
                  )}
                  actionText={t('resorts.resetAll', 'Reset All Filters')}
                  onAction={handleClearFilters}
                />
              ) : (
                <RevealOnScroll className={BRANCH_LIST_GRID_CLASS}>
                  {filteredBranches.map((branch, index) => (
                    <StaggerItem key={branch.id} index={index}>
                      <BranchCard branch={branch} variant="list" />
                    </StaggerItem>
                  ))}
                </RevealOnScroll>
              )}

              {status === 'results' && lastPage > 1 && (
                <Pagination
                  className="pt-8 border-t border-border"
                  page={currentPage}
                  totalPages={lastPage}
                  onPageChange={(next) => {
                    setPage(next);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchesPage;
