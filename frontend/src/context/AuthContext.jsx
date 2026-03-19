import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

// Create context
const AuthContext = createContext(null);

// Provider wraps the whole app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // logged-in user object
  const [loading, setLoading] = useState(true); // true while checking cookie on load

  // On app load, check if there's a valid cookie and get user info
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null)) // no valid cookie = not logged in
      .finally(() => setLoading(false));
  }, []);

  // Login: called after successful login API response
  function loginUser(userData) {
    setUser(userData);
  }

  // Logout: call API to clear cookie, then clear state
  async function logoutUser() {
    await api.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext);
}
