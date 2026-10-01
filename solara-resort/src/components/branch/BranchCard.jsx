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
      className={`group bg-surface border border-border hover:border-gold/60 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col ${
        featured ? 'lg:col-span-2 md:flex-row' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden bg-slate-900 ${
          featured ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'
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

      <div className={`p-6 flex flex-col justify-between flex-1 ${featured ? 'md:w-1/2' : ''}`}>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="truncate">{item.location || item.address}</span>
          </div>

          <h3 className="text-xl font-semibold font-serif text-text group-hover:text-gold transition-colors tracking-tight line-clamp-1 mb-2">
            <Link to={detailPath}>{item.name}</Link>
          </h3>

          <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>

          {/* Key Amenities */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-text-secondary mb-4">
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

          {/* Room count / inventory */}
          {(item.roomsCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4">
              <BedDouble className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>
                {item.roomsCount} {language === 'km' ? 'បន្ទប់ស្នាក់នៅ' : 'villas & quarters at this branch'}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
          <div>
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
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto font-medium text-xs shadow-sm hover:shadow-md"
          >
            {t('branches.exploreRoomsAtBranch', 'Explore Rooms at this Branch')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BranchCard;
