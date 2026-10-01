import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { CatalogNightlyPrice } from '../catalog/CatalogNightlyPrice.jsx';
import { FavoriteButton } from '../catalog/FavoriteButton.jsx';

export const ResortCard = ({ resort, featured = false }) => {
  const navigate = useNavigate();
  const { currency, t, localize } = useApp();
  const item = localize ? localize(resort) : resort;

  const detailPath = item.detailPath || `/branch/${item.id}`;

  return (
    <div
      className={`group bg-surface border border-border hover:border-gold/50 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

        {item.badge && (
          <div className="absolute top-3.5 left-3.5 bg-slate-950/80 backdrop-blur-md text-gold-light border border-gold/40 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded">
            {item.badge}
          </div>
        )}

        <div className="absolute top-3.5 right-3.5 z-10">
          <FavoriteButton kind="resort" id={item.id} size="sm" />
        </div>

        {(item.reviewsCount ?? 0) > 0 && (
          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs text-white border border-white/10">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="font-semibold">{Number(item.rating || 0).toFixed(2)}</span>
            <span className="text-slate-400 text-[11px]">({item.reviewsCount})</span>
          </div>
        )}
      </div>

      <div className={`p-6 flex flex-col justify-between flex-1 ${featured ? 'md:w-1/2' : ''}`}>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>

          <h3 className="text-xl font-semibold font-serif text-text group-hover:text-gold transition-colors tracking-tight line-clamp-1 mb-2">
            <Link to={detailPath}>{item.name}</Link>
          </h3>

          <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-secondary/80 mb-6">
            {(item.amenities || []).slice(0, 3).map((amenity, idx) => (
              <React.Fragment key={amenity}>
                <span>{amenity}</span>
                {idx < 2 && <span className="text-muted/40 font-bold">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between gap-4 mt-auto">
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(detailPath)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {t('common.explore', 'Explore')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
