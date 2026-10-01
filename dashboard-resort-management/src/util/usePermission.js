import { ProfileStore } from "../store/ProfileStore";
import { ROLES } from "./useRole";

/**
 * Returns true if the current user has the given permission.
 * Permissions come from the API (roles → permissions) — never hardcoded.
 */
export function usePermission() {
  const { permission: permissions, roles, profile } = ProfileStore();
  const perms = Array.isArray(permissions) ? permissions : [];
  const role = roles?.[0] ?? profile?.roles?.[0]?.name ?? null;

  const can = (perm) => perms.includes(perm);
  const canAny = (...permsToCheck) => permsToCheck.some((p) => perms.includes(p));
  const canAll = (...permsToCheck) => permsToCheck.every((p) => perms.includes(p));

  const canViewReports = () =>
    can("admin.reports.view")
    || role === ROLES.ADMIN
    || role === ROLES.RESORT
    || role === ROLES.RESTAURANT;

  const canViewDashboard = () => {
    if (role === ROLES.RESORT || role === ROLES.RESTAURANT) {
      return false;
    }
    return role === ROLES.ADMIN || can("admin.dashboard.view");
  };

  return { can, canAny, canAll, canViewReports, canViewDashboard, permissions: perms };
}

export default usePermission;
