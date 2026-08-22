export type Role = 'admin' | 'hr' | 'employee'
export type Dept = 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'Human Resources' | 'Finance'
export type LeaveType = 'Paid' | 'Sick' | 'Unpaid'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'
export type AttStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave' | 'Late'

export interface Employee {
  id: string
  name: string
  email: string
  department: Dept
  role: string
  avatar: string
  salary: number
  joinDate: string
  phone: string
  status: 'Active' | 'On Leave' | 'Absent'
  manager?: string
  location?: string
  address?: string
  about?: string
  interests?: string
  skills?: string[]
  certifications?: string[]
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  status: AttStatus
  checkIn?: string
  checkOut?: string
  hours?: number
  extraHours?: number
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
  reviewedAt?: string
  reviewComment?: string
  attachmentName?: string
}

export interface PayrollRecord {
  employeeId: string
  base: number
  bonus: number
  deductions: number
  net: number
  month: string
  hra?: number
  standardAllowance?: number
  performanceBonus?: number
  lta?: number
  fixedAllowance?: number
  pfEmployee?: number
  pfEmployer?: number
  professionalTax?: number
  payableDays?: number
  workingDays?: number
}

export const DEPARTMENTS: Dept[] = ['Engineering','Design','Marketing','Sales','Human Resources','Finance']

const names = [
  ["Aarav Mehta","Engineering","Senior Engineer"],["Isha Patel","Engineering","Frontend Lead"],["Rohan Gupta","Engineering","Backend Engineer"],["Ananya Singh","Engineering","QA Engineer"],
  ["Kabir Khan","Engineering","DevOps Engineer"],["Priya Nair","Engineering","Fullstack Engineer"],["Vikram Rao","Engineering","Staff Engineer"],["Sneha Verma","Engineering","Mobile Engineer"],
  ["Arjun Desai","Design","Product Designer"],["Maya Sharma","Design","UX Lead"],["Nikhil Joshi","Design","Visual Designer"],["Kavya Reddy","Design","Design Manager"],
  ["Aditya Kumar","Marketing","Growth Lead"],["Sara Ali","Marketing","Content Strategist"],["Rahul Bansal","Marketing","Performance Marketer"],["Neha Kapoor","Marketing","Brand Manager"],
  ["Amit Trivedi","Sales","Account Executive"],["Pooja Agarwal","Sales","Sales Manager"],["Siddharth Malhotra","Sales","SDR"],["Divya Bhatt","Sales","Customer Success"],
  ["Harshit Jain","Finance","Finance Analyst"],["Tanvi Shah","Finance","Controller"],["Mohit Yadav","Finance","Accountant"],["Shriya Das","Finance","FP&A Lead"],
  ["Deepak Menon","Human Resources","HR Manager"],["Anjali Pillai","Human Resources","Talent Lead"],["Rajeev Kumar","Engineering","Data Engineer"],["Olivia Chen","Engineering","Data Scientist"],
  ["Ethan Brown","Engineering","Infra Engineer"],["Zara Khan","Design","UX Researcher"],["Liam Smith","Marketing","SEO Lead"],["Noah Wilson","Sales","Enterprise AE"],
  ["Ava Johnson","Finance","Treasury"],["Isabella Lee","Engineering","Security Engineer"],["Mason Davis","Engineering","Backend Engineer"],["Sophia Miller","Design","Illustrator"],
  ["James Anderson","Marketing","Social Lead"],["Charlotte Thomas","Sales","Renewals"],["Amelia White","Engineering","QA Lead"],["Benjamin Harris","Finance","Payroll Specialist"],
  ["Evelyn Clark","Human Resources","HR Ops"],["Harper Lewis","Engineering","Mobile Lead"],["Elijah Walker","Design","Motion Designer"],["Abigail Hall","Sales","AE"],
]

