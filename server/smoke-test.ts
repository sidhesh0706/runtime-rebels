const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001'

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

async function login(identifier: string, password: string) {
  const result = await json('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'login', identifier, password }) })
  expect(result.response.status === 200, `Login failed for ${identifier}: ${result.body.error || result.response.status}`)
  const setCookie = result.response.headers.get('set-cookie') || ''
  const cookie = setCookie.split(';', 1)[0]
  expect(cookie.includes('dayflow_session='), 'Login did not issue the HttpOnly session cookie')
  return { cookie, user: result.body.user }
}

async function main() {
  const health = await json('/api/health')
  expect(health.response.status === 200 && health.body.database === 'postgresql', 'PostgreSQL health check failed')

  const anonymous = await json('/api/workspace')
  expect(anonymous.response.status === 401, 'Anonymous workspace access was not denied')

  const admin = await login('admin@dayflow.co', process.env.DEMO_ADMIN_PASSWORD || 'Dayflow@2026')
  expect(admin.user.role === 'admin', 'Admin login returned the wrong role')
  const adminWorkspace = await json('/api/workspace', {}, admin.cookie)
  expect(adminWorkspace.response.status === 200, 'Admin workspace failed to load')
  expect(adminWorkspace.body.employees.length === 44, 'Admin did not receive all 44 seeded employees')
  expect(adminWorkspace.body.payroll.length >= 44, 'Admin payroll data is incomplete')
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  expect(adminWorkspace.body.attendance.some((row:any)=>row.date===today),'Current attendance dates are not serialized as YYYY-MM-DD')
  expect(adminWorkspace.body.attendance.every((row:any)=>/^\d{4}-\d{2}-\d{2}$/.test(row.date)),'An attendance date has the wrong API format')
  expect(adminWorkspace.body.leaves.every((row:any)=>/^\d{4}-\d{2}-\d{2}$/.test(row.startDate)&&/^\d{4}-\d{2}-\d{2}$/.test(row.endDate)),'A leave date has the wrong API format')
  expect(adminWorkspace.body.employees.every((row:any)=>String(row.avatar).startsWith('/api/avatars-v2/')), 'An employee avatar still depends on an external service')
  const avatar=await fetch(`${baseUrl}${adminWorkspace.body.employees[0].avatar}`)
  expect(avatar.status===200&&avatar.headers.get('content-type')?.includes('image/svg+xml'),'Local avatar generation failed')

  const employee = await login('isha@dayflow.co', process.env.DEMO_EMPLOYEE_PASSWORD || 'Employee@2026')
  expect(employee.user.role === 'employee', 'Employee login returned the wrong role')
  const employeeWorkspace = await json('/api/workspace', {}, employee.cookie)
  expect(employeeWorkspace.response.status === 200, 'Employee workspace failed to load')
  expect(employeeWorkspace.body.payroll.length === 1 && employeeWorkspace.body.payroll[0].employeeId === employee.user.employeeId, 'Employee payroll isolation failed')
  expect(employeeWorkspace.body.attendance.every((row: any) => row.employeeId === employee.user.employeeId), 'Employee attendance isolation failed')
  expect(employeeWorkspace.body.leaves.every((row: any) => row.employeeId === employee.user.employeeId), 'Employee leave isolation failed')
  expect(employeeWorkspace.body.employees.filter((row: any) => row.id !== employee.user.employeeId).every((row: any) => row.salary === 0), 'Another employee salary leaked')

  const otherEmployeeId = employeeWorkspace.body.employees.find((row: any) => row.id !== employee.user.employeeId)?.id
  expect(otherEmployeeId, 'Could not find an employee for authorization checks')
  const forbiddenProfile = await json(`/api/employees/${encodeURIComponent(otherEmployeeId)}`, { method: 'PATCH', body: JSON.stringify({ phone: '+91 0000000000' }) }, employee.cookie)
  expect(forbiddenProfile.response.status === 403, 'Employee could update another employee profile')
  const forbiddenAttendance = await json('/api/attendance/check-in', { method: 'POST', body: JSON.stringify({ employeeId: otherEmployeeId }) }, employee.cookie)
  expect(forbiddenAttendance.response.status === 403, 'Employee could check in another employee')
  const forbiddenPayroll = await json(`/api/payroll/${encodeURIComponent(otherEmployeeId)}`, { method: 'PATCH', body: JSON.stringify({ wage: 1 }) }, employee.cookie)
  expect(forbiddenPayroll.response.status === 403, 'Employee could modify payroll')

  console.log('PASS health, sessions, seeded workspace, payroll privacy, record isolation, and role authorization')
}

main().catch(error => {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
