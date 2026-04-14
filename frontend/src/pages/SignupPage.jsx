import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

// ---- Resend Verification Email ----
function ResendVerification({ email }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function handleResend() {
    setLoading(true);
    try {
      await api.post("/auth/resend-verification", { email });
      setSent(true);
      setCooldown(60);
      const t = setInterval(() => {
        setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
      }, 1000);
    } catch {}
    finally { setLoading(false); }
  }

  if (sent) return <p className="text-xs text-green-600 mt-2">Verification email resent!</p>;
  return (
    <button onClick={handleResend} disabled={loading || cooldown > 0}
      className="text-xs text-indigo-500 hover:underline disabled:opacity-50 disabled:no-underline mt-2 block mx-auto">
      {loading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't receive it? Resend email"}
    </button>
  );
}

// ---- Inline Terms Modal ----
function TermsModal({ onAccept, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Terms & Conditions</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl">✕</button>
        </div>
        <div className="px-6 py-4 space-y-4 text-sm text-[var(--text-secondary)]">
          <p className="text-xs text-[var(--text-muted)]">Last updated: March 2026</p>
          {[
            ["1. Acceptance", "By using ResumeIQ, you agree to these terms. If you do not agree, please do not use the platform."],
            ["2. Eligibility", "ResumeIQ is for job seekers and verified recruiters. Recruiters must use a company email and are subject to admin approval."],
            ["3. Your Account", "You are responsible for keeping your credentials secure and providing accurate information during registration."],
            ["4. Resume Data", "Uploaded resumes are stored securely on Cloudinary and parsed using Groq AI solely for job matching. We do not sell your data."],
            ["5. Job Postings", "Recruiters are responsible for the accuracy of their listings. Fake or misleading postings will result in account termination."],
            ["6. Prohibited Use", "You may not scrape the platform, access other users' data, or use ResumeIQ for spam or fraudulent activity."],
            ["7. Disclaimer", "ResumeIQ is provided as-is. ATS scores are indicative only and do not guarantee job selection."],
            ["8. Contact", "Questions? Reach us at saransh2504@gmail.com"],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="font-semibold text-[var(--text-primary)] mb-0.5">{title}</p>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-[var(--border)] text-[var(--text-muted)] py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--bg-surface-2)] transition">
            Decline
          </button>
          <button onClick={onAccept}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.post("/auth/signup", form);
      setSuccess(res.data.message); // "Check your email to verify"
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // If signup succeeded, show success message instead of form
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
        <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm border border-[var(--border)] p-8 w-full max-w-md text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Check your email</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">{success}</p>
          <ResendVerification email={form.email} />
          <button
            onClick={() => navigate("/login")}
            className="mt-4 text-sm text-indigo-600 hover:underline block mx-auto"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      {/* Back button — top left */}
      <button onClick={() => navigate(-1)}
        className="fixed top-4 left-4 flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-indigo-600 transition bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 shadow-sm">
        ← Back
      </button>
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm border border-[var(--border)] p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-indigo-600">
            Resume<span className="text-purple-500">IQ</span>
          </span>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create your account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
            />
            {/* Show hint if recruiter is selected */}
            {form.role === "recruiter" && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Use your company email. Gmail is not allowed for recruiters.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">I am a...</label>
            <div className="flex gap-3">
              {["candidate", "recruiter"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition capitalize
                    ${form.role === r
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-indigo-300"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {/* Recruiter approval notice */}
            {form.role === "recruiter" && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Recruiter accounts require admin approval before you can post jobs.
              </p>
            )}
          </div>

          {/* Terms & Conditions checkbox */}
          <div className="flex items-start gap-2.5">
            <input type="checkbox" id="terms" checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 accent-indigo-600 cursor-pointer" />
            <label htmlFor="terms" className="text-xs text-[var(--text-muted)] leading-relaxed">
              I agree to the{" "}
              <button type="button" onClick={() => setShowTerms(true)}
                className="text-indigo-600 hover:underline font-medium">
                Terms & Conditions
              </button>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition
              ${termsAccepted
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-indigo-200 text-indigo-400 cursor-not-allowed"
              } disabled:opacity-60`}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* OAuth — only for candidates */}
        {form.role === "candidate" && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--bg-surface-2)]" />
              <span className="text-xs text-[var(--text-muted)]">or</span>
              <div className="flex-1 h-px bg-[var(--bg-surface-2)]" />
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!termsAccepted) { setShowTerms(true); return; }
                  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
                }}
                className={`w-full flex items-center justify-center gap-3 border rounded-xl py-2.5 text-sm font-medium transition
                  ${termsAccepted
                    ? "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
                    : "border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-surface-2)] cursor-not-allowed"
                  }`}
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                {termsAccepted ? "Sign up with Google" : "Accept terms to sign up with Google"}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>

      {/* Terms modal */}
      {showTerms && (
        <TermsModal
          onAccept={() => { setTermsAccepted(true); setShowTerms(false); }}
          onClose={() => setShowTerms(false)}
        />
      )}
    </div>
  );
}
