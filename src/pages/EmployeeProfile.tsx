import { useParams, Link } from 'react-router-dom'
import { useAuth, getMyEmployee } from '../lib/store'
import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, Mail, Phone, MapPin, ShieldAlert, Pencil, Plus, Trash2, Building2, Users, CalendarCheck, Award, FileText, TrendingUp, Flame, X, Check, Star, Lock, Shield } from 'lucide-react'
import { formatCurrency } from '../lib/utils'

function Tenure({joinDate}:{joinDate:string}){
  const start=new Date(joinDate); const now=new Date(); const diffMs=now.getTime()-start.getTime()
  const years=Math.floor(diffMs/(365.25*24*3600*1000)); const months=Math.floor((diffMs % (365.25*24*3600*1000))/(30*24*3600*1000))
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-[10px] bg-ink text-white grid place-items-center"><TrendingUp className="w-5 h-5"/></div>
      <div><div className="text-[13px] font-semibold">{years}y {months}m at Dayflow</div><div className="text-[11px] text-muted">Joined {joinDate} • {years>3? 'Senior tenure':'Growing tenure'}</div></div>
    </div>
  )
}
function Streak({attendance, employeeId}:{attendance:any[], employeeId:string}){
  const records=attendance.filter(a=>a.employeeId===employeeId).sort((a,b)=> b.date.localeCompare(a.date))
  let streak=0; for(const r of records){ if(['Present','Late','Half-day'].includes(r.status)) streak++; else break; if(streak>6) break }
  return (
    <div className="border border-line rounded-[10px] p-3 bg-paper flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-full bg-[#fef7e7] border border-[#f2e0a6] grid place-items-center"><Flame className="w-4 h-4 text-[#b54708]"/></span>
      <div className="flex-1"><div className="text-[12px] font-semibold">{streak} day streak</div><div className="text-[11px] text-muted">On-time • Last 7 days</div></div>
      <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-white border border-line">{Math.round((streak/7)*100)}%</span>
    </div>
  )
}

