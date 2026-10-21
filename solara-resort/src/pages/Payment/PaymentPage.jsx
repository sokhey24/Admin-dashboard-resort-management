import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMotionPresets } from '../../motion/useMotionPresets.js';
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { PageSkeleton } from '../../components/ui/Skeleton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { KHR_RATE } from '../../util/currency.js';
import { formatKhqrAmount } from '../../util/khqr.js';
import { useBookingDetail } from '../../hooks/useBooking.js';
import { useKhqrSession } from '../../hooks/useKhqrSession.js';
import StripeCardCheckout from '../../components/payment/StripeCardCheckout.jsx';

export const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const { currency, t, refreshMyBookings, addToast } = useApp();
  const { reduced, scaleIn, transition, duration } = useMotionPresets();

  const { booking, loading, error, reload } = useBookingDetail(bookingId);
  const [paymentChannel, setPaymentChannel] = useState('khqr');
  const [gateway, setGateway] = useState('aba-khqr');

  const isPaidFromBooking = booking?.paymentStatus === 'paid';

  const handlePaid = useCallback(
    async (channel = 'khqr') => {
      const message =
        channel === 'card'
          ? t('payment.cardApproved', 'Card payment confirmed.')
          : t('payment.approved', 'Payment confirmed by Bakong.');
      addToast(message, 'success');
      await refreshMyBookings();
      navigate(`/booking-confirm?bookingId=${booking?.apiId ?? bookingId}`);
    },
    [addToast, booking?.apiId, bookingId, navigate, refreshMyBookings, t]
  );

  const khqrEnabled = Boolean(booking && !isPaidFromBooking && paymentChannel === 'khqr');

  const khqr = useKhqrSession(booking?.apiId ?? bookingId, {
    enabled: khqrEnabled,
    gateway,
    onPaid: () => handlePaid('khqr'),
  });

  const displayAmount = useMemo(() => {
    if (paymentChannel === 'khqr' && khqr.payment?.amount != null) {
      return khqr.payment.amount;
    }
    return booking?.balanceDue ?? booking?.pricing?.totalUSD ?? 0;
  }, [booking, khqr.payment?.amount, paymentChannel]);

  const payCurrency =
    paymentChannel === 'khqr' && khqr.payment?.currency
      ? khqr.payment.currency
      : 'USD';

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
          title={t('payment.loadError', 'Unable to load payment')}
          message={error || t('payment.notFound', 'Booking not found.')}
          onRetry={reload}
        />
      </div>
    );
  }

  const primaryLabel = formatKhqrAmount(displayAmount, payCurrency);
  const showKhrEstimate = payCurrency === 'USD';
  const amountKHR = showKhrEstimate ? Math.round(displayAmount * KHR_RATE) : Math.round(displayAmount);
  const showPaid = isPaidFromBooking || khqr.phase === 'paid';

  const headerEyebrow =
    paymentChannel === 'card'
      ? t('payment.stripeSecure', 'Secure card checkout · Stripe')
      : t('payment.nbcBakong', 'National Bank of Cambodia · Bakong');

  const headerTitle =
    paymentChannel === 'card'
      ? t('payment.cardTitle', 'Pay with credit or debit card')
      : t('payment.scanTitle', 'Scan KHQR to Settle Sanctuary Stay');

  return (
    <div className="w-full min-h-screen pt-28 pb-24 bg-bg flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6">
        <div className="bg-surface border border-border rounded-[var(--radius-modal)] p-8 sm:p-10 shadow-2xl space-y-8 text-center">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-gold font-bold block">
              {headerEyebrow}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text">
              {headerTitle}
            </h1>
            <p className="text-xs text-muted">
              {t('confirm.code', 'Reservation')} #{booking.id} · {booking.roomName} at {booking.resortName}
            </p>
          </div>

          <div className="p-4 rounded-[var(--radius-card)] bg-bg border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[10px] uppercase text-muted block">
                {t('payment.amount', 'Settlement Amount')}
              </span>
              <span className="text-2xl font-bold font-serif text-gold">{primaryLabel}</span>
            </div>
            {showKhrEstimate && paymentChannel === 'khqr' && (
              <div className="text-right">
                <span className="text-[10px] uppercase text-muted block">
                  {t('payment.khrValue', 'Cambodian Riel Value (estimate)')}
                </span>
                <span className="text-base font-semibold text-text">
                  ៛{amountKHR.toLocaleString()} KHR
                </span>
              </div>
            )}
          </div>

          {!showPaid && (
            <div className="flex justify-center gap-2 text-xs flex-wrap">
              <button
                type="button"
                onClick={() => setPaymentChannel('khqr')}
                className={`px-3 py-1.5 rounded-[var(--radius-button)] border cursor-pointer ${
                  paymentChannel === 'khqr'
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-border text-muted'
                }`}
              >
                {t('payment.khqrOption', 'KHQR (Bakong)')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentChannel('card')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] border cursor-pointer ${
                  paymentChannel === 'card'
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-border text-muted'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" aria-hidden />
                {t('payment.cardOption', 'Card')}
              </button>
            </div>
          )}

          {showPaid ? (
            <motion.div
              className="p-6 rounded-[var(--radius-card)] bg-emerald-500/10 border border-emerald-500/30 space-y-3"
              {...scaleIn()}
              transition={transition(duration.button)}
            >
              <motion.div
                initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={transition(duration.button)}
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              </motion.div>
              <p className="text-sm text-text">{t('payment.approved', 'Payment Approved')}</p>
              <Button
                variant="gold"
                onClick={() => navigate(`/booking-confirm?bookingId=${booking.apiId}`)}
              >
                {t('payment.viewConfirmation', 'View confirmation')}
              </Button>
            </motion.div>
          ) : paymentChannel === 'card' ? (
            <StripeCardCheckout
              bookingApiId={booking.apiId}
              amount={displayAmount}
              currency={payCurrency}
              onPaid={() => handlePaid('card')}
              t={t}
            />
          ) : khqr.phase === 'loading' ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <p className="text-sm">{t('payment.generatingQr', 'Generating QR code…')}</p>
            </div>
          ) : khqr.phase === 'error' ? (
            <ErrorState message={khqr.error} onRetry={khqr.generateQr} />
          ) : khqr.phase === 'expired' ? (
            <div className="space-y-4 py-4">
              <p className="text-lg font-serif font-semibold text-text">
                {t('payment.qrExpired', 'QR code expired')}
              </p>
              <p className="text-xs text-muted">{khqr.error || t('payment.qrExpiredDesc', 'Generate a new code to try again.')}</p>
              <Button variant="gold" onClick={khqr.generateQr}>
                {t('payment.tryAgain', 'Try again')}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 text-xs mb-2">
                <button
                  type="button"
                  onClick={() => setGateway('aba-khqr')}
                  className={`px-3 py-1.5 rounded-[var(--radius-button)] border cursor-pointer ${
                    gateway === 'aba-khqr'
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-border text-muted'
                  }`}
                >
                  ABA KHQR
                </button>
                <button
                  type="button"
                  onClick={() => setGateway('acleda-khqr')}
                  className={`px-3 py-1.5 rounded-[var(--radius-button)] border cursor-pointer ${
                    gateway === 'acleda-khqr'
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-border text-muted'
                  }`}
                >
                  ACLEDA KHQR
                </button>
              </div>

              <div className="relative max-w-sm mx-auto p-6 rounded-[var(--radius-card)] bg-gradient-to-b from-rose-950/30 via-surface to-surface border-2 border-red-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-1.5 font-bold tracking-tight text-red-500 text-sm">
                    <span className="bg-red-600 text-white font-extrabold px-2 py-0.5 rounded text-xs">
                      KHQR
                    </span>
                    <span>BAKONG</span>
                  </div>
                  <span className="text-[10px] text-muted font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {khqr.countdown}
                  </span>
                </div>

                <div
                  ref={khqr.qrHostRef}
                  className="relative aspect-square max-w-[260px] mx-auto bg-white p-3 rounded-xl shadow-inner flex items-center justify-center min-h-[232px]"
                  aria-live="polite"
                />

                {khqr.payment?.paymentId && (
                  <p className="text-[10px] text-muted font-mono text-center">
                    {t('payment.ref', 'Payment ref')}: #{khqr.payment.paymentId}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-gold animate-pulse" aria-hidden />
                {t('payment.waiting', 'Waiting for payment…')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>
                  {t('payment.refreshStatus', 'Refresh booking status')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/booking-confirm?bookingId=${booking.apiId}`)}
                >
                  {t('payment.viewConfirmation', 'View booking (unpaid)')}
                </Button>
              </div>

              <p className="text-[11px] text-muted">
                {t(
                  'payment.supportBanks',
                  'Supports ABA Mobile, Wing, Acleda, Canadia, TrueMoney, and 30+ Cambodian financial institutions.'
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
