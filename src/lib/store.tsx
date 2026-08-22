import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { calculatePayroll, loadSeed, saveData, type Attendance, type Dept, type Employee, type LeaveRequest, type Role } from './data'

type User = { id:string; name:string; email:string; loginId?:string; role:Role; avatar:string; department?:string; phone?:string; company?:string; mustChangePassword?:boolean }
type StoredUser = User & {password:string}
type NewEmployee = { name:string; email:string; phone:string; department:Dept; jobTitle:string; joinDate:string }

type Ctx = {
  user: User | null
  login: (identifier:string, pass:string) => boolean
  signup: (company:string,name:string,email:string,phone:string,pass:string)=>boolean
  logout: ()=>void
  data: ReturnType<typeof loadSeed>
  updateLeaves: (fn:(prev:LeaveRequest[])=>LeaveRequest[])=>void
  updateAttendance: (empId:string, status: Attendance['status'])=>void
  checkIn: (empId:string)=>void
  checkOut: (empId:string)=>void
  createEmployee: (input:NewEmployee)=>{ok:boolean; loginId?:string; temporaryPassword?:string; error?:string}
  reviewLeave: (leaveId:string,status:'Approved'|'Rejected',comment:string)=>void
  updateEmployee: (employeeId:string,patch:Partial<Employee>)=>void
  updatePayrollWage: (employeeId:string,wage:number)=>void
  employees: Employee[]
  attendance: Attendance[]
  leaves: LeaveRequest[]
  refreshBrief: ()=>void
}

const AuthContext = createContext<Ctx>(null as any)

const USERS_KEY='dayflow_users'
const SESSION_KEY='dayflow_session'
const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || ''
const DEMO_EMPLOYEE_PASSWORD = import.meta.env.VITE_DEMO_EMPLOYEE_PASSWORD || ''

