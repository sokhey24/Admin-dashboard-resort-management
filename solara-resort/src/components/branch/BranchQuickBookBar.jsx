import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, BedDouble, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useBookingDraft } from '../../hooks/useBookingDraft.js';
import { addDaysToIsoDate } from '../../util/bookingAvailability.js';
import { defaultBranchStayDates } from '../../util/branchBooking.js';
import { getBranchRoomTypeFilterOptions } from './branchRoomFilters.js';

function QuickBookField({ icon: Icon, label, children, className = '' }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/70 bg-bg/40 hover:border-gold/35 transition-colors ${className}`}
    >
      <Icon className="w-4 h-4 text-gold shrink-0" strokeWidth={1.75} aria-hidden />
      <div className="flex-1 min-w-0 text-left">
        <span className="block text-[10px] uppercase tracking-wider text-muted leading-snug mb-0.5 truncate">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

const controlClass =
  'w-full bg-transparent text-sm font-semibold text-text focus:outline-none cursor-pointer [color-scheme:dark]';

export function BranchQuickBookBar({
  branchId,
  branchName = '',
  resortId,
  branchRooms = [],
  catalogRoomTypes = [],
  roomTypeFilter = 'all',
  onRoomTypeFilterChange,
  onApplyStay,
  className = '',
}) {
  const { t } = useApp();
  const { bookingDraft, updateBookingDraft } = useBookingDraft();

  const roomTypeOptions = useMemo(
    () =>
      getBranchRoomTypeFilterOptions(branchRooms, catalogRoomTypes, {
        branchId,
        resortId,
      }),
    [branchRooms, catalogRoomTypes, branchId, resortId]
  );

  const defaults = useMemo(() => defaultBranchStayDates(), []);

  const [checkIn, setCheckIn] = useState(bookingDraft.checkIn || defaults.checkIn);
  const [checkOut, setCheckOut] = useState(bookingDraft.checkOut || defaults.checkOut);
  const [adults, setAdults] = useState(bookingDraft.adults || 2);
  const [children, setChildren] = useState(bookingDraft.children ?? 0);
  const [roomsCount, setRoomsCount] = useState(bookingDraft.roomsCount || 1);
  const [roomType, setRoomType] = useState(roomTypeFilter);

  useEffect(() => {
    setRoomType(roomTypeFilter);
  }, [roomTypeFilter]);

  useEffect(() => {
    if (bookingDraft.checkIn) setCheckIn(bookingDraft.checkIn);
    if (bookingDraft.checkOut) setCheckOut(bookingDraft.checkOut);
    if (bookingDraft.adults) setAdults(bookingDraft.adults);
    if (bookingDraft.children != null) setChildren(bookingDraft.children);
    if (bookingDraft.roomsCount) setRoomsCount(bookingDraft.roomsCount);
  }, [
    bookingDraft.checkIn,
    bookingDraft.checkOut,
    bookingDraft.adults,
    bookingDraft.children,
    bookingDraft.roomsCount,
  ]);

  const handleCheckInChange = (value) => {
    setCheckIn(value);
    if (value && checkOut && value >= checkOut) {
      setCheckOut(addDaysToIsoDate(value, 2));
    }
  };

  const handleApply = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return;
    }

    updateBookingDraft({
      branchId: branchId ? Number(branchId) : null,
      branchName: branchName || '',
      checkIn,
      checkOut,
      adults,
      children,
      roomsCount,
    });

    onRoomTypeFilterChange?.(roomType);
    onApplyStay?.({
      checkIn,
      checkOut,
      adults,
      children,
      roomsCount,
      roomTypeFilter: roomType,
    });

    const target = document.getElementById('available-rooms');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <form
      onSubmit={handleApply}
      className={`bg-surface/90 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-3 ${className}`}
      aria-label={t('branches.quickBook.ariaLabel', 'Quick stay search')}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <QuickBookField icon={Calendar} label={t('branches.quickBook.stayDates', 'Check-in / Check-out')}>
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="date"
              value={checkIn}
              min={defaults.checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className={`${controlClass} min-w-0 flex-1`}
              aria-label={t('search.checkIn', 'Check-In')}
            />
            <span className="text-muted text-xs shrink-0">—</span>
            <input
              type="date"
              value={checkOut}
              min={checkIn ? addDaysToIsoDate(checkIn, 1) : defaults.checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className={`${controlClass} min-w-0 flex-1`}
              aria-label={t('search.checkOut', 'Check-Out')}
            />
          </div>
        </QuickBookField>

        <QuickBookField icon={Users} label={t('branches.quickBook.guestsRooms', 'Guests & Rooms')}>
          <div className="grid grid-cols-3 gap-1.5 min-w-0">
            <div className="relative min-w-0">
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className={`${controlClass} appearance-none pr-5 text-xs sm:text-sm`}
                aria-label={t('search.adults', 'Adults')}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n} className="bg-surface text-text">
                    {n} {t('search.adults', 'Adults')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
            </div>
            <div className="relative min-w-0">
              <select
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className={`${controlClass} appearance-none pr-5 text-xs sm:text-sm`}
                aria-label={t('search.childrenLabel', 'Children (under 12)')}
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n} className="bg-surface text-text">
                    {n} {t('search.children', 'Children')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
            </div>
            <div className="relative min-w-0">
              <select
                value={roomsCount}
                onChange={(e) => setRoomsCount(Number(e.target.value))}
                className={`${controlClass} appearance-none pr-5 text-xs sm:text-sm`}
                aria-label={t('search.room', 'Room')}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n} className="bg-surface text-text">
                    {n} {n === 1 ? t('search.room', 'Room') : t('search.rooms', 'Rooms')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
            </div>
          </div>
        </QuickBookField>

        <QuickBookField icon={BedDouble} label={t('branches.quickBook.roomType', 'Room type')}>
          <div className="relative">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className={`${controlClass} appearance-none pr-6`}
            >
              {roomTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface text-text">
                  {opt.value === 'all'
                    ? t('branches.quickBook.roomTypeAll', 'All room types')
                    : opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
        </QuickBookField>

        <Button type="submit" variant="gold" size="md" className="w-full md:h-full min-h-[52px] shadow-lg">
          {t('branches.quickBook.filterRooms', 'Filter Available Rooms')}
        </Button>
      </div>
    </form>
  );
}

export default BranchQuickBookBar;
