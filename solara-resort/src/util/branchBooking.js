import { addDaysToIsoDate } from './bookingAvailability.js';
import { buildBookingPath } from './bookingSelection.js';

export function todayIsoDate() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Default stay on branch detail: check-in today, two nights. */
export function defaultBranchStayDates() {
  const checkIn = todayIsoDate();
  return { checkIn, checkOut: addDaysToIsoDate(checkIn, 2) };
}

export function branchAsBookingResort(branch) {
  if (!branch) return { id: null, name: '' };
  return {
    id: branch.id,
    name: branch.name,
    catalogKind: 'branch',
    resortId: branch.resortId,
  };
}

export function resolveBranchStayCriteria(stay, bookingDraft) {
  const defaults = defaultBranchStayDates();
  const checkIn = stay?.checkIn || bookingDraft?.checkIn || defaults.checkIn;
  const checkOut = stay?.checkOut || bookingDraft?.checkOut || defaults.checkOut;
  return {
    checkIn,
    checkOut,
    adults: stay?.adults ?? bookingDraft?.adults ?? 2,
    children: stay?.children ?? bookingDraft?.children ?? 0,
    roomsCount: stay?.roomsCount ?? bookingDraft?.roomsCount ?? 1,
  };
}

export function buildBranchBookingDraftUpdates({ branch, room, stay, bookingDraft }) {
  const resolved = resolveBranchStayCriteria(stay, bookingDraft);
  const branchId = branch?.id != null ? Number(branch.id) : null;
  const roomTypeId = room?.roomTypeId != null ? Number(room.roomTypeId) : null;

  return {
    branchId,
    branchName: branch?.name || '',
    resortId: branch?.resortId ?? bookingDraft?.resortId ?? null,
    resortName: branch?.name || bookingDraft?.resortName || '',
    roomTypeId: roomTypeId > 0 ? roomTypeId : null,
    checkIn: resolved.checkIn,
    checkOut: resolved.checkOut,
    adults: resolved.adults,
    children: resolved.children,
    roomsCount: resolved.roomsCount,
  };
}

export function buildBranchBookingPath({ room, stay, bookingDraft, couponCode }) {
  const resolved = resolveBranchStayCriteria(stay, bookingDraft);
  return buildBookingPath({
    roomId: room?.id,
    checkIn: resolved.checkIn,
    checkOut: resolved.checkOut,
    adults: resolved.adults,
    children: resolved.children,
    couponCode: couponCode ?? bookingDraft?.couponCode,
  });
}
