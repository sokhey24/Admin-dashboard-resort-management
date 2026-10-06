import React from 'react';
import { Star } from 'lucide-react';

function clampRating(value) {
  const n = Math.round(Number(value) || 0);
  return Math.min(5, Math.max(0, n));
}

export function StarRatingDisplay({ value, size = 'sm', className = '' }) {
  const rating = clampRating(value);
  const iconClass = size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className={`flex items-center gap-0.5 text-gold ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconClass} ${star <= rating ? 'fill-gold' : 'fill-transparent opacity-35'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function StarRatingInput({ value, onChange, disabled = false, labels }) {
  const selected = clampRating(value);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={labels?.group || 'Rating'}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= selected;
        const label = labels?.star
          ? labels.star(star)
          : star === 1
            ? 'Rate 1 star'
            : `Rate ${star} stars`;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected === star}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(star)}
            className={`p-1 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gold/10'
            }`}
          >
            <Star
              className={`w-7 h-7 ${active ? 'fill-gold text-gold' : 'fill-transparent text-gold/50'}`}
            />
          </button>
        );
      })}
    </div>
  );
}
