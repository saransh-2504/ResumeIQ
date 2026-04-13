import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if redirected back from OAuth with error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "oauth_failed") {
      setError("OAuth login failed. Recruiters must use email/password login.");
    }
  }, []);

  // Update form field on change
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      loginUser(res.data.user, res.data.token);

      // Redirect based on role
      const role = res.data.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "recruiter") navigate("/recruiter");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      {/* Back button — top left */}
      <button onClick={() => navigate(-1)}
        className="fixed top-4 left-4 flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-indigo-600 transition bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 shadow-sm">
        ← Back
      </button>
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm border border-[var(--border)] p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-indigo-600">
            Resume<span className="text-purple-500">IQ</span>
          </span>
          <p className="text-sm text-[var(--text-muted)] mt-1">Welcome back</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              // autocomplete="email" helps browser suggest previously used email
              autoComplete="email"
              className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
            />
            <div className="text-right mt-1">
              <Link to="/forgot-password" className="text-xs text-indigo-500 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[var(--bg-surface-2)]" />
          <span className="text-xs text-[var(--text-muted)]">or continue with</span>
          <div className="flex-1 h-px bg-[var(--bg-surface-2)]" />
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 border border-[var(--border)] rounded-xl py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>

        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
