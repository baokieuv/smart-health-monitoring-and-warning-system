import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../header/header.jsx'
import Footer from '../footer/footer.jsx'
import './masterLayout.scss'

export default function MasterLayout({ title, onSearch, sidebar }) {
  return (
    <div className="master-shell">
      <Header title={title} onSearch={onSearch} />
      <div className="body">
        {sidebar && <aside className="sidebar">{sidebar}</aside>}
        <main className="content">
          <div className="page-wrap">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
