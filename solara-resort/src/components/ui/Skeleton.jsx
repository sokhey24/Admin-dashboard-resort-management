import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-surface-hover/80 rounded ${className}`}
    />
  );
};

export const ResortCardSkeleton = ({ imageClassName = 'w-full aspect-[16/10]' }) => {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-sm h-full">
      <Skeleton className={imageClassName} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-28 rounded-[var(--radius-button)]" />
        </div>
      </div>
    </div>
  );
};

export const RoomCardSkeleton = () => {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-sm">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-9 w-24 rounded-[var(--radius-button)]" />
        </div>
      </div>
    </div>
  );
};

export const GuestReviewCardSkeleton = () => {
  return (
    <div className="rounded-[var(--radius-modal)] overflow-hidden border border-gold/30 bg-gradient-to-r from-slate-950 via-surface to-slate-950 flex flex-col lg:flex-row">
      <div className="flex-1 p-8 sm:p-10 space-y-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-40 mt-4" />
      </div>
      <Skeleton className="w-full lg:w-56 xl:w-64 min-h-[140px] lg:min-h-[180px]" />
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        <ResortCardSkeleton />
        <ResortCardSkeleton />
        <ResortCardSkeleton />
      </div>
    </div>
  );
};
