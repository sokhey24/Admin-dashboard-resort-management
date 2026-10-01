import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Calendar, Users, Search, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { applySearchCriteria, buildResortsSearchPath } from '../../util/searchParams.js';

function SearchField({ icon: Icon, label, children, className = '' }) {
  return (
    <div
      className={`flex flex-1 min-w-0 items-center gap-3 px-3.5 sm:px-4 py-3 rounded-xl border border-slate-600/70 bg-slate-900/50 hover:border-gold/45 transition-colors ${className}`}
    >
      <Icon className="w-5 h-5 text-gold shrink-0" strokeWidth={1.75} aria-hidden />
      <div className="flex-1 min-w-0 text-left">
        <span className="block text-[11px] sm:text-xs text-slate-400 leading-snug mb-0.5 truncate">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

const fieldControlClass =
  'w-full bg-transparent text-sm sm:text-[15px] font-semibold text-white focus:outline-none cursor-pointer';

export const SearchBar = ({
  initialBranchId = '',
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  initialChildren = 0,
  initialRooms = 1,
  onSearch,
  destinationOptions = [],
  branchOptions = [],
  destinationsLoading = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateBookingDraft, t } = useApp();

  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId ? String(initialBranchId) : '');
  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [children, setChildren] = useState(initialChildren);
  const [rooms, setRooms] = useState(initialRooms);

  useEffect(() => {
    setSelectedBranchId(initialBranchId ? String(initialBranchId) : '');
    setDestination(initialDestination);
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
    setGuests(initialGuests);
    setChildren(initialChildren);
    setRooms(initialRooms);
  }, [
    initialBranchId,
    initialDestination,
    initialCheckIn,
    initialCheckOut,
    initialGuests,
    initialChildren,
    initialRooms,
  ]);

  const handleBranchChange = (val) => {
    const foundBranch = (branchOptions.length > 0 ? branchOptions : []).find(
      (b) => String(b.value) === String(val) || String(b.branchId) === String(val)
    );
    if (foundBranch && foundBranch.branchId) {
      setSelectedBranchId(String(foundBranch.branchId));
      setDestination(foundBranch.destination || '');
    } else {
      setSelectedBranchId('');
      setDestination(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      branchId: selectedBranchId ? Number(selectedBranchId) : '',
      destination,
      checkIn,
      checkOut,
      guests,
      children,
      rooms,
      adults: guests,
    };

    updateBookingDraft({
      ...(selectedBranchId ? { branchId: Number(selectedBranchId) } : {}),
      checkIn,
      checkOut,
      adults: guests,
      children,
      roomsCount: rooms,
    });

    if (onSearch) {
      onSearch(payload);
      return;
    }

    const criteria = {
      branchId: selectedBranchId ? Number(selectedBranchId) : '',
      destination,
      checkIn,
      checkOut,
      adults: guests,
      children,
      rooms,
    };
    const next = applySearchCriteria(searchParams, criteria);
    navigate(buildBranchesSearchPath(criteria, next));
  };

  const optionsList = branchOptions.length > 0 ? branchOptions : destinationOptions;

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full rounded-2xl border border-slate-600/60 bg-[#0f1419]/92 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-2 sm:p-2.5 transition-all ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-2">
        <SearchField icon={MapPin} label={t('search.branchLocation', 'Select Branch / Location')}>
          <div className="relative flex items-center">
            <select
              value={selectedBranchId || destination}
              onChange={(e) => handleBranchChange(e.target.value)}
              disabled={destinationsLoading}
              className={`${fieldControlClass} appearance-none pr-7 disabled:opacity-60 truncate`}
            >
              <option value="" className="bg-slate-900 text-white">
                {t('search.allDestinations', 'All Branches / Locations')}
              </option>
              {optionsList
                .filter((opt) => opt.value)
                .map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
            </select>
            <ChevronDown className="absolute right-0 w-4 h-4 text-white/85 pointer-events-none shrink-0" aria-hidden />
          </div>
        </SearchField>

        <SearchField icon={Calendar} label={t('search.checkIn', 'Check-In')}>
          <div className="relative flex items-center">
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={`${fieldControlClass} pr-8 [color-scheme:dark]`}
            />
            <Calendar className="absolute right-0 w-3.5 h-3.5 text-slate-500 pointer-events-none" strokeWidth={1.75} aria-hidden />
          </div>
        </SearchField>

        <SearchField icon={Calendar} label={t('search.checkOut', 'Check-Out')}>
          <div className="relative flex items-center">
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={`${fieldControlClass} pr-8 [color-scheme:dark]`}
            />
            <Calendar className="absolute right-0 w-3.5 h-3.5 text-slate-500 pointer-events-none" strokeWidth={1.75} aria-hidden />
          </div>
        </SearchField>

        <SearchField icon={Users} label={t('search.guestsRooms', 'Guests & Rooms')}>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="relative flex-1 min-w-0">
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className={`${fieldControlClass} appearance-none pr-5`}
              >
                <option value={1} className="bg-slate-900 text-white">
                  1 {t('search.guest', 'Guest')}
                </option>
                <option value={2} className="bg-slate-900 text-white">
                  2 {t('search.guests', 'Guests')}
                </option>
                <option value={3} className="bg-slate-900 text-white">
                  3 {t('search.guests', 'Guests')}
                </option>
                <option value={4} className="bg-slate-900 text-white">
                  4 {t('search.guests', 'Guests')}
                </option>
                <option value={6} className="bg-slate-900 text-white">
                  6+ {t('search.guests', 'Guests')}
                </option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/85 pointer-events-none" aria-hidden />
            </div>
            <span className="text-slate-500 text-sm font-medium shrink-0">/</span>
            <div className="relative flex-1 min-w-0">
              <select
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className={`${fieldControlClass} appearance-none pr-5`}
              >
                <option value={1} className="bg-slate-900 text-white">
                  1 {t('search.room', 'Room')}
                </option>
                <option value={2} className="bg-slate-900 text-white">
                  2 {t('search.rooms', 'Rooms')}
                </option>
                <option value={3} className="bg-slate-900 text-white">
                  3 {t('search.rooms', 'Rooms')}
                </option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/85 pointer-events-none" aria-hidden />
            </div>
          </div>
        </SearchField>

        <button
          type="submit"
          className="inline-flex w-full lg:w-auto shrink-0 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-gold via-[#d4a85a] to-gold-hover text-slate-950 font-semibold text-sm sm:text-base px-5 min-h-[56px] lg:min-h-0 lg:self-stretch lg:min-w-[11.5rem] xl:min-w-[15.5rem] shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.99] transition-all"
        >
          <Search className="w-5 h-5 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="text-center leading-tight">{t('search.findSanctuaries', 'Find Sanctuaries')}</span>
        </button>
      </div>
    </form>
  );
};
