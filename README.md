# DayFlow HRMS

DayFlow is a PostgreSQL-backed workforce command center for attendance, leave, payroll, employee records, and team-health insights.

## Features

- Demo administrator and employee login
- Role-aware employee profiles and private information
- Attendance check-in and check-out
- Leave requests, approvals, and Smart Leave Guard
- Payroll and salary component views
- Workforce Pulse, department availability, heatmap, and Dayflow AI views
- Responsive React interface with local persistence

## Stack

- React 19, TypeScript, Vite 8, and Tailwind CSS
- React Router, Recharts, and Lucide React
- PostgreSQL for authentication and shared workspace persistence
- Express API with server-side sessions and role-aware mutation checks
- Browser cache for fast startup; PostgreSQL remains the source of truth

## Local setup

Requirements:

- Node.js 22.12 or newer
- npm
- Docker Desktop (or PostgreSQL 16 on `localhost:5432`)

From the project folder:

```powershell
npm install
npm run db:up
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API automatically creates its tables and seeds the two demo accounts; workspace changes persist in PostgreSQL.

### Demo accounts

| Role | Login | Password |
| --- | --- | --- |
| Administrator | `admin@dayflow.co` | `Admin@123` |
| Employee | `isha@dayflow.co` | `Employee@123` |

Use the Reset Demo action on the login screen to clear local data and regenerate the demo workspace.

## Commands

```powershell
npm run dev       # start the local Vite server
npm run build     # typecheck and build the production client
npm run preview   # preview the production build
npm run db:up     # start local PostgreSQL
npm run db:migrate
npm run db:seed
```

## Project structure

```text
src/
  components/     shared application layout
  lib/            typed seed, PostgreSQL synchronization, and metrics
  pages/          authentication and HR workflow screens
public/assets/    local visual assets
server/           Express API, sessions, schema, and database seed
```

## License

No license has been selected for this prototype yet.
