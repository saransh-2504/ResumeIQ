import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { icon: "💼", label: "Jobs", id: "jobs" },
  { icon: "📋", label: "My Applications", id: "applications" },
  { icon: "📊", label: "Resume Analysis", id: "analysis" },
  { icon: "⚙️", label: "Settings", id: "settings" },
];

function Sidebar({ active, setActive }) {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1">
      <div className="text-lg font-bold text-indigo-600 mb-6 cursor-pointer" onClick={() => navigate("/")}>
        Resume<span className="text-purple-500">IQ</span>
      </div>
      {navLinks.map((link) => (
        <button key={link.id} onClick={() => setActive(link.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left
            ${active === link.id ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}>
          <span>{link.icon}</span>{link.label}
        </button>
      ))}
      <button onClick={logoutUser}
        className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 transition text-left">
        <span>🚪</span> Logout
      </button>
    </aside>
  );
}

function TopBar() {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-800">Candidate Dashboard</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}

function TypeBadge({ type }) {
  const colors = { "Full-time": "bg-green-100 text-green-700", Internship: "bg-blue-100 text-blue-700", "Part-time": "bg-yellow-100 text-yellow-700" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || "bg-gray-100 text-gray-500"}`}>{type}</span>;
}

function StatusBadge({ status }) {
  const colors = { applied: "bg-blue-50 text-blue-600", reviewed: "bg-yellow-50 text-yellow-600", shortlisted: "bg-green-50 text-green-600", rejected: "bg-red-50 text-red-500" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[status] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
}

function ScoreCircle({ score }) {
  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${score} 100`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-800">{score}</span>
    </div>
  );
}

// ---- Contact Verification Widget ----
// Auto-matches resume email with account email — no manual input
function ContactVerification({ parsedEmail, accountEmail, onVerified }) {
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("idle"); // "idle" | "otp"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Check if emails match
  const emailsMatch = parsedEmail?.toLowerCase() === accountEmail?.toLowerCase();

  async function handleSendOTP() {
    setError(""); setLoading(true);
    try {
      // No body needed — backend uses account email automatically
      await api.post("/resume/send-otp");
      setStep("otp");
      setMsg(`OTP sent to ${accountEmail}`);
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(""); setLoading(true);
    try {
      // Only send otp — no contact field needed
      await api.post("/resume/verify-otp", { otp });
      setMsg("Contact verified!");
      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  // Emails don't match — show error, no OTP option
  if (parsedEmail && !emailsMatch) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3">
        <p className="text-sm font-semibold text-red-600 mb-1">⚠️ Email mismatch</p>
        <p className="text-xs text-red-500 mb-1">
          Resume email: <span className="font-medium">{parsedEmail}</span>
        </p>
        <p className="text-xs text-red-500">
          Account email: <span className="font-medium">{accountEmail}</span>
        </p>
        <p className="text-xs text-red-400 mt-2">
          Please update your resume with your account email and re-upload.
        </p>
      </div>
    );
  }

  // No email in resume
  if (!parsedEmail) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-3">
        <p className="text-sm font-semibold text-yellow-700 mb-1">⚠️ No email in resume</p>
        <p className="text-xs text-yellow-600">Add your email to your resume and re-upload to enable verification.</p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-3">
      <p className="text-sm font-semibold text-yellow-700 mb-1">🔐 Verify your contact</p>
      <p className="text-xs text-yellow-600 mb-1">
        Resume email matches your account: <span className="font-medium">{accountEmail}</span>
      </p>
      <p className="text-xs text-yellow-500 mb-3">Required before you can apply to jobs.</p>

      {msg && <p className="text-xs text-green-600 mb-2">{msg}</p>}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {step === "idle" ? (
        <button onClick={handleSendOTP} disabled={loading}
          className="w-full bg-yellow-500 text-white py-2 rounded-xl text-xs font-semibold hover:bg-yellow-600 transition disabled:opacity-60">
          {loading ? "Sending..." : "Send OTP to my email"}
        </button>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full border border-yellow-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 bg-white tracking-widest text-center font-mono"
          />
          <button onClick={handleVerify} disabled={otp.length !== 6 || loading}
            className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-green-700 transition disabled:opacity-60">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button onClick={() => { if (cooldown === 0) handleSendOTP(); }}
            disabled={cooldown > 0}
            className="w-full text-xs text-yellow-600 hover:underline disabled:opacity-50 disabled:no-underline">
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Parsed Resume Info Card ----
function ParsedDataCard({ parsedData, onReparse }) {
  const [expanded, setExpanded] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseMsg, setReparseMsg] = useState("");

  async function handleReparse() {
    setReparsing(true); setReparseMsg("");
    try {
      await api.post("/resume/reparse");
      setReparseMsg("Re-parsed! Refreshing...");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setReparseMsg(err.response?.data?.message || "Re-parse failed.");
    } finally {
      setReparsing(false);
    }
  }

  if (!parsedData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-3">
        <p className="text-xs font-semibold text-yellow-700 mb-1">⚠️ Resume not parsed yet</p>
        <p className="text-xs text-yellow-600 mb-2">Parsing may have failed. Click below to retry.</p>
        {reparseMsg && <p className="text-xs text-green-600 mb-2">{reparseMsg}</p>}
        <button onClick={handleReparse} disabled={reparsing}
          className="w-full bg-yellow-500 text-white py-2 rounded-xl text-xs font-semibold hover:bg-yellow-600 transition disabled:opacity-60">
          {reparsing ? "Re-parsing..." : "Re-parse Resume"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-indigo-700">📋 Parsed from your resume</p>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-500 hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>

      {/* Always show name + contact */}
      <div className="space-y-1 text-xs text-indigo-600">
        {parsedData.name && <p>👤 {parsedData.name}</p>}
        {parsedData.email && <p>✉️ {parsedData.email}</p>}
        {parsedData.phone && <p>📞 {parsedData.phone}</p>}
      </div>

      {/* Skills */}
      {parsedData.skills?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-indigo-500 mb-1">Skills detected:</p>
          <div className="flex flex-wrap gap-1">
            {parsedData.skills.slice(0, expanded ? undefined : 6).map((s) => (
              <span key={s} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">{s}</span>
            ))}
            {!expanded && parsedData.skills.length > 6 && (
              <span className="text-xs text-indigo-400">+{parsedData.skills.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* Experience — only when expanded */}
      {expanded && parsedData.experience?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-indigo-600 mb-1">Experience</p>
          {parsedData.experience.map((exp, i) => (
            <div key={i} className="text-xs text-indigo-600 mb-1">
              <span className="font-medium">{exp.jobTitle}</span>
              {exp.organization && <span> at {exp.organization}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Education — only when expanded */}
      {expanded && parsedData.education?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-indigo-600 mb-1">Education</p>
          {parsedData.education.map((edu, i) => (
            <div key={i} className="text-xs text-indigo-600 mb-1">
              <span className="font-medium">{edu.degree || edu.field}</span>
              {edu.institution && <span> — {edu.institution}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Re-parse option if email is missing */}
      {!parsedData.email && (
        <div className="mt-3 pt-3 border-t border-indigo-100">
          <p className="text-xs text-yellow-600 mb-1">⚠️ Email not detected in resume.</p>
          {reparseMsg && <p className="text-xs text-green-600 mb-1">{reparseMsg}</p>}
          <button onClick={handleReparse} disabled={reparsing}
            className="text-xs text-indigo-500 hover:underline disabled:opacity-50">
            {reparsing ? "Re-parsing..." : "Try re-parsing"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Job Analysis + Apply Panel ----
function JobAnalysisPanel({ job, onClose }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [error, setError] = useState("");
  const [atsError, setAtsError] = useState("");
  const [applyMsg, setApplyMsg] = useState("");
  const [replacing, setReplacing] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [existingResume, setExistingResume] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(true);

  // Fetch resume + check if already applied
  const fetchResume = useCallback(() => {
    setResumeLoading(true);
    api.get("/resume")
      .then((res) => setExistingResume(res.data.resume))
      .catch(() => setExistingResume(null))
      .finally(() => setResumeLoading(false));
  }, []);

  useEffect(() => {
    fetchResume();
    api.get("/applications/my")
      .then((res) => {
        const applied = res.data.applications?.some((a) => a.jobId?._id === job._id || a.jobId === job._id);
        setAlreadyApplied(applied);
      })
      .catch(() => {});
  }, [job._id, fetchResume]);

  function handleFile(picked) {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(picked.type)) { setError("Only PDF or DOCX files allowed."); return; }
    if (picked.size > 5 * 1024 * 1024) { setError("File must be under 5MB."); return; }
    setError(""); setFile(picked);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      await api.post("/resume", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setReplacing(false); setFile(null);
      fetchResume(); // refresh to get parsed data
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleApply() {
    setApplying(true); setApplyMsg("");
    try {
      await api.post(`/jobs/${job._id}/apply`);
      setAlreadyApplied(true);
      setApplyMsg("Application submitted successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to apply.";
      if (msg.includes("already applied")) setAlreadyApplied(true);
      setApplyMsg(msg);
    } finally {
      setApplying(false);
    }
  }

  async function handleAnalyze() {
    setAtsLoading(true);
    setAtsError("");
    try {
      const res = await api.get(`/jobs/${job._id}/ats-score`);
      setResult(res.data.ats);
    } catch (err) {
      setAtsError(err.response?.data?.message || "Could not calculate score.");
    } finally {
      setAtsLoading(false);
    }
  }

  const isVerified = existingResume?.contactVerified;
  const parsedEmail = existingResume?.parsedData?.email;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Job header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600">{job.company[0]}</div>
          <div>
            <p className="font-semibold text-gray-800">{job.title}</p>
            <p className="text-xs text-gray-400">{job.company} · {job.location}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
      </div>

      <TypeBadge type={job.type} />

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Required Skills</p>
        <div className="flex flex-wrap gap-1">
          {job.skillsRequired?.map((t) => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{t}</span>)}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Job Description</p>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
      </div>
      <div className="mt-3 text-xs text-gray-400">Posted by {job.postedBy?.name || "Recruiter"}</div>

      <hr className="my-4 border-gray-100" />

      {/* Show applyMsg at top only when NOT in ATS result view (ATS view has its own) */}
      {applyMsg && !result && (
        <div className={`text-xs px-4 py-2 rounded-xl mb-3 ${alreadyApplied ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{applyMsg}</div>
      )}
      {alreadyApplied && !applyMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3 text-xs text-green-700 font-medium">✅ You have already applied to this job.</div>
      )}

      {resumeLoading ? (
        <div className="text-xs text-gray-400 text-center py-2">Checking resume...</div>
      ) : result ? (
        /* ---- ATS Result Panel ---- */
        <div className="space-y-3">
          {/* Back button */}
          <button onClick={() => setResult(null)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
            ← Back to resume
          </button>

          {/* Score card */}
          <div className={`rounded-2xl p-5 border ${
            result.score >= 80 ? "bg-green-50 border-green-200" :
            result.score >= 60 ? "bg-yellow-50 border-yellow-200" :
            "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center gap-4">
              <ScoreCircle score={result.score} />
              <div>
                <p className="text-base font-bold text-gray-800">{result.score}% Match</p>
                <p className={`text-xs font-medium mt-0.5 ${
                  result.score >= 80 ? "text-green-600" :
                  result.score >= 60 ? "text-yellow-600" : "text-red-500"
                }`}>
                  {result.score >= 80 ? "🎉 Strong match — apply with confidence" :
                   result.score >= 60 ? "👍 Good match — a few gaps to address" :
                   "📚 Needs improvement before applying"}
                </p>
              </div>
            </div>

            {/* Score breakdown bars */}
            <div className="mt-4 space-y-2">
              {[
                { label: "Skills", value: result.breakdown.skillScore, max: 60, color: "bg-indigo-500" },
                { label: "Experience", value: result.breakdown.expScore, max: 25, color: "bg-purple-500" },
                { label: "Education", value: result.breakdown.eduScore, max: 15, color: "bg-blue-400" },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{label}</span>
                    <span>{value}/{max}</span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matched skills */}
          {result.matched.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-green-600 mb-2">✅ Matching Skills ({result.matched.length})</p>
              <div className="flex flex-wrap gap-1">
                {result.matched.map((k) => (
                  <span key={k} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg border border-green-100">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {result.missing.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-red-500 mb-2">❌ Missing Skills ({result.missing.length})</p>
              <div className="flex flex-wrap gap-1">
                {result.missing.map((k) => (
                  <span key={k} className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-lg border border-red-100">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">💡 Suggestions</p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-gray-500 flex gap-2">
                    <span className="text-indigo-400 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {!alreadyApplied && isVerified && (
              <button onClick={handleApply} disabled={applying}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                {applying ? "Applying..." : "Apply Now"}
              </button>
            )}
            <button onClick={() => { setResult(null); setReplacing(true); }}
              className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition">
              Replace Resume
            </button>
          </div>
          {applyMsg && (
            <p className={`text-xs text-center ${alreadyApplied ? "text-green-600" : "text-red-500"}`}>{applyMsg}</p>
          )}
        </div>
      ) : existingResume && !replacing ? (
        /* Resume on file */
        <div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-600">📄</span>
              <p className="text-sm font-semibold text-green-700">Resume on file</p>
              {isVerified && <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>}
            </div>
            <p className="text-xs text-green-600 mb-1 truncate">{existingResume.fileName}</p>
            <p className="text-xs text-gray-400 mb-3">Uploaded {new Date(existingResume.uploadedAt).toLocaleDateString()}</p>

            <div className="flex gap-2 mb-2">
              <button onClick={handleAnalyze} disabled={atsLoading || !existingResume?.parsedData}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                {atsLoading ? "Analyzing..." : "Analyze Resume"}
              </button>
              <button onClick={() => setReplacing(true)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition">
                Replace
              </button>
            </div>
            {!existingResume?.parsedData && (
              <p className="text-xs text-yellow-600 mb-2">⚠️ Resume not parsed — scroll down to re-parse before analyzing.</p>
            )}
            {atsError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-2">{atsError}</p>}

            {/* Apply button — only if verified */}
            {!alreadyApplied && isVerified && (
              <button onClick={handleApply} disabled={applying}
                className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-green-700 transition disabled:opacity-60">
                {applying ? "Applying..." : "Apply Now"}
              </button>
            )}
          </div>

          {/* Parsed data card */}
          <ParsedDataCard parsedData={existingResume.parsedData} />

          {/* Contact verification — required before applying */}
          {!isVerified && (
            <ContactVerification
              parsedEmail={parsedEmail}
              accountEmail={existingResume?.verifiedContact || user?.email}
              onVerified={async () => {
                await fetchResume();
                // Small delay to let state settle, then auto-analyze
                setTimeout(() => handleAnalyze(), 800);
              }}
            />
          )}
        </div>
      ) : (
        /* No resume / replacing */
        <div className="bg-indigo-50 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-700 mb-1">{replacing ? "Upload New Resume" : "Upload Resume to Apply"}</p>
          <p className="text-xs text-indigo-400 mb-3">PDF or DOCX · Max 5MB</p>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => document.getElementById("resume-input").click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition
              ${dragging ? "border-indigo-400 bg-indigo-100" : "border-indigo-200 bg-white hover:bg-indigo-50"}`}>
            <p className="text-xl mb-1">📄</p>
            {file ? <p className="text-xs text-indigo-600 font-medium">{file.name}</p> : <p className="text-xs text-gray-400">Drag & drop or click to select</p>}
          </div>
          <input id="resume-input" type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden" onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
          <div className="flex gap-2 mt-3">
            <button onClick={handleUpload} disabled={!file || uploading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>
            {replacing && (
              <button onClick={() => { setReplacing(false); setFile(null); setError(""); }}
                className="px-4 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Jobs Feed ----
function JobsFeed({ onSelect, selectedId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeData, setResumeData] = useState(null); // full parsedData for exp/edu scoring

  useEffect(() => {
    // Fetch jobs
    api.get("/jobs")
      .then((res) => setJobs(res.data.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));

    // Fetch resume for recommendation scoring
    api.get("/resume")
      .then((res) => {
        const parsed = res.data.resume?.parsedData;
        setResumeData(parsed || null);
        const skills = parsed?.skills || [];
        setResumeSkills(skills.map((s) => s.toLowerCase()));
      })
      .catch(() => {});
  }, []);

  // Calculate match % using same weights as backend ATS:
  // Skills 60% + Experience 25% + Education 15%
  function matchScore(job) {
    if (!job.skillsRequired?.length) return 0;

    const jobSkills = job.skillsRequired.map((s) => s.toLowerCase());

    // Skills score (60% weight) — same partial match logic as atsScore.js
    const exactMatched = jobSkills.filter((s) => resumeSkills.includes(s));
    const partialMatched = jobSkills.filter(
      (s) => !resumeSkills.includes(s) && resumeSkills.some((rs) => rs.includes(s) || s.includes(rs))
    );
    const skillScore = resumeSkills.length === 0 ? 0 :
      Math.round(((exactMatched.length + partialMatched.length * 0.5) / jobSkills.length) * 60);

    // Experience (25%) + Education (15%) — use cached resume data
    const expScore = resumeData?.experience?.length > 0 ? 25 : 0;
    const eduScore = resumeData?.education?.length > 0 ? 15 : 0;

    return Math.min(100, skillScore + expScore + eduScore);
  }

  // Sort jobs by match score descending
  const sortedJobs = [...jobs].sort((a, b) => matchScore(b) - matchScore(a));

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
          <div className="h-4 w-40 bg-gray-100 rounded mb-2" /><div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );

  if (jobs.length === 0) return <div className="text-center py-16 text-gray-400 text-sm">No jobs available right now.</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
        {resumeSkills.length > 0 ? "Recommended for you" : "All Jobs"}
      </p>
      {sortedJobs.map((job) => {
        const score = matchScore(job);
        return (
          <div key={job._id} onClick={() => onSelect(job)}
            className={`bg-white border rounded-2xl p-4 cursor-pointer transition hover:shadow-md ${selectedId === job._id ? "border-indigo-400 shadow-sm" : "border-gray-100"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600">{job.company[0]}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{job.title}</p>
                <p className="text-xs text-gray-400">{job.company} · {job.location}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <TypeBadge type={job.type} />
                {score > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    score >= 70 ? "bg-green-100 text-green-700" :
                    score >= 40 ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {score}% match
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {job.skillsRequired?.map((t) => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{t}</span>)}
            </div>
            {job.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{job.description}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ---- My Applications Tab ----
function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/applications/my").then((res) => setApplications(res.data.applications)).catch(() => setApplications([])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
          <div className="h-4 w-40 bg-gray-100 rounded mb-2" /><div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );

  if (applications.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
      No applications yet. Apply to jobs from the Jobs tab.
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
        {applications.length} Application{applications.length !== 1 ? "s" : ""}
      </p>
      {applications.map((app) => (
        <div key={app._id} className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600">{app.jobId?.company?.[0] || "?"}</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{app.jobId?.title || "Job removed"}</p>
                <p className="text-xs text-gray-400">{app.jobId?.company} · {app.jobId?.location}</p>
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>📄</span><span className="truncate max-w-[180px]">{app.resumeFileName}</span>
            </div>
            <span className="text-xs text-gray-400">Applied {new Date(app.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MainContent({ active }) {
  const [selectedJob, setSelectedJob] = useState(null);
  if (active === "applications") return <MyApplications />;
  if (active === "settings" || active === "analysis") return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-400 text-center">Coming soon...</div>
  );
  return (
    <div className={`grid gap-6 ${selectedJob ? "grid-cols-2" : "grid-cols-1"}`}>
      <JobsFeed onSelect={setSelectedJob} selectedId={selectedJob?._id} />
      {selectedJob && <JobAnalysisPanel job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}

export default function UserDashboard() {
  const [active, setActive] = useState("jobs");
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6 overflow-y-auto"><MainContent active={active} /></main>
      </div>
    </div>
  );
}
