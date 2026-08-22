import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/store'
import Layout from './components/Layout'
import { Login, Signup } from './pages/Auth'
import Employees from './pages/Employees'
import EmployeeProfile from './pages/EmployeeProfile'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import Payroll from './pages/Payroll'
import Pulse from './pages/Pulse'
import Ai from './pages/Ai'
import Settings from './pages/Settings'
import { AdminDashboard, EmployeeDashboard } from './pages/Dashboard'

function Protected({children}:{children:ReactNode}){
  const { user } = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  return <Layout>{children}</Layout>
}
function DashboardSwitch(){
  const { user } = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  return user.role==='admin' ? <AdminDashboard/> : <EmployeeDashboard/>
}

export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/" element={<Protected><DashboardSwitch/></Protected>}/>
          <Route path="/employees" element={<Protected><Employees/></Protected>}/>
          <Route path="/employees/:id" element={<Protected><EmployeeProfile/></Protected>}/>
          <Route path="/profile" element={<Protected><EmployeeProfile/></Protected>}/>
          <Route path="/my-profile" element={<Protected><EmployeeProfile/></Protected>}/>
          <Route path="/attendance" element={<Protected><Attendance/></Protected>}/>
          <Route path="/leave" element={<Protected><Leave/></Protected>}/>
          <Route path="/time-off" element={<Protected><Leave/></Protected>}/>
          <Route path="/payroll" element={<Protected><Payroll/></Protected>}/>
          <Route path="/pulse" element={<Protected><Pulse/></Protected>}/>
          <Route path="/ai" element={<Protected><Ai/></Protected>}/>
          <Route path="/settings" element={<Protected><Settings/></Protected>}/>
          <Route path="*" element={<Navigate to="/employees" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
