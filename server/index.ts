import { randomUUID } from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import { config } from './config.js'
import { clearSession, createSession, hashPassword, publicUser, sessionUser, verifyPassword, type SessionUser } from './auth.js'
import { pool } from './db.js'
import { seedUsers } from './seed.js'

const app=express()
app.use(express.json({limit:'8mb'}))

type AuthedRequest=Request & { user?:SessionUser }
const wrap=(handler:(request:AuthedRequest,response:Response)=>Promise<void>)=>(request:AuthedRequest,response:Response,next:NextFunction)=>handler(request,response).catch(next)

async function requireUser(request:AuthedRequest,response:Response,next:NextFunction){
  const user=await sessionUser(request)
  if(!user){response.status(401).json({error:'Sign in required'});return}
  request.user=user;next()
}

function safeUserMutation(previous:any,next:any,user:SessionUser){
  if(!previous)return true
  if(!next || !Array.isArray(next.employees)||!Array.isArray(next.attendance)||!Array.isArray(next.leaves)||!Array.isArray(next.payroll))return false
  const employee=previous.employees.find((item:any)=>String(item.email).toLowerCase()===user.email.toLowerCase())
    || (user.email==='isha@dayflow.co'?previous.employees.find((item:any)=>item.name==='Isha Patel'):undefined)
    || (user.email==='admin@dayflow.co'?previous.employees.find((item:any)=>item.name==='Aarav Mehta'):undefined)
  if(!employee)return false
  const ownId=employee.id
  const canonical=(value:any):string=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?`[${value.map(canonical).join(',')}]`:`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  if(canonical(previous.payroll)!==canonical(next.payroll))return false
  const salaryFields=['salary','monthlyWage','yearlyWage','salaryComponents','pfEmployerRate','pfEmployeeRate','professionalTax','wageType']
  for(const oldEmployee of previous.employees){
    const updated=next.employees.find((item:any)=>item.id===oldEmployee.id)
    if(!updated)return false
    if(oldEmployee.id!==ownId && canonical(oldEmployee)!==canonical(updated))return false
    if(oldEmployee.id===ownId && salaryFields.some(field=>canonical(oldEmployee[field])!==canonical(updated[field])))return false
  }
  if(next.employees.length!==previous.employees.length)return false
  const unchangedOthers=(before:any[],after:any[])=>before.filter(item=>item.employeeId!==ownId).every(item=>canonical(item)===canonical(after.find(candidate=>candidate.id===item.id))) && after.filter(item=>item.employeeId!==ownId).length===before.filter(item=>item.employeeId!==ownId).length
  if(!unchangedOthers(previous.attendance,next.attendance)||!unchangedOthers(previous.leaves,next.leaves))return false
  const oldOwnLeaves=previous.leaves.filter((item:any)=>item.employeeId===ownId)
  return next.leaves.filter((item:any)=>item.employeeId===ownId).every((item:any)=>{
    const old=oldOwnLeaves.find((candidate:any)=>candidate.id===item.id)
    return old ? old.status===item.status : item.status==='Pending'
  })
}

app.get('/api/health',wrap(async(_request,response)=>{
  const result=await pool.query('SELECT current_database() AS database, now() AS server_time')
  const state=await pool.query('SELECT version,updated_at FROM dayflow_app_workspace_state WHERE id=1')
  response.json({ok:true,service:'dayflow-api',database:'connected',databaseName:result.rows[0].database,serverTime:result.rows[0].server_time,workspace:state.rows[0]||null})
}))

app.get('/api/auth',wrap(async(request,response)=>{response.json({user:await sessionUser(request)})}))
app.post('/api/auth',wrap(async(request,response)=>{
  const action=String(request.body?.action||'')
  if(action==='logout'){await clearSession(request,response);response.json({ok:true});return}
  if(action==='login'){
    const identifier=String(request.body?.identifier||'').trim().toLowerCase()
    const password=String(request.body?.password||'')
    const row=await pool.query('SELECT * FROM dayflow_app_users WHERE lower(email)=$1 OR lower(login_id)=$1',[identifier]).then(result=>result.rows[0])
    if(!row||!verifyPassword(password,row.password_salt,row.password_hash)){response.status(401).json({error:'Invalid email, Login ID, or password'});return}
    await createSession(response,row.id);await pool.query('INSERT INTO dayflow_app_audit_log(user_id,action) VALUES($1,$2)',[row.id,'auth.login'])
    response.json({user:publicUser(row)});return
  }
  if(action==='signup'){
    const name=String(request.body?.name||'').trim(), email=String(request.body?.email||'').trim().toLowerCase(), password=String(request.body?.password||''), company=String(request.body?.company||'').trim(), phone=String(request.body?.phone||'').trim()
    if(!name||!company||!/^[^@]+@[^@]+\.[^@]+$/.test(email)||password.length<8){response.status(400).json({error:'Enter valid company, name, email, and an 8-character password'});return}
    if(await pool.query('SELECT 1 FROM dayflow_app_users WHERE email=$1',[email]).then(result=>result.rowCount)){response.status(409).json({error:'Email already exists'});return}
    const id=`U-${randomUUID()}`,loginId=`${company.slice(0,2)}${name.split(/\s+/).map(part=>part[0]).join('').slice(0,2)}${String(Date.now()).slice(-4)}`.toUpperCase(),hashed=hashPassword(password)
    const row=await pool.query(`INSERT INTO dayflow_app_users(id,name,email,login_id,role,avatar,company_name,phone,password_hash,password_salt) VALUES($1,$2,$3,$4,'admin',$5,$6,$7,$8,$9) RETURNING *`,[id,name,email,loginId,`https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,company,phone,hashed.hash,hashed.salt]).then(result=>result.rows[0])
    await createSession(response,id);response.status(201).json({user:publicUser(row)});return
  }
  if(action==='change-password'){
    const user=await sessionUser(request);if(!user){response.status(401).json({error:'Sign in required'});return}
    const current=String(request.body?.currentPassword||''),next=String(request.body?.newPassword||'')
    const row=await pool.query('SELECT * FROM dayflow_app_users WHERE id=$1',[user.id]).then(result=>result.rows[0])
    if(!verifyPassword(current,row.password_salt,row.password_hash)){response.status(400).json({error:'Current password is incorrect'});return}
    if(next.length<8){response.status(400).json({error:'Use at least 8 characters'});return}
    const hashed=hashPassword(next);const updated=await pool.query('UPDATE dayflow_app_users SET password_hash=$1,password_salt=$2,must_change_password=false WHERE id=$3 RETURNING *',[hashed.hash,hashed.salt,user.id]).then(result=>result.rows[0])
    response.json({user:publicUser(updated)});return
  }
  response.status(400).json({error:'Unsupported authentication action'})
}))

