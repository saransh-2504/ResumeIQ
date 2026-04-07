# ResumeIQ

An AI-powered job platform that helps candidates optimize their resumes and apply smarter, while giving recruiters a streamlined hiring workflow — with a built-in community chat system for company-based networking.

**Live:** [resume-iq-omega.vercel.app](https://resume-iq-omega.vercel.app)

---

## Features

### Candidates
- Browse and search jobs by title, location (50+ Indian cities with aliases), and skills
- Upload resume (PDF/DOCX) — auto-parsed using pdf-parse + Groq Llama-3.1
- ATS score against any job (Skills 60% + Experience 25% + Education 15%)
- Resume health report — completeness score, skill categorization, suggestions
- Contact verification via OTP before applying
- Job recommendations sorted by match score
- Track application status (Applied → Reviewed → Shortlisted → Rejected)
- Community access — read messages, react with emojis, join company communities

### Recruiters
- Sign up with company email only — personal emails (Gmail, Yahoo, Outlook etc.) blocked
- Requires admin approval before posting jobs
- Complete company profile setup before posting jobs
- Post, edit, delete, pause/resume job listings
- View applicants with resume download, filter by status
- Respond to admin suggestions on job listings
- Auto-joined to company community on profile setup (domain-based matching)
- Send messages in own company community

### Admin
- Approve/reject recruiter accounts (approval email sent automatically)
- View all jobs, candidates, recruiters
- Suggest changes to job listings — recruiter can approve/reject
- Handle recruiter account deletion requests
- Auto-member of every community
- Send messages in all communities
- Delete any message in any community

### Community (Chat System)
- Auto-created when a recruiter completes company profile — domain-based (e.g. `@polaris.com`)
- Same domain recruiters auto-join existing community
- Polling-based (no WebSockets) — messages every 10s on chat page, notifications every 60s globally
- Unread count bell icon with per-community breakdown dropdown
- Cursor-based pagination — load older messages on demand
- Emoji reactions with toggle (add/remove)
- Message delete — sender or admin only
- "Jump to first unread" button
- Date separators between days
- Role badges (Admin / Recruiter / Candidate)
- 2000 character message limit
- Community discovery — search, joined list, suggested (based on applied jobs + resume skills)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router v6 |
| Backend | Node.js 18+ + Express.js (ES Modules) |
| Database | MongoDB Atlas |
| Auth | JWT (cookie + Bearer header) + Google OAuth via Passport.js |
| Resume Storage | Cloudinary (private/authenticated, raw type) |
| Resume Parsing | pdf-parse + pdfjs-dist + Groq Llama-3.1 + Gemini Vision (fallback) |
| Email | Brevo (Sendinblue) API |
| OTP / Cache | Redis Cloud + ioredis |
| Community Chat | MongoDB polling (no WebSockets) |
| Security | express-rate-limit + express-mongo-sanitize + bcryptjs |
| Deployment | Render (backend) + Vercel (frontend) |
| Monitoring | UptimeRobot (5-min health ping to keep Render warm) |
| CI/CD | GitHub Actions (install + build on every push) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Groq API key — [console.groq.com](https://console.groq.com) (free: 14,400 req/day)
- Gemini API key — [aistudio.google.com](https://aistudio.google.com) (free: 1,500 req/day)
- Redis Cloud URL — [redis.com](https://redis.com) (free tier)
- Brevo API key — [app.brevo.com](https://app.brevo.com) (free: 300 emails/day)
- Google OAuth credentials — [console.cloud.google.com](https://console.cloud.google.com)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in values
npm run dev
```

### Create Admin User
```bash
cd backend
node src/scripts/createAdmin.js
```

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

MONGO_URI=
JWT_SECRET=                    # use a long random string in production
JWT_EXPIRES_IN=7d

EMAIL_USER=                    # sender email (Brevo verified sender)
BREVO_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

ADMIN_EMAIL=
ADMIN_PASSWORD=                # avoid # and @ characters (dotenv issue)

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GROQ_API_KEY=
GEMINI_API_KEY=

REDIS_URL=
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api/v1
```

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/signup` | Register (candidate or recruiter) |
| GET | `/api/v1/auth/verify-email` | Verify email via token |
| POST | `/api/v1/auth/resend-verification` | Resend verification email |
| POST | `/api/v1/auth/login` | Login with email + password |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/forgot-password` | Send password reset email |
| POST | `/api/v1/auth/reset-password` | Reset password via token |

### Community
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/community/discover` | Joined + suggested communities |
| GET | `/api/v1/community/:id` | Community detail |
| GET | `/api/v1/community/:id/members` | Member list |
| POST | `/api/v1/community/:id/join` | Join a community |
| GET | `/api/v1/community/:id/messages` | Get messages (`?before=`, `?after=`, `?limit=`) |
| POST | `/api/v1/community/:id/messages` | Send a message |
| DELETE | `/api/v1/community/:id/messages/:msgId` | Delete a message |
| POST | `/api/v1/community/:id/messages/:msgId/react` | Toggle emoji reaction |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/notifications/unread-count` | Total + per-community unread counts |
| POST | `/api/v1/notifications/:communityId/seen` | Mark community as seen |
| GET | `/api/v1/notifications/:communityId/first-unread` | Timestamp of first unread message |

---

## Project Structure

```
ResumeIQ/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Redis, Passport, Multer
│   │   ├── controllers/     # Auth, Jobs, Resume, Applications, Settings, Admin, Community, Notifications
│   │   ├── middlewares/     # Auth, Role, RecruiterApproval
│   │   ├── models/          # User, Job, Resume, Application, Community, Message, Notification
│   │   ├── routes/          # All API routes
│   │   ├── scripts/         # createAdmin.js
│   │   └── utils/           # JWT, OTP, ATS scoring, Resume parsing, Email, communityAutoCreate
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/             # Axios instance + community API
    │   ├── components/      # NotificationBell, ProtectedRoute, UI components
    │   ├── context/         # AuthContext
    │   ├── hooks/           # useNotifications
    │   ├── pages/           # All page components incl. CommunityPage, CommunityDiscovery
    │   └── App.jsx
    └── package.json
```

---

## Security

- Rate limiting on all routes (auth: 20 req/15min, others: 200 req/15min)
- MongoDB query sanitization via `express-mongo-sanitize`
- Passwords hashed with bcryptjs (salt rounds: 10)
- JWT stored in HttpOnly cookie (dev) + Authorization header (production cross-domain)
- Cloudinary resumes served as authenticated private URLs
- Personal email domains blocked for recruiter signup
- All recruiter accounts require manual admin approval
