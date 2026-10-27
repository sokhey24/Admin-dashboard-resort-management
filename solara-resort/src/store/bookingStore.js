const DRAFT_KEY = 'solara_draft';

const defaultStayDates = () => {
  const inDate = new Date();
  inDate.setDate(inDate.getDate() + 14);
  const outDate = new Date(inDate);
  outDate.setDate(outDate.getDate() + 3);
  return {
    checkIn: inDate.toISOString().slice(0, 10),
    checkOut: outDate.toISOString().slice(0, 10),
  };
};

export const EMPTY_BOOKING_DRAFT = {
  resortId: null,
  resortName: '',
  branchId: null,
  branchName: '',
  roomTypeId: null,
  roomId: null,
  roomIds: [],
  roomSelections: [],
  roomName: '',
  roomImage: '',
  ...defaultStayDates(),
  adults: 2,
  children: 0,
  roomsCount: 1,
  couponCode: '',
};

/** UX-only fields — never used for pricing or availability. */
const DRAFT_PERSIST_OMIT = new Set(['baseRate']);

export function loadBookingDraft() {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const safe = { ...parsed };
      DRAFT_PERSIST_OMIT.forEach((key) => delete safe[key]);
      return { ...EMPTY_BOOKING_DRAFT, ...safe };
    }
  } catch {
    // fallback
  }
  return { ...EMPTY_BOOKING_DRAFT };
}

export function saveBookingDraft(draft) {
  try {
    const safe = { ...draft };
    DRAFT_PERSIST_OMIT.forEach((key) => delete safe[key]);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
  } catch {
    // ignore
  }
}
