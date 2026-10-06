import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import {
  addDaysToIsoDate,
  formatBookingStayDate,
  nightsBetweenIso,
} from '../../util/bookingAvailability.js';

export function RoomUnavailablePanel({
  rooms,
  language,
  t,
  requestedCheckIn,
  requestedCheckOut,
  onUseCheckInDate,
}) {
  if (!rooms?.length) return null;

  const multiple = rooms.length > 1;
  const stayNights =
    requestedCheckIn && requestedCheckOut
      ? nightsBetweenIso(requestedCheckIn, requestedCheckOut)
      : rooms[0]?.requested_nights ?? 1;

  return (
    <div
      className="rounded-[var(--radius-button)] border border-amber-500/40 bg-amber-500/10 p-5 text-left space-y-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-text">
            {multiple
              ? t('booking.availabilityTitleMany', 'Some selected rooms are unavailable')
              : t('booking.availabilityTitle', 'Room unavailable')}
          </h3>
          {multiple && (
            <p className="text-xs text-muted">
              {t(
                'booking.availabilityManyHint',
                'Each room below is booked during part of your selected stay. Choose different dates.'
              )}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const roomLabel = room.room_number || room.roomNumber || t('booking.room', 'Room');
          const conflicts = Array.isArray(room.conflicts) ? room.conflicts : [];
          const nextFrom = room.next_available_from || room.nextAvailableFrom;

          return (
            <div
              key={room.room_id ?? roomLabel}
              className="rounded-[var(--radius-button)] border border-border/80 bg-surface/80 p-4 space-y-3 text-xs"
            >
              {!multiple && (
                <p className="text-sm text-text leading-relaxed">
                  {t(
                    'booking.availabilityRoomMessage',
                    'Room {room} is not available for your selected dates.'
                  ).replace('{room}', roomLabel)}
                </p>
              )}
              {multiple && (
                <p className="text-sm font-semibold text-text">{roomLabel}</p>
              )}

              {conflicts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-medium block">
                    {t('booking.alreadyBooked', 'Already booked')}
                  </span>
                  <ul className="space-y-1.5 text-text">
                    {conflicts.map((block) => {
                      const key = `${block.check_in}-${block.check_out}`;
                      const from = formatBookingStayDate(block.check_in, language);
                      const to = formatBookingStayDate(block.check_out, language);
                      return (
                        <li key={key}>
                          {from} – {to}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {nextFrom && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-medium block">
                    {t('booking.availableFrom', 'Available for a new stay from')}
                  </span>
                  <p className="text-sm font-medium text-text">
                    {formatBookingStayDate(nextFrom, language)}
                  </p>
                  {onUseCheckInDate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nights = room.requested_nights ?? stayNights;
                        onUseCheckInDate({
                          checkIn: nextFrom,
                          checkOut: addDaysToIsoDate(nextFrom, nights),
                        });
                      }}
                    >
                      {t('booking.useAvailableDate', 'Use this date')}
                    </Button>
                  )}
                </div>
              )}

              {!multiple && (
                <p className="text-muted">
                  {t('booking.chooseDifferentDates', 'Please choose different dates.')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
