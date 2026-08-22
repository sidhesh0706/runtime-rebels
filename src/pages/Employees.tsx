import { useState, useMemo } from 'react'
import { useAuth } from '../lib/store'
import { Search, Eye, Plus, X, Copy, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

function statusMeta(status:string){
  if(status==='Present') return { dot:'bg-[#1a6b4a]', badge:'bg-[#edf4ef] text-[#1a6b4a] border-[#d6e8db]', label:'Present' }
  if(status==='Late') return { dot:'bg-[#b54708]', badge:'bg-[#fef7e7] text-[#8a6d00] border-[#f2e0a6]', label:'Late' }
  if(status==='Half-day') return { dot:'bg-[#c0900a]', badge:'bg-[#fef7e7] text-[#8a6d00] border-[#f2e0a6]', label:'Half-day' }
  if(status==='Leave' || status==='On Leave') return { dot:'bg-[#2563eb]', badge:'bg-[#eff6ff] text-[#1d4ed8] border-[#dbeafe]', label:'On Leave' }
  return { dot:'bg-[#b42318]', badge:'bg-[#fdf2f2] text-[#7a2a2a] border-[#f0d6d6]', label:'Absent' }
}

export default function Employees(){
  const { employees, attendance, leaves, user, addEmployee } = useAuth()
  const today=new Date().toISOString().slice(0,10)
  const [q,setQ]=useState('')
  const [dept,setDept]=useState('All')
  const [selected,setSelected]=useState<any>(null)
  const [showAdd,setShowAdd]=useState(false)
  const [form,setForm]=useState({name:'', email:'', department:'Engineering' as any, role:'', phone:'', manager:'', location:'', dob:''})
  const [addResult,setAddResult]=useState<{loginId:string; tempPassword:string; employee:any} | null>(null)
  const [addError,setAddError]=useState('')
  const [copied,setCopied]=useState('')

  const filtered=useMemo(()=> employees.filter(e=>{
    const mQ = !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.email.toLowerCase().includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase()) || (e.loginId||'').toLowerCase().includes(q.toLowerCase())
    const mD = dept==='All' || e.department===dept
    return mQ && mD
  }),[q,dept,employees])

  const isAdmin=user?.role==='admin'

  const handleAdd=()=>{
    setAddError('')
    if(!form.name || !form.email || !form.department || !form.role){ setAddError('Name, Email, Department and Role are required'); return }
    const res=addEmployee({name:form.name, email:form.email, department:form.department, role:form.role, phone:form.phone, manager:form.manager, location:form.location, dob:form.dob})
    if(!res){ setAddError('Employee with this email already exists'); return }
    setAddResult(res); setForm({name:'', email:'', department:'Engineering' as any, role:'', phone:'', manager:'', location:'', dob:''})
  }
  const copy=(txt:string, key:string)=>{ navigator.clipboard?.writeText(txt); setCopied(key); setTimeout(()=>setCopied(''),1500) }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>

          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Employees</h1>
          <p className="text-[13px] text-muted mt-1">{employees.length} people • Across 6 departments • Cards are clickable → view-only profile {isAdmin? '• HR can add new employees' : '• Contact HR to update your profile'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-[11px] text-muted hidden md:block">Click a card → view-only</div>
          {isAdmin && <button onClick={()=>{setShowAdd(true); setAddResult(null); setAddError('')}} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] bg-ink text-white text-[12px] font-medium hover:bg-black"><Plus className="w-3.5 h-3.5"/>Add Employee</button>}
        </div>
      </div>

      <div className="bg-white border border-line rounded-[12px] p-3 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 border border-line rounded-[10px] px-3 bg-paper">
          <Search className="w-4 h-4 text-muted-2"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, email, ID, Login ID…" className="flex-1 py-2 bg-transparent outline-none text-[13px] placeholder:text-muted-2"/>
        </div>
        <select value={dept} onChange={e=>setDept(e.target.value)} className="px-3 py-2 rounded-[10px] border border-line bg-white text-[13px] font-medium">
          <option value="All">All departments</option>
          <option>Engineering</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Human Resources</option><option>Finance</option>
        </select>
        <div className="flex items-center gap-1.5 text-[11px] ml-auto">
          <span className="w-2 h-2 rounded-full bg-[#1a6b4a]"/>Present
          <span className="w-2 h-2 rounded-full bg-[#2563eb] ml-2"/>Leave
          <span className="w-2 h-2 rounded-full bg-[#b42318] ml-2"/>Absent
          <span className="w-2 h-2 rounded-full bg-[#c0900a] ml-2"/>Half-day
        </div>
      </div>

      {/* Card grid — as per Excalidraw 3x3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(emp=>{
          const att=attendance.find(a=>a.employeeId===emp.id && a.date===today)
          const lv=leaves.find(l=>l.employeeId===emp.id && l.status==='Approved' && l.startDate<=today && l.endDate>=today)
          const status = lv ? 'On Leave' : att?.status || 'Present'
          const meta=statusMeta(status)
          return (
            <div key={emp.id} onClick={()=>setSelected(emp)} className="group bg-white border border-line rounded-[12px] p-4 hover:border-ink/15 hover:shadow-soft cursor-pointer transition relative">
              <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${meta.dot}`} title={status}/>
              <div className="flex gap-3">
                <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-line"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold leading-none truncate">{emp.name}</div>
                  <div className="text-[11px] text-muted truncate">{emp.role}</div>
                  <div className="text-[11px] text-muted-2 truncate">{emp.department} • {emp.loginId || emp.id}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${meta.badge}`}>{meta.label}</span>
                <span className="text-[11px] text-muted flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"><Eye className="w-3 h-3"/>View</span>
              </div>
              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-2">
                <div className="text-[11px] text-muted truncate">{emp.email}</div>
                <Link to={`/employees/${emp.id}`} onClick={e=>e.stopPropagation()} className="text-[11px] font-medium px-2 py-1 rounded-md bg-paper border border-line hover:bg-white">Open</Link>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length===0 && <div className="bg-white border border-dashed border-line rounded-[12px] p-10 text-center text-[13px] text-muted">No employees match your search.</div>}

      {/* View-only modal */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div onClick={()=>setSelected(null)} className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"/>
          <div className="relative bg-white border border-line rounded-[12px] max-w-lg w-full overflow-hidden shadow-card">
            <div className="h-1 bg-ink"/>
            <div className="p-6">
              <div className="flex gap-4">
                <img src={selected.avatar} className="w-12 h-12 rounded-full object-cover border border-line"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold leading-none">{selected.name}</div>
                  <div className="text-[12px] text-muted mt-1">{selected.role} • {selected.department}</div>
                  <div className="text-[11px] text-muted mt-1">{selected.email} • {selected.phone}</div>
                  <div className="text-[11px] font-mono text-muted mt-1">{selected.loginId} • Joined {selected.joinDate}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Employee ID</div><div className="font-medium font-mono">{selected.id}</div></div>
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Join date</div><div className="font-medium">{selected.joinDate}</div></div>
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Monthly wage</div><div className="font-medium">₹{(selected.monthlyWage||Math.round(selected.salary/12)).toLocaleString('en-IN')}</div></div>
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Department</div><div className="font-medium">{selected.department}</div></div>
              </div>
              <div className="mt-3 rounded-[10px] bg-[#faf9f7] border border-line p-3 text-[11px] leading-relaxed text-muted">
                View-only mode. To edit private or salary information, open the full profile. {isAdmin? 'Salary Info is visible to Admin only.':''}
              </div>
              <div className="mt-5 flex gap-2">
                <Link to={`/employees/${selected.id}`} className="flex-1 text-center py-2 rounded-[10px] bg-ink text-white text-[13px] font-medium hover:bg-black">Open full profile</Link>
                <button onClick={()=>setSelected(null)} className="px-4 py-2 rounded-[10px] border border-line bg-white text-[13px] font-medium hover:bg-paper">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HR — Add Employee (only admin, creates Employee ID + login) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div onClick={()=>setShowAdd(false)} className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"/>
          <div className="relative bg-white border border-line rounded-[12px] w-full max-w-[560px] shadow-card max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-line flex items-center justify-between rounded-t-[12px]">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">Add Employee</h3>
                <p className="text-[11px] text-muted">HR creates Employee ID, Login ID and temp password. Employee logs in and completes Private / Security.</p>
              </div>
              <button onClick={()=>setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-paper border border-transparent hover:border-line"><X className="w-4 h-4"/></button>
            </div>

            {addResult ? (
              <div className="p-6 space-y-4">
                <div className="rounded-[10px] bg-[#edf4ef] border border-[#d6e8db] p-4">
                  <div className="text-[12px] font-semibold text-ink">Employee created</div>
                  <div className="text-[11px] text-muted mt-1">Share these credentials securely. Employee must change password on first login via My Profile → Security.</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-line rounded-[10px] p-3 bg-paper">
                    <div className="text-[11px] text-muted">Employee ID</div>
                    <div className="flex items-center gap-2 mt-1"><span className="font-mono text-[13px] font-medium">{addResult.employee.id}</span><button onClick={()=>copy(addResult.employee.id,'id')} className="p-1 rounded hover:bg-white border border-transparent hover:border-line">{copied==='id'? <Check className="w-3.5 h-3.5 text-[#1a6b4a]"/> : <Copy className="w-3.5 h-3.5 text-muted"/>}</button></div>
                  </div>
                  <div className="border border-line rounded-[10px] p-3 bg-paper">
                    <div className="text-[11px] text-muted">Login ID</div>
                    <div className="flex items-center gap-2 mt-1"><span className="font-mono text-[13px] font-medium">{addResult.loginId}</span><button onClick={()=>copy(addResult.loginId,'login')} className="p-1 rounded hover:bg-white border border-transparent hover:border-line">{copied==='login'? <Check className="w-3.5 h-3.5 text-[#1a6b4a]"/> : <Copy className="w-3.5 h-3.5 text-muted"/>}</button></div>
                  </div>
                  <div className="border border-line rounded-[10px] p-3 bg-paper">
                    <div className="text-[11px] text-muted">Temp Password</div>
                    <div className="flex items-center gap-2 mt-1"><span className="font-mono text-[13px] font-medium">{addResult.tempPassword}</span><button onClick={()=>copy(addResult.tempPassword,'pw')} className="p-1 rounded hover:bg-white border border-transparent hover:border-line">{copied==='pw'? <Check className="w-3.5 h-3.5 text-[#1a6b4a]"/> : <Copy className="w-3.5 h-3.5 text-muted"/>}</button></div>
                  </div>
                </div>
                <div className="rounded-[10px] border border-line bg-paper p-3 text-[11px] leading-relaxed text-muted">
                  <span className="font-medium text-ink">Next:</span> Employee logs in with <span className="font-mono">{addResult.employee.email}</span> / temp password, then completes <span className="font-medium">Resume → Private Info → Security</span>. Salary remains admin-only and hidden.
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setShowAdd(false)} className="flex-1 py-2 rounded-[10px] bg-ink text-white text-[13px] font-medium">Done</button>
                  <Link to={`/employees/${addResult.employee.id}`} onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-[10px] border border-line bg-white text-[13px] font-medium">Open Profile</Link>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="text-[11px] font-medium">Full Name *</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Neha Singh" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink"/></div>
                  <div><label className="text-[11px] font-medium">Work Email *</label><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="neha.singh@dayflow.co" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink"/></div>
                  <div><label className="text-[11px] font-medium">Department *</label><select value={form.department} onChange={e=>setForm({...form, department:e.target.value as any})} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"><option>Engineering</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Human Resources</option><option>Finance</option></select></div>
                  <div><label className="text-[11px] font-medium">Role / Job Title *</label><input value={form.role} onChange={e=>setForm({...form, role:e.target.value})} placeholder="Product Designer" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink"/></div>
                  <div><label className="text-[11px] font-medium">Phone</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="+91 90000 00000" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink"/></div>
                  <div><label className="text-[11px] font-medium">Manager</label><input value={form.manager} onChange={e=>setForm({...form, manager:e.target.value})} placeholder="Aarav Mehta" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink"/></div>
                  <div><label className="text-[11px] font-medium">Location</label><input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder="Mumbai HQ — Floor 5" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink"/></div>
                  <div><label className="text-[11px] font-medium">Date of Birth</label><input type="date" value={form.dob} onChange={e=>setForm({...form, dob:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink"/></div>
                </div>
                {addError && <div className="text-[12px] text-[#7a2a2a] bg-[#fdf2f2] border border-[#f0d6d6] rounded-[10px] px-3 py-2">{addError}</div>}
                <div className="rounded-[10px] bg-[#faf9f7] border border-line p-3 text-[11px] leading-relaxed text-muted">
                  System auto-generates <span className="font-mono font-medium">EMP####</span> and <span className="font-mono font-medium">Login ID (DF + initials + number)</span> and a temp password. Private Info / Security are editable by employee after first login; <span className="font-medium text-ink">Salary stays admin-only</span>.
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="flex-1 py-2.5 rounded-[10px] bg-ink text-white text-[13px] font-medium hover:bg-black">Create Employee</button>
                  <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 rounded-[10px] border border-line bg-white text-[13px] font-medium">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
