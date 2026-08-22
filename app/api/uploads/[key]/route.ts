import { env } from 'cloudflare:workers'
import { getSessionUser } from '../../../../lib/server/dayflow-db'

export const runtime = 'edge'

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const user = await getSessionUser(request)
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 })
  const { key } = await context.params
  const document = await env.DB.prepare('SELECT file_name, content_type FROM documents WHERE object_key = ? AND company_id = ? LIMIT 1').bind(key, user.companyId).first<{ file_name: string, content_type: string }>()
  if (!document) return Response.json({ error: 'File not found' }, { status: 404 })
  const object = await env.FILES.get(key)
  if (!object) return Response.json({ error: 'File not found' }, { status: 404 })
  return new Response(object.body, { headers: { 'Content-Type': document.content_type, 'Content-Disposition': `inline; filename="${document.file_name.replaceAll('"', '')}"`, 'Cache-Control': 'private, max-age=60' } })
}
