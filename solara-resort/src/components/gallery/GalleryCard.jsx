import React from 'react';
import { Eye } from 'lucide-react';
import { GalleryImage } from './GalleryImage.jsx';

export function GalleryCard({ item, display, viewImageLabel, onOpen }) {
  const aspectClass = item.tall ? 'aspect-[4/5] sm:aspect-[3/4]' : 'aspect-square';

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`group relative w-full ${aspectClass} rounded-[var(--radius-card)] overflow-hidden bg-slate-900 border border-border cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50`}
    >
      <GalleryImage
        src={display.image}
        alt={display.title}
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-5 text-white pointer-events-none"
      >
        {display.category ? (
          <span className="text-[10px] uppercase tracking-wider text-gold-light font-semibold mb-1">
            {display.category}
          </span>
        ) : null}
        <h3 className="text-sm sm:text-base font-serif font-bold text-white mb-1 line-clamp-2">
          {display.title}
        </h3>
        {display.caption && (
          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden sm:block">
            {display.caption}
          </p>
        )}
        <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-[10px] text-gold font-medium">
          <Eye className="w-3.5 h-3.5" aria-hidden />
          <span>{viewImageLabel}</span>
        </div>
      </div>
      <span className="sr-only">{display.title}</span>
    </button>
  );
}
