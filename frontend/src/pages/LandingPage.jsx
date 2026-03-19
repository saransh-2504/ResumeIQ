import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ---- Job type badge ----
function TypeBadge({ type }) {
  const colors = {
    "Full-time": "bg-green-100 text-green-700",
    Internship: "bg-blue-100 text-blue-700",
    "Part-time": "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || "bg-gray-100 text-gray-500"}`}>
      {type}
    </span>
  );
}

// ---- Single Job Card ----
function JobCard({ job, onClick }) {
  return (
    <div
      onClick={() => onClick(job)}
      className="bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600">
          {job.company[0]}
        </div>
        <div>
          <p className="text-xs text-gray-400">{job.company}</p>
          <p className="text-sm font-semibold text-gray-800">{job.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-400">📍 {job.location}</span>
        <TypeBadge type={job.type} />
      </div>
      <div className="flex flex-wrap gap-1">
        {job.skillsRequired?.map((tag) => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Skeleton loader for job cards ----
function JobSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="space-y-1">
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="flex gap-1">
        <div className="h-5 w-14 bg-gray-100 rounded-lg" />
        <div className="h-5 w-14 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ---- Job Detail Modal ----
function JobModal({ job, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);

  function handleUpload() {
    // If not logged in, redirect to login
    if (!user) {
      navigate("/login");
      return;
    }
    setUploaded(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-600">
              {job.company[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{job.title}</h2>
              <p className="text-sm text-gray-400">{job.company} · {job.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <TypeBadge type={job.type} />

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">About the Role</p>
          <p className="text-sm text-gray-500 leading-relaxed">{job.description}</p>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {job.skillsRequired?.map((s) => (
              <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{s}</span>
            ))}
          </div>
        </div>

        {/* Resume upload CTA */}
        <div className="mt-6 bg-indigo-50 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-700 mb-1">Check your ATS score for this job</p>
          <p className="text-xs text-indigo-400 mb-3">Upload your resume to see how well it matches</p>

          {!uploaded ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={() => { setDragging(false); handleUpload(); }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition
                  ${dragging ? "border-indigo-400 bg-indigo-100" : "border-indigo-200 bg-white"}`}
              >
                <p className="text-2xl mb-1">📄</p>
                <p className="text-xs text-gray-500">Drag & drop your resume here</p>
                <p className="text-xs text-gray-400">PDF or DOCX</p>
              </div>
              <button
                onClick={handleUpload}
                className="mt-3 w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
              >
                {user ? "Upload Resume & Analyze" : "Login to Analyze Resume"}
              </button>
            </>
          ) : (
            // Mock ATS preview (real analysis happens in dashboard)
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Login to your dashboard to see full ATS analysis
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm text-indigo-600 hover:underline"
              >
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>

        <button className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
          Apply Now
        </button>
      </div>
    </div>
  );
}

// ---- Navbar ----
function Navbar() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 py-4 bg-white border-b border-gray-100 sticky top-0 z-40">
      <Link to="/" className="text-xl font-bold text-indigo-600">
        Resume<span className="text-purple-500">IQ</span>
      </Link>

      <div className="hidden md:flex gap-6 text-sm text-gray-600 font-medium">
        <a href="#jobs" className="hover:text-indigo-600 transition">Jobs</a>
        <a href="#how-it-works" className="hover:text-indigo-600 transition">How it Works</a>
        <Link to="/recruiter" className="hover:text-indigo-600 transition">For Recruiters</Link>
        {!user && <Link to="/login" className="hover:text-indigo-600 transition">Login</Link>}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <button
              onClick={() => navigate(user.role === "recruiter" ? "/recruiter" : "/dashboard")}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              Dashboard
            </button>
            <button
              onClick={logoutUser}
              className="text-sm text-gray-500 hover:text-red-500 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/signup")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Upload Resume
          </button>
        )}
      </div>
    </nav>
  );
}

// ---- Hero ----
function Hero({ onSearch }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  return (
    <section className="px-6 md:px-16 py-16 text-center bg-[#F8FAFC]">
      <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">
        AI-Powered Job Platform
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-4 leading-tight">
        Discover Top Jobs.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
          Get Selected Faster.
        </span>
      </h1>
      <p className="text-gray-500 mt-3 text-base max-w-xl mx-auto">
        Explore curated opportunities and optimize your resume for each role using AI.
      </p>
      <a href="#jobs">
        <button className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md">
          Browse Jobs
        </button>
      </a>

      {/* Search bar */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Job title or skill..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white"
        />
        <input
          type="text"
          placeholder="Location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white"
        />
        <button
          onClick={() => onSearch(query, location)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Search
        </button>
      </div>
    </section>
  );
}

// ---- Filters Bar ----
function FiltersBar({ activeFilter, setActiveFilter }) {
  const filters = ["All", "Full-time", "Internship", "Part-time"];
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActiveFilter(f)}
          className={`text-xs px-4 py-1.5 rounded-full font-medium transition
            ${activeFilter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

// ---- Jobs Section ----
function JobsSection({ onJobClick }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  // Fetch jobs from backend on mount
  useEffect(() => {
    api
      .get("/jobs")
      .then((res) => setJobs(res.data.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter jobs by type on frontend
  const filtered = jobs.filter((j) =>
    activeFilter === "All" ? true : j.type === activeFilter
  );

  return (
    <section id="jobs" className="px-6 md:px-16 py-10 bg-[#F8FAFC]">
      <h2 className="text-xl font-bold text-gray-800 mb-5">Featured Jobs</h2>
      <FiltersBar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <JobSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No jobs found. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job._id} job={job} onClick={onJobClick} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---- How It Works ----
function HowItWorks() {
  const steps = [
    { icon: "🔍", num: "01", title: "Browse Jobs", desc: "Explore curated listings from top companies" },
    { icon: "📤", num: "02", title: "Upload Resume", desc: "Upload your PDF or DOCX for any job" },
    { icon: "📊", num: "03", title: "Get ATS Score", desc: "See how well your resume matches" },
    { icon: "🚀", num: "04", title: "Improve & Apply", desc: "Fix gaps and apply with confidence" },
  ];

  return (
    <section id="how-it-works" className="px-6 md:px-16 py-16 bg-white">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How it Works</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {steps.map((s) => (
          <div key={s.num} className="text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-2xl mx-auto">
              {s.icon}
            </div>
            <p className="text-xs text-indigo-400 font-bold mt-2">{s.num}</p>
            <p className="font-semibold text-gray-800 text-sm mt-1">{s.title}</p>
            <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Recruiter CTA ----
function RecruiterCTA() {
  const navigate = useNavigate();
  return (
    <section className="px-6 md:px-16 py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-3">Post Jobs & Find the Best Candidates</h2>
      <p className="text-indigo-100 text-sm mb-6">Use AI to match candidates to your job requirements automatically</p>
      <button
        onClick={() => navigate("/signup")}
        className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition"
      >
        For Recruiters →
      </button>
    </section>
  );
}

// ---- Footer ----
function Footer() {
  return (
    <footer className="px-6 md:px-16 py-8 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-lg font-bold text-indigo-600">Resume<span className="text-purple-500">IQ</span></div>
      <div className="flex gap-6 text-sm text-gray-400">
        <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
        <a href="#" className="hover:text-indigo-600 transition">Terms</a>
        <a href="#" className="hover:text-indigo-600 transition">Contact</a>
      </div>
      <p className="text-xs text-gray-400">© 2025 ResumeIQ. All rights reserved.</p>
    </footer>
  );
}

// ---- Main Landing Page ----
export default function LandingPage() {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <Hero onSearch={(q, l) => console.log("search:", q, l)} />
      <JobsSection onJobClick={setSelectedJob} />
      <HowItWorks />
      <RecruiterCTA />
      <Footer />

      {selectedJob && (
        <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}
