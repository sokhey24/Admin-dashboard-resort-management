import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, BedDouble, Maximize2, Eye, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { buildBookingPath } from '../../util/bookingSelection.js';
import { CatalogNightlyPrice } from '../catalog/CatalogNightlyPrice.jsx';
import { FavoriteButton } from '../catalog/FavoriteButton.jsx';

export const RoomCard = ({ room }) => {
  const navigate = useNavigate();
  const { currency, setRoomForBooking, addToast, t, localize, bookingDraft } = useApp();
  const item = localize ? localize(room) : room;

  const handleBookNow = () => {
    const parentResort = item.resortSnapshot || { id: item.resortId, name: item.resortName };
    setRoomForBooking(parentResort, item);
    addToast(`${t('toast.roomSelected', 'Selected for reservation')}: ${item.name}`, 'success');
    navigate(
      buildBookingPath({
        roomId: item.id,
        checkIn: bookingDraft.checkIn,
        checkOut: bookingDraft.checkOut,
        adults: bookingDraft.adults,
        children: bookingDraft.children,
        couponCode: bookingDraft.couponCode,
      })
    );
  };

  return (
    <div className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full w-full">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 shrink-0 w-full">
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        <div className="absolute top-3.5 left-3.5 bg-slate-950/80 backdrop-blur-md text-gold-light border border-gold/30 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded">
          {item.type}
        </div>

        <div className="absolute top-3.5 right-3.5 z-10">
          <FavoriteButton kind="room" id={item.id} size="sm" />
        </div>

        <div className="absolute bottom-3 left-3 text-xs text-slate-200 font-light truncate max-w-[80%]">
          {item.resortName}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-xl font-semibold font-serif text-text group-hover:text-gold transition-colors tracking-tight line-clamp-1 mb-2 min-h-[1.75rem]">
            <Link to={`/room/${item.id}`}>{item.name}</Link>
          </h3>

          <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
            {item.description || '\u00a0'}
          </p>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-3 my-3 border-y border-border/60 text-xs text-text-secondary">
            <div className="flex items-center gap-2 truncate">
              <Users className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>{t('rooms.upTo', 'Up to')} {item.capacity.adults + item.capacity.children} {t('search.guests', 'Guests')}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <BedDouble className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="truncate">{item.bedType}</span>
            </div>
            {item.sizeSqm > 0 && (
              <div className="flex items-center gap-2 truncate">
                <Maximize2 className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>{item.sizeSqm} m² / {Math.round(item.sizeSqm * 10.76)} ft²</span>
              </div>
            )}
            <div className="flex items-center gap-2 truncate">
              <Eye className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="truncate">{item.view}</span>
            </div>
          </div>

          <div className="space-y-1 my-3 min-h-[2.75rem]">
            {(item.amenities || []).slice(0, 2).map((amenity) => (
              <div key={amenity} className="flex items-center gap-2 text-xs text-muted">
                <CheckCircle2 className="w-3 h-3 text-gold/80 shrink-0" />
                <span className="truncate">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-auto shrink-0">
          <div className="min-h-[3.5rem] flex flex-col justify-end">
            <CatalogNightlyPrice
              salePrice={item.pricePerNight}
              listPrice={item.listPricePerNight}
              discountPercent={item.discountPercent}
              currency={currency}
              size="sm"
            />
            {item.pricePerNight > 0 && (
              <span className="text-[10px] text-muted block">
                {t('rooms.listedRate', 'Listed nightly rate — final price confirmed at booking')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/room/${item.id}`)}
            >
              {t('common.details', 'Details')}
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleBookNow}
            >
              {t('common.reserve', 'Reserve')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
