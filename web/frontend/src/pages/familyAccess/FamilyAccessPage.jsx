import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import routers from '../../../../frontend/src/utils/routers'
import './FamilyAccessPage.scss'

export default function FamilyAccessPage() {
  const [cccd, setCccd] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Demo data - trong thực tế sẽ gọi API
  const DEMO_FAMILY_ACCESS = [
    {
      cccd: '001234567890',
      secretCode: '123456',
      patientId: '1',
      patientName: 'Nguyễn Văn A',
      relationship: 'Con trai'
    },
    {
      cccd: '001234567891',
      secretCode: '654321',
      patientId: '2',
      patientName: 'Trần Thị B',
      relationship: 'Vợ'
    },
  ]

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

    if (secretCode.length !== 6) {
      setLoading(false)
      setError('Mã bí mật phải có 6 chữ số')
      return
    }

    // Demo: Check credentials
    setTimeout(() => {
      const access = DEMO_FAMILY_ACCESS.find(
        (item) => item.cccd === cccd && item.secretCode === secretCode
      )

      if (access) {
        // Lưu thông tin truy cập tạm thời (không cần token)
        sessionStorage.setItem('familyAccess', JSON.stringify({
          cccd: access.cccd,
          patientId: access.patientId,
          patientName: access.patientName,
          relationship: access.relationship,
          accessTime: new Date().toISOString()
        }))
        
        setLoading(false)
        // Chuyển đến trang thông tin bệnh nhân
        navigate(routers.FamilyPatientDetail(access.patientId))
      } else {
        setLoading(false)
        setError('CCCD hoặc mã bí mật không đúng')
      }
    }, 800)
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
            <small className="input-hint">VD: 001234567890</small>
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
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setSecretCode(value)
              }}
              placeholder="Nhập mã 6 chữ số được cung cấp bởi bệnh viện"
              maxLength={6}
              className="form-input"
            />
            <small className="input-hint">VD: 123456</small>
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
          <div className="note-icon">🔐</div>
          <div className="note-content">
            <strong>Lưu ý bảo mật:</strong>
            <ul>
              <li>Không chia sẻ mã bí mật với người khác</li>
              <li>Liên hệ bệnh viện nếu quên mã hoặc cần hỗ trợ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
