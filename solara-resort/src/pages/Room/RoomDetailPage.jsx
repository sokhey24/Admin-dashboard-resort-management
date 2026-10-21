import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMotionPresets } from '../../motion/useMotionPresets.js';
import {
  Users,
  BedDouble,
  Maximize2,
  Eye,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { PageSkeleton } from '../../components/ui/Skeleton.jsx';
import { CatalogNightlyPrice } from '../../components/catalog/CatalogNightlyPrice.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useRoomDetail } from '../../hooks/useCatalog.js';
import { buildBookingPath, validateBookingStay } from '../../util/bookingSelection.js';
import { normalizeRoomIds } from '../../util/roomIds.js';
import { FavoriteButton } from '../../components/catalog/FavoriteButton.jsx';
import { RoomRelated } from '../../related/RoomRelated.jsx';

export const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reduced, transition, duration } = useMotionPresets();
  const {
    currency,
    setRoomForBooking,
    addRoomToStay,
    bookingDraft,
    updateBookingDraft,
    addToast,
    t,
    language,
  } = useApp();

  const { room, loading, error, reload } = useRoomDetail(id);

  const [checkIn, setCheckIn] = useState(bookingDraft.checkIn || '');
  const [checkOut, setCheckOut] = useState(bookingDraft.checkOut || '');
  const [guestsCount, setGuestsCount] = useState(bookingDraft.adults || 2);
  const [activePhoto, setActivePhoto] = useState('');

  if (loading) {
    return (
      <div className="w-full pb-24 pt-24">
        <PageSkeleton />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="w-full pb-24 pt-28 max-w-3xl mx-auto px-4">
        <ErrorState
          title={t('rooms.detailErrorTitle', 'Room unavailable')}
          message={error || t('rooms.detailNotFound', 'This accommodation could not be found.')}
          onRetry={reload}
        />
        <div className="text-center mt-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/rooms')}>
            {t('rooms.backToRooms', 'Back to Accommodations')}
          </Button>
        </div>
      </div>
    );
  }

  const parentResort = room.resortSnapshot || { id: room.resortId, name: room.resortName };
  const gallery = [room.featuredImage, ...(room.gallery || [])].filter(
    (url, idx, arr) => url && arr.indexOf(url) === idx
  );
  const heroPhoto = activePhoto || gallery[0] || room.featuredImage;

  const existingRoomIds = normalizeRoomIds(bookingDraft);
  const roomAlreadySelected = existingRoomIds.includes(Number(room.id));
  const canAddToStay = existingRoomIds.length > 0 && !roomAlreadySelected;

  const handleReserve = () => {
    const validation = validateBookingStay({
      roomId: room.id,
      checkIn,
      checkOut,
      adults: guestsCount,
    });
    if (!validation.valid) {
      addToast(validation.message, 'error');
      return;
    }

    updateBookingDraft({
      checkIn,
      checkOut,
      adults: guestsCount,
    });
    setRoomForBooking(parentResort, room);
    addToast(`${t('toast.roomSelected', 'Selected for reservation')}: ${room.name}`, 'success');
    navigate(
      buildBookingPath({
        roomId: room.id,
        checkIn,
        checkOut,
        adults: guestsCount,
        children: bookingDraft.children,
        couponCode: bookingDraft.couponCode,
      })
    );
  };

  const handleAddToStay = () => {
    const validation = validateBookingStay({
      roomIds: [...existingRoomIds, room.id],
      checkIn,
      checkOut,
      adults: guestsCount,
    });
    if (!validation.valid) {
      addToast(validation.message, 'error');
      return;
    }
    updateBookingDraft({ checkIn, checkOut, adults: guestsCount });
    addRoomToStay(parentResort, room);
    addToast(
      t('booking.addedToStay', 'Added to your stay') + `: ${room.name}`,
      'success'
    );
    navigate('/booking');
  };

  return (
    <div className="w-full pb-24">
      <section className="pt-24 pb-8 bg-bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-muted mb-4">
            <Link to="/rooms" className="hover:text-gold transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('rooms.backToRooms', 'Back to Accommodations')}</span>
            </Link>
            <span>/</span>
            <Link to={`/resort/${parentResort.id}`} className="hover:text-gold transition-colors">
              {parentResort.name}
            </Link>
            <span>/</span>
            <span className="text-text">{room.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-gold bg-gold/15 px-2.5 py-0.5 rounded border border-gold/30">
                {room.type}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text tracking-tight mt-2">
                {room.name}
              </h1>
              <p className="text-xs text-muted mt-1">
                {parentResort.name} · {room.resortName}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <FavoriteButton kind="room" id={room.id} size="lg" />
              <div className="text-right">
                <span className="text-xs text-muted block mb-1">{t('rooms.directRate', 'Direct Rate')}</span>
                <CatalogNightlyPrice
                  salePrice={room.pricePerNight}
                  listPrice={room.listPricePerNight}
                  discountPercent={room.discountPercent}
                  currency={currency}
                  size="lg"
                  align="end"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="space-y-4">
          <div className="w-full aspect-[16/9] max-h-[500px] rounded-[var(--radius-card)] overflow-hidden bg-slate-950 border border-border shadow-lg relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={heroPhoto}
                src={heroPhoto}
                alt={room.name}
                className="w-full h-full object-cover absolute inset-0"
                initial={{ opacity: 0, scale: reduced ? 1 : 1.01 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={transition(duration.button)}
              />
            </AnimatePresence>
          </div>

          {gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhoto(img)}
                  className={`relative w-24 sm:w-32 aspect-[4/3] rounded-[var(--radius-button)] overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    heroPhoto === img
                      ? 'border-gold scale-102 shadow-md'
                      : 'border-border/60 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${room.name} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-surface border border-border rounded-[var(--radius-card)]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase text-muted tracking-wider">
                  {t('rooms.occupancy', 'Occupancy')}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                  <Users className="w-4 h-4 text-gold shrink-0" />
                  <span>
                    {t('rooms.upTo', 'Up to')} {room.capacity.adults + room.capacity.children}{' '}
                    {t('search.guests', 'Guests')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase text-muted tracking-wider">
                  {t('rooms.bedType', 'Bed Type')}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                  <BedDouble className="w-4 h-4 text-gold shrink-0" />
                  <span className="truncate">{room.bedType}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase text-muted tracking-wider">
                  {t('rooms.livingArea', 'Living Area')}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                  <Maximize2 className="w-4 h-4 text-gold shrink-0" />
                  <span>
                    {room.sizeSqm} m² / {Math.round(room.sizeSqm * 10.76)} ft²
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase text-muted tracking-wider">
                  {t('rooms.orientation', 'Orientation')}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                  <Eye className="w-4 h-4 text-gold shrink-0" />
                  <span className="truncate">{room.view}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                {t('rooms.theAccommodation', 'The Accommodation')}
              </span>
              <h3 className="text-2xl font-serif font-bold text-text">
                {t('rooms.designedSerenity', 'Designed for Serenity & Mindful Seclusion')}
              </h3>
              <p className="text-sm text-muted leading-relaxed font-light">{room.description}</p>
            </div>

            <div className="space-y-4 pt-8 border-t border-border">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                {t('rooms.features', 'Features & Privileges')}
              </span>
              <h3 className="text-xl font-serif font-semibold text-text">
                {t('resorts.featuresPrivileges', 'Villa Privileges Included in Your Stay')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(room.amenities || []).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-button)] bg-surface border border-border/60 text-xs text-text"
                  >
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-28 bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-muted block mb-1">{t('rooms.directRate', 'Direct Rate')}</span>
                  <CatalogNightlyPrice
                    salePrice={room.pricePerNight}
                    listPrice={room.listPricePerNight}
                    discountPercent={room.discountPercent}
                    currency={currency}
                    size="md"
                  />
                </div>
                {room.operationalStatus && (
                  <span className="text-[11px] text-gold font-medium bg-gold/10 px-2 py-0.5 rounded border border-gold/30 capitalize shrink-0">
                    {room.operationalStatus}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted font-medium block">
                      {t('search.checkIn', 'Check-In')}
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] px-2.5 py-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted font-medium block">
                      {t('search.checkOut', 'Check-Out')}
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] px-2.5 py-2 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted font-medium block">
                    {t('search.guestsRooms', 'Guests')}
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full bg-bg border border-border text-text rounded-[var(--radius-input)] px-2.5 py-2 text-xs focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value={1}>1 {t('search.guest', 'Guest')}</option>
                    <option value={2}>2 {t('search.guests', 'Guests')}</option>
                    <option value={3}>3 {t('search.guests', 'Guests')}</option>
                    <option value={4}>4 {t('search.guests', 'Guests')}</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-muted leading-relaxed pt-2 border-t border-border">
                {language === 'km'
                  ? 'តម្លៃសរុប ពន្ធ និងភាពអាចប្រើបាននឹងត្រូវបានបញ្ជាក់នៅពេលអ្នកបន្តទៅការកក់។'
                  : 'Taxes, fees, and final availability are confirmed when you continue to booking (authoritative quote).'}
              </p>

              {canAddToStay && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleAddToStay}
                >
                  {t('booking.addAnotherRoom', 'Add to current stay')}
                </Button>
              )}
              <Button
                variant="gold"
                size="lg"
                className="w-full shadow-md"
                onClick={handleReserve}
              >
                {roomAlreadySelected && existingRoomIds.length === 1
                  ? t('rooms.continueBooking', 'Continue booking')
                  : t('rooms.reserveRoom', 'Reserve This Accommodation')}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <RoomRelated room={room} />
    </div>
  );
};
