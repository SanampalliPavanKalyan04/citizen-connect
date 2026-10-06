# Citizen Connect – Technology Stack

## Frontend (what citizens and officers see)
| Technology | Version | Used for |
|---|---|---|
| React | 19.1 | User interface components |
| Vite | 7.1 | Development server and production build |
| React Router DOM | 7.9 | Page navigation (/dashboard, /track/:code, /admin/...) |
| Axios | 1.12 | Calling the backend API |
| Leaflet + React-Leaflet | 1.9 / 5.0 | Map for picking a complaint location, heatmap in Analytics |
| OpenStreetMap tiles | – | Map background |
| HTML5 + CSS3 | – | Modern-government design, dark mode, responsive layout |
| Custom i18n | – | English, Telugu and Hindi translations |
| PWA (manifest + service worker) | – | Install the app on a phone ("Add to Home Screen") |
| Node.js script (zlib) | – | Generates app icons during the build |

## Backend (the server and business logic)
| Technology | Version | Used for |
|---|---|---|
| Python | 3.12 | Server language |
| Flask | 3.1 | REST API (/api/complaints, /api/departments, /api/admin/...) |
| Flask-SQLAlchemy / SQLAlchemy | 3.1 / 2.1 | Database models and queries (ORM) |
| Flask-JWT-Extended | 4.7 | Login tokens and role-based access (Citizen / Employee / Admin) |
| Flask-CORS | 6.0 | Allowing the frontend to call the API |
| Werkzeug | 3.1 | Password hashing and secure file uploads |
| python-dotenv | 1.1 | Loading environment variables locally |
| psycopg2-binary | 2.9 | PostgreSQL driver |
| gunicorn | 23.0 | Production server (for Docker/Render option) |

## Database
| Technology | Used for |
|---|---|
| PostgreSQL on Neon (serverless) | Permanent storage: users, complaints, timeline events, feedback, uploaded photos |
| SQLite | Local testing only |

## Hosting and deployment
| Technology | Used for |
|---|---|
| Vercel (Hobby plan) | Hosting the website and the API |
| Vercel Serverless Functions (Python) | Running Flask at /api/* (api/index.py) |
| Vercel environment variables | SECRET_KEY, JWT_SECRET_KEY, DATABASE_URL, ADMIN_EMAIL, SEED_DEMO |
| Live URL | https://citizen-connect-mu.vercel.app |

## Features built on this stack
- Complaint reporting with photo/video evidence, GPS/map location and duplicate detection nearby
- 21 PGRS-style departments (Revenue, Registration, Civil Supplies, Welfare, Police, etc.) and 62 issue types with target days (SLA)
- Automatic routing to the responsible department, SLA deadlines and overdue alerts
- Reopen up to 2 times, escalating to District Officer and then Head of Department
- Public tracking by complaint ID (no login needed)
- Citizen, Employee and Admin dashboards with live auto-refresh
- Admin analytics: charts, department table, staff performance, complaint heatmap, CSV export
- User management: roles, departments, password reset
- Citizen feedback and star ratings
- Multi-language (EN/TE/HI), dark mode and installable PWA

## Planned
- Email alerts via Brevo (needs BREVO_API_KEY and MAIL_FROM in Vercel)

## Development and testing tools
- Playwright (Chromium) for screenshot testing
- Flask test client for API tests
- npm and pip for package management
