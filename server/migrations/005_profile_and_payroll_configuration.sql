ALTER TABLE employee_private_info
  ADD COLUMN IF NOT EXISTS emergency_contact text;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'attachment';

ALTER TABLE salary_structures
  ADD COLUMN IF NOT EXISTS working_days_per_week integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS break_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS salary_components jsonb NOT NULL DEFAULT '[
    {"id":"basic","name":"Basic Salary","type":"Percent of Wage","value":50},
    {"id":"hra","name":"House Rent Allowance","type":"Percent of Basic","value":50},
    {"id":"standard","name":"Standard Allowance","type":"Fixed","value":4167},
    {"id":"performance","name":"Performance Bonus","type":"Percent of Wage","value":8.33},
    {"id":"lta","name":"Leave Travel Allowance","type":"Percent of Wage","value":8.33},
    {"id":"fixed","name":"Fixed Allowance","type":"Remainder","value":0}
  ]'::jsonb;

ALTER TABLE salary_structures
  DROP CONSTRAINT IF EXISTS salary_structures_working_days_per_week_check,
  DROP CONSTRAINT IF EXISTS salary_structures_break_minutes_check;

ALTER TABLE salary_structures
  ADD CONSTRAINT salary_structures_working_days_per_week_check CHECK (working_days_per_week BETWEEN 1 AND 7),
  ADD CONSTRAINT salary_structures_break_minutes_check CHECK (break_minutes BETWEEN 0 AND 360);

CREATE INDEX IF NOT EXISTS documents_company_type_idx ON documents(company_id, document_type);
