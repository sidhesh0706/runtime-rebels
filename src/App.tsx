import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/store'
import Layout from './components/Layout'
import { Login, Signup } from './pages/Auth'
import { AdminDashboard, EmployeeDashboard } from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import Payroll from './pages/Payroll'
import Pulse from './pages/Pulse'
import Guard from './pages/Guard'
import Ai from './pages/Ai'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

function Protected({children}:{children:ReactNode}){
  const { user } = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  return <Layout>{children}</Layout>
}

function DashboardSwitch(){
  const { user } = useAuth()
  if(!user) return <Navigate to="/login" replace/>
  return user.role==='employee' ? <EmployeeDashboard/> : <AdminDashboard/>
}

function ManagerOnly({children}:{children:ReactNode}){
  const {user}=useAuth()
  if(!user) return <Navigate to="/login" replace/>
  if(user.role==='employee') return <Navigate to="/" replace/>
  return <>{children}</>
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
          <Route path="/attendance" element={<Protected><Attendance/></Protected>}/>
          <Route path="/leave" element={<Protected><Leave/></Protected>}/>
          <Route path="/payroll" element={<Protected><Payroll/></Protected>}/>
          <Route path="/pulse" element={<Protected><ManagerOnly><Pulse/></ManagerOnly></Protected>}/>
          <Route path="/guard" element={<Protected><ManagerOnly><Guard/></ManagerOnly></Protected>}/>
          <Route path="/ai" element={<Protected><Ai/></Protected>}/>
          <Route path="/settings" element={<Protected><ManagerOnly><Settings/></ManagerOnly></Protected>}/>
          <Route path="/profile" element={<Protected><Profile/></Protected>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
