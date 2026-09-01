import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";
import { getHomeByRole } from "./ProtectedRoute";

// Routes that only admin can ever access, regardless of permissions
const ADMIN_ONLY_ROUTES = ["/dashboard"];

/**
 * Protects a route by permission name(s).
 * If user lacks ALL listed permissions → redirect to their home or show 403.
 */
export default function PermissionRoute({ children, requires }) {
  const { profile } = ProfileStore();
  const { can, canAny } = usePermission();
  const { role, isAdmin } = useRole();
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Hard block: /dashboard is admin-only, all other roles get sent to their home
  if (ADMIN_ONLY_ROUTES.includes(location.pathname) && !isAdmin) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }

  const required = Array.isArray(requires) ? requires : [requires];
  const allowed  = canAny(...required);

  if (!allowed) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }

  return children;
}
