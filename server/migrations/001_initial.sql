CREATE TABLE IF NOT EXISTS companies (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  logo_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id text,
  name text NOT NULL,
  email text NOT NULL,
  login_id text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('admin', 'hr', 'employee')),
  avatar text,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  failed_login_attempts integer NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email),
  UNIQUE(login_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS employees (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  department text NOT NULL,
  job_title text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  join_date date NOT NULL,
  employment_status text NOT NULL DEFAULT 'Active' CHECK (employment_status IN ('Active', 'On Leave', 'Absent')),
  manager text,
  location text,
  address text,
  about text,
  job_love text,
  interests text,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);
CREATE INDEX IF NOT EXISTS employees_company_department_idx ON employees(company_id, department);

CREATE TABLE IF NOT EXISTS employee_private_info (
  employee_id text PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  date_of_birth date,
  residential_address text,
  mailing_address text,
  nationality text,
  personal_email text,
  gender text,
  marital_status text
);

CREATE TABLE IF NOT EXISTS bank_details (
  employee_id text PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  account_number text,
  bank_name text,
  ifsc_code text,
  pan text,
  uan text,
  employee_code text
);

CREATE TABLE IF NOT EXISTS working_schedules (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  working_days_per_week integer NOT NULL DEFAULT 5 CHECK (working_days_per_week BETWEEN 1 AND 7),
  daily_minutes integer NOT NULL DEFAULT 480 CHECK (daily_minutes > 0),
  break_minutes integer NOT NULL DEFAULT 60 CHECK (break_minutes >= 0),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '18:00'
);

CREATE TABLE IF NOT EXISTS attendance (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id text NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('Present', 'Absent', 'Half-day', 'Leave', 'Late')),
  check_in timestamptz,
  check_out timestamptz,
  work_minutes integer CHECK (work_minutes IS NULL OR work_minutes >= 0),
  extra_minutes integer CHECK (extra_minutes IS NULL OR extra_minutes >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, work_date),
  CHECK (check_out IS NULL OR check_in IS NOT NULL),
  CHECK (check_out IS NULL OR check_out >= check_in)
);
CREATE INDEX IF NOT EXISTS attendance_company_date_idx ON attendance(company_id, work_date);

CREATE TABLE IF NOT EXISTS leave_types (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  annual_allocation numeric(6,2) NOT NULL DEFAULT 0 CHECK (annual_allocation >= 0),
  requires_attachment boolean NOT NULL DEFAULT false,
  paid boolean NOT NULL DEFAULT true,
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  employee_id text NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id text NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year integer NOT NULL,
  allocated numeric(6,2) NOT NULL DEFAULT 0 CHECK (allocated >= 0),
  used numeric(6,2) NOT NULL DEFAULT 0 CHECK (used >= 0),
  PRIMARY KEY(employee_id, leave_type_id, year),
  CHECK (used <= allocated)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id text NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN ('Paid', 'Sick', 'Unpaid')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days numeric(6,2) NOT NULL CHECK (days > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  attachment_document_id text,
  attachment_name text,
  review_comment text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (status <> 'Rejected' OR length(trim(coalesce(review_comment, ''))) > 0)
);
CREATE INDEX IF NOT EXISTS leave_employee_dates_idx ON leave_requests(employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS leave_company_status_idx ON leave_requests(company_id, status);

CREATE TABLE IF NOT EXISTS public_holidays (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  name text NOT NULL,
  UNIQUE(company_id, holiday_date)
);

CREATE TABLE IF NOT EXISTS salary_structures (
  employee_id text PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  monthly_wage numeric(12,2) NOT NULL CHECK (monthly_wage >= 0),
  working_days_per_month integer NOT NULL DEFAULT 22 CHECK (working_days_per_month > 0),
  basic_percent numeric(5,2) NOT NULL DEFAULT 50,
  hra_basic_percent numeric(5,2) NOT NULL DEFAULT 50,
  standard_allowance numeric(12,2) NOT NULL DEFAULT 4167,
  performance_bonus_percent numeric(5,2) NOT NULL DEFAULT 8.33,
  lta_percent numeric(5,2) NOT NULL DEFAULT 8.33,
  pf_employee_percent numeric(5,2) NOT NULL DEFAULT 12,
  pf_employer_percent numeric(5,2) NOT NULL DEFAULT 12,
  professional_tax numeric(12,2) NOT NULL DEFAULT 200,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id text NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month text NOT NULL,
  base numeric(12,2) NOT NULL CHECK (base >= 0),
  hra numeric(12,2) NOT NULL CHECK (hra >= 0),
  standard_allowance numeric(12,2) NOT NULL CHECK (standard_allowance >= 0),
  performance_bonus numeric(12,2) NOT NULL CHECK (performance_bonus >= 0),
  lta numeric(12,2) NOT NULL CHECK (lta >= 0),
  fixed_allowance numeric(12,2) NOT NULL CHECK (fixed_allowance >= 0),
  pf_employee numeric(12,2) NOT NULL CHECK (pf_employee >= 0),
  pf_employer numeric(12,2) NOT NULL CHECK (pf_employer >= 0),
  professional_tax numeric(12,2) NOT NULL CHECK (professional_tax >= 0),
  payable_days numeric(6,2) NOT NULL CHECK (payable_days >= 0),
  working_days numeric(6,2) NOT NULL CHECK (working_days > 0),
  gross numeric(12,2) NOT NULL CHECK (gross >= 0),
  deductions numeric(12,2) NOT NULL CHECK (deductions >= 0),
  net numeric(12,2) NOT NULL CHECK (net >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, payroll_month)
);

CREATE TABLE IF NOT EXISTS documents (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id text REFERENCES employees(id) ON DELETE CASCADE,
  storage_name text NOT NULL UNIQUE,
  file_name text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_employee_idx ON documents(employee_id);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_company_time_idx ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity_type, entity_id);
