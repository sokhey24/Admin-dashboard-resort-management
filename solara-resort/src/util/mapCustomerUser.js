import { resolveStorageUrl } from './media.js';

const avatarFallback = (name) => {
  const label = encodeURIComponent(name || 'Guest');
  return `https://ui-avatars.com/api/?name=${label}&background=d4af37&color=1a1a1a&size=128`;
};

function withAvatarCacheBuster(url, version) {
  if (!url || !version || /^https?:\/\/ui-avatars\.com\//i.test(url)) {
    return url;
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(String(version))}`;
}

/** Map Laravel `/auth/me` user payload to UI-friendly shape (no fabricated loyalty data). */
export function mapCustomerUser(apiUser, roles = []) {
  if (!apiUser) return null;

  const roleNames = Array.isArray(roles)
    ? roles
    : Array.isArray(apiUser.roles)
      ? apiUser.roles
      : [];

  const name = apiUser.name ?? '';
  const version = apiUser.updated_at || apiUser.profile_image;
  const resolvedUrl =
    resolveStorageUrl(apiUser.profile_image_url) ||
    resolveStorageUrl(apiUser.profile_image);
  const avatar = resolvedUrl
    ? withAvatarCacheBuster(resolvedUrl, version)
    : avatarFallback(name);

  const loyalty =
    apiUser.loyalty && typeof apiUser.loyalty === 'object' ? apiUser.loyalty : null;
  const points =
    loyalty && typeof loyalty.points === 'number' ? loyalty.points : null;
  const pointsTarget =
    loyalty && typeof loyalty.points_target === 'number' ? loyalty.points_target : null;
  const memberTier =
    loyalty && typeof loyalty.tier === 'string' && loyalty.tier.trim() !== ''
      ? loyalty.tier
      : null;

  return {
    id: apiUser.id,
    accountId: apiUser.account_id,
    name,
    email: apiUser.email ?? '',
    phone: apiUser.phone ?? '',
    avatar,
    gender: apiUser.gender,
    dateOfBirth: apiUser.date_of_birth,
    address: apiUser.address,
    status: apiUser.status,
    roles: roleNames,
    memberTier,
    points,
    pointsTarget,
    loyalty,
    twoFactorEnabled: Boolean(apiUser.two_factor_enabled),
    lastLoginAt: apiUser.last_login_at,
    raw: apiUser,
  };
}

export function isCustomerRole(roles) {
  const names = Array.isArray(roles) ? roles : [];
  return names.includes('customer');
}
