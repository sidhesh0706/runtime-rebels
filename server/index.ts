import express, { type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { mkdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomBytes, randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { config } from './config.js'
import { pool, withTransaction } from './db.js'
import { clearSession, createSession, hashPassword, mapUser, requireManager, requireUser, sessionUser, verifyPassword, type SessionUser } from './auth.js'
import { migrate } from './migrate.js'
import { seed } from './seed.js'
import { payrollForWage } from './payroll.js'

const app = express()
const here = dirname(fileURLToPath(import.meta.url))
const uploadsDirectory = process.env.UPLOADS_DIRECTORY || (here.endsWith('server-dist') ? join(process.cwd(), 'server', 'uploads') : join(here, 'uploads'))
await mkdir(uploadsDirectory, { recursive: true })

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use((request, _response, next) => {
  request.cookies = Object.fromEntries((request.headers.cookie || '').split(';').map(value => value.trim()).filter(Boolean).map(pair => {
    const separator = pair.indexOf('=')
    return separator < 0 ? [pair, ''] : [pair.slice(0, separator), decodeURIComponent(pair.slice(separator + 1))]
  }))
  next()
})
app.use(asyncHandler(async (request, _response, next) => {
  request.user = await sessionUser(request)
  next()
}))
app.use((request, _response, next) => {
  if (request.user?.mustChangePassword && request.method !== 'GET' && request.path !== '/api/auth') return next(httpError(403, 'Change your temporary password before making changes'))
  next()
})

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename: (_request, file, callback) => callback(null, `${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`),
})
const allowedContentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => allowedContentTypes.has(file.mimetype) ? callback(null, true) : callback(new Error('Upload a PDF, JPG, PNG, or WebP file')),
})

app.get('/api/avatars-v2/:seed', (request, response) => {
  const seed=String(request.params.seed).replace(/[^A-Za-z0-9-]/g,'').slice(0,60)||'DayFlow'
  const hash=Array.from(seed).reduce((sum,char,index)=>sum+char.charCodeAt(0)*(index+3),0)
  const backgrounds=['#dcece4','#dce7f1','#e8e0ef','#f1e4da','#f0dfe4','#dcebea']
  const skins=['#f6d2b8','#e7b98f','#cd9168','#a96545','#7b4934']
  const hairs=['#241c18','#4a3024','#6a4531','#171717','#8a5b3d']
  const shirts=['#1f6b4a','#315a7d','#6b4d8a','#9a5b32','#8a3f55','#3f6b66']
  const background=backgrounds[hash%backgrounds.length]
  const skin=skins[Math.floor(hash/3)%skins.length]
  const hair=hairs[Math.floor(hash/7)%hairs.length]
  const shirt=shirts[Math.floor(hash/11)%shirts.length]
  const glasses=hash%4===0?`<g fill="none" stroke="#2f3335" stroke-width="3"><rect x="48" y="65" width="21" height="15" rx="6"/><rect x="81" y="65" width="21" height="15" rx="6"/><path d="M69 71h12"/></g>`:''
  const hairStyle=hash%3===0?`<path d="M42 61c1-27 17-39 34-39 22 0 34 16 33 42-13-7-20-16-25-27-7 13-21 22-42 24Z" fill="${hair}"/>`:hash%3===1?`<path d="M43 62c0-26 14-40 34-40 21 0 34 15 32 42-8-17-24-25-45-24-5 7-12 15-21 22Z" fill="${hair}"/>`:`<path d="M43 62c0-25 14-40 34-40 20 0 32 13 32 38-9-10-17-18-27-23-10 10-23 18-39 25Z" fill="${hair}"/>`
  response.setHeader('Cache-Control','public, max-age=3600').type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" rx="75" fill="${background}"/><path d="M24 150c3-29 20-44 51-44s48 15 51 44" fill="${shirt}"/><path d="M66 101h18v20H66z" fill="${skin}"/><ellipse cx="75" cy="67" rx="34" ry="42" fill="${skin}"/>${hairStyle}<circle cx="61" cy="70" r="3" fill="#292421"/><circle cx="89" cy="70" r="3" fill="#292421"/>${glasses}<path d="M65 89c7 6 14 6 21 0" fill="none" stroke="#7a4038" stroke-width="3" stroke-linecap="round"/><path d="M75 73v9" stroke="#b87862" stroke-width="2" stroke-linecap="round"/></svg>`)
})

app.get('/api/health', asyncHandler(async (_request, response) => {
  const result = await pool.query('SELECT now() AS database_time')
  response.json({ ok: true, database: 'postgresql', databaseTime: result.rows[0].database_time, storage: 'local-protected' })
}))

app.get('/api/auth', asyncHandler(async (request, response) => {
  if (!request.user) throw httpError(401, 'No active session')
  response.json({ user: request.user })
}))

