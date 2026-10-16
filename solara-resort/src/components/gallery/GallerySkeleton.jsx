import React from 'react';
import { Skeleton } from '../ui/Skeleton.jsx';

/** Matches gallery grid pagination (4 columns × 3 rows on large screens). */
export const GALLERY_PAGE_SIZE = 12;

export function GallerySkeleton({ count = GALLERY_PAGE_SIZE, showPagination = true }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading gallery">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={`gallery-skel-${i}`}
            className={`w-full rounded-[var(--radius-card)] ${
              i % 5 === 0 ? 'aspect-[4/5]' : 'aspect-square'
            }`}
          />
        ))}
      </div>
      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
          <Skeleton className="h-3 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-[var(--radius-button)]" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24 rounded-[var(--radius-button)]" />
          </div>
        </div>
      )}
    </div>
  );
}
