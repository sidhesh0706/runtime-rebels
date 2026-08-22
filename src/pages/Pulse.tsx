import { useAuth, useMetrics, departmentStats } from '../lib/store'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function Pulse(){
  const { employees, attendance, leaves } = useAuth()
  const m=useMetrics()
  const depts=departmentStats(employees, attendance, leaves)
  const engineering=depts.find(d=>d.dept==='Engineering')
  const days = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10)})
  const trend=days.map(day=>{const rows=attendance.filter(row=>row.date===day);const present=rows.filter(row=>['Present','Late','Half-day'].includes(row.status)).length;return {day:new Date(`${day}T00:00:00`).toLocaleDateString('en-US',{weekday:'short'}),date:day,availability:employees.length?Math.round(present/employees.length*100):0}})
  const trendFloor=Math.max(0,Math.min(...trend.map(point=>point.availability))-8)
  const deptList=['Engineering','Design','Marketing','Sales','Human Resources','Finance'] as const
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Insights</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Workforce Pulse</h1>
        <p className="text-[13px] text-muted mt-1">The health of your workforce today — and why.</p>
      </div>

      <div className="bg-white border border-line rounded-xl p-5"><div className="flex items-start justify-between"><div><h3 className="text-[13px] font-semibold">Seven-day pulse trend</h3><p className="text-[11px] text-muted">Actual attendance movement from browser-local data — hover for daily values.</p></div><div className="text-[11px] text-muted">{trend[0]?.availability}% → <span className="font-semibold text-ink">{trend.at(-1)?.availability}%</span></div></div><div className="mt-4 h-[220px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a6b4a" stopOpacity={0.28}/><stop offset="100%" stopColor="#1a6b4a" stopOpacity={0.03}/></linearGradient></defs><CartesianGrid stroke="#f0ece6" vertical={false}/><XAxis dataKey="day" tick={{fontSize:11,fill:'#858b91'}} axisLine={false} tickLine={false}/><YAxis domain={[trendFloor,100]} tick={{fontSize:11,fill:'#858b91'}} axisLine={false} tickLine={false} width={34} unit="%"/><Tooltip formatter={(value)=>[`${value}%`,'Availability']} labelFormatter={(_,payload)=>payload?.[0]?.payload?.date||''} contentStyle={{borderRadius:10,border:'1px solid #e8e3dd',fontSize:12}}/><Area type="monotone" dataKey="availability" stroke="#1a6b4a" strokeWidth={2.5} fill="url(#pulseFill)" dot={{r:4,fill:'#fff',stroke:'#1a6b4a',strokeWidth:2}} activeDot={{r:6}}/></AreaChart></ResponsiveContainer></div></div>

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
              <span className="font-medium">Insight → Explanation → Action:</span> Engineering availability: {engineering?.availability}% — {engineering?.total} total, {engineering?.present} available, {engineering?.onLeave} on leave, {engineering?.absent} absent.
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
          <p className="text-[11px] text-muted">Availability by team × last 7 days • Local browser-local data data</p>
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

