import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUserInfo, clearToken, clearUserInfo } from '../../utils/api'
import routers from '../../utils/routers'
import './header.css'

const Header = () => {
  const navigate = useNavigate()
  const userInfo = getUserInfo()
  
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      clearToken()
      clearUserInfo()
      navigate(routers.Login)
    }
  }
  
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <h1>Health Monitor</h1>
          </Link>
        </div>
        <nav className="nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          {userInfo && (
            <>
              {userInfo.role === 'user' && (
                <Link to={routers.ProfilePage(userInfo.id)} className="nav-link">
                  👨‍⚕️ Profile
                </Link>
              )}
              <span className="nav-link user-info">
                {userInfo.role === 'admin' ? '👤' : '👨‍⚕️'} {userInfo.name}
              </span>
              <button onClick={handleLogout} className="nav-link logout-btn">
                🚪 Logout
              </button>
            </>
          )}
          {!userInfo && (
            <Link to={routers.Login} className="nav-link">
              🔑 Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
