# DayFlow HRMS

DayFlow is a browser-based workforce command center for attendance, leave, payroll, employee records, and team-health insights. It is a frontend-only application with demo data and changes stored in browser local storage.

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
- Browser `localStorage` for demo users and workspace data

## Local setup

Requirements:

- Node.js 22.12 or newer
- npm

From the project folder:

```powershell
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Data is retained in the current browser only.

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
```

## Project structure

```text
src/
  components/     shared application layout
  lib/            local data seed, browser persistence, and metrics
  pages/          authentication and HR workflow screens
public/assets/    local visual assets
```

## License

No license has been selected for this prototype yet.
