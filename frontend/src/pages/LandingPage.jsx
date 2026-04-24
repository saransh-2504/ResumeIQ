import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/common/ThemeToggle";

//  Indian cities with common aliases 
const INDIAN_CITIES = [
  { name: "Mumbai", aliases: ["bombay"] },
  { name: "Delhi", aliases: ["new delhi", "nd"] },
  { name: "Bengaluru", aliases: ["bangalore", "bengalore", "blr", "bangaluru"] },
  { name: "Hyderabad", aliases: ["hyd", "cyberabad"] },
  { name: "Chennai", aliases: ["madras"] },
  { name: "Kolkata", aliases: ["calcutta"] },
  { name: "Pune", aliases: [] },
  { name: "Ahmedabad", aliases: ["amd"] },
  { name: "Jaipur", aliases: [] },
  { name: "Surat", aliases: [] },
  { name: "Lucknow", aliases: [] },
  { name: "Nagpur", aliases: [] },
  { name: "Indore", aliases: [] },
  { name: "Bhopal", aliases: [] },
  { name: "Visakhapatnam", aliases: ["vizag"] },
  { name: "Patna", aliases: [] },
  { name: "Vadodara", aliases: ["baroda"] },
  { name: "Gurgaon", aliases: ["gurugram"] },
  { name: "Noida", aliases: [] },
  { name: "Chandigarh", aliases: [] },
  { name: "Kochi", aliases: ["cochin", "ernakulam"] },
  { name: "Coimbatore", aliases: ["kovai"] },
  { name: "Mysuru", aliases: ["mysore"] },
  { name: "Mangaluru", aliases: ["mangalore"] },
  { name: "Thiruvananthapuram", aliases: ["trivandrum"] },
  { name: "Bhubaneswar", aliases: [] },
  { name: "Dehradun", aliases: [] },
  { name: "Amritsar", aliases: [] },
  { name: "Varanasi", aliases: ["banaras", "kashi"] },
  { name: "Allahabad", aliases: ["prayagraj"] },
  { name: "Ranchi", aliases: [] },
  { name: "Jodhpur", aliases: [] },
  { name: "Madurai", aliases: [] },
  { name: "Raipur", aliases: [] },
  { name: "Remote", aliases: ["work from home", "wfh", "remote work"] },
  { name: "Pan India", aliases: ["all india", "anywhere"] },
];

// Common tech skills for autocomplete
const COMMON_SKILLS = [
  "JavaScript","TypeScript","React","React.js","Next.js","Vue.js","Angular",
  "Node.js","Express.js","Python","Django","Flask","FastAPI",
  "Java","Spring Boot","Kotlin","Swift","C","C++","C#",".NET",
  "PHP","Laravel","Ruby","Go","Rust","Scala",
  "SQL","MySQL","PostgreSQL","MongoDB","Redis","Firebase",
  "GraphQL","REST API","AWS","Azure","GCP","Docker","Kubernetes",
  "Git","Linux","Machine Learning","Deep Learning","TensorFlow","PyTorch",
  "Data Science","Pandas","NumPy","HTML","CSS","Tailwind CSS","Bootstrap",
  "React Native","Flutter","Android","iOS","Figma","UI/UX","DevOps",
];

// Check if a city matches a query (name or alias)
function cityMatches(city, query) {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (city.name.toLowerCase().includes(q)) return true;
  return city.aliases.some((a) => a.includes(q) || q.includes(a));
}

// Normalize location — map alias to canonical city name
function normalizeLocation(query) {
  const q = query.toLowerCase().trim();
  const match = INDIAN_CITIES.find((c) => cityMatches(c, q));
  return match ? match.name.toLowerCase() : q;
}

//  Job type badge ]
function TypeBadge({ type }) {
  const colors = {
    "Full-time": "bg-green-100 text-green-700",
    Internship: "bg-blue-100 text-blue-700",
    "Part-time": "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"}`}>
      {type}
    </span>
  );
}

//  Single Job Card 
function JobCard({ job, onClick, highlightSkills = [] }) {
  return (
    <div onClick={() => onClick(job)}
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] hover:border-[var(--border)] transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600">
          {job.company[0]}
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">{job.company}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{job.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[var(--text-muted)]">📍 {job.location}</span>
        <TypeBadge type={job.type} />
      </div>
      <div className="flex flex-wrap gap-1">
        {job.skillsRequired?.map((tag) => {
          const isHighlighted = highlightSkills.some(
            (s) => tag.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(tag.toLowerCase())
          );
          return (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded-lg ${
              isHighlighted ? "bg-indigo-100 text-indigo-600" : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
            }`}>
              {tag}
            </span>
          );
        })}
      </div>
      {job.createdAt && (
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Posted on: {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}
    </div>
  );
}

