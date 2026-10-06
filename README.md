# Citizen Connect – Revolutionising Services

A full-stack civic complaint management system inspired by the uploaded project report.

## Stack
- Frontend: React + Vite + React Router + Axios + Leaflet
- Backend: Flask + Flask-SQLAlchemy + JWT + Flask-CORS
- Database: SQLite by default (easy local demo); can be switched to MySQL
- Uploads: local `backend/uploads/`

## Roles
- CITIZEN: submit complaints, upload evidence, capture GPS, track status, give feedback
- ADMIN: view/manage complaints, assign employees, change priority/status
- EMPLOYEE: view assigned complaints, update status and resolution details

## Main workflow
Citizen -> Complaint + photo + GPS -> Admin -> Employee assignment -> In Progress -> Resolved -> Citizen feedback

## 1. Backend setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Backend runs at: http://127.0.0.1:5000

Demo accounts are created automatically:
- Admin: admin@citizenconnect.com / admin123
- Employee: employee@citizenconnect.com / employee123
- Citizen: citizen@citizenconnect.com / citizen123

## 2. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## 3. Optional MySQL

The starter uses SQLite so the project can run immediately. For MySQL, set:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost/citizen_connect
```

and create the database:

```sql
CREATE DATABASE citizen_connect;
```

## Project structure

```text
CitizenConnect/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── uploads/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── styles.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── MapPicker.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── CitizenDashboard.jsx
│           ├── NewComplaint.jsx
│           ├── AdminDashboard.jsx
│           └── EmployeeDashboard.jsx
└── README.md
```

## Deploy on Vercel

`vercel.json`, `api/index.py` and the root `requirements.txt` are already set up:
the React build is served by Vercel's CDN and Flask runs as a Python function.

1. Push this folder to GitHub, then on vercel.com: **Add New → Project → Import** the repo.
   (Or from this folder run: `npx vercel --prod`.)
2. Project → **Settings → Environment Variables**, add:
   `SECRET_KEY`, `JWT_SECRET_KEY` (long random strings), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO=false`.
3. Project → **Storage → Create Database → Neon (Postgres)** → connect it to the project.
   This adds `DATABASE_URL` automatically.
4. **Deployments → Redeploy.**

Without a database (step 3) the app still runs, but uses a temporary SQLite file in
`/tmp`: data can disappear at any time. Vercel limits uploads to about 4.5 MB,
so the app accepts evidence files up to 4 MB.

## Deployment on Render / Docker (single service: Flask serves the React build)

Tested with gunicorn + PostgreSQL, including a simulated redeploy: users,
complaints and uploaded photos all survive. Photos are stored in the
database, so nothing depends on the server's disk.

### Option A – Render (free, easiest)
1. Push this folder to a GitHub repo.
2. On render.com: **New → Blueprint** → pick the repo.
3. Render asks for **ADMIN_EMAIL** and **ADMIN_PASSWORD**: type your real admin login.
4. It creates a Postgres database + the web service automatically. Open the URL.
5. Log in as admin → add employees. Citizens register themselves.

> Render's free Postgres expires after a trial period. For a permanent free
> database, create one on neon.tech and paste its connection string into the
> service's `DATABASE_URL` in the Render dashboard.

### Option B – any Docker host (Railway, Fly.io, VPS)
```bash
docker build -t citizen-connect .
docker run -p 5000:5000 \
  -e SECRET_KEY=xxx -e JWT_SECRET_KEY=yyy \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e SEED_DEMO=false -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD=strongpass \
  citizen-connect
```

### Environment variables
| Name | Purpose |
|---|---|
| SECRET_KEY, JWT_SECRET_KEY | Long random strings (required in production) |
| DATABASE_URL | Postgres (recommended) or MySQL URL. Default SQLite is for local use |
| ADMIN_EMAIL, ADMIN_PASSWORD | Your real admin account, created on first start |
| SEED_DEMO | `true` (default) creates public demo accounts and shows them on the login page. Use `false` in production |
| CORS_ORIGINS | Only if the frontend is hosted separately |
| VITE_API_URL | Build-time; only if the frontend is hosted separately |

Local dev is unchanged (`python app.py` + `npm run dev`): SQLite + demo accounts.

## Next enhancements
- Email/SMS/push notifications
- OTP login
- Cloud image storage
- Complaint heatmap
- AI complaint classification
- Duplicate complaint detection
- AI pothole image detection
- Department-wise analytics
- Production deployment
