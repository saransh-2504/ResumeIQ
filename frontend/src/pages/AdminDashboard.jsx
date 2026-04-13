import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/common/NotificationBell";
import ThemeToggle from "../components/common/ThemeToggle";

// ---- Job Detail + Suggest Changes Modal (Admin) ----
function AdminJobModal({ job, onClose, onSuggested }) {
  const [suggesting, setSuggesting] = useState(false);
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

  async function handleSuggest() {
    setLoading(true);
    try {
      await api.post(`/jobs/${job._id}/suggest`, form);
      setMsg("Suggestion sent to recruiter.");
      setSuggesting(false);
      onSuggested();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to send suggestion.");
    } finally {
      setLoading(false);
    }
  }

  const hasPendingSuggestion = job.adminSuggestion?.status === "pending";

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{job.title}</h2>
            <p className="text-sm text-[var(--text-muted)]">{job.company} · {job.location}</p>
            <p className="text-xs text-[var(--text-faint)] mt-0.5">Posted by: {job.postedBy?.name} ({job.postedBy?.email})</p>
            {job.createdAt && (
              <p className="text-xs text-[var(--text-faint)] mt-0.5">
                Posted on: {new Date(job.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl leading-none">×</button>
        </div>

        {msg && <div className="bg-[var(--accent-light)] text-[var(--accent-text)] text-xs px-4 py-2 rounded-xl mb-4">{msg}</div>}

        {/* Pending suggestion status */}
        {hasPendingSuggestion && (
          <div className="bg-[var(--warning-bg)] text-[var(--warning-text)]">
            ⏳ You already have a pending suggestion waiting for recruiter response.
          </div>
        )}

        {/* View mode */}
        {!suggesting ? (
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
            {!hasPendingSuggestion && (
              <button onClick={() => setSuggesting(true)}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                Suggest Changes
              </button>
            )}
          </div>
        ) : (
          /* Suggest changes form */
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-muted)] mb-2">Edit the fields you want to suggest changes for. Recruiter will review and approve or reject.</p>
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
                className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Skills (comma separated)</label>
              <input type="text" value={form.skillsRequired}
                onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSuggest} disabled={loading}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {loading ? "Sending..." : "Send Suggestion"}
              </button>
              <button onClick={() => setSuggesting(false)}
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

// ---- Recruiter Card ----
function RecruiterCard({ recruiter, onApprove, onReject, showActions }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] px-5 py-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-[var(--text-primary)] text-sm">{recruiter.name}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{recruiter.email}</p>
        <p className="text-xs text-[var(--text-faint)] mt-0.5">Joined {new Date(recruiter.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${recruiter.isApproved ? "bg-[var(--success-bg)] text-[var(--success-text)]" : "bg-yellow-50 text-yellow-600"}`}>
          {recruiter.isApproved ? "Approved" : "Pending"}
        </span>
        {showActions && !recruiter.isApproved && (
          <button onClick={onApprove}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
            Approve
          </button>
        )}
        <button onClick={onReject}
          className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
          Remove
        </button>
      </div>
    </div>
  );
}

// ---- Main Admin Dashboard ----
function CommunityRedirect({ navigate }) {
  useEffect(() => { navigate("/community"); }, [navigate]);
  return null;
}

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("pending");
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [allRecruiters, setAllRecruiters] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedJob, setSelectedJob] = useState(null); // job modal

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => { if (tab !== "community") fetchTabData(tab); }, [tab]);

  async function fetchTabData(activeTab) {
    setLoading(true);
    try {
      if (activeTab === "pending") {
        const res = await api.get("/admin/recruiters/pending");
        setPendingRecruiters(res.data.recruiters);
      } else if (activeTab === "recruiters") {
        const res = await api.get("/admin/recruiters");
        setAllRecruiters(res.data.recruiters);
      } else if (activeTab === "users") {
        const res = await api.get("/admin/users");
        setAllUsers(res.data.users);
      } else if (activeTab === "jobs") {
        const res = await api.get("/admin/jobs");
        setAllJobs(res.data.jobs);
      } else if (activeTab === "delete-requests") {
        const res = await api.get("/admin/delete-requests");
        setDeleteRequests(res.data.recruiters);
      }
    } catch (err) {
      showToast("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    try {
      const res = await api.patch(`/admin/recruiters/${id}/approve`);
      showToast(res.data.message);
      fetchTabData("pending");
    } catch {
      showToast("Failed to approve recruiter.");
    }
  }

  async function handleReject(id) {
    if (!confirm("Remove this recruiter?")) return;
    try {
      const res = await api.delete(`/admin/recruiters/${id}`);
      showToast(res.data.message);
      fetchTabData(tab);
    } catch {
      showToast("Failed to remove recruiter.");
    }
  }

  const tabs = [
    { key: "pending", label: "Pending Approvals" },
    { key: "recruiters", label: "All Recruiters" },
    { key: "users", label: "Candidates" },
    { key: "jobs", label: "Jobs" },
    { key: "delete-requests", label: "Delete Requests" },
    { key: "community", label: "Community" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Job modal */}
      {selectedJob && (
        <AdminJobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSuggested={() => { showToast("Suggestion sent to recruiter."); fetchTabData("jobs"); setSelectedJob(null); }}
        />
      )}

      {/* Navbar */}
      <nav className="bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-indigo-600">
          Resume<span className="text-purple-500">IQ</span>
          <span className="ml-2 text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-surface-2)] px-2 py-0.5 rounded-full">Admin</span>
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <span className="text-sm text-[var(--text-muted)]">{user?.name}</span>
          <button onClick={async () => { await logoutUser(); navigate("/login"); }}
            className="text-sm text-red-400 hover:text-red-500 transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Admin Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Manage recruiters, candidates, and jobs</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px
                ${tab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              {t.label}
              {t.key === "pending" && pendingRecruiters.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                  {pendingRecruiters.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "community" ? (
          <CommunityRedirect navigate={navigate} />
        ) : loading ? (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm">Loading...</div>
        ) : (
          <>
            {/* PENDING */}
            {tab === "pending" && (
              <div>
                {pendingRecruiters.length === 0 ? (
                  <div className="text-center py-16 text-[var(--text-muted)] text-sm">No pending approvals</div>
                ) : (
                  <div className="space-y-3">
                    {pendingRecruiters.map((r) => (
                      <RecruiterCard key={r._id} recruiter={r}
                        onApprove={() => handleApprove(r._id)}
                        onReject={() => handleReject(r._id)}
                        showActions />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ALL RECRUITERS */}
            {tab === "recruiters" && (
              <div>
                {allRecruiters.length === 0 ? (
                  <div className="text-center py-16 text-[var(--text-muted)] text-sm">No recruiters found</div>
                ) : (
                  <div className="space-y-3">
                    {allRecruiters.map((r) => (
                      <RecruiterCard key={r._id} recruiter={r}
                        onReject={() => handleReject(r._id)}
                        showActions={false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CANDIDATES */}
            {tab === "users" && (
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                {allUsers.length === 0 ? (
                  <div className="text-center py-16 text-[var(--text-muted)] text-sm">No candidates found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-surface-2)] text-[var(--text-muted)] text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3 text-left">Name</th>
                        <th className="px-5 py-3 text-left">Email</th>
                        <th className="px-5 py-3 text-left">Joined</th>
                        <th className="px-5 py-3 text-left">Auth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-[var(--bg-surface-2)] transition">
                          <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{u.name}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{u.email}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${u.oauthProvider ? "bg-blue-50 text-blue-600" : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"}`}>
                              {u.oauthProvider || "email"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* JOBS */}
            {tab === "jobs" && (
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                {allJobs.length === 0 ? (
                  <div className="text-center py-16 text-[var(--text-muted)] text-sm">No jobs found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-surface-2)] text-[var(--text-muted)] text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3 text-left">Title</th>
                        <th className="px-5 py-3 text-left">Company</th>
                        <th className="px-5 py-3 text-left">Posted By</th>
                        <th className="px-5 py-3 text-left">Posted On</th>
                        <th className="px-5 py-3 text-left">Type</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allJobs.map((j) => (
                        <tr key={j._id} className="hover:bg-[var(--bg-surface-2)] transition">
                          <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{j.title}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{j.company}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">{j.postedBy?.name || "—"}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)] text-xs">
                            {j.createdAt ? new Date(j.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs bg-[var(--accent-light)] text-[var(--accent-text)] px-2 py-0.5 rounded-full capitalize">
                              {j.type}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {j.adminSuggestion?.status === "pending" ? (
                              <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Suggestion pending</span>
                            ) : (
                              <span className="text-xs bg-[var(--success-bg)] text-[var(--success-text)] px-2 py-0.5 rounded-full">Active</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => setSelectedJob(j)}
                              className="text-xs text-indigo-600 hover:underline">
                              View / Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* DELETE REQUESTS */}
            {tab === "delete-requests" && (
              <div>
                {deleteRequests.length === 0 ? (
                  <div className="text-center py-16 text-[var(--text-muted)] text-sm">No pending deletion requests</div>
                ) : (
                  <div className="space-y-3">
                    {deleteRequests.map((r) => (
                      <div key={r._id} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{r.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{r.email}</p>
                          {r.recruiterProfile?.companyName && (
                            <p className="text-xs text-[var(--text-muted)]">{r.recruiterProfile.companyName}</p>
                          )}
                          {r.deleteRequestedAt && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              Requested: {new Date(r.deleteRequestedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete ${r.name}'s account permanently?`)) return;
                              try {
                                await api.delete(`/admin/delete-requests/${r._id}/approve`);
                                showToast("Account deleted.");
                                fetchTabData("delete-requests");
                              } catch { showToast("Failed."); }
                            }}
                            className="text-xs bg-[var(--error-bg)] text-[var(--error-text)] border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium">
                            Approve & Delete
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await api.patch(`/admin/delete-requests/${r._id}/reject`);
                                showToast("Request rejected.");
                                fetchTabData("delete-requests");
                              } catch { showToast("Failed."); }
                            }}
                            className="text-xs bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-surface-2)] transition font-medium">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}