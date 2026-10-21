const ALLOWED_PREFIXES = [
  "/booking",
  "/pending-booking",
  "/checkin-today",
  "/checkout-today",
  "/payment-room",
  "/payment-restuarand",
  "/invoice",
  "/resort/guest-inbox",
  "/customer",
  "/room",
  "/dashboard",
];

/**
 * Returns a safe in-app path for notification navigation, or null.
 */
export function safeNotificationRoute(url) {
  if (!url || typeof url !== "string") return null;
  const path = url.startsWith("/") ? url.split("?")[0] : `/${url.split("?")[0]}`;
  const ok = ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  return ok ? path : null;
}
