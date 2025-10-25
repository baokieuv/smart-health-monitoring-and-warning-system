import React from 'react'
import './header.scss'

export default function Header({ title = 'Bệnh viện A', onSearch }) {
  return (
    <div className="topbar">
      <div className="brand">{title}</div>
      {onSearch && (
        <input
          className="search"
          placeholder="Tìm kiếm"
          onChange={(e) => onSearch(e.target.value)}
        />
      )}
      <div className="actions">
        <span className="material-symbols-outlined" aria-hidden title="Thông báo">notifications</span>
      </div>
    </div>
  )
}
