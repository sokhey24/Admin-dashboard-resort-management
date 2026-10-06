import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRight, Clock, BedDouble, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { CatalogNightlyPrice } from '../catalog/CatalogNightlyPrice.jsx';
import { FavoriteButton } from '../catalog/FavoriteButton.jsx';

export const BranchCard = ({ branch, featured = false }) => {
  const navigate = useNavigate();
  const { currency, t, localize, language } = useApp();
  const item = localize ? localize(branch) : branch;

  const detailPath = item.detailPath || `/branches/${item.slug || item.id}`;

  return (
    <div
      className={`group bg-surface border border-border hover:border-gold/60 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full w-full ${
        featured ? 'lg:col-span-2 md:flex-row' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden bg-slate-900 shrink-0 ${
          featured ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'aspect-[16/10] w-full'
        }`}
      >
        {item.featuredImage ? (
          <img
            src={item.featuredImage}
            alt={item.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-muted px-4 text-center">
            {t('catalog.noImage', 'Image not provided')}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/20" />

        {/* Location / City Badge */}
        <div className="absolute top-3.5 left-3.5 bg-slate-950/80 backdrop-blur-md text-gold-light border border-gold/40 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded">
          {item.city || item.destination || 'Solara Location'}
        </div>

        <div className="absolute top-3.5 right-3.5 z-10">
          <FavoriteButton kind="resort" id={item.id} size="sm" />
        </div>

        {/* Guest Rating Badge */}
        {(item.rating ?? 0) > 0 && (
          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs text-white border border-white/10">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="font-semibold">{Number(item.rating).toFixed(2)}</span>
            <span className="text-slate-400 text-[11px]">({item.reviewsCount ?? 0})</span>
          </div>
        )}

        {/* Operating Hours Tag */}
        <div className="absolute bottom-3.5 right-3.5 hidden sm:flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 border border-white/10">
          <Clock className="w-3 h-3 text-gold" />
          <span>In {item.checkinTime || '14:00'} · Out {item.checkoutTime || '12:00'}</span>
        </div>
      </div>

      <div className={`p-6 flex flex-col flex-1 min-h-0 ${featured ? 'md:w-1/2' : ''}`}>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-1.5 text-xs text-muted mb-2 min-h-[1.125rem]">
            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="truncate">{item.location || item.address || '\u00a0'}</span>
          </div>

          <h3 className="text-xl font-semibold font-serif text-text group-hover:text-gold transition-colors tracking-tight line-clamp-1 mb-2 min-h-[1.75rem]">
            <Link to={detailPath}>{item.name}</Link>
          </h3>

          <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
            {item.description || '\u00a0'}
          </p>

          {/* Key Amenities — fixed block height so cards align in the grid */}
          <div className="flex flex-wrap items-start content-start gap-x-2 gap-y-1.5 text-[11px] text-text-secondary mb-4 min-h-[3.75rem]">
            {(item.amenities || []).slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-elevated/70 border border-border/80 text-[10px]"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-gold shrink-0" />
                <span>{amenity}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4 min-h-[1.25rem]">
            {(item.roomsCount ?? 0) > 0 ? (
              <>
                <BedDouble className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>
                  {item.roomsCount} {language === 'km' ? 'បន្ទប់ស្នាក់នៅ' : 'villas & quarters at this branch'}
                </span>
              </>
            ) : (
              <span className="invisible select-none" aria-hidden>
                —
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end mt-auto shrink-0">
          <div className="min-h-[4.75rem] flex flex-col justify-end">
            {item.startingPrice > 0 ? (
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">
                  {t('common.from', 'From')}
                </span>
                <CatalogNightlyPrice
                  salePrice={item.startingPrice}
                  listPrice={item.startingPriceOriginal}
                  discountPercent={item.startingPriceDiscountPercent}
                  currency={currency}
                  size="sm"
                />
              </div>
            ) : (
              <span className="text-xs text-muted">{t('catalog.ratesOnRequest', 'Rates on request')}</span>
            )}
          </div>

          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate(detailPath)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
            className="w-full sm:w-auto sm:max-w-[11.5rem] font-medium text-xs shadow-sm hover:shadow-md whitespace-normal sm:whitespace-nowrap text-center"
          >
            {t('branches.exploreRoomsAtBranch', 'Explore Rooms at this Branch')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BranchCard;
