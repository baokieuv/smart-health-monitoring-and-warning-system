import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPatientList } from '../utils/api'
import './homePage.scss'

const HomePage = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    patients: 0,
    alerts: 0,
    notes: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await getPatientList({ page: 1, limit: 10 })
      console.log('HomePage stats response:', res)
      if (res?.status === 'success' && res?.data) {
        console.log('Total patients:', res.data.total)
        setStats(prev => ({
          ...prev,
          patients: res.data.total || 0
        }))
      }
    } catch (e) {
      console.error('Load stats error:', e)
    }
  }

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
          <div className="stat-number">{stats.patients}</div>
          <div className="stat-label">Patients being monitored</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.alerts}</div>
          <div className="stat-label">Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.notes}</div>
          <div className="stat-label">Notes</div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
