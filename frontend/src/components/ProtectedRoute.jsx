import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Each role has a home route — wrong role gets redirected here
const roleHome = {
  candidate: "/dashboard",
  recruiter: "/recruiter",
  admin: "/admin",
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to their own dashboard, not "/"
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || "/"} replace />;
  }

  return children;
}
