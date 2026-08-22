import { useAuth, useMetrics, departmentStats } from '../lib/store'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'

// compact KPI without big icon circles
function Kpi({ label, value, delta, hint }: { label: string; value: string | number; delta?: string; hint: string }) {
  return (
    <div className="bg-white border border-line rounded-xl px-4 py-4">
      <div className="text-[11px] tracking-[0.06em] font-medium text-muted uppercase">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-[22px] font-semibold tracking-tight text-ink leading-none">{value}</div>
        {delta && <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-[#d6e8db]">{delta}</span>}
      </div>
      <div className="text-[11px] text-muted mt-1">{hint}</div>
    </div>
  )
}

export function AdminDashboard() {
  const { user, employees, attendance, leaves, refreshBrief } = useAuth()
  const m = useMetrics()
  const depts = departmentStats(employees, attendance, leaves)
  const lowDept = depts[0]
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').slice(0, 3)

  // simple 7-day availability trend for chart
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i)
    const ds = d.toISOString().slice(0, 10)
    const att = attendance.filter(a => a.date === ds)
    const present = att.filter(a => ['Present', 'Late', 'Half-day'].includes(a.status)).length
    const rate = employees.length ? Math.round((present / employees.length) * 100) : 0
    return { name: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2), value: rate }
  })

  return (
    <div className="space-y-6">
      {/* compact header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Dashboard</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">Good morning, {user?.name.split(' ')[0]}.</h1>
          <p className="text-[13px] text-muted mt-1">Here&apos;s a quick overview of your workforce today.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[12px] text-muted">
          <span className="hidden lg:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <button onClick={refreshBrief} className="ml-2 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium hover:bg-paper">Refresh</button>
        </div>
      </div>

      {/* KPIs 4-5 simple */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Total employees" value={m.total} hint="Across 6 departments" />
        <Kpi label="Present today" value={m.present} delta={`${m.availability}%`} hint="Attendance rate" />
        <Kpi label="On leave" value={m.onLeave} hint={`${m.leaveRate}% of workforce`} />
        <Kpi label="Pending approvals" value={m.pending} hint="Requires action" />
        <div className="bg-white border border-line rounded-xl px-4 py-4">
          <div className="text-[11px] tracking-[0.06em] font-medium text-muted uppercase">Availability</div>
          <div className="mt-2 text-[22px] font-semibold tracking-tight">{m.availability}%</div>
          <div className="text-[11px] text-muted mt-1">Pulse {m.pulse}% • {m.pulseLabel}</div>
        </div>
      </div>

      {/* Workforce Pulse — restrained analytics section, not floating giant card */}
      <div className="bg-white border border-line rounded-xl">
        <div className="px-5 py-4 border-b border-line flex items-start justify-between">
          <div>
            <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Workforce Pulse</div>
            <div className="text-[13px] text-muted mt-0.5">How healthy is the workforce today?</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-semibold leading-none">{m.pulse}%</span>
            <span className={`text-[11px] px-2 py-1 rounded-md border font-medium ${m.pulseLabel === 'Healthy' ? 'bg-accent-soft text-accent border-[#d6e8db]' : 'bg-[#fdf2f2] text-[#8b3a3a] border-[#f0d6d6]'}`}>{m.pulseLabel}</span>
          </div>
        </div>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-0 divide-y lg:divide-y-0 lg:divide-x divide-line">
          <div className="px-5 py-5">
            <div className="text-[11px] font-medium text-muted uppercase tracking-[0.06em]">Availability trend — last 7 days</div>
            <div className="mt-3 h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                  <CartesianGrid stroke="#f0ece6" strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9aa0a8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#9aa0a8' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ede9e3', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#1a6b4a" strokeWidth={1.5} fill="#edf4ef" fillOpacity={1} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3 text-[11px]">
              <div><div className="text-muted">Attendance</div><div className="text-[13px] font-semibold">{m.availability}%</div></div>
              <div><div className="text-muted">Availability</div><div className="text-[13px] font-semibold">{m.availability}%</div></div>
              <div><div className="text-muted">Leave load</div><div className="text-[13px] font-semibold">{m.leaveRate}%</div></div>
              <div><div className="text-muted">Absence</div><div className="text-[13px] font-semibold">{m.absenceRate}%</div></div>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="text-[11px] font-medium text-muted uppercase tracking-[0.06em]">Breakdown</div>
            <div className="mt-3 space-y-3">
              {[
                { k: 'Attendance', v: m.availability },
                { k: 'Availability', v: m.availability },
                { k: 'Leave load', v: m.leaveRate, muted: true },
                { k: 'Absence', v: m.absenceRate, muted: true },
              ].map(row => (
                <div key={row.k} className="flex items-center gap-3">
                  <div className="text-[12px] w-20 text-muted">{row.k}</div>
                  <div className="flex-1 h-1.5 bg-[#f2efec] rounded-full overflow-hidden"><div className="h-full bg-ink rounded-full" style={{ width: `${row.v}%` }} /></div>
                  <div className="text-[12px] font-medium w-10 text-right">{row.v}%</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Link to="/pulse" className="px-3 py-1.5 rounded-lg bg-ink text-white text-[12px] font-medium">View breakdown</Link>
              <Link to="/ai" className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium">Ask Dayflow AI</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Department availability */}
      <div className="bg-white border border-line rounded-xl">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">Department availability</h3>
          <Link to="/employees" className="text-[12px] font-medium text-muted hover:text-ink inline-flex items-center gap-1">View all <ArrowUpRight className="w-3.5 h-3.5" /></Link>
        </div>
        <div className="px-5 py-4">
          <div className="space-y-3">
            {depts.map(d => (
              <div key={d.dept} className="flex items-center gap-3">
                <div className="w-28 text-[12px] font-medium truncate">{d.dept}</div>
                <div className="flex-1 h-1.5 bg-[#f2efec] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.availability}%`, background: d.availability < 65 ? '#b42318' : d.availability < 80 ? '#b54708' : '#1a6b4a' }} />
                </div>
                <div className="text-[12px] font-medium w-10 text-right tabular-nums">{d.availability}%</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[12px] leading-relaxed bg-[#faf9f7] border border-line rounded-lg px-3 py-3">
            <span className="font-medium">Insight:</span> {lowDept.dept} availability {lowDept.availability}% — {lowDept.present} present of {lowDept.total}, {lowDept.onLeave} on leave, {lowDept.absent} absent. <Link to="/employees" className="font-medium underline decoration-line-strong underline-offset-4">View team</Link>
          </div>
        </div>
      </div>

      {/* Pending + Heatmap row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-line rounded-xl">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Workforce heatmap</h3>
            <Link to="/pulse" className="text-[12px] font-medium border border-line rounded-lg px-2.5 py-1 hover:bg-paper">Open heatmap</Link>
          </div>
          <div className="px-5 py-4">
            <div className="text-[12px] text-muted">Availability by team × last 7 days</div>
            <HeatmapMini />
          </div>
        </div>
        <div className="bg-white border border-line rounded-xl">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-[13px] font-semibold">Pending leave requests</h3>
            <div className="text-[12px] text-muted">Requires review</div>
          </div>
          <div className="p-3 space-y-2">
            {pendingLeaves.length ? pendingLeaves.map(l => {
              const emp = employees.find(e => e.id === l.employeeId)!
              return (
                <div key={l.id} className="border border-line rounded-lg px-3 py-3 flex gap-3">
                  <img src={emp.avatar} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{emp.name}</div>
                    <div className="text-[11px] text-muted truncate">{emp.department} • {l.type} • {l.days}d • {l.startDate}</div>
                  </div>
                  <Link to="/guard" className="text-[11px] h-fit px-2 py-1 rounded-md border border-line bg-paper font-medium whitespace-nowrap">Guard</Link>
                </div>
              )
            }) : <div className="text-[12px] text-muted border border-dashed border-line rounded-lg px-3 py-8 text-center">No pending requests</div>}
          </div>
          <div className="px-3 pb-3">
            <Link to="/leave" className="block text-center text-[12px] font-medium border border-line rounded-lg py-2 hover:bg-paper">Review all requests</Link>
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-xl">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">Recent activity</h3>
          <span className="text-[11px] text-muted">Live from PostgreSQL</span>
        </div>
        <div className="px-5 py-4 grid md:grid-cols-3 gap-3">
          {[
            { t: 'Attendance updated', d: `${m.present} present today, ${m.absent} absent` },
            { t: 'Leave approved', d: '2 requests approved yesterday' },
            { t: 'Dayflow AI', d: '3 insights generated today' },
          ].map(card => (
            <div key={card.t} className="border border-line rounded-lg px-3 py-3 flex gap-3">
              <div className="w-7 h-7 rounded-md bg-paper border border-line grid place-items-center shrink-0"><MoreHorizontal className="w-3.5 h-3.5 text-muted" /></div>
              <div><div className="text-[12px] font-medium">{card.t}</div><div className="text-[11px] text-muted">{card.d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeatmapMini() {
  const { employees, attendance } = useAuth()
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toISOString().slice(0, 10) })
  const depts = ['Engineering', 'Design', 'Marketing', 'Sales', 'Human Resources', 'Finance'] as const
  return (
    <div className="mt-3 overflow-auto">
      <div className="min-w-[520px]">
        <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-1.5 text-[11px]">
          <div></div>
          {days.map(d => <div key={d} className="text-center text-muted py-1">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}<br /><span className="text-[10px]">{d.slice(5)}</span></div>)}
          {depts.map(dept => (
            <div key={dept} className="contents">
              <div className="py-2 text-[12px] font-medium truncate pr-2">{dept}</div>
              {days.map(day => {
                const emps = employees.filter(e => e.department === dept)
                const att = attendance.filter(a => a.date === day && emps.some(e => e.id === a.employeeId))
                const present = att.filter(a => ['Present', 'Late', 'Half-day'].includes(a.status)).length
                const rate = emps.length ? present / emps.length : 1
                const bg = rate > 0.85 ? 'bg-[#1a6b4a] text-white' : rate > 0.7 ? 'bg-[#d6e8db] text-ink border border-[#c2d9c7]' : rate > 0.5 ? 'bg-[#f0d6c8] text-ink border border-[#e7c2ad]' : 'bg-[#f9dede] text-[#7a2a2a] border border-[#f0c2c2]'
                return <div key={day + dept} className={`h-8 rounded-md grid place-items-center text-[11px] font-medium ${bg}`}>{Math.round(rate * 100)}%</div>
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EmployeeDashboard() {
  const { user, employees, attendance, leaves } = useAuth()
  const me = employees.find(e => e.email === user?.email) || employees[1]
  const today = new Date().toISOString().slice(0, 10)
  const myAtt = attendance.find(a => a.employeeId === me.id && a.date === today)
  const myLeaves = leaves.filter(l => l.employeeId === me.id)
  const pending = myLeaves.filter(l => l.status === 'Pending').length
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Dashboard</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Good morning, {me.name.split(' ')[0]}.</h1>
        <p className="text-[13px] text-muted mt-1">Here&apos;s your day at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-line rounded-xl px-4 py-4"><div className="text-[11px] tracking-[0.06em] font-medium text-muted uppercase">Today&apos;s status</div><div className="mt-2 inline-flex px-2 py-1 rounded-md text-[11px] font-medium bg-accent-soft text-accent border border-[#d6e8db]">{myAtt?.status || 'Present'}</div><div className="text-[11px] text-muted mt-2">{myAtt?.checkIn ? `Checked in ${myAtt.checkIn}` : 'Not checked in'}</div></div>
        <div className="bg-white border border-line rounded-xl px-4 py-4"><div className="text-[11px] tracking-[0.06em] font-medium text-muted uppercase">Leave balance</div><div className="mt-2 text-[22px] font-semibold leading-none">12 days</div><div className="text-[11px] text-muted mt-1">{pending} pending</div></div>
        <div className="bg-white border border-line rounded-xl px-4 py-4"><div className="text-[11px] tracking-[0.06em] font-medium text-muted uppercase">Salary</div><div className="mt-2 text-[22px] font-semibold leading-none">₹{(me.salary).toLocaleString('en-IN')}</div><div className="text-[11px] text-muted mt-1">This month</div></div>
        <div className="bg-ink text-white rounded-xl px-4 py-4"><div className="text-[11px] tracking-[0.06em] font-medium text-white/60 uppercase">Check-in</div><div className="mt-2 text-[13px] font-medium">09:02 AM • On time</div><div className="text-[11px] text-white/60 mt-1">Check out at 6:05 PM</div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-line rounded-xl">
          <div className="px-5 py-4 border-b border-line"><h3 className="text-[13px] font-semibold">My Day</h3></div>
          <div className="px-5 py-4">
            <div className="relative border-l border-line ml-2 pl-6 space-y-5">
              {[
                { t: '09:02 AM', d: 'Checked in', s: 'Office • On time' },
                { t: '12:45 PM', d: 'Break', s: '30 minutes' },
                { t: '01:30 PM', d: 'Returned', s: 'Back at desk' },
                { t: '06:05 PM', d: 'Checked out', s: '8h 3m total' },
              ].map(item => (
                <div key={item.t} className="relative">
                  <span className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-ink border-2 border-white shadow-sm" />
                  <div className="text-[11px] font-medium text-muted">{item.t}</div>
                  <div className="text-[13px] font-medium">{item.d}</div>
                  <div className="text-[11px] text-muted">{item.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white border border-line rounded-xl">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between"><h3 className="text-[13px] font-semibold">My leave requests</h3><Link to="/leave" className="text-[12px] font-medium text-muted hover:text-ink">View all</Link></div>
          <div className="p-3 space-y-2">
            {myLeaves.slice(0, 3).map(l => (
              <div key={l.id} className="border border-line rounded-lg px-3 py-3 flex items-center justify-between">
                <div><div className="text-[12px] font-medium">{l.type} • {l.days} days</div><div className="text-[11px] text-muted">{l.startDate} → {l.endDate}</div></div>
                <span className={`text-[11px] px-2 py-1 rounded-md font-medium border ${l.status === 'Pending' ? 'bg-[#fef7e7] border-[#f2e0a6] text-[#8a6d00]' : l.status === 'Approved' ? 'bg-accent-soft border-[#d6e8db] text-accent' : 'bg-[#fdf2f2] border-[#f0d6d6] text-[#8b3a3a]'}`}>{l.status}</span>
              </div>
            ))}
            {myLeaves.length === 0 && <div className="text-[12px] text-muted text-center py-6 border border-dashed border-line rounded-lg">No requests yet</div>}
          </div>
          <div className="px-3 pb-3"><Link to="/leave" className="block text-center text-[12px] font-medium border border-line rounded-lg py-2 hover:bg-paper">Apply for leave</Link></div>
        </div>
      </div>
    </div>
  )
}
