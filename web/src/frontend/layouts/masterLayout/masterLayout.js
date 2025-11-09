import React from 'react'
import Header from '../header/header'
import Footer from '../footer/footer'
import './masterLayout.scss'

const MasterLayout = ({ children }) => {
  return (
    <div className="master-layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default MasterLayout