app.post('/api/auth', asyncHandler(async (request, response) => {
  const action = String(request.body?.action || '')
  if (action === 'logout') {
    await clearSession(request, response)
    response.json({ ok: true })
    return
  }
  if (action === 'login') {
    const identifier = String(request.body?.identifier || '').trim().toLowerCase()
    const password = String(request.body?.password || '')
    const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = $1 OR lower(login_id) = $1 LIMIT 1', [identifier])
    const row = rows[0]
    if (!row || (row.locked_until && new Date(row.locked_until) > new Date()) || !verifyPassword(password, row.password_salt, row.password_hash)) {
      if (row) {
        const attempts = Number(row.failed_login_attempts || 0) + 1
        await pool.query('UPDATE users SET failed_login_attempts = $1, locked_until = CASE WHEN $1 >= 5 THEN now() + interval \'15 minutes\' ELSE locked_until END WHERE id = $2', [attempts, row.id])
      }
      throw httpError(401, row?.locked_until ? 'Account temporarily locked' : 'Invalid credentials')
    }
    if (!row.email_verified) throw httpError(403, 'Verify your email before signing in')
    await pool.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [row.id])
    await createSession(row.id, response)
    await audit(mapUser(row), 'auth.login', 'user', row.id)
    response.json({ user: mapUser(row) })
    return
  }
  if (action === 'signup') {
    const companyName = String(request.body?.company || '').trim()
    const name = String(request.body?.name || '').trim()
    const email = String(request.body?.email || '').trim().toLowerCase()
    const phone = String(request.body?.phone || '').trim()
    const password = String(request.body?.password || '')
    if (!companyName || !name || !/^\S+@\S+\.\S+$/.test(email) || !phone || password.length < 8) throw httpError(400, 'Enter valid company and account details')
    if (await pool.query('SELECT 1 FROM users WHERE email = $1', [email]).then(result => result.rowCount)) throw httpError(409, 'Email already exists')
    const companyId = `COMP-${randomUUID()}`
    const employeeId = `EMP-${randomUUID()}`
    const userId = `USR-${randomUUID()}`
    const companyCode = `${companyName.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'DF'}${randomBytes(2).toString('hex').toUpperCase()}`
    const loginId = `${companyCode}ADMIN${new Date().getFullYear()}0001`
    const passwordData = hashPassword(password)
    const avatar = `/api/avatars-v2/${encodeURIComponent(name.replace(/\s+/g,'-'))}`
    await withTransaction(async client => {
      await client.query('INSERT INTO companies (id,name,code) VALUES ($1,$2,$3)', [companyId, companyName, companyCode])
      for (const department of ['Engineering','Design','Marketing','Sales','Human Resources','Finance']) await client.query('INSERT INTO departments (id,company_id,name) VALUES ($1,$2,$3)', [`DEPT-${randomUUID()}`,companyId,department])
      await client.query('INSERT INTO working_schedules (id,company_id,name) VALUES ($1,$2,$3)', [`SCHEDULE-${randomUUID()}`,companyId,'Standard 9 to 6'])
      await client.query('INSERT INTO users (id,company_id,employee_id,name,email,login_id,phone,role,avatar,password_hash,password_salt,email_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)', [userId, companyId, employeeId, name, email, loginId, phone, 'admin', avatar, passwordData.hash, passwordData.salt])
      await client.query('INSERT INTO employees (id,company_id,user_id,name,email,phone,department,job_title,avatar,join_date,location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,current_date,$10)', [employeeId, companyId, userId, name, email, phone, 'Human Resources', 'Company Administrator', avatar, 'Bengaluru'])
      await client.query('INSERT INTO salary_structures (employee_id,monthly_wage) VALUES ($1,0)', [employeeId])
      const payroll = payrollForWage(employeeId,0)
      await client.query(`INSERT INTO payroll_records (id,company_id,employee_id,payroll_month,base,hra,standard_allowance,performance_bonus,lta,fixed_allowance,pf_employee,pf_employer,professional_tax,payable_days,working_days,gross,deductions,net) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, [`PAY-${employeeId}-${payroll.month}`,companyId,employeeId,payroll.month,payroll.base,payroll.hra,payroll.standardAllowance,payroll.performanceBonus,payroll.lta,payroll.fixedAllowance,payroll.pfEmployee,payroll.pfEmployer,payroll.professionalTax,payroll.payableDays,payroll.workingDays,payroll.gross,payroll.deductions,payroll.net])
      for (const [code,name,allocation,paid,attachment] of [['Paid','Paid Time Off',18,true,false],['Sick','Sick Leave',10,true,true],['Unpaid','Unpaid Leave',365,false,false]] as const) {
        const leaveTypeId=`LT-${randomUUID()}`
        await client.query('INSERT INTO leave_types (id,company_id,name,code,annual_allocation,paid,requires_attachment) VALUES ($1,$2,$3,$4,$5,$6,$7)',[leaveTypeId,companyId,name,code,allocation,paid,attachment])
        await client.query('INSERT INTO leave_balances (employee_id,leave_type_id,year,allocated) VALUES ($1,$2,$3,$4)',[employeeId,leaveTypeId,new Date().getFullYear(),allocation])
      }
      const year=new Date().getFullYear()
      for(const [date,holiday] of [[`${year}-01-26`,'Republic Day'],[`${year}-08-15`,'Independence Day'],[`${year}-10-02`,'Gandhi Jayanti']] as const)await client.query('INSERT INTO public_holidays (id,company_id,holiday_date,name) VALUES ($1,$2,$3,$4)',[`HOL-${randomUUID()}`,companyId,date,holiday])
    })
    const user: SessionUser = { id: userId, companyId, employeeId, name, email, loginId, phone, role: 'admin', avatar, mustChangePassword: false, emailVerified: true }
    await createSession(userId, response)
    await audit(user, 'workspace.created', 'company', companyId, { companyName })
    response.status(201).json({ user })
    return
  }
  if (action === 'change-password') {
    const user = requireUser(request)
    const currentPassword = String(request.body?.currentPassword || '')
    const newPassword = String(request.body?.newPassword || '')
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) throw httpError(400, 'Use at least 8 characters with upper-case, lower-case, and a number')
    const row = await pool.query('SELECT password_hash,password_salt FROM users WHERE id = $1', [user.id]).then(result => result.rows[0])
    if (!row || !verifyPassword(currentPassword, row.password_salt, row.password_hash)) throw httpError(400, 'Current password is incorrect')
    const passwordData = hashPassword(newPassword)
    await pool.query('UPDATE users SET password_hash=$1,password_salt=$2,must_change_password=false WHERE id=$3', [passwordData.hash, passwordData.salt, user.id])
    await pool.query('DELETE FROM sessions WHERE user_id=$1', [user.id])
    await createSession(user.id, response)
    await audit(user, 'auth.password_changed', 'user', user.id)
    response.json({ ok: true, user: { ...user, mustChangePassword: false } })
    return
  }
  throw httpError(400, 'Unsupported authentication action')
}))

app.get('/api/workspace', asyncHandler(async (request, response) => {
  const user = requireUser(request)
  const manager = user.role !== 'employee'
  const employeeRows = await pool.query(`SELECT e.*, s.monthly_wage, u.login_id, c.name AS company_name FROM employees e LEFT JOIN salary_structures s ON s.employee_id=e.id LEFT JOIN users u ON u.employee_id=e.id JOIN companies c ON c.id=e.company_id WHERE e.company_id=$1 ORDER BY e.name`, [user.companyId])
  const employees = employeeRows.rows.map(row => mapEmployee(row, manager || row.id === user.employeeId))
  const attendance = await pool.query(`SELECT * FROM attendance WHERE company_id=$1 ${manager ? '' : 'AND employee_id=$2'} ORDER BY work_date DESC`, manager ? [user.companyId] : [user.companyId, user.employeeId])
  const leaves = await pool.query(`SELECT l.*, d.id AS document_id FROM leave_requests l LEFT JOIN documents d ON d.id=l.attachment_document_id WHERE l.company_id=$1 ${manager ? '' : 'AND l.employee_id=$2'} ORDER BY l.created_at DESC`, manager ? [user.companyId] : [user.companyId, user.employeeId])
  const payroll = await pool.query(`SELECT * FROM payroll_records WHERE company_id=$1 ${manager ? '' : 'AND employee_id=$2'} ORDER BY payroll_month DESC`, manager ? [user.companyId] : [user.companyId, user.employeeId])
  const notifications = await pool.query('SELECT id,title,body,link,read_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [user.id])
  const company = await pool.query('SELECT id,name,code,logo_path FROM companies WHERE id=$1',[user.companyId]).then(result=>result.rows[0])
  const balances = await pool.query(`SELECT b.employee_id,t.code,t.name,b.allocated,b.used,b.year FROM leave_balances b JOIN leave_types t ON t.id=b.leave_type_id WHERE t.company_id=$1 ${manager?'':'AND b.employee_id=$2'} ORDER BY b.employee_id,t.code`,manager?[user.companyId]:[user.companyId,user.employeeId])
  const holidays = await pool.query('SELECT id,holiday_date,name FROM public_holidays WHERE company_id=$1 ORDER BY holiday_date',[user.companyId])
  const schedule = await pool.query('SELECT name,working_days_per_week,daily_minutes,break_minutes,start_time,end_time FROM working_schedules WHERE company_id=$1 ORDER BY id LIMIT 1',[user.companyId]).then(result=>result.rows[0])
  response.json({
    company: company ? { id:company.id,name:company.name,code:company.code,logoPath:company.logo_path } : null,
    employees,
    attendance: attendance.rows.map(mapAttendance),
    leaves: leaves.rows.map(mapLeave),
    payroll: payroll.rows.map(mapPayroll),
    notifications: notifications.rows,
    leaveBalances: balances.rows.map(row=>({employeeId:row.employee_id,code:row.code,name:row.name,allocated:Number(row.allocated),used:Number(row.used),remaining:Number(row.allocated)-Number(row.used),year:Number(row.year)})),
    holidays: holidays.rows.map(row=>({id:row.id,date:dateOnly(row.holiday_date),name:row.name})),
    workingSchedule: schedule ? {name:schedule.name,workingDaysPerWeek:Number(schedule.working_days_per_week),dailyMinutes:Number(schedule.daily_minutes),breakMinutes:Number(schedule.break_minutes),startTime:String(schedule.start_time),endTime:String(schedule.end_time)} : null,
    version: 3,
  })
}))

app.get('/api/employees/:employeeId/details', asyncHandler(async (request,response)=>{
  const actor=requireUser(request)
  const employeeId=String(request.params.employeeId)
  const manager=actor.role!=='employee'
  const own=actor.employeeId===employeeId
  const employee=await pool.query(`SELECT e.*,u.login_id,c.name AS company_name,s.* FROM employees e LEFT JOIN users u ON u.employee_id=e.id JOIN companies c ON c.id=e.company_id LEFT JOIN salary_structures s ON s.employee_id=e.id WHERE e.id=$1 AND e.company_id=$2`,[employeeId,actor.companyId]).then(result=>result.rows[0])
  if(!employee)throw httpError(404,'Employee not found')
  if(!manager&&!own){response.json({employee:mapEmployee(employee,false),privateInfo:null,bankDetails:null,salaryConfig:null,documents:[],permissions:{own:false,manager:false}});return}
  const privateInfo=await pool.query('SELECT * FROM employee_private_info WHERE employee_id=$1',[employeeId]).then(result=>result.rows[0]||null)
  const bank=await pool.query('SELECT * FROM bank_details WHERE employee_id=$1',[employeeId]).then(result=>result.rows[0]||null)
  const documents=await pool.query('SELECT id,file_name,content_type,size_bytes,document_type,created_at FROM documents WHERE employee_id=$1 AND company_id=$2 ORDER BY created_at DESC',[employeeId,actor.companyId])
  await audit(actor,'employee.sensitive_viewed','employee',employeeId,{sections:['private','bank','documents',...(manager?['salary']:[])]})
  response.json({
    employee:mapEmployee(employee,true),
    privateInfo:privateInfo?{dateOfBirth:dateOnly(privateInfo.date_of_birth),residentialAddress:privateInfo.residential_address||'',mailingAddress:privateInfo.mailing_address||'',nationality:privateInfo.nationality||'',personalEmail:privateInfo.personal_email||'',gender:privateInfo.gender||'',maritalStatus:privateInfo.marital_status||'',emergencyContact:privateInfo.emergency_contact||''}:null,
    bankDetails:bank?{accountNumber:bank.account_number||'',bankName:bank.bank_name||'',ifscCode:bank.ifsc_code||'',pan:bank.pan||'',uan:bank.uan||'',employeeCode:bank.employee_code||''}:null,
    salaryConfig:manager?{monthlyWage:Number(employee.monthly_wage||0),yearlyWage:Number(employee.monthly_wage||0)*12,workingDaysPerWeek:Number(employee.working_days_per_week||5),breakMinutes:Number(employee.break_minutes||60),basicPercent:Number(employee.basic_percent||50),hraBasicPercent:Number(employee.hra_basic_percent||50),standardAllowance:Number(employee.standard_allowance||4167),performanceBonusPercent:Number(employee.performance_bonus_percent||8.33),ltaPercent:Number(employee.lta_percent||8.33),pfEmployeePercent:Number(employee.pf_employee_percent||12),pfEmployerPercent:Number(employee.pf_employer_percent||12),professionalTax:Number(employee.professional_tax||200),components:employee.salary_components||[]}:null,
    documents:documents.rows.map(row=>({id:row.id,name:row.file_name,contentType:row.content_type,size:Number(row.size_bytes),type:row.document_type,url:`/api/uploads/${row.id}`,createdAt:new Date(row.created_at).toISOString()})),
    permissions:{own,manager},
  })
}))

app.patch('/api/employees/:employeeId/details', asyncHandler(async(request,response)=>{
  const actor=requireUser(request)
  const employeeId=String(request.params.employeeId)
  const manager=actor.role!=='employee'
  const own=actor.employeeId===employeeId
  if(!manager&&!own)throw httpError(403,'You can update only your own permitted profile fields')
  const privateInput=request.body?.privateInfo&&typeof request.body.privateInfo==='object'?request.body.privateInfo:{}
  const bankInput=request.body?.bankDetails&&typeof request.body.bankDetails==='object'?request.body.bankDetails:{}
  const privateMap:Record<string,string>={dateOfBirth:'date_of_birth',residentialAddress:'residential_address',mailingAddress:'mailing_address',nationality:'nationality',personalEmail:'personal_email',gender:'gender',maritalStatus:'marital_status',emergencyContact:'emergency_contact'}
  const ownPrivate=new Set(['residentialAddress','mailingAddress','personalEmail','emergencyContact'])
  const privateEntries=Object.entries(privateInput).filter(([key])=>privateMap[key]&&(manager||ownPrivate.has(key)))
  const bankMap:Record<string,string>={accountNumber:'account_number',bankName:'bank_name',ifscCode:'ifsc_code',pan:'pan',uan:'uan',employeeCode:'employee_code'}
  const bankEntries=manager?Object.entries(bankInput).filter(([key])=>bankMap[key]):[]
  if(!privateEntries.length&&!bankEntries.length)throw httpError(400,'No permitted private fields supplied')
  await withTransaction(async client=>{
    if(privateEntries.length){
      await client.query('INSERT INTO employee_private_info (employee_id) VALUES ($1) ON CONFLICT(employee_id) DO NOTHING',[employeeId])
      const sets=privateEntries.map(([key],index)=>`${privateMap[key]}=$${index+1}`)
      await client.query(`UPDATE employee_private_info SET ${sets.join(',')} WHERE employee_id=$${privateEntries.length+1}`,[...privateEntries.map(([,value])=>value||null),employeeId])
    }
    if(bankEntries.length){
      await client.query('INSERT INTO bank_details (employee_id) VALUES ($1) ON CONFLICT(employee_id) DO NOTHING',[employeeId])
      const sets=bankEntries.map(([key],index)=>`${bankMap[key]}=$${index+1}`)
      await client.query(`UPDATE bank_details SET ${sets.join(',')} WHERE employee_id=$${bankEntries.length+1}`,[...bankEntries.map(([,value])=>value||null),employeeId])
    }
  })
  await audit(actor,'employee.private_updated','employee',employeeId,{privateFields:privateEntries.map(([key])=>key),bankFields:bankEntries.map(([key])=>key)})
  response.json({ok:true})
}))

app.post('/api/employees', asyncHandler(async (request, response) => {
  const actor = requireManager(request)
  const name = String(request.body?.name || '').trim()
  const email = String(request.body?.email || '').trim().toLowerCase()
  const phone = String(request.body?.phone || '').trim()
  const department = String(request.body?.department || '').trim()
  const jobTitle = String(request.body?.jobTitle || '').trim()
  const joinDate = String(request.body?.joinDate || '')
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !department || !jobTitle || !/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) throw httpError(400, 'Complete all employee fields')
  if (await pool.query('SELECT 1 FROM users WHERE email=$1', [email]).then(result => result.rowCount)) throw httpError(409, 'Email already exists')
  const parts = name.split(/\s+/)
  const initials = `${parts[0]?.slice(0,2) || 'EM'}${parts.at(-1)?.slice(0,2) || 'PL'}`.toUpperCase()
  const year = joinDate.slice(0,4)
  const serialResult = await pool.query("SELECT count(*)::int AS total FROM users WHERE company_id=$1 AND login_id LIKE $2", [actor.companyId, `%${year}%`])
  const companyCode = await pool.query('SELECT code FROM companies WHERE id=$1',[actor.companyId]).then(result=>String(result.rows[0]?.code||'DF'))
  const loginId = `${companyCode}${initials}${year}${String(Number(serialResult.rows[0].total) + 1).padStart(4,'0')}`
  const temporaryPassword = `Df!${loginId.slice(-4)}${String(randomBytes(2).readUInt16BE(0)).padStart(4,'0').slice(-4)}`
  const passwordData = hashPassword(temporaryPassword)
  const userId = `USR-${randomUUID()}`
  const employeeId = loginId
  const avatar = `/api/avatars-v2/${encodeURIComponent(name.replace(/\s+/g,'-'))}`
  await withTransaction(async client => {
    await client.query('INSERT INTO users (id,company_id,employee_id,name,email,login_id,phone,role,avatar,password_hash,password_salt,must_change_password,email_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true)', [userId, actor.companyId, employeeId, name, email, loginId, phone, 'employee', avatar, passwordData.hash, passwordData.salt])
    await client.query('INSERT INTO employees (id,company_id,user_id,name,email,phone,department,job_title,avatar,join_date,manager,location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [employeeId, actor.companyId, userId, name, email, phone, department, jobTitle, avatar, joinDate, actor.name, 'Bengaluru'])
    await client.query('INSERT INTO employee_private_info (employee_id,personal_email) VALUES ($1,$2)', [employeeId, email])
    await client.query('INSERT INTO bank_details (employee_id,employee_code) VALUES ($1,$1)', [employeeId])
    await client.query('INSERT INTO salary_structures (employee_id,monthly_wage) VALUES ($1,50000)', [employeeId])
    const payroll = payrollForWage(employeeId, 50000)
    await client.query(`INSERT INTO payroll_records (id,company_id,employee_id,payroll_month,base,hra,standard_allowance,performance_bonus,lta,fixed_allowance,pf_employee,pf_employer,professional_tax,payable_days,working_days,gross,deductions,net) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, [`PAY-${employeeId}-${payroll.month}`, actor.companyId, employeeId, payroll.month, payroll.base, payroll.hra, payroll.standardAllowance, payroll.performanceBonus, payroll.lta, payroll.fixedAllowance, payroll.pfEmployee, payroll.pfEmployer, payroll.professionalTax, payroll.payableDays, payroll.workingDays, payroll.gross, payroll.deductions, payroll.net])
    await client.query('INSERT INTO leave_balances (employee_id,leave_type_id,year,allocated) SELECT $1,id,$2,annual_allocation FROM leave_types WHERE company_id=$3', [employeeId, new Date().getFullYear(), actor.companyId])
    await client.query('INSERT INTO notifications (id,user_id,title,body,link) VALUES ($1,$2,$3,$4,$5)', [`NOT-${randomUUID()}`, userId, 'Welcome to DayFlow', `Your login ID is ${loginId}. Change your temporary password after signing in.`, '/profile'])
  })
  await audit(actor, 'employee.created', 'employee', employeeId, { email, loginId })
  response.status(201).json({ loginId, temporaryPassword, id: employeeId, avatar })
}))

