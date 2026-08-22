import 'dotenv/config'

function required(name: string, fallback?: string) {
  const value = process.env[name] || fallback
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const config = {
  databaseUrl: required('DATABASE_URL', 'postgresql://dayflow:dayflow_local@localhost:5432/dayflow'),
  port: Number(process.env.API_PORT || 3001),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'dayflow_session',
  demoAdminPassword: required('DEMO_ADMIN_PASSWORD', 'Dayflow@2026'),
  demoEmployeePassword: required('DEMO_EMPLOYEE_PASSWORD', 'Employee@2026'),
  production: process.env.NODE_ENV === 'production',
}
