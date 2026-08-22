import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, CalendarDays, Wallet, Activity, Sparkles, ShieldCheck, Settings, LogOut, Menu, X, Search, UserRound, LogIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/store'
import CommandPalette from './CommandPalette'

const workspace=[
  {to:'/',label:'Dashboard',icon:LayoutDashboard},
  {to:'/employees',label:'Employees',icon:Users},
  {to:'/attendance',label:'Attendance',icon:CalendarCheck},
  {to:'/leave',label:'Time Off',icon:CalendarDays},
  {to:'/payroll',label:'Payroll',icon:Wallet},
]
const insights=[{to:'/pulse',label:'Workforce Pulse',icon:Activity},{to:'/ai',label:'DayFlow AI',icon:Sparkles},{to:'/guard',label:'Smart Leave Guard',icon:ShieldCheck}]

export default function Layout({children}:{children:React.ReactNode}){
  const {user,logout,syncStatus,employees,attendance,checkIn,checkOut,data}=useAuth()
  const navigate=useNavigate();const location=useLocation()
  const [open,setOpen]=useState(false);const [profileOpen,setProfileOpen]=useState(false);const [attendanceBusy,setAttendanceBusy]=useState(false);const [attendanceError,setAttendanceError]=useState('')
  const profileRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{function close(event:MouseEvent){if(profileRef.current&&!profileRef.current.contains(event.target as Node))setProfileOpen(false)}document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[])
  if(!user)return <>{children}</>
  const me=employees.find(employee=>employee.id===user.employeeId)||employees.find(employee=>employee.email===user.email)
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const todayAttendance=attendance.find(row=>row.employeeId===me?.id&&row.date===today)
  const checkedIn=!!todayAttendance?.checkIn&&!todayAttendance?.checkOut
  const completed=!!todayAttendance?.checkOut
  const statusColor=checkedIn?'bg-emerald-500':completed?'bg-teal-400':'bg-red-500'
  async function runAttendance(action:'in'|'out'){
    if(!me)return
    setAttendanceBusy(true);setAttendanceError('')
    const result=await(action==='in'?checkIn(me.id):checkOut(me.id))
    if(!result.ok)setAttendanceError(result.error||'Attendance action failed')
    setAttendanceBusy(false)
  }
  const avatar=me?.avatar||user.avatar
  const profilePath=me?`/employees/${encodeURIComponent(me.id)}`:'/profile'
  return <div className="min-h-screen flex bg-[#faf9f7]">
    <CommandPalette/>
    {open&&<button aria-label="Close navigation" onClick={()=>setOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden"/>}
    <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 w-[240px] h-screen bg-[#131517] text-white flex flex-col transition ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.07]"><NavLink to="/" className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-white text-[#131517] grid place-items-center"><div className="w-3 h-3 rounded-[3px] border-[2.5px] border-[#131517] relative overflow-hidden"><div className="absolute inset-0 bg-[#131517] w-1/2"/></div></div><div><div className="text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div><div className="text-[9px] text-white/35 truncate max-w-[145px]">{data.company?.name||'Workforce workspace'}</div></div></NavLink><button onClick={()=>setOpen(false)} className="lg:hidden p-1.5 rounded-md hover:bg-white/10"><X className="w-4 h-4"/></button></div>
      <nav className="px-3 py-4 space-y-5 overflow-auto flex-1">
        <div><div className="px-2 mb-2 text-[10px] tracking-[0.14em] text-white/40 font-medium uppercase">Workspace</div><div className="space-y-0.5">{workspace.map(item=><NavLink key={item.to} to={item.to} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition ${isActive?'bg-[#232628] text-white':'text-white/65 hover:text-white hover:bg-white/[0.06]'}`}><item.icon className="w-4 h-4 opacity-80"/>{item.label}</NavLink>)}</div></div>
        <div><div className="px-2 mb-2 text-[10px] tracking-[0.14em] text-white/40 font-medium uppercase">Insights</div><div className="space-y-0.5">{insights.filter(item=>user.role!=='employee'||item.to==='/ai').map(item=><NavLink key={item.to} to={item.to} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition ${isActive?'bg-[#232628] text-white':'text-white/65 hover:text-white hover:bg-white/[0.06]'}`}><item.icon className="w-4 h-4 opacity-80"/>{item.label}</NavLink>)}</div></div>
        {user.role!=='employee'&&<div className="pt-3 border-t border-white/[0.07]"><NavLink to="/settings" className={({isActive})=>`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] ${isActive?'bg-[#232628] text-white':'text-white/65 hover:text-white hover:bg-white/[0.06]'}`}><Settings className="w-4 h-4 opacity-80"/>Settings</NavLink></div>}
      </nav>
      <div className="p-3 border-t border-white/[0.07]"><div className="px-2 pb-2 flex items-center gap-2 text-[10px] text-white/45"><span className={`w-1.5 h-1.5 rounded-full ${syncStatus==='ready'?'bg-emerald-400':syncStatus==='error'||syncStatus==='offline'?'bg-red-400':'bg-amber-300'}`}/>{syncStatus==='ready'?'Local PostgreSQL connected':syncStatus==='saving'?'Saving locally…':syncStatus==='loading'?'Loading database…':'Local API needs attention'}</div><NavLink to={profilePath} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04]"><div className="relative"><img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover"/><span className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#131517] ${statusColor}`}/></div><div className="flex-1 min-w-0"><div className="text-[13px] font-medium leading-none truncate">{user.name}</div><div className="text-[11px] text-white/50 capitalize">{user.role} • {user.loginId||user.email.split('@')[0]}</div></div></NavLink></div>
    </aside>
    <div className="flex-1 min-w-0">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-line"><div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-[56px] flex items-center justify-between gap-3"><div className="flex items-center gap-3"><button onClick={()=>setOpen(true)} className="lg:hidden p-2 rounded-lg border border-line"><Menu className="w-4 h-4"/></button><div className="hidden sm:block text-[12px]"><span className="text-muted">Workspace</span><span className="mx-1.5 text-muted-2">/</span><span className="font-medium capitalize">{location.pathname.split('/')[1]||'dashboard'}</span></div></div><div className="flex items-center gap-2"><button onClick={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}))} className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-paper text-[11px] font-medium"><Search className="w-3.5 h-3.5"/>Ctrl K</button><div className="hidden sm:flex items-center gap-1.5"><button disabled={attendanceBusy||!!todayAttendance?.checkIn} onClick={()=>runAttendance('in')} className="px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-medium disabled:bg-paper disabled:text-muted disabled:border disabled:border-line"><LogIn className="inline w-3.5 h-3.5 mr-1"/>{todayAttendance?.checkIn?completed?`Done ${todayAttendance.checkIn}–${todayAttendance.checkOut}`:`In ${todayAttendance.checkIn}`:'Check In'}</button><button disabled={attendanceBusy||!checkedIn} onClick={()=>runAttendance('out')} className="px-3 py-1.5 rounded-lg border border-line text-[11px] font-medium disabled:opacity-40">Check Out</button></div><div className="relative" ref={profileRef}><button onClick={()=>setProfileOpen(value=>!value)} className="flex items-center gap-2 rounded-full border border-line p-1 pr-2"><img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover"/><span className="hidden sm:block text-[11px] font-medium">{user.name.split(' ')[0]}</span></button>{profileOpen&&<div className="absolute right-0 mt-2 w-56 bg-white border border-line rounded-xl shadow-card py-1 overflow-hidden"><div className="px-3 py-2.5 border-b border-line"><div className="text-[12px] font-medium">{user.name}</div><div className="text-[10px] text-muted truncate">{user.email}</div></div><button onClick={()=>{setProfileOpen(false);navigate(profilePath)}} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-paper"><UserRound className="w-4 h-4 text-muted"/>My Profile</button><button onClick={()=>{logout();navigate('/login')}} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-paper"><LogOut className="w-4 h-4 text-muted"/>Log Out</button></div>}</div></div></div>{attendanceError&&<div className="absolute top-[56px] right-4 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1">{attendanceError}</div>}</header>
      <main className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6 lg:py-8">{children}</main>
    </div>
  </div>
}
