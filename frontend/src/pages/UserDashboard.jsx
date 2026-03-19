import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ---- Mock job data (same as landing page) ----
const jobs = [
  { id: 1, title: 'Frontend Developer', company: 'Razorpay', location: 'Bangalore', type: 'Full-time', tags: ['React', 'JavaScript', 'CSS'], logo: '💳' },
  { id: 2, title: 'Backend Engineer', company: 'Zepto', location: 'Mumbai', type: 'Full-time', tags: ['Node.js', 'MongoDB', 'REST API'], logo: '🛒' },
  { id: 3, title: 'UI/UX Intern', company: 'Figma India', location: 'Remote', type: 'Internship', tags: ['Figma', 'Prototyping', 'Design'], logo: '🎨' },
  { id: 4, title: 'Data Analyst', company: 'Swiggy', location: 'Hyderabad', type: 'Full-time', tags: ['Python', 'SQL', 'Tableau'], logo: '🍔' },
  { id: 5, title: 'React Native Dev', company: 'CRED', location: 'Bangalore', type: 'Full-time', tags: ['React Native', 'TypeScript', 'Redux'], logo: '💳' },
]

// ---- Sidebar nav links ----
const navLinks = [
  { icon: '💼', label: 'Jobs', id: 'jobs' },
  { icon: '📋', label: 'My Applications', id: 'applications' },
  { icon: '📊', label: 'Resume Analysis', id: 'analysis' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
]

// ---- Sidebar ----
function Sidebar({ active, setActive }) {
  const navigate = useNavigate()
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1">
      {/* Logo — click to go home */}
      <div
        className="text-lg font-bold text-indigo-600 mb-6 cursor-pointer"
        onClick={() => navigate('/')}
      >
        Resume<span className="text-purple-500">IQ</span>
      </div>

      {navLinks.map(link => (
        <button
          key={link.id}
          onClick={() => setActive(link.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left
            ${active === link.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <span>{link.icon}</span>
          {link.label}
        </button>
      ))}
    </aside>
  )
}

// ---- Top bar ----
function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-800">Candidate Dashboard</p>
      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
        U
      </div>
    </header>
  )
}

// ---- Job type badge ----
function TypeBadge({ type }) {
  const colors = {
    'Full-time': 'bg-green-100 text-green-700',
    'Internship': 'bg-blue-100 text-blue-700',
    'Part-time': 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || 'bg-gray-100 text-gray-500'}`}>
      {type}
    </span>
  )
}

// ---- ATS Score circle ----
function ScoreCircle({ score }) {
  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke="#6366f1" strokeWidth="3"
          strokeDasharray={`${score} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-800">
        {score}
      </span>
    </div>
  )
}

