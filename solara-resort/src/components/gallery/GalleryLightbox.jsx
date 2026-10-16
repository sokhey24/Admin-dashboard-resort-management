import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { GalleryImage } from './GalleryImage.jsx';

export function GalleryLightbox({
  isOpen,
  item,
  display,
  counterLabel,
  prevLabel,
  nextLabel,
  onClose,
  onPrevious,
  onNext,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    },
    [isOpen, onPrevious, onNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!item || !display) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={display.title}
      subtitle={display.caption}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="uppercase tracking-wider text-gold">{display.category}</span>
          <span aria-live="polite">{counterLabel}</span>
        </div>

        <div className="relative flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onPrevious}
            className="shrink-0 p-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            aria-label={prevLabel}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>

          <div className="flex-1 min-w-0 max-h-[min(65vh,720px)] overflow-hidden rounded-[var(--radius-button)] bg-slate-950 border border-border">
            <GalleryImage
              src={display.image}
              alt={display.title}
              className="w-full h-full max-h-[min(65vh,720px)] object-contain object-center mx-auto"
            />
          </div>

          <button
            type="button"
            onClick={onNext}
            className="shrink-0 p-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            aria-label={nextLabel}
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        </div>

        <div className="text-center space-y-1 pt-1">
          <p className="text-sm font-serif font-semibold text-text">{display.title}</p>
          {display.caption && (
            <p className="text-xs text-muted leading-relaxed max-w-2xl mx-auto">{display.caption}</p>
          )}
          {display.resort && (
            <p className="text-[11px] text-text-secondary">{display.resort}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