//  Skeleton loader 
function JobSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-2)]" />
        <div className="space-y-1">
          <div className="h-3 w-20 bg-[var(--bg-surface-2)] rounded" />
          <div className="h-4 w-32 bg-[var(--bg-surface-2)] rounded" />
        </div>
      </div>
      <div className="h-3 w-24 bg-[var(--bg-surface-2)] rounded mb-3" />
      <div className="flex gap-1">
        <div className="h-5 w-14 bg-[var(--bg-surface-2)] rounded-lg" />
        <div className="h-5 w-14 bg-[var(--bg-surface-2)] rounded-lg" />
      </div>
    </div>
  );
}

//  Job Detail Modal 
function JobModal({ job, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-600">
              {job.company[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{job.title}</h2>
              <p className="text-sm text-[var(--text-muted)]">{job.company} · {job.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl">✕</button>
        </div>

        <TypeBadge type={job.type} />

        <div className="mt-4">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">About the Role</p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{job.description}</p>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {job.skillsRequired?.map((s) => (
              <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{s}</span>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-indigo-50 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-700 mb-1">Want to check your ATS score?</p>
          <p className="text-xs text-indigo-400 mb-3">Login to upload your resume and see how well it matches this role</p>
          <button onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            {user ? "Go to Dashboard →" : "Login to Analyze Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Navbar 
function Navbar() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 py-4 bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-40">
      <Link to="/" className="text-xl font-bold text-indigo-600">
        Resume<span className="text-purple-500">IQ</span>
      </Link>
      <div className="hidden md:flex gap-6 text-sm text-[var(--text-secondary)] font-medium">
        <a href="#jobs" className="hover:text-indigo-600 transition">Jobs</a>
        <a href="#how-it-works" className="hover:text-indigo-600 transition">How it Works</a>
        <Link to="/recruiter" className="hover:text-indigo-600 transition">For Recruiters</Link>
        {!user && <Link to="/login" className="hover:text-indigo-600 transition">Login</Link>}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user ? (
          <>
            <button onClick={() => navigate(user.role === "recruiter" ? "/recruiter" : "/dashboard")}
              className="text-sm text-indigo-600 font-medium hover:underline">Dashboard</button>
            <button onClick={logoutUser} className="text-sm text-[var(--text-muted)] hover:text-red-500 transition">Logout</button>
          </>
        ) : (
          <button onClick={() => navigate("/signup")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
}

//  Jobs Section (with full search + filter) 
function JobsSection({ onJobClick }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [titleQuery, setTitleQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [activeType, setActiveType] = useState("All");

  // Autocomplete
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [skillSuggestions, setSkillSuggestions] = useState([]);

  const locationRef = useRef(null);
  const skillRef = useRef(null);

  useEffect(() => {
    api.get("/jobs")
      .then((res) => setJobs(res.data.jobs))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (!locationRef.current?.contains(e.target)) setCitySuggestions([]);
      if (!skillRef.current?.contains(e.target)) setSkillSuggestions([]);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLocationChange(val) {
    setLocationQuery(val);
    if (!val.trim()) { setCitySuggestions([]); return; }
    setCitySuggestions(INDIAN_CITIES.filter((c) => cityMatches(c, val)).slice(0, 6));
  }

  function handleSkillChange(val) {
    setSkillQuery(val);
    if (!val.trim()) { setSkillSuggestions([]); return; }
    const q = val.toLowerCase();
    const allSkills = [...new Set([...COMMON_SKILLS, ...jobs.flatMap((j) => j.skillsRequired || [])])];
    setSkillSuggestions(
      allSkills.filter((s) => s.toLowerCase().includes(q) && !selectedSkills.includes(s)).slice(0, 6)
    );
  }

  function addSkill(skill) {
    setSelectedSkills((prev) => [...new Set([...prev, skill])]);
    setSkillQuery(""); setSkillSuggestions([]);
  }

  function removeSkill(skill) {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  }

  function clearAll() {
    setTitleQuery(""); setLocationQuery(""); setSkillQuery("");
    setSelectedSkills([]); setActiveType("All");
  }

  // ---- Filter logic ----
  const filteredJobs = jobs.filter((job) => {
    // Type filter
    if (activeType !== "All" && job.type !== activeType) return false;

    // Title / company search
    if (titleQuery.trim()) {
      const q = titleQuery.toLowerCase();
      if (!job.title?.toLowerCase().includes(q) && !job.company?.toLowerCase().includes(q)) return false;
    }

    // Location — normalize aliases
    if (locationQuery.trim()) {
      const canonical = normalizeLocation(locationQuery);
      const jobLoc = job.location?.toLowerCase() || "";
      // Also check if job location matches any alias of the searched city
      const matchedCity = INDIAN_CITIES.find((c) => cityMatches(c, locationQuery));
      const aliasMatch = matchedCity?.aliases.some((a) => jobLoc.includes(a));
      if (!jobLoc.includes(canonical) && !aliasMatch) return false;
    }

    // Skills — job must have ALL selected skills (partial match)
    if (selectedSkills.length > 0) {
      const jobSkills = (job.skillsRequired || []).map((s) => s.toLowerCase());
      const allMatch = selectedSkills.every((sel) => {
        const s = sel.toLowerCase();
        return jobSkills.some((js) => js.includes(s) || s.includes(js));
      });
      if (!allMatch) return false;
    }

    return true;
  });

  const isFiltering = titleQuery.trim() || locationQuery.trim() || selectedSkills.length > 0 || activeType !== "All";
  const types = ["All", "Full-time", "Internship", "Part-time"];

  return (
    <section id="jobs" className="px-6 md:px-16 py-10 bg-[var(--bg-base)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">Find Your Next Job</h2>

      {/* ---- Search Bar ---- */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 mb-5 space-y-3 shadow-sm">
        {/* Title search */}
        <input type="text" value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)}
          placeholder="🔍 Search by job title or company..."
          className="w-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition" />

        <div className="flex gap-3">
          {/* Location with city autocomplete */}
          <div className="relative flex-1" ref={locationRef}>
            <input type="text" value={locationQuery} onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="📍 City (e.g. Bangalore, Mumbai)"
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition" />
            {citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg z-30 overflow-hidden">
                {citySuggestions.map((city) => (
                  <button key={city.name}
                    onMouseDown={() => { setLocationQuery(city.name); setCitySuggestions([]); }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent-text)] transition">
                    📍 {city.name}
                    {city.aliases.length > 0 && <span className="text-xs text-[var(--text-muted)] ml-1.5">also: {city.aliases[0]}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skill search with autocomplete */}
          <div className="relative flex-1" ref={skillRef}>
            <input type="text" value={skillQuery} onChange={(e) => handleSkillChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && skillQuery.trim()) addSkill(skillQuery.trim()); }}
              placeholder="🛠 Filter by skill (Enter to add)"
              className="w-full border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition" />
            {skillSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg z-30 overflow-hidden">
                {skillSuggestions.map((skill) => (
                  <button key={skill} onMouseDown={() => addSkill(skill)}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent-text)] transition">
                    🛠 {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected skill tags */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedSkills.map((s) => (
              <span key={s} className="flex items-center gap-1 text-xs bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                {s}
                <button onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-red-500 ml-0.5 font-bold">×</button>
              </span>
            ))}
            <button onClick={() => setSelectedSkills([])} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition px-1">Clear skills</button>
          </div>
        )}
      </div>

      {/* ---- Type filter pills ---- */}
      <div className="flex gap-2 flex-wrap mb-5">
        {types.map((f) => (
          <button key={f} onClick={() => setActiveType(f)}
            className={`text-xs px-4 py-1.5 rounded-full font-medium transition
              ${activeType === f ? "bg-indigo-600 text-white" : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--border)]"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Results count */}
      {isFiltering && !loading && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[var(--text-muted)]">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
          </p>
          <button onClick={clearAll} className="text-xs text-indigo-500 hover:underline">Clear all filters</button>
        </div>
      )}

      {/* Jobs grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <JobSkeleton key={i} />)}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            {isFiltering ? `No jobs found for your search` : "No jobs available right now"}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            {isFiltering ? "Try different keywords, city, or skills" : "Check back soon!"}
          </p>
          {isFiltering && (
            <button onClick={clearAll} className="text-sm text-indigo-500 hover:underline">Clear all filters</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job._id} job={job} onClick={onJobClick} highlightSkills={selectedSkills} />
          ))}
        </div>
      )}
    </section>
  );
}

//  Hero 
function Hero() {
  return (
    <section className="px-6 md:px-16 py-16 text-center bg-[var(--bg-base)]">
      <span className="text-xs font-semibold bg-[var(--accent-light)] text-[var(--accent-text)] px-3 py-1 rounded-full">
        AI-Powered Job Platform
      </span>
      <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mt-4 leading-tight">
        Discover Top Jobs.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
          Get Selected Faster.
        </span>
      </h1>
      <p className="text-[var(--text-secondary)] mt-3 text-base max-w-xl mx-auto">
        Explore curated opportunities and optimize your resume for each role using AI.
      </p>
      <a href="#jobs">
        <button className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md">
          Browse Jobs
        </button>
      </a>
    </section>
  );
}

//  How It Works 
function HowItWorks() {
  const steps = [
    { icon: "🔍", num: "01", title: "Browse Jobs", desc: "Explore curated listings from top companies" },
    { icon: "📤", num: "02", title: "Upload Resume", desc: "Upload your PDF or DOCX for any job" },
    { icon: "📊", num: "03", title: "Get ATS Score", desc: "See how well your resume matches" },
    { icon: "🚀", num: "04", title: "Improve & Apply", desc: "Fix gaps and apply with confidence" },
  ];
  return (
    <section id="how-it-works" className="px-6 md:px-16 py-16 bg-[var(--bg-surface)]">
      <h2 className="text-2xl font-bold text-center text-[var(--text-primary)] mb-10">How it Works</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {steps.map((s) => (
          <div key={s.num} className="text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-2xl mx-auto">{s.icon}</div>
            <p className="text-xs text-[var(--accent-text)] font-bold mt-2">{s.num}</p>
            <p className="font-semibold text-[var(--text-primary)] text-sm mt-1">{s.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

//  Recruiter CTA 
function RecruiterCTA() {
  const navigate = useNavigate();
  return (
    <section className="px-6 md:px-16 py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-3">Post Jobs & Find the Best Candidates</h2>
      <p className="text-indigo-100 text-sm mb-6">Use AI to match candidates to your job requirements automatically</p>
      <button onClick={() => navigate("/signup")}
        className="bg-[var(--bg-surface)] text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition">
        For Recruiters →
      </button>
    </section>
  );
}

// Terms & Conditions Modal 
function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Terms & Conditions</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl transition">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5 text-sm text-[var(--text-secondary)]">
          <p className="text-xs text-[var(--text-muted)]">Last updated: March 2026</p>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">1. Acceptance of Terms</p>
            <p>By accessing or using ResumeIQ, you agree to be bound by these Terms. If you do not agree, please do not use the platform.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">2. Who Can Use ResumeIQ</p>
            <p>ResumeIQ is available to job seekers and verified recruiters. Recruiters must use a company email and are subject to admin approval before posting jobs.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">3. User Accounts</p>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. We reserve the right to suspend accounts that violate these terms.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">4. Resume Data & Privacy</p>
            <p>When you upload a resume, it is stored securely on Cloudinary. Resume content is parsed using Groq AI solely for job matching purposes. We do not sell or share your personal data with third parties.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">5. Job Postings</p>
            <p>Recruiters are solely responsible for the accuracy of job listings. Fake, misleading, or fraudulent job postings are strictly prohibited and will result in immediate account termination.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">6. Prohibited Activities</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
              <li>Posting false or misleading job listings</li>
              <li>Attempting to access other users' data</li>
              <li>Using the platform for spam or unsolicited communication</li>
              <li>Reverse engineering or scraping the platform</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">7. Intellectual Property</p>
            <p>All content, design, and code on ResumeIQ is the property of ResumeIQ. You may not copy or reproduce any part without written permission.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">8. Disclaimer</p>
            <p>ResumeIQ is provided "as is" without warranties of any kind. We do not guarantee job placement or interview success. ATS scores are indicative and not a guarantee of selection.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">9. Changes to Terms</p>
            <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">10. Contact</p>
            <p>For any questions regarding these terms, reach us at <span className="text-indigo-600">saransh2504@gmail.com</span></p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
function Footer({ onTermsClick }) {
  return (
    <footer className="px-6 md:px-16 py-8 bg-[var(--bg-surface)] border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-lg font-bold text-indigo-600">Resume<span className="text-purple-500">IQ</span></div>
      <div className="flex gap-6 text-sm text-[var(--text-muted)]">
        <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
        <button onClick={onTermsClick} className="hover:text-indigo-600 transition">Terms</button>
        <a href="mailto:saransh2504@gmail.com" className="hover:text-indigo-600 transition">Contact</a>
      </div>
      <p className="text-xs text-[var(--text-muted)]">© 2026 ResumeIQ. All rights reserved.</p>
    </footer>
  );
}

//  Main Landing Page 
export default function LandingPage() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />
      <Hero />
      <JobsSection onJobClick={setSelectedJob} />
      <HowItWorks />
      <RecruiterCTA />
      <Footer onTermsClick={() => setShowTerms(true)} />
      {selectedJob && <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
