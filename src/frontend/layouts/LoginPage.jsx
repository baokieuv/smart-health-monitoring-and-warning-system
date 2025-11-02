import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken, setUserInfo } from '../utils/api'
import routers from '../utils/routers'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const DEMO_ACCOUNTS = [
    {
      username: 'admin',
      password: '1',
      role: 'admin',
      name: 'Admin Nguyễn Văn A',
      id: '1',
    },
    {
      username: 'user',
      password: '1',
      role: 'user',
      name: 'BS. Trần Thị B',
      id: '2',
    },
  ]

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const demoUser = DEMO_ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    )
    
    if (demoUser) {
     
      const token = `demo-token-${demoUser.id}`
      
      const userInfo = {
        id: demoUser.id,
        name: demoUser.name,
        role: demoUser.role,
        username: demoUser.username,
      }
      
      // Lưu vào localStorage
      setToken(token)
      setUserInfo(userInfo)
      
      setTimeout(() => {
        setLoading(false)
        // Route based on role
        if (demoUser.role === 'admin') {
          navigate(routers.AdminInfo)
        } else {
          navigate(routers.Home)
        }
      }, 500)
    } else {
      // Sai username hoặc password
      setTimeout(() => {
        setLoading(false)
        setError('Tên đăng nhập hoặc mật khẩu không đúng')
      }, 500)
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#f5f5f5' }}>
      <form className="login-card" onSubmit={onSubmit} style={{ width: 380, padding: 30, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, color: '#667eea', textAlign: 'center' }}>🏥 Đăng nhập hệ thống</h2>
        <div className="field" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Tên đăng nhập</label>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Nhập tên đăng nhập"
            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
          />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Mật khẩu</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••"
            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
          />
        </div>
        <div style={{ color: '#999', fontSize: 12, marginBottom: 12, padding: 10, background: '#f9f9f9', borderRadius: 6 }}>
          <div style={{ marginBottom: 4 }}><strong>Demo accounts:</strong></div>
          <div>👤 Admin: admin / 1</div>
          <div>👨‍⚕️ User (Bác sĩ): user / 1</div>
        </div>
        {error && (
          <div style={{ color: '#e5484d', marginBottom: 12, fontSize: 13, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button 
          className="btn" 
          disabled={loading} 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: 12, 
            background: '#667eea', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}
