import { useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  branchAsBookingResort,
  buildBranchBookingDraftUpdates,
  buildBranchBookingPath,
} from '../util/branchBooking.js';

/** Booking draft persisted in AppContext (dates, guests, room selections). */
export function useBookingDraft() {
  const { bookingDraft, updateBookingDraft, setRoomForBooking } = useApp();

  const primeBranchStay = useCallback(
    (branch, stay) => {
      if (!branch?.id) return;
      const draftUpdates = buildBranchBookingDraftUpdates({
        branch,
        room: null,
        stay,
        bookingDraft,
      });
      updateBookingDraft(draftUpdates);
    },
    [bookingDraft, updateBookingDraft]
  );

  const beginBranchRoomBooking = useCallback(
    ({ branch, room, stay }) => {
      if (!branch?.id || !room?.id) {
        return '/booking';
      }

      const draftUpdates = buildBranchBookingDraftUpdates({
        branch,
        room,
        stay,
        bookingDraft,
      });

      const resort = branchAsBookingResort(branch);
      setRoomForBooking(resort, room, { draftUpdates });

      return buildBranchBookingPath({
        room,
        stay,
        bookingDraft,
        couponCode: bookingDraft.couponCode,
      });
    },
    [bookingDraft, setRoomForBooking]
  );

  return {
    bookingDraft,
    updateBookingDraft,
    primeBranchStay,
    beginBranchRoomBooking,
  };
}
