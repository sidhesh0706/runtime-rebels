import { env } from 'cloudflare:workers'
import { getSessionUser } from '../../../lib/server/dayflow-db'

export const runtime = 'edge'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 })
  const row = await env.DB.prepare('SELECT payload, updated_at FROM workspace_snapshots WHERE workspace_id = ?').bind(user.companyId).first<{ payload: string, updated_at: string }>()
  return Response.json({ data: row ? JSON.parse(row.payload) : null, updatedAt: row?.updated_at || null })
}

export async function PUT(request: Request) {
  const user = await getSessionUser(request)
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 })
  const data = await request.json<unknown>()
  if (!data || typeof data !== 'object' || Array.isArray(data)) return Response.json({ error: 'Invalid workspace snapshot' }, { status: 400 })
  const payload = JSON.stringify(data)
  if (payload.length > 4_000_000) return Response.json({ error: 'Workspace snapshot is too large' }, { status: 413 })
  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare('INSERT INTO workspace_snapshots (workspace_id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(workspace_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(user.companyId, payload, now),
    env.DB.prepare('INSERT INTO audit_logs (id, company_id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(`AUD-${crypto.randomUUID()}`, user.companyId, user.id, 'workspace.synced', 'workspace', user.companyId, JSON.stringify({ bytes: payload.length }), now),
  ])
  return Response.json({ ok: true, updatedAt: now })
}
