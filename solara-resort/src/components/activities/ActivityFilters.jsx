import React from 'react';

export function ActivityFilters({ categories, selectedCategory, onSelect, ariaLabel }) {
  return (
    <div
      className="flex flex-nowrap items-center justify-start sm:justify-center gap-2 mb-10 sm:mb-12 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar snap-x snap-mandatory max-w-full"
      role="tablist"
      aria-label={ariaLabel}
    >
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(cat.value)}
            className={`shrink-0 snap-start px-4 py-2.5 rounded-[var(--radius-button)] text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
              isActive
                ? 'bg-gold text-slate-950 font-semibold shadow-sm ring-1 ring-gold/40'
                : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
