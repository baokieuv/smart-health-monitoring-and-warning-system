import React from 'react'
import { useNavigate } from 'react-router-dom'
import './homePage.scss'

const HomePage = () => {
  const navigate = useNavigate()

  const features = [
    {
      id: 1,
      title: '👥 Danh sách bệnh nhân',
      description: 'Theo dõi và giám sát tình trạng sức khỏe của tất cả bệnh nhân',
      path: '/patients',
      icon: '👥',
      color: '#4CAF50'
    },
    {
      id: 2,
      title: '🚨 Cảnh báo',
      description: 'Xem các cảnh báo và thông báo khẩn cấp về tình trạng bệnh nhân',
      path: '/alerts',
      icon: '🚨',
      color: '#FF9800'
    },
    {
      id: 3,
      title: '📝 Ghi chú',
      description: 'Quản lý ghi chú, lịch sử điều trị và hồ sơ bệnh án',
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
        <h1>🏥 Hệ thống giám sát sức khỏe thông minh</h1>
        <p className="subtitle">Quản lý và theo dõi tình trạng sức khỏe bệnh nhân theo thời gian thực</p>
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
              Truy cập →
            </button>
          </div>
        ))}
      </div>

      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-number">24</div>
          <div className="stat-label">Bệnh nhân đang theo dõi</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">3</div>
          <div className="stat-label">Cảnh báo hiện tại</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">157</div>
          <div className="stat-label">Ghi chú y tế</div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
