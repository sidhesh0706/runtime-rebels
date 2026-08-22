import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import type { Request, Response } from 'express'
import { pool } from './db.js'
import { config } from './config.js'

export type Role = 'admin' | 'hr' | 'employee'
export type SessionUser = {
  id: string
  companyId: string
  employeeId?: string
  name: string
  email: string
  loginId: string
  phone?: string
  role: Role
  avatar: string
  mustChangePassword: boolean
  emailVerified: boolean
}

export function hashPassword(password: string, salt = randomBytes(16).toString('base64')) {
  return { salt, hash: pbkdf2Sync(password, salt, 150_000, 32, 'sha256').toString('base64') }
}

export function verifyPassword(password: string, salt: string, expected: string) {
  const actual = Buffer.from(hashPassword(password, salt).hash, 'base64')
  const target = Buffer.from(expected, 'base64')
  return actual.length === target.length && timingSafeEqual(actual, target)
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string, response: Response) {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash(token), userId, expires])
  response.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.production,
    expires,
    path: '/',
  })
}

export async function clearSession(request: Request, response: Response) {
  const token = request.cookies?.[config.sessionCookieName]
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)])
  response.clearCookie(config.sessionCookieName, { httpOnly: true, sameSite: 'lax', secure: config.production, path: '/' })
}

export async function sessionUser(request: Request): Promise<SessionUser | null> {
  const token = request.cookies?.[config.sessionCookieName]
  if (!token) return null
  const { rows } = await pool.query(`
    SELECT u.id, u.company_id, u.employee_id, u.name, u.email, u.login_id, u.phone,
           u.role, u.avatar, u.must_change_password, u.email_verified
      FROM sessions s
      JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()
     LIMIT 1
  `, [tokenHash(token)])
  if (!rows[0]) return null
  return mapUser(rows[0])
}

export function mapUser(row: Record<string, unknown>): SessionUser {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    employeeId: row.employee_id ? String(row.employee_id) : undefined,
    name: String(row.name),
    email: String(row.email),
    loginId: String(row.login_id),
    phone: row.phone ? String(row.phone) : undefined,
    role: String(row.role) as Role,
    avatar: row.avatar ? String(row.avatar) : `/api/avatars-v2/${encodeURIComponent(String(row.name || 'DayFlow').replace(/\s+/g,'-'))}`,
    mustChangePassword: Boolean(row.must_change_password),
    emailVerified: Boolean(row.email_verified),
  }
}

export function requireUser(request: Request) {
  const user = request.user
  if (!user) {
    const error = new Error('Sign in required') as Error & { status?: number }
    error.status = 401
    throw error
  }
  return user
}

export function requireManager(request: Request) {
  const user = requireUser(request)
  if (user.role === 'employee') {
    const error = new Error('HR or administrator access required') as Error & { status?: number }
    error.status = 403
    throw error
  }
  return user
}

declare global {
  namespace Express {
    interface Request {
      user: SessionUser | null
      cookies?: Record<string, string>
    }
  }
}