app.get('/api/workspace',requireUser,wrap(async(_request,response)=>{
  const row=await pool.query('SELECT data,version,updated_at FROM dayflow_app_workspace_state WHERE id=1').then(result=>result.rows[0])
  response.json({data:row?.data||null,version:row?.version||0,updatedAt:row?.updated_at||null})
}))

app.put('/api/workspace',requireUser,wrap(async(request,response)=>{
  const user=request.user!,data=request.body?.data
  if(!data||typeof data!=='object'){response.status(400).json({error:'Workspace data is required'});return}
  const previous=await pool.query('SELECT data,version FROM dayflow_app_workspace_state WHERE id=1').then(result=>result.rows[0])
  if(user.role==='employee'&&!safeUserMutation(previous?.data,data,user)){response.status(403).json({error:'Employees may update only their own profile, attendance, and pending leave requests'});return}
  const row=await pool.query(`INSERT INTO dayflow_app_workspace_state(id,data,version,updated_by) VALUES(1,$1::jsonb,1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=dayflow_app_workspace_state.version+1,updated_at=now(),updated_by=excluded.updated_by RETURNING version,updated_at`,[JSON.stringify(data),user.id]).then(result=>result.rows[0])
  response.json({ok:true,version:row.version,updatedAt:row.updated_at})
}))

app.post('/api/users',requireUser,wrap(async(request,response)=>{
  const actor=request.user!;if(actor.role==='employee'){response.status(403).json({error:'Administrator access required'});return}
  const {name,email,loginId,password,avatar,department,phone}=request.body||{}
  if(!name||!email||!loginId||String(password||'').length<8){response.status(400).json({error:'Complete the employee credentials'});return}
  if(await pool.query('SELECT 1 FROM dayflow_app_users WHERE lower(email)=lower($1) OR lower(login_id)=lower($2)',[email,loginId]).then(result=>result.rowCount)){response.status(409).json({error:'Email or Login ID already exists'});return}
  const hashed=hashPassword(String(password));const id=`U-${randomUUID()}`
  await pool.query(`INSERT INTO dayflow_app_users(id,name,email,login_id,role,avatar,department,company_name,phone,password_hash,password_salt,must_change_password) VALUES($1,$2,lower($3),$4,'employee',$5,$6,$7,$8,$9,$10,true)`,[id,name,email,loginId,avatar||'',department||null,actor.companyName||'Dayflow Inc.',phone||null,hashed.hash,hashed.salt])
  await pool.query('INSERT INTO dayflow_app_audit_log(user_id,action,details) VALUES($1,$2,$3::jsonb)',[actor.id,'employee.provisioned',JSON.stringify({email,loginId})])
  response.status(201).json({ok:true,id})
}))

app.use((error:unknown,_request:Request,response:Response,_next:NextFunction)=>{console.error(error);response.status(500).json({error:'The DayFlow API could not complete this request'})})

seedUsers().then(()=>app.listen(config.port,'localhost',()=>console.log(`DayFlow API + PostgreSQL ready on http://localhost:${config.port}`))).catch(error=>{console.error('Failed to start DayFlow API',error);process.exitCode=1})
