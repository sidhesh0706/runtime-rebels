import { env } from 'cloudflare:workers'
import { getSessionUser } from '../../../lib/server/dayflow-db'

export const runtime = 'edge'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 })
  const form = await request.formData()
  const value = form.get('file')
  if (!(value instanceof File)) return Response.json({ error: 'Choose a file to upload' }, { status: 400 })
  if (value.size > 8 * 1024 * 1024) return Response.json({ error: 'Files must be 8 MB or smaller' }, { status: 413 })
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(value.type)) return Response.json({ error: 'Upload a PDF, JPG, PNG, or WebP file' }, { status: 415 })
  const safeName = value.name.replace(/[^A-Za-z0-9._-]/g, '-').slice(-120)
  const key = `${user.companyId}-${Date.now()}-${crypto.randomUUID()}-${safeName}`
  await env.FILES.put(key, value.stream(), { httpMetadata: { contentType: value.type, contentDisposition: `attachment; filename="${safeName}"` } })
  const id = `DOC-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare('INSERT INTO documents (id, company_id, owner_id, object_key, file_name, content_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, user.companyId, user.id, key, value.name, value.type, value.size, now),
    env.DB.prepare('INSERT INTO audit_logs (id, company_id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(`AUD-${crypto.randomUUID()}`, user.companyId, user.id, 'document.uploaded', 'document', id, JSON.stringify({ fileName: value.name, size: value.size }), now),
  ])
  return Response.json({ id, key, fileName: value.name, url: `/api/uploads/${encodeURIComponent(key)}` }, { status: 201 })
}
