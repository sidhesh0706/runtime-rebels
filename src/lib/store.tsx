import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import { loadSeed, saveData, type Attendance, type Employee, type LeaveRequest, type Role, genLoginId, salaryBreakdown } from './data'

type User = { id:string; name:string; email:string; role:Role; avatar:string; department?:string; loginId?:string; companyName?:string }

type Ctx = {
  user: User | null
  login: (email:string, pass:string) => boolean
  signup: (name:string,email:string,pass:string,role:Role, extra?:{companyName?:string; phone?:string})=>boolean
  logout: ()=>void
  data: ReturnType<typeof loadSeed>
  updateLeaves: (fn:(prev:LeaveRequest[])=>LeaveRequest[])=>void
  updateAttendance: (empId:string, status: Attendance['status'])=>void
  checkIn: (empId:string)=>void
  checkOut: (empId:string)=>void
  updateEmployee: (id:string, patch:Partial<Employee>)=>void
  updateSecurity: (id:string, currentPass:string, newPass:string)=>boolean
  addEmployee: (payload:{name:string; email:string; department:Employee['department']; role:string; phone?:string; manager?:string; location?:string; dob?:string})=>{employee:Employee; tempPassword:string; loginId:string} | null
  employees: Employee[]
  attendance: Attendance[]
  leaves: LeaveRequest[]
  refreshBrief: ()=>void
}

const AuthContext = createContext<Ctx>(null as any)

const USERS_KEY='dayflow_users'
const SESSION_KEY='dayflow_session'
export const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'Admin@123'
export const DEMO_EMPLOYEE_PASSWORD = import.meta.env.VITE_DEMO_EMPLOYEE_PASSWORD || 'Employee@123'

function getUsers(): Array<User & {password:string}> {
  const v=localStorage.getItem(USERS_KEY)
  if(v) try{
    const parsed=JSON.parse(v)
    // force demo accounts to match current DEMO passwords (fixes old empty/change-me values)
    let mutated=false
    for(const u of parsed){
      if(u.email==='admin@dayflow.co' && u.password!==DEMO_ADMIN_PASSWORD){ u.password=DEMO_ADMIN_PASSWORD; mutated=true }
      if(u.email==='isha@dayflow.co' && u.password!==DEMO_EMPLOYEE_PASSWORD){ u.password=DEMO_EMPLOYEE_PASSWORD; mutated=true }
      if(!u.password){ // fallback
        if(u.email==='admin@dayflow.co') { u.password=DEMO_ADMIN_PASSWORD; mutated=true }
        if(u.email==='isha@dayflow.co') { u.password=DEMO_EMPLOYEE_PASSWORD; mutated=true }
      }
    }
    if(mutated) localStorage.setItem(USERS_KEY, JSON.stringify(parsed))
    if(parsed.length) return parsed
  }catch{}
  const defaults=[
    { id:'U1', name:'Aarav Sharma', email:'admin@dayflow.co', password:DEMO_ADMIN_PASSWORD, role:'admin' as Role, avatar:'https://i.pravatar.cc/150?img=12', loginId:'DFAS1001' },
    { id:'U2', name:'Isha Patel', email:'isha@dayflow.co', password:DEMO_EMPLOYEE_PASSWORD, role:'employee' as Role, avatar:'https://i.pravatar.cc/150?img=5', loginId:'DFIP1002' },
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults))
  return defaults
}

