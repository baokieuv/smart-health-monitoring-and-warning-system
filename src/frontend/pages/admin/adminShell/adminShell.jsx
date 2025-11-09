import React from 'react'
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import routers from '../../../utils/routers'
import { clearToken, clearUserInfo, getToken } from '../../../utils/api'
import AdminHeader from './AdminHeader'
import Footer from '../../../layouts/footer/footer'
import './adminShell.scss'

const SidebarItem = ({ icon, label, to, onClick }) => {
  if (onClick && !to) {
    return (
      <button 
        type="button" 
        onClick={onClick} 
        className="sidebar-item" 
        style={{ 
          background: 'transparent', 
          border: 'none', 
          textAlign: 'left', 
          width: '100%', 
          cursor: 'pointer',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span>{label}</span>
      </button>
    )
  }
  return (
    <Link to={to || '#'} className="sidebar-item">
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

export default function AdminShell() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  
  const logout = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      clearToken()
      clearUserInfo()
      navigate(routers.Login, { replace: true })
    }
  }

  const onHeaderSearch = (q) => {
    const next = new URLSearchParams(params)
    if (!q) next.delete('search')
    else next.set('search', q)
    next.set('page', '1')
    setParams(next, { replace: true })
  }

  return (
    <div className="admin-shell">
      <AdminHeader title="🏥 Hospital A - Admin Panel" onSearch={onHeaderSearch} />
      
      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav>
            <SidebarItem icon="ℹ️" label="Information" to={routers.AdminInfo} />
            <SidebarItem icon="👨‍⚕️" label="Doctors List" to={routers.AdminDoctors} />
            <SidebarItem icon="🏥" label="Rooms List" to={routers.AdminRooms} />
            <SidebarItem icon="💼" label="Jobs" to="#" />
            <SidebarItem icon="📝" label="Notes" to="#" />
            {getToken() && (
              <SidebarItem icon="🚪" label="Logout" onClick={logout} />
            )}
          </nav>
        </aside>
        
        <main className="admin-content">
          <div className="page-wrap">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}
