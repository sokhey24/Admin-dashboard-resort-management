import React from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMotionPresets } from '../motion/useMotionPresets.js';
import {
  CheckCircle2,
  FileText,
  Printer,
  Home,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { PageSkeleton } from '../components/ui/Skeleton.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../util/currency.js';
import { useBookingDetail } from '../hooks/useBooking.js';
import { bookingNeedsPayment } from '../util/mapBooking.js';
import { bookingStatusLabel, paymentStatusLabel } from '../util/bookingStatusLabels.js';
import { formatPersonName } from '../util/formatName.js';

export const ConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const { currency, t } = useApp();
  const { staggerContainer, staggerItem } = useMotionPresets();

  const { booking, loading, error, reload } = useBookingDetail(bookingId);

  if (loading) {
    return (
      <div className="w-full min-h-screen pt-28 pb-24">
        <PageSkeleton />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-lg mx-auto pt-32 px-4">
        <ErrorState
          title={t('confirm.loadError', 'Unable to load confirmation')}
          message={error || t('confirm.notFound', 'Booking not found.')}
          onRetry={reload}
        />
      </div>
    );
  }

  const paymentKey = String(booking.paymentStatus || 'unpaid').toLowerCase();
  const isPaid = paymentKey === 'paid';
  const isPartial = paymentKey === 'partially_paid';
  const needsPayment = bookingNeedsPayment(booking);
  const guest = booking.guestInfo || {};
  const residentName = formatPersonName(guest.firstName, guest.lastName);
  const confirmationCode = booking.confirmationCode || booking.id;
  const codeDisplay = confirmationCode.startsWith('#') ? confirmationCode : `#${confirmationCode}`;

  const amountLabel = isPaid
    ? t('confirm.totalPaid', 'Total paid')
    : isPartial
      ? t('confirm.balanceDue', 'Balance due')
      : t('confirm.totalDue', 'Total due');

  const amountValue = isPaid
    ? booking.pricing.totalUSD
    : Math.max(Number(booking.balanceDue) || 0, 0);

  const reservationLabel = bookingStatusLabel(booking.status, t);
  const paymentLabel = paymentStatusLabel(booking.paymentStatus, t);

  const locationLine = [booking.branchName, booking.branchLocation].filter(Boolean).join(' · ');
  const propertyLine = booking.branchName ? booking.brandName : booking.brandName;

  return (
    <div className="w-full min-h-screen pt-28 pb-24 bg-bg flex items-center justify-center print:pt-8">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6">
        <motion.div
          className="bg-surface border border-border rounded-[var(--radius-modal)] p-8 sm:p-12 shadow-2xl text-center space-y-8"
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={staggerItem(8)}
            className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>

          <motion.div variants={staggerItem(10)} className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gold font-bold block">
              {isPaid
                ? t('confirm.guaranteed', 'Reservation guaranteed')
                : t('confirm.received', 'Reservation received')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text">
              {t('confirm.title', 'Your sanctuary awaits')}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed font-light">
              {t(
                'confirm.subtitle',
                'Your stay is saved with Solara. A confirmation email will be sent when contact details are on file.'
              )}
            </p>
          </motion.div>

          <motion.div
            variants={staggerItem(10)}
            className="p-4 rounded-[var(--radius-button)] bg-bg border border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted block">
                {t('confirm.code', 'Confirmation code')}
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-gold break-all">{codeDisplay}</span>
            </div>
            <div className="sm:text-right space-y-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted block">
                  {t('confirm.reservationStatus', 'Reservation')}
                </span>
                <span className="text-xs font-semibold text-text capitalize">{reservationLabel}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted block">
                  {t('confirm.paymentLabel', 'Payment')}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isPaid ? 'text-emerald-400' : needsPayment ? 'text-amber-400' : 'text-text'
                  }`}
                >
                  {paymentLabel}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem(12)}
            className="p-6 rounded-[var(--radius-card)] bg-surface-elevated border border-border/60 text-xs text-left space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-border/60">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold block mb-0.5">
                  {propertyLine}
                </span>
                <h3 className="text-lg font-serif font-bold text-text break-words">{booking.roomName}</h3>
                {locationLine ? (
                  <p className="text-xs text-gold-light font-medium mt-0.5">{locationLine}</p>
                ) : (
                  <p className="text-xs text-muted mt-0.5">{t('confirm.branchPending', 'Branch details will appear once assigned.')}</p>
                )}
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-[10px] uppercase text-muted block">{amountLabel}</span>
                <span className="text-lg font-bold font-serif text-gold">
                  {formatCurrency(amountValue, currency)}
                </span>
                {booking.nights ? (
                  <p className="text-[10px] text-muted mt-1">
                    {booking.nights} {booking.nights === 1 ? t('confirm.night', 'night') : t('confirm.nights', 'nights')}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-muted">
              <div>
                <span className="text-[10px] uppercase block">{t('search.checkIn', 'Check-in')}</span>
                <span className="font-medium text-text">{booking.checkIn}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase block">{t('search.checkOut', 'Check-out')}</span>
                <span className="font-medium text-text">{booking.checkOut}</span>
              </div>
              {residentName && (
                <div>
                  <span className="text-[10px] uppercase block">{t('confirm.leadResident', 'Lead guest')}</span>
                  <span className="font-medium text-text">{residentName}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase block">{t('confirm.guestCount', 'Guests')}</span>
                <span className="font-medium text-text">
                  {booking.guests.adults}{' '}
                  {booking.guests.adults === 1 ? t('confirm.adult', 'adult') : t('confirm.adults', 'adults')},{' '}
                  {booking.guests.children}{' '}
                  {booking.guests.children === 1 ? t('confirm.child', 'child') : t('confirm.children', 'children')}
                </span>
              </div>
            </div>

            {guest.specialRequests && (
              <div className="pt-2 border-t border-border/40 text-[11px] text-muted">
                <span className="font-semibold text-text">{t('booking.specialRequests', 'Special requests')}: </span>
                <span>{guest.specialRequests}</span>
              </div>
            )}
          </motion.div>

          {needsPayment && (
            <motion.div variants={staggerItem(8)}>
              <Button variant="gold" size="md" className="w-full sm:w-auto" onClick={() => navigate(`/payment?bookingId=${booking.apiId}`)}>
                {t('confirm.completePayment', 'Complete payment')}
              </Button>
            </motion.div>
          )}

          <motion.div
            variants={staggerItem(10)}
            className="p-4 rounded-[var(--radius-button)] bg-gold/10 border border-gold/30 text-xs text-left flex items-start gap-3"
          >
            <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-text">{t('confirm.preArrival', 'Pre-arrival concierge')}</span>
              <p className="text-muted leading-relaxed font-light text-[11px]">
                {t(
                  'confirm.preArrivalDesc',
                  'Our concierge team may contact you before arrival to arrange transfers and preferences.'
                )}
              </p>
            </div>
          </motion.div>

          <motion.div variants={staggerItem(8)} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden">
            <Button
              variant="gold"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => navigate('/account/bookings')}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              {t('confirm.viewAccount', 'View in my account')}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => navigate('/')}
              leftIcon={<Home className="w-4 h-4" />}
            >
              {t('confirm.returnHome', 'Return home')}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              {t('confirm.printReceipt', 'Print summary')}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
