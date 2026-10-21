import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { formatCurrency } from '../../util/currency.js';
import {
  applyBookingReschedule,
  fetchRescheduleQuote,
} from '../../services/api/bookingApi.js';
import { getApiErrorMessage } from '../../services/api/errors.js';
import { mapBookingFromApi } from '../../util/mapBooking.js';

export function RescheduleBookingModal({
  open,
  onClose,
  booking,
  currency,
  t,
  language,
  onSuccess,
  onPaymentRequired,
}) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [step, setStep] = useState('dates');
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!open || !booking) return;
    setCheckIn(booking.checkIn || '');
    setCheckOut(booking.checkOut || '');
    setReason('');
    setQuote(null);
    setQuoteError(null);
    setStep('dates');
  }, [open, booking]);

  const loadQuote = useCallback(async () => {
    if (!booking?.apiId || !checkIn || !checkOut) return;
    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);
    try {
      const data = await fetchRescheduleQuote(booking.apiId, {
        check_in: checkIn,
        check_out: checkOut,
      });
      setQuote(data);
      setStep('confirm');
    } catch (err) {
      setQuoteError(getApiErrorMessage(err, 'Unable to price these dates.'));
    } finally {
      setQuoteLoading(false);
    }
  }, [booking?.apiId, checkIn, checkOut]);

  const handleApply = async () => {
    if (!booking?.apiId || !quote || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await applyBookingReschedule(booking.apiId, {
        check_in: checkIn,
        check_out: checkOut,
        reason: reason.trim() || undefined,
        confirm: true,
      });
      const mapped = mapBookingFromApi(result?.booking ?? result);
      onSuccess?.(mapped, result);
      if (result?.payment_required && onPaymentRequired) {
        onPaymentRequired(mapped, result?.payment_url_hint);
      }
      onClose();
    } catch (err) {
      setQuoteError(getApiErrorMessage(err, 'Unable to update your dates.'));
      setStep('confirm');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  const diff = quote ? Number(quote.price_difference ?? 0) : 0;

  return (
    <Modal isOpen={open} onClose={onClose} title={t('reschedule.title', 'Change stay dates')} maxWidth="md">
      <p className="text-xs text-muted mb-4 text-left">
        {t(
          'reschedule.policy',
          'New rates are calculated by the resort. If your balance increases, you will complete payment before the change is final.'
        )}
      </p>

      {step === 'dates' && (
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-muted block mb-1">
                {t('search.checkIn', 'Check-in')}
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-surface border border-border rounded p-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted block mb-1">
                {t('search.checkOut', 'Check-out')}
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-surface border border-border rounded p-2 text-sm text-text"
              />
            </div>
          </div>
          {quoteError && <p className="text-xs text-rose-400">{quoteError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={quoteLoading || !checkIn || !checkOut}
              onClick={loadQuote}
            >
              {quoteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('reschedule.preview', 'Preview price')
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && quote && (
        <div className="space-y-4 text-left">
          <div className="p-3 rounded bg-bg border border-border text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">{t('reschedule.previous', 'Previous dates')}</span>
              <span className="text-text">
                {quote.previous?.check_in} → {quote.previous?.check_out}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('reschedule.proposed', 'New dates')}</span>
              <span className="text-gold font-medium">
                {quote.proposed?.check_in} → {quote.proposed?.check_out}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/80 pt-2">
              <span className="text-muted">{t('reschedule.previousTotal', 'Previous total')}</span>
              <span>{formatCurrency(Number(quote.previous?.total ?? 0), currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('reschedule.newTotal', 'New total')}</span>
              <span className="font-semibold">
                {formatCurrency(Number(quote.proposed?.total ?? 0), currency)}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t('reschedule.difference', 'Difference')}</span>
              <span className={diff > 0 ? 'text-amber-400' : diff < 0 ? 'text-emerald-400' : ''}>
                {diff > 0 ? '+' : ''}
                {formatCurrency(diff, currency)}
              </span>
            </div>
          </div>

          {quote.refund_note && (
            <p className="text-[11px] text-muted">{quote.refund_note}</p>
          )}

          {quote.requires_additional_payment && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded p-2">
              {t(
                'reschedule.paymentRequired',
                'Additional payment will be required after you confirm.'
              )}
            </p>
          )}

          <div>
            <label className="text-[10px] uppercase text-muted block mb-1">
              {t('reschedule.reason', 'Reason (optional)')}
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface border border-border rounded p-2 text-sm text-text"
            />
          </div>

          {quoteError && <p className="text-xs text-rose-400">{quoteError}</p>}

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep('dates')}>
              {t('common.back', 'Back')}
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={submitting}
              onClick={handleApply}
            >
              {submitting
                ? t('reschedule.saving', 'Updating…')
                : t('reschedule.confirm', 'Confirm new dates')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
