import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Request, Response } from 'express'
import { config } from './config.js'
import { pool } from './db.js'

export type SessionUser = { id:string; name:string; email:string; role:'admin'|'hr'|'employee'; avatar:string; department?:string; loginId:string; companyName?:string; phone?:string; mustChangePassword:boolean }

export function hashPassword(password:string, salt=randomBytes(16).toString('hex')) {
  return { salt, hash:scryptSync(password,salt,64).toString('hex') }
}

export function verifyPassword(password:string, salt:string, expected:string) {
  const actual=scryptSync(password,salt,64)
  const stored=Buffer.from(expected,'hex')
  return actual.length===stored.length && timingSafeEqual(actual,stored)
}

export function publicUser(row:Record<string,unknown>):SessionUser {
  return { id:String(row.id),name:String(row.name),email:String(row.email),role:row.role as SessionUser['role'],avatar:String(row.avatar||''),department:row.department?String(row.department):undefined,loginId:String(row.login_id),companyName:row.company_name?String(row.company_name):undefined,phone:row.phone?String(row.phone):undefined,mustChangePassword:Boolean(row.must_change_password) }
}

function cookies(request:Request) {
  return Object.fromEntries(String(request.headers.cookie||'').split(';').map(part=>part.trim().split('=').map(decodeURIComponent)).filter(pair=>pair.length===2))
}

export async function sessionUser(request:Request) {
  const token=cookies(request)[config.cookieName]
  if(!token)return null
  const result=await pool.query(`SELECT u.* FROM dayflow_app_sessions s JOIN dayflow_app_users u ON u.id=s.user_id WHERE s.id=$1 AND s.expires_at>now()`,[token])
  return result.rows[0]?publicUser(result.rows[0]):null
}

export async function createSession(response:Response,userId:string) {
  const id=randomUUID()+randomBytes(12).toString('hex')
  await pool.query(`INSERT INTO dayflow_app_sessions(id,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')`,[id,userId])
  response.cookie(config.cookieName,id,{httpOnly:true,sameSite:'lax',secure:false,maxAge:12*60*60*1000,path:'/'})
}

export async function clearSession(request:Request,response:Response) {
  const token=cookies(request)[config.cookieName]
  if(token)await pool.query('DELETE FROM dayflow_app_sessions WHERE id=$1',[token])
  response.clearCookie(config.cookieName,{path:'/'})
}
