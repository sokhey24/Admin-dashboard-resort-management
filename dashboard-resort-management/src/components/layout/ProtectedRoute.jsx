import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import useRole, { ROLES } from "../../util/useRole";

const getHomeByRole = (role) => {
  if (role === ROLES.RESORT)     return "/resort/dashboard";
  if (role === ROLES.RESTAURANT) return "/restaurant/dashboard";
  return "/revenue/chart";
};

// Blocks unauthenticated users from accessing dashboard
export function ProtectedRoute({ children }) {
  const { profile } = ProfileStore();
  const location    = useLocation();

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Blocks authenticated users from accessing /login and /register
export function GuestRoute({ children }) {
  const { profile } = ProfileStore();
  const { role }    = useRole();

  if (profile) {
    return <Navigate to={getHomeByRole(role)} replace />;
  }
  return children;
}

export default ProtectedRoute;
