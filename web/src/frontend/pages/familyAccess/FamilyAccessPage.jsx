import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { familyAuthenticate } from '../../utils/api'
import routers from '../../utils/routers'
import './FamilyAccessPage.scss'

export default function FamilyAccessPage() {
  const [cccd, setCccd] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate input
    if (!cccd || !secretCode) {
      setLoading(false)
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (cccd.length !== 12) {
      setLoading(false)
      setError('CCCD phải có 12 chữ số')
      return
    }

    if (secretCode.length !== 10) {
      setLoading(false)
      setError('Mã bí mật phải là số điện thoại 10 số')
      return
    }

    try {
      const response = await familyAuthenticate({ cccd, secretCode })
      
      if (response.status === 'success') {
        // Lưu JWT tokens (giống như đăng nhập bình thường) - USE CORRECT KEYS
        localStorage.setItem('access_token', response.data.accessToken)
        localStorage.setItem('refresh_token', response.data.refreshToken)
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
        
        setLoading(false)
        // Chuyển đến trang PatientDetail
        navigate(`/patients/${response.data.patientId}`)
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setLoading(false)
      const errorMsg = err?.response?.data?.message || 'CCCD hoặc mã bí mật không đúng'
      setError(errorMsg)
    }
  }

  const handleBackToLogin = () => {
    navigate(routers.Login)
  }

  return (
    <div className="family-access-container">
      <div className="family-access-card">
        <div className="family-access-header">
          <h2>👨‍👩‍👧‍👦 Truy cập thông tin bệnh nhân</h2>
          <p className="subtitle">Dành cho người nhà bệnh nhân</p>
        </div>

        <form onSubmit={handleSubmit} className="family-access-form">
          <div className="form-group">
            <label htmlFor="cccd">
              <span className="label-icon">🆔</span>
              Số CCCD
            </label>
            <input
              id="cccd"
              type="text"
              value={cccd}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                setCccd(value)
              }}
              placeholder="Nhập 12 chữ số CCCD"
              maxLength={12}
              className="form-input"
            />
            <small className="input-hint">VD: 038423841921</small>
          </div>

          <div className="form-group">
            <label htmlFor="secretCode">
              <span className="label-icon">🔒</span>
              Mã bí mật
            </label>
            <input
              id="secretCode"
              type="password"
              value={secretCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                setSecretCode(value)
              }}
              placeholder="Nhập số điện thoại bệnh nhân (10 chữ số)"
              maxLength={10}
              className="form-input"
            />
            <small className="input-hint">VD: 0438472182</small>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? '⏳ Đang xác thực...' : '🔍 Xem thông tin bệnh nhân'}
          </button>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="back-button"
          >
            ← Quay lại trang đăng nhập
          </button>
        </form>

        <div className="security-note">
          {/* <div className="note-icon">🔐</div> */}
          {/* <div className="note-content">
            <strong>Lưu ý bảo mật:</strong>
            <ul>
              <li>Không chia sẻ mã bí mật với người khác</li>
            </ul>
          </div> */}
        </div>
      </div>
    </div>
  )
}
