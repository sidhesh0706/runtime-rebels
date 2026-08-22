import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { hashPassword } from './auth.js'
import { pool, withTransaction } from './db.js'
import { payrollForWage } from './payroll.js'

const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Human Resources', 'Finance'] as const
const people: Array<[string, typeof departments[number], string]> = [
  ['Aarav Sharma', 'Human Resources', 'Company Administrator'], ['Isha Patel', 'Engineering', 'Frontend Lead'],
  ['Rohan Gupta', 'Engineering', 'Backend Engineer'], ['Ananya Singh', 'Engineering', 'QA Engineer'],
  ['Kabir Khan', 'Engineering', 'DevOps Engineer'], ['Priya Nair', 'Engineering', 'Fullstack Engineer'],
  ['Vikram Rao', 'Engineering', 'Staff Engineer'], ['Sneha Verma', 'Engineering', 'Mobile Engineer'],
  ['Arjun Desai', 'Design', 'Product Designer'], ['Maya Sharma', 'Design', 'UX Lead'],
  ['Nikhil Joshi', 'Design', 'Visual Designer'], ['Kavya Reddy', 'Design', 'Design Manager'],
  ['Aditya Kumar', 'Marketing', 'Growth Lead'], ['Sara Ali', 'Marketing', 'Content Strategist'],
  ['Rahul Bansal', 'Marketing', 'Performance Marketer'], ['Neha Kapoor', 'Marketing', 'Brand Manager'],
  ['Amit Trivedi', 'Sales', 'Account Executive'], ['Pooja Agarwal', 'Sales', 'Sales Manager'],
  ['Siddharth Malhotra', 'Sales', 'SDR'], ['Divya Bhatt', 'Sales', 'Customer Success'],
  ['Harshit Jain', 'Finance', 'Finance Analyst'], ['Tanvi Shah', 'Finance', 'Controller'],
  ['Mohit Yadav', 'Finance', 'Accountant'], ['Shriya Das', 'Finance', 'FP&A Lead'],
  ['Deepak Menon', 'Human Resources', 'HR Manager'], ['Anjali Pillai', 'Human Resources', 'Talent Lead'],
  ['Rajeev Kumar', 'Engineering', 'Data Engineer'], ['Olivia Chen', 'Engineering', 'Data Scientist'],
  ['Ethan Brown', 'Engineering', 'Infrastructure Engineer'], ['Zara Khan', 'Design', 'UX Researcher'],
  ['Liam Smith', 'Marketing', 'SEO Lead'], ['Noah Wilson', 'Sales', 'Enterprise AE'],
  ['Ava Johnson', 'Finance', 'Treasury Analyst'], ['Isabella Lee', 'Engineering', 'Security Engineer'],
  ['Mason Davis', 'Engineering', 'Backend Engineer'], ['Sophia Miller', 'Design', 'Illustrator'],
  ['James Anderson', 'Marketing', 'Social Lead'], ['Charlotte Thomas', 'Sales', 'Renewals Manager'],
  ['Amelia White', 'Engineering', 'QA Lead'], ['Benjamin Harris', 'Finance', 'Payroll Specialist'],
  ['Evelyn Clark', 'Human Resources', 'HR Operations'], ['Harper Lewis', 'Engineering', 'Mobile Lead'],
  ['Elijah Walker', 'Design', 'Motion Designer'], ['Abigail Hall', 'Sales', 'Account Executive'],
]