// ---- Job Analysis Panel (right side when job is selected) ----
function JobAnalysisPanel({ job, onClose }) {
  const [uploaded, setUploaded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [applied, setApplied] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full overflow-y-auto">
      {/* Job header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">{job.logo}</div>
          <div>
            <p className="font-semibold text-gray-800">{job.title}</p>
            <p className="text-xs text-gray-400">{job.company} · {job.location}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
      </div>

      <TypeBadge type={job.type} />

      {/* Required skills */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Required Skills</p>
        <div className="flex flex-wrap gap-1">
          {job.tags.map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{t}</span>
          ))}
        </div>
      </div>

      {/* Resume upload section */}
      <div className="mt-5 bg-indigo-50 rounded-2xl p-4">
        <p className="text-sm font-semibold text-indigo-700 mb-1">Analyze for this Job</p>
        <p className="text-xs text-indigo-400 mb-3">Upload your resume to see your match score</p>

        {!uploaded ? (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={() => { setDragging(false); setUploaded(true) }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition
                ${dragging ? 'border-indigo-400 bg-indigo-100' : 'border-indigo-200 bg-white'}`}
            >
              <p className="text-xl mb-1">📄</p>
              <p className="text-xs text-gray-400">Drag & drop or click to upload</p>
            </div>
            <button
              onClick={() => setUploaded(true)}
              className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Analyze for this Job
            </button>
          </>
        ) : (
          // ATS result after upload
          <div className="bg-white rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-4 mb-3">
              <ScoreCircle score={78} />
              <div>
                <p className="text-sm font-semibold text-gray-700">Match Score: 78%</p>
                <p className="text-xs text-gray-400 mt-0.5">Good match — a few gaps</p>
              </div>
            </div>

            {/* Missing keywords */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-500 mb-1">Missing Keywords</p>
              <div className="flex flex-wrap gap-1">
                {['Docker', 'TypeScript'].map(k => (
                  <span key={k} className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-lg">{k}</span>
                ))}
              </div>
            </div>

            {/* Matching skills */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-green-600 mb-1">Matching Skills</p>
              <div className="flex flex-wrap gap-1">
                {job.tags.slice(0, 2).map(k => (
                  <span key={k} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-lg">{k}</span>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">Suggestions</p>
              <ul className="space-y-1">
                <li className="text-xs text-gray-500 flex gap-1"><span>💡</span> Add Docker to your skills section</li>
                <li className="text-xs text-gray-500 flex gap-1"><span>⚠️</span> Add measurable results in experience</li>
                <li className="text-xs text-gray-500 flex gap-1"><span>✅</span> Education section looks good</li>
              </ul>
            </div>

            {/* Re-upload button */}
            <button
              onClick={() => setUploaded(false)}
              className="w-full border border-indigo-300 text-indigo-600 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-50 transition"
            >
              Upload Improved Resume
            </button>
          </div>
        )}
      </div>

      {/* Apply button with tag toggle */}
      <button
        onClick={() => setApplied(!applied)}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition
          ${applied
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
          }`}
      >
        {applied ? '✅ Applied' : 'Apply Now'}
      </button>
    </div>
  )
}

// ---- Jobs Feed (left side) ----
function JobsFeed({ onSelect, selectedId }) {
  return (
    <div className="space-y-3">
      {/* Recommended label */}
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Recommended for you</p>

      {jobs.map(job => (
        <div
          key={job.id}
          onClick={() => onSelect(job)}
          className={`bg-white border rounded-2xl p-4 cursor-pointer transition hover:shadow-md
            ${selectedId === job.id ? 'border-indigo-400 shadow-sm' : 'border-gray-100'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">{job.logo}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{job.title}</p>
              <p className="text-xs text-gray-400">{job.company} · {job.location}</p>
            </div>
            <TypeBadge type={job.type} />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {job.tags.map(t => (
              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- My Applications tab ----
function MyApplications() {
  const applied = [
    { title: 'Frontend Developer', company: 'Razorpay', status: 'Applied', score: 78 },
    { title: 'Data Analyst', company: 'Swiggy', status: 'Shortlisted', score: 88 },
  ]

  return (
    <div className="space-y-3">
      {applied.map(a => (
        <div key={a.title} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">{a.title}</p>
            <p className="text-xs text-gray-400">{a.company}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-600">{a.score}%</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium
              ${a.status === 'Shortlisted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {a.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Main content area ----
function MainContent({ active }) {
  const [selectedJob, setSelectedJob] = useState(null)

  if (active === 'applications') return <MyApplications />
  if (active === 'settings') return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 text-sm text-gray-400">Settings coming soon...</div>
  )
  if (active === 'analysis') return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 text-sm text-gray-400">Select a job from Jobs tab to analyze your resume.</div>
  )

  // Default: Jobs tab — split layout
  return (
    <div className={`grid gap-6 ${selectedJob ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {/* Left: job feed */}
      <JobsFeed onSelect={setSelectedJob} selectedId={selectedJob?.id} />

      {/* Right: analysis panel — only shows when a job is selected */}
      {selectedJob && (
        <JobAnalysisPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  )
}

// ---- Main export ----
export default function UserDashboard() {
  const [active, setActive] = useState('jobs')

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6 overflow-y-auto">
          <MainContent active={active} />
        </main>
      </div>
    </div>
  )
}
