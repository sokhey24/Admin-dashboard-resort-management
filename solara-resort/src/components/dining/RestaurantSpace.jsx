import React from 'react';

const LAYOUT_CLASS = {
  feature: 'col-span-2 row-span-2 md:col-span-2 md:row-span-2',
  tall: 'col-span-1 row-span-2 sm:col-span-1 sm:row-span-2',
  wide: 'col-span-2 row-span-1 sm:col-span-2 sm:row-span-1',
  square: 'col-span-1 row-span-1',
};

export function RestaurantSpace({ photos, title, subtitle, eyebrow }) {
  return (
    <section className="py-16 sm:py-20 bg-surface/40 border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          {eyebrow && (
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block">{eyebrow}</span>
          )}
          <h2 className="text-3xl font-serif font-bold text-text capitalize">{title}</h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[120px] sm:auto-rows-[150px] md:auto-rows-[170px]">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative overflow-hidden rounded-[var(--radius-card)] border border-border shadow-sm min-h-[120px] ${
                LAYOUT_CLASS[photo.layout] || LAYOUT_CLASS.square
              }`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
