const trimTrailingSlash = (url) => String(url || '').replace(/\/+$/, '');

function isLoopbackHost(hostname) {
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
