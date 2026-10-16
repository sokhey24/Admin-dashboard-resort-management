import {
  todayIsoDate,
  clampGuestCount,
  isValidEmail,
} from '../activities/activityBookingUtils.js';

export { todayIsoDate, clampGuestCount };

export function validateServiceInquiry({
  inquiryDate,
  guestCount,
  guestName,
  guestEmail,
  guestPhone,
  inquiryResort,
  t,
}) {
  const errors = {};

  if (!inquiryDate || !String(inquiryDate).trim()) {
    errors.inquiryDate = t('activities.dateRequired', 'Please select a date.');
  }

  const guests = clampGuestCount(guestCount);
  if (guests < 1 || guests > 50) {
    errors.guestCount = t('activities.guestCountRange', 'Please enter between 1 and 50 guests.');
  }

  if (!String(inquiryResort ?? '').trim()) {
    errors.inquiryResort = t('services.resortRequired', 'Please select a sanctuary.');
  }

  if (!String(guestName ?? '').trim()) {
    errors.guestName = t('activities.nameRequired', 'Guest name is required.');
  }

  if (!isValidEmail(guestEmail)) {
    errors.guestEmail = t('activities.emailInvalid', 'Please enter a valid email address.');
  }

  if (!String(guestPhone ?? '').trim()) {
    errors.guestPhone = t('activities.phoneRequired', 'Phone number is required.');
  }

  return errors;
}
