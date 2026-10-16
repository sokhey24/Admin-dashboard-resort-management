import { Navigate, useLocation } from "react-router-dom";
import { ProfileStore } from "../../store/ProfileStore";
import usePermission from "../../util/usePermission";

export default function ReportsPermissionRoute({ children }) {
  const { profile } = ProfileStore();
  const { canViewReports } = usePermission();
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canViewReports()) {
    return <Navigate to="/403" state={{ from: location }} replace />;
  }

  return children;
}
