import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import useRole, { ROLES } from "../../util/useRole";

const getHomeByRole = (role) => {
  if (role === ROLES.RESORT)     return "/resort/dashboard";
  if (role === ROLES.RESTAURANT) return "/restaurant/dashboard";
  return "/dashboard";
};

export default function RoleRoute({ children, allowedRoles }) {
  const { profile } = ProfileStore();
  const { role }    = useRole();
  const location    = useLocation();

  // Not logged in — send to login
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role — send to their home
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }

  return children;
}
