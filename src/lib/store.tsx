import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Attendance, Dept, Employee, LeaveRequest, PayrollRecord, Role } from './data'

type User = { id:string; companyId:string; employeeId?:string; name:string; email:string; loginId?:string; role:Role; avatar:string; department?:string; phone?:string; mustChangePassword?:boolean; emailVerified?:boolean }
type NewEmployee = { name:string; email:string; phone:string; department:Dept; jobTitle:string; joinDate:string }
type NewLeave = { employeeId:string; type:'Paid'|'Sick'|'Unpaid'; startDate:string; endDate:string; reason:string; attachmentName?:string; attachmentKey?:string }
export type EmployeeDetails={employee:Employee;privateInfo:Record<string,string>|null;bankDetails:Record<string,string>|null;salaryConfig:Record<string,any>|null;documents:Array<{id:string;name:string;contentType:string;size:number;type:string;url:string;createdAt:string}>;permissions:{own:boolean;manager:boolean}}
type WorkspaceData = { company?:{id:string;name:string;code:string;logoPath?:string}|null;employees:Employee[];attendance:Attendance[];leaves:LeaveRequest[];payroll:PayrollRecord[];notifications?:Array<Record<string,unknown>>;leaveBalances?:Array<{employeeId:string;code:string;name:string;allocated:number;used:number;remaining:number;year:number}>;holidays?:Array<{id:string;date:string;name:string}>;workingSchedule?:{name:string;workingDaysPerWeek:number;dailyMinutes:number;breakMinutes:number;startTime:string;endTime:string}|null;version:number }
type MutationResult = { ok:boolean; error?:string }

type Ctx = {
  user: User | null
  ready: boolean
  login: (identifier:string, pass:string) => Promise<{ok:boolean; mustChangePassword?:boolean; error?:string}>
  signup: (company:string,name:string,email:string,phone:string,pass:string)=>Promise<boolean>
  logout: ()=>void
  changePassword: (currentPassword:string,newPassword:string)=>Promise<MutationResult>
  data: WorkspaceData
  createLeave: (input:NewLeave)=>Promise<MutationResult>
  checkIn: (empId:string)=>Promise<MutationResult>
  checkOut: (empId:string)=>Promise<MutationResult>
  createEmployee: (input:NewEmployee)=>Promise<{ok:boolean; loginId?:string; temporaryPassword?:string; error?:string}>
  reviewLeave: (leaveId:string,status:'Approved'|'Rejected',comment:string)=>Promise<MutationResult>
  updateEmployee: (employeeId:string,patch:Partial<Employee>)=>Promise<MutationResult>
  getEmployeeDetails:(employeeId:string)=>Promise<{ok:boolean;details?:EmployeeDetails;error?:string}>
  updateEmployeeDetails:(employeeId:string,input:{privateInfo?:Record<string,unknown>;bankDetails?:Record<string,unknown>})=>Promise<MutationResult>
  uploadAvatar:(employeeId:string,file:File)=>Promise<MutationResult>
  updatePayrollWage: (employeeId:string,wage:number,salaryConfig?:Record<string,unknown>)=>Promise<MutationResult>
  employees: Employee[]
  attendance: Attendance[]
  leaves: LeaveRequest[]
  refreshBrief: ()=>void
  syncStatus: 'offline'|'loading'|'ready'|'saving'|'error'
}

const AuthContext = createContext<Ctx>(null as never)
const emptyData:WorkspaceData={company:null,employees:[],attendance:[],leaves:[],payroll:[],notifications:[],leaveBalances:[],holidays:[],workingSchedule:null,version:3}

