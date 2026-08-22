import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import EmployeeProfile from './pages/EmployeeProfile'

function Protected({children}:{children:ReactNode}){
  const { user, ready } = useAuth()
  const location=useLocation()
  if(!ready) return <LoadingScreen/>
  if(!user) return <Navigate to="/login" replace/>
  if(user.mustChangePassword&&location.pathname!=='/profile') return <Navigate to="/profile" replace/>
  return <Layout>{children}</Layout>
}

function DashboardSwitch(){
  const { user, ready } = useAuth()
  if(!ready) return <LoadingScreen/>
  if(!user) return <Navigate to="/login" replace/>
  return user.role==='employee' ? <EmployeeDashboard/> : <AdminDashboard/>
}

function ManagerOnly({children}:{children:ReactNode}){
  const {user,ready}=useAuth()
  if(!ready) return <LoadingScreen/>
  if(!user) return <Navigate to="/login" replace/>
  if(user.role==='employee') return <Navigate to="/" replace/>
  return <>{children}</>
}

function LoadingScreen(){
  return <div className="min-h-screen grid place-items-center bg-paper"><div className="text-center"><div className="mx-auto w-8 h-8 rounded-full border-2 border-line border-t-ink animate-spin"/><p className="mt-3 text-[12px] text-muted">Connecting to local DayFlow…</p></div></div>
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
          <Route path="/attendance" element={<Protected><Attendance/></Protected>}/>
          <Route path="/leave" element={<Protected><Leave/></Protected>}/>
          <Route path="/time-off" element={<Navigate to="/leave" replace/>}/>
          <Route path="/payroll" element={<Protected><Payroll/></Protected>}/>
          <Route path="/pulse" element={<Protected><ManagerOnly><Pulse/></ManagerOnly></Protected>}/>
          <Route path="/guard" element={<Protected><ManagerOnly><Guard/></ManagerOnly></Protected>}/>
          <Route path="/ai" element={<Protected><Ai/></Protected>}/>
          <Route path="/settings" element={<Protected><ManagerOnly><Settings/></ManagerOnly></Protected>}/>
          <Route path="/profile" element={<Protected><Profile/></Protected>}/>
          <Route path="/my-profile" element={<Protected><EmployeeProfile/></Protected>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
