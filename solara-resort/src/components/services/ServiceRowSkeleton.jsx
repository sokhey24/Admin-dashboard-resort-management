import React from 'react';
import { Skeleton } from '../ui/Skeleton.jsx';

/** Placeholder for future async service catalog loading. */
export function ServiceRowSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-sm flex flex-col lg:flex-row gap-8">
      <Skeleton className="lg:w-1/2 w-full aspect-[16/10] lg:min-h-[300px] rounded-none" />
      <div className="lg:w-1/2 p-8 sm:p-12 space-y-4 flex-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-6 flex gap-3">
          <Skeleton className="h-9 w-36 rounded-[var(--radius-button)]" />
          <Skeleton className="h-9 w-44 rounded-[var(--radius-button)]" />
        </div>
      </div>
    </div>
  );
}
