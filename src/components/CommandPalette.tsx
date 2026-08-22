import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, CalendarCheck, CalendarDays } from 'lucide-react'
import { useAuth } from '../lib/store'
import { EmployeeAvatar } from './EmployeeAvatar'

export default function CommandPalette(){
  const [open,setOpen]=useState(false)
  const [q,setQ]=useState('')
  const nav=useNavigate()
  const { employees } = useAuth()
  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); setOpen(v=>!v) }
      if(e.key==='Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey)
  },[])
  if(!open) return null
  const filtered = employees.filter(e=> e.name.toLowerCase().includes(q.toLowerCase()) || e.loginId.toLowerCase().includes(q.toLowerCase()) ).slice(0,6)
  return (
    <div className="fixed inset-0 z-[60] grid place-items-start pt-[20vh] p-4">
      <div onClick={()=>setOpen(false)} className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"/>
      <div className="relative bg-white border border-line rounded-[12px] w-full max-w-lg shadow-card overflow-hidden mx-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <Search className="w-4 h-4 text-muted"/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search employees, jump to Attendance/Time Off... (⌘K)" className="flex-1 outline-none text-[13px]"/>
        </div>
        <div className="p-2 max-h-80 overflow-auto">
          <div className="text-[11px] tracking-[0.06em] font-medium text-muted uppercase px-2 py-1">Employees</div>
          {filtered.map(e=>(
            <button key={e.id} onClick={()=>{ setOpen(false); nav(`/employees/${e.id}`)}} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-paper">
              <EmployeeAvatar employee={e} className="w-7 h-7"/><span className="text-[13px] font-medium">{e.name}</span><span className="text-[11px] text-muted">{e.loginId} • {e.department}</span>
            </button>
          ))}
          {filtered.length===0 && q && <div className="text-[12px] text-muted px-3 py-4 text-center">No match</div>}
        </div>
      </div>
    </div>
  )
}
