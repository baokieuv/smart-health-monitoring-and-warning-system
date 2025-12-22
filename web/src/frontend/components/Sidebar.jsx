import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { useSocket } from '../contexts/SocketContext';
import { getUserInfo, clearToken, clearUserInfo, getCurrentDoctorInfo } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import routers from '../utils/routers'



export default function Sidebar() {
  const location = useLocation();
  const { unreadCount } = useSocket();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navigate = useNavigate()
  const handleLogout = () => {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        clearToken()
        clearUserInfo()
        navigate(routers.Login)
      }
    }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>🏥 Menu</h3>
      </div>
      <nav className="sidebar-nav">
        <Link 
          to="/patients" 
          className={`sidebar-item ${isActive('/patients') ? 'active' : ''}`}
        >
          <span className="icon">👥</span>
          <span className="label">Patients List</span>
        </Link>
        <Link 
          to="/alerts" 
          className={`sidebar-item ${isActive('/alerts') ? 'active' : ''}`}
        >
          <span className="icon">🚨</span>
          <span className="label">Alerts</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </Link>
        <Link 
          to="/rooms" 
          className={`sidebar-item ${isActive('/rooms') ? 'active' : ''}`}
        >
          <span className="icon">🏥</span>
          <span className="label">Rooms (Coming soon)</span>
        </Link>
        
        <button 
          onClick={handleLogout} 
          className="sidebar-item logout-btn"
        >
          <span className="icon">🚪</span>
          <span className="label">Logout</span>
        </button>
      </nav>
    </aside>
  );
}
