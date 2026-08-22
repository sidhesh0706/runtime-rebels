# Dayflow HRMS

DayFlow is a focused human-resources command center for tracking workforce activity, leave, payroll, and team health. It combines a polished hackathon demo with durable cloud persistence and server-side authentication.

## Features

- Server-side admin and employee authentication with PBKDF2 password hashing and HttpOnly sessions
- Role-based dashboard views
- Employee directory with search, filters, and employee details
- HR-provisioned employees with generated login IDs and temporary passwords
- Profile tabs for resume, private information, salary, and security
- Attendance check-in/check-out with calculated work and extra hours
- Leave requests with overlap validation, private R2 sick-note attachments, comments, and approval synchronization
- Payroll summaries with board-defined salary components, PF, and professional tax
- Workforce Pulse metrics and department availability
- Smart Leave Guard for overlapping leave checks
- Deterministic Dayflow AI responses for common HR questions
- Responsive layout for desktop and mobile screens
- Durable D1 workspace sync, audit records, and local offline fallback

## Stack

- React 19 and TypeScript
- Vinext on Vite 8 with the OpenAI Sites plugin
- Tailwind CSS
- React Router
- Recharts and Lucide React
- Cloudflare D1 for workspace records and sessions
- Cloudflare R2 for private document storage
- Drizzle schema definitions for maintainable data modeling

Browser storage is retained only as an offline cache. After sign-in, the authoritative workspace snapshot is loaded from D1 and changes are synchronized back to the server. External email delivery still requires a transactional email provider; the database already includes notification and audit tables for that integration.

## Setup

Requirements:

- Node.js 22 or newer
- npm

Install dependencies:

```bash
npm install
```

No environment variables are required locally. D1 and R2 bindings are declared in `.openai/hosting.json` and emulated by the Cloudflare Vite plugin.

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@dayflow.co` | `Dayflow@2026` |
| Employee | `isha@dayflow.co` | `Employee@2026` |

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

The production build validates all client, server, RSC, and API route bundles.

## Project Structure

```text
app/            Vinext route shell and authenticated API routes
db/             Drizzle D1 schema
lib/server/     Password hashing, sessions, and D1 initialization
src/
  components/    Shared application layout
  lib/            Seed data, cloud-sync store, and formatting helpers
  pages/          Auth, dashboard, attendance, leave, payroll, AI, and settings views
                  plus profile and security surfaces
  App.tsx        Router and protected routes
  index.css      Global styles and Tailwind layers
public/          Static favicon, icons, and social preview
```

## Hackathon Highlights

DayFlow's main hackathon features are the workforce command center dashboard, department availability metrics, Smart Leave Guard, Workforce Pulse, real check-in/check-out actions, leave approval workflows, and the HR-focused DayFlow AI interface. D1 persistence, secure sessions, R2 uploads, and audit events make the demo resilient enough for multi-device judging.

## License

No license has been selected for this prototype yet.