async function requestJson<T>(url:string,options?:RequestInit):Promise<T>{
  const response=await fetch(url,options)
  const result:any=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(result.error||'The local DayFlow service is unavailable')
  return result as T
}

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null)
  const [data,setData]=useState<WorkspaceData>(emptyData)
  const [ready,setReady]=useState(false)
  const [syncStatus,setSyncStatus]=useState<Ctx['syncStatus']>('loading')

  async function loadWorkspace(){
    setSyncStatus('loading')
    const workspace=await requestJson<WorkspaceData>('/api/workspace')
    setData(workspace)
    setSyncStatus('ready')
  }

  useEffect(()=>{
    let cancelled=false
    requestJson<{user:User}>('/api/auth').then(async result=>{
      if(cancelled)return
      setUser(result.user)
      await loadWorkspace()
    }).catch(()=>{if(!cancelled){setUser(null);setData(emptyData);setSyncStatus('offline')}}).finally(()=>{if(!cancelled)setReady(true)})
    return()=>{cancelled=true}
  },[])

  const login=async(identifier:string,pass:string)=>{
    try{
      setSyncStatus('loading')
      const result=await requestJson<{user:User}>('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',identifier,password:pass})})
      setUser(result.user)
      await loadWorkspace()
      setReady(true)
      return {ok:true,mustChangePassword:result.user.mustChangePassword}
    }catch(error){setSyncStatus('offline');return {ok:false,error:error instanceof Error?error.message:'Invalid credentials'}}
  }
  const signup=async(company:string,name:string,email:string,phone:string,pass:string)=>{
    try{
      const result=await requestJson<{user:User}>('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signup',company,name,email,phone,password:pass})})
      setUser(result.user);await loadWorkspace();setReady(true);return true
    }catch{return false}
  }
  const logout=()=>{
    requestJson('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})}).catch(()=>{})
    setUser(null);setData(emptyData);setSyncStatus('offline')
  }
  const changePassword=async(currentPassword:string,newPassword:string)=>{
    try{
      const result=await requestJson<{user:User}>('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'change-password',currentPassword,newPassword})})
      setUser(result.user);return {ok:true}
    }catch(error){return {ok:false,error:error instanceof Error?error.message:'Password change failed'}}
  }
  const createEmployee=async(input:NewEmployee)=>{
    try{
      setSyncStatus('saving')
      const result=await requestJson<{loginId:string;temporaryPassword:string}>('/api/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})
      await loadWorkspace()
      return {ok:true,loginId:result.loginId,temporaryPassword:result.temporaryPassword}
    }catch(error){setSyncStatus('error');return {ok:false,error:error instanceof Error?error.message:'Could not create employee'}}
  }
  const createLeave=async(input:NewLeave)=>{
    try{
      setSyncStatus('saving')
      const result=await requestJson<{leave:LeaveRequest}>('/api/leaves',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})
      setData(current=>({...current,leaves:[result.leave,...current.leaves]}));setSyncStatus('ready');return {ok:true}
    }catch(error){setSyncStatus('error');return {ok:false,error:error instanceof Error?error.message:'Could not submit leave'}}
  }
  const checkIn=async(employeeId:string)=>attendanceAction('/api/attendance/check-in',employeeId)
  const checkOut=async(employeeId:string)=>attendanceAction('/api/attendance/check-out',employeeId)
  async function attendanceAction(url:string,employeeId:string){
    try{
      const result=await requestJson<{attendance:Attendance}>(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employeeId})})
      setData(current=>({...current,attendance:[result.attendance,...current.attendance.filter(row=>row.id!==result.attendance.id)]}));return {ok:true}
    }catch(error){return {ok:false,error:error instanceof Error?error.message:'Attendance action failed'}}
  }
  const reviewLeave=async(leaveId:string,status:'Approved'|'Rejected',comment:string)=>{
    try{
      const result=await requestJson<{leave:LeaveRequest}>(`/api/leaves/${encodeURIComponent(leaveId)}/review`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,comment})})
      setData(current=>({...current,leaves:current.leaves.map(leave=>leave.id===leaveId?result.leave:leave)}));await loadWorkspace();return {ok:true}
    }catch(error){return {ok:false,error:error instanceof Error?error.message:'Could not review leave'}}
  }
  const updateEmployee=async(employeeId:string,patch:Partial<Employee>)=>{
    try{
      const result=await requestJson<{employee:Employee}>(`/api/employees/${encodeURIComponent(employeeId)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)})
      setData(current=>({...current,employees:current.employees.map(employee=>employee.id===employeeId?{...employee,...result.employee}:employee)}));return {ok:true}
    }catch(error){return {ok:false,error:error instanceof Error?error.message:'Could not update profile'}}
  }
  const getEmployeeDetails=async(employeeId:string)=>{
    try{return {ok:true,details:await requestJson<EmployeeDetails>(`/api/employees/${encodeURIComponent(employeeId)}/details`)}}
    catch(error){return {ok:false,error:error instanceof Error?error.message:'Could not load employee details'}}
  }
  const updateEmployeeDetails=async(employeeId:string,input:{privateInfo?:Record<string,unknown>;bankDetails?:Record<string,unknown>})=>{
    try{await requestJson(`/api/employees/${encodeURIComponent(employeeId)}/details`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});return {ok:true}}
    catch(error){return {ok:false,error:error instanceof Error?error.message:'Could not update private information'}}
  }
  const uploadAvatar=async(employeeId:string,file:File)=>{
    try{const form=new FormData();form.append('file',file);await requestJson(`/api/employees/${encodeURIComponent(employeeId)}/avatar`,{method:'POST',body:form});await loadWorkspace();return {ok:true}}
    catch(error){return {ok:false,error:error instanceof Error?error.message:'Could not update profile picture'}}
  }
  const updatePayrollWage=async(employeeId:string,wage:number,salaryConfig?:Record<string,unknown>)=>{
    try{
      const result=await requestJson<{payroll:PayrollRecord;wage:number}>(`/api/payroll/${encodeURIComponent(employeeId)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({wage,salaryConfig})})
      setData(current=>({...current,employees:current.employees.map(employee=>employee.id===employeeId?{...employee,salary:result.wage}:employee),payroll:[result.payroll,...current.payroll.filter(record=>record.employeeId!==employeeId||record.month!==result.payroll.month)]}));return {ok:true}
    }catch(error){return {ok:false,error:error instanceof Error?error.message:'Could not update payroll'}}
  }
  const refreshBrief=()=>{loadWorkspace().catch(()=>setSyncStatus('error'))}

  return <AuthContext.Provider value={{user,ready,login,signup,logout,changePassword,data,createLeave,checkIn,checkOut,createEmployee,reviewLeave,updateEmployee,getEmployeeDetails,updateEmployeeDetails,uploadAvatar,updatePayrollWage,employees:data.employees,attendance:data.attendance,leaves:data.leaves,refreshBrief,syncStatus}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)

