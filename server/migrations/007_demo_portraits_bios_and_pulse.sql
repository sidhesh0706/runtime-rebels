WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY id)-1 AS portrait_index
  FROM employees WHERE company_id='COMP-DEMO'
)
UPDATE employees e
SET avatar='/api/employee-photo/'||ranked.portrait_index,
    about='I’m '||e.name||'. '||(ARRAY[
      'I turn complex work into clear, dependable outcomes and enjoy helping teammates grow along the way.',
      'Curious by nature, I like listening closely, testing ideas quickly, and shipping work that genuinely helps people.',
      'I care about thoughtful execution, honest collaboration, and leaving every system a little better than I found it.',
      'My best days combine focused problem-solving, kind teamwork, and a measurable improvement for our customers.',
      'I bring structure to ambiguity and enjoy connecting the small details to the wider business goal.',
      'I am happiest when learning something new, sharing it with the team, and turning it into a practical result.',
      'I value calm communication, strong craft, and simple solutions that hold up under real-world pressure.',
      'I enjoy finding the human story behind the data and using it to make smarter, more inclusive decisions.',
      'I am a hands-on teammate who believes consistent small improvements create exceptional products and workplaces.',
      'I like challenging assumptions respectfully, building with care, and celebrating the people behind every win.',
      'I combine analytical thinking with empathy to make work clearer, faster, and more useful for everyone involved.',
      'I thrive in collaborative teams where ownership is shared, feedback is direct, and good ideas can come from anyone.'
    ])[1+(ranked.portrait_index%12)],
    job_love=(ARRAY['Solving hard problems with people who care about the outcome.','Turning feedback into visible improvements.','Helping teammates do their strongest work.','Seeing a careful idea become a useful everyday tool.','Learning from customers and improving how we work.','Building clarity and momentum across the team.'])[1+(ranked.portrait_index%6)],
    interests=(ARRAY['Mentoring, hiking, and community volunteering.','Design systems, reading, and travel.','Automation, music, and badminton.','Customer research, photography, and cooking.','Data storytelling, running, and books.','Team culture, films, and weekend cycling.'])[1+(ranked.portrait_index%6)]
FROM ranked WHERE e.id=ranked.id;

UPDATE users u SET avatar=e.avatar FROM employees e WHERE u.employee_id=e.id AND e.company_id='COMP-DEMO';

UPDATE attendance a
SET status=CASE
    WHEN (current_date-a.work_date)=6 AND right(a.employee_id,2)::int%10<3 THEN 'Absent'
    WHEN (current_date-a.work_date)=5 AND right(a.employee_id,2)::int%10<2 THEN 'Absent'
    WHEN (current_date-a.work_date)=4 AND right(a.employee_id,2)::int%10<1 THEN 'Absent'
    WHEN (current_date-a.work_date)=3 AND right(a.employee_id,2)::int%8<2 THEN 'Absent'
    WHEN (current_date-a.work_date)=2 AND right(a.employee_id,2)::int%7<1 THEN 'Leave'
    WHEN (current_date-a.work_date)=1 AND right(a.employee_id,2)::int%6<1 THEN 'Half-day'
    ELSE 'Present' END,
    check_in=CASE WHEN (current_date-a.work_date) BETWEEN 1 AND 6 AND ((current_date-a.work_date)=6 AND right(a.employee_id,2)::int%10<3 OR (current_date-a.work_date)=5 AND right(a.employee_id,2)::int%10<2 OR (current_date-a.work_date)=4 AND right(a.employee_id,2)::int%10<1 OR (current_date-a.work_date)=3 AND right(a.employee_id,2)::int%8<2 OR (current_date-a.work_date)=2 AND right(a.employee_id,2)::int%7<1) THEN NULL ELSE check_in END,
    check_out=CASE WHEN (current_date-a.work_date) BETWEEN 1 AND 6 AND ((current_date-a.work_date)=6 AND right(a.employee_id,2)::int%10<3 OR (current_date-a.work_date)=5 AND right(a.employee_id,2)::int%10<2 OR (current_date-a.work_date)=4 AND right(a.employee_id,2)::int%10<1 OR (current_date-a.work_date)=3 AND right(a.employee_id,2)::int%8<2 OR (current_date-a.work_date)=2 AND right(a.employee_id,2)::int%7<1) THEN NULL ELSE check_out END
WHERE a.company_id='COMP-DEMO' AND a.work_date BETWEEN current_date-6 AND current_date-1;
