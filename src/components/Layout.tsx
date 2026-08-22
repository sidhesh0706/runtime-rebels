import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { Users, CalendarCheck, CalendarDays, Settings, HelpCircle, LogOut, Menu, X, LogIn, LogOut as LogOutIcon, User as UserIcon, CheckCircle2, Search as SearchIcon } from 'lucide-react'
import { useAuth, getMyEmployee } from '../lib/store'
import { useState, useRef, useEffect } from 'react'
import CommandPalette from './CommandPalette'

const navItems = [
  { to:'/employees', label:'Employees', icon: Users },
  { to:'/attendance', label:'Attendance', icon: CalendarCheck },
  { to:'/time-off', label:'Time Off', icon: CalendarDays },
]

export default function Layout({children}:{children:React.ReactNode}){
  const { user, logout, employees, attendance, checkIn, checkOut } = useAuth()
  const nav=useNavigate()
  const loc=useLocation()
  const [open,setOpen]=useState(false)
  const [profileOpen,setProfileOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    function onDoc(e:MouseEvent){ if(ref.current && !ref.current.contains(e.target as Node)) setProfileOpen(false)}
    document.addEventListener('mousedown', onDoc); return ()=>document.removeEventListener('mousedown', onDoc)
  },[])

  if(!user) return <>{children}</>

  // find own employee record for checkin status — use helper for demo accounts
  const myEmp = getMyEmployee(user, employees)
  const today=new Date().toISOString().slice(0,10)
  const myAtt=attendance.find(a=>a.employeeId===myEmp?.id && a.date===today)
  const isCheckedIn = !!(myAtt && myAtt.checkIn && !myAtt.checkOut)
  const hasCheckedOut = !!(myAtt && myAtt.checkIn && myAtt.checkOut)
  const dotColor = isCheckedIn ? 'bg-[#1a6b4a]' : hasCheckedOut ? 'bg-[#0f766e]' : 'bg-[#b42318]'
  const dotTitle = isCheckedIn ? 'Checked in — present (green)' : hasCheckedOut ? 'Checked out' : 'Not checked in — red'

  function handleCheckIn(){
    if(!myEmp) return
    checkIn(myEmp.id)
    setProfileOpen(false)
  }
  function handleCheckOut(){
    if(!myEmp) return
    checkOut(myEmp.id)
    setProfileOpen(false)
  }

  const profileLink = myEmp ? `/employees/${myEmp.id}` : '/employees'

  return (
    <div className="min-h-screen flex bg-[#faf9f7]">
      <CommandPalette />
      {open && <div onClick={()=>setOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden"/>}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-[230px] bg-[#0f1112] text-white flex flex-col transition duration-200 ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-[18px] flex items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-white text-[#0f1112] grid place-items-center">
              <div className="w-3 h-3 rounded-[3px] border-[2.5px] border-[#0f1112] relative overflow-hidden"><div className="absolute inset-0 bg-[#0f1112] w-1/2"/></div>
            </div>
            <div className="text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div>
          </div>
          <button onClick={()=>setOpen(false)} className="lg:hidden p-1.5 rounded-md hover:bg-white/10"><X className="w-4 h-4"/></button>
        </div>

        <nav className="px-3 py-5 flex-1 overflow-auto">
          <div className="text-[10px] tracking-[0.14em] text-white/35 font-medium uppercase px-2 mb-2">Workspace</div>
          <div className="space-y-0.5">
            {navItems.map(i=>{
              const active = loc.pathname.startsWith(i.to) || (i.to==='/time-off' && loc.pathname.startsWith('/leave'))
              return (
                <NavLink key={i.to} to={i.to} className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-[10px] text-[13px] transition ${active?'bg-white/[0.08] text-white':'text-white/60 hover:text-white hover:bg-white/[0.05]'}`}>
                  <i.icon className="w-[16px] h-[16px] opacity-80"/>{i.label}
                </NavLink>
              )
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.07]">
            <div className="text-[10px] tracking-[0.14em] text-white/35 font-medium uppercase px-2 mb-2">Account</div>
            <div className="space-y-0.5">
              <NavLink to="/settings" className={({isActive})=>`flex items-center gap-2.5 px-2.5 py-[7px] rounded-[10px] text-[13px] ${isActive?'bg-white/[0.08] text-white':'text-white/60 hover:text-white hover:bg-white/[0.05]'}`}><Settings className="w-[16px] h-[16px] opacity-80"/>Settings</NavLink>
              <a href="#" onClick={e=>e.preventDefault()} className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-[10px] text-[13px] text-white/60 hover:text-white hover:bg-white/[0.05]"><HelpCircle className="w-[16px] h-[16px] opacity-80"/>Help</a>
            </div>
          </div>


        </nav>

        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-[10px] hover:bg-white/[0.04] transition">
            <div className="relative">
              <img src={user.avatar} className="w-8 h-8 rounded-full object-cover"/>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0f1112] ${dotColor}`} title={dotTitle}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium leading-none truncate">{user.name}</div>
              <div className="text-[11px] text-white/45 capitalize truncate">{user.role} • {user.email.split('@')[0]}</div>
            </div>
            <button onClick={()=>{logout(); nav('/login')}} className="p-1.5 rounded-md hover:bg-white/10 text-white/55 hover:text-white" title="Log out"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-line">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-[54px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>setOpen(true)} className="lg:hidden p-2 rounded-lg border border-line bg-white"><Menu className="w-4 h-4"/></button>
              <div className="hidden lg:flex items-center gap-1 text-[13px]">
                <span className="text-muted">Workspace</span>
                <span className="text-muted-2">/</span>
                <span className="font-medium capitalize">{loc.pathname.split('/')[1] || 'employees'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={()=>{
                const ev=new KeyboardEvent('keydown',{key:'k', ctrlKey:true, bubbles:true}); window.dispatchEvent(ev)
              }} className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] border border-line bg-paper text-[12px] font-medium hover:bg-white">
                <SearchIcon className="w-3.5 h-3.5"/> ⌘K
              </button>
              {/* Check In / Out — functional */}
              <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-[10px] bg-paper border border-line">
                <button onClick={handleCheckIn} disabled={!!myAtt?.checkIn} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium inline-flex items-center gap-1.5 ${myAtt?.checkIn?'bg-white border border-line text-muted cursor-default':'bg-[#1a6b4a] text-white hover:bg-[#155a3d]'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5"/>{myAtt?.checkIn ? (hasCheckedOut? `Done ${myAtt.checkIn}→${myAtt.checkOut}` : `Checked In ${myAtt.checkIn}`):'Check In'}
                </button>
                <button onClick={handleCheckOut} disabled={!isCheckedIn} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium inline-flex items-center gap-1.5 border ${!isCheckedIn?'bg-white border-line text-muted cursor-default':'bg-white border-line hover:bg-paper text-ink'}`}>
                  <LogOutIcon className="w-3.5 h-3.5"/>Check Out
                </button>
              </div>

              {/* Avatar dropdown */}
              <div className="relative" ref={ref}>
                <button onClick={()=>setProfileOpen(v=>!v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-line bg-white hover:bg-paper transition">
                  <div className="relative">
                    <img src={user.avatar} className="w-7 h-7 rounded-full object-cover"/>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] rounded-full border-2 border-white ${dotColor}`} title={dotTitle}/>
                  </div>
                  <span className="hidden sm:block text-[12px] font-medium">{user.name.split(' ')[0]}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-line rounded-[12px] shadow-card overflow-hidden py-1">
                    <div className="px-3 py-2.5 border-b border-line">
                      <div className="text-[13px] font-medium leading-none">{user.name}</div>
                      <div className="text-[11px] text-muted">{user.email}</div>
                      <div className="text-[11px] text-muted-2 mt-1">{(user as any).loginId || 'Login ID auto-generated'}</div>
                    </div>
                    <Link to={profileLink} onClick={()=>setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-paper"><UserIcon className="w-4 h-4 text-muted"/>My Profile — editable</Link>
                    <button onClick={handleCheckIn} disabled={!!myAtt?.checkIn} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-paper text-left sm:hidden disabled:opacity-50"><LogIn className="w-4 h-4 text-muted"/>{myAtt?.checkIn ? `Checked In ${myAtt.checkIn}`:'Check In'}</button>
                    <button onClick={handleCheckOut} disabled={!isCheckedIn} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-paper text-left sm:hidden disabled:opacity-50"><LogOutIcon className="w-4 h-4 text-muted"/>Check Out {myAtt?.checkOut? `(${myAtt.checkOut})`:''}</button>
                    <button onClick={()=>{logout(); nav('/login')}} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-paper text-left"><LogOut className="w-4 h-4 text-muted"/>Log Out</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1280px] mx-auto w-full px-4 lg:px-8 py-6 lg:py-7 flex-1">{children}</main>
      </div>
    </div>
  )
}
