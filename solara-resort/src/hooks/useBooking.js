import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../services/api/errors.js';
import {
  createBookingRequest,
  fetchBooking,
  fetchBookingQuote,
  fetchMyBookings,
} from '../services/api/bookingApi.js';
import { mapBookingFromApi, mapQuoteToSummary } from '../util/mapBooking.js';
import { parseRoomAvailabilityFromError } from '../util/bookingAvailability.js';
import { isBookingAvailabilityError, validateBookingStay } from '../util/bookingSelection.js';

function buildQuotePayload({ roomId, branchId, checkIn, checkOut, adults, children, couponCode }) {
  const code = typeof couponCode === 'string' ? couponCode.trim() : '';
  return {
    room_ids: [Number(roomId)],
    check_in: checkIn,
    check_out: checkOut,
    adults: adults ?? 1,
    children: children ?? 0,
    ...(branchId ? { branch_id: Number(branchId) } : {}),
    ...(code ? { coupon_code: code } : {}),
  };
}

export function useBookingQuote({ roomId, branchId, checkIn, checkOut, adults, children, couponCode }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refetch = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    const validation = validateBookingStay({ roomId, checkIn, checkOut, adults });
    if (!validation.valid) {
      setQuote(null);
      setError(validation.message || null);
      setRoomAvailability(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setRoomAvailability(null);
      try {
        const data = await fetchBookingQuote(
          buildQuotePayload({ roomId, branchId, checkIn, checkOut, adults, children, couponCode })
        );
        if (!cancelled) {
          setQuote(mapQuoteToSummary(data));
          setRoomAvailability(null);
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(getApiErrorMessage(err, 'Unable to price this stay. Please adjust dates or room.'));
          setRoomAvailability(parseRoomAvailabilityFromError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, refreshNonce > 0 ? 0 : 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [roomId, branchId, checkIn, checkOut, adults, children, couponCode, refreshNonce]);

  return { quote, loading, error, roomAvailability, refetch };
}

export function useBookingDetail(bookingId, { enabled = true } = {}) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && bookingId));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!bookingId) {
      setBooking(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await fetchBooking(bookingId);
      const mapped = mapBookingFromApi(row);
      setBooking(mapped);
      return mapped;
    } catch (err) {
      setBooking(null);
      setError(getApiErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!enabled || !bookingId) {
      setLoading(false);
      return;
    }
    reload();
  }, [enabled, bookingId, reload]);

  return { booking, loading, error, reload };
}

export function useCreateBooking() {
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('idle');
  const inFlight = useRef(false);

  const createBooking = useCallback(async (payload) => {
    if (inFlight.current) {
      return { ok: false, error: 'A reservation is already being saved.' };
    }
    inFlight.current = true;
    setSubmitting(true);
    setSubmitPhase('submitting');
    try {
      const row = await createBookingRequest(payload);
      setSubmitPhase('success');
      return { ok: true, booking: mapBookingFromApi(row) };
    } catch (err) {
      setSubmitPhase('error');
      const message = getApiErrorMessage(err, 'Unable to save your reservation.');
      return {
        ok: false,
        error: message,
        availabilityChanged: isBookingAvailabilityError(message),
        roomAvailability: parseRoomAvailabilityFromError(err),
      };
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, []);

  const resetSubmitPhase = useCallback(() => {
    setSubmitPhase('idle');
  }, []);

  return { createBooking, submitting, submitPhase, resetSubmitPhase };
}

export async function loadMyBookingsMapped() {
  const rows = await fetchMyBookings();
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapBookingFromApi).filter(Boolean);
}
