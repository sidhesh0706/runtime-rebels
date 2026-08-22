export type Role = 'admin' | 'employee'
export type Dept = 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'Human Resources' | 'Finance'
export type LeaveType = 'Paid' | 'Sick' | 'Unpaid' | 'Casual'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'
export type AttStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave' | 'Late'

export interface SalaryComponent {
  id: string
  name: string
  type: 'Fixed' | 'Percent of Wage' | 'Percent of Basic'
  value: number
  computed: number
}

export interface Employee {
  id: string
  loginId: string
  name: string
  email: string
  department: Dept
  role: string
  avatar: string
  salary: number
  joinDate: string
  phone: string
  status: 'Active' | 'On Leave' | 'Absent'
  // profile header
  company?: string
  manager?: string
  location?: string
  // private info
  dob?: string
  address?: string
  maritalStatus?: 'Single' | 'Married' | 'Divorced'
  nationality?: string
  emergencyContact?: string
  bankAccount?: string
  bankName?: string
  ifsc?: string
  pan?: string
  // salary structure
  wageType?: 'Fixed'
  monthlyWage?: number
  yearlyWage?: number
  workingDaysPerWeek?: number
  workingDaysPerMonth?: number
  breakTimeHrs?: number
  salaryComponents?: SalaryComponent[]
  pfEmployerRate?: number
  pfEmployeeRate?: number
  professionalTax?: number
  gender?: 'Male'|'Female'|'Other'
  uan?: string
  skills?: string[]
  about?: string
  loveAboutJob?: string
  interestsDetail?: string
  education?: { degree: string; school: string; year: string }[]
  certifications?: string[]
  hobbies?: string[]
  documents?: { name:string; type:string; date:string }[]
  skillEndorsements?: Record<string, number>
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  status: AttStatus
  checkIn?: string
  checkOut?: string
  hours?: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  createdAt: string
  reviewedBy?: string
}

export interface PayrollRecord {
  employeeId: string
  base: number
  bonus: number
  deductions: number
  net: number
  month: string
}

export const DEPARTMENTS: Dept[] = ['Engineering','Design','Marketing','Sales','Human Resources','Finance']

const names: [string,string,string][] = [
  ["Aarav Mehta","Engineering","Senior Engineer"],
  ["Isha Patel","Engineering","Frontend Lead"],
  ["Rohan Gupta","Engineering","Backend Engineer"],
  ["Arjun Desai","Design","Product Designer"],
  ["Maya Sharma","Design","UX Lead"],
  ["Kavya Reddy","Design","Design Manager"],
  ["Aditya Kumar","Marketing","Growth Lead"],
  ["Sara Ali","Marketing","Content Strategist"],
  ["Rahul Bansal","Marketing","Performance Marketer"],
  ["Amit Trivedi","Sales","Account Executive"],
  ["Pooja Agarwal","Sales","Sales Manager"],
  ["Divya Bhatt","Sales","Customer Success"],
  ["Harshit Jain","Finance","Finance Analyst"],
  ["Tanvi Shah","Finance","Controller"],
  ["Deepak Menon","Human Resources","HR Manager"],
  ["Anjali Pillai","Human Resources","Talent Lead"],
  ["Rajeev Kumar","Engineering","Data Engineer"],
  ["Olivia Chen","Engineering","Data Scientist"],
]

export function genLoginId(name:string, idx:number){
  const parts=name.split(' ')
  const ini=(parts[0]?.[0]||'A')+(parts[1]?.[0]||'X')
  return `DF${ini.toUpperCase()}${String(1001+idx).padStart(4,'0')}`
}
export function salaryBreakdown(base:number): SalaryComponent[]{
  // Exactly per 2nd wireframe: Wage 50000 → Basic 50% (25000), HRA 50% of Basic (12500), Standard 16.67% of Basic (4167), Performance 8.33% of Basic (2083), LTA 8.33% of Basic (2083), Fixed = remainder (4167? actually 2918 in image due to rounding - we compute remainder)
  const basic = Math.round(base * 0.50) // 25000 for 50000
  const hra = Math.round(basic * 0.50) // 12500
  const standard = Math.round(basic * 0.1667) // 4167
  const perf = Math.round(basic * 0.0833) // 2083
  const lta = Math.round(basic * 0.0833) // 2083
  const fixed = Math.round(base - (basic + hra + standard + perf + lta)) // 4167 remainder? For 50000 => 2917? Let's compute: 50000-25000-12500-4167-2083-2083=4167? Actually 25000+12500=37500+4167=41667+2083=43750+2083=45833 => 50000-45833=4167. Image shows 2918 due to different rounding, but we keep computed remainder to ensure sum = wage.
  return [
    { id:'c1', name:'Basic Salary', type:'Percent of Wage', value:50, computed: basic },
    { id:'c2', name:'House Rent Allowance', type:'Percent of Basic', value:50, computed: hra },
    { id:'c3', name:'Standard Allowance', type:'Percent of Basic', value:16.67, computed: standard },
    { id:'c4', name:'Performance Bonus', type:'Percent of Basic', value:8.33, computed: perf },
    { id:'c5', name:'Leave Travel Allowance', type:'Percent of Basic', value:8.33, computed: lta },
    { id:'c6', name:'Fixed Allowance', type:'Fixed', value: fixed, computed: fixed },
  ]
}

