import { fileURLToPath } from 'node:url'
import { hashPassword } from './auth.js'
import { config } from './config.js'
import { migrate, pool } from './db.js'

export async function seedUsers() {
  await migrate()
  const users=[
    {id:'U1',name:'Aarav Sharma',email:'admin@dayflow.co',loginId:'DFAS1001',role:'admin',avatar:'/api/avatars/Aarav-Sharma',department:'Human Resources',password:config.demoAdminPassword},
    {id:'U2',name:'Isha Patel',email:'isha@dayflow.co',loginId:'DFIP1002',role:'employee',avatar:'/api/avatars/Isha-Patel',department:'Engineering',password:config.demoEmployeePassword},
  ]
  for(const user of users){
    const password=hashPassword(user.password)
    await pool.query(`INSERT INTO dayflow_app_users(id,name,email,login_id,role,avatar,department,company_name,password_hash,password_salt)
      VALUES($1,$2,$3,$4,$5,$6,$7,'Dayflow Inc.',$8,$9)
      ON CONFLICT(email) DO UPDATE SET name=excluded.name,login_id=excluded.login_id,role=excluded.role,avatar=excluded.avatar,department=excluded.department,password_hash=excluded.password_hash,password_salt=excluded.password_salt`,
      [user.id,user.name,user.email,user.loginId,user.role,user.avatar,user.department,password.hash,password.salt])
  }
}

if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) seedUsers().then(()=>pool.end()).catch(error=>{console.error(error);process.exitCode=1})
