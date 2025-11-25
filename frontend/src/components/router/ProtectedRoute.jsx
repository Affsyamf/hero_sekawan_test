import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export default function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
