# DayFlow — Workforce, Aligned

> A self-hosted, PostgreSQL-backed HR management system built by **Runtime Rebels** for the **Odoo x NMIT Bangalore Hackathon '26 — Virtual Round**.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

DayFlow gives HR teams one clear view of their workforce. Attendance, time off, employee records, payroll, team availability, and operational insights stay synchronized in a single application—without relying on Supabase, Firebase, or another third-party backend service.

## Why DayFlow?

HR information is often fragmented across spreadsheets, messages, and disconnected tools. That makes simple questions surprisingly difficult:

- Who is available today?
- Which leave requests need attention?
- Is one department becoming understaffed?
- Does an employee see the same leave status as HR?
- Can sensitive profile and payroll data be protected by role?

DayFlow turns those questions into live, traceable workflows backed by PostgreSQL.

## Core features

| Area | What DayFlow delivers |
| --- | --- |
| Authentication | Email or Login ID sign-in, salted password hashing, PostgreSQL sessions, and role-aware navigation |
| HR dashboard | Live KPIs, pending approvals, recent activity, Workforce Pulse, department availability, and a workforce heatmap |
| Employee directory | Searchable employee cards, consistent gender-aware illustrated avatars, detailed profiles, and admin employee provisioning |
| Attendance | Employee check-in/check-out, day and week views, admin visibility, late/absent/leave states, and payable-day context |
| Time off | Employee leave requests, allowance summaries, and admin approval/rejection with the same status visible to both roles |
| Payroll | Salary breakdowns, deductions, net pay, employee read-only access, and admin-controlled wage updates |
| Workforce Pulse | Data-derived attendance, leave, staffing, and department health indicators with a non-flat historical trend |
| Dayflow AI | Deterministic workforce questions and answers computed from current employee, attendance, and leave data |
| Security and auditability | Server-enforced mutation rules, private-field protection, salary restrictions, session expiry, and an audit log |

## Architecture

```mermaid
flowchart LR
    U[Admin or Employee] --> R[React + TypeScript client]
    R -->|/api via Vite proxy| E[Express API]
    E --> A[Authentication and role checks]
    A --> P[(PostgreSQL 16)]
    P --> S[Users and sessions]
    P --> W[Shared workforce state]
    P --> L[Audit log]
    W --> E --> R
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Recharts, and Lucide React
- **Backend:** Express 5 API running on Node.js
- **Database:** PostgreSQL 16, started locally with Docker Compose
- **Authentication:** salted `scrypt` password hashes and opaque 12-hour sessions stored in PostgreSQL
- **Data flow:** the browser keeps a fast local cache, while PostgreSQL remains the shared source of truth

## Run locally

### Prerequisites

- Node.js 22.12 or newer
- npm
- Docker Desktop with Docker Compose, or a PostgreSQL 16 instance

### Quick start

```powershell
git clone https://github.com/sidhesh0706/runtime-rebels.git
cd runtime-rebels
npm install
Copy-Item .env.example .env
npm run db:up
npm run dev
```
### Demo accounts

| Role | Email | Login ID | Password |
| --- | --- | --- | --- |
| HR Administrator | `admin@dayflow.co` | `DFAS1001` | `Admin@123` |
| Employee | `isha@dayflow.co` | `DFIP1002` | `Employee@123` |

> These credentials are seed data for the local demo environment only. Change them before any real deployment.


## Role model

| Capability | Administrator | Employee |
| --- | :---: | :---: |
| View the full employee directory | Yes | Limited |
| Add employees and provision credentials | Yes | No |
| Edit salary information | Yes | No |
| Review leave requests | Yes | No |
| Request personal leave | No | Yes |
| Check personal attendance in/out | No | Yes |
| Edit private profile information | Any employee | Own profile only |
| View payroll | All employees | Own record only |

Authorization is checked by the API before shared data is accepted; hiding a control in the interface is not treated as a security boundary.

## PostgreSQL data model

| Table | Purpose |
| --- | --- |
| `dayflow_app_users` | User identity, role, Login ID, profile metadata, and password hash |
| `dayflow_app_sessions` | Expiring server-side login sessions |
| `dayflow_app_workspace_state` | Versioned shared workforce data for employees, attendance, leave, and payroll |
| `dayflow_app_audit_log` | Authentication and employee-provisioning events |

The application uses parameterized SQL queries, timing-safe password verification, `HttpOnly`/`SameSite=Lax` cookies, and server-side role validation. The included environment settings are intentionally configured for local demo use.

## Environment configuration

Copy `.env.example` to `.env` and adjust values when needed:

```env
DATABASE_URL=postgresql://dayflow:dayflow@localhost:5432/dayflow
API_PORT=3001
SESSION_COOKIE_NAME=dayflow_session
DEMO_ADMIN_PASSWORD=Admin@123
DEMO_EMPLOYEE_PASSWORD=Employee@123
```

`.env` is ignored by Git; only the safe example file is committed.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express API and Vite client together |
| `npm run dev:client` | Start only the Vite client |
| `npm run dev:server` | Start only the API with automatic reload |
| `npm run build` | Type-check the client and server, then create a production client build |
| `npm run preview` | Preview the production client build locally |
| `npm run db:up` | Start PostgreSQL with Docker Compose |
| `npm run db:migrate` | Create or update the PostgreSQL schema |
| `npm run db:seed` | Seed the demo users and workforce workspace |
| `npm run db:down` | Stop the local Docker Compose services |

## Project structure

```text
runtime-rebels/
├── server/                 # Express API, auth, migrations, and seed logic
│   ├── auth.ts
│   ├── db.ts
│   ├── index.ts
│   ├── migrate.ts
│   └── seed.ts
├── src/
│   ├── components/         # Shared layout, command palette, and avatars
│   ├── lib/                # Typed data, state synchronization, and metrics
│   ├── pages/              # HR and employee workflow screens
│   ├── App.tsx             # Protected routes and role-aware dashboard
│   └── main.tsx
├── docker-compose.yml      # Local PostgreSQL 16 service
├── .env.example            # Safe local configuration template
├── package.json
└── vite.config.ts          # Vite setup and local API proxy
```

## Verification

```powershell
npm run build
docker compose ps
```

Then verify both demo accounts, employee-to-admin leave synchronization, check-in/check-out, consistent avatars, Workforce Pulse, the heatmap, payroll permissions, and a page refresh to confirm database persistence.

---

Built with care by **Runtime Rebels** for the Odoo x NMIT Bangalore Hackathon '26.
