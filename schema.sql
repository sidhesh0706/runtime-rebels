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
