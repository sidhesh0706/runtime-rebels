# DayFlow HRMS

DayFlow is a self-managed workforce command center for attendance, leave, payroll, employee records, and team-health insights. The application runs locally with its own Express API, PostgreSQL database, and protected filesystem uploads. It does not depend on Supabase or another hosted backend service.

## Implemented features


## Stack


PostgreSQL is authoritative. The application does not persist workforce records in browser storage.

## Local setup

Requirements:


From the project folder:

```powershell
Copy-Item .env.example .env
npm install
npm run db:up
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API health endpoint is [http://localhost:3001/api/health](http://localhost:3001/api/health).

The API applies pending SQL migrations and seeds the demo workspace automatically when it starts. The PostgreSQL data is retained in the Docker volume `nmit_dayflow_postgres_data` across application restarts.

### Demo accounts

| Role | Login | Password |
| --- | --- | --- |
| Administrator | `admin@dayflow.co` | `Dayflow@2026` |
| Employee | `isha@dayflow.co` | `Employee@2026` |

Do not reuse the demo passwords outside local evaluation.

## Commands

```powershell
npm run dev               # Express API + Vite client
npm run build             # strict client/server typecheck + production client build
npm run test:smoke        # authentication, privacy, and role-isolation checks
npm run test:integration  # disposable full workflow test; test company is removed afterward
npm run db:up             # start local PostgreSQL
npm run db:down           # stop PostgreSQL without deleting its volume
```

`npm run test:integration` checks workspace signup, employee provisioning, temporary-password enforcement, profile updates, protected uploads, leave approval, attendance synchronization, and payroll recalculation.

## Project structure

```text
server/
  migrations/       PostgreSQL schema migrations
  uploads/          ignored local attachment storage
  auth.ts           password, cookie, and session logic
  index.ts          Express APIs and authorization
  seed.ts           deterministic demo workspace
  *-test.ts         local API verification
src/
  components/       shared application layout
  lib/              API-backed state, types, and metrics
  pages/            authentication and HR workflow screens
docker-compose.yml  local PostgreSQL service
```

## Before committing or merging

Keep Docker Desktop running and execute:

```powershell
npm run build
npm run test:smoke
npm run test:integration
npm audit --omit=dev
git status --short
```

Then manually test both demo roles at `http://localhost:5173`, restart `npm run dev` to confirm records persist, and inspect the diff before creating each team member's own clearly described commit.

## Scope note

Email delivery is intentionally not delegated to a third-party provider. Local accounts are treated as verified, while notification and audit records are stored in PostgreSQL for an optional future self-hosted mail integration.

## License

No license has been selected for this prototype yet.
