import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

// PostgreSQL DATE has no timezone. Keeping it as YYYY-MM-DD prevents the
// machine timezone from shifting a work date to the previous UTC day.
pg.types.setTypeParser(1082, value => value)

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
})

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
