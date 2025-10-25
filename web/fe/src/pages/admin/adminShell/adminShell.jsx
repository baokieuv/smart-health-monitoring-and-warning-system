import React from 'react'
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import routers from '../../../utils/routers'
import { clearToken, getToken } from '../../../utils/api'
import MasterLayout from '../../../layouts/masterLayout/masterLayout.jsx'
import '../../../layouts/masterLayout/masterLayout.scss'

// Admin-specific shell moved under pages/, since layouts/ should contain shared system-wide components only.
const SidebarItem = ({ icon, label, to, onClick }) => {
  if (onClick && !to) {
    return (
      <button type="button" onClick={onClick} className="sidebar-item" style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
        <span className="icon material-symbols-outlined" aria-hidden>{icon}</span>
        <span className="label">{label}</span>
      </button>
    )
  }
  return (
    <Link to={to || '#'} className="sidebar-item">
      <span className="icon material-symbols-outlined" aria-hidden>{icon}</span>
      <span className="label">{label}</span>
    </Link>
  )
}

export default function AdminShell() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const logout = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    clearToken()
    navigate(routers.AdminLogin, { replace: true })
  }

  const onHeaderSearch = (q) => {
    const next = new URLSearchParams(params)
    if (!q) next.delete('search')
    else next.set('search', q)
    next.set('page', '1')
    setParams(next, { replace: true })
  }

  const sidebar = (
    <>
      <nav>
        <SidebarItem icon="info" label="Thông tin" to={routers.AdminDoctors} />
        <SidebarItem icon="list" label="Danh sách" to={routers.AdminDoctors} />
        <SidebarItem icon="work" label="Công việc" to="#" />
        <SidebarItem icon="sticky_note_2" label="Ghi chú" to="#" />
        {getToken() && (
          <SidebarItem icon="logout" label="Đăng xuất" onClick={logout} />
        )}
      </nav>
    </>
  )

  return (
    <MasterLayout title="Bệnh viện A" sidebar={sidebar} onSearch={onHeaderSearch} />
  )
}
