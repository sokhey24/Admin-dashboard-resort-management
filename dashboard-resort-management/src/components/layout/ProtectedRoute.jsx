import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import useRole, { ROLES } from "../../util/useRole";

export const getHomeByRole = (role) => {
  if (role === ROLES.RESORT)           return "/resort/dashboard";
  if (role === ROLES.RESTAURANT)       return "/restaurant/dashboard";
  if (role === ROLES.RESORT_STAFF)     return "/resort/dashboard";
  if (role === ROLES.RESTAURANT_STAFF) return "/restaurant/dashboard";
  return "/dashboard";
};

export function ProtectedRoute({ children }) {
  const { profile, access_token } = ProfileStore();
  const location    = useLocation();

  if (!profile || !access_token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const { profile, access_token } = ProfileStore();
  const { role }    = useRole();

  if (profile && access_token) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }
  return children;
}

export default ProtectedRoute;
