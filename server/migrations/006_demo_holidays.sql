INSERT INTO public_holidays (id,company_id,holiday_date,name) VALUES
  ('HOL-DEMO-REPUBLIC-2026','COMP-DEMO','2026-01-26','Republic Day'),
  ('HOL-DEMO-INDEPENDENCE-2026','COMP-DEMO','2026-08-15','Independence Day'),
  ('HOL-DEMO-GANDHI-2026','COMP-DEMO','2026-10-02','Gandhi Jayanti')
ON CONFLICT DO NOTHING;
