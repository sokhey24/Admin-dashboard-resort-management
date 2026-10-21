import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
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
import { roomIdsFromSortKey } from '../util/roomIds.js';

function isRequestAborted(error) {
  return (
    axios.isCancel(error) ||
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError'
  );
}

function buildQuotePayload({
  roomIds,
  branchId,
  checkIn,
  checkOut,
  adults,
  children,
  couponCode,
}) {
  const code = typeof couponCode === 'string' ? couponCode.trim() : '';
  const branchNum = Number(branchId);
  return {
    room_ids: roomIds,
    check_in: checkIn,
    check_out: checkOut,
    adults: adults ?? 1,
    children: children ?? 0,
    branch_id: branchNum,
    ...(code ? { coupon_code: code } : {}),
  };
}

export function useBookingQuote({
  roomIdsKey = '',
  branchId,
  checkIn,
  checkOut,
  adults,
  children,
  couponCode,
}) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const fetchGenerationRef = useRef(0);

  const couponTrimmed = typeof couponCode === 'string' ? couponCode.trim() : '';

  const refetch = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    const roomIds = roomIdsFromSortKey(roomIdsKey);
    const roomId = roomIds[0] ?? null;
    const branchNum = Number(branchId);

    const validation = validateBookingStay({ roomId, roomIds, checkIn, checkOut, adults });
    if (!validation.valid) {
      setQuote(null);
      setError(validation.message || null);
      setRoomAvailability(null);
      setLoading(false);
      return;
    }

    if (!branchNum || branchNum <= 0) {
      setQuote(null);
      setError(null);
      setRoomAvailability(null);
      setLoading(false);
      return;
    }

    const myGeneration = ++fetchGenerationRef.current;
    const abortRef = { current: null };

    const timer = setTimeout(async () => {
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);
      setRoomAvailability(null);

      const payload = buildQuotePayload({
        roomIds,
        branchId: branchNum,
        checkIn,
        checkOut,
        adults,
        children,
        couponCode: couponTrimmed,
      });

      try {
        const data = await fetchBookingQuote(payload, { signal: abortRef.current.signal });
        if (myGeneration !== fetchGenerationRef.current) {
          return;
        }
        setQuote(mapQuoteToSummary(data));
        setRoomAvailability(null);
      } catch (err) {
        if (myGeneration !== fetchGenerationRef.current) {
          return;
        }
        if (isRequestAborted(err)) {
          return;
        }
        setQuote(null);
        setError(getApiErrorMessage(err, 'Unable to price this stay. Please adjust dates or room.'));
        setRoomAvailability(parseRoomAvailabilityFromError(err));
      } finally {
        if (myGeneration === fetchGenerationRef.current) {
          setLoading(false);
        }
      }
    }, refreshNonce > 0 ? 0 : 350);

    return () => {
      fetchGenerationRef.current += 1;
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [
    roomIdsKey,
    branchId,
    checkIn,
    checkOut,
    adults,
    children,
    couponTrimmed,
    refreshNonce,
  ]);

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
