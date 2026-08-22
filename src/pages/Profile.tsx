import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/store'
import { formatCurrency } from '../lib/utils'

type Tab='resume'|'private'|'salary'|'security'

export default function Profile(){
  const {user,employees,data,updateEmployee,changePassword}=useAuth()
  const employee=useMemo(()=>employees.find(e=>e.email===user?.email)||employees[0],[employees,user])
  const [tab,setTab]=useState<Tab>('resume')
  const [editing,setEditing]=useState(false)
  const [phone,setPhone]=useState(employee.phone)
  const [address,setAddress]=useState(employee.address||'')
  const [about,setAbout]=useState(employee.about||'')
  const [interests,setInterests]=useState(employee.interests||'')
  const [currentPassword,setCurrentPassword]=useState('')
  const [newPassword,setNewPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [securityMessage,setSecurityMessage]=useState('')
  const [securityError,setSecurityError]=useState('')
  const [changingPassword,setChangingPassword]=useState(false)
  const payroll=data.payroll.find(p=>p.employeeId===employee.id)
  const manager=user?.role==='admin'||user?.role==='hr'
  useEffect(()=>{if(user?.mustChangePassword)setTab('security')},[user?.mustChangePassword])
  async function save(){await updateEmployee(employee.id,{phone,address,about,interests});setEditing(false)}
  async function submitPassword(event:React.FormEvent){
    event.preventDefault();setSecurityError('');setSecurityMessage('')
    if(newPassword.length<8){setSecurityError('Use at least 8 characters');return}
    if(newPassword!==confirmPassword){setSecurityError('New passwords do not match');return}
    setChangingPassword(true)
    const result=await changePassword(currentPassword,newPassword)
    setChangingPassword(false)
    if(!result.ok){setSecurityError(result.error||'Password change failed');return}
    setCurrentPassword('');setNewPassword('');setConfirmPassword('');setSecurityMessage('Password changed successfully. Your temporary-password restriction is removed.')
  }
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div><div className="text-[11px] tracking-[0.12em] font-medium text-muted uppercase">Account</div><h1 className="mt-1 text-[22px] font-semibold">My Profile</h1><p className="text-[13px] text-muted mt-1">Personal, job, salary, and security information</p></div>
        <button onClick={()=>editing?save():setEditing(true)} className="px-3.5 py-2 rounded-lg bg-ink text-white text-[12px] font-medium">{editing?'Save changes':'Edit profile'}</button>
      </div>
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="p-5 flex flex-wrap gap-4 items-center border-b border-line">
          <img src={employee.avatar} className="w-16 h-16 rounded-full object-cover"/>
          <div className="flex-1"><div className="text-[18px] font-semibold">{employee.name}</div><div className="text-[12px] text-muted">{employee.role} · {employee.department}</div><div className="text-[11px] text-muted mt-1">{employee.id} · {employee.email}</div></div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[12px]"><div><span className="text-muted">Manager</span><div className="font-medium">{employee.manager||'—'}</div></div><div><span className="text-muted">Location</span><div className="font-medium">{employee.location||'—'}</div></div></div>
        </div>
        <div className="px-5 flex gap-1 border-b border-line overflow-auto">
          {(['resume','private','salary','security'] as Tab[]).filter(t=>t!=='salary'||manager).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-3 text-[12px] font-medium capitalize border-b-2 ${tab===t?'border-ink text-ink':'border-transparent text-muted'}`}>{t==='private'?'Private Info':t==='salary'?'Salary Info':t}</button>)}
        </div>
        <div className="p-5">
          {tab==='resume'&&<div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-4"><Field label="About" value={about} editing={editing} onChange={setAbout}/><Field label="What I love about my job" value="Building reliable systems with a thoughtful, people-first team."/><Field label="My interests and hobbies" value={interests} editing={editing} onChange={setInterests}/></div>
            <div className="space-y-4"><Panel title="Skills" values={employee.skills||[]} empty="No skills added"/><Panel title="Certifications" values={employee.certifications||[]} empty="No certifications added"/></div>
          </div>}
          {tab==='private'&&<div className="grid md:grid-cols-2 gap-4">
            <div className="border border-line rounded-xl p-4 space-y-3"><h3 className="text-[13px] font-semibold">Private information</h3><Field label="Phone" value={phone} editing={editing} onChange={setPhone}/><Field label="Address" value={address} editing={editing} onChange={setAddress}/><Field label="Date of joining" value={employee.joinDate}/><Field label="Personal email" value={employee.email}/></div>
            <div className="border border-line rounded-xl p-4 space-y-3"><h3 className="text-[13px] font-semibold">Bank and identity</h3><Field label="Account number" value="•••• •••• 4832"/><Field label="Bank name" value="Demo Bank"/><Field label="IFSC" value="DEMO0001234"/><Field label="PAN / UAN" value="Protected · HR access only"/></div>
          </div>}
          {tab==='salary'&&manager&&payroll&&<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[['Basic salary',payroll.base],['House rent allowance',payroll.hra],['Standard allowance',payroll.standardAllowance],['Performance bonus',payroll.performanceBonus],['Leave travel allowance',payroll.lta],['Fixed allowance',payroll.fixedAllowance],['Employee PF',payroll.pfEmployee],['Employer PF',payroll.pfEmployer],['Professional tax',payroll.professionalTax]].map(([label,value])=><div key={String(label)} className="border border-line rounded-lg p-3 bg-paper"><div className="text-[11px] text-muted">{label}</div><div className="text-[14px] font-semibold mt-1">{formatCurrency(Number(value||0))}</div></div>)}</div>}
          {tab==='security'&&<form onSubmit={submitPassword} className="max-w-xl border border-line rounded-xl p-4"><h3 className="text-[13px] font-semibold">Password and access</h3><p className="text-[12px] text-muted mt-2">New employees must replace their system-generated password on first login. Password changes and account activity are recorded for HR review.</p>{user?.mustChangePassword&&<div className="mt-3 text-[11px] text-[#92400e] bg-[#fef7e7] border border-[#fde68a] rounded-lg px-3 py-2">Change the temporary password before opening the rest of DayFlow.</div>}<div className="mt-4 space-y-3"><input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/><input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password (minimum 8 characters)" className="w-full px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/></div>{securityError&&<div className="mt-3 text-[11px] text-[#991b1b] bg-[#fdf2f2] border border-[#f0d6d6] rounded-lg px-3 py-2">{securityError}</div>}{securityMessage&&<div className="mt-3 text-[11px] text-accent bg-accent-soft border border-[#d6e8db] rounded-lg px-3 py-2">{securityMessage}</div>}<button disabled={changingPassword} className="mt-4 px-3 py-2 rounded-lg bg-ink text-white text-[12px] font-medium disabled:opacity-60">{changingPassword?'Changing password…':'Change password'}</button></form>}
        </div>
      </div>
    </div>
  )
}

function Field({label,value,editing,onChange}:{label:string;value:string;editing?:boolean;onChange?:(value:string)=>void}){
  return <div><div className="text-[11px] text-muted mb-1">{label}</div>{editing&&onChange?<input value={value} onChange={e=>onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line bg-paper text-[12px]"/>:<div className="text-[12px] leading-relaxed">{value||'—'}</div>}</div>
}
function Panel({title,values,empty}:{title:string;values:string[];empty:string}){return <div className="border border-line rounded-xl p-4"><h3 className="text-[13px] font-semibold">{title}</h3><div className="mt-3 flex flex-wrap gap-2">{values.length?values.map(v=><span key={v} className="px-2 py-1 rounded-md bg-paper border border-line text-[11px]">{v}</span>):<span className="text-[11px] text-muted">{empty}</span>}</div><button className="mt-3 text-[11px] font-medium">+ Add {title.toLowerCase()}</button></div>}
