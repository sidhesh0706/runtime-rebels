import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, CalendarDays, Wallet, Activity, Sparkles, ShieldCheck, Settings, HelpCircle, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../lib/store'
import { useState } from 'react'

const workspace = [
  { to:'/', label:'Dashboard', icon: LayoutDashboard },
  { to:'/employees', label:'Employees', icon: Users },
  { to:'/attendance', label:'Attendance', icon: CalendarCheck },
  { to:'/leave', label:'Leave', icon: CalendarDays },
  { to:'/payroll', label:'Payroll', icon: Wallet },
]
const insights = [
  { to:'/pulse', label:'Workforce Pulse', icon: Activity },
  { to:'/ai', label:'Dayflow AI', icon: Sparkles },
  { to:'/guard', label:'Smart Leave Guard', icon: ShieldCheck },
]

export default function Layout({children}:{children:React.ReactNode}){
  const { user, logout } = useAuth()
  const nav=useNavigate()
  const [open,setOpen]=useState(false)
  if(!user) return <>{children}</>
  return (
    <div className="min-h-screen flex bg-[#faf9f7]">
      {open && <div onClick={()=>setOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden"/>}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-[240px] bg-[#131517] text-white flex flex-col transition ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-white text-[#131517] grid place-items-center">
              <div className="w-3 h-3 rounded-[3px] border-[2.5px] border-[#131517] relative overflow-hidden">
                <div className="absolute inset-0 bg-[#131517] w-1/2"/>
              </div>
            </div>
            <div className="text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div>
          </div>
          <button onClick={()=>setOpen(false)} className="lg:hidden p-1.5 rounded-md hover:bg-white/10"><X className="w-4 h-4"/></button>
        </div>

        <nav className="px-3 py-4 space-y-5 overflow-auto flex-1">
          <div>
            <div className="px-2 mb-2 text-[10px] tracking-[0.14em] text-white/40 font-medium uppercase">Workspace</div>
            <div className="space-y-0.5">
              {workspace.map(i=>(
                <NavLink key={i.to} to={i.to} className={({isActive})=>`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition ${isActive?'bg-[#232628] text-white':'text-white/65 hover:text-white hover:bg-white/[0.06]'}`}>
                  <i.icon className="w-[16px] h-[16px] opacity-80"/>{i.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div>
            <div className="px-2 mb-2 text-[10px] tracking-[0.14em] text-white/40 font-medium uppercase">Insights</div>
            <div className="space-y-0.5">
              {insights.map(i=>(
                <NavLink key={i.to} to={i.to} className={({isActive})=>`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition ${isActive?'bg-[#232628] text-white':'text-white/65 hover:text-white hover:bg-white/[0.06]'}`}>
                  <i.icon className="w-[16px] h-[16px] opacity-80"/>{i.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.07]">
            <div className="space-y-0.5">
              <NavLink to="/settings" className={({isActive})=>`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] ${isActive?'bg-[#232628] text-white':'text-white/65 hover:text-white hover:bg-white/[0.06]'}`}><Settings className="w-[16px] h-[16px] opacity-80"/>Settings</NavLink>
              <a href="#" className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-white/65 hover:text-white hover:bg-white/[0.06]"><HelpCircle className="w-[16px] h-[16px] opacity-80"/>Help</a>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition">
            <img src={user.avatar} className="w-8 h-8 rounded-full object-cover"/>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium leading-none truncate">{user.name}</div>
              <div className="text-[11px] text-white/50 capitalize">{user.role} • {user.email.split('@')[0]}</div>
            </div>
            <button onClick={()=>{logout(); nav('/login')}} className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-line flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div>
          <button onClick={()=>setOpen(true)} className="p-2 rounded-lg border border-line"><Menu className="w-4 h-4"/></button>
        </div>
        <main className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
