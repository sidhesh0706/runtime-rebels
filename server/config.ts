import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true })
loadEnv({ path: resolve(process.cwd(), '..', '.env'), override: false, quiet: true })

export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://dayflow:dayflow@localhost:5432/dayflow',
  port: Number(process.env.API_PORT || 3001),
  cookieName: process.env.SESSION_COOKIE_NAME || 'dayflow_session',
  demoAdminPassword: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123',
  demoEmployeePassword: process.env.DEMO_EMPLOYEE_PASSWORD || 'Employee@123',
}