const managers = ['Priya Nair','Deepak Menon','Kavya Reddy','Amit Trivedi','Tanvi Shah']
const locations = ['Mumbai HQ — Floor 5','Bengaluru — WeWork','Delhi — Cyber City','Pune — Baner','Remote']
function seededEmployees(): Employee[] {
  return names.map(([name, dept, role], i) => {
    let salary=55000 + Math.floor(Math.random()*120000)
    if(i===0) salary=600000 // match Excalidraw example 50k/600k for admin profile
    const monthly=Math.round(salary/12)
    const skl = dept==='Engineering'? ['TypeScript','React','Node.js','PostgreSQL']: dept==='Design'? ['Figma','Design Systems','Prototyping','Research']: ['Strategy','Analytics','Communication']
    return {
    id: `EMP${String(1001+i).padStart(4,'0')}`,
    loginId: genLoginId(name as string, i),
    name: name as string,
    email: `${(name as string).toLowerCase().replace(/ /g,'.') }@dayflow.co`,
    department: dept as Dept,
    role: role as string,
    avatar: `https://i.pravatar.cc/150?img=${(i%70)+1}`,
    salary,
    joinDate: new Date(2020 + Math.floor(Math.random()*4), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1).toISOString().slice(0,10),
    phone: `+91 ${Math.floor(9000000000 + Math.random()*999999999)}`,
    status: 'Active',
    company: 'Dayflow Inc.',
    manager: managers[i % managers.length],
    location: locations[i % locations.length],
    dob: new Date(1990 + Math.floor(Math.random()*12), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1).toISOString().slice(0,10),
    address: `${Math.floor(100+Math.random()*899)} Park Street, ${['Mumbai','Delhi','Bengaluru','Pune'][i%4]} - 4000${i%9}1`,
    maritalStatus: (['Single','Married','Divorced'] as const)[i%3],
    nationality: 'Indian',
    emergencyContact: `+91 ${Math.floor(9000000000 + Math.random()*999999999)}`,
    bankAccount: `XXXX-XXXX-${String(1000+i).padStart(4,'0')}`,
    bankName: ['HDFC Bank','ICICI Bank','SBI'][i%3],
    ifsc: `HDFC000${1000+i}`,
    pan: `ABCDE${1000+i}F`,
    wageType: 'Fixed',
    monthlyWage: monthly,
    yearlyWage: monthly*12,
    workingDaysPerWeek: 5,
    workingDaysPerMonth: 22,
    breakTimeHrs: 1,
    salaryComponents: salaryBreakdown(monthly),
    pfEmployerRate: 12,
    pfEmployeeRate: 12,
    professionalTax: 200,
    gender: (['Male','Female','Other'] as const)[i%3] as any,
    uan: `1012${String(100000000 + i).padStart(9,'0')}`,
    ...(() => {
      const bios: Record<string,{about:string;love:string;interests:string}> = {
        "Aarav Mehta": { about: "Senior Engineer owning Dayflow’s sync engine — reconciles attendance, leave and payroll in real time. Previously at Razorpay, scaled payments ingestion to 12k rps. Leads the RFC guild and mentors four engineers on system design.", love: "I love turning messy ops workflows into deterministic pipelines — when a manager sees ‘92% present’ and trusts the number, that’s the win.", interests: "Trail running in the Sahyadris, film photography on a 1970s SLR, and building mechanical keyboards. Weekend treks keep me offline in the best way." },
        "Isha Patel": { about: "Frontend Lead crafting Dayflow’s design system DayUI — tokens, a11y, and perf budgets. Shipped the new Employees grid and profile transitions. Ex-Zomato, built cart & checkout that handled 2M daily sessions.", love: "What I love is the craft: a 10px radius and the right whitespace make HR feel calm, not corporate. Details compound.", interests: "Sketching interfaces in Procreate, Bharatnatyam, and specialty coffee brewing. I host a monthly UI critique for designers." },
        "Rohan Gupta": { about: "Backend Engineer for attendance and rostering services. Designed the late/half-day state machine and the guard’s staffing simulation. Go, Postgres, and Redis are my daily drivers.", love: "I love the puzzle of time — shifts, breaks, extra-hours — and making payroll forgiving but accurate.", interests: "Chess (1800 Lichess), cycling 100km weekends, and reading sci-fi. Also maintains an open-source pg-cron fork." },
        "Arjun Desai": { about: "Product Designer leading the HR journey: login → directory → profile → time-off. Maps every Excalidraw flow to a shippable state. Formerly at CRED, obsessed with microcopy.", love: "The moment a new HR admin understands the Login ID format in 10 seconds — clarity is kindness.", interests: "Letterpress printing, museum hunts, and bouldering. Keeps a notebook of edge-case user quotes." },
        "Maya Sharma": { about: "UX Lead championing research-driven HR. Ran 18 interviews that reshaped ‘Private Info’ into a form that feels respectful, not bureaucratic. Owns accessibility audits.", love: "I love advocating for the quiet user — the finance associate who just wants a correct payslip without calling support.", interests: "Pottery, urban sketching, and volunteering at a community library. Daily habit: 20-min journaling." },
        "Kavya Reddy": { about: "Design Manager balancing system and soul. Built Dayflow’s muted-green identity and 10–12px radius language. Hires for taste and builds critique rituals.", love: "Seeing engineers reference the SAME Figma token as production — no drift, no surprises.", interests: "Indie film curation, gardening on the balcony, and learning Kannada. Weekend: flea-market typography hunts." },
        "Aditya Kumar": { about: "Growth Lead running lifecycle experiments for HR adoption. Drove 31% increase in self-serve check-ins via nudges and empty-state fixes. Background: B2B SaaS at Mixpanel.", love: "I love when data tells a small truth — like Tuesday leave spikes — and we ship a guard that prevents a staffing crunch.", interests: "Marathon training, podcast notes, and zero-waste cooking experiments. Tracks every experiment in Notion." },
        "Sara Ali": { about: "Content Strategist writing HR that sounds human. Authored the help-center and the ‘About / What I love’ prompts that make profiles feel personal. Ex-Journalist.", love: "Turning a 40-field form into a story — ‘My interests and hobbies’ beats ‘Additional Info’ every time.", interests: "Poetry, second-hand bookstores, and long walks with field recordings. Publishes a tiny newsletter on work language." },
        "Rahul Bansal": { about: "Performance Marketer connecting paid and lifecycle. Built the attribution model for Dayflow’s demo funnel. Loves clean UTMs and honest dashboards.", love: "When a search term becomes a feature — ‘⌘K to find anyone’ started as a keyword, now it’s a habit.", interests: "Beat-making, basketball, and behavioral economics papers. Runs a community ad-teardown night." },
        "Amit Trivedi": { about: "Account Executive who closes by listening. Owns the mid-market pipeline and the ‘view-only’ demo narrative that builds trust before the close.", love: "A crisp profile view that answers ‘is this person present?’ without a call — that’s selling with product.", interests: "Cricket commentary, road trips, and mentoring SDRs on discovery calls." },
        "Pooja Agarwal": { about: "Sales Manager scaling the team from 2 to 8. Built the mutual-action plan template that cut sales cycle by 22%. Obsessed with forecast accuracy.", love: "I love when Sales and HR finally share the same source of truth — no more spreadsheet Ping-Pong.", interests: "Classical singing, trekking, and investing in women-led startups." },
        "Divya Bhatt": { about: "Customer Success turning onboarding into habit. Designed the ‘Check In → green dot’ moment that makes attendance tangible on day one.", love: "Seeing a new hire’s streak hit 7 days — small streaks build culture more than big launches.", interests: "Yoga, community theater, and hosting customers on frank churn post-mortems." },
        "Harshit Jain": { about: "Finance Analyst bridging HR and payroll. Built the salary-component auto-calc (Basic 41% → HRA 50% of Basic) so offers never break the wage ceiling.", love: "When the math adds up — Basic + HRA + Standard + Bonus + LTA + Fixed = exactly wage. No drift.", interests: "Chess, financial modeling, and weekend badminton. Maintains a personal ledger since 2018." },
        "Tanvi Shah": { about: "Controller ensuring every payroll run is auditable. Signed off the Pay Commission mapping and the PF/PT deduction tables. Ex-Big4, loves tidy ledgers.", love: "Calm close days — when attendance feeds payroll without a single manual edit.", interests: "Baking sourdough, watercolors, and mentoring finance freshers on storytelling with numbers." },
        "Deepak Menon": { about: "HR Manager who rewrote Dayflow’s leave policy to be human-first. Champions the ‘My Profile as résumé’ idea — skills, endorsements, growth timeline.", love: "Watching an associate add their first skill and get endorsed — confidence compounds.", interests: "Marathons, Carnatic playlists, and interviewing for potential, not pedigree." },
        "Anjali Pillai": { about: "Talent Lead sourcing beyond job boards. Built the referral engine and the structured scorecards that cut bias.", love: "A search that surfaces not just a name but a Login ID, team, and recent streak — hiring with context.", interests: "Dance, travel writing, and coaching first-time interviewers." },
        "Rajeev Kumar": { about: "Data Engineer pipelines attendance events into the warehouse. Built the 7-day heatmap and the guard’s overlap detection in SQL.", love: "When a slow query drops from 9s to 120ms and the pulse updates feel live.", interests: "Astrophotography, Linux ricing, and building data lineage graphs." },
        "Olivia Chen": { about: "Data Scientist predicting absence risk. Trained the leave-load model that powers the brief — ‘Engineering at 72% → caution’.", love: "Turning ‘gut feel’ about staffing into a gentle nudge before a manager approves leave.", interests: "Piano, rock climbing, and Bayesian puzzles. Runs a tiny data-ethics reading group." },
      }
      const b = bios[name as string] || { about: `Experienced ${role} in ${dept} focused on ${skl.slice(0,2).join(' & ')}.`, love: `I love shipping work that teammates feel immediately — clean states, honest numbers.`, interests: `Outside work: ${['reading','cycling','photography'][i%3]} and learning.` }
      return { about: b.about, loveAboutJob: b.love, interestsDetail: b.interests }
    })(),
    skills: skl,
    education: [{ degree: 'B.Tech', school: ['IIT Bombay','IIT Delhi','BITS Pilani'][i%3], year: String(2014 + i%6) }],
    certifications: i%2===0? ['AWS Certified','Scrum Master']: ['Google Analytics','Leadership Program'],
    hobbies: ['Reading','Cycling','Photography'].slice(0, 1+ i%3),
    documents: [
      { name:'Offer Letter.pdf', type:'Offer', date:'2020-06-12' },
      { name:'ID Proof.pdf', type:'KYC', date:'2020-06-10' },
    ],
    skillEndorsements: Object.fromEntries(skl.map((s, idx)=>[s, 2+ Math.floor(Math.random()*8) + idx])),
  }})
}

