import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRight, Clock, BedDouble, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { CatalogNightlyPrice } from '../catalog/CatalogNightlyPrice.jsx';
import { FavoriteButton } from '../catalog/FavoriteButton.jsx';
import { formatCurrency } from '../../util/currency.js';
import { BRANCH_LIST_CARD_IMAGE_CLASS } from '../../constants/branchCardLayout.js';

function branchDetailPath(branch) {
  const slug = branch?.slug ?? branch?.id;
  return slug ? `/branches/${slug}` : '/branches';
}

/** @param {'default' | 'list'} variant — `list` = larger Our Resorts grid (see branchCardLayout.js). */
export const BranchCard = ({ branch, featured = false, variant = 'default' }) => {
  const isList = variant === 'list' && !featured;
  const navigate = useNavigate();
  const { currency, t, localize, language } = useApp();
  const item = localize ? localize(branch) : branch;

  const detailPath = branchDetailPath(item);
  const cityLabel = item.city || item.destination || '';
  const checkIn = item.checkinTime || '14:00';
  const checkOut = item.checkoutTime || '12:00';
  const totalRooms = Number(item.roomsCount ?? 0);
  const availableRooms = Number(item.availableRoomsCount ?? 0);
  const discountPercent = Number(item.startingPriceDiscountPercent ?? 0);
  const hasDiscount =
    Boolean(item.hasStartingDiscount) || (discountPercent > 0 && item.startingPrice > 0);
  const displayDiscountPercent =
    discountPercent > 0
      ? Math.round(discountPercent)
      : item.hasStartingDiscount && item.startingPriceOriginal > item.startingPrice
        ? Math.round(
            ((item.startingPriceOriginal - item.startingPrice) / item.startingPriceOriginal) * 100
          )
        : 0;

  const specialOfferLabel =
    displayDiscountPercent > 0
      ? t('branches.specialOfferUpTo', 'Special Offer · Up to {percent}% OFF').replace(
          '{percent}',
          String(displayDiscountPercent)
        )
      : '';

  const roomsLine =
    availableRooms > 0
      ? language === 'km'
        ? `${availableRooms} បន្ទប់ទំនេរពី ${totalRooms || availableRooms}`
        : `${availableRooms} available · ${totalRooms || availableRooms} quarters`
      : totalRooms > 0
        ? language === 'km'
          ? `${totalRooms} បន្ទប់ស្នាក់នៅ`
          : `${totalRooms} villas & quarters`
        : '';

  return (
    <div
      className={`group bg-surface border border-border hover:border-gold/60 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full w-full ${
        featured ? 'lg:col-span-2 md:flex-row' : ''
      }`}
    >
      <Link
        to={detailPath}
        className={`relative overflow-hidden bg-slate-900 shrink-0 block ${
          featured
            ? 'md:w-1/2 aspect-[16/10] md:aspect-auto md:min-h-[240px]'
            : isList
              ? BRANCH_LIST_CARD_IMAGE_CLASS
              : 'aspect-[16/10] w-full'
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
          <div className="w-full h-full min-h-[10rem] flex items-center justify-center text-[11px] text-muted px-4 text-center">
            {t('catalog.noImage', 'Image not provided')}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/20 pointer-events-none" />

        {cityLabel && (
          <div className="absolute top-3.5 left-3.5 bg-slate-950/80 backdrop-blur-md text-gold-light border border-gold/40 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded">
            {cityLabel}
          </div>
        )}

        <div className="absolute top-3.5 right-3.5 z-10 pointer-events-auto">
          <FavoriteButton kind="resort" id={item.id} size="sm" />
        </div>

        {hasDiscount && displayDiscountPercent > 0 && specialOfferLabel && (
          <div
            className={`absolute z-[5] max-w-[calc(100%-2rem)] pointer-events-none ${
              cityLabel ? 'top-12 left-3.5 sm:top-3.5 sm:left-auto sm:right-14' : 'top-3.5 right-14'
            }`}
          >
            <span
              className="inline-flex items-center gap-1 bg-emerald-500/90 text-white backdrop-blur-md px-2.5 py-1 rounded font-semibold text-[10px] tracking-wider uppercase shadow-lg border border-emerald-400/40"
            >
              <Sparkles className="w-3 h-3 shrink-0" aria-hidden />
              <span className="leading-tight">{specialOfferLabel}</span>
            </span>
          </div>
        )}

        {(item.rating ?? 0) > 0 && (
          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs text-white border border-white/10">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="font-semibold">{Number(item.rating).toFixed(2)}</span>
            <span className="text-slate-400 text-[11px]">({item.reviewsCount ?? 0})</span>
          </div>
        )}

        <div className="absolute bottom-3.5 right-3.5 hidden sm:flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 border border-white/10">
          <Clock className="w-3 h-3 text-gold" />
          <span>
            {t('catalog.checkIn', 'Check-in')} {checkIn} · {t('catalog.checkOut', 'Check-out')} {checkOut}
          </span>
        </div>
      </Link>

      <div
        className={`flex flex-col flex-1 min-h-0 ${isList ? 'p-7 sm:p-8' : 'p-6'} ${featured ? 'md:w-1/2' : ''}`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-start gap-1.5 text-xs text-muted mb-2">
            <MapPin className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
            <span className={isList ? 'line-clamp-2 leading-relaxed' : 'truncate'}>
              {item.location || item.address || '\u00a0'}
            </span>
          </div>

          <h3
            className={`font-semibold font-serif text-text group-hover:text-gold transition-colors tracking-tight mb-2 ${
              isList ? 'text-2xl line-clamp-2' : 'text-xl line-clamp-1 min-h-[1.75rem]'
            }`}
          >
            <Link to={detailPath}>{item.name}</Link>
          </h3>

          <p
            className={`text-muted leading-relaxed mb-4 ${
              isList ? 'text-sm line-clamp-4' : 'text-xs line-clamp-2 min-h-[2.5rem]'
            }`}
          >
            {item.description || '\u00a0'}
          </p>

          <div
            className={`flex flex-wrap items-start content-start gap-x-2 gap-y-1.5 text-text-secondary mb-4 ${
              isList ? 'text-xs' : 'text-[11px] min-h-[3.75rem]'
            }`}
          >
            {(item.amenities || []).slice(0, isList ? 6 : 4).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-elevated/70 border border-border/80 text-[10px]"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-gold shrink-0" />
                <span>{amenity}</span>
              </span>
            ))}
          </div>

          <div
            className={`flex items-start gap-1.5 text-slate-400 mb-4 ${isList ? 'text-xs' : 'text-[11px] min-h-[1.25rem]'}`}
          >
            {roomsLine && (
              <>
                <BedDouble className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {roomsLine}
                  {hasDiscount && (
                    <span className="text-emerald-400/90">
                      {' · '}
                      {t('branches.promoRatesAvailable', 'Promotional rates available')}
                    </span>
                  )}
                </span>
              </>
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
                {hasDiscount ? (
                  <CatalogNightlyPrice
                    salePrice={item.startingPrice}
                    listPrice={item.startingPriceOriginal}
                    discountPercent={displayDiscountPercent}
                    currency={currency}
                    size={isList ? 'md' : 'sm'}
                  />
                ) : (
                  <p
                    className={`font-serif font-bold text-gold ${isList ? 'text-2xl' : 'text-lg'}`}
                  >
                    {formatCurrency(item.startingPrice, currency)}
                    <span className="text-[11px] font-normal text-muted ml-1">
                      {t('common.perNight', '/ night')}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted">{t('catalog.ratesOnRequest', 'Rates on request')}</span>
            )}
          </div>

          <Button
            variant="gold"
            size={isList ? 'md' : 'sm'}
            onClick={() => navigate(detailPath)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
            className={`w-full sm:w-auto font-medium shadow-sm hover:shadow-md whitespace-normal sm:whitespace-nowrap text-center ${
              isList ? 'sm:max-w-[14rem] text-sm' : 'sm:max-w-[11.5rem] text-xs'
            }`}
          >
            {t('branches.exploreRoomsAtBranch', 'Explore Rooms at this Branch')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BranchCard;
