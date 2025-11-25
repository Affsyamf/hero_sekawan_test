import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export default function PublicRoute({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  // ✅ Jika sudah login, redirect ke dashboard
  if (accessToken && user) {
    // return <Navigate to="/login" replace />;
    return <Navigate to="/dashboard/overview" replace />;
  }

  return children;
}