function todayStr(offset=0){
  const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10)
}

export function generateAttendance(employees: Employee[]): Attendance[] {
  const today = todayStr(0)
  const records: Attendance[] = []
  employees.forEach(emp=>{
    const r = Math.random()
    let status: AttStatus='Present'
    if(r<0.07) status='Absent'
    else if(r<0.12) status='Leave'
    else if(r<0.16) status='Half-day'
    else if(r<0.22) status='Late'
    const checkIn = status==='Absent'||status==='Leave' ? undefined : `${String(9+Math.floor(Math.random()*2)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`
    const checkOut = status==='Absent'||status==='Leave' ? undefined : `18:${String(Math.floor(Math.random()*50)+10).padStart(2,'0')}`
    records.push({ id:`ATT-${emp.id}-${today}`, employeeId: emp.id, date: today, status, checkIn, checkOut, hours: status==='Half-day'?4.5:8 })
  })
  // last 6 days for heatmap
  for(let o=-6;o<0;o++){
    const d=todayStr(o)
    employees.forEach(emp=>{
      const r=Math.random()
      let status: AttStatus='Present'
      if(r<0.05) status='Absent'
      else if(r<0.10) status='Leave'
      else if(r<0.15) status='Late'
      records.push({ id:`ATT-${emp.id}-${d}`, employeeId: emp.id, date: d, status, checkIn:'09:15', checkOut:'18:05' })
    })
  }
  return records
}

