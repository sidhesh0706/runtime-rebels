import { useAuth, useMetrics, departmentStats, getMyEmployee } from '../lib/store'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, MoreHorizontal, User, CalendarCheck, CalendarDays, LogOut } from 'lucide-react'
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
                  <Area type="monotone" dataKey="value" stroke="#1a6b4a" strokeWidth={2.25} fill="#edf4ef" fillOpacity={1} dot={{r:3,fill:'#fff',stroke:'#1a6b4a',strokeWidth:2}} activeDot={{r:5}} />
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
          <span className="text-[11px] text-muted">Live from browser-local data</span>
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
  const me = getMyEmployee(user, employees) || employees[0]
  const today = new Date().toISOString().slice(0, 10)
  const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const myAtt = attendance.find(a => a.employeeId === me.id && a.date === today)
  const myLeaves = leaves.filter(l => l.employeeId === me.id)
  const pending = myLeaves.filter(l => l.status === 'Pending').length
  const approved = myLeaves.filter(l => l.status === 'Approved').length
  const usedDays = myLeaves.filter(l => l.status === 'Approved').reduce((a,b)=>a+b.days,0)
  // Weekly attendance Mon-Fri
  const weekDays = Array.from({length:5},(_,i)=>{
    const d=new Date(); const day=d.getDay(); const diff=i - (day===0?6:day-1); // Monday as 0
    d.setDate(d.getDate()+diff); return d
  })
  const weekStatus = weekDays.map(d=>{
    const ds=d.toISOString().slice(0,10)
    const a=attendance.find(x=>x.employeeId===me.id && x.date===ds)
    const s=a?.status || (ds===today ? (myAtt?.status || '—') : '—')
    const label=d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,3)
    return { label, short: label.slice(0,1), status: s, date: ds }
  })
  const workedMins = (()=>{ if(!myAtt?.checkIn || !myAtt?.checkOut) return null; const [h1,m1]=myAtt.checkIn.split(':').map(Number); const [h2,m2]=myAtt.checkOut.split(':').map(Number); const mins=(h2*60+m2)-(h1*60+m1); return mins>0? mins:null })()
  const workedLabel = workedMins ? `${Math.floor(workedMins/60)}h ${String(workedMins%60).padStart(2,'0')}m` : '—'
  const isCheckedIn = !!(myAtt?.checkIn && !myAtt?.checkOut)
  const isPresent = myAtt && ['Present','Late','Half-day'].includes(myAtt.status)

  return (
    <div className="max-w-[860px] space-y-7">
      {/* Header — calm, human */}
      <div>
        <div className="text-[11px] tracking-[0.08em] font-medium text-muted uppercase">Dashboard</div>
        <h1 className="mt-2 text-[22px] font-[550] tracking-[-0.02em] text-ink leading-none">Good morning, {me.name.split(' ')[0]}.</h1>
        <p className="mt-1.5 text-[13px] text-muted">{todayDisplay}</p>
      </div>

      <div className="h-px bg-line" />

      {/* TODAY — attendance primary, leave secondary */}
      <div>
        <div className="text-[10px] tracking-[0.12em] font-medium text-muted uppercase">Today</div>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1.35fr_0.75fr] gap-4">
          {/* Attendance — primary, elegant */}
          <div className="bg-white border border-line rounded-[12px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] tracking-[0.08em] font-medium text-muted uppercase">Attendance</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-[#1a6b4a]' : myAtt?.status==='Leave' ? 'bg-[#2563eb]' : 'bg-[#b42318]'}`} />
                  <span className={`text-[13px] font-medium ${isPresent ? 'text-[#1a6b4a]' : 'text-ink'}`}>{myAtt?.status || 'Not checked in'}</span>
                  {myAtt?.checkIn && <span className="text-[11px] text-muted">• {myAtt.checkIn} {myAtt.checkOut ? `→ ${myAtt.checkOut}` : ''}</span>}
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase">Worked</div>
                <div className="text-[13px] font-semibold tabular-nums">{workedLabel}</div>
              </div>
            </div>

            {/* Times — prominent but calm */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="bg-paper border border-line rounded-[10px] px-3 py-3">
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase">Check-in</div>
                <div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">{myAtt?.checkIn || '—:—'}</div>
                <div className="text-[11px] text-muted mt-1">{myAtt?.checkIn ? 'AM' : 'Not yet'}</div>
              </div>
              <div className="bg-paper border border-line rounded-[10px] px-3 py-3">
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase">Check-out</div>
                <div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">{myAtt?.checkOut || '—:—'}</div>
                <div className="text-[11px] text-muted mt-1">{myAtt?.checkOut ? 'PM' : 'Pending'}</div>
              </div>
              <div className="bg-white border border-line rounded-[10px] px-3 py-3 sm:hidden">
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase">Worked</div>
                <div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">{workedLabel}</div>
              </div>
              <div className="hidden sm:flex bg-white border border-line rounded-[10px] px-3 py-3 flex-col justify-center">
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase">Worked</div>
                <div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">{workedLabel}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {!myAtt?.checkIn ? (
                <Link to="/attendance" className="inline-flex items-center justify-center px-4 py-2 rounded-[10px] bg-ink text-white text-[12px] font-medium hover:bg-black transition">Check in</Link>
              ) : !myAtt?.checkOut ? (
                <Link to="/attendance" className="inline-flex items-center justify-center px-4 py-2 rounded-[10px] bg-white border border-line text-[12px] font-medium hover:bg-paper">Check out</Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted"><span className="w-1 h-1 rounded-full bg-[#1a6b4a]"/> Day complete</span>
              )}
              <Link to="/attendance" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-ink">View attendance <ArrowUpRight className="w-3 h-3"/></Link>
            </div>
          </div>

          {/* Leave — compact */}
          <div className="bg-white border border-line rounded-[12px] p-5 flex flex-col">
            <div className="text-[10px] tracking-[0.08em] font-medium text-muted uppercase">Leave</div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="bg-paper border border-line rounded-[10px] py-3">
                <div className="text-[17px] font-semibold leading-none tabular-nums">{pending}</div>
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase mt-1">Pending</div>
                <div className="mt-1 w-1 h-1 rounded-full bg-[#b54708] mx-auto opacity-60" />
              </div>
              <div className="bg-paper border border-line rounded-[10px] py-3">
                <div className="text-[17px] font-semibold leading-none tabular-nums">{approved}</div>
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase mt-1">Approved</div>
                <div className="mt-1 w-1 h-1 rounded-full bg-[#1a6b4a] mx-auto opacity-60" />
              </div>
              <div className="bg-white border border-line rounded-[10px] py-3">
                <div className="text-[17px] font-semibold leading-none tabular-nums">{usedDays}<span className="text-[11px] font-normal text-muted">d</span></div>
                <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase mt-1">Used</div>
                <div className="mt-1 text-[11px] text-muted leading-none">{myLeaves.length} requests</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px]">
              <Link to="/time-off" className="font-medium text-ink underline underline-offset-4 decoration-line">Request leave</Link>
              <span className="text-muted">•</span>
              <Link to="/time-off" className="text-muted hover:text-ink">View requests</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-line" />

      {/* MY DAY — timeline */}
      <div>
        <div className="text-[10px] tracking-[0.12em] font-medium text-muted uppercase">My Day</div>
        <div className="mt-3 bg-white border border-line rounded-[12px] px-5 py-5">
          <div className="relative ml-2">
            <div className="absolute left-[4px] top-1 bottom-1 w-px bg-line" />
            <div className="space-y-4">
              {[
                { time: myAtt?.checkIn ? `${myAtt.checkIn} AM` : '09:00', title: myAtt?.checkIn ? 'Checked in' : 'Workday started', note: myAtt?.checkIn ? 'Present • On time' : 'Expected start', active: !!myAtt?.checkIn },
                { time: '12:45', title: 'Midday', note: 'Break • 30m', active: !!myAtt?.checkIn },
                { time: myAtt?.checkOut ? `${myAtt.checkOut} PM` : '18:30', title: myAtt?.checkOut ? 'Checked out' : 'Expected check-out', note: myAtt?.checkOut ? `${workedLabel} total` : '8h 00m target', active: !!myAtt?.checkOut },
              ].map(row=>(
                <div key={row.time} className="relative flex gap-3 pl-6">
                  <span className={`absolute left-0 top-1 w-[9px] h-[9px] rounded-full border-2 border-white shadow-sm ${row.active ? 'bg-ink' : 'bg-white border-line'}`} />
                  <div className="w-16 text-[11px] font-medium text-muted tabular-nums shrink-0">{row.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium leading-none">{row.title}</div>
                    <div className="text-[11px] text-muted mt-1">{row.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-line" />

      {/* Weekly attendance — minimal */}
      <div>
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] tracking-[0.12em] font-medium text-muted uppercase">Attendance this week</div>
          <Link to="/attendance" className="text-[11px] font-medium text-muted hover:text-ink">View attendance <ArrowUpRight className="w-3 h-3 inline"/></Link>
        </div>
        <div className="mt-3 bg-white border border-line rounded-[12px] px-4 py-4">
          <div className="grid grid-cols-5 gap-2">
            {weekStatus.map(d=>{
              const dot = d.status==='Present' ? 'bg-[#1a6b4a]' : d.status==='Late' ? 'bg-[#b54708]' : d.status==='Leave' ? 'bg-[#2563eb]' : d.status==='Half-day' ? 'bg-[#c0900a]' : 'bg-line'
              const isToday = d.date===today
              return (
                <div key={d.date} className={`text-center py-2 rounded-[10px] border ${isToday ? 'bg-paper border-line' : 'bg-white border-transparent'}`}>
                  <div className="text-[10px] tracking-[0.06em] font-medium text-muted uppercase">{d.label}</div>
                  <div className={`mx-auto mt-1.5 w-2 h-2 rounded-full ${dot} ${isToday ? 'ring-2 ring-[#1a6b4a]/15' : ''}`} />
                  <div className="mt-1 text-[11px] font-medium text-ink">{d.status==='—' ? '—' : d.status.slice(0,1)}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-muted">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1a6b4a]"/>Present</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#b54708]"/>Late</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]"/>Leave</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-line" />

      {/* Leave & requests + Quick actions */}
      <div className="grid lg:grid-cols-[1.25fr_0.7fr] gap-4">
        <div className="bg-white border border-line rounded-[12px]">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <h3 className="text-[12px] font-semibold">Recent requests</h3>
            <Link to="/time-off" className="text-[11px] font-medium text-muted hover:text-ink">View all</Link>
          </div>
          <div className="divide-y divide-line">
            {myLeaves.slice(0,4).map(l=>(
              <div key={l.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium truncate">{l.type} • {l.days}d</div>
                  <div className="text-[11px] text-muted">{l.startDate} → {l.endDate}</div>
                </div>
                <span className={`shrink-0 text-[11px] px-2 py-1 rounded-[8px] font-medium border ${l.status==='Pending'?'bg-[#fef7e7] border-[#f2e0a6] text-[#8a6d00]': l.status==='Approved'?'bg-[#edf4ef] border-[#d6e8db] text-[#1a6b4a]':'bg-[#fdf2f2] border-[#f0d6d6] text-[#7a2a2a]'}`}>{l.status}</span>
              </div>
            ))}
            {myLeaves.length===0 && <div className="text-[12px] text-muted text-center py-8">No requests yet</div>}
          </div>
        </div>

        <div className="space-y-4">
          {/* Compact profile — not a giant card */}
          <div className="bg-white border border-line rounded-[12px] p-4">
            <div className="flex gap-3">
              <img src={me.avatar} alt={me.name} className="w-10 h-10 rounded-full object-cover border border-line shrink-0"/>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-none truncate">{me.name}</div>
                <div className="text-[11px] text-muted truncate">{me.role} • {me.department}</div>
                <div className="text-[11px] font-mono text-muted-2 truncate">{me.id} • {me.loginId}</div>
              </div>
            </div>
            <Link to={`/employees/${me.id}`} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-ink hover:underline underline-offset-4">View profile <ArrowUpRight className="w-3 h-3"/></Link>
          </div>

          <div className="bg-paper border border-line rounded-[12px] p-4">
            <div className="text-[11px] font-medium text-ink">Quick actions</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link to={`/employees/${me.id}`} className="text-[11px] px-2.5 py-1.5 rounded-[8px] bg-white border border-line hover:bg-white font-medium">View profile</Link>
              <Link to="/attendance" className="text-[11px] px-2.5 py-1.5 rounded-[8px] bg-white border border-line hover:bg-white font-medium">View attendance</Link>
              <Link to="/time-off" className="text-[11px] px-2.5 py-1.5 rounded-[8px] bg-ink text-white border border-ink font-medium">Request leave</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
