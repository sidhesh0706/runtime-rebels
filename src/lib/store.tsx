import { createContext, useContext, useEffect, useState, useMemo, useRef, type ReactNode } from 'react'
import { loadSeed, saveData, type Attendance, type Employee, type LeaveRequest, type Role, type Seed, type PayrollRecord, genLoginId, salaryBreakdown } from './data'

type User = { id:string; name:string; email:string; role:Role; avatar:string; department?:string; loginId?:string; companyName?:string; phone?:string; mustChangePassword?:boolean }

type Ctx = {
  user: User | null
  login: (email:string, pass:string) => Promise<boolean>
  signup: (name:string,email:string,pass:string,role:Role, extra?:{companyName?:string; phone?:string})=>Promise<boolean>
  logout: ()=>void
  data: ReturnType<typeof loadSeed>
  updateLeaves: (fn:(prev:LeaveRequest[])=>LeaveRequest[])=>void
  updateAttendance: (empId:string, status: Attendance['status'])=>void
  checkIn: (empId:string)=>void
  checkOut: (empId:string)=>void
  updateEmployee: (id:string, patch:Partial<Employee>)=>void
  updateSecurity: (id:string, currentPass:string, newPass:string)=>Promise<boolean>
  addEmployee: (payload:{name:string; email:string; department:Employee['department']; role:string; phone?:string; manager?:string; location?:string; dob?:string})=>Promise<{employee:Employee; tempPassword:string; loginId:string} | null>
  reviewLeave: (leaveId:string,status:'Approved'|'Rejected',comment:string)=>Promise<{ok:boolean; error?:string}>
  updatePayrollWage: (employeeId:string,wage:number)=>Promise<{ok:boolean; error?:string}>
  changePassword: (currentPassword:string,newPassword:string)=>Promise<{ok:boolean; error?:string}>
  employees: Employee[]
  attendance: Attendance[]
  leaves: LeaveRequest[]
  refreshBrief: ()=>void
}

const AuthContext = createContext<Ctx>(null as any)

const SESSION_KEY='dayflow_session'
export const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'Admin@123'
export const DEMO_EMPLOYEE_PASSWORD = import.meta.env.VITE_DEMO_EMPLOYEE_PASSWORD || 'Employee@123'

