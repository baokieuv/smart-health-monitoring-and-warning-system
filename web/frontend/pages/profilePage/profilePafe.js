import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './profilePage.scss'

const ProfilePage = () => {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [formData, setFormData] = useState({})
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    // TODO: Fetch current logged-in doctor data from API
    // Temporary mock data
    const mockDoctor = {
      id: 1,
      name: 'BS. Nguyễn Văn Minh',
      dateOfBirth: '1985-05-15',
      department: 'Khoa Nội',
      education: 'Bác sĩ Nội khoa - Đại học Y Hà Nội',
      phone: '0912345678',
      email: 'nguyenvanminh@hospital.com',
      joinDate: '2010-08-01',
      specialization: 'Tim mạch',
      experience: '15 năm'
    }
    setDoctor(mockDoctor)
    setFormData(mockDoctor)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // TODO: Call API to update doctor info
    console.log('Saving doctor info:', formData)
    setDoctor(formData)
    setIsEditing(false)
    alert('Cập nhật thông tin thành công!')
  }

  const handlePasswordUpdate = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới và xác nhận không khớp!')
      return
    }
    if (passwordData.newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!')
      return
    }
    // TODO: Call API to change password
    console.log('Changing password')
    alert('Đổi mật khẩu thành công!')
    setShowPasswordChange(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleCancel = () => {
    setFormData(doctor)
    setIsEditing(false)
  }

  if (!doctor) {
    return <div className="loading">Đang tải thông tin...</div>
  }

  return (
    <div className="profile-page doctor-profile">
      <div className="profile-header">
        <h2>👨‍⚕️ Hồ Sơ Bác Sĩ</h2>
        <div className="header-actions">
          {!isEditing ? (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              ✏️ Chỉnh sửa
            </button>
          ) : (
            <>
              <button className="btn-save" onClick={handleSave}>
                ✓ Lưu
              </button>
              <button className="btn-cancel" onClick={handleCancel}>
                ✗ Hủy
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="doctor-info">
        {/* Personal Info Section */}
        <div className="info-section">
          <h3>📋 Thông tin cá nhân</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Họ và tên:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.name}</span>
              )}
            </div>
            <div className="info-item">
              <label>Ngày sinh:</label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{new Date(doctor.dateOfBirth).toLocaleDateString('vi-VN')}</span>
              )}
            </div>
            <div className="info-item">
              <label>Số điện thoại:</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.phone}</span>
              )}
            </div>
            <div className="info-item">
              <label>Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Work Info Section */}
        <div className="info-section">
          <h3>🏥 Thông tin công việc</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Khoa làm việc:</label>
              {isEditing ? (
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  <option value="Khoa Nội">Khoa Nội</option>
                  <option value="Khoa Ngoại">Khoa Ngoại</option>
                  <option value="Khoa Nhi">Khoa Nhi</option>
                  <option value="Khoa Sản">Khoa Sản</option>
                  <option value="Khoa Chấn thương">Khoa Chấn thương</option>
                  <option value="Khoa Tim mạch">Khoa Tim mạch</option>
                </select>
              ) : (
                <span>{doctor.department}</span>
              )}
            </div>
            <div className="info-item">
              <label>Chuyên môn:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.specialization}</span>
              )}
            </div>
            <div className="info-item full-width">
              <label>Học vấn:</label>
              {isEditing ? (
                <textarea
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  rows="2"
                />
              ) : (
                <span>{doctor.education}</span>
              )}
            </div>
            <div className="info-item">
              <label>Kinh nghiệm:</label>
              <span>{doctor.experience}</span>
            </div>
            <div className="info-item">
              <label>Ngày vào làm:</label>
              <span>{new Date(doctor.joinDate).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="info-section password-section">
          <h3>🔒 Bảo mật</h3>
          {!showPasswordChange ? (
            <button 
              className="btn-change-password"
              onClick={() => setShowPasswordChange(true)}
            >
              Đổi mật khẩu
            </button>
          ) : (
            <div className="password-form">
              <div className="info-item">
                <label>Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div className="info-item">
                <label>Mật khẩu mới:</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>
              <div className="info-item">
                <label>Xác nhận mật khẩu:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <div className="password-actions">
                <button className="btn-save" onClick={handlePasswordUpdate}>
                  Cập nhật mật khẩu
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