export default function EmployeeProfile(){
  const { id: paramId } = useParams()
  const { employees, user, attendance, leaves, data, updateEmployee, updateSecurity } = useAuth()
  const myEmpResolved = getMyEmployee(user, employees)
  const ownId = myEmpResolved?.id
  const id = paramId || ownId
  const emp = employees.find(e=>e.id===id)
  const isAdmin = user?.role==='admin'
  const isOwn = ownId===id
  const canEdit = isOwn // Resume: only own is editable, others view-only
  const canEditPrivate = isOwn || isAdmin // Private: HR can manage any employee's private info
  const privateVisible = isOwn || isAdmin
  // Salary: per User Type table both view own salary view-only; HR views payroll, Employee views own salary — no edit
  const salaryVisible = isOwn || isAdmin
  const securityVisible = isOwn
  const [tab,setTab]=useState<'resume'|'private'|'salary'|'security'>('resume')

  // header edit
  const [editingHeader,setEditingHeader]=useState(false)
  const [hName,setHName]=useState(''); const [hEmail,setHEmail]=useState(''); const [hPhone,setHPhone]=useState(''); const [hCompany,setHCompany]=useState(''); const [hDept,setHDept]=useState(''); const [hManager,setHManager]=useState(''); const [hLocation,setHLocation]=useState(''); const [avatarUrl,setAvatarUrl]=useState(''); const [showAvatar,setShowAvatar]=useState(false)
  // resume inline
  const [editingAbout,setEditingAbout]=useState(false); const [tmpAbout,setTmpAbout]=useState('')
  const [editingLove,setEditingLove]=useState(false); const [tmpLove,setTmpLove]=useState('')
  const [editingHobby,setEditingHobby]=useState(false); const [tmpHobby,setTmpHobby]=useState('')
  const [showAddSkill,setShowAddSkill]=useState(false); const [newSkill,setNewSkill]=useState('')
  const [showAddCert,setShowAddCert]=useState(false); const [newCert,setNewCert]=useState('')

  // private fields — must be before early return to keep hooks order
  const [pDob,setPDob]=useState(emp?.dob||''); const [pAddr,setPAddr]=useState(emp?.address||''); const [pMarital,setPMarital]=useState<'Single'|'Married'|'Divorced'>((emp?.maritalStatus as any)||'Single'); const [pEmerg,setPEmerg]=useState(emp?.emergencyContact||''); const [pBank,setPBank]=useState(emp?.bankAccount||''); const [pBankName,setPBankName]=useState(emp?.bankName||''); const [pIfsc,setPIfsc]=useState(emp?.ifsc||''); const [pGender,setPGender]=useState(emp?.gender||'Male'); const [pUan,setPUan]=useState(emp?.uan||''); const [pNation,setPNation]=useState(emp?.nationality||'Indian')
  // salary local state — must also be before early return
  const [mWage,setMWage]=useState(emp?.monthlyWage||50000)
  const [yWage,setYWage]=useState(emp?.yearlyWage|| (emp?.monthlyWage||50000)*12)
  const [wDaysWeek,setWDaysWeek]=useState(emp?.workingDaysPerWeek||5)
  const [breakHrs,setBreakHrs]=useState(emp?.breakTimeHrs||1)
  const [pfEmpRate,setPfEmpRate]=useState(emp?.pfEmployerRate||12)
  const [pfEeRate,setPfEeRate]=useState(emp?.pfEmployeeRate||12)
  const [ptax,setPtax]=useState(emp?.professionalTax||200)
  const [comps,setComps]=useState(()=> JSON.parse(JSON.stringify(emp?.salaryComponents||[])))
  // security local state
  const [secCurr,setSecCurr]=useState(''); const [secNew,setSecNew]=useState(''); const [secConfirm,setSecConfirm]=useState(''); const [secMsg,setSecMsg]=useState<{type:'success'|'error', text:string} | null>(null)

  // Keep form state in sync when navigating between employees (fixes stale Private/Salary forms)
  useEffect(()=>{ if(emp){ setPDob(emp.dob||''); setPAddr(emp.address||''); setPMarital((emp.maritalStatus as any)||'Single'); setPEmerg(emp.emergencyContact||''); setPBank(emp.bankAccount||''); setPBankName(emp.bankName||''); setPIfsc(emp.ifsc||''); setPGender((emp.gender as any)||'Male'); setPUan(emp.uan||''); setPNation(emp.nationality||'Indian') }},[emp?.id])
  useEffect(()=>{ if(emp){ setMWage(emp.monthlyWage||50000); setYWage(emp.yearlyWage|| (emp.monthlyWage||50000)*12); setWDaysWeek(emp.workingDaysPerWeek||5); setBreakHrs(emp.breakTimeHrs||1); setPfEmpRate(emp.pfEmployerRate||12); setPfEeRate(emp.pfEmployeeRate||12); setPtax(emp.professionalTax||200); setComps(JSON.parse(JSON.stringify(emp.salaryComponents||[]))) }},[emp?.id])


  if(!emp) return <div className="p-6 text-[13px] text-muted">Employee not found. <Link to="/employees" className="underline">Back</Link></div>

  const today=new Date().toISOString().slice(0,10)
  const att=attendance.find(a=>a.employeeId===emp.id && a.date===today)
  const lv=leaves.find(l=>l.employeeId===emp.id && l.status==='Approved' && l.startDate<=today && l.endDate>=today)
  const status = lv? 'On Leave' : att?.status || 'Present'
  const statusBadge = status==='Present' ? 'bg-[#edf4ef] text-[#1a6b4a] border-[#d6e8db]' : status==='On Leave' ? 'bg-[#eff6ff] text-[#1d4ed8] border-[#dbeafe]' : 'bg-[#fdf2f2] text-[#7a2a2a] border-[#f0d6d6]'
  const payroll=data.payroll.find(p=>p.employeeId===emp.id)
  const endorsements = emp.skillEndorsements || {}; const docs = emp.documents||[]

  // recompute when wage changes
  function recompute(wage:number, compsDraft:any[]){
    const basic = compsDraft.find((c:any)=>c.name==='Basic Salary')
    if(basic){
      if(basic.type==='Percent of Wage') basic.computed = Math.round(wage * basic.value/100)
      else if(basic.type==='Fixed') basic.computed = basic.value
    }
    const basicVal = compsDraft.find((c:any)=>c.name==='Basic Salary')?.computed || 0
    compsDraft.forEach((c:any)=>{
      if(c.name==='Basic Salary') return
      if(c.type==='Percent of Wage') c.computed = Math.round(wage * c.value/100)
      else if(c.type==='Percent of Basic') c.computed = Math.round(basicVal * c.value/100)
      else c.computed = c.value
    })
    return compsDraft
  }
  function handleWageChange(v:number){
    setMWage(v); setYWage(v*12); const next=recompute(v, JSON.parse(JSON.stringify(comps))); setComps(next)
  }
  function updateComp(idx:number, field:'type'|'value', val:any){
    const next=[...comps]; (next[idx] as any)[field]= field==='value'? Number(val): val; const rec=recompute(mWage, next); setComps(rec)
  }
  function totalComp(){ return comps.reduce((a:any,b:any)=>a+ (b.computed||0),0) }
  function saveSalary(){
    updateEmployee(emp.id, { monthlyWage:mWage, yearlyWage:yWage, workingDaysPerWeek:wDaysWeek, breakTimeHrs:breakHrs, salaryComponents:comps, pfEmployerRate:pfEmpRate, pfEmployeeRate:pfEeRate, professionalTax:ptax })
  }

  function saveHeader(){ updateEmployee(emp.id, { name:hName||emp.name, email:hEmail||emp.email, phone:hPhone||emp.phone, company:hCompany||emp.company, department:hDept as any||emp.department, manager:hManager||emp.manager, location:hLocation||emp.location }); setEditingHeader(false) }
  function startHeaderEdit(){ setHName(emp.name); setHEmail(emp.email); setHPhone(emp.phone); setHCompany(emp.company||''); setHDept(emp.department); setHManager(emp.manager||''); setHLocation(emp.location||''); setEditingHeader(true) }

  const total = totalComp()
  const exceeds = total > mWage

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/employees" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-ink"><ArrowLeft className="w-3.5 h-3.5"/>Back to Employees</Link>
      </div>

      <div className="bg-white border border-line rounded-[12px] overflow-hidden">
        <div className="h-1 bg-ink"/>
        <div className="px-6 py-2 border-b border-line bg-paper flex items-center gap-2 text-[11px] tracking-[0.08em] font-medium text-muted uppercase"><Building2 className="w-3.5 h-3.5"/>My Profile</div>
        <div className="px-6 py-6">
          {editingHeader ? (
            <div className="grid md:grid-cols-[160px_1fr_1fr] gap-6">
              <div className="flex flex-col items-center gap-2"><img src={avatarUrl||emp.avatar} className="w-24 h-24 rounded-full object-cover border border-line"/><input value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="Avatar URL" className="w-full px-2 py-1.5 rounded-lg border border-line bg-paper text-[11px]"/><button onClick={()=>{ if(avatarUrl) updateEmployee(emp.id,{avatar:avatarUrl}); setEditingHeader(false)}} className="text-[11px] font-medium px-3 py-1 rounded-lg bg-ink text-white">Save avatar</button></div>
              <div className="space-y-3">
                <div><label className="text-[11px] font-medium">My Name</label><input value={hName} onChange={e=>setHName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
                <div><label className="text-[11px] font-medium">Login ID</label><div className="mt-1 px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px] font-mono text-muted">{emp.loginId}</div></div>
                <div><label className="text-[11px] font-medium">Email</label><input value={hEmail} onChange={e=>setHEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
                <div><label className="text-[11px] font-medium">Mobile</label><input value={hPhone} onChange={e=>setHPhone(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
              </div>
              <div className="space-y-3">
                <div><label className="text-[11px] font-medium">Company</label><input value={hCompany} onChange={e=>setHCompany(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
                <div><label className="text-[11px] font-medium">Department</label><input value={hDept} onChange={e=>setHDept(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
                <div><label className="text-[11px] font-medium">Manager</label><input value={hManager} onChange={e=>setHManager(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
                <div><label className="text-[11px] font-medium">Location</label><input value={hLocation} onChange={e=>setHLocation(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/></div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-[140px_1fr_1fr] gap-6">
              <div className="relative w-24 h-24 mx-auto md:mx-0"><img src={emp.avatar} className="w-24 h-24 rounded-full object-cover border border-line bg-paper"/>{canEditPrivate && <button onClick={()=>setShowAvatar(v=>!v)} className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-white border border-line shadow-sm grid place-items-center hover:bg-paper"><Pencil className="w-3.5 h-3.5"/></button>}{showAvatar && canEditPrivate && (<div className="absolute top-24 left-0 z-10 bg-white border border-line rounded-[10px] p-3 shadow-card w-64"><div className="text-[11px] font-medium">Update avatar</div><input value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="https://..." className="mt-2 w-full px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/><div className="mt-2 flex gap-2"><button onClick={()=>{ if(avatarUrl){ updateEmployee(emp.id,{avatar:avatarUrl}); setShowAvatar(false); setAvatarUrl('') } }} className="px-3 py-1.5 rounded-lg bg-ink text-white text-[11px] font-medium">Save</button><button onClick={()=>setShowAvatar(false)} className="px-3 py-1.5 rounded-lg border border-line bg-white text-[11px]">Cancel</button></div></div>)}</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><h1 className="text-[22px] font-semibold tracking-tight leading-none">{emp.name}</h1>{canEditPrivate && <button onClick={startHeaderEdit} className="p-1 rounded-md hover:bg-paper border border-transparent hover:border-line"><Pencil className="w-3.5 h-3.5 text-muted"/></button>}<span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${statusBadge}`}>{status}</span></div>
                <div className="space-y-1.5 text-[12px]"><div className="flex"><span className="w-20 text-muted">Login ID</span><span className="font-mono font-medium">{emp.loginId}</span></div><div className="flex"><span className="w-20 text-muted">Email</span><span className="font-medium">{emp.email}</span></div><div className="flex"><span className="w-20 text-muted">Mobile</span><span className="font-medium">{emp.phone}</span></div></div>
              </div>
              <div className="space-y-1.5 text-[12px]"><div className="flex"><span className="w-24 text-muted">Company</span><span className="font-medium">{emp.company}</span></div><div className="flex"><span className="w-24 text-muted">Department</span><span className="font-medium">{emp.department}</span></div><div className="flex"><span className="w-24 text-muted">Manager</span><span className="font-medium">{emp.manager}</span></div><div className="flex"><span className="w-24 text-muted">Location</span><span className="font-medium">{emp.location}</span></div></div>
            </div>
          )}
          {editingHeader && <div className="mt-4 flex gap-2 justify-end"><button onClick={saveHeader} className="px-4 py-2 rounded-[10px] bg-ink text-white text-[12px] font-medium inline-flex items-center gap-1"><Check className="w-4 h-4"/>Save</button><button onClick={()=>setEditingHeader(false)} className="px-4 py-2 rounded-[10px] border border-line bg-white text-[12px] font-medium">Cancel</button></div>}
        </div>

        <div className="px-6 border-t border-line flex gap-1 overflow-auto relative z-10">
          <button type="button" onClick={()=>setTab('resume')} className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer ${tab==='resume'?'border-ink text-ink':'border-transparent text-muted hover:text-ink'}`}>Resume</button>
          <button type="button" onClick={()=>setTab('private')} className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer ${tab==='private'?'border-ink text-ink':'border-transparent text-muted hover:text-ink'}`}>Private Info</button>
          <button type="button" onClick={()=>setTab('salary')} className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer ${tab==='salary'?'border-ink text-ink':'border-transparent text-muted hover:text-ink'}`}>Salary Info</button>
          <button type="button" onClick={()=>setTab('security')} className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer ${tab==='security'?'border-ink text-ink':'border-transparent text-muted hover:text-ink'}`}>Security</button>
        </div>
      </div>

      {tab==='resume' && (
        <div className="grid lg:grid-cols-[1.45fr_0.75fr] gap-4">
          <div className="space-y-4">
            <div className="bg-white border border-line rounded-[12px] overflow-hidden">
              <div className="divide-y divide-line">
                <div className="p-5"><div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold flex items-center gap-2">About {canEdit && <button onClick={()=>{ setTmpAbout(emp.about||''); setEditingAbout(v=>!v)}} className="p-1 rounded-md hover:bg-paper"><Pencil className="w-3.5 h-3.5 text-muted"/></button>}</h3></div>{editingAbout ? (<><textarea value={tmpAbout} onChange={e=>setTmpAbout(e.target.value)} className="mt-3 w-full min-h-[90px] px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/><div className="mt-2 flex gap-2"><button onClick={()=>{ updateEmployee(emp.id,{about:tmpAbout}); setEditingAbout(false)}} className="px-3 py-1.5 rounded-lg bg-ink text-white text-[12px]">Save</button><button onClick={()=>setEditingAbout(false)} className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px]">Cancel</button></div></>) : <p className="text-[13px] leading-relaxed text-muted mt-2">{emp.about}</p>}</div>
                <div className="p-5"><div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold flex items-center gap-2">What I love about my job {canEdit && <button onClick={()=>{ setTmpLove(emp.loveAboutJob||''); setEditingLove(v=>!v)}} className="p-1 rounded-md hover:bg-paper"><Pencil className="w-3.5 h-3.5 text-muted"/></button>}</h3></div>{editingLove ? (<><textarea value={tmpLove} onChange={e=>setTmpLove(e.target.value)} className="mt-3 w-full min-h-[70px] px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/><div className="mt-2 flex gap-2"><button onClick={()=>{ updateEmployee(emp.id,{loveAboutJob:tmpLove}); setEditingLove(false)}} className="px-3 py-1.5 rounded-lg bg-ink text-white text-[12px]">Save</button><button onClick={()=>setEditingLove(false)} className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px]">Cancel</button></div></>) : <p className="text-[13px] leading-relaxed text-muted mt-2">{emp.loveAboutJob}</p>}</div>
                <div className="p-5"><div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold flex items-center gap-2">My interests and hobbies {canEdit && <button onClick={()=>{ setTmpHobby(emp.interestsDetail||''); setEditingHobby(v=>!v)}} className="p-1 rounded-md hover:bg-paper"><Pencil className="w-3.5 h-3.5 text-muted"/></button>}</h3></div>{editingHobby ? (<><textarea value={tmpHobby} onChange={e=>setTmpHobby(e.target.value)} className="mt-3 w-full min-h-[70px] px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/><div className="mt-2 flex gap-2"><button onClick={()=>{ updateEmployee(emp.id,{interestsDetail:tmpHobby}); setEditingHobby(false)}} className="px-3 py-1.5 rounded-lg bg-ink text-white text-[12px]">Save</button><button onClick={()=>setEditingHobby(false)} className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px]">Cancel</button></div></>) : <p className="text-[13px] leading-relaxed text-muted mt-2">{emp.interestsDetail}</p>}</div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-line rounded-[12px] p-5"><div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-muted"/>Skills</h3>{canEdit && <button onClick={()=>setShowAddSkill(true)} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-paper border border-line hover:bg-white inline-flex items-center gap-1"><Plus className="w-3 h-3"/>Add Skills</button>}</div><div className="mt-3 space-y-2.5">{(emp.skills||[]).map((s:any)=>(<div key={s} className="flex items-center justify-between border border-line rounded-[10px] px-3 py-2.5 bg-paper"><div><div className="text-[12px] font-medium">{s}</div><div className="text-[11px] text-muted">{(endorsements as any)[s]??0} endorsements • peer validated</div></div><div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#c0900a] fill-[#c0900a]"/><span className="text-[11px] font-semibold">{(endorsements as any)[s]??0}</span>{canEdit && <button onClick={()=> updateEmployee(emp.id,{skills:(emp.skills||[]).filter(x=>x!==s)})} className="ml-1 p-1 rounded hover:bg-white border border-transparent hover:border-line"><Trash2 className="w-3 h-3 text-muted"/></button>}</div></div>))}</div></div>
            <div className="bg-white border border-line rounded-[12px] p-5"><div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-muted"/>Certification</h3>{canEdit && <button onClick={()=>setShowAddCert(true)} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-paper border border-line inline-flex items-center gap-1"><Plus className="w-3 h-3"/>Add</button>}</div><div className="mt-3 flex flex-wrap gap-1.5">{(emp.certifications||[]).map((c:any)=><span key={c} className="px-2.5 py-1 rounded-lg bg-paper border border-line text-[12px] flex items-center gap-1">{c} {canEdit && <button onClick={()=> updateEmployee(emp.id,{certifications:(emp.certifications||[]).filter(x=>x!==c)})}><X className="w-3 h-3 text-muted"/></button>}</span>)}</div></div>
          </div>
        </div>
      )}

      {tab==='private' && !privateVisible && (
        <div className="bg-white border border-line rounded-[12px] p-8 text-center"><div className="w-10 h-10 rounded-full bg-paper border border-line grid place-items-center mx-auto"><Lock className="w-5 h-5 text-muted"/></div><div className="text-[13px] font-medium mt-3">Private Information</div><div className="text-[12px] text-muted mt-1">Restricted</div></div>
      )}
      {tab==='private' && privateVisible && (
        <div className="bg-white border border-line rounded-[12px]">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between"><div><h3 className="text-[13px] font-semibold">Private Information</h3></div>{canEditPrivate && <button onClick={()=>{ updateEmployee(emp.id,{ dob:pDob, address:pAddr, maritalStatus:pMarital as any, emergencyContact:pEmerg, bankAccount:pBank, bankName:pBankName, ifsc:pIfsc, gender:pGender as any, uan:pUan, nationality:pNation }); }} className="px-4 py-2 rounded-[10px] bg-ink text-white text-[12px] font-medium inline-flex items-center gap-1"><Check className="w-4 h-4"/>Save</button>}</div>
          <div className="p-5 grid md:grid-cols-2 gap-4">
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Full Name</div><div className="text-[13px] font-medium mt-1">{emp.name}</div></div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Date of Birth</div>{canEditPrivate? <input type="date" value={pDob} onChange={e=>setPDob(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.dob}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Nationality</div>{canEditPrivate? <input value={pNation} onChange={e=>setPNation(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.nationality}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Personal Email</div><div className="text-[13px] font-medium mt-1">{emp.email}</div></div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Gender</div>{canEditPrivate? <select value={pGender} onChange={e=>setPGender(e.target.value as any)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"><option>Male</option><option>Female</option><option>Other</option></select>:<div className="text-[13px] font-medium mt-1">{emp.gender}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Marital Status</div>{canEditPrivate? <select value={pMarital} onChange={e=>setPMarital(e.target.value as any)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"><option>Single</option><option>Married</option><option>Divorced</option></select>:<div className="text-[13px] font-medium mt-1">{emp.maritalStatus}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Phone / Mobile</div><div className="text-[13px] font-medium mt-1">{emp.phone}</div></div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Date of Joining</div><div className="text-[13px] font-medium mt-1">{emp.joinDate}</div></div>
            <div className="border border-line rounded-[10px] p-3 bg-paper md:col-span-2"><div className="text-[11px] text-muted">Mailing Address / Home Address</div>{canEditPrivate? <input value={pAddr} onChange={e=>setPAddr(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.address}</div>}</div>
            <div className="col-span-2 border-t border-line pt-4 mt-2 flex items-center gap-2 text-[11px] tracking-[0.08em] font-medium text-muted uppercase"><Shield className="w-3.5 h-3.5"/>Bank Details</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Bank Name</div>{canEditPrivate? <input value={pBankName} onChange={e=>setPBankName(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.bankName}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Account Number</div>{canEditPrivate? <input value={pBank} onChange={e=>setPBank(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.bankAccount}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">IFSC Code</div>{canEditPrivate? <input value={pIfsc} onChange={e=>setPIfsc(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.ifsc}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">PAN No</div><div className="text-[13px] font-medium mt-1">{emp.pan}</div></div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">UAN No</div>{canEditPrivate? <input value={pUan} onChange={e=>setPUan(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.uan}</div>}</div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Emp Code</div><div className="text-[13px] font-mono font-medium mt-1">{emp.id}</div></div>
            <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Emergency Contact</div>{canEditPrivate? <input value={pEmerg} onChange={e=>setPEmerg(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-line bg-white text-[12px]"/>:<div className="text-[13px] font-medium mt-1">{emp.emergencyContact}</div>}</div>
          </div>
        </div>
      )}

      {tab==='salary' && (
        salaryVisible ? (
          <div className="space-y-4">
            <div className="bg-white border border-line rounded-[12px] overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center justify-between"><h3 className="text-[13px] font-semibold">Salary Information</h3><span className="text-[11px] px-2.5 py-1 rounded-full bg-paper border border-line text-muted">View only • HR views payroll details</span></div>
              {/* Wage header — exact structure from Important — view only per User Type table */}
              <div className="p-5">
                <div className="text-[11px] tracking-[0.08em] font-medium text-muted uppercase">Wage Type</div>
                <div className="mt-1 inline-flex px-3 py-1.5 rounded-full bg-ink text-white text-[11px] font-medium">Fixed wage</div>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <div className="border border-line rounded-[10px] p-4 bg-paper"><div className="text-[11px] text-muted uppercase tracking-[0.06em] font-medium">Month Wage</div><div className="mt-2 flex items-center gap-2"><div className="flex-1 px-3 py-2 rounded-[10px] border border-line bg-white text-[15px] font-semibold tabular-nums">{formatCurrency(mWage)}</div><span className="text-[11px] text-muted">/ Month</span></div></div>
                  <div className="border border-line rounded-[10px] p-4 bg-paper"><div className="text-[11px] text-muted uppercase tracking-[0.06em] font-medium">No. of working days in a week</div><div className="mt-2 flex items-center gap-2"><div className="w-20 px-3 py-2 rounded-[10px] border border-line bg-white text-[15px] font-semibold text-center">{wDaysWeek}</div><span className="text-[11px] text-muted">/ {wDaysWeek*4} days / month</span></div></div>
                  <div className="border border-line rounded-[10px] p-4 bg-paper"><div className="text-[11px] text-muted uppercase tracking-[0.06em] font-medium">Break Time</div><div className="mt-2 flex items-center gap-2"><div className="w-20 px-3 py-2 rounded-[10px] border border-line bg-white text-[15px] font-semibold text-center">{breakHrs}</div><span className="text-[11px] text-muted">/ hrs</span></div></div>
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-4">
                  <div className="border border-line rounded-[10px] p-4 bg-paper flex items-center justify-between"><div><div className="text-[11px] text-muted uppercase tracking-[0.06em] font-medium">Yearly wage</div><div className="text-[15px] font-semibold mt-1">{formatCurrency(yWage)}</div></div><span className="text-[11px] text-muted">/ Yearly • Auto = Monthly × 12</span></div>
                  <div className={`border rounded-[10px] p-4 flex items-center justify-between ${exceeds?'bg-[#fdf2f2] border-[#f0d6d6]':'bg-[#edf4ef] border-[#d6e8db]'}`}><div><div className="text-[11px] font-medium">Total components</div><div className={`text-[15px] font-semibold ${exceeds?'text-[#7a2a2a]':'text-[#1a6b4a]'}`}>{formatCurrency(total)} {exceeds && <span className="text-[11px] font-normal">— exceeds wage!</span>}</div></div><span className="text-[11px] text-muted">{exceeds? 'Must ≤ wage':'Within wage'}</span></div>
                </div>
              </div>

              <div className="px-5 pb-5 grid lg:grid-cols-[1.35fr_0.75fr] gap-5 items-start">
                <div>
                  <h4 className="text-[12px] font-semibold">Salary Components</h4>
                  <div className="mt-3 border border-line rounded-[10px] overflow-hidden bg-white">
                    <div className="hidden md:grid grid-cols-[1.3fr_0.8fr_0.6fr_0.7fr] gap-0 bg-paper border-b border-line text-[11px] tracking-[0.06em] font-medium text-muted uppercase px-3 py-2.5"><div>Component</div><div>Type</div><div>Value</div><div className="text-right">Amount</div></div>
                    {comps.map((c:any)=>(
                      <div key={c.id} className="grid md:grid-cols-[1.3fr_0.8fr_0.6fr_0.7fr] gap-2 md:gap-0 px-3 py-2.5 items-center border-b border-line last:border-0 text-[13px] min-h-[56px]">
                        <div className="font-medium leading-tight">{c.name}</div>
                        <div className="h-7 px-2 rounded-lg border border-line bg-paper text-[11px] leading-none flex items-center">{c.type}</div>
                        <div className="flex items-center gap-1.5"><div className="w-[72px] h-7 px-2 rounded-lg border border-line bg-white text-[11px] font-mono leading-none flex items-center">{c.value}</div><span className="text-[11px] text-muted w-6">%</span></div>
                        <div className="text-right font-medium tabular-nums leading-tight">{formatCurrency(c.computed)}<span className="text-[11px] text-muted font-normal"> / month</span></div>
                      </div>
                    ))}
                    <div className="bg-paper px-3 py-2.5 flex justify-between text-[12px]"><span className="font-medium">Subtotal components</span><span className="font-semibold">{formatCurrency(total)}</span></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border border-line rounded-[10px] overflow-hidden bg-white">
                    <div className="px-3.5 py-2.5 bg-paper border-b border-line"><h4 className="text-[11px] font-semibold uppercase tracking-[0.06em]">Provident Fund (PF) Contribution</h4></div>
                    <div className="p-3 space-y-2.5">
                      <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="flex justify-between items-center gap-2"><span className="text-[12px] font-medium">Employer</span><span className="text-[11px] text-muted whitespace-nowrap">{pfEmpRate}% of Basic</span></div><div className="mt-2 flex items-center gap-2"><div className="w-[64px] h-7 px-2 rounded-lg border border-line bg-white text-[12px] text-center flex items-center justify-center">{pfEmpRate}</div> <span className="text-[11px] text-muted leading-tight flex-1">% × {formatCurrency(comps.find((c:any)=>c.name==='Basic Salary')?.computed||0)} = {formatCurrency(Math.round((comps.find((c:any)=>c.name==='Basic Salary')?.computed||0)*pfEmpRate/100))} / month</span></div><div className="text-[10px] text-muted mt-1.5 leading-none">PF calculated based on the basic salary</div></div>
                      <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="flex justify-between items-center gap-2"><span className="text-[12px] font-medium">Employee</span><span className="text-[11px] text-muted whitespace-nowrap">{pfEeRate}% of Basic</span></div><div className="mt-2 flex items-center gap-2"><div className="w-[64px] h-7 px-2 rounded-lg border border-line bg-white text-[12px] text-center flex items-center justify-center">{pfEeRate}</div> <span className="text-[11px] text-muted leading-tight flex-1">% × Basic = {formatCurrency(Math.round((comps.find((c:any)=>c.name==='Basic Salary')?.computed||0)*pfEeRate/100))} / month</span></div></div>
                    </div>
                  </div>
                  <div className="border border-line rounded-[10px] overflow-hidden bg-white">
                    <div className="px-3.5 py-2.5 bg-paper border-b border-line"><h4 className="text-[11px] font-semibold uppercase tracking-[0.06em]">Tax Deductions</h4></div>
                    <div className="p-3"><div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[12px] font-medium">Professional Tax</div><div className="mt-2 flex items-center gap-2"><div className="w-[72px] h-7 px-2 rounded-lg border border-line bg-white text-[12px] text-center flex items-center justify-center">{ptax}</div><span className="text-[11px] text-muted leading-tight">₹ / month • Deducted from gross salary</span></div></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-[12px] p-10 text-center"><div className="w-10 h-10 rounded-full bg-paper border border-line grid place-items-center mx-auto"><Lock className="w-5 h-5 text-muted"/></div><div className="text-[13px] font-medium mt-3">Restricted</div></div>
        )
      )}

      {tab==='security' && (
        isOwn || isAdmin ? (
        <div className="bg-white border border-line rounded-[12px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-[13px] font-semibold flex items-center gap-2"><Shield className="w-4 h-4"/>Security</h3>
          </div>
          <div className="p-5 space-y-5">
            {/* Account fields - per reference: Login ID / Employee ID / Account email */}
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted">Account</h4>
              <div className="mt-3 grid md:grid-cols-3 gap-3">
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Login ID</div><div className="text-[13px] font-mono font-medium mt-1">{emp.loginId}</div><div className="text-[10px] text-muted mt-1">System-generated, used for sign-in</div></div>
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Employee ID</div><div className="text-[13px] font-mono font-medium mt-1">{emp.id}</div><div className="text-[10px] text-muted mt-1">Unique, immutable</div></div>
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Account Email</div><div className="text-[13px] font-medium mt-1 truncate">{emp.email}</div><div className="text-[10px] text-muted mt-1">Primary sign-in email</div></div>
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Role</div><div className="text-[13px] font-medium mt-1 capitalize">{emp.department} • {emp.role}</div></div>
                <div className="border border-line rounded-[10px] p-3 bg-paper"><div className="text-[11px] text-muted">Account Status</div><div className="text-[13px] font-medium mt-1 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1a6b4a]"/>Active • Password set</div><div className="text-[10px] text-muted mt-1">Last changed: today</div></div>
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted">Change Password</h4>
              <div className="mt-3 grid md:grid-cols-3 gap-3">
                <div><label className="text-[11px] font-medium">Current Password</label><input value={secCurr} onChange={e=>setSecCurr(e.target.value)} placeholder="Current password" type="password" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-white text-[12px] outline-none focus:border-ink"/></div>
                <div><label className="text-[11px] font-medium">New Password</label><input value={secNew} onChange={e=>setSecNew(e.target.value)} placeholder="Min 6 characters" type="password" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-white text-[12px] outline-none focus:border-ink"/></div>
                <div><label className="text-[11px] font-medium">Confirm Password</label><input value={secConfirm} onChange={e=>setSecConfirm(e.target.value)} placeholder="Confirm new password" type="password" className="mt-1 w-full px-3 py-2 rounded-[10px] border border-line bg-white text-[12px] outline-none focus:border-ink"/></div>
              </div>
              {secMsg && <div className={`mt-3 text-[11px] px-3 py-2 rounded-[10px] border ${secMsg.type==='success'?'bg-[#edf4ef] border-[#d6e8db] text-[#1a6b4a]':'bg-[#fdf2f2] border-[#f0d6d6] text-[#7a2a2a]'}`}>{secMsg.text}</div>}
              <div className="mt-3 flex gap-2">
                <button onClick={()=>{
                  setSecMsg(null)
                  if(!secCurr || !secNew || !secConfirm){ setSecMsg({type:'error', text:'Fill all fields'}); return }
                  if(secNew!==secConfirm){ setSecMsg({type:'error', text:'New and confirm do not match'}); return }
                  const ok=updateSecurity(emp.id, secCurr, secNew)
                  if(!ok) setSecMsg({type:'error', text:'Failed — check current password / permissions.'})
                  else { setSecMsg({type:'success', text:'Password updated successfully'}); setSecCurr(''); setSecNew(''); setSecConfirm('') }
                }} className="px-5 py-2 rounded-[10px] bg-ink text-white text-[12px] font-medium hover:bg-black">Update Password</button>
                <button onClick={()=>{setSecCurr(''); setSecNew(''); setSecConfirm(''); setSecMsg(null)}} className="px-4 py-2 rounded-[10px] border border-line bg-white text-[12px] font-medium">Clear</button>
              </div>
            </div>

            <div className="border-t border-line pt-5 grid md:grid-cols-2 gap-4">
              <div className="border border-line rounded-[10px] p-4 bg-paper"><div className="text-[12px] font-medium">Sessions</div><div className="text-[11px] text-muted mt-1">Current: this browser • Last login today • {emp.id}</div><button className="mt-3 px-3 py-1.5 rounded-lg border border-line bg-white text-[11px]">Log out other sessions</button></div>
              <div className="border border-line rounded-[10px] p-4 bg-paper"><div className="text-[12px] font-medium">Two-Factor</div><div className="text-[11px] text-muted mt-1">Not enabled • Recommended for HR/Admin</div><button className="mt-3 px-3 py-1.5 rounded-lg border border-line bg-white text-[11px]">Enable 2FA</button></div>
            </div>
          </div>
        </div>
        ) : (
        <div className="bg-white border border-line rounded-[12px] p-8 text-center"><div className="w-10 h-10 rounded-full bg-paper border border-line grid place-items-center mx-auto"><Lock className="w-5 h-5 text-muted"/></div><div className="text-[13px] font-medium mt-3">Security</div><div className="text-[12px] text-muted mt-1">Restricted</div></div>
        )
      )}

      {showAddSkill && (<div className="fixed inset-0 z-50 grid place-items-center p-4"><div onClick={()=>setShowAddSkill(false)} className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"/><div className="relative bg-white border border-line rounded-[12px] w-full max-w-sm p-5 shadow-card"><h3 className="text-[13px] font-semibold">Add Skill</h3><input value={newSkill} onChange={e=>setNewSkill(e.target.value)} placeholder="e.g. Leadership" className="mt-3 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/><div className="mt-4 flex gap-2"><button onClick={()=>{ if(newSkill.trim()){ updateEmployee(emp.id,{skills:[...(emp.skills||[]), newSkill.trim()], skillEndorsements:{...(emp.skillEndorsements||{}), [newSkill.trim()]:1}}); setNewSkill(''); setShowAddSkill(false)}} } className="px-4 py-2 rounded-[10px] bg-ink text-white text-[12px] font-medium">Add</button><button onClick={()=>setShowAddSkill(false)} className="px-4 py-2 rounded-[10px] border border-line bg-white text-[12px]">Cancel</button></div></div></div>)}
      {showAddCert && (<div className="fixed inset-0 z-50 grid place-items-center p-4"><div onClick={()=>setShowAddCert(false)} className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"/><div className="relative bg-white border border-line rounded-[12px] w-full max-w-sm p-5 shadow-card"><h3 className="text-[13px] font-semibold">Add Certification</h3><input value={newCert} onChange={e=>setNewCert(e.target.value)} placeholder="e.g. PMP" className="mt-3 w-full px-3 py-2 rounded-[10px] border border-line bg-paper text-[13px]"/><div className="mt-4 flex gap-2"><button onClick={()=>{ if(newCert.trim()){ updateEmployee(emp.id,{certifications:[...(emp.certifications||[]), newCert.trim()]}); setNewCert(''); setShowAddCert(false)}} } className="px-4 py-2 rounded-[10px] bg-ink text-white text-[12px] font-medium">Add</button><button onClick={()=>setShowAddCert(false)} className="px-4 py-2 rounded-[10px] border border-line bg-white text-[12px]">Cancel</button></div></div></div>)}
    </div>
  )
}
