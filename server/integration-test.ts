import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { pool } from './db.js'

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001'
let testCompanyId = ''
const uploadedFiles:string[]=[]

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function json(path: string, options: RequestInit = {}, cookie?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}), ...(cookie ? { cookie } : {}) },
  })
  const body: any = await response.json().catch(() => ({}))
  return { response, body }
}

function cookieFrom(response: Response) {
  const cookie = (response.headers.get('set-cookie') || '').split(';', 1)[0]
  expect(cookie.includes('dayflow_session='), 'Session cookie was not issued')
  return cookie
}

function nextWeekday() {
  const date = new Date()
  do date.setUTCDate(date.getUTCDate() + 1); while ([0,6].includes(date.getUTCDay()))
  return date.toISOString().slice(0,10)
}

function followingWeekday(value:string){
  const date=new Date(`${value}T00:00:00Z`)
  do date.setUTCDate(date.getUTCDate()+1); while([0,6].includes(date.getUTCDay()))
  return date.toISOString().slice(0,10)
}

async function cleanup() {
  if (!testCompanyId) return
  const documents=await pool.query('SELECT storage_name FROM documents WHERE company_id=$1',[testCompanyId])
  uploadedFiles.push(...documents.rows.map(row=>String(row.storage_name)))
  await pool.query('DELETE FROM audit_logs WHERE company_id=$1',[testCompanyId])
  await pool.query('DELETE FROM companies WHERE id=$1',[testCompanyId])
  for(const file of uploadedFiles)await unlink(join(process.cwd(),'server','uploads',file)).catch(()=>{})
}

