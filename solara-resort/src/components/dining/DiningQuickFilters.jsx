import React from 'react';
import { Building2, Sun, Moon, ChevronDown } from 'lucide-react';

const CONTROL_CLASS =
  'flex items-center gap-3 w-full bg-surface border border-border rounded-[var(--radius-card)] px-4 py-3.5 shadow-sm text-left';

const LUNCH_SLOTS = ['11:30', '12:00', '12:30', '13:00'];
const DINNER_SLOTS = ['18:00', '18:30', '19:00', '19:30', '20:00'];

export function DiningQuickFilters({
  restaurants,
  restaurantId,
  lunchTime,
  dinnerTime,
  onRestaurantChange,
  onLunchTimeChange,
  onDinnerTimeChange,
  restaurantLabel,
  lunchLabel,
  dinnerLabel,
}) {
  return (
    <section className="relative z-20 -mt-8 sm:-mt-10 mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <label className={CONTROL_CLASS}>
            <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" aria-hidden />
            </span>
            <span className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-muted font-medium block">
                {restaurantLabel}
              </span>
              <select
                value={restaurantId}
                onChange={(e) => onRestaurantChange(e.target.value)}
                className="w-full text-sm font-medium text-text bg-transparent border-0 p-0 focus:outline-none cursor-pointer appearance-none truncate"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </span>
            <ChevronDown className="w-4 h-4 text-muted shrink-0" aria-hidden />
          </label>

          <label className={CONTROL_CLASS}>
            <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" aria-hidden />
            </span>
            <span className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-muted font-medium block">{lunchLabel}</span>
              <select
                value={lunchTime}
                onChange={(e) => onLunchTimeChange(e.target.value)}
                className="w-full text-sm font-medium text-text bg-transparent border-0 p-0 focus:outline-none cursor-pointer appearance-none"
              >
                {LUNCH_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </span>
            <ChevronDown className="w-4 h-4 text-muted shrink-0" aria-hidden />
          </label>

          <label className={CONTROL_CLASS}>
            <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" aria-hidden />
            </span>
            <span className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-muted font-medium block">{dinnerLabel}</span>
              <select
                value={dinnerTime}
                onChange={(e) => onDinnerTimeChange(e.target.value)}
                className="w-full text-sm font-medium text-text bg-transparent border-0 p-0 focus:outline-none cursor-pointer appearance-none"
              >
                {DINNER_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </span>
            <ChevronDown className="w-4 h-4 text-muted shrink-0" aria-hidden />
          </label>
        </div>
      </div>
    </section>
  );
}
