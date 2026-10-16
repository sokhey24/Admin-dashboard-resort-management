export function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function clampGuestCount(value) {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(50, Math.max(1, n));
}

export function normalizeCategory(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed);
}

export function validateBookingForm({ bookingDate, guestCount, guestName, guestEmail, guestPhone, t }) {
  const errors = {};

  if (!bookingDate || !String(bookingDate).trim()) {
    errors.bookingDate = t('activities.dateRequired', 'Please select a date.');
  }

  const guests = clampGuestCount(guestCount);
  if (guests < 1 || guests > 50) {
    errors.guestCount = t('activities.guestCountRange', 'Please enter between 1 and 50 guests.');
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
