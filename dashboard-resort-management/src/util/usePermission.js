import { ProfileStore } from "../store/ProfileStore";

/**
 * Returns true if the current user has the given permission.
 * Permissions come from the API (roles → permissions) — never hardcoded.
 */
export function usePermission() {
  const { permission: permissions } = ProfileStore();
  const perms = Array.isArray(permissions) ? permissions : [];

  const can = (perm) => perms.includes(perm);
  const canAny = (...permsToCheck) => permsToCheck.some((p) => perms.includes(p));
  const canAll = (...permsToCheck) => permsToCheck.every((p) => perms.includes(p));

  return { can, canAny, canAll, permissions: perms };
}

export default usePermission;
