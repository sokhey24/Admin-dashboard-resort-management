import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import usePermission from "../../util/usePermission";
import useRole from "../../util/useRole";
import { getHomeByRole } from "./ProtectedRoute";

export default function DashboardPermissionRoute({ children }) {
  const { profile } = ProfileStore();
  const { canViewDashboard } = usePermission();
  const { role } = useRole();
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canViewDashboard()) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }

  return children;
}
