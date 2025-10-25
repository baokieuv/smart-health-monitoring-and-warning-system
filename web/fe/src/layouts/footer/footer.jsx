import React from 'react'
import './footer.scss'

export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Smart Health</span>
    </footer>
  )
}
