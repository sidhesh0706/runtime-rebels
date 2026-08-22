# Dayflow HRMS

Dayflow is a focused human-resources management interface for tracking workforce activity, leave, payroll, and team health. It was built as a hackathon prototype with an operations-first dashboard and lightweight local demo data.

## Features

- Admin and employee authentication flows
- Role-based dashboard views
- Employee directory with search, filters, and employee details
- Attendance overview plus employee check-in and check-out simulation
- Leave requests with approval and rejection workflows
- Payroll summaries and salary breakdowns
- Workforce Pulse metrics and department availability
- Smart Leave Guard for overlapping leave checks
- Deterministic Dayflow AI responses for common HR questions
- Responsive layout for desktop and mobile screens

## Stack

- React 19 and TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts and Lucide React
- PostgreSQL schema included in `schema.sql` for the planned data model

> Current prototype note: the running frontend seeds demo data and persists changes in browser `localStorage`. It does not currently connect to PostgreSQL or expose a backend API. `schema.sql` documents the intended PostgreSQL tables, views, and Smart Leave Guard query.

## Setup

Requirements:

- Node.js 18 or newer
- npm

Install dependencies:

```bash
npm install
```

Create local demo credentials:

```bash
Copy-Item .env.example .env
```

Edit `.env` and replace the example values. These are browser-visible demo values, not production secrets.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_DEMO_ADMIN_PASSWORD` | Password for the seeded admin demo account |
| `VITE_DEMO_EMPLOYEE_PASSWORD` | Password for the seeded employee demo account |

The demo account emails are `admin@dayflow.co` and `isha@dayflow.co`. Existing browser data is stored under the `dayflow_users`, `dayflow_session`, and `dayflow_data` localStorage keys.

## Run

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

There are currently no automated test or lint scripts configured in `package.json`.

## Project Structure

```text
src/
  components/    Shared application layout
  lib/            Seed data, localStorage store, and formatting helpers
  pages/          Auth, dashboard, attendance, leave, payroll, AI, and settings views
  App.tsx        Router and protected routes
  index.css      Global styles and Tailwind layers
schema.sql       PostgreSQL tables, views, and Smart Leave Guard query
public/          Static favicon and icon assets
```

## Hackathon Highlights

Dayflow's main hackathon features are the workforce command center dashboard, department availability metrics, Smart Leave Guard, Workforce Pulse, simulated attendance actions, leave approval workflows, and the HR-focused Dayflow AI interface. These features are intentionally presented as a self-contained frontend demo while the PostgreSQL model remains ready for a future backend integration.

## License

No license has been selected for this prototype yet.