function getUsers(): StoredUser[] {
  const v=localStorage.getItem(USERS_KEY)
  if(v) try{ return JSON.parse(v)}catch{}
  const defaults=[
    { id:'U1', name:'Aarav Sharma', email:'admin@dayflow.co', loginId:'OIARSH20200001', password:DEMO_ADMIN_PASSWORD, role:'admin' as Role, avatar:'https://i.pravatar.cc/150?img=12', company:'Dayflow' },
    { id:'U2', name:'Isha Patel', email:'isha@dayflow.co', loginId:'OIISPA20210002', password:DEMO_EMPLOYEE_PASSWORD, role:'employee' as Role, avatar:'https://i.pravatar.cc/150?img=5' },
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults))
  return defaults
}
function saveUsers(users:StoredUser[]){ localStorage.setItem(USERS_KEY,JSON.stringify(users)) }
function timeNow(){ return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}) }
function minutes(value?:string){ if(!value) return 0; const [h,m]=value.split(':').map(Number); return h*60+m }

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(()=>{ const s=localStorage.getItem(SESSION_KEY); return s? JSON.parse(s): null })
  const [data,setData]=useState(()=>loadSeed())

  useEffect(()=>{ saveData(data)},[data])

  const login=(identifier:string, pass:string)=>{
    const users=getUsers()
    const key=identifier.trim().toLowerCase()
    const found=users.find(u=>(u.email.toLowerCase()===key || u.loginId?.toLowerCase()===key) && u.password===pass)
    if(!found) return false
    const {password, ...rest}=found
    setUser(rest as User); localStorage.setItem(SESSION_KEY, JSON.stringify(rest))
    return true
  }
  const signup=(company:string,name:string,email:string,phone:string,pass:string)=>{
    const users=getUsers()
    if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return false
    const newUser:StoredUser={ id:'U'+Date.now(), name, email, phone, company, password:pass, role:'admin', loginId:`${company.replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase()}ADMIN${new Date().getFullYear()}0001`, avatar:`https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)+1}`}
    users.push(newUser); saveUsers(users)
    const {password, ...rest}=newUser
    setUser(rest as User); localStorage.setItem(SESSION_KEY, JSON.stringify(rest))
    return true
  }
  const logout=()=>{ setUser(null); localStorage.removeItem(SESSION_KEY)}

  const updateLeaves=(fn:(prev:LeaveRequest[])=>LeaveRequest[])=>{
    setData(d=>({...d, leaves: fn(d.leaves)}))
  }
  const updateAttendance=(empId:string, status: Attendance['status'])=>{
    const today=new Date().toISOString().slice(0,10)
    setData(d=>{
      const idx=d.attendance.findIndex(a=>a.employeeId===empId && a.date===today)
      let next=[...d.attendance]
      if(idx>=0){ next[idx]={...next[idx], status, checkIn: status==='Present'?'09:02':next[idx].checkIn, checkOut: status==='Present'?'18:05':undefined}}
      else next.push({ id:`ATT-${empId}-${today}`, employeeId:empId, date:today, status, checkIn:'09:02', checkOut:'18:05'})
      return {...d, attendance: next}
    })
  }
  const checkIn=(empId:string)=>{
    const today=new Date().toISOString().slice(0,10)
    const now=timeNow()
    setData(d=>{
      const next=[...d.attendance]
      const idx=next.findIndex(a=>a.employeeId===empId && a.date===today)
      const record:Attendance={id:`ATT-${empId}-${today}`,employeeId:empId,date:today,status:'Present',checkIn:now}
      if(idx>=0) next[idx]={...next[idx],...record,checkOut:undefined,hours:undefined,extraHours:undefined}
      else next.push(record)
      return {...d,attendance:next}
    })
  }
  const checkOut=(empId:string)=>{
    const today=new Date().toISOString().slice(0,10)
    const now=timeNow()
    setData(d=>{
      const next=[...d.attendance]
      const idx=next.findIndex(a=>a.employeeId===empId && a.date===today)
      if(idx<0 || !next[idx].checkIn) return d
      const elapsed=Math.max(0,minutes(now)-minutes(next[idx].checkIn))
      const worked=Math.max(0,elapsed-(elapsed>=360?60:0))
      next[idx]={...next[idx],checkOut:now,hours:Math.round(worked/6)/10,extraHours:Math.round(Math.max(0,worked-480)/6)/10}
      return {...d,attendance:next}
    })
  }
  const createEmployee=(input:NewEmployee)=>{
    if(!user || user.role==='employee') return {ok:false,error:'Only HR/Admin can create employees'}
    const users=getUsers()
    if(users.some(u=>u.email.toLowerCase()===input.email.toLowerCase())) return {ok:false,error:'Email already exists'}
    const parts=input.name.trim().split(/\s+/)
    const initials=`${parts[0]?.slice(0,2)||'EM'}${parts[parts.length-1]?.slice(0,2)||'PL'}`.toUpperCase()
    const year=input.joinDate.slice(0,4)
    const serial=String(users.filter(u=>u.loginId?.includes(year)).length+1).padStart(4,'0')
    const loginId=`OI${initials}${year}${serial}`
    const temporaryPassword=`Df!${loginId.slice(-4)}${Math.floor(1000+Math.random()*9000)}`
    const employee:Employee={id:loginId,name:input.name,email:input.email,phone:input.phone,department:input.department,role:input.jobTitle,avatar:`https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)+1}`,salary:50000,joinDate:input.joinDate,status:'Active',manager:user.name,location:'Bengaluru',address:'',about:'',interests:'',skills:[],certifications:[]}
    users.push({id:'U'+Date.now(),name:input.name,email:input.email,loginId,password:temporaryPassword,role:'employee',avatar:employee.avatar,department:input.department,mustChangePassword:true})
    saveUsers(users)
    setData(d=>({...d,employees:[...d.employees,employee],payroll:[...d.payroll,calculatePayroll(employee.id,employee.salary)]}))
    return {ok:true,loginId,temporaryPassword}
  }
  const reviewLeave=(leaveId:string,status:'Approved'|'Rejected',comment:string)=>{
    setData(d=>{
      const leave=d.leaves.find(l=>l.id===leaveId)
      if(!leave) return d
      const leaves=d.leaves.map(l=>l.id===leaveId?{...l,status,reviewComment:comment,reviewedBy:user?.name,reviewedAt:new Date().toISOString()}:l)
      if(status!=='Approved') return {...d,leaves}
      const attendance=[...d.attendance]
      for(let cursor=new Date(`${leave.startDate}T00:00:00`), end=new Date(`${leave.endDate}T00:00:00`); cursor<=end; cursor.setDate(cursor.getDate()+1)){
        const date=cursor.toISOString().slice(0,10)
        const idx=attendance.findIndex(a=>a.employeeId===leave.employeeId && a.date===date)
        const row:Attendance={id:`ATT-${leave.employeeId}-${date}`,employeeId:leave.employeeId,date,status:'Leave'}
        if(idx>=0) attendance[idx]=row; else attendance.push(row)
      }
      return {...d,leaves,attendance}
    })
  }
  const updateEmployee=(employeeId:string,patch:Partial<Employee>)=>setData(d=>({...d,employees:d.employees.map(e=>e.id===employeeId?{...e,...patch}:e)}))
  const updatePayrollWage=(employeeId:string,wage:number)=>setData(d=>({...d,employees:d.employees.map(e=>e.id===employeeId?{...e,salary:wage}:e),payroll:d.payroll.map(p=>p.employeeId===employeeId?calculatePayroll(employeeId,wage):p)}))
  const refreshBrief=()=>setData(d=>({...d}))

  return <AuthContext.Provider value={{ user, login, signup, logout, data, updateLeaves, updateAttendance, checkIn, checkOut, createEmployee, reviewLeave, updateEmployee, updatePayrollWage, employees:data.employees, attendance:data.attendance, leaves:data.leaves, refreshBrief }}>{children}</AuthContext.Provider>
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
