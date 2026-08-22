UPDATE employees
SET about='I’m '||name||'. '||regexp_replace(about,'^I’m [^.]+\.\s*','')
WHERE company_id='COMP-DEMO';