async function main() {
  const suffix = randomUUID().slice(0,8)
  const signup = await json('/api/auth',{method:'POST',body:JSON.stringify({action:'signup',company:`Integration ${suffix}`,name:'Test Admin',email:`admin-${suffix}@test.dayflow`,phone:'+91 9999999999',password:'AdminPass9!'})})
  expect(signup.response.status===201,`Signup failed: ${signup.body.error||signup.response.status}`)
  testCompanyId=signup.body.user.companyId
  const adminCookie=cookieFrom(signup.response)

  const initialWorkspace=await json('/api/workspace',{},adminCookie)
  expect(initialWorkspace.body.employees.length===1&&initialWorkspace.body.payroll.length===1,'New workspace defaults are incomplete')

  const employeeEmail=`employee-${suffix}@test.dayflow`
  const employeeCreated=await json('/api/employees',{method:'POST',body:JSON.stringify({name:'Test Employee',email:employeeEmail,phone:'+91 9888888888',department:'Engineering',jobTitle:'Test Engineer',joinDate:'2026-01-15'})},adminCookie)
  expect(employeeCreated.response.status===201,`Employee creation failed: ${employeeCreated.body.error||employeeCreated.response.status}`)

  const employeeLogin=await json('/api/auth',{method:'POST',body:JSON.stringify({action:'login',identifier:employeeCreated.body.loginId,password:employeeCreated.body.temporaryPassword})})
  expect(employeeLogin.response.status===200&&employeeLogin.body.user.mustChangePassword===true,'Temporary credential login failed')
  let employeeCookie=cookieFrom(employeeLogin.response)

  const blockedWrite=await json(`/api/employees/${encodeURIComponent(employeeCreated.body.id)}`,{method:'PATCH',body:JSON.stringify({phone:'+91 9777777777'})},employeeCookie)
  expect(blockedWrite.response.status===403,'Temporary-password account could mutate records before changing password')

  const passwordChange=await json('/api/auth',{method:'POST',body:JSON.stringify({action:'change-password',currentPassword:employeeCreated.body.temporaryPassword,newPassword:'PersonalPass9!'})},employeeCookie)
  expect(passwordChange.response.status===200&&passwordChange.body.user.mustChangePassword===false,`Password change failed: ${passwordChange.body.error||passwordChange.response.status}`)
  employeeCookie=cookieFrom(passwordChange.response)

  const profileUpdate=await json(`/api/employees/${encodeURIComponent(employeeCreated.body.id)}`,{method:'PATCH',body:JSON.stringify({phone:'+91 9777777777',about:'Integration verified'})},employeeCookie)
  expect(profileUpdate.response.status===200&&profileUpdate.body.employee.phone==='+91 9777777777','Own-profile update failed after password change')

  const uploadForm=new FormData()
  uploadForm.append('file',new Blob(['%PDF-1.4 DayFlow integration attachment'],{type:'application/pdf'}),'test-certificate.pdf')
  const uploadResponse=await fetch(`${baseUrl}/api/uploads`,{method:'POST',headers:{cookie:employeeCookie},body:uploadForm})
  const uploadBody:any=await uploadResponse.json().catch(()=>({}))
  expect(uploadResponse.status===201&&uploadBody.key,`Protected upload failed: ${uploadBody.error||uploadResponse.status}`)
  const anonymousDownload=await fetch(`${baseUrl}${uploadBody.url}`)
  expect(anonymousDownload.status===401,'Anonymous attachment download was not denied')
  const employeeDownload=await fetch(`${baseUrl}${uploadBody.url}`,{headers:{cookie:employeeCookie}})
  expect(employeeDownload.status===200&&employeeDownload.headers.get('content-type')?.includes('application/pdf'),'Employee could not retrieve their protected attachment')
  const adminDownload=await fetch(`${baseUrl}${uploadBody.url}`,{headers:{cookie:adminCookie}})
  expect(adminDownload.status===200,'Administrator could not retrieve the company attachment')

  const leaveDate=nextWeekday()
  const leaveCreated=await json('/api/leaves',{method:'POST',body:JSON.stringify({employeeId:employeeCreated.body.id,type:'Paid',startDate:leaveDate,endDate:leaveDate,reason:'Integration test leave'})},employeeCookie)
  expect(leaveCreated.response.status===201&&leaveCreated.body.leave.days===1,`Leave creation failed: ${leaveCreated.body.error||leaveCreated.response.status}`)

  const leaveReview=await json(`/api/leaves/${encodeURIComponent(leaveCreated.body.leave.id)}/review`,{method:'POST',body:JSON.stringify({status:'Approved',comment:'Integration approval'})},adminCookie)
  expect(leaveReview.response.status===200&&leaveReview.body.leave.status==='Approved',`Leave approval failed: ${leaveReview.body.error||leaveReview.response.status}`)
  const attendanceStatus=await pool.query('SELECT status FROM attendance WHERE employee_id=$1 AND work_date=$2',[employeeCreated.body.id,leaveDate]).then(result=>result.rows[0]?.status)
  expect(attendanceStatus==='Leave','Approved leave did not synchronize attendance')

  const sickDate=followingWeekday(leaveDate)
  const sickLeave=await json('/api/leaves',{method:'POST',body:JSON.stringify({employeeId:employeeCreated.body.id,type:'Sick',startDate:sickDate,endDate:sickDate,reason:'Integration certificate test',attachmentKey:uploadBody.key,attachmentName:uploadBody.fileName})},employeeCookie)
  expect(sickLeave.response.status===201&&sickLeave.body.leave.attachmentKey===uploadBody.key,`Sick-leave attachment linkage failed: ${sickLeave.body.error||sickLeave.response.status}`)

  const payroll=await json(`/api/payroll/${encodeURIComponent(employeeCreated.body.id)}`,{method:'PATCH',body:JSON.stringify({wage:75000})},adminCookie)
  expect(payroll.response.status===200&&payroll.body.wage===75000&&payroll.body.payroll.net>0,'Payroll recalculation failed')

  console.log('PASS signup defaults, employee provisioning, forced password change, profile update, protected uploads, leave approval/attendance sync, and payroll recalculation')
}

main().catch(error=>{
  console.error(`FAIL ${error instanceof Error?error.message:String(error)}`)
  process.exitCode=1
}).finally(async()=>{
  try{await cleanup()}catch(error){console.error(`Cleanup failed: ${error instanceof Error?error.message:String(error)}`);process.exitCode=1}
  await pool.end()
})
