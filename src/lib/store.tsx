import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadSeed, saveData, type Attendance, type Employee, type LeaveRequest, type Role } from './data'

type User = { id:string; name:string; email:string; role:Role; avatar:string; department?:string }

type Ctx = {
  user: User | null
  login: (email:string, pass:string) => boolean
  signup: (name:string,email:string,pass:string,role:Role)=>boolean
  logout: ()=>void
  data: ReturnType<typeof loadSeed>
  updateLeaves: (fn:(prev:LeaveRequest[])=>LeaveRequest[])=>void
  updateAttendance: (empId:string, status: Attendance['status'])=>void
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

function getUsers(): Array<User & {password:string}> {
  const v=localStorage.getItem(USERS_KEY)
  if(v) try{ return JSON.parse(v)}catch{}
  const defaults=[
    { id:'U1', name:'Aarav Sharma', email:'admin@dayflow.co', password:DEMO_ADMIN_PASSWORD, role:'admin' as Role, avatar:'https://i.pravatar.cc/150?img=12' },
    { id:'U2', name:'Isha Patel', email:'isha@dayflow.co', password:DEMO_EMPLOYEE_PASSWORD, role:'employee' as Role, avatar:'https://i.pravatar.cc/150?img=5' },
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults))
  return defaults
}

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(()=>{ const s=localStorage.getItem(SESSION_KEY); return s? JSON.parse(s): null })
  const [data,setData]=useState(()=>loadSeed())

  useEffect(()=>{ saveData(data)},[data])

  const login=(email:string, pass:string)=>{
    const users=getUsers()
    const found=users.find(u=>u.email.toLowerCase()===email.toLowerCase() && u.password===pass)
    if(!found) return false
    const {password, ...rest}=found
    setUser(rest as User); localStorage.setItem(SESSION_KEY, JSON.stringify(rest))
    return true
  }
  const signup=(name:string,email:string,pass:string,role:Role)=>{
    const users=getUsers()
    if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return false
    const newUser={ id: 'U'+Date.now(), name, email, password:pass, role, avatar:`https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)+1}`}
    users.push(newUser); localStorage.setItem(USERS_KEY, JSON.stringify(users))
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
  const refreshBrief=()=>setData(d=>({...d}))

  return <AuthContext.Provider value={{ user, login, signup, logout, data, updateLeaves, updateAttendance, employees:data.employees, attendance:data.attendance, leaves:data.leaves, refreshBrief }}>{children}</AuthContext.Provider>
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