function dateOffset(offset: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export async function seed() {
  const existing = await pool.query("SELECT 1 FROM companies WHERE id = 'COMP-DEMO'")
  if (existing.rowCount) return
  await withTransaction(async client => {
    const now = new Date().toISOString()
    await client.query('INSERT INTO companies (id, name, code, created_at) VALUES ($1, $2, $3, $4)', ['COMP-DEMO', 'DayFlow', 'OI', now])
    for (const name of departments) {
      await client.query('INSERT INTO departments (id, company_id, name) VALUES ($1, $2, $3)', [`DEPT-${name.replace(/\s+/g, '-').toUpperCase()}`, 'COMP-DEMO', name])
    }
    await client.query("INSERT INTO working_schedules (id, company_id, name) VALUES ('SCHEDULE-DEMO', 'COMP-DEMO', 'Standard 9 to 6')")

    const adminPassword = hashPassword(config.demoAdminPassword)
    const employeePassword = hashPassword(config.demoEmployeePassword)
    await client.query(`INSERT INTO users (id, company_id, employee_id, name, email, login_id, phone, role, avatar, password_hash, password_salt, email_verified)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`, ['U1', 'COMP-DEMO', 'EMP1001', 'Aarav Sharma', 'admin@dayflow.co', 'OIARSH20200001', '+91 9000000001', 'admin', '/api/avatars-v2/Aarav-Sharma', adminPassword.hash, adminPassword.salt])
    await client.query(`INSERT INTO users (id, company_id, employee_id, name, email, login_id, phone, role, avatar, password_hash, password_salt, email_verified)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`, ['U2', 'COMP-DEMO', 'EMP1002', 'Isha Patel', 'isha@dayflow.co', 'OIISPA20210002', '+91 9000000002', 'employee', '/api/avatars-v2/Isha-Patel', employeePassword.hash, employeePassword.salt])

    for (let index = 0; index < people.length; index += 1) {
      const [name, department, jobTitle] = people[index]
      const id = `EMP${1001 + index}`
      const email = index === 0 ? 'admin@dayflow.co' : index === 1 ? 'isha@dayflow.co' : `${name.toLowerCase().replaceAll(' ', '.')}@dayflow.co`
      const joinYear = 2020 + (index % 4)
      const joinDate = `${joinYear}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 25) + 1).padStart(2, '0')}`
      const userId = index === 0 ? 'U1' : index === 1 ? 'U2' : null
      await client.query(`INSERT INTO employees (id, company_id, user_id, name, email, phone, department, job_title, avatar, join_date, manager, location, address, about, job_love, interests, skills, certifications)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb)`, [
        id, 'COMP-DEMO', userId, name, email, `+91 ${9000000000 + index}`, department, jobTitle,
        `/api/avatars-v2/${name.replaceAll(' ','-')}`, joinDate, index < 8 ? 'Vikram Rao' : 'Aarav Sharma', index % 3 === 0 ? 'Bengaluru' : 'Hybrid',
        'Bengaluru, Karnataka', 'Focused on building thoughtful systems and helping the team do its best work.', 'Building reliable systems with a people-first team.',
        'Learning, team culture, and solving meaningful problems.', JSON.stringify(index % 2 ? ['Collaboration', 'Planning'] : ['Leadership', 'Problem solving']), JSON.stringify(index % 3 === 0 ? ['Workplace Essentials'] : []),
      ])
      await client.query('INSERT INTO employee_private_info (employee_id, nationality, personal_email, residential_address) VALUES ($1,$2,$3,$4)', [id, 'Indian', email, 'Bengaluru, Karnataka'])
      await client.query('INSERT INTO bank_details (employee_id, bank_name, ifsc_code, employee_code) VALUES ($1,$2,$3,$4)', [id, 'Demo Bank', 'DEMO0001234', id])

      const wage = 55_000 + ((index * 7919) % 120_000)
      await client.query('INSERT INTO salary_structures (employee_id, monthly_wage) VALUES ($1,$2)', [id, wage])
      const payroll = payrollForWage(id, wage)
      await client.query(`INSERT INTO payroll_records (id, company_id, employee_id, payroll_month, base, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_employee, pf_employer, professional_tax, payable_days, working_days, gross, deductions, net)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, [
        `PAY-${id}-${payroll.month}`, 'COMP-DEMO', id, payroll.month, payroll.base, payroll.hra, payroll.standardAllowance, payroll.performanceBonus, payroll.lta,
        payroll.fixedAllowance, payroll.pfEmployee, payroll.pfEmployer, payroll.professionalTax, payroll.payableDays, payroll.workingDays, payroll.gross, payroll.deductions, payroll.net,
      ])

      for (let dayOffset = -6; dayOffset <= 0; dayOffset += 1) {
        const workDate = dateOffset(dayOffset)
        const state = (index + dayOffset + 12) % 20
        const status = state === 0 ? 'Absent' : state === 1 ? 'Leave' : state === 2 ? 'Late' : state === 3 ? 'Half-day' : 'Present'
        const hasTimes = status !== 'Absent' && status !== 'Leave'
        const checkIn = hasTimes ? `${workDate}T03:${String(30 + (index % 20)).padStart(2, '0')}:00.000Z` : null
        const checkOut = hasTimes ? `${workDate}T12:${String(index % 20).padStart(2, '0')}:00.000Z` : null
        await client.query(`INSERT INTO attendance (id, company_id, employee_id, work_date, status, check_in, check_out, work_minutes, extra_minutes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [`ATT-${id}-${workDate}`, 'COMP-DEMO', id, workDate, status, checkIn, checkOut, status === 'Half-day' ? 270 : hasTimes ? 480 : null, hasTimes ? 0 : null])
      }
    }

    await client.query("INSERT INTO leave_types (id, company_id, name, code, annual_allocation, paid) VALUES ('LT-PAID','COMP-DEMO','Paid Time Off','Paid',18,true), ('LT-SICK','COMP-DEMO','Sick Leave','Sick',10,true), ('LT-UNPAID','COMP-DEMO','Unpaid Leave','Unpaid',365,false)")
    for (let index = 0; index < people.length; index += 1) {
      const employeeId = `EMP${1001 + index}`
      await client.query("INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated) VALUES ($1,'LT-PAID',$2,18), ($1,'LT-SICK',$2,10), ($1,'LT-UNPAID',$2,365)", [employeeId, new Date().getFullYear()])
    }
    const leaveSeed = [
      ['LV1001','EMP1003','Paid',1,3,3,'Family function','Pending'], ['LV1002','EMP1006','Sick',0,1,2,'Fever','Pending'],
      ['LV1003','EMP1009','Paid',2,2,1,'Personal work','Pending'], ['LV1004','EMP1001','Paid',-5,-3,3,'Vacation','Approved'],
      ['LV1005','EMP1013','Paid',-2,-1,2,'Travel','Approved'], ['LV1006','EMP1016','Unpaid',5,7,3,'Extended leave','Pending'],
      ['LV1007','EMP1002','Sick',1,1,1,'Medical','Pending'], ['LV1008','EMP1023','Paid',1,4,4,'Wedding','Pending'],
      ['LV1009','EMP1007','Paid',1,2,2,'Conference','Approved'], ['LV1010','EMP1008','Paid',1,3,3,'Vacation','Approved'],
    ]
    for (const leave of leaveSeed) {
      await client.query(`INSERT INTO leave_requests (id, company_id, employee_id, leave_type, start_date, end_date, days, reason, status, reviewed_by, reviewed_at)
        VALUES ($1,'COMP-DEMO',$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [leave[0], leave[1], leave[2], dateOffset(Number(leave[3])), dateOffset(Number(leave[4])), leave[5], leave[6], leave[7], leave[7] === 'Approved' ? 'Aarav Sharma' : null, leave[7] === 'Approved' ? now : null])
    }
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seed().then(() => pool.end()).catch(error => { console.error(error); process.exitCode = 1 })
}