export function getMyEmployee(user: User | null, employees: Employee[]): Employee | undefined {
  if(!user) return undefined
  // demo accounts mapping: admin@dayflow.co -> Aarav Mehta, isha@dayflow.co -> Isha Patel
  if(user.email==='admin@dayflow.co') return employees.find(e=>e.name==='Aarav Mehta') || employees[0]
  if(user.email==='isha@dayflow.co') return employees.find(e=>e.name==='Isha Patel') || employees[1]
  return employees.find(e=>e.email.toLowerCase()===user.email.toLowerCase())
}

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(()=>{ const s=localStorage.getItem(SESSION_KEY); return s? JSON.parse(s): null })
  const [data,setData]=useState(()=>loadSeed())

  useEffect(()=>{ saveData(data)},[data])

  // Backend RLS simulation: employees see only own PII; admin sees all (mirrors v_users_private view)
  const visibleEmployees = useMemo(()=>{
    if(!user || user.role==='admin') return data.employees
    const my = getMyEmployee(user, data.employees)
    return data.employees.map(e=>{
      if(e.id===my?.id) return e
      // strip private/salary for others — enforces server-side privacy even if UI is bypassed
      return {
        ...e,
        dob: undefined,
        address: '',
        maritalStatus: undefined,
        nationality: undefined,
        emergencyContact: '',
        bankAccount: '',
        bankName: '',
        ifsc: '',
        pan: '',
        uan: '',
        gender: undefined,
        monthlyWage: undefined,
        yearlyWage: undefined,
        salaryComponents: undefined,
        pfEmployerRate: undefined,
        pfEmployeeRate: undefined,
        professionalTax: undefined,
        wageType: undefined,
      } as Employee
    })
  },[data.employees, user])

  const login=(email:string, pass:string)=>{
    const users=getUsers()
    // allow login with email OR loginId
    const found=users.find(u=>(u.email.toLowerCase()===email.toLowerCase() || (u as any).loginId?.toLowerCase()===email.toLowerCase()) && u.password===pass)
    if(!found) return false
    const {password, ...rest}=found
    setUser(rest as User); localStorage.setItem(SESSION_KEY, JSON.stringify(rest))
    return true
  }
  const signup=(name:string,email:string,pass:string,role:Role, extra?:{companyName?:string; phone?:string})=>{
    const users=getUsers()
    if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return false
    // generate loginId similar to data.ts
    const parts=name.trim().split(/\s+/)
    const ini=(parts[0]?.[0]||'A')+(parts[1]?.[0]||'X')
    const comp = (extra?.companyName||'DF').slice(0,2).toUpperCase().replace(/[^A-Z]/g,'A').padEnd(2,'D')
    const loginId=`${comp}${ini.toUpperCase()}${String(Date.now()).slice(-4)}`
    const newUser={ id: 'U'+Date.now(), name, email, password:pass, role, avatar:`https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)+1}`, loginId, companyName: extra?.companyName, phone: extra?.phone }
    users.push(newUser); localStorage.setItem(USERS_KEY, JSON.stringify(users))
    const {password, ...rest}=newUser
    setUser(rest as User); localStorage.setItem(SESSION_KEY, JSON.stringify(rest))
    return true
  }
  const logout=()=>{ setUser(null); localStorage.removeItem(SESSION_KEY)}

  const updateLeaves=(fn:(prev:LeaveRequest[])=>LeaveRequest[])=>{
    setData(d=>({...d, leaves: fn(d.leaves)}))
  }
  function nowHM(){ const n=new Date(); return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}` }
  const updateAttendance=(empId:string, status: Attendance['status'])=>{
    const today=new Date().toISOString().slice(0,10)
    const now=nowHM()
    setData(d=>{
      const idx=d.attendance.findIndex(a=>a.employeeId===empId && a.date===today)
      let next=[...d.attendance]
      if(idx>=0){
        const cur=next[idx]
        if(status==='Present' && !cur.checkIn) next[idx]={...cur, status, checkIn: now, checkOut: undefined, hours: 0}
        else if(status==='Present' && cur.checkIn && !cur.checkOut) next[idx]={...cur, status, checkOut: undefined}
        else next[idx]={...cur, status, checkIn: cur.checkIn || now, checkOut: status==='Present'? cur.checkOut : undefined}
      } else {
        next.push({ id:`ATT-${empId}-${today}`, employeeId:empId, date:today, status, checkIn: status==='Present'||status==='Late'||status==='Half-day'? now: undefined, checkOut: undefined, hours: status==='Half-day'?4.5:8})
      }
      return {...d, attendance: next}
    })
  }
  const checkIn=(empId:string)=>{
    const today=new Date().toISOString().slice(0,10); const now=nowHM()
    setData(d=>{
      const idx=d.attendance.findIndex(a=>a.employeeId===empId && a.date===today)
      let next=[...d.attendance]
      if(idx>=0) next[idx]={...next[idx], status:'Present', checkIn: now, checkOut: undefined, hours: 8}
      else next.push({ id:`ATT-${empId}-${today}`, employeeId:empId, date:today, status:'Present', checkIn: now, checkOut: undefined, hours: 8})
      return {...d, attendance: next}
    })
  }
  const checkOut=(empId:string)=>{
    const today=new Date().toISOString().slice(0,10); const now=nowHM()
    setData(d=>{
      const idx=d.attendance.findIndex(a=>a.employeeId===empId && a.date===today)
      if(idx<0) return d
      let next=[...d.attendance]
      const cur=next[idx]
      // calculate hours
      if(cur.checkIn){
        const [h1,m1]=cur.checkIn.split(':').map(Number); const [h2,m2]=now.split(':').map(Number)
        const mins=(h2*60+m2)-(h1*60+m1); const hrs=Math.max(0, Math.round((mins/60)*10)/10)
        next[idx]={...cur, checkOut: now, hours: hrs}
      } else {
        next[idx]={...cur, checkOut: now}
      }
      return {...d, attendance: next}
    })
  }
  const updateEmployee=(id:string, patch:Partial<Employee>)=>{
    // Backend authorization: enforce private/security/salary rules server-side
    const myEmp = user ? getMyEmployee(user, data.employees) : undefined
    const isAdmin = user?.role==='admin'
    const isOwn = myEmp?.id===id
    const salaryFields = ['monthlyWage','yearlyWage','workingDaysPerWeek','workingDaysPerMonth','breakTimeHrs','salaryComponents','pfEmployerRate','pfEmployeeRate','professionalTax','salary','wageType']
    const privateFields = ['dob','address','maritalStatus','nationality','emergencyContact','bankAccount','bankName','ifsc','pan','uan','gender','phone','manager','location','company','nationality','maritalStatus']
    const isPrivatePatch = Object.keys(patch).some(k=>privateFields.includes(k))
    const isSalaryPatch = Object.keys(patch).some(k=>salaryFields.includes(k))
    if(isPrivatePatch && !isOwn && !isAdmin){
      console.warn(`[API 403] Private update denied: ${user?.email} cannot edit ${id}`)
      return
    }
    if(isSalaryPatch && !isAdmin){
      console.warn(`[API 403] Salary update denied: ${user?.email} requires admin`)
      return
    }
    // Resume/other fields: only own or admin can edit
    if(!isOwn && !isAdmin){
      console.warn(`[API 403] Update denied: ${user?.email} cannot edit ${id}`)
      return
    }
    setData(d=>({...d, employees: d.employees.map(e=> e.id===id ? {...e, ...patch}: e)}))
  }
  // Security: change password - only own (or admin reset)
  const updateSecurity=(id:string, currentPass:string, newPass:string)=>{
    const myEmp = user ? getMyEmployee(user, data.employees) : undefined
    const isAdmin = user?.role==='admin'
    const isOwn = myEmp?.id===id
    if(!isOwn && !isAdmin) { console.warn('[API 403] Security update denied'); return false }
    // verify current password for own, admin can force reset without current
    const users=getUsers()
    const targetEmp = data.employees.find(e=>e.id===id)
    if(!targetEmp) return false
    const uIdx=users.findIndex(u=>u.email.toLowerCase()===targetEmp.email.toLowerCase())
    if(uIdx<0) return false
    if(!isAdmin || isOwn){
      if(users[uIdx].password !== currentPass) return false
    }
    if(newPass.length<6) return false
    users[uIdx].password=newPass
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return true
  }
  const addEmployee=(payload:{name:string; email:string; department:Employee['department']; role:string; phone?:string; manager?:string; location?:string; dob?:string})=>{
    // Backend authorization: only admin/HR can create employees
    if(user?.role!=='admin'){
      console.warn(`[API 403] Add employee denied: ${user?.email} not admin`)
      return null
    }
    // check duplicates
    const exists = data.employees.some(e=>e.email.toLowerCase()===payload.email.toLowerCase())
    if(exists) return null
    const users=getUsers()
    if(users.some(u=>u.email.toLowerCase()===payload.email.toLowerCase())) return null
    // generate IDs
    const nums=data.employees.map(e=>parseInt(e.id.replace('EMP',''))||1000)
    const nextNum=Math.max(...nums,1000)+1
    const newId=`EMP${String(nextNum).padStart(4,'0')}`
    const loginId=genLoginId(payload.name, data.employees.length)
    const tempPassword=`Welcome@${String(Math.floor(1000+Math.random()*9000))}`
    const salary=60000 + Math.floor(Math.random()*80000)
    const monthly=Math.round(salary/12)
    const skl = payload.department==='Engineering'? ['TypeScript','React','Node.js']: payload.department==='Design'? ['Figma','Design Systems','Prototyping']: ['Strategy','Communication','Analytics']
    const newEmp:Employee={
      id:newId,
      loginId,
      name:payload.name,
      email:payload.email,
      department:payload.department,
      role:payload.role,
      avatar:`https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)+1}`,
      salary,
      joinDate:new Date().toISOString().slice(0,10),
      phone:payload.phone||`+91 ${Math.floor(9000000000+Math.random()*999999999)}`,
      status:'Active',
      company:'Dayflow Inc.',
      manager:payload.manager|| 'Aarav Mehta',
      location:payload.location|| 'Mumbai HQ — Floor 5',
      dob:payload.dob|| new Date(1995, Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1).toISOString().slice(0,10),
      address:'',
      maritalStatus:'Single',
      nationality:'Indian',
      emergencyContact:'',
      bankAccount:'',
      bankName:'',
      ifsc:'',
      pan:'',
      wageType:'Fixed',
      monthlyWage: monthly,
      yearlyWage: monthly*12,
      workingDaysPerWeek:5,
      workingDaysPerMonth:22,
      breakTimeHrs:1,
      salaryComponents: salaryBreakdown(monthly),
      pfEmployerRate:12,
      pfEmployeeRate:12,
      professionalTax:200,
      gender:'Other',
      uan:`1012${String(100000000+data.employees.length).padStart(9,'0')}`,
      about:'',
      loveAboutJob:'',
      interestsDetail:'',
      skills:skl,
      education:[{degree:'B.Tech', school:'IIT Bombay', year:String(new Date().getFullYear()-4)}],
      certifications:[],
      hobbies:[],
      documents:[],
      skillEndorsements: Object.fromEntries(skl.map(s=>[s,1])),
    }
    // persist user for login
    const newUser={ id:'U'+Date.now(), name:payload.name, email:payload.email, password:tempPassword, role:'employee' as Role, avatar:newEmp.avatar, loginId }
    users.push(newUser); localStorage.setItem(USERS_KEY, JSON.stringify(users))
    // persist employee + attendance placeholder for today as Absent (will be updated on check-in)
    setData(d=>{
      const today=new Date().toISOString().slice(0,10)
      return {...d, employees:[...d.employees, newEmp], attendance:[...d.attendance, {id:`ATT-${newId}-${today}`, employeeId:newId, date:today, status:'Absent' as const, checkIn:undefined, checkOut:undefined, hours:0}]}
    })
    return {employee:newEmp, tempPassword, loginId}
  }
  const refreshBrief=()=>setData(d=>({...d}))

  return <AuthContext.Provider value={{ user, login, signup, logout, data, updateLeaves, updateAttendance, checkIn, checkOut, updateEmployee, updateSecurity, addEmployee, employees:visibleEmployees, attendance:data.attendance, leaves:data.leaves, refreshBrief }}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)

// helpers for metrics
export function useMetrics(){
  const { employees, attendance, leaves }=useAuth()
  const today=new Date().toISOString().slice(0,10)
  const todayAtt=attendance.filter(a=>a.date===today)
  const present=todayAtt.filter(a=>['Present','Late','Half-day'].includes(a.status)).length
  const absent=todayAtt.filter(a=>a.status==='Absent').length
  const onLeave=todayAtt.filter(a=>a.status==='Leave').length + leaves.filter(l=>l.status==='Approved' && l.startDate<=today && l.endDate>=today).length
  // deduplicate a bit
  const uniqueOnLeave = new Set([...todayAtt.filter(a=>a.status==='Leave').map(a=>a.employeeId), ...leaves.filter(l=>l.status==='Approved' && l.startDate<=today && l.endDate>=today).map(l=>l.employeeId)]).size
  const total=employees.length
  const pending=leaves.filter(l=>l.status==='Pending').length
  const availability = total? Math.round(((present)/(total))*1000)/10 : 0
  const leaveRate = total? Math.round((uniqueOnLeave/total)*1000)/10 :0
  const absenceRate = total? Math.round((absent/total)*1000)/10 :0
  const pulse = Math.max(0, Math.round((availability*0.6 + (100-leaveRate*2)*0.2 + (100-absenceRate*2)*0.2)*10)/10)
  const pulseLabel = pulse>=80?'Healthy': pulse>=60?'Stable':'Needs attention'
  return { total, present, absent, onLeave: uniqueOnLeave, pending, availability, leaveRate, absenceRate, pulse, pulseLabel, today }
}

export function departmentStats(employees: Employee[], attendance: Attendance[], leaves: LeaveRequest[]){
  const today=new Date().toISOString().slice(0,10)
  const map=new Map<string,{total:number, present:number, onLeave:number, absent:number}>()
  employees.forEach(e=>{
    if(!map.has(e.department)) map.set(e.department,{total:0, present:0, onLeave:0, absent:0})
    map.get(e.department)!.total++
  })
  attendance.filter(a=>a.date===today).forEach(a=>{
    const emp=employees.find(e=>e.id===a.employeeId)
    if(!emp) return
    const s=map.get(emp.department)!
    if(['Present','Late','Half-day'].includes(a.status)) s.present++
    else if(a.status==='Absent') s.absent++
    else if(a.status==='Leave') s.onLeave++
  })
  // add approved leaves not in attendance
  leaves.filter(l=>l.status==='Approved' && l.startDate<=today && l.endDate>=today).forEach(l=>{
    const emp=employees.find(e=>e.id===l.employeeId)
    if(!emp) return
    const s=map.get(emp.department)!
    // if not already counted
    const att=attendance.find(a=>a.employeeId===l.employeeId && a.date===today)
    if(!att || att.status!=='Leave') s.onLeave++
  })
  return Array.from(map.entries()).map(([dept, v])=>({
    dept, ...v, availability: v.total? Math.round((v.present/v.total)*100):0
  })).sort((a,b)=>a.availability-b.availability)
}
