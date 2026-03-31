# ResumeIQ

An AI-powered job platform that helps candidates optimize their resumes and apply smarter, while giving recruiters a streamlined hiring workflow.

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

### Recruiters
- Sign up with company email — requires admin approval
- Complete company profile setup before posting jobs
- Post, edit, delete jobs
- Pause/Resume job listings (temporarily stop accepting applications)
- View applicants with resume download, filter by status
- Respond to admin suggestions on job listings

### Admin
- Approve/reject recruiter accounts (approval email sent automatically)
- View all jobs, candidates, recruiters
- Suggest changes to job listings — recruiter can approve/reject

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT (HTTP-only cookies) + Google OAuth |
| Resume Storage | Cloudinary (private/authenticated) |
| Resume Parsing | pdf-parse + pdfjs-dist + Groq Llama-3.1-8b-instant |
| OTP | Redis Cloud + Nodemailer (Gmail SMTP) |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Groq API key (free at console.groq.com)
- Redis Cloud URL (free at redis.com)
- Gmail App Password

### Backend
```bash
cd backend
npm install
# copy .env.example to .env and fill values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# copy .env.example to .env and fill values
npm run dev
```

### Create Admin
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
JWT_SECRET=
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
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

## Project Structure

```
ResumeIQ/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Redis, Passport
│   │   ├── controllers/     # Auth, Jobs, Resume, Applications, Settings, Admin
│   │   ├── middlewares/     # Auth, Role, Recruiter approval
│   │   ├── models/          # User, Job, Resume, Application
│   │   ├── routes/          # All API routes
│   │   ├── scripts/         # createAdmin.js
│   │   └── utils/           # JWT, OTP, ATS scoring, Resume parsing, Email
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/             # Axios instance
    │   ├── components/      # Navbar, Loader, ProtectedRoute
    │   ├── context/         # AuthContext
    │   ├── pages/           # All page components
    │   └── App.jsx
    └── package.json
```
