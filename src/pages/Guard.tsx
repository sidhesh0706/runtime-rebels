import { useAuth } from '../lib/store'

export default function Guard(){
  const { leaves, employees, reviewLeave } = useAuth()
  const pending=leaves.filter(l=>l.status==='Pending')
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Intelligence</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Smart Leave Guard</h1>
        <p className="text-[13px] text-muted mt-1">Decision-support for approvals. Analyzes department, dates, and overlapping leave. Final decision stays with HR.</p>
      </div>

      {pending.length===0? (
        <div className="bg-white border border-line rounded-xl p-10 text-center">
          <div className="text-[13px] font-medium">No pending requests</div>
          <div className="text-[12px] text-muted mt-1">All caught up — Guard has nothing to analyze.</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map(l=>{
            const emp=employees.find(e=>e.id===l.employeeId)!
            const dept=emp.department
            const deptEmps=employees.filter(e=>e.department===dept)
            const overlapping=leaves.filter(x=> x.id!==l.id && (x.status==='Approved'||x.status==='Pending') && employees.find(e=>e.id===x.employeeId)?.department===dept && !(x.endDate < l.startDate || x.startDate > l.endDate))
            const avail=Math.max(0, Math.round(((deptEmps.length - overlapping.length -1)/deptEmps.length)*100))
            const concern=avail<70
            return (
              <div key={l.id} className="bg-white border border-line rounded-xl">
                <div className="px-5 py-4 flex gap-3 border-b border-line">
                  <img src={emp.avatar} className="w-8 h-8 rounded-full"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{emp.name} <span className="text-muted font-normal">• {dept}</span></div>
                    <div className="text-[11px] text-muted">{l.type} • {l.startDate} → {l.endDate} • {l.days} days • {l.reason}</div>
                  </div>
                  <span className="h-fit px-2 py-1 rounded-md bg-[#fef7e7] border border-[#f2e0a6] text-[#8a6d00] text-[11px] font-medium">Pending</span>
                </div>

                <div className="px-5 py-4">
                  <div className={`rounded-lg border p-3 ${concern?'bg-[#fef7e7] border-[#f2e0a6]':'bg-accent-soft border-[#d6e8db]'}`}>
                    <div className="text-[12px] font-medium">{concern? 'Staffing concern detected':'No major staffing concern'}</div>
                    <div className="text-[11px] text-muted mt-1 leading-relaxed">
                      {dept} already has {overlapping.length} employees unavailable during this period. Approving this request would reduce team availability to <span className="font-medium text-ink">{avail}%</span> ({deptEmps.length - overlapping.length -1} of {deptEmps.length} available).
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                    <div className="border border-line rounded-lg px-3 py-2.5 bg-paper"><div className="text-muted">Affected team</div><div className="font-medium text-ink mt-0.5">{dept}</div></div>
                    <div className="border border-line rounded-lg px-3 py-2.5 bg-paper"><div className="text-muted">Availability if approved</div><div className="font-medium text-ink mt-0.5">{avail}%</div></div>
                    <div className="border border-line rounded-lg px-3 py-2.5 bg-paper"><div className="text-muted">Requested period</div><div className="font-medium text-ink mt-0.5">{l.startDate} → {l.endDate}</div></div>
                  </div>
                  {overlapping.length>0 && (
                    <div className="mt-3">
                      <div className="text-[11px] font-medium text-muted">Already unavailable</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">{overlapping.map(o=>{ const e=employees.find(x=>x.id===o.employeeId)!; return <span key={o.id} className="px-2 py-1 rounded-md bg-paper border border-line text-[11px]">{e.name} • {o.startDate}→{o.endDate}</span>})}</div>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button onClick={()=>reviewLeave(l.id,'Approved','Approved after staffing review')} className="px-3.5 py-2 rounded-lg bg-ink text-white text-[12px] font-medium hover:bg-black">Approve</button>
                    <button onClick={()=>reviewLeave(l.id,'Rejected','Rejected due to staffing coverage')} className="px-3.5 py-2 rounded-lg border border-line bg-white text-[12px] font-medium">Reject</button>
                    <button className="px-3.5 py-2 rounded-lg border border-line bg-white text-[12px] font-medium ml-auto">Review team</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-paper border border-line rounded-xl px-4 py-4">
        <div className="text-[12px] font-medium">How it works</div>
        <div className="text-[11px] text-muted mt-1 leading-relaxed">Guard queries PostgreSQL for overlapping approved/pending leaves in the same department and calculates resulting availability. It never auto-approves — it supports your decision.</div>
      </div>
    </div>
  )
}
