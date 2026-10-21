import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { formatCurrency } from '../../util/currency.js';
import { ActivityModalImage } from './ActivityCardImage.jsx';
import {
  todayIsoDate,
  clampGuestCount,
  validateBookingForm,
} from './activityBookingUtils.js';
import { submitActivityBooking } from '../../services/api/activityApi.js';
import { getApiErrorMessage, getValidationFieldErrors } from '../../services/api/errors.js';

const API_FIELD_TO_FORM = {
  booking_date: 'bookingDate',
  guest_count: 'guestCount',
  guest_name: 'guestName',
  guest_email: 'guestEmail',
  guest_phone: 'guestPhone',
};

const fieldClass =
  'w-full bg-surface border text-text rounded-[var(--radius-input)] p-2.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus:border-gold';
const fieldErrorClass = 'border-error';
const fieldOkClass = 'border-border';

export function ActivityBookingModal({
  isOpen,
  activity,
  display,
  currency,
  t,
  user,
  onClose,
}) {
  const [bookingDate, setBookingDate] = useState(() => todayIsoDate());
  const [guestCount, setGuestCount] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setBookingDate(todayIsoDate());
    setGuestCount(2);
    setGuestName(user?.name ?? '');
    setGuestEmail(user?.email ?? '');
    setGuestPhone(user?.phone ?? '');
    setSpecialRequests('');
    setFieldErrors({});
    setSubmitError('');
    setIsSubmitting(false);
    setSuccess(false);
  }, [user]);

  useEffect(() => {
    if (isOpen && activity) {
      resetForm();
    }
  }, [isOpen, activity, resetForm]);

  const handleClose = () => {
    onClose();
    setSuccess(false);
  };

  const handleGuestCountChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setGuestCount('');
      setFieldErrors((prev) => ({ ...prev, guestCount: undefined }));
      return;
    }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setGuestCount(n);
    if (n < 1 || n > 50) {
      setFieldErrors((prev) => ({
        ...prev,
        guestCount: t('activities.guestCountRange', 'Please enter between 1 and 50 guests.'),
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, guestCount: undefined }));
    }
  };

  const handleGuestCountBlur = () => {
    if (guestCount === '' || guestCount == null) {
      setGuestCount(1);
      setFieldErrors((prev) => ({ ...prev, guestCount: undefined }));
      return;
    }
    setGuestCount(clampGuestCount(guestCount));
    setFieldErrors((prev) => ({ ...prev, guestCount: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activity || isSubmitting) return;

    const errors = validateBookingForm({
      bookingDate,
      guestCount,
      guestName,
      guestEmail,
      guestPhone,
      t,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const guests = clampGuestCount(guestCount);
    const estimatedTotal = activity.pricePerPerson * guests;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitActivityBooking({
        activity_title: display.title,
        activity_id: activity.id ?? null,
        booking_date: bookingDate,
        guest_count: guests,
        total_price: estimatedTotal,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim(),
        special_requests: specialRequests.trim() || null,
      });

      if (!result?.success) {
        setSubmitError(t('activities.bookingFailed', 'Unable to submit your activity booking. Please try again.'));
        return;
      }

      setSuccess(true);
    } catch (err) {
      const apiErrors = getValidationFieldErrors(err);
      if (Object.keys(apiErrors).length > 0) {
        const mapped = {};
        Object.entries(apiErrors).forEach(([key, message]) => {
          const formKey = API_FIELD_TO_FORM[key] ?? key;
          mapped[formKey] = message;
        });
        setFieldErrors(mapped);
      }
      setSubmitError(
        getApiErrorMessage(err, t('activities.bookingFailed', 'Unable to submit your activity booking. Please try again.'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activity || !display) return null;

  const guests = clampGuestCount(guestCount);
  const estimatedTotal = activity.pricePerPerson * guests;
  const priceBreakdown = t('activities.estimatedBreakdown', '{price} × {count} guests')
    .replace('{price}', formatCurrency(activity.pricePerPerson, currency))
    .replace('{count}', String(guests));

  const imageFallback = t('activities.imageFallback', 'Activity experience');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        success
          ? t('activities.reservationSuccessTitle', 'Experience Reserved')
          : `${t('activities.reserveExp', 'Reserve Experience')}: ${display.title}`
      }
      subtitle={
        success
          ? t(
              'activities.reservationSuccessDesc',
              'Your activity has been added to your reservation request.'
            )
          : `${t('activities.schedule', 'Schedule')}: ${display.schedule} · ${t('activities.duration', 'Duration')}: ${display.duration}`
      }
      maxWidth="2xl"
    >
      {success ? (
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
            <CheckCircle2 className="w-9 h-9" aria-hidden />
          </div>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
            {t(
              'activities.reservationSuccessNote',
              'Your request has been submitted. Our concierge team will confirm availability and contact you shortly.'
            )}
          </p>
          <Button variant="gold" size="sm" type="button" className="w-full sm:w-auto" onClick={handleClose}>
            {t('activities.done', 'Done')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[min(70vh,640px)] overflow-y-auto pr-0.5">
          <ActivityModalImage src={display.image} alt={display.title} fallbackLabel={imageFallback} />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded">
              {display.category}
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed font-light">{display.description}</p>

          <div className="space-y-1">
            <span className="text-xs text-muted font-medium block">{t('activities.activityLabel', 'Activity')}</span>
            <p className="text-sm font-serif font-semibold text-text p-2.5 rounded-[var(--radius-input)] bg-bg border border-border">
              {display.title}
            </p>
          </div>

          <div className="p-3 rounded-[var(--radius-button)] bg-bg border border-border text-xs flex justify-between items-center gap-3">
            <span className="text-muted">{t('activities.pricePerGuest', 'Price per guest:')}</span>
            <span className="font-serif font-bold text-gold text-sm shrink-0">
              {formatCurrency(activity.pricePerPerson, currency)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="activity-booking-date" className="text-xs text-muted font-medium block">
                {t('activities.preferredDate', 'Preferred Date')}
              </label>
              <input
                id="activity-booking-date"
                type="date"
                value={bookingDate}
                min={todayIsoDate()}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, bookingDate: undefined }));
                }}
                required
                aria-invalid={fieldErrors.bookingDate ? 'true' : 'false'}
                aria-describedby={fieldErrors.bookingDate ? 'activity-booking-date-error' : undefined}
                className={`${fieldClass} ${fieldErrors.bookingDate ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.bookingDate && (
                <p id="activity-booking-date-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.bookingDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="activity-guest-count" className="text-xs text-muted font-medium block">
                {t('search.guestsRooms', 'Guests')}
              </label>
              <input
                id="activity-guest-count"
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                step={1}
                value={guestCount}
                onChange={handleGuestCountChange}
                onBlur={handleGuestCountBlur}
                required
                aria-invalid={fieldErrors.guestCount ? 'true' : 'false'}
                aria-describedby={fieldErrors.guestCount ? 'activity-guest-count-error' : undefined}
                className={`${fieldClass} ${fieldErrors.guestCount ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.guestCount && (
                <p id="activity-guest-count-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.guestCount}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="activity-guest-name" className="text-xs text-muted font-medium block">
                {t('activities.guestName', 'Guest Name')}
              </label>
              <input
                id="activity-guest-name"
                type="text"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, guestName: undefined }));
                }}
                required
                maxLength={150}
                autoComplete="name"
                aria-invalid={fieldErrors.guestName ? 'true' : 'false'}
                aria-describedby={fieldErrors.guestName ? 'activity-guest-name-error' : undefined}
                className={`${fieldClass} ${fieldErrors.guestName ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.guestName && (
                <p id="activity-guest-name-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.guestName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="activity-guest-email" className="text-xs text-muted font-medium block">
                {t('activities.guestEmail', 'Guest Email')}
              </label>
              <input
                id="activity-guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => {
                  setGuestEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, guestEmail: undefined }));
                }}
                required
                maxLength={150}
                autoComplete="email"
                aria-invalid={fieldErrors.guestEmail ? 'true' : 'false'}
                aria-describedby={fieldErrors.guestEmail ? 'activity-guest-email-error' : undefined}
                className={`${fieldClass} ${fieldErrors.guestEmail ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.guestEmail && (
                <p id="activity-guest-email-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.guestEmail}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="activity-guest-phone" className="text-xs text-muted font-medium block">
                {t('activities.guestPhone', 'Guest Phone')}
              </label>
              <input
                id="activity-guest-phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => {
                  setGuestPhone(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, guestPhone: undefined }));
                }}
                required
                maxLength={50}
                autoComplete="tel"
                aria-invalid={fieldErrors.guestPhone ? 'true' : 'false'}
                aria-describedby={fieldErrors.guestPhone ? 'activity-guest-phone-error' : undefined}
                className={`${fieldClass} ${fieldErrors.guestPhone ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.guestPhone && (
                <p id="activity-guest-phone-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.guestPhone}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="activity-special-requests" className="text-xs text-muted font-medium block">
                {t('activities.specialRequests', 'Special Requests')}
              </label>
              <textarea
                id="activity-special-requests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                maxLength={1000}
                className={`${fieldClass} border-border resize-y min-h-[72px] max-h-40`}
                placeholder={t('activities.specialRequestsPlaceholder', 'Optional notes for our concierge team')}
              />
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-button)] bg-surface/50 border border-border space-y-1">
            <p className="text-[11px] text-muted text-right">{priceBreakdown}</p>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span>{t('activities.estimatedTotal', 'Estimated Total')}:</span>
              <span className="text-gold font-serif text-sm">{formatCurrency(estimatedTotal, currency)}</span>
            </div>
          </div>

          {submitError && (
            <p className="text-[11px] text-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-surface pb-1">
            <Button variant="outline" size="sm" type="button" className="w-full sm:w-auto" onClick={handleClose} disabled={isSubmitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              className="w-full sm:w-auto min-w-[140px]"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('activities.submitting', 'Submitting…')
                : t('activities.reserveExp', 'Reserve Experience')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
