import React from 'react'
import { useNavigate } from 'react-router-dom'
import './homePage.scss'

const HomePage = () => {
  const navigate = useNavigate()

  const features = [
    {
      id: 1,
      title: '👥 Patients List',
      description: 'Monitor and track the health status of all patients',
      path: '/patients',
      icon: '👥',
      color: '#4CAF50'
    },
    {
      id: 2,
      title: '🚨 Current Alerts',
      description: 'View alerts and emergency notifications regarding patient conditions',
      path: '/alerts',
      icon: '🚨',
      color: '#FF9800'
    },
    {
      id: 3,
      title: '📝 Medical Notes',
      description: 'Manage notes, medical history, and patient records',
      path: '/notes',
      icon: '📝',
      color: '#2196F3'
    }
  ]

  const handleNavigate = (path) => {
    navigate(path)
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>🏥 Smart Health Monitoring System</h1>
        <p className="subtitle">Manage and monitor patients's health in real time</p>
      </div>

      <div className="features-grid">
        {features.map((feature) => (
          <div 
            key={feature.id} 
            className="feature-card"
            onClick={() => handleNavigate(feature.path)}
            style={{ borderTopColor: feature.color }}
          >
            <div className="feature-icon" style={{ color: feature.color }}>
              {feature.icon}
            </div>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
            <button className="feature-button" style={{ backgroundColor: feature.color }}>
              Access →
            </button>
          </div>
        ))}
      </div>

      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-number">10</div>
          <div className="stat-label">Patients being monitored</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">7</div>
          <div className="stat-label">Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">20</div>
          <div className="stat-label">Notes</div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
