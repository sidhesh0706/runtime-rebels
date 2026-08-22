import { useAuth } from '../lib/store'

export default function Settings(){
  const { user } = useAuth()
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Settings • User profile menu</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted mt-1">Workspace preferences • Local demo storage • My Profile → Security</p>
      </div>

      <div className="bg-white border border-line rounded-[12px] overflow-hidden">
        <div className="px-5 py-4 border-b border-line"><h3 className="text-[13px] font-semibold">My Profile</h3><p className="text-[11px] text-muted">Access via avatar dropdown → My Profile. View-only to edit in Employee Profile.</p></div>
        <div className="p-5 flex gap-4 items-center">
          <img src={user?.avatar} className="w-12 h-12 rounded-full object-cover border border-line"/>
          <div>
            <div className="text-[13px] font-medium">{user?.name}</div>
            <div className="text-[12px] text-muted">{user?.email} • {(user as any)?.loginId || 'Login ID auto-generated'} • {user?.role}</div>
          </div>
          <div className="ml-auto text-[11px] px-2.5 py-1 rounded-lg bg-paper border border-line">Change password in Security tab of Profile</div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[12px]">
        <div className="px-5 py-4 border-b border-line"><h3 className="text-[13px] font-semibold">PostgreSQL</h3></div>
        <div className="p-5">
          <div className="text-[12px] font-mono bg-paper border border-line rounded-[10px] p-3 leading-relaxed">
            DATABASE_URL=postgresql://dayflow:••••@localhost:5432/dayflow<br/>
            Tables: users, employees, departments, attendance, leave_requests, payroll
          </div>
          <div className="mt-3 text-[11px] text-muted">Schema and seed in <span className="font-mono">schema.sql</span> — run <span className="font-mono">psql -f schema.sql</span>.</div>
          <div className="mt-3 text-[11px] leading-relaxed text-muted bg-[#edf4ef] border border-[#d6e8db] rounded-[10px] p-3">
            <span className="font-medium text-ink">Preserved backend:</span> Existing PostgreSQL/API functionality is untouched. All metrics derive from these tables. Frontend changes are UI/structure only.
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[12px] p-5">
        <h3 className="text-[13px] font-semibold">Appearance</h3>
        <div className="mt-3 grid sm:grid-cols-3 gap-3 text-[12px]">
          <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="font-medium">Theme</div><div className="text-muted text-[11px]">Light • Muted green accent</div><div className="mt-2 w-full h-2 rounded-full bg-[#1a6b4a]"/></div>
          <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="font-medium">Radius</div><div className="text-muted text-[11px]">10–12px • Subtle borders</div><div className="mt-2 w-full h-2 rounded-full bg-white border border-line"/></div>
          <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="font-medium">Typography</div><div className="text-muted text-[11px]">Inter • Antialiased</div><div className="mt-2 text-[11px] font-medium">Aa Bb Cc 123</div></div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[12px] p-5">
        <h3 className="text-[13px] font-semibold">About Dayflow</h3>
        <p className="text-[12px] text-muted mt-2 leading-relaxed">Dayflow is a premium HR SaaS — clean, dense, professional. Employees land on Employees grid, use Check In/Out, view Private Info & Salary (admin), track Attendance and Time Off via calendar/allocation and approval flows.</p>
      </div>
    </div>
  )
}
