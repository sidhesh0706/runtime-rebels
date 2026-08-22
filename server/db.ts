import pg from 'pg'
import { config } from './config.js'

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dayflow_app_users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      login_id text NOT NULL UNIQUE,
      role text NOT NULL CHECK (role IN ('admin','hr','employee')),
      avatar text NOT NULL DEFAULT '',
      department text,
      company_name text,
      phone text,
      password_hash text NOT NULL,
      password_salt text NOT NULL,
      must_change_password boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS dayflow_app_sessions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES dayflow_app_users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS dayflow_app_workspace_state (
      id integer PRIMARY KEY CHECK (id = 1),
      data jsonb NOT NULL,
      version integer NOT NULL DEFAULT 1,
      updated_at timestamptz NOT NULL DEFAULT now(),
      updated_by text REFERENCES dayflow_app_users(id)
    );
    CREATE TABLE IF NOT EXISTS dayflow_app_audit_log (
      id bigserial PRIMARY KEY,
      user_id text REFERENCES dayflow_app_users(id),
      action text NOT NULL,
      details jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS dayflow_app_sessions_expires_at_idx ON dayflow_app_sessions(expires_at);
  `)
}
