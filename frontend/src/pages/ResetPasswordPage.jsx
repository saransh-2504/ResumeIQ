import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Get token from URL: /reset-password?token=xxx
  const token = new URLSearchParams(window.location.search).get("token");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      return setError("Passwords do not match.");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (!token) {
      return setError("Invalid reset link. Please request a new one.");
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password?token=${token}`, { password: form.password });
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
        <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm border border-[var(--border)] p-8 w-full max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Password reset successful</h2>
          <p className="text-sm text-[var(--text-muted)]">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm border border-[var(--border)] p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-indigo-600">
            Resume<span className="text-purple-500">IQ</span>
          </span>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create a new password</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">New Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
              required
              autoComplete="new-password"
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          <Link to="/login" className="text-indigo-600 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
