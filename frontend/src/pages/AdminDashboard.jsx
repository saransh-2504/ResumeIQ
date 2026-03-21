import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Which tab is active: "pending" | "recruiters" | "users" | "jobs"
  const [tab, setTab] = useState("pending");

  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [allRecruiters, setAllRecruiters] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(""); // success/error message

  // Show a toast message for 3 seconds
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  // Fetch data based on active tab
  useEffect(() => {
    fetchTabData(tab);
  }, [tab]);

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
      }
    } catch (err) {
      showToast("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  // Approve a recruiter
  async function handleApprove(id) {
    try {
      const res = await api.patch(`/admin/recruiters/${id}/approve`);
      showToast(res.data.message);
      // Refresh both pending and all recruiters lists
      fetchTabData("pending");
    } catch (err) {
      showToast("Failed to approve recruiter.");
    }
  }

  // Reject (delete) a recruiter
  async function handleReject(id) {
    if (!confirm("Are you sure you want to reject and remove this recruiter?")) return;
    try {
      const res = await api.delete(`/admin/recruiters/${id}`);
      showToast(res.data.message);
      fetchTabData(tab);
    } catch (err) {
      showToast("Failed to reject recruiter.");
    }
  }

  async function handleLogout() {
    await logoutUser();
    navigate("/login");
  }

  const tabs = [
    { key: "pending", label: "Pending Approvals" },
    { key: "recruiters", label: "All Recruiters" },
    { key: "users", label: "Candidates" },
    { key: "jobs", label: "Jobs" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-indigo-600">
          Resume<span className="text-purple-500">IQ</span>
          <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Admin</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-600 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mb-6">Manage recruiters, candidates, and jobs</p>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px
                ${tab === t.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {t.label}
              {/* Show count badge on pending tab */}
              {t.key === "pending" && pendingRecruiters.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                  {pendingRecruiters.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : (
          <>
            {/* PENDING APPROVALS TAB */}
            {tab === "pending" && (
              <div>
                {pendingRecruiters.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm">
                    No pending recruiter approvals
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRecruiters.map((r) => (
                      <RecruiterCard
                        key={r._id}
                        recruiter={r}
                        onApprove={() => handleApprove(r._id)}
                        onReject={() => handleReject(r._id)}
                        showActions
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ALL RECRUITERS TAB */}
            {tab === "recruiters" && (
              <div>
                {allRecruiters.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm">No recruiters found</div>
                ) : (
                  <div className="space-y-3">
                    {allRecruiters.map((r) => (
                      <RecruiterCard
                        key={r._id}
                        recruiter={r}
                        onReject={() => handleReject(r._id)}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CANDIDATES TAB */}
            {tab === "users" && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {allUsers.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm">No candidates found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3 text-left">Name</th>
                        <th className="px-5 py-3 text-left">Email</th>
                        <th className="px-5 py-3 text-left">Joined</th>
                        <th className="px-5 py-3 text-left">Auth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                          <td className="px-5 py-3 text-gray-500">{u.email}</td>
                          <td className="px-5 py-3 text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${u.oauthProvider
                                ? "bg-blue-50 text-blue-600"
                                : "bg-gray-100 text-gray-500"
                              }`}>
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

            {/* JOBS TAB */}
            {tab === "jobs" && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {allJobs.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm">No jobs found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3 text-left">Title</th>
                        <th className="px-5 py-3 text-left">Company</th>
                        <th className="px-5 py-3 text-left">Posted By</th>
                        <th className="px-5 py-3 text-left">Type</th>
                        <th className="px-5 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allJobs.map((j) => (
                        <tr key={j._id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3 font-medium text-gray-800">{j.title}</td>
                          <td className="px-5 py-3 text-gray-500">{j.company}</td>
                          <td className="px-5 py-3 text-gray-500">
                            {j.postedBy?.name || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize">
                              {j.type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-400">
                            {new Date(j.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Reusable recruiter card component
function RecruiterCard({ recruiter, onApprove, onReject, showActions }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-800 text-sm">{recruiter.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{recruiter.email}</p>
        <p className="text-xs text-gray-300 mt-0.5">
          Joined {new Date(recruiter.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Approval status badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${recruiter.isApproved
            ? "bg-green-50 text-green-600"
            : "bg-yellow-50 text-yellow-600"
          }`}>
          {recruiter.isApproved ? "Approved" : "Pending"}
        </span>

        {/* Show approve button only on pending tab */}
        {showActions && !recruiter.isApproved && (
          <button
            onClick={onApprove}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
          >
            Approve
          </button>
        )}

        {/* Reject/remove button always visible */}
        <button
          onClick={onReject}
          className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
