import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { HeroSection } from '../../components/ui/HeroSection.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';
import { useApp } from '../../context/AppContext.jsx';
import { GALLERY_CATEGORY_VALUES } from '../../data/galleryData.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { GalleryFilters } from '../../components/gallery/GalleryFilters.jsx';
import { GalleryCard } from '../../components/gallery/GalleryCard.jsx';
import { GalleryLightbox } from '../../components/gallery/GalleryLightbox.jsx';
import { GallerySkeleton, GALLERY_PAGE_SIZE } from '../../components/gallery/GallerySkeleton.jsx';
import { paginateItems } from '../../util/paginateList.js';
import { ListPagination } from '../../components/ui/ListPagination.jsx';
import { useGalleryPhotos } from '../../hooks/useCatalog.js';

const CATEGORY_I18N = {
  All: 'gallery.all',
  Resort: 'gallery.categoryResort',
  Rooms: 'gallery.categoryRooms',
  Dining: 'gallery.categoryDining',
  Wellness: 'gallery.categoryWellness',
  Pool: 'gallery.categoryPool',
  Nature: 'gallery.categoryNature',
  Experiences: 'gallery.categoryExperiences',
};

const CATEGORY_DEFAULTS = {
  All: 'All Collections',
  Resort: 'Resort',
  Rooms: 'Rooms',
  Dining: 'Dining',
  Wellness: 'Wellness',
  Pool: 'Pool',
  Nature: 'Nature',
  Experiences: 'Experiences',
};

