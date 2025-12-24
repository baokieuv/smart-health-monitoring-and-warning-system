import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUserInfo, clearToken, clearUserInfo, getCurrentDoctorInfo } from '../../../../frontend/src/utils/api'
import routers from '../../../../frontend/src/utils/routers'
import './header.css'

const Header = () => {
  const navigate = useNavigate()
  const userInfo = getUserInfo()
  const [doctorName, setDoctorName] = useState('')
  
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (userInfo?.role === 'doctor') {
        try {
          const response = await getCurrentDoctorInfo()
          if (response?.status === 'success' && response?.data) {
            setDoctorName(response.data.full_name)
          }
        } catch (error) {
          console.error('Failed to fetch doctor info:', error)
          setDoctorName(userInfo.username)
        }
      }
    }
    fetchDoctorInfo()
  }, [userInfo])
  
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
              {userInfo.role === 'doctor' && (
                <Link to={routers.ProfilePage(userInfo.id)} className="user-info">
                  👨‍⚕️ {doctorName || userInfo.username || 'Doctor'}
                </Link>
              )}
              {/* {userInfo.role !== 'doctor' && (
                <span className="nav-link user-info">
                  {userInfo.role === 'admin' ? '👤' : '👨‍⚕️'} {userInfo.username || userInfo.name}
                </span>
              )} */}
              {/* <button onClick={handleLogout} className="nav-link logout-btn">
                🚪 Logout
              </button> */}
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
