# ResumeIQ Backend

## Setup
1. Copy env file:
   - `cp .env.example .env`
2. Fill required values in `.env` (Mongo URI, JWT secret, etc.)
3. Install deps:
   - `npm install`
4. Run:
   - `npm run dev`

## Health Check
GET `http://localhost:5000/api/health`