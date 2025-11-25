import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export default function PermissionRoute({ permission, children }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!user || !accessToken) return <Navigate to="/login" replace />;

  // Superadmin bypass
  if (user.roles?.includes("Superadmin")) return children;

  const permissions = user.permissions || [];

  if (!permissions.includes(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
