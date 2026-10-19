# GymFlow — Smart Gym Management System

**GymFlow** is a modern, responsive web application for comprehensive gym management built with React 18, Vite, TypeScript, Tailwind CSS, and Supabase. It features three dedicated role-based portals for **Admins**, **Employees (Trainers)**, and **Members**, governed by PostgreSQL Row Level Security (RLS).

---

## 🚀 Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Dark fitness theme with glassmorphic cards and micro-animations)
- **Routing:** React Router v6 with strict role-based route guards
- **Data & Auth:** `@supabase/supabase-js` (All authentication and PostgreSQL queries)
- **Icons:** Lucide React
- **Deployment:** Vercel (Single Page Application with rewrite routing)

---

## 📋 Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Active Supabase Project** with the Gym database schema configured.

---

## 🔑 Environment Variables

The application requires two Supabase client credentials configured in your environment:

| Variable | Description | Where to Find |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL (e.g. `https://your-project.supabase.co`) | Supabase Dashboard > Project Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anonymous API key | Supabase Dashboard > Project Settings > API > Project API keys (`anon` / `public`) |

> **Security Note:** Never use or expose your Supabase `service_role` secret key in client-side code. GymFlow operates exclusively with the safe public `anon` key.

---

## 💻 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` in the project root:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
To build the application and check for type errors:
```bash
npm run build
```
The compiled production bundle is generated in the `dist` directory.

---

## ☁️ How to Deploy on Vercel

GymFlow includes a `vercel.json` configuration file at the root to handle client-side routing (Single Page Application rewrites) so that deep links like `/admin`, `/staff`, and `/me` load properly:

```json
{ "rewrites": [ { "source": "/(.*)", "destination": "/index.html" } ] }
```

### Deployment Steps:

1. **Push your code** to a Git repository (GitHub, GitLab, or Bitbucket). Ensure sensitive files like `.env.local` are not committed (already ignored in `.gitignore`).
2. **Log into [Vercel](https://vercel.com/)** and click **Add New... > Project**.
3. **Import your Git repository**.
4. **Configure Project Settings**:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. **Add Environment Variables**:
   Under **Environment Variables**, add the two required keys:
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-supabase-public-anon-key`
6. Click **Deploy**.
7. Once deployed, Vercel provides a production URL (e.g., `https://your-gymflow-app.vercel.app`).

---

## 👥 Role-Based Portals & Access Control

The application authenticates users via `supabase.auth.signInWithPassword` and determines permissions by reading the user's role from the `app_users` table:

| Role | Default Route | Portal & Permissions |
|---|---|---|
| **Admin** | `/admin` | Metrics dashboard, member management, trainer rosters, account approvals, plans, batches, equipment, maintenance, programs, audit logs, and CSV reports. |
| **Employee (Trainer)** | `/staff` | Check-in / check-out desk register, desk payment recording, pending payments queue confirmation/rejection, trainee roster, and equipment status updates. |
| **Member** | `/me` | Personal membership status with expiry alerts, attendance heatmap, online & desk payment requests, diet & workout plans, feedback submissions, and personal profile. |
| **Pending** | `/pending` | Holding screen for newly registered accounts waiting for an administrator to approve and assign a role in the Accounts portal (`/admin/accounts`). |

---

## 🗄️ Database Tables Used

The app connects directly to the Supabase PostgreSQL database tables:
- `batch`
- `trainer`
- `member`
- `membership_plan`
- `membership`
- `payment`
- `attendance`
- `feedback`
- `equipment`
- `equipment_maintenance`
- `fitness_program`
- `diet_plan`
- `workout_plan`
- `member_program`
- `app_users`
- `audit_log`
- Views: `member_payment_summary`, `expiring_memberships`
- Stored Function: `expire_memberships()`