export function generateLeaves(employees: Employee[]): LeaveRequest[] {
  const e = (i:number)=> employees[i % employees.length]
  const leaves: LeaveRequest[] = [
    { id:'LV1001', employeeId: e(2).id, type:'Paid', startDate:todayStr(1), endDate:todayStr(3), days:3, reason:'Family function', status:'Pending', createdAt: todayStr(-1) },
    { id:'LV1002', employeeId: e(5).id, type:'Sick', startDate:todayStr(0), endDate:todayStr(1), days:2, reason:'Fever', status:'Pending', createdAt: todayStr(-1) },
    { id:'LV1003', employeeId: e(8).id, type:'Casual', startDate:todayStr(2), endDate:todayStr(2), days:1, reason:'Personal work', status:'Pending', createdAt: todayStr(0) },
    { id:'LV1004', employeeId: e(0).id, type:'Paid', startDate:todayStr(-5), endDate:todayStr(-3), days:3, reason:'Vacation', status:'Approved', createdAt: todayStr(-7) },
    { id:'LV1005', employeeId: e(12).id, type:'Paid', startDate:todayStr(-2), endDate:todayStr(-1), days:2, reason:'Travel', status:'Approved', createdAt: todayStr(-4) },
    { id:'LV1006', employeeId: e(15).id, type:'Unpaid', startDate:todayStr(5), endDate:todayStr(7), days:3, reason:'Extended leave', status:'Pending', createdAt: todayStr(0) },
    { id:'LV1007', employeeId: e(1).id, type:'Sick', startDate:todayStr(1), endDate:todayStr(1), days:1, reason:'Medical', status:'Pending', createdAt: todayStr(0) },
    { id:'LV1008', employeeId: e(10).id, type:'Paid', startDate:todayStr(1), endDate:todayStr(4), days:4, reason:'Wedding', status:'Pending', createdAt: todayStr(0) },
    // overlapping engineering leaves to trigger Smart Guard
    { id:'LV1009', employeeId: e(6).id, type:'Paid', startDate:todayStr(1), endDate:todayStr(2), days:2, reason:'Conference', status:'Approved', createdAt: todayStr(-2) },
    { id:'LV1010', employeeId: e(7).id, type:'Paid', startDate:todayStr(1), endDate:todayStr(3), days:3, reason:'Vacation', status:'Approved', createdAt: todayStr(-3) },
    { id:'LV1011', employeeId: e(13).id, type:'Casual', startDate:todayStr(1), endDate:todayStr(1), days:1, reason:'Personal', status:'Approved', createdAt: todayStr(-1) },
  ]
  return leaves
}

export function generatePayroll(employees: Employee[]): PayrollRecord[] {
  return employees.map(e=>({ employeeId:e.id, base:e.salary, bonus: Math.floor(e.salary*0.08), deductions: Math.floor(e.salary*0.12), net: Math.floor(e.salary*0.96), month: new Date().toISOString().slice(0,7) }))
}

// store helpers
const KEY='dayflow_v8'
export function loadSeed(){
  const existing = localStorage.getItem(KEY)
  if(existing){ try{ const d=JSON.parse(existing); if(d.version===8) return d }catch{}}
  // drop old keys to force fresh salary breakdown matching wireframe (Basic 50%, HRA 50% of Basic, etc.)
  ;['dayflow_v7','dayflow_v6','dayflow_v5','dayflow_v4','dayflow_v3','dayflow_v2'].forEach(k=>localStorage.removeItem(k))
  const employees=seededEmployees()
  const attendance=generateAttendance(employees)
  const leaves=generateLeaves(employees)
  const payroll=generatePayroll(employees)
  const data={ employees, attendance, leaves, payroll, version:8 }
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}
export function saveData(data:any){ localStorage.setItem(KEY, JSON.stringify({...data, version:8}))}
export type Seed = ReturnType<typeof loadSeed>
