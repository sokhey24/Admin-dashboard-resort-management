import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";
import { getHomeByRole } from "./ProtectedRoute";

/**
 * Protects a route by permission name(s).
 * If user lacks ALL listed permissions → redirect to their home or show 403.
 */
export default function PermissionRoute({ children, requires }) {
  const { profile } = ProfileStore();
  const { canAny } = usePermission();
  const { role } = useRole();
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const required = Array.isArray(requires) ? requires : [requires];
  const allowed  = canAny(...required);

  if (!allowed) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }

  return children;
}
