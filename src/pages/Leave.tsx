import { useState, useMemo } from 'react'
import { useAuth } from '../lib/store'
import { Search, Plus, X, Calendar as CalIcon, Paperclip } from 'lucide-react'

function CalendarGrid({ leavesForMonth, month, year }:{ leavesForMonth: string[], month:number, year:number }){
  const first=new Date(year,month,1).getDay()
  const days=new Date(year,month+1,0).getDate()
  const cells=Array.from({length:first+days},(_,i)=> i<first? null : i-first+1)
  return (
    <div className="border border-line rounded-[10px] p-2 bg-white">
      <div className="text-[11px] font-semibold text-center">{new Date(year,month).toLocaleString('en-US',{month:'short'})}</div>
      <div className="grid grid-cols-7 gap-0.5 mt-1 text-[10px]">
        {['S','M','T','W','T','F','S'].map(d=> <div key={d} className="text-center text-muted font-medium py-0.5">{d}</div>)}
        {cells.map((d,i)=> {
          const isLeave = d && leavesForMonth.includes(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
          return <div key={i} className={`h-6 grid place-items-center rounded-md ${d? 'text-[11px]':''} ${isLeave?'bg-[#b42318] text-white font-medium': d? 'hover:bg-paper':''}`}>{d||''}{isLeave && <span className="sr-only">leave</span>}</div>
        })}
      </div>
    </div>
  )
}

export default function Leave(){
  const { employees, leaves, updateLeaves, user } = useAuth()
  const isAdmin=user?.role==='admin'
  const me = employees.find(e=>e.email===user?.email) || employees[0]
  const [activeTab,setActiveTab]=useState<'timeoff'|'allocation'>(isAdmin? 'timeoff':'timeoff')
  const [subTab,setSubTab]=useState<'paid'|'sick'>('paid')
  const [search,setSearch]=useState('')

  // request modal
  const [showReq,setShowReq]=useState(false)
  const [type,setType]=useState<'Paid'|'Sick'|'Unpaid'|'Casual'>('Paid')
  const [start,setStart]=useState(new Date().toISOString().slice(0,10))
  const [end,setEnd]=useState(new Date().toISOString().slice(0,10))
  const [reason,setReason]=useState('')
  const [attach,setAttach]=useState(false)
  const days = Math.max(1, Math.ceil((new Date(end).getTime()-new Date(start).getTime())/86400000)+1)

  const myLeaves = leaves.filter(l=> l.employeeId===me.id)
  const pending = leaves.filter(l=>l.status==='Pending')

  const filteredAdmin = useMemo(()=>{
    if(!isAdmin) return []
    return leaves.filter(l=>{
      const emp=employees.find(e=>e.id===l.employeeId)!
      const match = !search || emp.name.toLowerCase().includes(search.toLowerCase()) || emp.department.toLowerCase().includes(search.toLowerCase()) || l.type.toLowerCase().includes(search.toLowerCase())
      if(activeTab==='allocation') return false
      return match
    })
  },[leaves,search,activeTab,isAdmin,employees])

  function submit(){
    const id='LV'+Date.now()
    updateLeaves(prev=>[...prev, { id, employeeId: me.id, type: type as any, startDate:start, endDate:end, days, reason, status:'Pending', createdAt: new Date().toISOString().slice(0,10)}])
    setReason(''); setShowReq(false)
  }

  function guardFor(leaveId:string){
    const l=leaves.find(x=>x.id===leaveId)!
    const emp=employees.find(e=>e.id===l.employeeId)!
    const deptEmps=employees.filter(e=>e.department===emp.department)
    const overlapping = leaves.filter(x=> x.id!==l.id && (x.status==='Approved' || x.status==='Pending') && employees.find(e=>e.id===x.employeeId)?.department===emp.department && !(x.endDate < l.startDate || x.startDate > l.endDate))
    const avail = Math.round(((deptEmps.length - overlapping.length -1)/deptEmps.length)*100)
    return { emp, overlapping, avail, total:deptEmps.length }
  }

  // employee calendar data: collect approved leave dates — filtered by subTab for correct highlighting
  const myLeaveDatesByType = (type: 'paid'|'sick')=>{
    const set=new Set<string>()
    myLeaves.filter(l=>l.status==='Approved' && (type==='paid' ? l.type==='Paid' : l.type==='Sick')).forEach(l=>{
      let cur=new Date(l.startDate); const endD=new Date(l.endDate)
      while(cur<=endD){ set.add(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1)}
    })
    return Array.from(set)
  }
  const leaveDatesArray = myLeaveDatesByType(subTab)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Time Off</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Time Off</h1>
        </div>
        {!isAdmin && <button onClick={()=>setShowReq(true)} className="px-4 py-2 rounded-[10px] bg-ink text-white text-[12px] font-medium inline-flex items-center gap-1.5"><Plus className="w-4 h-4"/>Request Time Off</button>}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-line rounded-[12px]">
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex gap-1">
            <button onClick={()=>setActiveTab('timeoff')} className={`px-4 py-2.5 rounded-[10px] text-[13px] font-medium ${activeTab==='timeoff'?'bg-ink text-white':'text-muted hover:text-ink hover:bg-paper'}`}>Time Off</button>
            <button onClick={()=>setActiveTab('allocation')} className={`px-4 py-2.5 rounded-[10px] text-[13px] font-medium ${activeTab==='allocation'?'bg-ink text-white':'text-muted hover:text-ink hover:bg-paper'}`}>Allocation</button>
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-2 px-2">
              <div className="flex items-center gap-2 border border-line rounded-[10px] px-3 bg-paper">
                <Search className="w-4 h-4 text-muted-2"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="py-2 bg-transparent outline-none text-[12px] w-40"/>
              </div>
            </div>
          ) : activeTab==='timeoff' ? (
            <div className="flex items-center gap-1 p-1 rounded-[10px] bg-paper border border-line mr-1">
              <button onClick={()=>setSubTab('paid')} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${subTab==='paid'?'bg-white border border-line shadow-sm':'text-muted'}`}>Paid Time Off</button>
              <button onClick={()=>setSubTab('sick')} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${subTab==='sick'?'bg-white border border-line shadow-sm':'text-muted'}`}>Sick Time Off</button>
            </div>
          ) : null}
        </div>

        {isAdmin ? (
          activeTab==='timeoff' ? (
            <div className="overflow-auto">
              <table className="w-full text-[13px] min-w-[760px]">
                <thead className="bg-paper text-[11px] tracking-[0.06em] font-medium text-muted uppercase border-y border-line">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Start Date</th>
                    <th className="text-left px-4 py-3 font-medium">End Date</th>
                    <th className="text-left px-4 py-3 font-medium">Time Off Type</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(filteredAdmin.length? filteredAdmin : leaves).slice(0, filteredAdmin.length? filteredAdmin.length: leaves.length).map(l=>{
                    const emp=employees.find(e=>e.id===l.employeeId)!
                    return (
                      <tr key={l.id} className="hover:bg-paper/40">
                        <td className="px-4 py-3 flex items-center gap-2">
                          <img src={emp.avatar} className="w-6 h-6 rounded-full object-cover"/>
                          <span className="font-medium text-[12px]">{emp.name}</span>
                          <span className="text-[11px] text-muted hidden md:inline">• {emp.department}</span>
                        </td>
                        <td className="px-4 py-3 text-[12px] tabular-nums">{l.startDate}</td>
                        <td className="px-4 py-3 text-[12px] tabular-nums">{l.endDate}</td>
                        <td className="px-4 py-3 text-[12px]">{l.type}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${l.status==='Pending'?'bg-[#fef7e7] border-[#f2e0a6] text-[#8a6d00]': l.status==='Approved'?'bg-[#edf4ef] border-[#d6e8db] text-[#1a6b4a]':'bg-[#fdf2f2] border-[#f0d6d6] text-[#7a2a2a]'}`}>{l.status}</span></td>
                        <td className="px-4 py-3">
                          {l.status==='Pending' ? (
                            <div className="flex gap-1.5">
                              <button onClick={()=>updateLeaves(prev=>prev.map(x=>x.id===l.id? {...x, status:'Approved'}:x))} className="w-5 h-5 rounded bg-[#1a6b4a] text-white grid place-items-center hover:bg-[#155a3d]">✓</button>
                              <button onClick={()=>updateLeaves(prev=>prev.map(x=>x.id===l.id? {...x, status:'Rejected'}:x))} className="w-5 h-5 rounded bg-[#b42318] text-white grid place-items-center">✕</button>
                            </div>
                          ) : <span className="text-[11px] text-muted">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 bg-paper border-t border-line text-[11px] text-muted">{pending.length} pending • Use ✓ Approve / ✕ Reject</div>
            </div>
          ) : (
            <div className="p-5">
              <h3 className="text-[13px] font-semibold">Allocation</h3>
              <p className="text-[12px] text-muted mt-1">Annual accrual overview <span className="font-medium text-ink">per employee</span> — HR view for all {employees.length} employees. Paid vs Sick allocation.</p>
              <div className="mt-4 overflow-auto">
                <table className="w-full text-[12px] min-w-[640px]">
                  <thead className="bg-paper text-[11px] tracking-[0.06em] font-medium text-muted uppercase border-y border-line">
                    <tr><th className="text-left px-3 py-2">Employee</th><th className="text-left px-3 py-2">Paid</th><th className="text-left px-3 py-2">Sick</th><th className="text-left px-3 py-2">Unpaid</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {employees.map(emp=>{
                      const empLeaves=leaves.filter(l=>l.employeeId===emp.id)
                      const paidUsed=empLeaves.filter(l=>l.type==='Paid' && l.status==='Approved').reduce((a,b)=>a+b.days,0)
                      const sickUsed=empLeaves.filter(l=>l.type==='Sick' && l.status==='Approved').reduce((a,b)=>a+b.days,0)
                      const unpaidUsed=empLeaves.filter(l=>l.type==='Unpaid' && l.status==='Approved').reduce((a,b)=>a+b.days,0)
                      return (
                        <tr key={emp.id} className="hover:bg-paper/40">
                          <td className="px-3 py-2.5 flex items-center gap-2"><img src={emp.avatar} className="w-6 h-6 rounded-full"/><span className="font-medium">{emp.name}</span><span className="text-[11px] text-muted hidden md:inline">• {emp.department}</span></td>
                          <td className="px-3 py-2.5"><span className="font-medium">{24-paidUsed}</span><span className="text-muted"> / 24</span><span className="text-[11px] text-muted ml-1">({paidUsed} used)</span><div className="mt-1 h-1 bg-paper border border-line rounded-full overflow-hidden"><div className="h-full bg-ink" style={{width: `${((24-paidUsed)/24)*100}%`}}/></div></td>
                          <td className="px-3 py-2.5"><span className="font-medium">{12-sickUsed}</span><span className="text-muted"> / 12</span><span className="text-[11px] text-muted ml-1">({sickUsed} used)</span><div className="mt-1 h-1 bg-paper border border-line rounded-full overflow-hidden"><div className="h-full bg-ink" style={{width: `${((12-sickUsed)/12)*100}%`}}/></div></td>
                          <td className="px-3 py-2.5"><span className="font-medium">{30-unpaidUsed}</span><span className="text-muted"> / 30</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-[11px] text-muted">HR sees per-employee allocation (not just own). Employee view still shows only own 3 cards.</div>
            </div>
          )
        ) : (
          activeTab==='allocation' ? (
            <div className="p-5">
              <h3 className="text-[13px] font-semibold">Allocation</h3>
              <p className="text-[12px] text-muted mt-1">Your personal accrual — Paid vs Sick.</p>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                {[ {type:'Paid Time Off', total:24, used: myLeaves.filter(l=>l.type==='Paid' && l.status==='Approved').reduce((a,b)=>a+b.days,0)},
                   {type:'Sick Leave', total:12, used: myLeaves.filter(l=>l.type==='Sick' && l.status==='Approved').reduce((a,b)=>a+b.days,0)},
                   {type:'Unpaid', total:30, used: myLeaves.filter(l=>l.type==='Unpaid' && l.status==='Approved').reduce((a,b)=>a+b.days,0)}
                ].map(b=>(
                  <div key={b.type} className="border border-line rounded-[10px] p-4 bg-paper">
                    <div className="text-[12px] font-medium">{b.type}</div>
                    <div className="text-[18px] font-semibold mt-1">{b.total - b.used} Days Available</div>
                    <div className="text-[11px] text-muted">{b.used} used of {b.total}</div>
                    <div className="mt-2 h-1.5 bg-white border border-line rounded-full overflow-hidden"><div className="h-full bg-ink" style={{width: `${((b.total-b.used)/b.total)*100}%`}}/></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[10px] bg-paper border border-line p-3 text-[11px] leading-relaxed text-muted">Validity: Jan 01 → Dec 31 • {myLeaves.filter(l=>l.status==='Approved').length} approved requests</div>
            </div>
          ) : (
          <div className="p-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="border border-line rounded-[12px] p-4 bg-paper">
                <div className="text-[12px] font-medium flex items-center gap-1.5"><CalIcon className="w-4 h-4"/>Paid Time Off</div>
                <div className="text-[22px] font-semibold mt-1">24 Days Available</div>
                <div className="text-[11px] text-muted">Validity: Jan 01 → Dec 31 • {myLeaves.filter(l=>l.type==='Paid' && l.status==='Approved').length} requests approved</div>
              </div>
              <div className="border border-line rounded-[12px] p-4 bg-white">
                <div className="text-[12px] font-medium flex items-center gap-1.5"><CalIcon className="w-4 h-4"/>Sick Time Off</div>
                <div className="text-[22px] font-semibold mt-1">07 Days Available</div>
                <div className="text-[11px] text-muted">Used {myLeaves.filter(l=>l.type==='Sick').length} • Medical certificate required</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[12px] font-medium">Year view • {subTab==='paid'? 'Paid':'Sick'} leaves highlighted</div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from({length:12},(_,m)=> (
                  <CalendarGrid key={m} month={m} year={new Date().getFullYear()} leavesForMonth={leaveDatesArray}/>
                ))}
              </div>
            </div>

            <div className="mt-4 border border-line rounded-[12px] overflow-hidden">
              <div className="px-4 py-3 border-b border-line bg-paper flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">My requests</h3>
                <span className="text-[11px] text-muted">{myLeaves.length} records</span>
              </div>
              <div className="divide-y divide-line">
                {myLeaves.map(l=>(
                  <div key={l.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-medium">{l.type} • {l.days} days</div>
                      <div className="text-[11px] text-muted">{l.startDate} → {l.endDate} • {l.reason||'—'}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${l.status==='Pending'?'bg-[#fef7e7] border-[#f2e0a6] text-[#8a6d00]': l.status==='Approved'?'bg-[#edf4ef] border-[#d6e8db] text-[#1a6b4a]':'bg-[#fdf2f2] border-[#f0d6d6] text-[#7a2a2a]'}`}>{l.status}</span>
                  </div>
                ))}
                {myLeaves.length===0 && <div className="text-[12px] text-muted text-center py-8">No requests</div>}
              </div>
            </div>

            <div className="mt-4 rounded-[10px] bg-paper border border-line p-3 text-[11px] leading-relaxed text-muted">
              <span className="font-medium text-ink">Time-Off Types:</span> Paid Time Off • Sick Leave • Unpaid Leaves. Paid requires approval; Sick needs certificate attachment.
            </div>
          </div>
          )
        )}
      </div>

      {/* Admin guard details expansion */}
      {isAdmin && pending.length>0 && activeTab==='timeoff' && (
        <div className="bg-white border border-line rounded-[12px] p-4">
          <div className="text-[12px] font-semibold">Smart Leave Guard — staffing checks</div>
          <div className="text-[11px] text-muted">Analyzes overlapping leaves per department to surface staffing concerns before approval.</div>
          <div className="mt-3 space-y-3">
            {pending.slice(0,2).map(l=>{
              const g=guardFor(l.id)
              const concern=g.avail <70
              return (
                <div key={l.id} className={`rounded-[10px] border p-3 ${concern?'bg-[#fef7e7] border-[#f2e0a6]':'bg-[#edf4ef] border-[#d6e8db]'}`}>
                  <div className="text-[12px] font-medium">{concern?'Potential staffing concern':'No major concern'} — {g.emp.department} → {g.avail}% availability if approved</div>
                  <div className="text-[11px] text-muted mt-1">{g.emp.name} {l.type} {l.startDate}→{l.endDate} overlaps with {g.overlapping.length} others.</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Request modal */}
      {showReq && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div onClick={()=>setShowReq(false)} className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"/>
          <div className="relative bg-white border border-line rounded-[12px] w-full max-w-[420px] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Time off Type Request</h3>
              <button onClick={()=>setShowReq(false)} className="p-1.5 rounded-lg hover:bg-paper border border-transparent hover:border-line"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-medium">Employee</label>
                <div className="mt-1 px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]">{me.name} • {me.department}</div>
              </div>
              <div>
                <label className="text-[11px] font-medium">Time off Type</label>
                <select value={type} onChange={e=>setType(e.target.value as any)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]">
                  <option>Paid</option><option>Sick</option><option>Unpaid</option><option>Casual</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-medium">Validity Period Start</label><input type="date" value={start} onChange={e=>setStart(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
                <div><label className="text-[11px] font-medium">End</label><input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
              </div>
              <div className="rounded-[10px] bg-paper border border-line px-3 py-2.5 text-[12px] flex items-center justify-between">
                <span className="text-muted">{days} days • {type}</span><span className="font-medium font-mono text-[11px]">{start} → {end}</span>
              </div>
              <div>
                <label className="text-[11px] font-medium">Allotment</label>
                <input placeholder="Reason / note" value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/>
              </div>
              <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                <input type="checkbox" checked={attach} onChange={e=>setAttach(e.target.checked)} className="rounded"/>
                <Paperclip className="w-3.5 h-3.5 text-muted"/> Attach certificate (for sick leave)
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={submit} className="flex-1 py-2.5 rounded-[10px] bg-[#1a6b4a] text-white text-[13px] font-medium hover:bg-[#155a3d]">Submit</button>
                <button onClick={()=>setShowReq(false)} className="px-5 py-2.5 rounded-[10px] border border-line bg-white text-[13px] font-medium hover:bg-paper">Cancel</button>
              </div>
              <div className="text-[11px] text-muted text-center">Reviewed by HR. Guard checks for staffing conflicts.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
