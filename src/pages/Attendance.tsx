import { useAuth } from '../lib/store'
import { useState } from 'react'

export default function Attendance(){
  const { employees, attendance, checkIn, checkOut, user } = useAuth()
  const isAdmin=user?.role==='admin'||user?.role==='hr'
  const today=indiaDate()
  const [tab,setTab]=useState<'today'|'week'|'month'>('today')
  const [search,setSearch]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const myEmp = employees.find(e=>e.email===user?.email)
  const list = (isAdmin ? employees : (myEmp?[myEmp]:[])).filter(employee=>!search||[employee.name,employee.id,employee.department].some(value=>value.toLowerCase().includes(search.toLowerCase())))
  const todayRecord=attendance.find(a=>a.employeeId===myEmp?.id && a.date===today)
  const checkedIn=!!todayRecord?.checkIn&&!todayRecord?.checkOut

  async function runAttendance(action:'in'|'out'){
    if(!myEmp)return
    setBusy(true);setError('')
    const result=await (action==='in'?checkIn(myEmp.id):checkOut(myEmp.id))
    if(!result.ok)setError(result.error||'Attendance action failed')
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Attendance</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Attendance</h1>
          <p className="text-[13px] text-muted mt-1">Daily and weekly views • Check-in / Check-out</p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-lg border border-line bg-paper">
          <button onClick={()=>setTab('today')} className={`px-3 py-1.5 rounded-md text-[12px] font-medium ${tab==='today'?'bg-ink text-white':'text-muted hover:text-ink'}`}>Today</button>
          <button onClick={()=>setTab('week')} className={`px-3 py-1.5 rounded-md text-[12px] font-medium ${tab==='week'?'bg-ink text-white':'text-muted hover:text-ink'}`}>Week</button>
          <button onClick={()=>setTab('month')} className={`px-3 py-1.5 rounded-md text-[12px] font-medium ${tab==='month'?'bg-ink text-white':'text-muted hover:text-ink'}`}>Month</button>
        </div>
      </div>

      {isAdmin&&<div className="bg-white border border-line rounded-xl p-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee, ID, or department…" className="w-full px-3 py-2 border border-line rounded-lg bg-paper text-[12px]"/></div>}

      {!isAdmin && (
        <div className="bg-white border border-line rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium">Today • {today}</div>
            <div className="text-[11px] text-muted">{checkedIn? 'You are checked in':'You are not checked in yet'}</div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy||checkedIn||!!todayRecord?.checkOut} onClick={()=>runAttendance('in')} className="px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-medium disabled:opacity-40 hover:bg-[#155a3d]">{busy?'Please wait…':'Check In'}</button>
            <button disabled={busy||!checkedIn} onClick={()=>runAttendance('out')} className="px-4 py-2 rounded-lg border border-line bg-white text-[13px] font-medium disabled:opacity-40">Check Out</button>
          </div>
          {error&&<div className="basis-full text-[11px] text-[#991b1b] bg-[#fdf2f2] border border-[#f0d6d6] rounded-lg px-3 py-2">{error}</div>}
        </div>
      )}

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-[13px] min-w-[680px]">
            <thead className="bg-paper text-[11px] tracking-[0.06em] font-medium text-muted uppercase border-b border-line">
              <tr><th className="text-left px-4 py-3 font-medium">Employee</th><th className="text-left px-4 py-3 font-medium">Date</th><th className="text-left px-4 py-3 font-medium">Check in</th><th className="text-left px-4 py-3 font-medium">Check out</th><th className="text-left px-4 py-3 font-medium">Work</th><th className="text-left px-4 py-3 font-medium">Extra</th><th className="text-left px-4 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tab==='today'
                ? list.map(emp=>{
                    const a=attendance.find(x=>x.employeeId===emp.id && x.date===today)
                    return (
                      <tr key={emp.id} className="hover:bg-paper/50">
                        <td className="px-4 py-2.5 flex items-center gap-2.5"><img src={emp.avatar} className="w-7 h-7 rounded-full"/><span className="font-medium text-[13px]">{emp.name}</span></td>
                        <td className="px-4 py-2.5 text-muted">{today}</td>
                        <td className="px-4 py-2.5 tabular-nums">{a?.checkIn||'—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{a?.checkOut||'—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{a?.hours!=null?`${a.hours.toFixed(1)}h`:'—'}</td>
                        <td className="px-4 py-2.5 tabular-nums">{a?.extraHours!=null?`${a.extraHours.toFixed(1)}h`:'—'}</td>
                        <td className="px-4 py-2.5"><span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${a?.status==='Present'?'bg-accent-soft border-[#d6e8db] text-accent': a?.status==='Absent'?'bg-[#fdf2f2] border-[#f0d6d6] text-[#991b1b]': a?.status==='Leave'?'bg-[#eff6ff] border-[#dbeafe] text-[#1d4ed8]':'bg-white border-line'}`}>{a?.status||'—'}</span></td>
                      </tr>
                    )
                  })
                : (tab==='week'?Array.from({length:7},(_,i)=>indiaDate(-6+i)):Array.from({length:31},(_,i)=>indiaDate(-30+i))).flatMap(day=> list.map(emp=>{
                    const a=attendance.find(x=>x.employeeId===emp.id && x.date===day)
                    return (
                      <tr key={emp.id+day} className="hover:bg-paper/50">
                        <td className="px-4 py-2.5 flex items-center gap-2"><img src={emp.avatar} className="w-6 h-6 rounded-full"/><span className="font-medium text-[12px]">{emp.name}</span></td>
                        <td className="px-4 py-2.5 text-[12px] text-muted">{day}</td>
                        <td className="px-4 py-2.5 text-[12px] tabular-nums">{a?.checkIn||'—'}</td>
                        <td className="px-4 py-2.5 text-[12px] tabular-nums">{a?.checkOut||'—'}</td>
                        <td className="px-4 py-2.5 text-[12px] tabular-nums">{a?.hours!=null?`${a.hours.toFixed(1)}h`:'—'}</td>
                        <td className="px-4 py-2.5 text-[12px] tabular-nums">{a?.extraHours!=null?`${a.extraHours.toFixed(1)}h`:'—'}</td>
                        <td className="px-4 py-2.5"><span className="px-2 py-1 rounded-md text-[11px] font-medium border border-line bg-white">{a?.status||'—'}</span></td>
                      </tr>
                    )
                  }))
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {k:'Present', c:'bg-accent'},
          {k:'Absent', c:'bg-[#b42318]'},
          {k:'Half-day', c:'bg-[#b54708]'},
          {k:'Leave', c:'bg-[#1d4ed8]'},
        ].map(s=>(
          <div key={s.k} className="bg-white border border-line rounded-lg px-3 py-3 flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${s.c}`}/>
            <span className="text-[12px] font-medium">{s.k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function indiaDate(offset=0){
  const date=new Date()
  date.setDate(date.getDate()+offset)
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
}
