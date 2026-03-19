import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ---- Sidebar nav links ----
const navLinks = [
  { icon: "🏠", label: "Dashboard", id: "dashboard" },
  { icon: "➕", label: "Post Job", id: "post" },
  { icon: "👥", label: "Candidates", id: "candidates" },
  { icon: "📊", label: "Analytics", id: "analytics" },
  { icon: "⚙️", label: "Settings", id: "settings" },
];

// ---- Status badge ----
function StatusBadge({ status }) {
  const colors = {
    Shortlisted: "bg-green-100 text-green-700",
    Reviewing: "bg-yellow-100 text-yellow-700",
    Rejected: "bg-red-100 text-red-500",
    Active: "bg-green-100 text-green-700",
    Closed: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ---- Sidebar ----
function Sidebar({ active, setActive }) {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1">
      <div className="text-lg font-bold text-indigo-600 mb-1 cursor-pointer" onClick={() => navigate("/")}>
        Resume<span className="text-purple-500">IQ</span>
      </div>
      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full w-fit mb-4">Recruiter</span>

      {navLinks.map((link) => (
        <button
          key={link.id}
          onClick={() => setActive(link.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left
            ${active === link.id ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <span>{link.icon}</span>
          {link.label}
        </button>
      ))}
      <button
        onClick={logoutUser}
        className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 transition text-left"
      >
        <span>🚪</span> Logout
      </button>
    </aside>
  );
}

// ---- Top bar ----
function TopBar() {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-800">Recruiter Dashboard</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}

// ---- Approval pending banner ----
function ApprovalBanner() {
  const { user } = useAuth();
  if (user?.isApproved) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-sm text-yellow-700">
      ⏳ Your account is pending admin approval. You can browse the dashboard but cannot post jobs yet.
    </div>
  );
}

// ---- Post Job Form ----
function PostJob({ onJobPosted }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    skillsRequired: "",
    type: "Full-time",
    company: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/jobs", form);
      setSuccess("Job posted successfully!");
      setForm({ title: "", description: "", skillsRequired: "", type: "Full-time", company: "", location: "" });
      onJobPosted(); // refresh job list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  }

  // If not approved, show message instead of form
  if (!user?.isApproved) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
        You need admin approval before you can post jobs.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-xl">
      <p className="text-sm font-semibold text-gray-700 mb-5">Post a New Job</p>

      {error && <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 text-xs px-4 py-3 rounded-xl mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Title</label>
          <input
            required
            type="text"
            placeholder="e.g. Frontend Developer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Razorpay"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Location</label>
          <input
            required
            type="text"
            placeholder="e.g. Bangalore / Remote"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Description</label>
          <textarea
            required
            rows={4}
            placeholder="Describe the role and responsibilities..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Required Skills (comma separated)</label>
          <input
            type="text"
            placeholder="e.g. React, Node.js, SQL"
            value={form.skillsRequired}
            onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white"
          >
            <option>Full-time</option>
            <option>Internship</option>
            <option>Part-time</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}

// ---- My Job Listings ----
function JobListings({ refresh }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/jobs/recruiter/my-jobs")
      .then((res) => setJobs(res.data.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [refresh]); // re-fetch when refresh changes

  async function handleDelete(id) {
    if (!confirm("Delete this job?")) return;
    await api.delete(`/jobs/${id}`);
    setJobs(jobs.filter((j) => j._id !== id));
  }

  if (loading) return <div className="text-sm text-gray-400">Loading jobs...</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-sm font-semibold text-gray-700 mb-4">Your Job Postings</p>
      {jobs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No jobs posted yet.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition">
              <div>
                <p className="text-sm font-medium text-gray-700">{j.title}</p>
                <p className="text-xs text-gray-400">{j.company} · {j.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={j.isActive ? "Active" : "Closed"} />
                <button
                  onClick={() => handleDelete(j._id)}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Dashboard overview ----
function DashboardOverview({ refresh }) {
  return (
    <div className="space-y-6">
      <ApprovalBanner />
      <JobListings refresh={refresh} />
    </div>
  );
}

// ---- Analytics (simple, no library) ----
function Analytics() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-400 text-center">
      Analytics will show data once candidates start applying.
    </div>
  );
}

// ---- Main content switcher ----
function MainContent({ active, setActive }) {
  const [refresh, setRefresh] = useState(0);

  if (active === "post") return <PostJob onJobPosted={() => setRefresh((r) => r + 1)} />;
  if (active === "analytics") return <Analytics />;
  if (active === "candidates") return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-400 text-center">
      Candidate management coming soon.
    </div>
  );
  if (active === "settings") return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-400 text-center">
      Settings coming soon...
    </div>
  );

  return <DashboardOverview refresh={refresh} />;
}

// ---- Main export ----
export default function RecruiterDashboard() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6">
          <MainContent active={active} setActive={setActive} />
        </main>
      </div>
    </div>
  );
}
