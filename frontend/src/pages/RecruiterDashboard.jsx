import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ---- Sidebar nav links ----
const navLinks = [
  { icon: '🏠', label: 'Dashboard', id: 'dashboard' },
  { icon: '➕', label: 'Post Job', id: 'post' },
  { icon: '👥', label: 'Candidates', id: 'candidates' },
  { icon: '📊', label: 'Analytics', id: 'analytics' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
]

// ---- Mock posted jobs ----
const postedJobs = [
  { id: 1, title: 'Frontend Developer', applicants: 12, status: 'Active' },
  { id: 2, title: 'Backend Engineer', applicants: 8, status: 'Active' },
  { id: 3, title: 'Data Analyst', applicants: 5, status: 'Closed' },
]

// ---- Mock candidates ----
const candidates = [
  { id: 1, name: 'Arjun Sharma', job: 'Frontend Developer', score: 88, skillsMatch: 92, experience: '3 yrs', status: 'Shortlisted' },
  { id: 2, name: 'Priya Mehta', job: 'Backend Engineer', score: 74, skillsMatch: 78, experience: '2 yrs', status: 'Reviewing' },
  { id: 3, name: 'Rohan Das', job: 'Frontend Developer', score: 61, skillsMatch: 55, experience: '1 yr', status: 'Rejected' },
  { id: 4, name: 'Sneha Kapoor', job: 'Data Analyst', score: 91, skillsMatch: 95, experience: '5 yrs', status: 'Shortlisted' },
  { id: 5, name: 'Vikram Nair', job: 'Backend Engineer', score: 69, skillsMatch: 63, experience: '2 yrs', status: 'Reviewing' },
]

// ---- Status badge ----
function StatusBadge({ status }) {
  const colors = {
    Shortlisted: 'bg-green-100 text-green-700',
    Reviewing: 'bg-yellow-100 text-yellow-700',
    Rejected: 'bg-red-100 text-red-500',
    Active: 'bg-green-100 text-green-700',
    Closed: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

// ---- Sidebar ----
function Sidebar({ active, setActive }) {
  const navigate = useNavigate()
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1">
      <div
        className="text-lg font-bold text-indigo-600 mb-1 cursor-pointer"
        onClick={() => navigate('/')}
      >
        Resume<span className="text-purple-500">IQ</span>
      </div>
      {/* Recruiter label */}
      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full w-fit mb-4">Recruiter</span>

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
      <p className="text-sm font-semibold text-gray-800">Recruiter Dashboard</p>
      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
        R
      </div>
    </header>
  )
}

// ---- Post Job Form ----
function PostJob() {
  // Simple controlled form state
  const [form, setForm] = useState({ title: '', description: '', skills: '', type: 'Full-time' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-3xl mb-2">🎉</p>
        <p className="font-semibold text-gray-800">Job Posted Successfully!</p>
        <p className="text-sm text-gray-400 mt-1">Candidates can now apply to "{form.title}"</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ title: '', description: '', skills: '', type: 'Full-time' }) }}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          Post another job
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-xl">
      <p className="text-sm font-semibold text-gray-700 mb-5">Post a New Job</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job title */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Title</label>
          <input
            required
            type="text"
            placeholder="e.g. Frontend Developer"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Description</label>
          <textarea
            required
            rows={4}
            placeholder="Describe the role, responsibilities..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Required Skills (comma separated)</label>
          <input
            type="text"
            placeholder="e.g. React, Node.js, SQL"
            value={form.skills}
            onChange={e => setForm({ ...form, skills: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        {/* Job type */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Type</label>
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white"
          >
            <option>Full-time</option>
            <option>Internship</option>
            <option>Part-time</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Post Job
        </button>
      </form>
    </div>
  )
}

// ---- Job Listings (shown on dashboard) ----
function JobListings() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-sm font-semibold text-gray-700 mb-4">Your Job Postings</p>
      <div className="space-y-3">
        {postedJobs.map(j => (
          <div key={j.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">{j.title}</p>
              <p className="text-xs text-gray-400">{j.applicants} applicants</p>
            </div>
            <StatusBadge status={j.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Candidate Detail View ----
function CandidateDetail({ candidate, onBack }) {
  const [status, setStatus] = useState(candidate.status)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <button onClick={onBack} className="text-xs text-indigo-500 mb-4 hover:underline">← Back</button>

      {/* Candidate header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
          {candidate.name[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{candidate.name}</p>
          <p className="text-xs text-gray-400">{candidate.job} · {candidate.experience}</p>
        </div>
        <div className="ml-auto"><StatusBadge status={status} /></div>
      </div>

      {/* Score + skills match */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Resume Score</p>
          <p className="text-3xl font-bold text-indigo-600">{candidate.score}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Skills Match</p>
          <p className="text-3xl font-bold text-purple-600">{candidate.skillsMatch}%</p>
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Strengths</p>
        <div className="flex flex-wrap gap-2">
          {['React', 'Problem Solving', 'Communication'].map(s => (
            <span key={s} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg">{s}</span>
          ))}
        </div>
      </div>

      {/* Gaps */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-600 mb-2">Skill Gaps</p>
        <div className="flex flex-wrap gap-2">
          {['Docker', 'System Design'].map(s => (
            <span key={s} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-lg">{s}</span>
          ))}
        </div>
      </div>

      {/* Change status buttons */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Update Status</p>
        <div className="flex gap-2">
          {['Shortlisted', 'Reviewing', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition
                ${status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Candidates Table ----
function CandidatesSection() {
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [sortBy, setSortBy] = useState('score')

  // Filter by status
  const filtered = candidates.filter(c =>
    filterStatus === 'All' ? true : c.status === filterStatus
  )

  // Sort by score or skillsMatch
  const sorted = [...filtered].sort((a, b) => b[sortBy] - a[sortBy])

  if (selected) return <CandidateDetail candidate={selected} onBack={() => setSelected(null)} />

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Candidates</p>
        {/* Filter pills */}
        <div className="flex gap-2">
          {['All', 'Shortlisted', 'Reviewing', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1 rounded-full transition font-medium
                ${filterStatus === s ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left py-2 px-3">Name</th>
              <th className="text-left py-2 px-3">Job</th>
              {/* Clicking sorts by that column */}
              <th className="text-left py-2 px-3 cursor-pointer hover:text-indigo-500" onClick={() => setSortBy('score')}>
                Score {sortBy === 'score' && '↓'}
              </th>
              <th className="text-left py-2 px-3 cursor-pointer hover:text-indigo-500" onClick={() => setSortBy('skillsMatch')}>
                Skills Match {sortBy === 'skillsMatch' && '↓'}
              </th>
              <th className="text-left py-2 px-3">Exp</th>
              <th className="text-left py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr
                key={c.id}
                onClick={() => setSelected(c)}
                className="border-b border-gray-50 hover:bg-indigo-50 cursor-pointer transition"
              >
                <td className="py-3 px-3 font-medium text-gray-800">{c.name}</td>
                <td className="py-3 px-3 text-gray-500 text-xs">{c.job}</td>
                <td className="py-3 px-3">
                  <span className={`font-semibold ${c.score >= 80 ? 'text-green-600' : c.score >= 65 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {c.score}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-600">{c.skillsMatch}%</td>
                <td className="py-3 px-3 text-gray-500">{c.experience}</td>
                <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- Analytics Section ----
function Analytics() {
  const skillData = [
    { skill: 'React', count: 4 },
    { skill: 'Node.js', count: 3 },
    { skill: 'Python', count: 2 },
    { skill: 'SQL', count: 5 },
    { skill: 'Docker', count: 1 },
  ]
  const max = Math.max(...skillData.map(s => s.count))

  // Applicant trend (mock weekly data)
  const trend = [3, 5, 4, 8, 6, 10, 7]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const trendMax = Math.max(...trend)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Average score + pipeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Overview</p>
        <p className="text-5xl font-extrabold text-indigo-600">76.6</p>
        <p className="text-xs text-gray-400 mt-1">Average resume score</p>

        <div className="mt-5 space-y-2">
          {[
            { label: 'Shortlisted', count: 2, color: 'bg-green-400' },
            { label: 'Reviewing', count: 2, color: 'bg-yellow-400' },
            { label: 'Rejected', count: 1, color: 'bg-red-400' },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20">{p.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`${p.color} h-2 rounded-full`} style={{ width: `${(p.count / 5) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500">{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill distribution */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Skill Distribution</p>
        <div className="space-y-3">
          {skillData.map(s => (
            <div key={s.skill} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">{s.skill}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${(s.count / max) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Applicant trend bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:col-span-2">
        <p className="text-sm font-semibold text-gray-700 mb-4">Applicant Trend (This Week)</p>
        <div className="flex items-end gap-3 h-24">
          {trend.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-indigo-200 rounded-t-lg hover:bg-indigo-400 transition"
                style={{ height: `${(val / trendMax) * 80}px` }}
              />
              <span className="text-xs text-gray-400">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Dashboard overview (quick stats + job listings) ----
function DashboardOverview({ setActive }) {
  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Candidates', value: '5', icon: '👥' },
          { label: 'Active Jobs', value: '2', icon: '📋' },
          { label: 'Shortlisted', value: '2', icon: '✅' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      <JobListings />
    </div>
  )
}

// ---- Main content switcher ----
function MainContent({ active, setActive }) {
  if (active === 'post') return <PostJob />
  if (active === 'candidates') return <CandidatesSection />
  if (active === 'analytics') return <Analytics />
  if (active === 'settings') return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 text-sm text-gray-400">Settings coming soon...</div>
  )
  return <DashboardOverview setActive={setActive} />
}

// ---- Main export ----
export default function RecruiterDashboard() {
  const [active, setActive] = useState('dashboard')

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
  )
}
