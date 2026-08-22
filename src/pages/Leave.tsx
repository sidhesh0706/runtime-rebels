import { useState } from 'react'
import { useAuth } from '../lib/store'
import { Link } from 'react-router-dom'

export default function Leave(){
  const { employees, leaves, updateLeaves, user } = useAuth()
  const isAdmin=user?.role==='admin'
  const me = employees.find(e=>e.email===user?.email) || employees[0]
  const [type,setType]=useState('Paid')
  const [start,setStart]=useState(new Date().toISOString().slice(0,10))
  const [end,setEnd]=useState(new Date().toISOString().slice(0,10))
  const [reason,setReason]=useState('')
  const days = Math.max(1, Math.ceil((new Date(end).getTime()-new Date(start).getTime())/86400000)+1)

  const myLeaves = leaves.filter(l=> l.employeeId===me.id)
  const allPending = leaves.filter(l=>l.status==='Pending')

  function submit(){
    const id='LV'+Date.now()
    updateLeaves(prev=>[...prev, { id, employeeId: me.id, type: type as any, startDate:start, endDate:end, days, reason, status:'Pending', createdAt: new Date().toISOString().slice(0,10)}])
    setReason('')
  }

  function guardFor(leaveId:string){
    const l=leaves.find(x=>x.id===leaveId)!
    const emp=employees.find(e=>e.id===l.employeeId)!
    const deptEmps=employees.filter(e=>e.department===emp.department)
    const overlapping = leaves.filter(x=> x.id!==l.id && (x.status==='Approved' || x.status==='Pending') && employees.find(e=>e.id===x.employeeId)?.department===emp.department && !(x.endDate < l.startDate || x.startDate > l.endDate))
    const unavailable = overlapping.length
    const avail = Math.round(((deptEmps.length - unavailable -1)/deptEmps.length)*100)
    return { emp, deptEmps, overlapping, avail, total:deptEmps.length }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Leave</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Leave</h1>
          <p className="text-[13px] text-muted mt-1">Apply, track, and approve time off — with Smart Leave Guard.</p>
        </div>
        {isAdmin && <Link to="/guard" className="px-3 py-1.5 rounded-lg bg-ink text-white text-[12px] font-medium">Open Guard</Link>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border border-line rounded-xl">
          <div className="px-4 py-3 border-b border-line"><h3 className="text-[13px] font-semibold">Apply for leave</h3></div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-ink">Leave type</label>
              <select value={type} onChange={e=>setType(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-line bg-paper text-[13px]">
                <option>Paid</option><option>Sick</option><option>Unpaid</option><option>Casual</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-medium">Start</label><input type="date" value={start} onChange={e=>setStart(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-line bg-paper text-[13px]"/></div>
              <div><label className="text-[11px] font-medium">End</label><input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-line bg-paper text-[13px]"/></div>
            </div>
            <div className="rounded-lg bg-paper border border-line px-3 py-2.5 text-[12px] flex items-center justify-between">
              <span className="text-muted">{days} days • {type}</span><span className="font-medium">{start} → {end}</span>
            </div>
            <div>
              <label className="text-[11px] font-medium">Reason</label>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Brief reason…" className="mt-1 w-full px-3 py-2 rounded-lg border border-line bg-paper text-[13px] min-h-[80px]"/>
            </div>
            <button onClick={submit} className="w-full py-2 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-[#155a3d]">Submit request</button>
            <p className="text-[11px] text-muted text-center leading-relaxed">Reviewed by HR. Guard checks for staffing conflicts.</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!isAdmin && (
            <div className="bg-white border border-line rounded-xl">
              <div className="px-4 py-3 border-b border-line"><h3 className="text-[13px] font-semibold">My requests</h3></div>
              <div className="p-3 space-y-2">
                {myLeaves.map(l=>(
                  <div key={l.id} className="border border-line rounded-lg px-3 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-medium">{l.type} • {l.days} days</div>
                      <div className="text-[11px] text-muted">{l.startDate} → {l.endDate} • {l.reason}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${l.status==='Pending'?'bg-[#fef7e7] border-[#f2e0a6] text-[#8a6d00]': l.status==='Approved'?'bg-accent-soft border-[#d6e8db] text-accent':'bg-[#fdf2f2] border-[#f0d6d6] text-[#991b1b]'}`}>{l.status}</span>
                  </div>
                ))}
                {myLeaves.length===0 && <div className="text-[12px] text-muted text-center py-6 border border-dashed border-line rounded-lg">No requests</div>}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="bg-white border border-line rounded-xl">
              <div className="px-4 py-3 border-b border-line">
                <h3 className="text-[13px] font-semibold">Review requests</h3>
                <p className="text-[11px] text-muted">Guard analyzes department staffing before you decide.</p>
              </div>
              <div className="p-3 space-y-3">
                {allPending.map(l=>{
                  const g=guardFor(l.id)
                  const conflict = g.avail < 70
                  return (
                    <div key={l.id} className="border border-line rounded-xl p-4">
                      <div className="flex gap-3">
                        <img src={g.emp.avatar} className="w-8 h-8 rounded-full"/>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate">{g.emp.name} • {g.emp.department}</div>
                          <div className="text-[11px] text-muted">{l.type} • {l.startDate} → {l.endDate} • {l.days}d • {l.reason}</div>
                        </div>
                        <span className="h-fit px-2 py-1 rounded-md text-[11px] font-medium bg-[#fef7e7] border border-[#f2e0a6] text-[#8a6d00]">Pending</span>
                      </div>

                      <div className={`mt-3 rounded-lg p-3 border text-[12px] ${conflict?'bg-[#fef7e7] border-[#f2e0a6]':'bg-accent-soft border-[#d6e8db]'}`}>
                        <div className="font-medium">{conflict? 'Potential staffing concern':'No major concern'}</div>
                        <div className="text-[11px] text-muted mt-1 leading-relaxed">{g.emp.department} has {g.overlapping.length} other {g.overlapping.length===1?'person':'people'} unavailable in this period. Approving would reduce availability to <span className="font-medium text-ink">{g.avail}%</span> ({g.total - g.overlapping.length -1} of {g.total}).</div>
                        {g.overlapping.length>0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {g.overlapping.slice(0,4).map(o=>{
                              const e=employees.find(x=>x.id===o.employeeId)!
                              return <span key={o.id} className="text-[11px] px-2 py-1 rounded-md bg-white border border-line">{e.name} • {o.startDate}</span>
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button onClick={()=>updateLeaves(prev=>prev.map(x=>x.id===l.id? {...x, status:'Approved'}:x))} className="px-3 py-1.5 rounded-lg bg-accent text-white text-[12px] font-medium">Approve</button>
                        <button onClick={()=>updateLeaves(prev=>prev.map(x=>x.id===l.id? {...x, status:'Rejected'}:x))} className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium">Reject</button>
                        <button className="ml-auto px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium">Review team</button>
                      </div>
                    </div>
                  )
                })}
                {allPending.length===0 && <div className="text-[12px] text-muted text-center py-8 border border-dashed border-line rounded-lg">All caught up — no pending requests.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
