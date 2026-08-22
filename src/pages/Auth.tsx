import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, DEMO_ADMIN_PASSWORD, DEMO_EMPLOYEE_PASSWORD } from '../lib/store'
import { Eye, EyeOff, Upload, Building2 } from 'lucide-react'

export function Login(){
  const { login } = useAuth()
  const nav=useNavigate()
  const [email,setEmail]=useState('admin@dayflow.co')
  const [pass,setPass]=useState(DEMO_ADMIN_PASSWORD)
  const [show,setShow]=useState(false)
  const [err,setErr]=useState('')
  const [demo,setDemo]=useState<'admin'|'employee'>('admin')
  const [dbOnline,setDbOnline]=useState(false)
  const [submitting,setSubmitting]=useState(false)
  useEffect(()=>{fetch('/api/health').then(response=>response.ok?response.json():Promise.reject()).then(result=>setDbOnline(result.database==='connected')).catch(()=>setDbOnline(false))},[])
  async function doLogin(e?:React.FormEvent){
    if(e) e.preventDefault()
    setSubmitting(true)
    const ok=await login(email.trim(), pass.trim())
    setSubmitting(false)
    if(!ok) setErr(`Invalid credentials. Try Admin: admin@dayflow.co / ${DEMO_ADMIN_PASSWORD}  or Employee: isha@dayflow.co / ${DEMO_EMPLOYEE_PASSWORD}. If still fails, click Reset Demo below.`)
    else { setErr(''); nav('/') }
  }
  function selectAdmin(){ setDemo('admin'); setEmail('admin@dayflow.co'); setPass(DEMO_ADMIN_PASSWORD) }
  function selectEmployee(){ setDemo('employee'); setEmail('isha@dayflow.co'); setPass(DEMO_EMPLOYEE_PASSWORD) }
  function resetDemo(){
    try{
      localStorage.removeItem('dayflow_users')
      localStorage.removeItem('dayflow_session')
      localStorage.removeItem('dayflow_v8')
      localStorage.removeItem('dayflow_v7')
      localStorage.removeItem('dayflow_v6')
      localStorage.removeItem('dayflow_v5')
      localStorage.removeItem('dayflow_v4')
      localStorage.removeItem('dayflow_v3')
      localStorage.removeItem('dayflow_v2')
      localStorage.removeItem('dayflow_v2_attendance')
      sessionStorage.clear()
    }catch{}
    location.reload()
  }
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.92fr] bg-paper">
      <div className="bg-[#0f1112] text-white px-8 lg:px-12 py-10 flex flex-col relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-white text-[#0f1112] grid place-items-center">
            <div className="w-3 h-3 rounded-[3px] border-[2.5px] border-[#0f1112] relative overflow-hidden"><div className="absolute inset-0 bg-[#0f1112] w-1/2"/></div>
          </div>
          <div className="text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div>
          <span className="text-[11px] tracking-[0.12em] text-white/40 hidden sm:inline">— Workforce, aligned.</span>
        </div>
        <div className="flex-1 grid place-items-center">
          <div className="max-w-[420px] w-full">
            <div className="text-[10px] tracking-[0.14em] text-white/35 font-medium uppercase">The pulse of your workplace</div>
            <h1 className="text-[30px] font-semibold leading-[1.05] tracking-tight mt-3 text-white">Human operations,<br/>perfectly aligned.</h1>
            <p className="text-[13px] leading-relaxed text-white/55 mt-3">Dayflow is the workforce command center for modern HR teams. Real data, clear decisions, every day.</p>
          </div>
        </div>
        <div className="text-[11px] text-white/25">© 2026 Dayflow Inc. People-first HR platform.</div>
      </div>
      <div className="px-6 lg:px-10 py-10 flex flex-col bg-paper">
        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-[392px] bg-white border border-line rounded-[12px] p-6 shadow-soft">
            <h2 className="text-[18px] font-semibold tracking-tight">Welcome back</h2>
            <p className="text-[13px] text-muted mt-1">Sign in with your work email or Login ID</p>
            <div className={`mt-3 inline-flex items-center gap-2 text-[11px] px-2.5 py-1 rounded-full border ${dbOnline?'bg-[#edf4ef] border-[#d6e8db] text-[#1a6b4a]':'bg-[#fdf2f2] border-[#f0d6d6] text-[#7a2a2a]'}`}><span className={`w-1.5 h-1.5 rounded-full ${dbOnline?'bg-[#1a6b4a]':'bg-[#b42318]'}`}/>{dbOnline?'PostgreSQL connected':'Database offline'}</div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={selectAdmin} className={`flex-1 h-[32px] text-[11px] rounded-lg border font-medium leading-none inline-flex items-center justify-center transition ${demo==='admin' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-paper'}`}>Admin</button>
              <button type="button" onClick={selectEmployee} className={`flex-1 h-[32px] text-[11px] rounded-lg border font-medium leading-none inline-flex items-center justify-center transition ${demo==='employee' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-paper'}`}>Employee</button>
            </div>
            <form onSubmit={doLogin} className="mt-5 space-y-3">
              <div>
                <label className="text-[11px] font-medium">Login ID / Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.co or DFAM1001" className="mt-1 w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper outline-none text-[13px] focus:border-ink" />
              </div>
              <div>
                <label className="text-[11px] font-medium">Password</label>
                <div className="relative mt-1">
                  <input type={show?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper outline-none text-[13px] pr-10 focus:border-ink" />
                  <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-black/5 text-muted">{show? <EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                </div>
              </div>
              {err && <div className="text-[12px] text-[#7a2a2a] bg-[#fdf2f2] border border-[#f0d6d6] rounded-[10px] px-3 py-2">{err}</div>}
              <button disabled={submitting||!dbOnline} className="w-full py-2.5 rounded-[10px] bg-ink text-white text-[13px] font-medium hover:bg-black transition disabled:opacity-50">{submitting?'Connecting…':'Log in'}</button>
              {demo==='admin' && <div className="text-[11px] text-center text-muted">Don&apos;t have an account? <Link to="/signup" className="text-ink font-medium underline underline-offset-4">Sign up</Link></div>}
            </form>
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
  const [role]=useState<'admin'|'employee'>('admin')
  const [err,setErr]=useState('')
  const [show,setShow]=useState(false)
  const [logoName,setLogoName]=useState<string>('')

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    if(!company||!name||!email||!phone||!pass||!confirm){ setErr('Fill all fields'); return}
    if(pass!==confirm){ setErr('Passwords do not match'); return}
    if(pass.length<6){ setErr('Password must be at least 6 characters'); return}
    const ok=await signup(name,email,pass,'admin',{companyName: company, phone})
    if(!ok) setErr('Email already exists'); else nav('/')
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="bg-[#0f1112] text-white px-6 lg:px-10 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-white text-[#0f1112] grid place-items-center"><div className="w-3 h-3 rounded-[3px] border-[2.5px] border-[#0f1112] relative overflow-hidden"><div className="absolute inset-0 bg-[#0f1112] w-1/2"/></div></div>
          <div className="text-[13px] font-semibold tracking-[0.14em]">DAYFLOW</div>
        </div>
        <div className="text-[11px] text-white/50">Already have an account? <Link to="/login" className="text-white font-medium underline underline-offset-4">Sign in</Link></div>
      </div>
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-[520px] bg-white border border-line rounded-[12px] shadow-soft overflow-hidden">
          <div className="px-6 pt-6">
            <h2 className="text-[18px] font-semibold tracking-tight">Create your workspace</h2>
            <p className="text-[13px] text-muted mt-1">Set up your company in minutes. Login ID is auto-generated.</p>
          </div>
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium flex items-center gap-1"><Building2 className="w-3 h-3"/>Company Name</label>
                <input placeholder="Acme Inc." value={company} onChange={e=>setCompany(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink" />
              </div>
              <div>
                <label className="text-[11px] font-medium">Full Name</label>
                <input placeholder="Aarav Mehta" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink" />
              </div>
              <div>
                <label className="text-[11px] font-medium">Email</label>
                <input placeholder="you@company.co" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink" />
              </div>
              <div>
                <label className="text-[11px] font-medium">Phone</label>
                <input placeholder="+91 90000 00000" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink" />
              </div>
              <div>
                <label className="text-[11px] font-medium">Upload Logo</label>
                <label className="mt-1 flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-[10px] border border-dashed border-line bg-paper text-[13px] cursor-pointer hover:border-ink/30">
                  <span className="text-muted truncate text-[12px]">{logoName? logoName : 'Choose file — PNG, SVG'}</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium border border-line bg-white px-2.5 py-1 rounded-lg"><Upload className="w-3 h-3"/>Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e=> setLogoName(e.target.files?.[0]?.name||'') }/>
                </label>
              </div>
              <div>
                <label className="text-[11px] font-medium">Password</label>
                <div className="relative mt-1">
                  <input placeholder="••••••••" type={show?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} className="w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper text-[13px] pr-9 outline-none focus:border-ink" />
                  <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink">{show? <EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium">Confirm Password</label>
                <input placeholder="••••••••" type={show?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-[10px] border border-line bg-paper text-[13px] outline-none focus:border-ink" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 py-2 rounded-[10px] border text-[12px] font-medium bg-ink text-white border-ink text-center">HR / Admin</div>
            </div>
            {/* login id preview */}
            <div className="rounded-[10px] bg-paper border border-line p-3 flex items-center justify-between">
              <div><div className="text-[11px] font-medium">Your Login ID</div><div className="text-[11px] text-muted">Auto-generated from company + name</div></div>
              <div className="font-mono text-[12px] font-medium bg-white border border-line px-2.5 py-1.5 rounded-lg">
                {company? company.slice(0,2).toUpperCase(): 'DF'}{(name.split(' ')[0]?.[0]||'A')+(name.split(' ')[1]?.[0]||'X')}{(String(Date.now()).slice(-4))}
              </div>
            </div>
            {err && <div className="text-[12px] text-[#7a2a2a] bg-[#fdf2f2] border border-[#f0d6d6] rounded-[10px] px-3 py-2">{err}</div>}
            <button className="w-full py-2.5 rounded-[10px] bg-ink text-white text-[13px] font-medium hover:bg-black transition">Create workspace</button>
            <div className="text-[11px] text-center text-muted leading-relaxed">By signing up you agree to our Terms. Admin user cannot be created via public link — request via HR Officer.</div>
            <div className="text-[11px] text-muted bg-[#edf4ef] border border-[#d6e8db] rounded-[10px] p-3 leading-relaxed"><span className="font-medium text-ink">Note:</span> Login ID & temp password are system-generated. You can change them after first login in <span className="font-medium">My Profile → Security</span>.</div>
          </form>
        </div>
      </div>
    </div>
  )
}
