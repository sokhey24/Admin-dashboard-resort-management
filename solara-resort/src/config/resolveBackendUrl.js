const trimTrailingSlash = (url) => String(url || '').replace(/\/+$/, '');

export function isLoopbackHost(hostname) {
  if (!hostname) return true;
  const h = String(hostname).toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

function hostnameFromUrl(url) {
  if (!url) return null;
  try {
    const normalized = String(url).includes('://') ? url : `http://${url}`;
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

/**
 * When the site is opened via LAN IP (e.g. http://192.168.0.248:3000), use the same
 * host for the Laravel API unless .env already points at a non-loopback API URL.
 */
export function resolveApiBaseUrl(envApiUrl, fallback = 'http://localhost:8000/api') {
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : null;

  if (hostname && !isLoopbackHost(hostname)) {
    const envHost = hostnameFromUrl(envApiUrl);
    if (!envApiUrl || isLoopbackHost(envHost)) {
      return `http://${hostname}:8000/api`;
    }
  }

  return trimTrailingSlash(envApiUrl ?? fallback);
}

export function resolveStorageBaseUrl(envImageUrl, fallback = 'http://localhost:8000/storage') {
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : null;

  if (hostname && !isLoopbackHost(hostname)) {
    const envHost = hostnameFromUrl(envImageUrl);
    if (!envImageUrl || isLoopbackHost(envHost)) {
      return `http://${hostname}:8000/storage`;
    }
  }

  return trimTrailingSlash(envImageUrl ?? fallback);
}