function seededEmployees(): Employee[] {
  return names.map(([name, dept, role], i) => ({
    id: `EMP${String(1001+i).padStart(4,'0')}`,
    name: name as string,
    email: `${(name as string).toLowerCase().replace(/ /g,'.') }@dayflow.co`,
    department: dept as Dept,
    role: role as string,
    avatar: `https://i.pravatar.cc/150?img=${(i%70)+1}`,
    salary: 55000 + Math.floor(Math.random()*120000),
    joinDate: new Date(2020 + Math.floor(Math.random()*4), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1).toISOString().slice(0,10),
    phone: `+91 ${Math.floor(9000000000 + Math.random()*999999999)}`,
    status: 'Active',
    manager: i < 8 ? 'Vikram Rao' : 'Aarav Sharma',
    location: i % 3 === 0 ? 'Bengaluru' : 'Hybrid',
    address: 'Bengaluru, Karnataka',
    about: 'Focused on building thoughtful systems and helping the team do its best work.',
    interests: 'Learning, team culture, and solving meaningful problems.',
    skills: i % 2 ? ['Collaboration','Planning'] : ['Leadership','Problem solving'],
    certifications: i % 3 === 0 ? ['Workplace Essentials'] : [],
  }))
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
  const leaves: LeaveRequest[] = [
    { id:'LV1001', employeeId: employees[2].id, type:'Paid', startDate:todayStr(1), endDate:todayStr(3), days:3, reason:'Family function', status:'Pending', createdAt: todayStr(-1) },
    { id:'LV1002', employeeId: employees[5].id, type:'Sick', startDate:todayStr(0), endDate:todayStr(1), days:2, reason:'Fever', status:'Pending', createdAt: todayStr(-1) },
    { id:'LV1003', employeeId: employees[8].id, type:'Paid', startDate:todayStr(2), endDate:todayStr(2), days:1, reason:'Personal work', status:'Pending', createdAt: todayStr(0) },
    { id:'LV1004', employeeId: employees[0].id, type:'Paid', startDate:todayStr(-5), endDate:todayStr(-3), days:3, reason:'Vacation', status:'Approved', createdAt: todayStr(-7) },
    { id:'LV1005', employeeId: employees[12].id, type:'Paid', startDate:todayStr(-2), endDate:todayStr(-1), days:2, reason:'Travel', status:'Approved', createdAt: todayStr(-4) },
    { id:'LV1006', employeeId: employees[15].id, type:'Unpaid', startDate:todayStr(5), endDate:todayStr(7), days:3, reason:'Extended leave', status:'Pending', createdAt: todayStr(0) },
    { id:'LV1007', employeeId: employees[1].id, type:'Sick', startDate:todayStr(1), endDate:todayStr(1), days:1, reason:'Medical', status:'Pending', createdAt: todayStr(0) },
    { id:'LV1008', employeeId: employees[22].id, type:'Paid', startDate:todayStr(1), endDate:todayStr(4), days:4, reason:'Wedding', status:'Pending', createdAt: todayStr(0) },
    // overlapping engineering leaves to trigger Smart Guard
    { id:'LV1009', employeeId: employees[6].id, type:'Paid', startDate:todayStr(1), endDate:todayStr(2), days:2, reason:'Conference', status:'Approved', createdAt: todayStr(-2) },
    { id:'LV1010', employeeId: employees[7].id, type:'Paid', startDate:todayStr(1), endDate:todayStr(3), days:3, reason:'Vacation', status:'Approved', createdAt: todayStr(-3) },
    { id:'LV1011', employeeId: employees[21].id, type:'Paid', startDate:todayStr(1), endDate:todayStr(1), days:1, reason:'Personal', status:'Approved', createdAt: todayStr(-1) },
  ]
  return leaves
}

export function calculatePayroll(employeeId:string, wage:number): PayrollRecord {
  const base=Math.round(wage*.5)
  const hra=Math.round(base*.5)
  const standardAllowance=4167
  const performanceBonus=Math.round(wage*.0833)
  const lta=Math.round(wage*.0833)
  const fixedAllowance=Math.max(0,wage-base-hra-standardAllowance-performanceBonus-lta)
  const pfEmployee=Math.round(base*.12)
  const pfEmployer=Math.round(base*.12)
  const professionalTax=200
  const deductions=pfEmployee+professionalTax
  return { employeeId, base, bonus:performanceBonus, deductions, net:wage-deductions, month:new Date().toISOString().slice(0,7), hra, standardAllowance, performanceBonus, lta, fixedAllowance, pfEmployee, pfEmployer, professionalTax, payableDays:22, workingDays:22 }
}

export function generatePayroll(employees: Employee[]): PayrollRecord[] {
  return employees.map(e=>calculatePayroll(e.id,e.salary))
}

// store helpers
const KEY='dayflow_v2'
export function loadSeed(){
  const existing = localStorage.getItem(KEY)
  if(existing){ try{ return JSON.parse(existing)}catch{}}
  const employees=seededEmployees()
  const attendance=generateAttendance(employees)
  const leaves=generateLeaves(employees)
  const payroll=generatePayroll(employees)
  const data={ employees, attendance, leaves, payroll, version:2 }
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}
export function saveData(data:any){ localStorage.setItem(KEY, JSON.stringify(data))}
export type Seed = ReturnType<typeof loadSeed>
