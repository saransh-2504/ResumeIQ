import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps routes that need authentication
// allowedRoles: array of roles that can access this route
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Still checking cookie — show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
