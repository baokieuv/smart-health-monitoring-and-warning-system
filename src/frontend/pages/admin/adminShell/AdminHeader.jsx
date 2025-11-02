import React, { useState } from 'react'
import './AdminHeader.css'

const AdminHeader = ({ title = "Admin Panel", onSearch }) => {
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchValue)
    }
  }

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <div className="admin-title">
          <h1>{title}</h1>
        </div>
        
        {onSearch && (
          <div className="admin-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                🔍
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}

export default AdminHeader
