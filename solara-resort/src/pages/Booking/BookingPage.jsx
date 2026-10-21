import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMotionPresets } from '../../motion/useMotionPresets.js';
import {
  Check,
  CreditCard,
  QrCode,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { RoomUnavailablePanel } from '../../components/booking/RoomUnavailablePanel.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatCurrency } from '../../util/currency.js';
import { useBookingQuote, useCreateBooking } from '../../hooks/useBooking.js';
import { useRoomDetail } from '../../hooks/useCatalog.js';
import { buildSpecialRequests } from '../../util/mapBooking.js';
import { resolveSafeInternalPath } from '../../util/safeRedirect.js';
import {
  buildBookingReturnPath,
  parseBookingQuery,
  validateBookingStay,
} from '../../util/bookingSelection.js';
import { normalizeRoomIds, roomIdsFromSortKey, roomIdsSortKey } from '../../util/roomIds.js';
import { MultiRoomCart } from '../../components/booking/MultiRoomCart.jsx';

export const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSynced = useRef(false);
  const {
    bookingDraft,
    updateBookingDraft,
    removeRoomFromStay,
    registerBooking,
    user,
    currency,
    addToast,
    t,
    language,
  } = useApp();

  const [step, setStep] = useState(1);
  const { reduced, transition, duration } = useMotionPresets();
  const stepMotion = {
    initial: { opacity: 0, x: reduced ? 0 : 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: reduced ? 0 : -12 },
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [arrivalTime, setArrivalTime] = useState('14:00');

  const [paymentMethod, setPaymentMethod] = useState('khqr');

  const roomIdsKey = roomIdsSortKey(bookingDraft);

  const selectedRoomIds = useMemo(
    () => roomIdsFromSortKey(roomIdsKey),
    [roomIdsKey]
  );

  const roomSelections =
    Array.isArray(bookingDraft.roomSelections) && bookingDraft.roomSelections.length
      ? bookingDraft.roomSelections
      : [];

  const { room: currentRoom } = useRoomDetail(selectedRoomIds[0] ?? bookingDraft.roomId);

  useEffect(() => {
    if (currentRoom) {
      const updates = {};
      if (!bookingDraft.branchId && currentRoom.branchId) {
        updates.branchId = currentRoom.branchId;
      }
      if (!bookingDraft.roomName && currentRoom.name) {
        updates.roomName = currentRoom.name;
      }
      if (!bookingDraft.resortName && currentRoom.resortName) {
        updates.resortName = currentRoom.resortName;
      }
      if (!bookingDraft.roomImage && currentRoom.featuredImage) {
        updates.roomImage = currentRoom.featuredImage;
      }
      if (Object.keys(updates).length > 0) {
        updateBookingDraft(updates);
      }
    }
  }, [currentRoom, bookingDraft.branchId, bookingDraft.roomName, bookingDraft.resortName, bookingDraft.roomImage, updateBookingDraft]);

  useEffect(() => {
    if (!currentRoom || roomSelections.length) return;
    const ids = roomIdsFromSortKey(roomIdsKey);
    if (ids.length === 1 && ids[0] === Number(currentRoom.id)) {
      updateBookingDraft({
        roomSelections: [
          {
            id: currentRoom.id,
            name: currentRoom.name,
            image: currentRoom.featuredImage,
            resortName: currentRoom.resortName,
          },
        ],
      });
    }
  }, [currentRoom, roomSelections.length, roomIdsKey, updateBookingDraft]);

  const activeBranchId = bookingDraft.branchId || currentRoom?.branchId;

  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
    roomAvailability,
    refetch: refetchQuote,
  } = useBookingQuote({
    roomIdsKey,
    branchId: activeBranchId,
    checkIn: bookingDraft.checkIn,
    checkOut: bookingDraft.checkOut,
    adults: bookingDraft.adults,
    children: bookingDraft.children,
    couponCode: bookingDraft.couponCode,
  });

  const { createBooking, submitting, submitPhase, resetSubmitPhase } = useCreateBooking();

  useEffect(() => {
    if (urlSynced.current) return;
    urlSynced.current = true;
    const { updates, hasUpdates } = parseBookingQuery(searchParams);
    if (hasUpdates) {
      updateBookingDraft(updates);
    }
  }, [searchParams, updateBookingDraft]);

  useEffect(() => {
    if (user) {
      const parts = (user.name || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!selectedRoomIds.length) {
    return (
      <div className="w-full min-h-screen pt-32 pb-24 px-4">
        <EmptyState
          title={t('booking.noRoomTitle', 'Select an accommodation first')}
          description={t(
            'booking.noRoomDesc',
            'Choose a room or villa from our catalogue before starting your reservation.'
          )}
          actionText={t('rooms.pageTitle', 'Browse accommodations')}
          onAction={() => navigate('/rooms')}
        />
      </div>
    );
  }

  const displayRoomName = bookingDraft.roomName;
  const displayResortName = bookingDraft.resortName;

  const stayValidation = validateBookingStay({
    roomId: bookingDraft.roomId,
    roomIds: selectedRoomIds,
    checkIn: bookingDraft.checkIn,
    checkOut: bookingDraft.checkOut,
    adults: bookingDraft.adults,
  });

  const handleNextStep = async () => {
    if (step === 1) {
      if (!stayValidation.valid) {
        addToast(stayValidation.message, 'error');
        return;
      }
      if (quoteLoading) {
        addToast(t('booking.quoteLoading', 'Calculating your stay total…'), 'info');
        return;
      }
      if (quoteError || !quote) {
        addToast(quoteError || t('booking.quoteRequired', 'A valid quote is required to continue.'), 'error');
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 2) {
      if (!firstName || !lastName || !email || !phone) {
        addToast(
          language === 'km'
            ? 'សូមបំពេញព័ត៌មានភ្ញៀវដែលចាំបាច់ទាំងអស់។'
            : 'Please complete all required guest contact fields.',
          'error'
        );
        return;
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 3) {
      if (submitting) return;

      if (!user) {
        const next = resolveSafeInternalPath(buildBookingReturnPath(searchParams));
        navigate(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!quote) {
        addToast(t('booking.quoteRequired', 'A valid quote is required to continue.'), 'error');
        return;
      }

      const special = buildSpecialRequests({
        firstName,
        lastName,
        email,
        phone,
        arrivalTime,
        specialRequests,
      });

      const coupon = (bookingDraft.couponCode || '').trim();

      const branchId = quote?.branchId || activeBranchId;
      const result = await createBooking({
        resort_id: quote?.resortId || bookingDraft.resortId,
        ...(branchId ? { branch_id: Number(branchId) } : {}),
        room_ids: selectedRoomIds,
        check_in: bookingDraft.checkIn,
        check_out: bookingDraft.checkOut,
        adults: bookingDraft.adults,
        children: bookingDraft.children,
        ...(coupon ? { coupon_code: coupon } : {}),
        special_requests: special,
        source: 'website',
      });

      if (!result.ok) {
        resetSubmitPhase();
        if (result.availabilityChanged) {
          setStep(1);
          refetchQuote();
          addToast(
            result.error ||
              t(
                'booking.availabilityChanged',
                'This room is no longer available for the selected dates. Your quote has been refreshed.'
              ),
            'error'
          );
        } else {
          addToast(result.error, 'error');
        }
        return;
      }

      const saved = result.booking;
      registerBooking(saved);
      addToast(t('booking.created', 'Your reservation has been saved.'), 'success');

      const bookingRef = saved.apiId;

      if (paymentMethod === 'khqr') {
        navigate(`/payment?bookingId=${bookingRef}`);
      } else {
        navigate(`/booking-confirm?bookingId=${bookingRef}`);
      }
    }
  };

  const steps = [
    { num: 1, label: t('booking.selection', 'Your Selection') },
    { num: 2, label: t('booking.guestDetails', 'Guest Details') },
    { num: 3, label: t('booking.payment', 'Payment') },
    { num: 4, label: t('booking.confirmation', 'Confirmation') },
  ];

  const summaryLines = quote
    ? [
        {
          label: t('booking.roomStay', 'Room & stay'),
          value: quote.roomStayTotal > 0 ? quote.roomStayTotal : quote.subtotal,
        },
        { label: t('booking.subtotal', 'Subtotal'), value: quote.subtotal },
        ...(quote.discount > 0
          ? [{ label: t('booking.discount', 'Discount'), value: -quote.discount }]
          : []),
        { label: t('booking.serviceFee', 'Resort Service Fee'), value: quote.serviceCharge },
        { label: t('booking.tax', 'Government Tax & Levies'), value: quote.tax },
      ]
    : [];

  return (
    <div className="w-full min-h-screen pt-28 pb-24 bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
            {steps.map((s) => {
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    layout
                    animate={{
                      scale: isCurrent && !reduced ? 1.05 : 1,
                    }}
                    transition={transition(duration.micro)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCompleted
                        ? 'bg-gold text-slate-950 font-bold'
                        : isCurrent
                          ? 'bg-gold/20 text-gold border-2 border-gold'
                          : 'bg-surface border border-border text-muted'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </motion.div>
                  <span
                    className={`text-[11px] mt-2 font-medium uppercase tracking-wider ${
                      isCurrent || isCompleted ? 'text-gold' : 'text-muted'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="booking-step-1"
                {...stepMotion}
                transition={transition(duration.page)}
                className="bg-surface border border-border p-6 sm:p-8 rounded-[var(--radius-card)] space-y-6 text-left"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                      {language === 'km' ? 'ជំហាន ១ នៃ ៣' : 'Step 1 of 3'}
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-text">
                      {t('booking.reviewSelected', 'Review Selected Quarters')}
                    </h2>
                  </div>
                  <Link to="/rooms" className="text-xs text-gold hover:underline">
                    {selectedRoomIds.length > 1
                      ? t('booking.addAnotherRoom', 'Add another room')
                      : t('booking.changeRoom', 'Change Room')}
                  </Link>
                </div>

                <MultiRoomCart
                  selections={
                    roomSelections.length
                      ? roomSelections
                      : currentRoom
                        ? [
                            {
                              id: currentRoom.id,
                              name: displayRoomName,
                              image: bookingDraft.roomImage,
                            },
                          ]
                        : []
                  }
                  roomLines={quote?.roomLines}
                  currency={currency}
                  onRemove={removeRoomFromStay}
                  t={t}
                  language={language}
                />

                {selectedRoomIds.length === 1 && (
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {bookingDraft.roomImage && (
                      <img
                        src={bookingDraft.roomImage}
                        alt={displayRoomName}
                        className="w-full sm:w-48 aspect-[16/10] rounded-[var(--radius-button)] object-cover border border-border shrink-0"
                      />
                    )}
                    <div className="space-y-1.5 flex-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                        Solara Resort & Spa
                      </span>
                      <span className="text-xs text-slate-300 font-medium block">
                        {displayResortName || currentRoom?.resortName || 'Sanctuary Branch'}
                      </span>
                      <h3 className="text-xl font-serif font-bold text-text">{displayRoomName}</h3>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[var(--radius-button)] bg-bg border border-border/80 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted font-medium block">
                      {t('search.checkIn', 'Check-In Date')}
                    </label>
                    <input
                      type="date"
                      value={bookingDraft.checkIn}
                      onChange={(e) => updateBookingDraft({ checkIn: e.target.value })}
                      className="w-full bg-surface border border-border text-text rounded p-2 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted font-medium block">
                      {t('search.checkOut', 'Check-Out Date')}
                    </label>
                    <input
                      type="date"
                      value={bookingDraft.checkOut}
                      onChange={(e) => updateBookingDraft({ checkOut: e.target.value })}
                      className="w-full bg-surface border border-border text-text rounded p-2 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted font-medium block">
                      {t('search.adultsLabel', 'Adult guests')}
                    </label>
                    <select
                      value={bookingDraft.adults}
                      onChange={(e) => updateBookingDraft({ adults: Number(e.target.value) })}
                      className="w-full bg-surface border border-border text-text rounded p-2 focus:outline-none focus:border-gold cursor-pointer"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? t('search.adult', 'Adult') : t('search.adults', 'Adults')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted font-medium block">
                      {t('search.childrenLabel', 'Children (under 12)')}
                    </label>
                    <select
                      value={bookingDraft.children}
                      onChange={(e) => updateBookingDraft({ children: Number(e.target.value) })}
                      className="w-full bg-surface border border-border text-text rounded p-2 focus:outline-none focus:border-gold cursor-pointer"
                    >
                      {[0, 1, 2].map((n) => (
                        <option key={n} value={n}>
                          {n === 0
                            ? `0 — ${t('search.noChildren', 'None')}`
                            : `${n} ${n === 1 ? t('search.child', 'Child') : t('search.children', 'Children')}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] uppercase text-muted font-medium block">
                      {t('booking.promoCode', 'Promo / coupon code')}
                    </label>
                    <input
                      type="text"
                      value={bookingDraft.couponCode || ''}
                      onChange={(e) => updateBookingDraft({ couponCode: e.target.value })}
                      placeholder={t('booking.promoPlaceholder', 'Optional')}
                      className="w-full bg-surface border border-border text-text rounded p-2 focus:outline-none focus:border-gold text-sm"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {roomAvailability?.length > 0 ? (
                  <RoomUnavailablePanel
                    rooms={roomAvailability}
                    language={language}
                    t={t}
                    requestedCheckIn={bookingDraft.checkIn}
                    requestedCheckOut={bookingDraft.checkOut}
                    onUseCheckInDate={(dates) => updateBookingDraft(dates)}
                  />
                ) : (
                  quoteError && (
                    <ErrorState
                      title={t('booking.availabilityTitle', 'Room unavailable')}
                      message={quoteError}
                    />
                  )
                )}

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    variant="gold"
                    size="md"
                    onClick={handleNextStep}
                    disabled={quoteLoading}
                    rightIcon={
                      quoteLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )
                    }
                  >
                    {t('booking.proceedGuest', 'Proceed to Guest Details')}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="booking-step-2"
                {...stepMotion}
                transition={transition(duration.page)}
                className="bg-surface border border-border p-6 sm:p-8 rounded-[var(--radius-card)] space-y-6 text-left"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                      {language === 'km' ? 'ជំហាន ២ នៃ ៣' : 'Step 2 of 3'}
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-text">
                      {t('booking.residentLogistics', 'Resident Contact & Logistics')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-muted hover:text-text flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('common.back', 'Back')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('booking.firstName', 'First Name')}
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    label={t('booking.lastName', 'Last Name')}
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('contact.email', 'Email Address')}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    label={t('contact.phone', 'Mobile Telephone')}
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary block">
                    {t('booking.arrivalTime', 'Estimated Arrival Time at Resort')}
                  </label>
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full bg-surface border border-border text-text rounded-[var(--radius-input)] p-2.5 text-sm focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary block">
                    {t('booking.specialRequests', 'Special Requests & Dietary Requirements')}
                  </label>
                  <textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full rounded-[var(--radius-input)] bg-surface border border-border text-text text-sm p-3 focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    {t('common.back', 'Back')}
                  </Button>
                  <Button
                    variant="gold"
                    size="md"
                    onClick={handleNextStep}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {t('booking.continuePayment', 'Continue to Payment')}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="booking-step-3"
                {...stepMotion}
                transition={transition(duration.page)}
                className="bg-surface border border-border p-6 sm:p-8 rounded-[var(--radius-card)] space-y-6 text-left"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">
                      {language === 'km' ? 'ជំហាន ៣ នៃ ៣' : 'Step 3 of 3'}
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-text">
                      {t('booking.chooseSettlement', 'Choose Settlement Method')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-muted hover:text-text flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('common.back', 'Back')}</span>
                  </button>
                </div>

                {!user && (
                  <p className="text-xs text-gold bg-gold/10 border border-gold/30 rounded p-3">
                    {t(
                      'booking.signInToComplete',
                      'Sign in to your resident account to confirm this reservation.'
                    )}
                  </p>
                )}

                <div className="space-y-3">
                  <label
                    onClick={() => setPaymentMethod('khqr')}
                    className={`flex items-start gap-4 p-4 rounded-[var(--radius-button)] border transition-all cursor-pointer ${
                      paymentMethod === 'khqr'
                        ? 'bg-gold/10 border-gold shadow-md'
                        : 'bg-surface border-border hover:border-gold/40'
                    }`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === 'khqr'} readOnly className="mt-1 accent-gold" />
                    <div className="space-y-1 flex-1">
                      <span className="font-bold text-sm text-text flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-gold" />
                        {t('booking.khqrTitle', 'KHQR (Bakong / All Cambodian Mobile Banking)')}
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('counter')}
                    className={`flex items-start gap-4 p-4 rounded-[var(--radius-button)] border transition-all cursor-pointer ${
                      paymentMethod === 'counter'
                        ? 'bg-gold/10 border-gold shadow-md'
                        : 'bg-surface border-border hover:border-gold/40'
                    }`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === 'counter'} readOnly className="mt-1 accent-gold" />
                    <div className="space-y-1 flex-1">
                      <span className="font-bold text-sm text-text flex items-center gap-2">
                        <Building className="w-4 h-4 text-gold" />
                        {t('booking.counterTitle', 'Settle Upon Arrival at Sanctuary')}
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-start gap-4 p-4 rounded-[var(--radius-button)] border transition-all cursor-pointer opacity-60 ${
                      paymentMethod === 'card' ? 'bg-gold/10 border-gold' : 'bg-surface border-border'
                    }`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} readOnly className="mt-1 accent-gold" disabled />
                    <div className="space-y-1 flex-1">
                      <span className="font-bold text-sm text-text flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gold" />
                        {t('booking.cardTitle', 'International Credit / Debit Card')}
                      </span>
                      <p className="text-[11px] text-muted">{t('booking.cardSoon', 'Card checkout is not available on the guest site yet.')}</p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                    {t('common.back', 'Back')}
                  </Button>
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={handleNextStep}
                    disabled={submitting || submitPhase === 'success' || paymentMethod === 'card'}
                  >
                    {submitPhase === 'success'
                      ? t('booking.saved', 'Reservation saved')
                      : submitting
                        ? t('booking.submitting', 'Saving reservation…')
                        : paymentMethod === 'khqr'
                          ? t('booking.generateQr', 'Confirm & Continue to KHQR')
                          : t('booking.authorizeConfirm', 'Confirm Reservation')}
                  </Button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-28 bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-xl space-y-6 text-left">
              <span className="text-xs uppercase tracking-wider text-gold font-semibold block pb-2 border-b border-border">
                {t('booking.summaryTitle', 'Reservation Summary')}
              </span>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-serif font-bold text-sm text-text block">{displayRoomName}</span>
                  <span className="text-muted block">{displayResortName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded bg-bg border border-border/80">
                  <div>
                    <span className="text-[10px] uppercase text-muted block">{t('common.date', 'Dates')}</span>
                    <span className="font-medium text-text">
                      {bookingDraft.checkIn} to {bookingDraft.checkOut}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted block">{t('activities.duration', 'Duration')}</span>
                    <span className="font-medium text-text">
                      {quote?.nights ?? '—'}{' '}
                      {quote?.nights === 1 ? t('common.night', 'Night') : t('common.nights', 'Nights')}
                    </span>
                  </div>
                </div>

                {quoteLoading && (
                  <p className="text-muted flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t('booking.quoteLoading', 'Calculating your stay total…')}
                  </p>
                )}

                {quote && !quoteLoading && quote.roomLines?.length > 1 && (
                  <div className="space-y-1.5 pt-2 border-t border-border/80">
                    {quote.roomLines.map((line) => (
                      <div
                        key={line.room_id ?? line.id}
                        className="flex justify-between text-[11px] text-muted"
                      >
                        <span className="truncate pr-2">
                          {line.room_number || line.name || t('booking.room', 'Room')}
                        </span>
                        <span className="text-text-secondary shrink-0">
                          {formatCurrency(
                            Number(line.gross_subtotal ?? line.subtotal ?? 0),
                            currency
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {quote && !quoteLoading && (
                  <>
                    <div className="space-y-2 pt-2 border-t border-border/80">
                      {summaryLines.map((line) => (
                        <div key={line.label} className="flex justify-between text-muted">
                          <span>{line.label}</span>
                          <span
                            className={
                              line.value < 0 ? 'text-emerald-400' : undefined
                            }
                          >
                            {line.value < 0 ? '−' : ''}
                            {formatCurrency(Math.abs(line.value), currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-bold text-text block">{t('common.totalDue', 'Total Due')}</span>
                        <span className="text-[10px] text-muted">≈ ៛{quote.totalKHR.toLocaleString()} KHR</span>
                      </div>
                      <span className="text-xl font-bold font-serif text-gold">
                        {formatCurrency(quote.total, currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3.5 rounded bg-surface-elevated border border-border/80 text-[11px] text-muted space-y-1.5">
                <div className="flex items-center gap-1.5 text-text font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('booking.quoteGuarantee', 'Authoritative quote from Solara')}</span>
                </div>
                <p>
                  {t(
                    'booking.quoteGuaranteeDesc',
                    'Totals include resort taxes and service charges as configured by the property. Final amount is re-verified when your booking is saved.'
                  )}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
