-- Dayflow HRMS — PostgreSQL schema
-- Every dashboard number is derived from these tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','employee')),
  department_id UUID REFERENCES departments(id),
  avatar TEXT,
  phone TEXT,
  join_date DATE,
  salary INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Private Information per reference design (2nd/3rd image)
-- Every employee has a complete private record; access is row-level
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'Dayflow Inc.';
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male','Female','Other'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('Single','Married','Divorced'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS uan TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ifsc TEXT;

-- Salary structure (Salary Info tab - admin only per Important box)
CREATE TABLE IF NOT EXISTS salary_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  wage_type TEXT NOT NULL DEFAULT 'Fixed' CHECK (wage_type IN ('Fixed')),
  monthly_wage INTEGER NOT NULL,
  yearly_wage INTEGER NOT NULL,
  working_days_per_week INTEGER NOT NULL DEFAULT 5,
  break_time_hrs NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  pf_employer_rate NUMERIC(4,2) NOT NULL DEFAULT 12.00,
  pf_employee_rate NUMERIC(4,2) NOT NULL DEFAULT 12.00,
  professional_tax INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  computation_type TEXT NOT NULL CHECK (computation_type IN ('Fixed','Percent of Wage','Percent of Basic')),
  value NUMERIC(10,2) NOT NULL,
  computed_amount INTEGER NOT NULL,
  UNIQUE(salary_structure_id, name)
);

-- ============================================================
-- Row-Level Security / Backend Authorization (Private & Security)
-- Enforces: Employee can VIEW/EDIT only own rows; Admin/HR can manage all
-- This is server-side — UI hiding alone is not sufficient
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;

-- Example: replace auth.uid() with your auth provider (Supabase, etc.)
-- For local demo, the same checks are mirrored in src/lib/store.ts -> updateEmployee/addEmployee with role checks

DROP POLICY IF EXISTS users_select_own_or_admin ON users;
CREATE POLICY users_select_own_or_admin ON users
  FOR SELECT USING (
    id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
DROP POLICY IF EXISTS users_update_own_or_admin ON users;
CREATE POLICY users_update_own_or_admin ON users
  FOR UPDATE USING (
    id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS salary_select_own_or_admin ON salary_structures;
CREATE POLICY salary_select_own_or_admin ON salary_structures
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
DROP POLICY IF EXISTS salary_update_admin_only ON salary_structures;
CREATE POLICY salary_update_admin_only ON salary_structures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Private fields are part of users row, so the same RLS above applies.
-- For stricter column-level privacy, create a view that omits PII for non-owners:
CREATE OR REPLACE VIEW v_users_public AS
  SELECT id, employee_id, name, email, avatar, department_id, role, company, location, join_date, login_id
  FROM users;
CREATE OR REPLACE VIEW v_users_private AS
  SELECT id, employee_id, dob, address, nationality, gender, marital_status, emergency_contact, pan, uan, bank_account, bank_name, ifsc
  FROM users
  WHERE id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin');

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present','Absent','Half-day','Leave','Late')),
  check_in TIME,
  check_out TIME,
  hours NUMERIC(4,1),
  UNIQUE(user_id, date)
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Paid','Sick','Unpaid','Casual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending','Approved','Rejected')),
  created_at DATE DEFAULT CURRENT_DATE,
  reviewed_by UUID REFERENCES users(id)
);

CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  base INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  deductions INTEGER DEFAULT 0,
  net INTEGER NOT NULL,
  UNIQUE(user_id, month)
);

-- Seed departments
INSERT INTO departments(name) VALUES ('Engineering'),('Design'),('Marketing'),('Sales'),('Human Resources'),('Finance');

-- Helpful views for Dayflow metrics
CREATE OR REPLACE VIEW v_today_metrics AS
SELECT
  (SELECT COUNT(*) FROM users) AS total_employees,
  (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status IN ('Present','Late','Half-day')) AS present_today,
  (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status='Absent') AS absent_today,
  (SELECT COUNT(*) FROM leave_requests WHERE status='Pending') AS pending_approvals;

CREATE OR REPLACE VIEW v_department_availability AS
SELECT d.name AS department,
  COUNT(u.id) AS total,
  COUNT(a.id) FILTER (WHERE a.status IN ('Present','Late','Half-day') AND a.date=CURRENT_DATE) AS present
FROM departments d
LEFT JOIN users u ON u.department_id=d.id
LEFT JOIN attendance a ON a.user_id=u.id
GROUP BY d.name;

-- Smart Leave Guard query: overlapping leaves in same department
-- SELECT l2.* FROM leave_requests l1
-- JOIN users u1 ON u1.id=l1.user_id
-- JOIN users u2 ON u2.department_id=u1.department_id
-- JOIN leave_requests l2 ON l2.user_id=u2.id AND l2.id<>l1.id AND l2.status IN ('Approved','Pending')
-- WHERE l1.id=$1 AND NOT (l2.end_date < l1.start_date OR l2.start_date > l1.end_date);
