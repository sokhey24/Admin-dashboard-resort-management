import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatCurrency } from '../../util/currency.js';
import { ActivityCardImage } from './ActivityCardImage.jsx';

export function ActivityCard({
  activity,
  display,
  currency,
  imageFallbackLabel,
  perPersonLabel,
  reserveLabel,
  onReserve,
}) {
  return (
    <article
      className="group bg-surface border border-border hover:border-gold/40 rounded-[var(--radius-card)] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 shrink-0">
        <ActivityCardImage
          src={display.image}
          alt={display.title || imageFallbackLabel}
          fallbackLabel={imageFallbackLabel}
        />
        {display.category && (
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] uppercase tracking-wider text-gold-light px-2.5 py-1 rounded border border-gold/30 max-w-[85%] truncate">
            {display.category}
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-serif font-semibold text-text group-hover:text-gold transition-colors leading-snug">
          {display.title}
        </h3>

        <p className="text-xs text-muted leading-relaxed font-light line-clamp-3 flex-1">
          {display.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary pt-1">
          {display.duration && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
              <span>{display.duration}</span>
            </span>
          )}
          {display.schedule && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
              <span>{display.schedule}</span>
            </span>
          )}
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">{perPersonLabel}</p>
            <p className="font-serif font-bold text-gold text-base">
              {formatCurrency(display.pricePerPerson, currency)}
            </p>
          </div>
          <Button
            variant="gold"
            size="sm"
            className="shadow-sm w-full sm:w-auto"
            onClick={() => onReserve(activity)}
          >
            {reserveLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
