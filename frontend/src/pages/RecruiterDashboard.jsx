import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ---- Sidebar nav links ----
const navLinks = [
  { icon: "🏠", label: "Dashboard", id: "dashboard" },
  { icon: "➕", label: "Post Job", id: "post" },
  { icon: "⚙️", label: "Settings", id: "settings" },
];

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

// ---- Job Detail + Edit Modal ----
function JobModal({ job, onClose, onUpdated }) {
  const [editing, setEditing] = useState(false);
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{job.title}</h2>
            <p className="text-sm text-gray-400">{job.company} · {job.location}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {msg && <div className="bg-indigo-50 text-indigo-700 text-xs px-4 py-2 rounded-xl mb-4">{msg}</div>}

        {/* Admin suggestion banner */}
        {hasPendingSuggestion && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-yellow-700 mb-2">📝 Admin suggested changes to this job</p>
            <div className="text-xs text-yellow-600 space-y-1 mb-3">
              {job.adminSuggestion.title !== job.title && <p><span className="font-medium">Title:</span> {job.adminSuggestion.title}</p>}
              {job.adminSuggestion.description !== job.description && <p><span className="font-medium">Description:</span> {job.adminSuggestion.description}</p>}
              {job.adminSuggestion.location !== job.location && <p><span className="font-medium">Location:</span> {job.adminSuggestion.location}</p>}
              {job.adminSuggestion.type !== job.type && <p><span className="font-medium">Type:</span> {job.adminSuggestion.type}</p>}
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

        {/* View mode */}
        {!editing ? (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{job.type}</span>
              {job.skillsRequired?.map((s) => (
                <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{s}</span>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
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
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input type="text" value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Job Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white">
                <option>Full-time</option>
                <option>Internship</option>
                <option>Part-time</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea rows={4} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Skills (comma separated)</label>
              <input type="text" value={form.skillsRequired}
                onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={loading}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100 transition">
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
function PostJob({ onJobPosted }) {
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
      setError(err.response?.data?.message || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  }

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
        {[
          { label: "Job Title", key: "title", placeholder: "e.g. Frontend Developer" },
          { label: "Company Name", key: "company", placeholder: "e.g. Razorpay" },
          { label: "Location", key: "location", placeholder: "e.g. Bangalore / Remote" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <input required type="text" placeholder={placeholder} value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
          </div>
        ))}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Description</label>
          <textarea required rows={4} placeholder="Describe the role..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Required Skills (comma separated)</label>
          <input type="text" placeholder="e.g. React, Node.js, SQL" value={form.skillsRequired}
            onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white">
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
    e.stopPropagation(); // don't open modal
    if (!confirm("Delete this job?")) return;
    await api.delete(`/jobs/${id}`);
    setJobs(jobs.filter((j) => j._id !== id));
  }

  if (loading) return <div className="text-sm text-gray-400">Loading jobs...</div>;

  return (
    <>
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdated={() => { onRefresh(); setSelectedJob(null); }}
        />
      )}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Your Job Postings</p>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No jobs posted yet.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <div key={j._id}
                onClick={() => setSelectedJob(j)}
                className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition cursor-pointer">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-700">{j.title}</p>
                    {/* Show badge if admin has a pending suggestion */}
                    {j.adminSuggestion?.status === "pending" && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                        Admin suggested changes
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{j.company} · {j.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${j.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {j.isActive ? "Active" : "Closed"}
                  </span>
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-700">
          ⏳ Your account is pending admin approval. You cannot post jobs yet.
        </div>
      )}
      <JobListings refresh={refresh} onRefresh={onRefresh} />
    </div>
  );
}

function MainContent({ active }) {
  const [refresh, setRefresh] = useState(0);
  if (active === "post") return <PostJob onJobPosted={() => setRefresh((r) => r + 1)} />;
  if (active === "settings") return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-400 text-center">
      Settings coming soon.
    </div>
  );
  return <DashboardOverview refresh={refresh} onRefresh={() => setRefresh((r) => r + 1)} />;
}

export default function RecruiterDashboard() {
  const [active, setActive] = useState("dashboard");
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6"><MainContent active={active} /></main>
      </div>
    </div>
  );
}
