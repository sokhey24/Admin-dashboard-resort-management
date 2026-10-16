import config from './config.js';

/**
 * Build a browser-loadable URL for Laravel public disk paths or API absolute URLs.
 * Rewrites …/storage/… to VITE_IMAGE_URL (or LAN host via resolveStorageBaseUrl).
 */
/** Activity/CMS image: keep Vite-bundled or absolute URLs; rewrite Laravel storage paths only. */
export function resolveActivityImage(src) {
  if (!src) return null;
  const str = String(src);
  if (/^https?:\/\//i.test(str)) {
    return /\/storage\//i.test(str) ? resolveStorageUrl(str) : str;
  }
  if (str.startsWith('/') && !str.startsWith('/storage')) {
    return str;
  }
  return resolveStorageUrl(src) || src;
}

export function resolveStorageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  const str = String(pathOrUrl);
  if (/^https?:\/\//i.test(str)) {
    const storageTail = str.match(/\/storage\/(.+)$/i);
    if (storageTail) {
      const base = config.imageUrl.replace(/\/+$/, '');
      return `${base}/${storageTail[1]}`;
    }
    return str;
  }
  const path = str.replace(/^\/+/, '');
  return `${config.imageUrl}/${path}`;
}

/** Primary room photo from API room payload (catalog + booking relations). */
export function resolveRoomFeaturedImage(room) {
  if (!room) return null;
  const images = room.images || [];
  const primary = images.find((img) => img.is_primary) || images[0];
  return (
    resolveStorageUrl(primary?.image_path) ||
    resolveStorageUrl(primary?.url) ||
    null
  );
}

export function resolveResortFeaturedImage(resort) {
  if (!resort) return null;
  return (
    resolveStorageUrl(resort.cover_image_url) ||
    resolveStorageUrl(resort.cover_image) ||
    null
  );
}
