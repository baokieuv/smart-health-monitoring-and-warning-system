import React from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AdminShell from './pages/admin/adminShell/adminShell'
import LoginPage from './pages/admin/LoginPage'
import DoctorList from './pages/admin/doctors/DoctorList'
import DoctorForm from './pages/admin/doctors/DoctorForm'
import routers from './utils/routers'
import { getToken } from './utils/api'

const Protected = () => {
  const token = getToken()
  return token ? <Outlet /> : <Navigate to={routers.AdminLogin} replace />
}

export default function App() {
  const hasToken = !!getToken()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={hasToken ? routers.AdminDoctors : routers.AdminLogin} replace />} />

        <Route path={routers.AdminLogin} element={<LoginPage />} />

        <Route element={<Protected />}>
          <Route element={<AdminShell />}>
            <Route path={routers.AdminDoctors} element={<DoctorList />} />
            <Route path={routers.AdminDoctorCreate} element={<DoctorForm />} />
            <Route path={routers.AdminDoctorDetail()} element={<DoctorForm />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={routers.AdminDoctors} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
