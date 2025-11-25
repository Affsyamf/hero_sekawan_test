import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { usePermission } from "../../hooks/usePermission";

export default function PermissionRoute({ permission, children }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { hasPermission } = usePermission();

  // Must be logged in
  if (!user || !accessToken) return <Navigate to="/login" replace />;

  // Permission check
  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