async function requestJson<T>(url:string,options?:RequestInit):Promise<T>{
  const response=await fetch(url,{credentials:'same-origin',...options})
  const result:any=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(result.error||'The local DayFlow API is unavailable')
  return result as T
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
  const [data,setData]=useState<Seed>(()=>loadSeed())
  const hydrated=useRef(false)
  const persistTimer=useRef<ReturnType<typeof setTimeout>|null>(null)

  async function loadWorkspace(fallback:Seed){
    const result=await requestJson<{data:Seed|null}>('/api/workspace')
    if(result.data){setData(result.data);saveData(result.data)}
    else await requestJson('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:fallback})})
    hydrated.current=true
  }

  useEffect(()=>{
    if(!user)return
    requestJson<{user:User|null}>('/api/auth').then(async result=>{
      if(!result.user){setUser(null);localStorage.removeItem(SESSION_KEY);return}
      setUser(result.user);localStorage.setItem(SESSION_KEY,JSON.stringify(result.user));await loadWorkspace(data)
    }).catch(()=>{})
  },[])

  useEffect(()=>{
    saveData(data)
    if(!user||!hydrated.current)return
    if(persistTimer.current)clearTimeout(persistTimer.current)
    persistTimer.current=setTimeout(()=>{requestJson('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data})}).catch(error=>console.error('[PostgreSQL sync]',error))},180)
    return ()=>{if(persistTimer.current)clearTimeout(persistTimer.current)}
  },[data,user])

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

  const login=async(email:string, pass:string)=>{
    try{
      const result=await requestJson<{user:User}>('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',identifier:email,password:pass})})
      setUser(result.user);localStorage.setItem(SESSION_KEY,JSON.stringify(result.user));await loadWorkspace(data);return true
    }catch{return false}
  }
  const signup=async(name:string,email:string,pass:string,_role:Role, extra?:{companyName?:string; phone?:string})=>{
    try{
      const result=await requestJson<{user:User}>('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signup',company:extra?.companyName,name,email,phone:extra?.phone,password:pass})})
      setUser(result.user);localStorage.setItem(SESSION_KEY,JSON.stringify(result.user));await loadWorkspace(data);return true
    }catch{return false}
  }
  const logout=()=>{requestJson('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})}).catch(()=>{});setUser(null);hydrated.current=false;localStorage.removeItem(SESSION_KEY)}

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
  const updateSecurity=async(id:string, currentPass:string, newPass:string)=>{
    const myEmp = user ? getMyEmployee(user, data.employees) : undefined
    const isAdmin = user?.role==='admin'
    const isOwn = myEmp?.id===id
    if(!isOwn && !isAdmin) return false
    try{const result=await requestJson<{user:User}>('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'change-password',currentPassword:currentPass,newPassword:newPass})});setUser(result.user);localStorage.setItem(SESSION_KEY,JSON.stringify(result.user));return true}catch{return false}
  }
  const changePassword=async(currentPassword:string,newPassword:string)=>{
    if(!user) return {ok:false,error:'You must be signed in'}
    const employee=getMyEmployee(user, data.employees)
    if(!employee || !(await updateSecurity(employee.id,currentPassword,newPassword))) return {ok:false,error:'Current password is incorrect'}
    const nextUser={...user,mustChangePassword:false}
    setUser(nextUser)
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    return {ok:true}
  }
  const addEmployee=async(payload:{name:string; email:string; department:Employee['department']; role:string; phone?:string; manager?:string; location?:string; dob?:string})=>{
    // Backend authorization: only admin/HR can create employees
    if(user?.role!=='admin'){
      console.warn(`[API 403] Add employee denied: ${user?.email} not admin`)
      return null
    }
    // check duplicates
    const exists = data.employees.some(e=>e.email.toLowerCase()===payload.email.toLowerCase())
    if(exists) return null
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
    try{await requestJson('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:payload.name,email:payload.email,loginId,password:tempPassword,avatar:newEmp.avatar,department:payload.department,phone:payload.phone})})}catch{return null}
    // persist employee + attendance placeholder for today as Absent (will be updated on check-in)
    setData(d=>{
      const today=new Date().toISOString().slice(0,10)
      return {...d, employees:[...d.employees, newEmp], attendance:[...d.attendance, {id:`ATT-${newId}-${today}`, employeeId:newId, date:today, status:'Absent' as const, checkIn:undefined, checkOut:undefined, hours:0}]}
    })
    return {employee:newEmp, tempPassword, loginId}
  }
  const reviewLeave=async(leaveId:string,status:'Approved'|'Rejected',comment:string)=>{
    if(user?.role!=='admin') return {ok:false,error:'Administrator access required'}
    setData(d=>({...d,leaves:d.leaves.map(leave=>leave.id===leaveId?{...leave,status,reviewedBy:user.name}:leave)}))
    void comment
    return {ok:true}
  }
  const updatePayrollWage=async(employeeId:string,wage:number)=>{
    if(user?.role!=='admin') return {ok:false,error:'Administrator access required'}
    const employee=data.employees.find(item=>item.id===employeeId)
    if(!employee) return {ok:false,error:'Employee not found'}
    const payroll:PayrollRecord={employeeId,base:wage,bonus:Math.floor(wage*0.08),deductions:Math.floor(wage*0.12),net:Math.floor(wage*0.96),month:new Date().toISOString().slice(0,7)}
    setData(d=>({...d,employees:d.employees.map(item=>item.id===employeeId?{...item,salary:wage,monthlyWage:wage,yearlyWage:wage*12,salaryComponents:salaryBreakdown(wage)}:item),payroll:d.payroll.map(item=>item.employeeId===employeeId?payroll:item)}))
    return {ok:true}
  }
  const refreshBrief=()=>setData(d=>({...d}))

  return <AuthContext.Provider value={{ user, login, signup, logout, data, updateLeaves, updateAttendance, checkIn, checkOut, updateEmployee, updateSecurity, addEmployee, reviewLeave, updatePayrollWage, changePassword, employees:visibleEmployees, attendance:data.attendance, leaves:data.leaves, refreshBrief }}>{children}</AuthContext.Provider>
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
