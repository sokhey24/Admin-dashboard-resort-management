import React from 'react';
import { Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { ServiceImage } from './ServiceImage.jsx';
import { formatCurrency } from '../../util/currency.js';

export function ServiceRow({
  service,
  display,
  index,
  currency,
  signatureLabel,
  inquireLabel,
  bookLabel,
  durationLabel,
  fromLabel,
  complimentaryLabel,
  onInquire,
  onBookRoom,
}) {
  const reverse = index % 2 === 1;
  const showPrice = typeof display.priceFrom === 'number' && display.priceFrom > 0;

  return (
    <article
      className={`bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-sm flex flex-col ${
        reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
      } gap-0 lg:gap-8 items-stretch`}
    >
      <div className="lg:w-1/2 aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-900 min-h-[260px] lg:min-h-[300px]">
        <ServiceImage
          src={display.image}
          alt={display.title}
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-gold bg-gold/10 px-3 py-1 rounded border border-gold/30">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            <span>{signatureLabel}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-text">{display.title}</h3>

          {display.tagline && (
            <p className="text-xs text-gold-light italic">{display.tagline}</p>
          )}

          <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">{display.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary pt-1">
            {display.duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                <span>
                  {durationLabel}: {display.duration}
                </span>
              </span>
            )}
            {showPrice ? (
              <span className="font-serif font-semibold text-gold">
                {fromLabel} {formatCurrency(display.priceFrom, currency)}
              </span>
            ) : (
              <span className="text-gold-light italic">{complimentaryLabel}</span>
            )}
          </div>

          <ul className="space-y-2 pt-2">
            {(display.features || []).map((feat, featIndex) => (
              <li
                key={`${service.id}-feat-${featIndex}`}
                className="flex items-center gap-2.5 text-xs text-text-secondary"
              >
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" aria-hidden />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <Button variant="gold" size="sm" className="w-full sm:w-auto" onClick={() => onInquire(service)}>
            {inquireLabel}
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onBookRoom}>
            {bookLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
