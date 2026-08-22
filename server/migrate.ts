import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pool, withTransaction } from './db.js'

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDirectory = process.env.MIGRATIONS_DIRECTORY || (here.endsWith('server-dist') ? join(process.cwd(), 'server', 'migrations') : join(here, 'migrations'))

export async function migrate() {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  const files = (await readdir(migrationsDirectory)).filter(name => name.endsWith('.sql')).sort()
  for (const name of files) {
    const existing = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name])
    if (existing.rowCount) continue
    const sql = await readFile(join(migrationsDirectory, name), 'utf8')
    await withTransaction(async client => {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name])
    })
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate().then(() => pool.end()).catch(error => { console.error(error); process.exitCode = 1 })
}
