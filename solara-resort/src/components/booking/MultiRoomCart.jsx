import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { formatCurrency } from '../../util/currency.js';

export function MultiRoomCart({
  selections = [],
  roomLines = [],
  currency,
  onRemove,
  t,
  language,
}) {
  if (!selections.length) return null;

  const lineByRoomId = new Map(
    (roomLines || []).map((line) => [Number(line.room_id ?? line.id), line])
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('booking.yourRooms', 'Rooms in this stay')}
        </span>
        <Link
          to="/rooms"
          className="text-xs text-gold hover:underline inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('booking.addAnotherRoom', 'Add another room')}
        </Link>
      </div>
      <ul className="space-y-2">
        {selections.map((room) => {
          const line = lineByRoomId.get(Number(room.id));
          const subtotal = line
            ? Number(line.gross_subtotal ?? line.subtotal ?? 0)
            : null;
          return (
            <li
              key={room.id}
              className="flex gap-3 p-3 rounded-[var(--radius-button)] bg-bg border border-border/80"
            >
              {room.image ? (
                <img
                  src={room.image}
                  alt=""
                  className="w-16 h-12 rounded object-cover border border-border shrink-0"
                />
              ) : null}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-text truncate">{room.name}</p>
                {subtotal != null && (
                  <p className="text-[11px] text-muted">
                    {t('booking.roomSubtotal', 'Room subtotal')}:{' '}
                    <span className="text-text-secondary">
                      {formatCurrency(subtotal, currency)}
                    </span>
                  </p>
                )}
              </div>
              {selections.length > 1 && onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(room.id)}
                  className="p-1.5 rounded text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  aria-label={
                    language === 'km' ? 'ដកបន្ទប់' : `Remove ${room.name}`
                  }
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
