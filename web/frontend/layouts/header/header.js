import React from 'react'
import { Link } from 'react-router-dom'
import './header.css'

const Header = () => {
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
          <Link to="/profile" className="nav-link">👨‍⚕️ Profile</Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
