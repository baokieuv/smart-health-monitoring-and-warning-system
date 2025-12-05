import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  const location = useLocation()
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
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
        </Link>
        <Link 
          to="/rooms" 
          className={`sidebar-item ${isActive('/rooms') ? 'active' : ''}`}
        >
          <span className="icon">🏥</span>
          <span className="label">Rooms (Coming soon)</span>
        </Link>
        
        <Link 
          to="/notes" 
          className={`sidebar-item ${isActive('/notes') ? 'active' : ''}`}
        >
          <span className="icon">📝</span>
          <span className="label">Notes (Coming soon)</span>
        </Link>
      </nav>
    </aside>
  )
}
