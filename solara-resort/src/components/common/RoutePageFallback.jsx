/** Lightweight branded fallback while a route chunk loads. */
export function RoutePageFallback() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent"
        aria-hidden
      />
      <p className="text-sm font-serif text-text">Solara Resort</p>
      <p className="text-xs text-muted">Loading…</p>
    </div>
  );
}
