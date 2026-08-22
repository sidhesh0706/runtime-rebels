export type Role = 'admin' | 'hr' | 'employee'
export type Dept = 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'Human Resources' | 'Finance'
export type LeaveType = 'Paid' | 'Sick' | 'Unpaid'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'
export type AttStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave' | 'Late'

export interface Employee {
  id: string
  loginId?: string
  name: string
  email: string
  company?: string
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
  jobLove?: string
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
  attachmentKey?: string
  attachmentUrl?: string
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
