import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import {
  todayIsoDate,
  clampGuestCount,
  validateServiceInquiry,
} from './serviceInquiryUtils.js';
import { submitServiceInquiry } from '../../services/api/servicesApi.js';
import { getApiErrorMessage, getValidationFieldErrors } from '../../services/api/errors.js';

const API_FIELD_TO_FORM = {
  preferred_date: 'inquiryDate',
  resort_name: 'inquiryResort',
  guest_count: 'guestCount',
  guest_name: 'guestName',
  guest_email: 'guestEmail',
  guest_phone: 'guestPhone',
};

const fieldClass =
  'w-full bg-surface border text-text rounded-[var(--radius-input)] p-2.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus:border-gold';
const fieldErrorClass = 'border-error';
const fieldOkClass = 'border-border';

export function ServiceInquiryModal({
  isOpen,
  service,
  display,
  sanctuaries,
  t,
  user,
  onClose,
}) {
  const [inquiryDate, setInquiryDate] = useState(() => todayIsoDate());
  const [inquiryResort, setInquiryResort] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultResort = sanctuaries[0]?.name ?? '';

  const resetForm = useCallback(() => {
    setInquiryDate(todayIsoDate());
    setInquiryResort(defaultResort);
    setGuestCount(1);
    setGuestName(user?.name ?? '');
    setGuestEmail(user?.email ?? '');
    setGuestPhone(user?.phone ?? '');
    setInquiryNotes('');
    setFieldErrors({});
    setSubmitError('');
    setIsSubmitting(false);
    setSuccess(false);
  }, [user, defaultResort]);

  useEffect(() => {
    if (isOpen && service) {
      resetForm();
    }
  }, [isOpen, service, resetForm]);

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
    if (!service || isSubmitting) return;

    const errors = validateServiceInquiry({
      inquiryDate,
      guestCount,
      guestName,
      guestEmail,
      guestPhone,
      inquiryResort,
      t,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitServiceInquiry({
        service_title: display.title,
        service_id: service.id ?? null,
        preferred_date: inquiryDate,
        resort_name: inquiryResort,
        guest_count: clampGuestCount(guestCount),
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim(),
        special_requests: inquiryNotes.trim() || null,
      });

      if (!result?.success) {
        setSubmitError(t('services.inquiryFailed', 'Unable to submit your inquiry. Please try again.'));
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
        getApiErrorMessage(err, t('services.inquiryFailed', 'Unable to submit your inquiry. Please try again.'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!service || !display) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        success
          ? t('services.inquirySuccessTitle', 'Your Concierge Request Is Ready')
          : t('services.inquiryModalTitle', 'Service Inquiry')
      }
      subtitle={
        success
          ? t(
              'services.inquirySuccessDesc',
              'Our team will be ready to assist with your selected service.'
            )
          : display.title
      }
      maxWidth="lg"
    >
      {success ? (
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
            <CheckCircle2 className="w-9 h-9" aria-hidden />
          </div>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
            {t(
              'services.inquirySuccessNote',
              'Your inquiry has been received. Our concierge team will contact you shortly.'
            )}
          </p>
          <Button variant="gold" size="sm" type="button" className="w-full sm:w-auto" onClick={handleClose}>
            {t('activities.done', 'Done')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[min(70vh,640px)] overflow-y-auto pr-0.5">
          <div className="space-y-1">
            <span className="text-xs text-muted font-medium block">{t('services.inquiryService', 'Service')}</span>
            <p className="text-sm font-serif font-semibold text-text p-2.5 rounded-[var(--radius-input)] bg-bg border border-border">
              {display.title}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="service-inquiry-date" className="text-xs text-muted font-medium block">
                {t('activities.preferredDate', 'Preferred Date')}
              </label>
              <input
                id="service-inquiry-date"
                type="date"
                value={inquiryDate}
                min={todayIsoDate()}
                onChange={(e) => {
                  setInquiryDate(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, inquiryDate: undefined }));
                }}
                required
                aria-invalid={fieldErrors.inquiryDate ? 'true' : 'false'}
                aria-describedby={fieldErrors.inquiryDate ? 'service-inquiry-date-error' : undefined}
                className={`${fieldClass} ${fieldErrors.inquiryDate ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.inquiryDate && (
                <p id="service-inquiry-date-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.inquiryDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="service-inquiry-resort" className="text-xs text-muted font-medium block">
                {t('contact.sanctuaryInterest', 'Sanctuary of Interest')}
              </label>
              <select
                id="service-inquiry-resort"
                value={inquiryResort}
                onChange={(e) => {
                  setInquiryResort(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, inquiryResort: undefined }));
                }}
                required
                aria-invalid={fieldErrors.inquiryResort ? 'true' : 'false'}
                aria-describedby={fieldErrors.inquiryResort ? 'service-inquiry-resort-error' : undefined}
                className={`${fieldClass} ${fieldErrors.inquiryResort ? fieldErrorClass : fieldOkClass}`}
              >
                {sanctuaries.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              {fieldErrors.inquiryResort && (
                <p id="service-inquiry-resort-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.inquiryResort}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="service-guest-count" className="text-xs text-muted font-medium block">
              {t('search.guestsRooms', 'Guests')}
            </label>
            <input
              id="service-guest-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={guestCount}
              onChange={handleGuestCountChange}
              onBlur={handleGuestCountBlur}
              required
              aria-invalid={fieldErrors.guestCount ? 'true' : 'false'}
              aria-describedby={fieldErrors.guestCount ? 'service-guest-count-error' : undefined}
              className={`${fieldClass} ${fieldErrors.guestCount ? fieldErrorClass : fieldOkClass}`}
            />
            {fieldErrors.guestCount && (
              <p id="service-guest-count-error" className="text-[11px] text-error mt-0.5" role="alert">
                {fieldErrors.guestCount}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="service-guest-name" className="text-xs text-muted font-medium block">
                {t('activities.guestName', 'Guest Name')}
              </label>
              <input
                id="service-guest-name"
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
                aria-describedby={fieldErrors.guestName ? 'service-guest-name-error' : undefined}
                className={`${fieldClass} ${fieldErrors.guestName ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.guestName && (
                <p id="service-guest-name-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.guestName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="service-guest-email" className="text-xs text-muted font-medium block">
                {t('activities.guestEmail', 'Guest Email')}
              </label>
              <input
                id="service-guest-email"
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
                aria-describedby={fieldErrors.guestEmail ? 'service-guest-email-error' : undefined}
                className={`${fieldClass} ${fieldErrors.guestEmail ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.guestEmail && (
                <p id="service-guest-email-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.guestEmail}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="service-guest-phone" className="text-xs text-muted font-medium block">
                {t('activities.guestPhone', 'Guest Phone')}
              </label>
              <input
                id="service-guest-phone"
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
                aria-describedby={fieldErrors.guestPhone ? 'service-guest-phone-error' : undefined}
                className={`${fieldClass} ${fieldErrors.guestPhone ? fieldErrorClass : fieldOkClass}`}
              />
              {fieldErrors.guestPhone && (
                <p id="service-guest-phone-error" className="text-[11px] text-error mt-0.5" role="alert">
                  {fieldErrors.guestPhone}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="service-special-requests" className="text-xs text-muted font-medium block">
                {t('activities.specialRequests', 'Special Requests')}
              </label>
              <textarea
                id="service-special-requests"
                value={inquiryNotes}
                onChange={(e) => setInquiryNotes(e.target.value)}
                rows={3}
                maxLength={1000}
                className={`${fieldClass} border-border resize-y min-h-[72px] max-h-40`}
                placeholder={t('activities.specialRequestsPlaceholder', 'Optional notes for our concierge team')}
              />
            </div>
          </div>

          {submitError && (
            <p className="text-[11px] text-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
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
                ? t('services.inquirySubmitting', 'Submitting…')
                : t('services.submitInquiry', 'Submit Inquiry')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
