import { env } from 'cloudflare:workers'

export type SessionUser = {
  id: string
  companyId: string
  name: string
  email: string
  loginId: string
  phone?: string
  role: 'admin' | 'hr' | 'employee'
  avatar: string
  mustChangePassword: boolean
}

const encoder = new TextEncoder()
const DEMO_ADMIN_PASSWORD = 'Dayflow@2026'
const DEMO_EMPLOYEE_PASSWORD = 'Employee@2026'

function bytesToBase64(bytes: Uint8Array) {
  let value = ''
  for (const byte of bytes) value += String.fromCharCode(byte)
  return btoa(value)
}

function base64ToBytes(value: string) {
  const raw = atob(value)
  return Uint8Array.from(raw, char => char.charCodeAt(0))
}

async function digestHex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(salt), iterations: 120_000 }, key, 256)
  return { salt, hash: bytesToBase64(new Uint8Array(bits)) }
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = await hashPassword(password, salt)
  if (hash.length !== expectedHash.length) return false
  let difference = 0
  for (let i = 0; i < hash.length; i += 1) difference |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  return difference === 0
}

export async function initializeDatabase() {
  const db = env.DB
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, company_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, login_id TEXT NOT NULL UNIQUE, phone TEXT, role TEXT NOT NULL, avatar TEXT, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, must_change_password INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS users_company_idx ON users(company_id)'),
    db.prepare('CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)'),
    db.prepare('CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at)'),
    db.prepare('CREATE TABLE IF NOT EXISTS workspace_snapshots (workspace_id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, company_id TEXT NOT NULL, owner_id TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS documents_owner_idx ON documents(owner_id)'),
    db.prepare('CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read_at)'),
    db.prepare('CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, company_id TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, metadata TEXT, created_at TEXT NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS audit_company_time_idx ON audit_logs(company_id, created_at)'),
    db.prepare('CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity_type, entity_id)'),
  ])

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind('admin@dayflow.co').first()
  if (!existing) {
    const now = new Date().toISOString()
    const admin = await hashPassword(DEMO_ADMIN_PASSWORD)
    const employee = await hashPassword(DEMO_EMPLOYEE_PASSWORD)
    await db.batch([
      db.prepare('INSERT OR IGNORE INTO companies (id, name, created_at) VALUES (?, ?, ?)').bind('COMP-DEMO', 'DayFlow', now),
      db.prepare('INSERT OR IGNORE INTO users (id, company_id, name, email, login_id, role, avatar, password_hash, password_salt, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind('U1', 'COMP-DEMO', 'Aarav Sharma', 'admin@dayflow.co', 'OIARSH20200001', 'admin', 'https://i.pravatar.cc/150?img=12', admin.hash, admin.salt, 0, now),
      db.prepare('INSERT OR IGNORE INTO users (id, company_id, name, email, login_id, role, avatar, password_hash, password_salt, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind('U2', 'COMP-DEMO', 'Isha Patel', 'isha@dayflow.co', 'OIISPA20210002', 'employee', 'https://i.pravatar.cc/150?img=5', employee.hash, employee.salt, 0, now),
    ])
  }
}

function publicUser(row: Record<string, unknown>): SessionUser {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    email: String(row.email),
    loginId: String(row.login_id),
    phone: row.phone ? String(row.phone) : undefined,
    role: String(row.role) as SessionUser['role'],
    avatar: row.avatar ? String(row.avatar) : 'https://i.pravatar.cc/150?img=12',
    mustChangePassword: Boolean(row.must_change_password),
  }
}

export async function findUserByIdentifier(identifier: string) {
  await initializeDatabase()
  const normalized = identifier.trim().toLowerCase()
  return env.DB.prepare('SELECT * FROM users WHERE lower(email) = ? OR lower(login_id) = ? LIMIT 1').bind(normalized, normalized).first<Record<string, unknown>>()
}

export async function createSession(userId: string) {
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  const tokenHash = await digestHex(token)
  const now = new Date()
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(tokenHash, userId, expires.toISOString(), now.toISOString()).run()
  return { token, expires }
}

export async function deleteSession(request: Request) {
  const token = readCookie(request, 'dayflow_session')
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await digestHex(token)).run()
}

export async function getSessionUser(request: Request) {
  await initializeDatabase()
  const token = readCookie(request, 'dayflow_session')
  if (!token) return null
  const row = await env.DB.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ? LIMIT 1').bind(await digestHex(token), new Date().toISOString()).first<Record<string, unknown>>()
  return row ? publicUser(row) : null
}

export function toPublicUser(row: Record<string, unknown>) {
  return publicUser(row)
}

export function sessionCookie(token: string, expires: Date) {
  return `dayflow_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`
}

export function clearSessionCookie() {
  return 'dayflow_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') || ''
  const pair = header.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null
}
