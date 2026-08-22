import { env } from 'cloudflare:workers'
import { getSessionUser, hashPassword } from '../../../lib/server/dayflow-db'

export const runtime = 'edge'

export async function POST(request: Request) {
  const actor = await getSessionUser(request)
  if (!actor) return Response.json({ error: 'Sign in required' }, { status: 401 })
  if (actor.role === 'employee') return Response.json({ error: 'Only HR/Admin can create employees' }, { status: 403 })
  const body = await request.json<Record<string, string>>()
  const name = (body.name || '').trim()
  const email = (body.email || '').trim().toLowerCase()
  const joinDate = body.joinDate || new Date().toISOString().slice(0, 10)
  if (!name || !email) return Response.json({ error: 'Name and email are required' }, { status: 400 })
  if (await env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?').bind(email).first()) return Response.json({ error: 'Email already exists' }, { status: 409 })

  const parts = name.split(/\s+/)
  const initials = `${parts[0]?.slice(0, 2) || 'EM'}${parts.at(-1)?.slice(0, 2) || 'PL'}`.toUpperCase()
  const year = joinDate.slice(0, 4)
  const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM users WHERE company_id = ?').bind(actor.companyId).first<{ total: number }>()
  const serial = String(Number(count?.total || 0) + 1).padStart(4, '0')
  const loginId = `OI${initials}${year}${serial}`
  const temporaryPassword = `Df!${loginId.slice(-4)}${crypto.getRandomValues(new Uint16Array(1))[0].toString().padStart(4, '0').slice(-4)}`
  const credentials = await hashPassword(temporaryPassword)
  const id = `USR-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}`
  await env.DB.batch([
    env.DB.prepare('INSERT INTO users (id, company_id, name, email, login_id, phone, role, avatar, password_hash, password_salt, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, actor.companyId, name, email, loginId, body.phone || '', 'employee', avatar, credentials.hash, credentials.salt, 1, now),
    env.DB.prepare('INSERT INTO audit_logs (id, company_id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(`AUD-${crypto.randomUUID()}`, actor.companyId, actor.id, 'employee.created', 'user', id, JSON.stringify({ loginId, email }), now),
  ])
  return Response.json({ loginId, temporaryPassword, id, avatar }, { status: 201 })
}