app.patch('/api/employees/:employeeId', asyncHandler(async (request, response) => {
  const actor = requireUser(request)
  const employeeId = String(request.params.employeeId)
  const manager = actor.role !== 'employee'
  if (!manager && actor.employeeId !== employeeId) throw httpError(403, 'You can update only your own profile')
  const allowed = manager ? ['phone','address','about','jobLove','interests','location','manager','department','jobTitle','skills','certifications'] : ['phone','address','about','jobLove','interests','avatar','skills','certifications']
  const patch = Object.fromEntries(Object.entries(request.body || {}).filter(([key]) => allowed.includes(key)))
  const columns: Record<string,string> = { phone:'phone',address:'address',about:'about',jobLove:'job_love',interests:'interests',avatar:'avatar',location:'location',manager:'manager',department:'department',jobTitle:'job_title',skills:'skills',certifications:'certifications' }
  const entries = Object.entries(patch)
  if (!entries.length) throw httpError(400, 'No permitted profile fields supplied')
  const sets = entries.map(([key],index) => `${columns[key]}=$${index+1}${key==='skills'||key==='certifications'?'::jsonb':''}`)
  const values = entries.map(([key,value]) => key==='skills'||key==='certifications' ? JSON.stringify(value) : value)
  const result = await pool.query(`UPDATE employees SET ${sets.join(',')} WHERE id=$${values.length+1} AND company_id=$${values.length+2} RETURNING *`, [...values, employeeId, actor.companyId])
  if (!result.rows[0]) throw httpError(404, 'Employee not found')
  await audit(actor, 'employee.updated', 'employee', employeeId, { fields: entries.map(([key]) => key) })
  response.json({ employee: mapEmployee(result.rows[0], manager || actor.employeeId === employeeId) })
}))

