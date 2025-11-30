import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken, setRefreshToken, setUserInfo, login } from '../utils/api'
import routers from '../utils/routers'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }
    
    setLoading(true)
    
    try {
      // Call real API
      const response = await login({
        username: username.trim(),
        password: password
      })
      
      console.log('Login response:', response)
      
      if (response.status === 'success' && response.data) {
        const { user, access_token, refresh_token } = response.data
        
        // Lưu tokens và user info vào localStorage
        setToken(access_token)
        setRefreshToken(refresh_token)
        
        const userInfo = {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.full_name || user.username
        }
        
        setUserInfo(userInfo)
        
        // Route based on role
        if (user.role === 'admin') {
          navigate(routers.AdminInfo, { replace: true })
        } else {
          // doctor or any other role
          navigate(routers.Home, { replace: true })
        }
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.')
      }
    } catch (err) {
      console.error('Login error:', err)
      
      // Handle different error types
      if (err.response) {
        const status = err.response.status
        const message = err.response.data?.message
        
        if (status === 401) {
          setError('Tên đăng nhập hoặc mật khẩu không đúng')
        } else if (status === 400) {
          setError(message || 'Thông tin đăng nhập không hợp lệ')
        } else if (status === 500) {
          setError('Lỗi hệ thống. Vui lòng thử lại sau.')
        } else {
          setError(message || 'Đăng nhập thất bại. Vui lòng thử lại.')
        }
      } else if (err.request) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối.')
      } else {
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
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
          <div style={{ marginBottom: 4 }}><strong>Tài khoản test:</strong></div>
          <div>👤 Admin: <code>admin</code> / <code>admin123</code></div>
          <div>👨‍⚕️ Bác sĩ 1: <code>doctor01</code> / <code>1234</code></div>
          <div>👨‍⚕️ Bác sĩ 2: <code>doctor02</code> / <code>1234</code></div>
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
        
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #e0e0e0' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>
            Bạn là người nhà bệnh nhân?
          </p>
          <button
            type="button"
            onClick={() => navigate(routers.FamilyAccess)}
            style={{
              width: '100%',
              padding: 12,
              background: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#667eea'
              e.target.style.color = '#fff'
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent'
              e.target.style.color = '#667eea'
            }}
          >
            Truy cập thông tin bệnh nhân
          </button>
        </div>
      </form>
    </div>
  )
}
