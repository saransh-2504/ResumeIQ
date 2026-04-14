import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if token came via OAuth redirect URL (?token=...)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${urlToken}`;
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Check token in localStorage on app load
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    // Set token in axios default headers
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function loginUser(userData, token) {
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setUser(userData);
  }

  async function logoutUser() {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/");
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
