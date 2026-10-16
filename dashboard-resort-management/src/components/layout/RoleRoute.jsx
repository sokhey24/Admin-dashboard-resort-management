import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import useRole from "../../util/useRole";

export default function RoleRoute({ children, allowedRoles }) {
  const { profile } = ProfileStore();
  const { role }    = useRole();
  const location    = useLocation();

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/403" state={{ from: location }} replace />;
  }

  return children;
}
