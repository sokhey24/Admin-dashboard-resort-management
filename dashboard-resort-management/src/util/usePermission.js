import { ProfileStore } from "../store/ProfileStore";
import useRole, { ROLES } from "./useRole";

/**
 * Permission checks for the admin dashboard.
 * Users with role `admin` bypass all checks (mirrors API PermissionMiddleware).
 */
export function usePermission() {
  const { permission: permissions, roles, profile } = ProfileStore();
  const { isAdmin } = useRole();
  const perms = Array.isArray(permissions) ? permissions : [];
  const role = roles?.[0] ?? profile?.roles?.[0]?.name ?? null;

  const can = (perm) => isAdmin || perms.includes(perm);
  const canAny = (...permsToCheck) =>
    isAdmin || permsToCheck.some((p) => perms.includes(p));
  const canAll = (...permsToCheck) =>
    isAdmin || permsToCheck.every((p) => perms.includes(p));

  const canViewReports = () =>
    isAdmin
    || can("admin.reports.view")
    || role === ROLES.RESORT
    || role === ROLES.RESTAURANT;

  const canViewDashboard = () => {
    if (isAdmin) {
      return true;
    }
    if (role === ROLES.RESORT || role === ROLES.RESTAURANT) {
      return false;
    }
    return can("admin.dashboard.view");
  };

  return { can, canAny, canAll, canViewReports, canViewDashboard, permissions: perms, isAdmin };
}

export default usePermission;