export const GalleryPage = () => {
  const { t, localize, language } = useApp();
  const { photos, loading, error, reload } = useGalleryPhotos();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listPage, setListPage] = useState(1);
  const [activeImageId, setActiveImageId] = useState(null);

  const catalogEmpty = !loading && !error && photos.length === 0;

  const categories = useMemo(() => {
    const present = new Set(photos.map((item) => item.category).filter(Boolean));
    const known = GALLERY_CATEGORY_VALUES.filter((value) => value === 'All' || present.has(value));
    const extras = [...present]
      .filter((value) => !GALLERY_CATEGORY_VALUES.includes(value))
      .sort((a, b) => a.localeCompare(b));
    const values = extras.length || known.length > 1 ? [...known, ...extras] : ['All'];

    return values.map((value) => ({
      value,
      label: CATEGORY_I18N[value]
        ? t(CATEGORY_I18N[value], CATEGORY_DEFAULTS[value] || value)
        : value,
    }));
  }, [photos, t]);

  useEffect(() => {
    if (!categories.some((cat) => cat.value === selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return photos;
    return photos.filter((item) => item.category === selectedCategory);
  }, [photos, selectedCategory]);

  const filterEmpty = !catalogEmpty && filteredItems.length === 0;

  useEffect(() => {
    setListPage(1);
  }, [selectedCategory]);

  const galleryPagination = useMemo(
    () => paginateItems(filteredItems, listPage, GALLERY_PAGE_SIZE),
    [filteredItems, listPage]
  );

  useEffect(() => {
    if (listPage > galleryPagination.totalPages) {
      setListPage(galleryPagination.totalPages);
    }
  }, [listPage, galleryPagination.totalPages]);

  const pagedItems = galleryPagination.items;

  const activeIndex = useMemo(() => {
    if (!activeImageId) return -1;
    return filteredItems.findIndex((item) => item.id === activeImageId);
  }, [activeImageId, filteredItems]);

  const activeItem = activeIndex >= 0 ? filteredItems[activeIndex] : null;
  const activeDisplay = activeItem ? (localize ? localize(activeItem) : activeItem) : null;

  useEffect(() => {
    if (activeImageId && activeIndex < 0) {
      setActiveImageId(null);
    }
  }, [activeImageId, activeIndex]);

  const openLightbox = useCallback((item) => {
    setActiveImageId(item.id);
  }, []);

  const closeLightbox = useCallback(() => {
    setActiveImageId(null);
  }, []);

  const goPrevious = useCallback(() => {
    if (filteredItems.length === 0) return;
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const prev = (idx - 1 + filteredItems.length) % filteredItems.length;
    setActiveImageId(filteredItems[prev].id);
  }, [filteredItems, activeIndex]);

  const goNext = useCallback(() => {
    if (filteredItems.length === 0) return;
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const next = (idx + 1) % filteredItems.length;
    setActiveImageId(filteredItems[next].id);
  }, [filteredItems, activeIndex]);

  const scrollToGallery = () => {
    document.getElementById('gallery-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const counterLabel =
    activeIndex >= 0
      ? t('gallery.imageCounter', '{current} / {total}')
          .replace('{current}', String(activeIndex + 1))
          .replace('{total}', String(filteredItems.length))
      : '';

  return (
    <div className="w-full pb-24 overflow-x-hidden">
      <HeroSection
        image={MARKETING_IMAGES.hero}
        badge={t('gallery.badge', 'The Solara Collection')}
        title={t('gallery.heroTitle', 'A Visual Journey Through Solara')}
        subtitle={t(
          'gallery.heroSubtitle',
          'Explore the spaces, experiences, and moments that define the Solara Resort experience.'
        )}
        heightClass="min-h-[440px] sm:min-h-[480px] lg:min-h-[520px]"
      >
        <Button variant="gold" size="md" type="button" onClick={scrollToGallery} className="shadow-lg">
          {t('gallery.exploreCta', 'Explore the Collection')}
        </Button>
      </HeroSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
        <section className="text-center max-w-2xl mx-auto space-y-4 mb-10 sm:mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
            {t('gallery.introEyebrow', 'Photography')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-text tracking-tight">
            {t('gallery.introTitle', 'Moments Worth Remembering')}
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">
            {t(
              'gallery.introDesc',
              'Architecture bathed in golden light, serene wellness rituals, coastal dining, and guest experiences captured across our sanctuaries.'
            )}
          </p>
        </section>

        {loading ? (
          <GallerySkeleton />
        ) : error ? (
          <ErrorState
            title={t('gallery.errorTitle', 'Gallery unavailable')}
            message={error || t('gallery.loadError', 'Unable to load gallery.')}
            onRetry={reload}
            retryText={t('common.tryAgain', 'Try again')}
          />
        ) : catalogEmpty ? (
          <EmptyState
            title={t('gallery.emptyCatalogTitle', 'No photos yet')}
            description={t(
              'gallery.emptyCatalogDesc',
              'Resort photography will appear here once our team publishes the collection.'
            )}
          />
        ) : (
          <>
            {categories.length > 1 ? (
              <GalleryFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={(value) => {
                  setSelectedCategory(value);
                  setListPage(1);
                }}
                ariaLabel={t('gallery.filtersAria', 'Gallery collections')}
              />
            ) : null}

            {filterEmpty ? (
              <EmptyState
                title={t('gallery.emptyFilterTitle', 'No Images Found')}
                description={t('gallery.emptyFilterDesc', 'Try another collection.')}
                actionText={t('gallery.viewAllCollections', 'View All Collections')}
                onAction={() => setSelectedCategory('All')}
              />
            ) : (
              <div id="gallery-grid">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-auto">
                  {pagedItems.map((rawItem) => {
                    const display = localize ? localize(rawItem) : rawItem;
                    return (
                      <GalleryCard
                        key={rawItem.id}
                        item={rawItem}
                        display={display}
                        viewImageLabel={t('gallery.viewImage', 'View Image')}
                        onOpen={openLightbox}
                      />
                    );
                  })}
                </div>
                {galleryPagination.showPagination && (
                  <ListPagination
                    className="mt-8"
                    page={galleryPagination.page}
                    totalPages={galleryPagination.totalPages}
                    total={galleryPagination.total}
                    startIndex={galleryPagination.startIndex}
                    endIndex={galleryPagination.endIndex}
                    language={language}
                    onPageChange={(nextPage) => {
                      setListPage(nextPage);
                      document.getElementById('gallery-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <GalleryLightbox
        isOpen={Boolean(activeItem)}
        item={activeItem}
        display={activeDisplay}
        counterLabel={counterLabel}
        prevLabel={t('gallery.previousImage', 'Previous image')}
        nextLabel={t('gallery.nextImage', 'Next image')}
        onClose={closeLightbox}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </div>
  );
};
