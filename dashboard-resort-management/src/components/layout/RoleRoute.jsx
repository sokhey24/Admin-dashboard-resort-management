import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import useRole from "../../util/useRole";
import { getHomeByRole } from "./ProtectedRoute";

export default function RoleRoute({ children, allowedRoles }) {
  const { profile } = ProfileStore();
  const { role }    = useRole();
  const location    = useLocation();

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }

  return children;
}
