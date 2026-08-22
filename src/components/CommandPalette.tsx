import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, CalendarCheck, CalendarDays, LayoutDashboard, Wallet } from 'lucide-react'
import { useAuth } from '../lib/store'

export default function CommandPalette(){
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const navigate=useNavigate()
  const {employees,user}=useAuth()
  useEffect(()=>{
    function onKey(event:KeyboardEvent){
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(value=>!value)}
      if(event.key==='Escape')setOpen(false)
    }
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)
  },[])
  if(!open)return null
  const normalized=query.toLowerCase()
  const filtered=employees.filter(employee=>!query||[employee.name,employee.id,employee.loginId||'',employee.department,employee.role].some(value=>value.toLowerCase().includes(normalized))).slice(0,7)
  const jump=(path:string)=>{setOpen(false);setQuery('');navigate(path)}
  return <div className="fixed inset-0 z-[70] grid place-items-start pt-[16vh] p-4">
    <button aria-label="Close command palette" onClick={()=>setOpen(false)} className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"/>
    <div className="relative bg-white border border-line rounded-xl w-full max-w-lg shadow-card overflow-hidden mx-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line"><Search className="w-4 h-4 text-muted"/><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search employees or jump to a workspace…" className="flex-1 outline-none text-[13px]"/><span className="text-[10px] px-1.5 py-0.5 rounded border border-line bg-paper">ESC</span></div>
      <div className="p-2 max-h-80 overflow-auto">
        <div className="text-[10px] tracking-[0.08em] font-medium text-muted uppercase px-2 py-1">Employees</div>
        {filtered.map(employee=><button key={employee.id} onClick={()=>jump(`/employees/${employee.id}`)} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-paper"><img src={employee.avatar} alt="" className="w-7 h-7 rounded-full object-cover"/><span className="text-[13px] font-medium flex-1 truncate">{employee.name}</span><span className="text-[10px] text-muted truncate">{employee.loginId||employee.id} • {employee.department}</span></button>)}
        {!filtered.length&&<div className="text-[12px] text-muted px-3 py-4 text-center">No employee matches.</div>}
        <div className="text-[10px] tracking-[0.08em] font-medium text-muted uppercase px-2 py-1 mt-2">Navigate</div>
        <div className="grid grid-cols-2 gap-1">
          {[["/",'Dashboard',LayoutDashboard],["/employees",'Employees',Users],["/attendance",'Attendance',CalendarCheck],["/leave",'Time Off',CalendarDays],["/payroll",'Payroll',Wallet]].map(([path,label,Icon]:any)=><button key={path} onClick={()=>jump(path)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-paper text-[12px]"><Icon className="w-4 h-4 text-muted"/>{label}</button>)}
        </div>
      </div>
      <div className="px-3 py-2 bg-paper border-t border-line text-[10px] text-muted">Ctrl/⌘ K • Search across {employees.length} PostgreSQL employee records</div>
    </div>
  </div>
}
