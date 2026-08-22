import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/store'
import { Eye, EyeOff, Upload } from 'lucide-react'

const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || ''
const DEMO_EMPLOYEE_PASSWORD = import.meta.env.VITE_DEMO_EMPLOYEE_PASSWORD || ''

export function Login(){
  const { login } = useAuth()
  const nav=useNavigate()
  const [email,setEmail]=useState('admin@dayflow.co')
  const [pass,setPass]=useState(DEMO_ADMIN_PASSWORD)
  const [showPass,setShowPass]=useState(false)
  const [err,setErr]=useState('')
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] bg-paper">
      <div className="bg-[#131517] text-white px-8 lg:px-12 py-10 flex flex-col">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white text-[#131517] grid place-items-center">
            <div className="w-3 h-3 rounded-[3px] border-[2.5px] border-[#131517] relative overflow-hidden"><div className="absolute inset-0 bg-[#131517] w-1/2"/></div>
          </div>
          <div className="text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div>
          <span className="text-[11px] tracking-[0.14em] text-white/40">— Every workday, perfectly aligned.</span>
        </div>
        <div className="flex-1 grid place-items-center">
          <div className="max-w-[420px]">
            <div className="text-[11px] tracking-[0.14em] text-white/40 font-medium uppercase">The pulse of your workplace</div>
            <h1 className="text-[30px] font-semibold leading-[1.05] tracking-tight mt-3">Human operations,<br/>perfectly aligned.</h1>
            <p className="text-[13px] leading-relaxed text-white/60 mt-3">Dayflow is the workforce command center for modern HR teams. Real data, clear decisions, every day.</p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-[11px]">
              <div className="border border-white/10 rounded-lg px-3 py-3"><div className="text-white text-[15px] font-semibold">48</div><div className="text-white/50">Employees</div></div>
              <div className="border border-white/10 rounded-lg px-3 py-3"><div className="text-white text-[15px] font-semibold">92%</div><div className="text-white/50">Attendance</div></div>
              <div className="border border-white/10 rounded-lg px-3 py-3"><div className="text-white text-[15px] font-semibold">Live</div><div className="text-white/50">Dayflow AI</div></div>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-white/30">© 2026 Dayflow Inc. Designed for people-first teams.</div>
      </div>
      <div className="px-6 lg:px-10 py-10 flex flex-col">
        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-[380px] bg-white border border-line rounded-xl p-6">
            <h2 className="text-[18px] font-semibold tracking-tight">Welcome back</h2>
            <p className="text-[13px] text-muted mt-1">Sign in to your workspace</p>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>{setEmail('admin@dayflow.co'); setPass(DEMO_ADMIN_PASSWORD)}} className="text-[11px] px-2.5 py-1.5 rounded-md border border-line bg-ink text-white">Admin demo</button>
              <button onClick={()=>{setEmail('isha@dayflow.co'); setPass(DEMO_EMPLOYEE_PASSWORD)}} className="text-[11px] px-2.5 py-1.5 rounded-md border border-line bg-white">Employee demo</button>
            </div>
            <form onSubmit={e=>{e.preventDefault(); const ok=login(email,pass); if(!ok) setErr('Invalid credentials'); else nav('/')}} className="mt-5 space-y-3">
              <div>
                <label className="text-[11px] font-medium">Login ID or work email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="OIARSH20200001 or you@company.co" className="mt-1 w-full px-3 py-2.5 rounded-lg border border-line bg-paper outline-none text-[13px]" />
              </div>
              <div>
                <label className="text-[11px] font-medium">Password</label>
                <div className="relative mt-1"><input type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 pr-10 rounded-lg border border-line bg-paper outline-none text-[13px]" /><button type="button" onClick={()=>setShowPass(v=>!v)} aria-label={showPass?'Hide password':'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
              </div>
              {err && <div className="text-[12px] text-[#991b1b] bg-[#fdf2f2] border border-[#f0d6d6] rounded-lg px-3 py-2">{err}</div>}
              <button className="w-full py-2.5 rounded-lg bg-ink text-white text-[13px] font-medium hover:bg-black">Sign in</button>
              <div className="text-[11px] text-center text-muted">Don&apos;t have an account? <Link to="/signup" className="text-ink font-medium underline underline-offset-4">Create workspace</Link></div>
            </form>
            <div className="mt-6 grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-lg bg-paper border border-line p-3"><div className="font-medium text-ink">Admin</div><div className="text-muted">admin@dayflow.co</div><div className="text-muted">Demo password from .env</div></div>
              <div className="rounded-lg bg-paper border border-line p-3"><div className="font-medium text-ink">Employee</div><div className="text-muted">isha@dayflow.co</div><div className="text-muted">Demo password from .env</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Signup(){
  const { signup } = useAuth()
  const nav=useNavigate()
  const [company,setCompany]=useState('')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [phone,setPhone]=useState('')
  const [pass,setPass]=useState('')
  const [confirm,setConfirm]=useState('')
  const [showPass,setShowPass]=useState(false)
  const [logo,setLogo]=useState('')
  const [err,setErr]=useState('')
  return (
    <div className="min-h-screen grid place-items-center bg-paper p-6">
      <div className="w-full max-w-[400px] bg-white border border-line rounded-xl p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-ink text-white grid place-items-center text-[11px] font-semibold">◐</div>
          <div className="text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div>
        </div>
        <h2 className="text-[18px] font-semibold tracking-tight mt-5">Create your workspace</h2>
        <p className="text-[13px] text-muted">Start in minutes. No credit card required.</p>
        <form onSubmit={e=>{e.preventDefault(); if(!company||!name||!email||!phone||!pass||!confirm){ setErr('Fill all fields'); return} if(pass.length<8){setErr('Use at least 8 characters');return} if(pass!==confirm){setErr('Passwords do not match');return} const ok=signup(company,name,email,phone,pass); if(!ok) setErr('Email already exists'); else nav('/')}} className="mt-5 space-y-3">
          <input placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-line bg-paper text-[13px]" />
          <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-line bg-paper text-[13px]" />
          <input placeholder="Work email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-line bg-paper text-[13px]" />
          <input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-line bg-paper text-[13px]" />
          <div className="relative"><input placeholder="Password (min 8)" type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} className="w-full px-3 py-2.5 pr-10 rounded-lg border border-line bg-paper text-[13px]" /><button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
          <input placeholder="Confirm password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-line bg-paper text-[13px]" />
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-line bg-paper text-[12px] text-muted cursor-pointer"><Upload className="w-4 h-4"/><span>{logo||'Upload company logo'}</span><input type="file" accept="image/*" className="hidden" onChange={e=>setLogo(e.target.files?.[0]?.name||'')}/></label>
          <p className="text-[11px] text-muted">This creates the company administrator. Employees are provisioned by HR with generated credentials.</p>
          {err && <div className="text-[12px] text-[#991b1b] bg-[#fdf2f2] border border-[#f0d6d6] rounded-lg px-3 py-2">{err}</div>}
          <button className="w-full py-2.5 rounded-lg bg-ink text-white text-[13px] font-medium">Create account</button>
        </form>
        <div className="text-[11px] text-center mt-4 text-muted">Already have an account? <Link to="/login" className="text-ink font-medium underline underline-offset-4">Sign in</Link></div>
      </div>
    </div>
  )
}
