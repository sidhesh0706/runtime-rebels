import { useState } from 'react'
import { useAuth } from '../lib/store'
import { Search, Plus, Plane, Circle } from 'lucide-react'
import { DEPARTMENTS, type Dept } from '../lib/data'
import { Link } from 'react-router-dom'

export default function Employees(){
  const { employees, attendance, leaves, user, createEmployee } = useAuth()
  const manager=user?.role==='admin'||user?.role==='hr'
  const today=new Date().toISOString().slice(0,10)
  const [q,setQ]=useState('')
  const [dept,setDept]=useState('All')
  const [selected,setSelected]=useState<any>(null)
  const [showNew,setShowNew]=useState(false)
  const [created,setCreated]=useState<{loginId:string;temporaryPassword:string}|null>(null)
  const [createError,setCreateError]=useState('')
  const [creating,setCreating]=useState(false)
  const [form,setForm]=useState({name:'',email:'',phone:'',department:'Engineering' as Dept,jobTitle:'',joinDate:new Date().toISOString().slice(0,10)})
  const filtered=employees.filter(e=>{
    const mQ = !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.email.toLowerCase().includes(q.toLowerCase()) || e.id.toLowerCase().includes(q.toLowerCase())
    const mD = dept==='All' || e.department===dept
    return mQ && mD
  })
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
        <div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">People</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight">Employees</h1>
        <p className="text-[13px] text-muted mt-1">{employees.length} people • Across 6 departments • Local PostgreSQL</p>
        </div>
        {manager&&<button onClick={()=>{setShowNew(true);setCreated(null);setCreateError('')}} className="px-3.5 py-2 rounded-lg bg-ink text-white text-[12px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/>New employee</button>}
      </div>

      <div className="bg-white border border-line rounded-xl p-3 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 border border-line rounded-lg px-3 bg-paper">
          <Search className="w-4 h-4 text-muted-2"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, email, ID…" className="flex-1 py-2 bg-transparent outline-none text-[13px] placeholder:text-muted-2"/>
        </div>
        <select value={dept} onChange={e=>setDept(e.target.value)} className="px-3 py-2 rounded-lg border border-line bg-white text-[13px] font-medium">
          <option value="All">All departments</option>
          <option>Engineering</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Human Resources</option><option>Finance</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(emp=>{
          const att=attendance.find(a=>a.employeeId===emp.id&&a.date===today)
          const lv=leaves.find(l=>l.employeeId===emp.id&&l.status==='Approved'&&l.startDate<=today&&l.endDate>=today)
          const status=lv?'On Leave':att?.status||'Absent'
          const badge=status==='Present'||status==='Late'?'bg-accent-soft text-accent border-[#d6e8db]':status==='On Leave'?'bg-[#eff6ff] text-[#1d4ed8] border-[#dbeafe]':'bg-[#fdf2f2] text-[#991b1b] border-[#f0d6d6]'
          return <Link to={`/employees/${encodeURIComponent(emp.id)}`} key={emp.id} className="group bg-white border border-line rounded-xl p-4 hover:shadow-card hover:-translate-y-0.5 transition">
            <div className="flex items-start gap-3"><img src={emp.avatar} className="w-12 h-12 rounded-xl object-cover bg-paper"/><div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{emp.name}</div><div className="text-[11px] text-muted truncate">{emp.role}</div><div className="text-[10px] text-muted mt-1">{emp.loginId||emp.id}</div></div><span className={`px-2 py-1 rounded-md text-[10px] font-medium border inline-flex items-center gap-1 ${badge}`}>{status==='On Leave'?<Plane className="w-3 h-3"/>:<Circle className="w-2 h-2 fill-current"/>}{status}</span></div>
            <div className="mt-4 pt-3 border-t border-line flex justify-between text-[11px]"><span className="text-muted">{emp.department}</span><span className="font-medium">View profile →</span></div>
          </Link>
        })}
        {!filtered.length&&<div className="sm:col-span-2 xl:col-span-3 bg-white border border-dashed border-line rounded-xl p-10 text-center text-[12px] text-muted">No employees match these filters.</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div onClick={()=>setSelected(null)} className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"/>
          <div className="relative bg-white border border-line rounded-xl max-w-lg w-full p-6">
            <div className="flex gap-4">
              <img src={selected.avatar} className="w-12 h-12 rounded-full"/>
              <div>
                <div className="text-[15px] font-semibold">{selected.name}</div>
                <div className="text-[12px] text-muted">{selected.role} • {selected.department}</div>
                <div className="text-[11px] text-muted mt-1">{selected.email} • {selected.phone}</div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
              <div className="border border-line rounded-lg p-3 bg-paper"><div className="text-[11px] text-muted">Employee ID</div><div className="font-medium">{selected.id}</div></div>
              <div className="border border-line rounded-lg p-3 bg-paper"><div className="text-[11px] text-muted">Join date</div><div className="font-medium">{selected.joinDate}</div></div>
              {manager?<div className="border border-line rounded-lg p-3 bg-paper"><div className="text-[11px] text-muted">Salary</div><div className="font-medium">₹{selected.salary.toLocaleString('en-IN')}</div></div>:<div className="border border-line rounded-lg p-3 bg-paper"><div className="text-[11px] text-muted">Location</div><div className="font-medium">{selected.location||'—'}</div></div>}
              <div className="border border-line rounded-lg p-3 bg-paper"><div className="text-[11px] text-muted">Department</div><div className="font-medium">{selected.department}</div></div>
            </div>
            <Link to={`/employees/${encodeURIComponent(selected.id)}`} className="mt-5 block text-center w-full py-2 rounded-lg bg-ink text-white text-[13px] font-medium">Open full profile</Link>
          </div>
        </div>
      )}

      {showNew&&<div className="fixed inset-0 z-50 grid place-items-center p-4"><div className="absolute inset-0 bg-black/25" onClick={()=>setShowNew(false)}/><div className="relative bg-white border border-line rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-[16px] font-semibold">Create employee account</h2><p className="text-[12px] text-muted mt-1">DayFlow generates the employee ID and temporary password.</p>
        {created?<div className="mt-5 space-y-3"><div className="rounded-lg bg-accent-soft border border-[#d6e8db] p-4"><div className="text-[12px] font-medium">Employee created</div><div className="mt-3 grid grid-cols-2 gap-3"><div><div className="text-[11px] text-muted">Login ID</div><div className="font-mono text-[12px]">{created.loginId}</div></div><div><div className="text-[11px] text-muted">Temporary password</div><div className="font-mono text-[12px]">{created.temporaryPassword}</div></div></div></div><p className="text-[11px] text-muted">Share these credentials securely. The employee will be required to change the password after first login.</p><button onClick={()=>setShowNew(false)} className="w-full py-2 rounded-lg bg-ink text-white text-[12px] font-medium">Done</button></div>:
        <form className="mt-5 grid grid-cols-2 gap-3" onSubmit={async e=>{e.preventDefault();setCreating(true);setCreateError('');const result=await createEmployee(form);setCreating(false);if(result.ok&&result.loginId&&result.temporaryPassword)setCreated({loginId:result.loginId,temporaryPassword:result.temporaryPassword});else setCreateError(result.error||'Could not create employee')}}>
          <input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="col-span-2 px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <input required type="email" placeholder="Work email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="col-span-2 px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <input required placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <input required placeholder="Job title" value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <select value={form.department} onChange={e=>setForm({...form,department:e.target.value as Dept})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]">{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select>
          <input required type="date" value={form.joinDate} onChange={e=>setForm({...form,joinDate:e.target.value})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          {createError&&<div className="col-span-2 text-[11px] text-[#991b1b] bg-[#fdf2f2] border border-[#f0d6d6] rounded-lg px-3 py-2">{createError}</div>}
          <button disabled={creating} className="col-span-2 py-2 rounded-lg bg-accent text-white text-[12px] font-medium disabled:opacity-60">{creating?'Creating…':'Create and generate credentials'}</button>
        </form>}
      </div></div>}
    </div>
  )
}