export function useMetrics(){
  const { employees, attendance, leaves }=useAuth()
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const todayAtt=attendance.filter(a=>a.date===today)
  const present=todayAtt.filter(a=>['Present','Late','Half-day'].includes(a.status)).length
  const absent=todayAtt.filter(a=>a.status==='Absent').length
  const uniqueOnLeave = new Set([...todayAtt.filter(a=>a.status==='Leave').map(a=>a.employeeId), ...leaves.filter(l=>l.status==='Approved' && l.startDate<=today && l.endDate>=today).map(l=>l.employeeId)]).size
  const total=employees.length
  const pending=leaves.filter(l=>l.status==='Pending').length
  const availability = total? Math.round((present/total)*1000)/10 : 0
  const leaveRate = total? Math.round((uniqueOnLeave/total)*1000)/10 :0
  const absenceRate = total? Math.round((absent/total)*1000)/10 :0
  const pulse = Math.max(0, Math.round((availability*0.6 + (100-leaveRate*2)*0.2 + (100-absenceRate*2)*0.2)*10)/10)
  const pulseLabel = pulse>=80?'Healthy': pulse>=60?'Stable':'Needs attention'
  return { total, present, absent, onLeave:uniqueOnLeave, pending, availability, leaveRate, absenceRate, pulse, pulseLabel, today }
}

export function departmentStats(employees: Employee[], attendance: Attendance[], leaves: LeaveRequest[]){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const map=new Map<string,{total:number;present:number;onLeave:number;absent:number}>()
  employees.forEach(employee=>{if(!map.has(employee.department))map.set(employee.department,{total:0,present:0,onLeave:0,absent:0});map.get(employee.department)!.total++})
  attendance.filter(row=>row.date===today).forEach(row=>{const employee=employees.find(item=>item.id===row.employeeId);if(!employee)return;const stats=map.get(employee.department)!;if(['Present','Late','Half-day'].includes(row.status))stats.present++;else if(row.status==='Absent')stats.absent++;else if(row.status==='Leave')stats.onLeave++})
  leaves.filter(leave=>leave.status==='Approved'&&leave.startDate<=today&&leave.endDate>=today).forEach(leave=>{const employee=employees.find(item=>item.id===leave.employeeId);if(!employee)return;const row=attendance.find(item=>item.employeeId===leave.employeeId&&item.date===today);if(!row||row.status!=='Leave')map.get(employee.department)!.onLeave++})
  return Array.from(map.entries()).map(([dept,value])=>({dept,...value,availability:value.total?Math.round((value.present/value.total)*100):0})).sort((a,b)=>a.availability-b.availability)
}
