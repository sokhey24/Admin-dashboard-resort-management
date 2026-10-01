import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

export const ConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const { currency, t } = useApp();

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

  const isPaid = booking.paymentStatus === 'paid';
  const guest = booking.guestInfo || {};

  return (
    <div className="w-full min-h-screen pt-28 pb-24 bg-bg flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6">
        <div className="bg-surface border border-border rounded-[var(--radius-modal)] p-8 sm:p-12 shadow-2xl text-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gold font-bold block">
              {t('confirm.guaranteed', 'Reservation Saved')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text">
              {t('confirm.title', 'Your Sanctuary Awaits')}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed font-light">
              {t(
                'confirm.subtitle',
                'Your reservation is recorded with Solara. Payment status reflects what the resort has received.'
              )}
            </p>
          </div>

          <div className="p-4 rounded-[var(--radius-button)] bg-bg border border-border/80 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase text-muted block">{t('confirm.code', 'Confirmation Code')}</span>
              <span className="text-xl font-mono font-bold text-gold">#{booking.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-muted block">{t('common.status', 'Status')}</span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {booking.status} · {booking.paymentStatus}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-[var(--radius-card)] bg-surface-elevated border border-border/60 text-xs text-left space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-border/60">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold block mb-0.5">
                  {booking.brandName || 'Solara Resort & Spa'}
                </span>
                <h3 className="text-lg font-serif font-bold text-text">{booking.roomName}</h3>
                <p className="text-xs text-gold-light font-medium">
                  {booking.branchName ? `Branch: ${booking.branchName}` : booking.resortName}
                  {booking.branchLocation ? ` · ${booking.branchLocation}` : ''}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase text-muted block">
                  {isPaid ? t('common.totalDue', 'Total Paid') : t('confirm.balanceDue', 'Balance Due')}
                </span>
                <span className="text-lg font-bold font-serif text-gold">
                  {formatCurrency(booking.pricing.totalUSD, currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-muted">
              <div>
                <span className="text-[10px] uppercase block">{t('search.checkIn', 'Check-In Date')}</span>
                <span className="font-medium text-text">{booking.checkIn}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase block">{t('search.checkOut', 'Check-Out Date')}</span>
                <span className="font-medium text-text">{booking.checkOut}</span>
              </div>
              {(guest.firstName || guest.lastName) && (
                <div>
                  <span className="text-[10px] uppercase block">{t('confirm.leadResident', 'Lead Resident')}</span>
                  <span className="font-medium text-text">
                    {guest.firstName} {guest.lastName}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase block">{t('confirm.guestCount', 'Guest Count')}</span>
                <span className="font-medium text-text">
                  {booking.guests.adults} Adults, {booking.guests.children} Children
                </span>
              </div>
            </div>

            {guest.specialRequests && (
              <div className="pt-2 border-t border-border/40 text-[11px] text-muted">
                <span className="font-semibold text-text">{t('booking.specialRequests', 'Special Requests')}: </span>
                <span>{guest.specialRequests}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-[var(--radius-button)] bg-gold/10 border border-gold/30 text-xs text-left flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-text">{t('confirm.preArrival', 'Pre-Arrival Concierge Coordination')}</span>
              <p className="text-muted leading-relaxed font-light text-[11px]">
                {t(
                  'confirm.preArrivalDesc',
                  'Your dedicated Solara butler guild will contact you via WhatsApp 48 hours prior to arrival to confirm private island speedboat transfers and dietary arrangements.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="gold"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => navigate('/account/bookings')}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              {t('confirm.viewAccount', 'View in Resident Account')}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => navigate('/')}
              leftIcon={<Home className="w-4 h-4" />}
            >
              {t('confirm.returnHome', 'Return to Homepage')}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              {t('confirm.printReceipt', 'Print Receipt')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
