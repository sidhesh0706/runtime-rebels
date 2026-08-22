import { env } from 'cloudflare:workers'
import { clearSessionCookie, createSession, deleteSession, findUserByIdentifier, getSessionUser, hashPassword, initializeDatabase, sessionCookie, toPublicUser, verifyPassword } from '../../../lib/server/dayflow-db'

export const runtime = 'edge'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  return Response.json({ user }, { status: user ? 200 : 401 })
}

export async function POST(request: Request) {
  await initializeDatabase()
  const body = await request.json<Record<string, string>>()

  if (body.action === 'logout') {
    await deleteSession(request)
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
  }

  if (body.action === 'login') {
    const row = await findUserByIdentifier(body.identifier || '')
    if (!row || !(await verifyPassword(body.password || '', String(row.password_salt), String(row.password_hash)))) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const user = toPublicUser(row)
    const session = await createSession(user.id)
    return Response.json({ user }, { headers: { 'Set-Cookie': sessionCookie(session.token, session.expires) } })
  }

  if (body.action === 'signup') {
    const company = (body.company || '').trim()
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const phone = (body.phone || '').trim()
    const password = body.password || ''
    if (!company || !name || !email || !phone || password.length < 8) return Response.json({ error: 'Invalid account details' }, { status: 400 })
    const duplicate = await env.DB.prepare('SELECT id FROM users WHERE lower(email) = ? LIMIT 1').bind(email).first()
    if (duplicate) return Response.json({ error: 'Email already exists' }, { status: 409 })

    const companyId = `COMP-${crypto.randomUUID()}`
    const userId = `USR-${crypto.randomUUID()}`
    const prefix = company.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'DF'
    const loginId = `${prefix}ADMIN${new Date().getFullYear()}0001`
    const credentials = await hashPassword(password)
    const now = new Date().toISOString()
    const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(userId)}`
    await env.DB.batch([
      env.DB.prepare('INSERT INTO companies (id, name, created_at) VALUES (?, ?, ?)').bind(companyId, company, now),
      env.DB.prepare('INSERT INTO users (id, company_id, name, email, login_id, phone, role, avatar, password_hash, password_salt, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(userId, companyId, name, email, loginId, phone, 'admin', avatar, credentials.hash, credentials.salt, 0, now),
      env.DB.prepare('INSERT INTO audit_logs (id, company_id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(`AUD-${crypto.randomUUID()}`, companyId, userId, 'workspace.created', 'company', companyId, JSON.stringify({ company }), now),
    ])
    const user = { id: userId, companyId, name, email, loginId, phone, role: 'admin' as const, avatar, mustChangePassword: false }
    const session = await createSession(userId)
    return Response.json({ user }, { status: 201, headers: { 'Set-Cookie': sessionCookie(session.token, session.expires) } })
  }

  return Response.json({ error: 'Unsupported action' }, { status: 400 })
}
