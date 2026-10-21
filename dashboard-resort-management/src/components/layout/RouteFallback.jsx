import { Spin } from "antd";

/** Shown while a lazy-loaded route chunk is loading. */
export default function RouteFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center py-16"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Spin size="large" tip="Loading page…" />
    </div>
  );
}
