import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, setToken } from '../../utils/api'
import routers from '../../utils/routers'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const DEMO_USER = {
    username: 'admin',
    password: '1',
    role: 'admin',
    name: 'Demo Admin',
  }

  const makeFakeJwt = (payload) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = btoa(JSON.stringify(payload))
    const sig = 'demo-signature'
    return `${header}.${body}.${sig}`
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Demo hard-coded login (no backend required)
      if (username === DEMO_USER.username && password === DEMO_USER.password) {
        const token = makeFakeJwt({
          sub: '1',
          name: DEMO_USER.name,
          role: DEMO_USER.role,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        })
        setToken(token)
        navigate(routers.AdminDoctors)
        return
      }

      const res = await login({ username, password })
      if (res?.status === 'success' && res?.access_token) {
        setToken(res.access_token)
        navigate(routers.AdminDoctors)
      } else {
        setError(res?.message || 'Đăng nhập thất bại')
      }
    } catch (err) {
      if (err?.response?.status === 429) {
        const sec = err.rateLimit?.retryAfter || 30
        setError(`Quá nhiều lần đăng nhập. Vui lòng thử lại sau ${sec} giây.`)
      } else {
        setError(err?.response?.data?.message || 'Đăng nhập thất bại')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#f5f5f5' }}>
      <form className="login-card" onSubmit={onSubmit} style={{ width: 380, padding: 30, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, color: '#667eea', textAlign: 'center' }}>🏥 Admin Login</h2>
        <div className="field" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Tên đăng nhập</label>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="admin"
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
        <div style={{ color: '#999', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
          Demo: {DEMO_USER.username} / {DEMO_USER.password}
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