app.post('/api/attendance/check-in', asyncHandler(async (request, response) => {
  const actor = requireUser(request)
  const employeeId = String(request.body?.employeeId || actor.employeeId || '')
  if (actor.role === 'employee' && actor.employeeId !== employeeId) throw httpError(403, 'You can check in only yourself')
  const date = indiaDate()
  const existing = await pool.query('SELECT * FROM attendance WHERE employee_id=$1 AND work_date=$2', [employeeId,date]).then(result => result.rows[0])
  if (existing?.check_in && !existing.check_out) throw httpError(409, 'You are already checked in')
  if (existing?.check_out) throw httpError(409, 'Today’s attendance session is already complete')
  const id = existing?.id || `ATT-${employeeId}-${date}`
  const result = await pool.query(`INSERT INTO attendance (id,company_id,employee_id,work_date,status,check_in) VALUES ($1,$2,$3,$4,'Present',now()) ON CONFLICT(employee_id,work_date) DO UPDATE SET status='Present',check_in=now(),check_out=NULL,work_minutes=NULL,extra_minutes=NULL RETURNING *`, [id,actor.companyId,employeeId,date])
  await audit(actor,'attendance.checked_in','attendance',id)
  response.json({ attendance: mapAttendance(result.rows[0]) })
}))

app.post('/api/attendance/check-out', asyncHandler(async (request, response) => {
  const actor = requireUser(request)
  const employeeId = String(request.body?.employeeId || actor.employeeId || '')
  if (actor.role === 'employee' && actor.employeeId !== employeeId) throw httpError(403, 'You can check out only yourself')
  const date = indiaDate()
  const existing = await pool.query('SELECT * FROM attendance WHERE employee_id=$1 AND work_date=$2', [employeeId,date]).then(result => result.rows[0])
  if (!existing?.check_in) throw httpError(409, 'Check in before checking out')
  if (existing.check_out) throw httpError(409, 'You have already checked out')
  const schedule=await pool.query('SELECT daily_minutes,break_minutes FROM working_schedules WHERE company_id=$1 ORDER BY id LIMIT 1',[actor.companyId]).then(result=>result.rows[0])
  const dailyMinutes=Number(schedule?.daily_minutes||480)
  const breakMinutes=Number(schedule?.break_minutes||60)
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(existing.check_in).getTime()) / 60000))
  const workMinutes = Math.max(0, elapsedMinutes - (elapsedMinutes >= Math.max(360,dailyMinutes/2) ? breakMinutes : 0))
  const result = await pool.query('UPDATE attendance SET check_out=now(),work_minutes=$1,extra_minutes=$2 WHERE id=$3 RETURNING *', [workMinutes,Math.max(0,workMinutes-dailyMinutes),existing.id])
  await audit(actor,'attendance.checked_out','attendance',existing.id,{workMinutes})
  response.json({ attendance: mapAttendance(result.rows[0]) })
}))

