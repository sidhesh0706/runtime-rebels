import { useState } from 'react'
import { useAuth } from '../lib/store'
import { Search, Plus, Plane, Circle } from 'lucide-react'
import { DEPARTMENTS, type Dept } from '../lib/data'

export default function Employees(){
  const { employees, attendance, leaves, user, createEmployee } = useAuth()
  const manager=user?.role==='admin'||user?.role==='hr'
  const today=new Date().toISOString().slice(0,10)
  const [q,setQ]=useState('')
  const [dept,setDept]=useState('All')
  const [selected,setSelected]=useState<any>(null)
  const [showNew,setShowNew]=useState(false)
  const [created,setCreated]=useState<{loginId:string;temporaryPassword:string}|null>(null)
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
        <p className="text-[13px] text-muted mt-1">{employees.length} people • Across 6 departments • Local demo data</p>
        </div>
        {manager&&<button onClick={()=>{setShowNew(true);setCreated(null)}} className="px-3.5 py-2 rounded-lg bg-ink text-white text-[12px] font-medium flex items-center gap-2"><Plus className="w-4 h-4"/>New employee</button>}
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

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-[13px] min-w-[780px]">
            <thead className="bg-paper text-[11px] tracking-[0.06em] font-medium text-muted uppercase border-b border-line">
              <tr><th className="text-left px-4 py-3 font-medium">Employee</th><th className="text-left px-4 py-3 font-medium">Department</th><th className="text-left px-4 py-3 font-medium">Role</th><th className="text-left px-4 py-3 font-medium">Attendance</th><th className="text-left px-4 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(emp=>{
                const att=attendance.find(a=>a.employeeId===emp.id && a.date===today)
                const lv=leaves.find(l=>l.employeeId===emp.id && l.status==='Approved' && l.startDate<=today && l.endDate>=today)
                const status = lv? 'On Leave' : att?.status || 'Present'
                const badge = status==='Present'? 'bg-accent-soft text-accent border-[#d6e8db]' : status==='On Leave'?'bg-[#eff6ff] text-[#1d4ed8] border-[#dbeafe]' : status==='Absent'?'bg-[#fdf2f2] text-[#991b1b] border-[#f0d6d6]':'bg-[#fef7e7] text-[#92400e] border-[#fde68a]'
                return (
                  <tr key={emp.id} onClick={()=>setSelected(emp)} className="hover:bg-paper/60 cursor-pointer">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img src={emp.avatar} className="w-8 h-8 rounded-full object-cover"/>
                      <div><div className="font-medium leading-none">{emp.name}</div><div className="text-[11px] text-muted mt-0.5">{emp.id} • {emp.email}</div></div>
                    </td>
                    <td className="px-4 py-3 text-muted">{emp.department}</td>
                    <td className="px-4 py-3 text-muted">{emp.role}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-[11px] font-medium border inline-flex items-center gap-1.5 ${badge}`}>{status==='On Leave'?<Plane className="w-3 h-3"/>:<Circle className="w-2.5 h-2.5 fill-current"/>}{status}</span></td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-md text-[11px] font-medium bg-ink text-white">Active</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
            <button onClick={()=>setSelected(null)} className="mt-5 w-full py-2 rounded-lg bg-ink text-white text-[13px] font-medium">Close</button>
          </div>
        </div>
      )}

      {showNew&&<div className="fixed inset-0 z-50 grid place-items-center p-4"><div className="absolute inset-0 bg-black/25" onClick={()=>setShowNew(false)}/><div className="relative bg-white border border-line rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-[16px] font-semibold">Create employee account</h2><p className="text-[12px] text-muted mt-1">DayFlow generates the employee ID and temporary password.</p>
        {created?<div className="mt-5 space-y-3"><div className="rounded-lg bg-accent-soft border border-[#d6e8db] p-4"><div className="text-[12px] font-medium">Employee created</div><div className="mt-3 grid grid-cols-2 gap-3"><div><div className="text-[11px] text-muted">Login ID</div><div className="font-mono text-[12px]">{created.loginId}</div></div><div><div className="text-[11px] text-muted">Temporary password</div><div className="font-mono text-[12px]">{created.temporaryPassword}</div></div></div></div><p className="text-[11px] text-muted">Share these credentials securely. The employee will be required to change the password after first login.</p><button onClick={()=>setShowNew(false)} className="w-full py-2 rounded-lg bg-ink text-white text-[12px] font-medium">Done</button></div>:
        <form className="mt-5 grid grid-cols-2 gap-3" onSubmit={async e=>{e.preventDefault();const result=await createEmployee(form);if(result.ok&&result.loginId&&result.temporaryPassword)setCreated({loginId:result.loginId,temporaryPassword:result.temporaryPassword})}}>
          <input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="col-span-2 px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <input required type="email" placeholder="Work email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="col-span-2 px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <input required placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <input required placeholder="Job title" value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <select value={form.department} onChange={e=>setForm({...form,department:e.target.value as Dept})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]">{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select>
          <input required type="date" value={form.joinDate} onChange={e=>setForm({...form,joinDate:e.target.value})} className="px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>
          <button className="col-span-2 py-2 rounded-lg bg-accent text-white text-[12px] font-medium">Create and generate credentials</button>
        </form>}
      </div></div>}
    </div>
  )
}
