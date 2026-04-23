import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SettingsPage from "./SettingsPage";
import NotificationBell from "../components/common/NotificationBell";
import ThemeToggle from "../components/common/ThemeToggle";

// ---- Sidebar nav links ----
const navLinks = [
  { icon: "🏠", label: "Dashboard", id: "dashboard" },
  { icon: "➕", label: "Post Job", id: "post" },
  { icon: "🏘️", label: "Community", id: "community" },
  { icon: "⚙️", label: "Settings", id: "settings" },
];

function Sidebar({ active, setActive }) {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();
  return (
    <aside className="w-56 min-h-screen bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col py-6 px-4 gap-1">
      <div className="text-lg font-bold text-indigo-600 mb-1 cursor-pointer" onClick={() => navigate("/")}>
        Resume<span className="text-purple-500">IQ</span>
      </div>
      <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full w-fit mb-4">Recruiter</span>
      {navLinks.map((link) => (
        <button key={link.id} onClick={() => setActive(link.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left
            ${active === link.id
              ? "bg-[var(--accent-light)] text-[var(--accent-text)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"}`}>
          <span>{link.icon}</span>{link.label}
        </button>
      ))}
      <button onClick={logoutUser}
        className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left">
        <span>🚪</span> Logout
      </button>
    </aside>
  );
}

function TopBar() {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface)] border-b border-[var(--border)]">
      <p className="text-sm font-semibold text-[var(--text-primary)]">Recruiter Dashboard</p>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        <span className="text-sm text-[var(--text-muted)]">{user?.name}</span>
        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}

// ---- View Resume Button — opens public Cloudinary URL directly ----
function ViewResumeButton({ appId, fileName }) {
  const [loading, setLoading] = useState(false);

  async function handleView() {
    setLoading(true);
    try {
      const res = await api.get(`/applications/${appId}/resume-url`);
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    } catch {
      alert("Could not load resume. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleView} disabled={loading}
      className="text-xs text-indigo-600 hover:underline disabled:opacity-50">
      {loading ? "Loading..." : "View Resume"}
    </button>
  );
}

// ---- Applicants list inside job modal ----
function ApplicantsList({ jobId }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | applied | reviewed | shortlisted | rejected

  useEffect(() => {
    api.get(`/jobs/${jobId}/applications`)
      .then((res) => setApplicants(res.data.applicants))
      .catch(() => setApplicants([]))
      .finally(() => setLoading(false));
  }, [jobId]);

  const statusColors = {
    applied: "bg-blue-50 text-blue-600",
    reviewed: "bg-yellow-50 text-yellow-600",
    shortlisted: "bg-[var(--success-bg)] text-[var(--success-text)]",
    rejected: "bg-red-50 text-red-500",
  };

  async function handleStatusChange(appId, status) {
    try {
      await api.patch(`/applications/${appId}/status`, { status });
      setApplicants((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status } : a))
      );
    } catch {
      // silent fail — status didn't change
    }
  }

  if (loading) return <div className="text-xs text-[var(--text-muted)] py-2">Loading applicants...</div>;
  if (applicants.length === 0) return <div className="text-xs text-[var(--text-muted)] py-2">No applicants yet.</div>;

  // Count by status
  const counts = applicants.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter === "all" ? applicants : applicants.filter((a) => a.status === filter);

  const filterBtns = [
    { key: "all", label: `All (${applicants.length})` },
    { key: "applied", label: `Applied (${counts.applied || 0})` },
    { key: "reviewed", label: `Reviewed (${counts.reviewed || 0})` },
    { key: "shortlisted", label: `Shortlisted (${counts.shortlisted || 0})` },
    { key: "rejected", label: `Rejected (${counts.rejected || 0})` },
  ];

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {filterBtns.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition ${
              filter === key ? "bg-indigo-600 text-white" : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] py-2">No applicants with this status.</p>
      )}

      {filtered.map((app) => (
        <div key={app._id} className="bg-[var(--bg-surface-2)] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{app.candidate.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{app.candidate.email}</p>
            </div>
            <select value={app.status} onChange={(e) => handleStatusChange(app._id, e.target.value)}
              className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${statusColors[app.status]}`}>
              <option value="applied">Applied</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <span>📄</span>
              <span className="truncate max-w-[160px]">{app.resumeFileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">{new Date(app.appliedAt).toLocaleDateString()}</span>
              <ViewResumeButton appId={app._id} fileName={app.resumeFileName} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Job Detail + Edit Modal ----
function JobModal({ job, onClose, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // "details" | "applicants"
  const [form, setForm] = useState({
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    description: job.description,
    skillsRequired: Array.isArray(job.skillsRequired) ? job.skillsRequired.join(", ") : "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Check if there's a pending admin suggestion
  const hasPendingSuggestion = job.adminSuggestion?.status === "pending";

  async function handleSave() {
    setLoading(true);
    try {
      await api.put(`/jobs/${job._id}`, form);
      setMsg("Job updated successfully.");
      setEditing(false);
      onUpdated(); // refresh list
    } catch (err) {
      setMsg(err.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveSuggestion() {
    try {
      await api.post(`/jobs/${job._id}/suggestion/approve`);
      setMsg("Changes approved and applied.");
      onUpdated();
      onClose();
    } catch (err) {
      setMsg("Failed to approve.");
    }
  }

  async function handleRejectSuggestion() {
    try {
      await api.post(`/jobs/${job._id}/suggestion/reject`);
      setMsg("Suggestion rejected.");
      onUpdated();
      onClose();
    } catch (err) {
      setMsg("Failed to reject.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{job.title}</h2>
            <p className="text-sm text-[var(--text-muted)]">{job.company} · {job.location}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl leading-none">×</button>
        </div>

        {msg && <div className="bg-[var(--accent-light)] text-[var(--accent-text)] text-xs px-4 py-2 rounded-xl mb-4">{msg}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[var(--bg-surface-2)] rounded-xl p-1">
          <button onClick={() => setActiveTab("details")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${activeTab === "details" ? "bg-[var(--bg-surface)] text-indigo-600 shadow-sm" : "text-[var(--text-muted)]"}`}>
            Job Details
          </button>
          <button onClick={() => setActiveTab("applicants")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${activeTab === "applicants" ? "bg-[var(--bg-surface)] text-indigo-600 shadow-sm" : "text-[var(--text-muted)]"}`}>
            Applicants
          </button>
        </div>

        {/* Admin suggestion banner */}
        {hasPendingSuggestion && activeTab === "details" && (
          <div className="bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-[var(--warning-text)] mb-2">📝 Admin suggested changes to this job</p>
            <div className="text-xs text-yellow-600 space-y-1 mb-3">
              {job.adminSuggestion.suggestedTitle !== job.title && <p><span className="font-medium">Title:</span> {job.adminSuggestion.suggestedTitle}</p>}
              {job.adminSuggestion.suggestedDescription !== job.description && <p><span className="font-medium">Description:</span> {job.adminSuggestion.suggestedDescription}</p>}
              {job.adminSuggestion.suggestedLocation !== job.location && <p><span className="font-medium">Location:</span> {job.adminSuggestion.suggestedLocation}</p>}
              {job.adminSuggestion.suggestedType !== job.type && <p><span className="font-medium">Type:</span> {job.adminSuggestion.suggestedType}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={handleApproveSuggestion}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                Accept Changes
              </button>
              <button onClick={handleRejectSuggestion}
                className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === "applicants" ? (
          <ApplicantsList jobId={job._id} />
        ) : !editing ? (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-[var(--accent-light)] text-[var(--accent-text)] px-2 py-1 rounded-full">{job.type}</span>
              {job.skillsRequired?.map((s) => (
                <span key={s} className="text-xs bg-[var(--bg-surface-2)] text-[var(--text-secondary)] px-2 py-1 rounded-full">{s}</span>
              ))}
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Description</p>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
            <button onClick={() => setEditing(true)}
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
              Edit Job
            </button>
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-3">
            {[
              { label: "Job Title", key: "title" },
              { label: "Company", key: "company" },
              { label: "Location", key: "location" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
                <input type="text" value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
              </div>
            ))}
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Job Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                <option>Full-time</option>
                <option>Internship</option>
                <option>Part-time</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Description</label>
              <textarea rows={4} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Skills (comma separated)</label>
              <input type="text" value={form.skillsRequired}
                onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={loading}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)}
                className="text-sm text-[var(--text-muted)] px-4 py-2 rounded-xl hover:bg-[var(--bg-surface-2)] transition">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Post Job Form ----
function PostJob({ onJobPosted, onGoToSettings }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", skillsRequired: "", type: "Full-time", company: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/jobs", form);
      setSuccess("Job posted successfully.");
      setForm({ title: "", description: "", skillsRequired: "", type: "Full-time", company: "", location: "" });
      onJobPosted();
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresProfileSetup) {
        // Redirect to settings to complete profile
        onGoToSettings();
        return;
      }
      setError(data?.message || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  }

  if (!user?.isApproved) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
        You need admin approval before you can post jobs.
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 max-w-xl">
      <p className="text-sm font-semibold text-[var(--text-primary)] mb-5">Post a New Job</p>
      {error && <div className="bg-[var(--error-bg)] text-[var(--error-text)] text-xs px-4 py-3 rounded-xl mb-4">{error}</div>}
      {success && <div className="bg-[var(--success-bg)] text-[var(--success-text)] text-xs px-4 py-3 rounded-xl mb-4">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: "Job Title", key: "title", placeholder: "e.g. Frontend Developer" },
          { label: "Company Name", key: "company", placeholder: "e.g. Razorpay" },
          { label: "Location", key: "location", placeholder: "e.g. Bangalore / Remote" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
            <input required type="text" placeholder={placeholder} value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
          </div>
        ))}
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Job Description</label>
          <textarea required rows={4} placeholder="Describe the role..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Required Skills (comma separated)</label>
          <input type="text" placeholder="e.g. React, Node.js, SQL" value={form.skillsRequired}
            onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Job Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
            <option>Full-time</option>
            <option>Internship</option>
            <option>Part-time</option>
          </select>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
          {loading ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}

// ---- My Job Listings ----
function JobListings({ refresh, onRefresh }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/jobs/recruiter/my-jobs")
      .then((res) => setJobs(res.data.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this job?")) return;
    await api.delete(`/jobs/${id}`);
    setJobs(jobs.filter((j) => j._id !== id));
  }

  async function handleToggle(id, e) {
    e.stopPropagation();
    try {
      const res = await api.patch(`/jobs/${id}/toggle`);
      setJobs(jobs.map((j) => j._id === id ? { ...j, isActive: res.data.isActive } : j));
    } catch {
      // silent
    }
  }

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading jobs...</div>;

  return (
    <>
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdated={() => { onRefresh(); setSelectedJob(null); }}
        />
      )}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">Your Job Postings</p>
        {jobs.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">No jobs posted yet.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <div key={j._id}
                onClick={() => setSelectedJob(j)}
                className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface-2)] rounded-xl hover:bg-[var(--accent-light)] transition cursor-pointer">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{j.title}</p>
                    {/* Show badge if admin has a pending suggestion */}
                    {j.adminSuggestion?.status === "pending" && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                        Admin suggested changes
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{j.company} · {j.location}</p>
                  {j.createdAt && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Posted on: {new Date(j.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${j.isActive ? "bg-[var(--success-bg)] text-[var(--success-text)]" : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"}`}>
                    {j.isActive ? "Active" : "Closed"}
                  </span>
                  <button onClick={(e) => handleToggle(j._id, e)}
                    className={`text-xs font-medium transition ${j.isActive ? "text-yellow-500 hover:text-[var(--warning-text)]" : "text-green-500 hover:text-green-700"}`}>
                    {j.isActive ? "Pause" : "Resume"}
                  </button>
                  <button onClick={(e) => handleDelete(j._id, e)}
                    className="text-xs text-red-400 hover:text-red-600 transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---- Dashboard overview ----
function DashboardOverview({ refresh, onRefresh }) {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      {!user?.isApproved && (
        <div className="bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-2xl p-4 text-sm text-[var(--warning-text)]">
          ⏳ Your account is pending admin approval. You cannot post jobs yet.
        </div>
      )}
      <JobListings refresh={refresh} onRefresh={onRefresh} />
    </div>
  );
}

function MainContent({ active, setActive }) {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (active === "community") navigate("/community");
  }, [active, navigate]);

  if (active === "post") return <PostJob onJobPosted={() => { setRefresh((r) => r + 1); setActive("dashboard"); }} onGoToSettings={() => setActive("settings")} />;
  if (active === "settings") return <SettingsPage />;
  if (active === "community") return null;
  return <DashboardOverview refresh={refresh} onRefresh={() => setRefresh((r) => r + 1)} />;
}

export default function RecruiterDashboard() {
  const [active, setActive] = useState("dashboard");
  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6"><MainContent active={active} setActive={setActive} /></main>
      </div>
    </div>
  );
}
