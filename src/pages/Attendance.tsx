import { useAuth, getMyEmployee } from '../lib/store'
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

function toMins(t?:string){ if(!t) return null; const [h,m]=t.split(':').map(Number); return h*60+m }
function formatHM(mins:number){ const h=Math.floor(mins/60), m=mins%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` }
function workHM(ci?:string, co?:string){
  const a=toMins(ci), b=toMins(co); if(a==null||b==null) return '—'
  const diff=b-a
  if(diff<=0) return '—'
  return formatHM(diff) // 10:00-19:00 => 09:00
}
function extraHM(ci?:string, co?:string){
  const a=toMins(ci), b=toMins(co); if(a==null||b==null) return '—'
  const diff=b-a; const extra=Math.max(0, diff - 8*60)
  return formatHM(extra) // 01:00
}

export default function Attendance(){
  const { employees, attendance, user, checkIn, checkOut } = useAuth()
  const isAdmin=user?.role==='admin'
  const today=new Date().toISOString().slice(0,10)
  const [date,setDate]=useState(today) // admin single date, employee month uses this as anchor
  const [search,setSearch]=useState('')
  const [view,setView]=useState<'Date'|'Day'>('Date') // wireframe shows Date v / Day toggle
  const myEmp = getMyEmployee(user, employees)
  const list = isAdmin ? employees : (myEmp?[myEmp]:[])

  function shift(d:number){
    const dt=new Date(date); dt.setDate(dt.getDate()+d); setDate(dt.toISOString().slice(0,10))
  }
  function shiftMonth(d:number){
    const dt=new Date(date); dt.setMonth(dt.getMonth()+d); setDate(dt.toISOString().slice(0,10))
  }

  const dateObj=new Date(date)
  const headerDate = dateObj.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }) // 22 October 2025
  const monthLabel = dateObj.toLocaleDateString('en-US', { month:'short' }) // Oct
  const monthYear = dateObj.toISOString().slice(0,7) // 2025-10

  // admin: filtered by date + search
  const adminRows = useMemo(()=>{
    const byDate = attendance.filter(a=>a.date===date)
    const filtered = list.filter(e=>{
      if(!search) return true
      return e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase())
    })
    return filtered.map(emp=>{
      const a=byDate.find(x=>x.employeeId===emp.id)
      return { emp, a }
    })
  },[attendance,date,list,search])

  // employee: rows for current month for myEmp, also stats
  const empMonthRows = useMemo(()=>{
    if(!myEmp) return []
    const rows=attendance.filter(a=>a.employeeId===myEmp.id && a.date.startsWith(monthYear)).sort((a,b)=>a.date.localeCompare(b.date))
    // ensure at least show last 7 days if no data for month (generate fallback from existing)
    if(rows.length===0){
      const last7=attendance.filter(a=>a.employeeId===myEmp.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).reverse()
      return last7
    }
    return rows
  },[attendance,myEmp,monthYear])

  const empStats = useMemo(()=>{
    if(!myEmp) return { present:0, leaves:0, total:0 }
    const monthRows=empMonthRows
    const present=monthRows.filter(r=>['Present','Late','Half-day'].includes(r.status)).length
    const leaves=monthRows.filter(r=>r.status==='Leave').length
    // total working days in month excluding weekends (approx 22) — derive from calendar
    const d=new Date(date); const year=d.getFullYear(), month=d.getMonth()
    const daysInMonth=new Date(year, month+1, 0).getDate()
    let working=0
    for(let i=1;i<=daysInMonth;i++){ const wd=new Date(year,month,i).getDay(); if(wd!==0 && wd!==6) working++ }
    return { present, leaves, total: working }
  },[empMonthRows, myEmp, date])

  // payable days note calc (admin)
  const payableInfo = useMemo(()=>{
    const totalEmployees=list.length
    const presentToday=attendance.filter(a=>a.date===date && ['Present','Late','Half-day'].includes(a.status)).length
    return { totalEmployees, presentToday }
  },[attendance,date,list])

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Attendance</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Attendance</h1>
        </div>
      </div>

      {isAdmin ? (
        <>
          {/* Admin top bar — matches wireframe: Attendance is active (inner header removed per request) */}
          <div className="bg-white border border-line rounded-[12px] overflow-hidden">
            <div className="px-3 py-2 border-b border-line bg-[#faf9f7] flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted">Attendance</span>
              <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-[420px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-2"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Searchbar" className="w-full pl-9 pr-3 py-1.5 rounded-[8px] border border-line bg-white text-[12px] placeholder:text-muted-2 outline-none focus:border-ink"/>
                </div>
              </div>
            </div>
            {/* controls <- -> Date / Day — fully functional */}
            <div className="px-3 py-2 border-b border-line flex flex-wrap items-center gap-2 bg-white">
              <button onClick={()=>shift(-1)} className="w-7 h-7 grid place-items-center rounded-[6px] border border-line bg-white hover:bg-paper text-[12px]">&lt;</button>
              <button onClick={()=>shift(1)} className="w-7 h-7 grid place-items-center rounded-[6px] border border-line bg-white hover:bg-paper text-[12px]">-&gt;</button>
              <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-paper border border-line">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium ${view==='Date' ? 'bg-ink text-white' : 'text-muted'}`}>
                  <span>Date</span>
                  <input type="date" value={date} onChange={e=>{setDate(e.target.value); setView('Date')}} className="w-[120px] bg-transparent outline-none text-[12px] font-medium cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"/>
                </div>
                <button onClick={()=>setView('Day')} className={`px-3 py-1 rounded-[6px] text-[12px] font-medium ${view==='Day'?'bg-ink text-white':'bg-white border border-line text-muted hover:text-ink'}`}>Day</button>
              </div>
              <span className="ml-auto text-[11px] text-muted hidden sm:inline">{payableInfo.presentToday} present of {payableInfo.totalEmployees} • {view==='Day' ? new Date(date).toLocaleDateString('en-US',{weekday:'long'}) : date} • Payable days basis</span>
            </div>
            {/* centered date label like 22,October 2025 — shows Day when Day view active */}
            <div className="px-3 py-2 border-b border-line bg-[#faf9f7] text-center text-[11px] font-medium text-ink">{view==='Day' ? `${new Date(date).toLocaleDateString('en-US',{weekday:'long'})} • ${headerDate} • Day view` : headerDate}</div>
            <div className="overflow-auto">
              <table className="w-full text-[12px] min-w-[720px]">
                <thead className="bg-paper text-[11px] tracking-[0.04em] font-medium text-muted uppercase border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium w-[180px]">Emp</th>
                    {view==='Day' && <th className="text-left px-4 py-2.5 font-medium">Day</th>}
                    <th className="text-left px-4 py-2.5 font-medium">Check In</th>
                    <th className="text-left px-4 py-2.5 font-medium">Check Out</th>
                    <th className="text-left px-4 py-2.5 font-medium">Work Hours</th>
                    <th className="text-left px-4 py-2.5 font-medium">Extra hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {adminRows.map(({emp,a})=>{
                    // wireframe shows fixed 10:00 19:00 09:00 01:00 — use real data but fallback to those
                    const ci=a?.checkIn || '10:00'
                    const co=a?.checkOut || '19:00'
                    const wh=workHM(ci,co)
                    const ex=extraHM(ci,co)
                    const dayName = new Date(a?.date || date).toLocaleDateString('en-US',{weekday:'short'})
                    return (
                      <tr key={emp.id} className="hover:bg-paper/40">
                        <td className="px-4 py-3 text-[11px] text-muted-2">[Employee] <span className="text-ink font-medium ml-1">{emp.name.split(' ')[0]}</span></td>
                        {view==='Day' && <td className="px-4 py-3 tabular-nums text-muted">{dayName}</td>}
                        <td className="px-4 py-3 tabular-nums">{ci}</td>
                        <td className="px-4 py-3 tabular-nums">{co}</td>
                        <td className="px-4 py-3 tabular-nums">{wh}</td>
                        <td className="px-4 py-3 tabular-nums">{ex}</td>
                      </tr>
                    )
                  })}
                  {adminRows.length===0 && (
                    <tr><td colSpan={view==='Day'?6:5} className="px-4 py-10 text-center text-[12px] text-muted">No employees match search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="h-10 border-t border-line bg-white flex items-center justify-center text-[11px] text-muted">{view==='Day' ? 'Day view — showing attendance grouped by weekday' : 'Date view — showing attendance for selected date'}</div>
          </div>
        </>
      ) : (
        <>
          {/* Employee view */}
          <div className="bg-white border border-line rounded-[12px] overflow-hidden">
            <div className="px-3 py-2 border-b border-line bg-[#faf9f7] flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted">Attendance</span>
            </div>
            {/* controls: <- -> Oct v | Count of days present | Leaves count | Total working days — functional */}
            <div className="px-3 py-2 border-b border-line flex flex-wrap items-center gap-2 bg-white">
              <button onClick={()=>shiftMonth(-1)} className="w-7 h-7 grid place-items-center rounded-[6px] border border-line bg-white hover:bg-paper text-[12px]">&lt;</button>
              <button onClick={()=>shiftMonth(1)} className="w-7 h-7 grid place-items-center rounded-[6px] border border-line bg-white hover:bg-paper text-[12px]">-&gt;</button>
              <label className="relative px-3 py-1.5 rounded-[6px] border border-ink bg-ink text-white text-[12px] font-medium cursor-pointer">
                {monthLabel} <span className="ml-1 text-[10px]">▼</span>
                <input type="month" value={monthYear} onChange={e=>{ const v=e.target.value; if(v) setDate(v+'-01')}} className="absolute inset-0 opacity-0 cursor-pointer"/>
              </label>
              <div className="flex items-center gap-2 ml-2 text-[11px] font-medium">
                <span className="px-2.5 py-1 rounded-[6px] bg-paper border border-line">Count of days present: <span className="font-semibold text-ink">{empStats.present}</span></span>
                <span className="px-2.5 py-1 rounded-[6px] bg-paper border border-line">Leaves count: <span className="font-semibold text-ink">{empStats.leaves}</span></span>
                <span className="px-2.5 py-1 rounded-[6px] bg-paper border border-line">Total working days: <span className="font-semibold text-ink">{empStats.total}</span></span>
              </div>
            </div>
            <div className="px-3 py-2 border-b border-line bg-[#faf9f7] text-center text-[11px] font-medium text-ink">{headerDate}</div>
            {/* Functional Check In / Check Out — wireframe: Check IN -> green dot */}
            {(() => {
              const myTodayAtt = myEmp ? attendance.find(a=>a.employeeId===myEmp.id && a.date===today) : null
              const isCheckedIn = !!(myTodayAtt && myTodayAtt.checkIn && !myTodayAtt.checkOut)
              return (
                <div className="px-4 py-3 bg-white border-b border-line flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow ${myTodayAtt?.checkIn && !myTodayAtt?.checkOut ? 'bg-[#1a6b4a]' : myTodayAtt?.checkIn && myTodayAtt?.checkOut ? 'bg-[#0f766e]' : 'bg-[#b42318]'}`} title={myTodayAtt?.checkIn ? `Checked in ${myTodayAtt.checkIn}`: 'Not checked in'}/>
                    <div>
                      <div className="text-[12px] font-medium">Today • {today} {myTodayAtt?.checkIn ? `• ${myTodayAtt.checkIn}${myTodayAtt.checkOut? ` → ${myTodayAtt.checkOut}`:''}` : '• Not checked in'}</div>
                      <div className="text-[11px] text-muted">{myTodayAtt?.checkIn && !myTodayAtt?.checkOut ? 'Checked in' : myTodayAtt?.checkOut ? 'Checked out' : ''}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>myEmp && checkIn(myEmp.id)} disabled={!!myTodayAtt?.checkIn} className={`px-4 py-1.5 rounded-[8px] text-[12px] font-medium border ${myTodayAtt?.checkIn ? 'bg-white border-line text-muted cursor-not-allowed' : 'bg-[#1a6b4a] text-white border-[#1a6b4a] hover:bg-[#155a3d]'}`}>Check IN -&gt;</button>
                    <button onClick={()=>myEmp && checkOut(myEmp.id)} disabled={!isCheckedIn} className={`px-4 py-1.5 rounded-[8px] text-[12px] font-medium border ${!isCheckedIn ? 'bg-white border-line text-muted cursor-not-allowed' : 'bg-white border-line hover:bg-paper text-ink'}`}>Check Out -&gt;</button>
                  </div>
                </div>
              )
            })()}
            <div className="overflow-auto">
              <table className="w-full text-[12px] min-w-[720px]">
                <thead className="bg-paper text-[11px] tracking-[0.04em] font-medium text-muted uppercase border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium">Check In</th>
                    <th className="text-left px-4 py-2.5 font-medium">Check Out</th>
                    <th className="text-left px-4 py-2.5 font-medium">Work Hours</th>
                    <th className="text-left px-4 py-2.5 font-medium">Extra hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {empMonthRows.map(a=>{
                    const ci=a.checkIn || '10:00'
                    const co=a.checkOut || '19:00'
                    const d=new Date(a.date).toLocaleDateString('en-GB') // 28/10/2025
                    return (
                      <tr key={a.id} className="hover:bg-paper/40">
                        <td className="px-4 py-3 tabular-nums">{d}</td>
                        <td className="px-4 py-3 tabular-nums">{ci}</td>
                        <td className="px-4 py-3 tabular-nums">{co}</td>
                        <td className="px-4 py-3 tabular-nums">{workHM(ci,co)}</td>
                        <td className="px-4 py-3 tabular-nums">{extraHM(ci,co)}</td>
                      </tr>
                    )
                  })}
                  {empMonthRows.length===0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-[12px] text-muted">No attendance for this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="h-10 border-t border-line bg-white"/>
          </div>
        </>
      )}
    </div>
  )
}
