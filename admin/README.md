# Campus to Career — Mentor & Admin Portal

Dedicated administration and mentorship portal for the **Campus to Career AI** ecosystem.

## 🚀 Features

- **Student Roster & 360° Profile**: Real-time student placement readiness, skill gap analytics, ATS resume scores, and interview performance.
- **Exams & Assessment Center**: Automated MCQ and AI-assisted Coding test authoring, live proctoring radar, candidate unblocking, and exam result disclosures.
- **Super Dream Placement Track**: 10-section mentor verification engine for FAANG-tier certifications, deliverables, coding milestones, and sign-offs.
- **AI Intervention Engine**: Automatic diagnosis of underperforming students with personalized 2-week recovery roadmaps and actionable mentor tasks.
- **Proctoring Radar & Integrity Monitoring**: Real-time tab switch, camera violation, and fullscreen integrity monitoring with batch unblock controls.
- **Company Matcher & Cohort Analytics**: Placement funnel breakdown, missing skill heatmaps, and custom PDF progress report export.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS + Glassmorphism Theme Engine
- **State & Caching**: TanStack Query v5
- **Icons & UI**: Lucide Icons + Sonner Toasts
- **Charts & Export**: Recharts + jsPDF + html2canvas

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file (copied from `.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STUDENT_APP_URL=http://localhost:5173
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   The portal runs by default at `http://localhost:8081`.

---

## 🌐 Deploying to Vercel

1. **Import this repository** in [Vercel Dashboard](https://vercel.com/new).
2. **Framework Preset**: Select `Vite` (automatically detected).
3. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed backend API (e.g. `https://api.yourdomain.com/api` or `https://campus-to-career-backend.up.railway.app/api`).
   - `VITE_STUDENT_APP_URL`: The URL of the student frontend on Vercel (e.g. `https://campus-to-career.vercel.app`).
4. **Deploy**: Click **Deploy**. The included `vercel.json` ensures client-side routing rewrites work properly on page refreshes.

---

## 🔗 Backend Interconnection & CORS

Make sure the backend API server includes your admin Vercel domain in its allowed origins:
- `ADMIN_CLIENT_URL`: `https://your-admin-project.vercel.app`
- Or add it to `CLIENT_URL` (comma-separated): `https://your-student-app.vercel.app,https://your-admin-app.vercel.app`
