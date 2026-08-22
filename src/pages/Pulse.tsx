import { useAuth, useMetrics, departmentStats } from '../lib/store'

export default function Pulse(){
  const { employees, attendance, leaves } = useAuth()
  const m=useMetrics()
  const depts=departmentStats(employees, attendance, leaves)
  const days = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10)})
  const deptList=['Engineering','Design','Marketing','Sales','Human Resources','Finance'] as const
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Insights</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Workforce Pulse</h1>
        <p className="text-[13px] text-muted mt-1">The health of your workforce today — and why.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-line rounded-xl">
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[11px] tracking-[0.06em] font-medium text-muted uppercase">Workforce availability</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-[28px] font-semibold leading-none tracking-tight">{m.pulse}%</div>
              <span className={`mb-1 px-2 py-1 rounded-md text-[11px] font-medium border ${m.pulseLabel==='Healthy'?'bg-accent-soft border-[#d6e8db] text-accent':'bg-[#fef7e7] border-[#f2e0a6] text-[#8a6d00]'}`}>{m.pulseLabel}</span>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                {k:'Attendance', v: m.availability+'%'},
                {k:'Availability', v: m.availability+'%'},
                {k:'Leave load', v: m.leaveRate+'%'},
                {k:'Absence', v: m.absenceRate+'%'},
              ].map(c=>(
                <div key={c.k} className="border border-line rounded-lg px-3 py-3 bg-paper"><div className="text-[11px] text-muted">{c.k}</div><div className="text-[15px] font-semibold mt-1">{c.v}</div></div>
              ))}
            </div>
            <div className="mt-4 text-[12px] leading-relaxed bg-paper border border-line rounded-lg px-3 py-3">
              <span className="font-medium">Insight → Explanation → Action:</span> Engineering availability: {depts.find(d=>d.dept==='Engineering')?.availability}% — 20 total, {depts.find(d=>d.dept==='Engineering')?.present} available, {depts.find(d=>d.dept==='Engineering')?.onLeave} on leave, {depts.find(d=>d.dept==='Engineering')?.absent} absent.
            </div>
          </div>
        </div>
        <div className="bg-white border border-line rounded-xl">
          <div className="px-5 py-4 border-b border-line"><h3 className="text-[13px] font-semibold">Department breakdown</h3></div>
          <div className="p-4 space-y-3">
            {depts.map(d=>(
              <div key={d.dept} className="border border-line rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between"><span className="text-[12px] font-medium">{d.dept}</span><span className="text-[12px] font-semibold tabular-nums">{d.availability}%</span></div>
                <div className="text-[11px] text-muted mt-1">{d.total} total • {d.present} present • {d.onLeave} on leave • {d.absent} absent</div>
                <div className="mt-2 h-1.5 bg-paper rounded-full overflow-hidden"><div className="h-full bg-ink" style={{width: `${d.availability}%`}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-xl">
        <div className="px-5 py-4 border-b border-line">
          <h3 className="text-[13px] font-semibold">Workforce heatmap</h3>
          <p className="text-[11px] text-muted">Availability by team × last 7 days • Real data from PostgreSQL</p>
        </div>
        <div className="p-4 overflow-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1.5 text-[11px]">
              <div/>
              {days.map(d=><div key={d} className="text-center text-muted bg-paper border border-line rounded-md py-2 font-medium">{new Date(d).toLocaleDateString('en-US',{weekday:'short'}).slice(0,2)}<br/><span className="text-[10px]">{d.slice(5)}</span></div>)}
              {deptList.map(dept=>(
                <div key={dept} className="contents">
                  <div className="py-2.5 text-[12px] font-medium pr-2">{dept}</div>
                  {days.map(day=>{
                    const emps=employees.filter(e=>e.department===dept)
                    const att=attendance.filter(a=>a.date===day && emps.some(e=>e.id===a.employeeId))
                    const present=att.filter(a=>['Present','Late','Half-day'].includes(a.status)).length
                    const rate= emps.length? present/emps.length:1
                    const cls= rate>0.85?'bg-accent text-white': rate>0.7?'bg-accent-soft text-ink border border-[#d6e8db]': rate>0.5?'bg-[#f0d6c8] text-ink border border-[#e7c2ad]':'bg-[#f9dede] text-[#7a2a2a] border border-[#f0c2c2]'
                    return <div key={day+dept} className={`h-9 rounded-md grid place-items-center text-[11px] font-medium ${cls}`}>{Math.round(rate*100)}%</div>
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