app.post('/api/leaves', asyncHandler(async (request, response) => {
  const actor = requireUser(request)
  const employeeId = String(request.body?.employeeId || actor.employeeId || '')
  if (actor.role === 'employee' && actor.employeeId !== employeeId) throw httpError(403, 'You can request leave only for yourself')
  const leaveType = String(request.body?.type || '')
  const startDate = String(request.body?.startDate || '')
  const endDate = String(request.body?.endDate || '')
  const reason = String(request.body?.reason || '').trim()
  const documentId = request.body?.attachmentKey ? String(request.body.attachmentKey) : null
  if (!['Paid','Sick','Unpaid'].includes(leaveType) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !reason) throw httpError(400,'Complete the leave request')
  if (endDate < startDate) throw httpError(400,'End date must be on or after start date')
  if (leaveType === 'Sick' && !documentId) throw httpError(400,'Attach a sick-leave certificate')
  if (documentId) {
    const document = await pool.query('SELECT employee_id FROM documents WHERE id=$1 AND company_id=$2',[documentId,actor.companyId]).then(result=>result.rows[0])
    if (!document || document.employee_id !== employeeId) throw httpError(403,'Use an attachment uploaded by this employee')
  }
  const overlap = await pool.query("SELECT 1 FROM leave_requests WHERE employee_id=$1 AND status<>'Rejected' AND NOT(end_date<$2 OR start_date>$3) LIMIT 1", [employeeId,startDate,endDate])
  if (overlap.rowCount) throw httpError(409,'This request overlaps an existing leave')
  const days = await businessDays(startDate,endDate,actor.companyId)
  if (days < 1) throw httpError(400,'The selected dates contain no working days')
  if (leaveType !== 'Unpaid') {
    const balance = await pool.query('SELECT b.allocated-b.used AS remaining FROM leave_balances b JOIN leave_types t ON t.id=b.leave_type_id WHERE b.employee_id=$1 AND t.company_id=$2 AND t.code=$3 AND b.year=$4', [employeeId,actor.companyId,leaveType,new Date(startDate).getFullYear()]).then(result => Number(result.rows[0]?.remaining || 0))
    if (days > balance) throw httpError(409,`Only ${balance} days are available`)
  }
  const id = `LV-${randomUUID()}`
  const result = await pool.query(`INSERT INTO leave_requests (id,company_id,employee_id,leave_type,start_date,end_date,days,reason,attachment_document_id,attachment_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [id,actor.companyId,employeeId,leaveType,startDate,endDate,days,reason,documentId,request.body?.attachmentName || null])
  await audit(actor,'leave.submitted','leave_request',id,{days,leaveType})
  response.status(201).json({ leave: mapLeave(result.rows[0]) })
}))

app.post('/api/leaves/:leaveId/review', asyncHandler(async (request, response) => {
  const actor = requireManager(request)
  const status = String(request.body?.status || '')
  const comment = String(request.body?.comment || '').trim()
  if (!['Approved','Rejected'].includes(status)) throw httpError(400,'Choose approve or reject')
  if (status === 'Rejected' && !comment) throw httpError(400,'A rejection comment is required')
  const reviewed = await withTransaction(async client => {
    const leave = await client.query('SELECT * FROM leave_requests WHERE id=$1 AND company_id=$2 FOR UPDATE', [request.params.leaveId,actor.companyId]).then(result => result.rows[0])
    if (!leave) throw httpError(404,'Leave request not found')
    if (leave.status !== 'Pending') throw httpError(409,'This request has already been reviewed')
    if(status==='Approved'){
      const activeAttendance=await client.query('SELECT 1 FROM attendance WHERE employee_id=$1 AND work_date BETWEEN $2 AND $3 AND check_in IS NOT NULL LIMIT 1',[leave.employee_id,leave.start_date,leave.end_date])
      if(activeAttendance.rowCount)throw httpError(409,'Attendance already exists for a selected leave date')
      if(leave.leave_type!=='Unpaid'){
        const balance=await client.query('SELECT b.allocated-b.used AS remaining FROM leave_balances b JOIN leave_types t ON t.id=b.leave_type_id WHERE b.employee_id=$1 AND t.company_id=$2 AND t.code=$3 AND b.year=$4 FOR UPDATE OF b',[leave.employee_id,actor.companyId,leave.leave_type,new Date(leave.start_date).getFullYear()]).then(result=>Number(result.rows[0]?.remaining||0))
        if(Number(leave.days)>balance)throw httpError(409,`Only ${balance} days remain for approval`)
      }
    }
    await client.query('UPDATE leave_requests SET status=$1,review_comment=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$4', [status,comment || 'Approved by HR',actor.name,leave.id])
    if (status === 'Approved') {
      if (leave.leave_type !== 'Unpaid') await client.query('UPDATE leave_balances b SET used=b.used+$1 FROM leave_types t WHERE b.leave_type_id=t.id AND b.employee_id=$2 AND t.company_id=$3 AND t.code=$4 AND b.year=$5', [leave.days,leave.employee_id,actor.companyId,leave.leave_type,new Date(leave.start_date).getFullYear()])
      await client.query(`INSERT INTO attendance (id,company_id,employee_id,work_date,status) SELECT 'ATT-'||$1||'-'||day::date,$2,$1,day::date,'Leave' FROM generate_series($3::date,$4::date,interval '1 day') day WHERE extract(isodow from day)<6 ON CONFLICT(employee_id,work_date) DO UPDATE SET status='Leave',check_in=NULL,check_out=NULL,work_minutes=NULL,extra_minutes=NULL`, [leave.employee_id,actor.companyId,leave.start_date,leave.end_date])
    }
    const recipient = await client.query('SELECT id FROM users WHERE employee_id=$1', [leave.employee_id]).then(result => result.rows[0]?.id)
    if (recipient) await client.query('INSERT INTO notifications (id,user_id,title,body,link) VALUES ($1,$2,$3,$4,$5)', [`NOT-${randomUUID()}`,recipient,`Leave ${status.toLowerCase()}`,`Your ${leave.leave_type} leave request was ${status.toLowerCase()}.`,'/leave'])
    return client.query('SELECT * FROM leave_requests WHERE id=$1',[leave.id]).then(result => result.rows[0])
  })
  await audit(actor,`leave.${status.toLowerCase()}`,'leave_request',reviewed.id,{comment})
  response.json({ leave: mapLeave(reviewed) })
}))

app.patch('/api/payroll/:employeeId', asyncHandler(async (request, response) => {
  const actor = requireManager(request)
  const employeeId = String(request.params.employeeId)
  const wage = Number(request.body?.wage)
  if (!Number.isFinite(wage) || wage < 0 || wage > 10_000_000) throw httpError(400,'Enter a valid monthly wage')
  const salaryConfig=request.body?.salaryConfig&&typeof request.body.salaryConfig==='object'?request.body.salaryConfig:{}
  const workingDaysPerWeek=Number(salaryConfig.workingDaysPerWeek??5)
  const breakMinutes=Number(salaryConfig.breakMinutes??60)
  const pfEmployeePercent=Number(salaryConfig.pfEmployeePercent??12)
  const pfEmployerPercent=Number(salaryConfig.pfEmployerPercent??12)
  const professionalTax=Number(salaryConfig.professionalTax??200)
  const components=Array.isArray(salaryConfig.components)?salaryConfig.components.map((component:any)=>({id:String(component.id||''),name:String(component.name||''),type:String(component.type||''),value:Number(component.value||0)})):undefined
  if(!Number.isInteger(workingDaysPerWeek)||workingDaysPerWeek<1||workingDaysPerWeek>7||!Number.isFinite(breakMinutes)||breakMinutes<0||breakMinutes>360)throw httpError(400,'Enter a valid work schedule')
  if([pfEmployeePercent,pfEmployerPercent].some(value=>!Number.isFinite(value)||value<0||value>100)||!Number.isFinite(professionalTax)||professionalTax<0)throw httpError(400,'Enter valid payroll deductions')
  if(components&&components.some((component:any)=>!component.id||!component.name||!['Fixed','Percent of Wage','Percent of Basic','Remainder'].includes(component.type)||component.value<0))throw httpError(400,'Enter valid salary components')
  const month = new Date().toISOString().slice(0,7)
  let record:ReturnType<typeof payrollForWage>
  try{record=payrollForWage(employeeId,wage,month,22,22,{components,pfEmployeePercent,pfEmployerPercent,professionalTax})}catch(error){throw httpError(400,error instanceof Error?error.message:'Invalid salary configuration')}
  await withTransaction(async client => {
    const updated = await client.query('UPDATE salary_structures SET monthly_wage=$1,working_days_per_week=$2,break_minutes=$3,pf_employee_percent=$4,pf_employer_percent=$5,professional_tax=$6,salary_components=$7::jsonb,updated_at=now() WHERE employee_id=$8 RETURNING employee_id',[wage,workingDaysPerWeek,breakMinutes,pfEmployeePercent,pfEmployerPercent,professionalTax,JSON.stringify(record.components.map(component=>({id:component.id,name:component.name,type:component.type,value:component.value}))),employeeId])
    if (!updated.rows[0]) throw httpError(404,'Employee salary record not found')
    await client.query(`INSERT INTO payroll_records (id,company_id,employee_id,payroll_month,base,hra,standard_allowance,performance_bonus,lta,fixed_allowance,pf_employee,pf_employer,professional_tax,payable_days,working_days,gross,deductions,net) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT(employee_id,payroll_month) DO UPDATE SET base=excluded.base,hra=excluded.hra,standard_allowance=excluded.standard_allowance,performance_bonus=excluded.performance_bonus,lta=excluded.lta,fixed_allowance=excluded.fixed_allowance,pf_employee=excluded.pf_employee,pf_employer=excluded.pf_employer,professional_tax=excluded.professional_tax,payable_days=excluded.payable_days,working_days=excluded.working_days,gross=excluded.gross,deductions=excluded.deductions,net=excluded.net`, [`PAY-${employeeId}-${month}`,actor.companyId,employeeId,month,record.base,record.hra,record.standardAllowance,record.performanceBonus,record.lta,record.fixedAllowance,record.pfEmployee,record.pfEmployer,record.professionalTax,record.payableDays,record.workingDays,record.gross,record.deductions,record.net])
  })
  await audit(actor,'payroll.configuration_updated','employee',employeeId,{wage,workingDaysPerWeek,breakMinutes,pfEmployeePercent,pfEmployerPercent,professionalTax})
  response.json({ payroll: { ...record, bonus: record.performanceBonus }, wage })
}))

app.post('/api/uploads', upload.single('file'), asyncHandler(async (request, response) => {
  const actor = requireUser(request)
  if (!request.file) throw httpError(400,'Choose a file to upload')
  const id = `DOC-${randomUUID()}`
  await pool.query('INSERT INTO documents (id,company_id,owner_id,employee_id,storage_name,file_name,content_type,size_bytes,document_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id,actor.companyId,actor.id,actor.employeeId || null,request.file.filename,request.file.originalname,request.file.mimetype,request.file.size,'attachment'])
  await audit(actor,'document.uploaded','document',id,{fileName:request.file.originalname,size:request.file.size})
  response.status(201).json({ id, key:id, fileName:request.file.originalname, url:`/api/uploads/${id}` })
}))

app.post('/api/employees/:employeeId/avatar',upload.single('file'),asyncHandler(async(request,response)=>{
  const actor=requireUser(request)
  const employeeId=String(request.params.employeeId)
  if(actor.role==='employee'&&actor.employeeId!==employeeId)throw httpError(403,'You can update only your own profile picture')
  if(!request.file||!request.file.mimetype.startsWith('image/'))throw httpError(400,'Choose a JPG, PNG, or WebP profile picture')
  const employee=await pool.query('SELECT 1 FROM employees WHERE id=$1 AND company_id=$2',[employeeId,actor.companyId])
  if(!employee.rowCount)throw httpError(404,'Employee not found')
  const id=`DOC-${randomUUID()}`
  const url=`/api/uploads/${id}`
  await withTransaction(async client=>{
    await client.query('INSERT INTO documents (id,company_id,owner_id,employee_id,storage_name,file_name,content_type,size_bytes,document_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,actor.companyId,actor.id,employeeId,request.file!.filename,request.file!.originalname,request.file!.mimetype,request.file!.size,'profile-photo'])
    await client.query('UPDATE employees SET avatar=$1 WHERE id=$2',[url,employeeId])
    await client.query('UPDATE users SET avatar=$1 WHERE employee_id=$2',[url,employeeId])
  })
  await audit(actor,'employee.avatar_updated','employee',employeeId,{documentId:id})
  response.status(201).json({id,url,fileName:request.file.originalname})
}))

app.get('/api/uploads/:documentId', asyncHandler(async (request, response) => {
  const actor = requireUser(request)
  const row = await pool.query('SELECT * FROM documents WHERE id=$1 AND company_id=$2', [request.params.documentId,actor.companyId]).then(result => result.rows[0])
  if (!row) throw httpError(404,'File not found')
  if (actor.role === 'employee' && row.employee_id !== actor.employeeId && row.document_type!=='profile-photo') throw httpError(403,'You cannot access this document')
  await audit(actor,'document.viewed','document',row.id)
  response.type(row.content_type).setHeader('Content-Disposition',`inline; filename="${String(row.file_name).replaceAll('"','')}"`).sendFile(join(uploadsDirectory,row.storage_name))
}))

app.use((error: Error & { status?: number; code?: string }, _request: Request, response: Response, _next: NextFunction) => {
  const status = error.status || (error.code === 'LIMIT_FILE_SIZE' ? 413 : 500)
  const message = status >= 500 ? 'The local DayFlow service encountered an error' : error.message
  if (status >= 500) console.error(error)
  response.status(status).json({ error: message })
})

await migrate()
await seed()
await pool.query('DELETE FROM sessions WHERE expires_at <= now()')
app.listen(config.port, 'localhost', () => console.log(`DayFlow API ready at http://localhost:${config.port}`))

function asyncHandler(handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>) {
  return (request: Request, response: Response, next: NextFunction) => { Promise.resolve(handler(request,response,next)).catch(next) }
}

function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

async function audit(actor: SessionUser, action: string, entityType: string, entityId: string, metadata: Record<string,unknown> = {}) {
  await pool.query('INSERT INTO audit_logs (id,company_id,actor_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)', [`AUD-${randomUUID()}`,actor.companyId,actor.id,action,entityType,entityId,JSON.stringify(metadata)])
}

function mapEmployee(row: Record<string,any>, includeSalary: boolean) {
  return { id:row.id,loginId:row.login_id||row.id,name:row.name,email:row.email,company:row.company_name||'',department:row.department,role:row.job_title,avatar:row.avatar,salary:includeSalary?Number(row.monthly_wage||0):0,joinDate:dateOnly(row.join_date),phone:row.phone,status:row.employment_status,manager:row.manager,location:row.location,address:includeSalary?row.address:undefined,about:row.about,jobLove:row.job_love,interests:row.interests,skills:row.skills||[],certifications:row.certifications||[] }
}

function mapAttendance(row: Record<string,any>) {
  return { id:row.id,employeeId:row.employee_id,date:dateOnly(row.work_date),status:row.status,checkIn:row.check_in?indiaTime(row.check_in):undefined,checkOut:row.check_out?indiaTime(row.check_out):undefined,hours:row.work_minutes==null?undefined:Number(row.work_minutes)/60,extraHours:row.extra_minutes==null?undefined:Number(row.extra_minutes)/60 }
}

function mapLeave(row: Record<string,any>) {
  return { id:row.id,employeeId:row.employee_id,type:row.leave_type,startDate:dateOnly(row.start_date),endDate:dateOnly(row.end_date),days:Number(row.days),reason:row.reason,status:row.status,createdAt:dateOnly(row.created_at),reviewedBy:row.reviewed_by,reviewedAt:row.reviewed_at?new Date(row.reviewed_at).toISOString():undefined,reviewComment:row.review_comment,attachmentName:row.attachment_name,attachmentKey:row.attachment_document_id,attachmentUrl:row.attachment_document_id?`/api/uploads/${row.attachment_document_id}`:undefined }
}

function mapPayroll(row: Record<string,any>) {
  return { employeeId:row.employee_id,base:Number(row.base),bonus:Number(row.performance_bonus),deductions:Number(row.deductions),net:Number(row.net),month:row.payroll_month,hra:Number(row.hra),standardAllowance:Number(row.standard_allowance),performanceBonus:Number(row.performance_bonus),lta:Number(row.lta),fixedAllowance:Number(row.fixed_allowance),pfEmployee:Number(row.pf_employee),pfEmployer:Number(row.pf_employer),professionalTax:Number(row.professional_tax),payableDays:Number(row.payable_days),workingDays:Number(row.working_days) }
}

function indiaDate() {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date())
  const value = Object.fromEntries(parts.map(part => [part.type,part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function indiaTime(value: string | Date) {
  return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value))
}

async function businessDays(startDate: string, endDate: string, companyId: string) {
  const holidays = new Set((await pool.query('SELECT holiday_date FROM public_holidays WHERE company_id=$1 AND holiday_date BETWEEN $2 AND $3',[companyId,startDate,endDate])).rows.map(row => dateOnly(row.holiday_date)))
  let days = 0
  for (let cursor = new Date(`${startDate}T00:00:00Z`), end = new Date(`${endDate}T00:00:00Z`); cursor <= end; cursor.setUTCDate(cursor.getUTCDate()+1)) {
    const date = cursor.toISOString().slice(0,10)
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6 && !holidays.has(date)) days += 1
  }
  return days
}

function dateOnly(value:unknown){
  if(typeof value==='string'){
    const match=value.match(/^\d{4}-\d{2}-\d{2}/)
    if(match)return match[0]
  }
  const date=value instanceof Date?value:new Date(String(value))
  if(Number.isNaN(date.getTime()))return ''
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`
}
