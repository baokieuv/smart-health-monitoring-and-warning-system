import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getDoctorProfile, updateDoctorProfile} from '../../utils/api'
import './profilePage.scss'

const ProfilePage = () => {
  const { userId } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [formData, setFormData] = useState({})
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        // First, get doctor by userId to find the doctor_id
        const response = await getDoctorProfile(userId)
        setDoctor(response.doctor)
        setFormData(response.doctor)
      } catch (err) {
        console.error('Error fetching doctor profile:', err)
        setError('Không thể tải thông tin profile. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    
    if (userId) {
      fetchDoctorProfile()
    }
  }, [userId])

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

  const handleSave = async () => {
    try {
      // Prepare update payload with only changed fields
      const updatePayload = {}
      const fieldsToCheck = ['full_name', 'email', 'birthday', 'address', 'phone', 'specialization']
      
      fieldsToCheck.forEach(field => {
        if (formData[field] !== doctor[field]) {
          updatePayload[field] = formData[field]
        }
      })
      
      if (Object.keys(updatePayload).length === 0) {
        alert('Không có thay đổi nào để lưu.')
        setIsEditing(false)
        return
      }
      
      // Use doctor._id (doctor_id) instead of userId
      const response = await updateDoctorProfile(doctor._id, updatePayload)
      setDoctor(response.doctor)
      setFormData(response.doctor)
      setIsEditing(false)
      alert('Cập nhật thông tin thành công!')
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Lỗi khi cập nhật thông tin. Vui lòng thử lại.')
    }
  }

  const handlePasswordUpdate = () => {
    if (passwordData.new_password !== passwordData.confirmPassword) {
      alert('Mật khẩu mới không khớp!')
      return
    }
    if (passwordData.new_password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!')
      return
    }
    
    // TODO: Implement change password API later
    console.log('Change password will be implemented later', {
      doctorId: doctor._id,
      current_password: passwordData.current_password,
      new_password: passwordData.new_password
    })
    alert('Chức năng đổi mật khẩu sẽ được cập nhật sau!')
    setShowPasswordChange(false)
    setPasswordData({
      current_password: '',
      new_password: '',
      confirmPassword: ''
    })
  }

  const handleCancel = () => {
    setFormData(doctor)
    setIsEditing(false)
  }

  if (loading) {
    return <div className="loading">Đang tải thông tin...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!doctor) {
    return <div className="loading">Không tìm thấy thông tin doctor.</div>
  }

  return (
    <div className="profile-page doctor-profile">
      <div className="profile-header">
        <h2>👨‍⚕️ Doctor Profile</h2>
        <div className="header-actions">
          {!isEditing ? (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </button>
          ) : (
            <>
              <button className="btn-save" onClick={handleSave}>
                ✓ Save
              </button>
              <button className="btn-cancel" onClick={handleCancel}>
                ✗ Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="doctor-info">
        {/* Personal Info Section */}
        <div className="info-section">
          <h3>📋 Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>CCCD:</label>
              <span>{doctor.cccd}</span>
            </div>
            <div className="info-item">
              <label>Full Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.full_name}</span>
              )}
            </div>
            <div className="info-item">
              <label>Date of Birth:</label>
              {isEditing ? (
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday ? formData.birthday.split('T')[0] : ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.birthday ? new Date(doctor.birthday).toLocaleDateString('vi-VN') : 'N/A'}</span>
              )}
            </div>
            <div className="info-item">
              <label>Phone Number:</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
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
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.email}</span>
              )}
            </div>
            <div className="info-item">
              <label>Address:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.address || 'N/A'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Work Info Section */}
        <div className="info-section">
          <h3>🏥 Work Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Specialization:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{doctor.specialization}</span>
              )}
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="info-section password-section">
          <h3>🔒 Privacy</h3>
          {!showPasswordChange ? (
            <button 
              className="btn-change-password"
              onClick={() => setShowPasswordChange(true)}
            >
              Change Password
            </button>
          ) : (
            <div className="password-form">
              <div className="info-item">
                <label>Current Password:</label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div className="info-item">
                <label>New Password:</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>
              <div className="info-item">
                <label>Confirm Password:</label>
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
                  Update Password
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirmPassword: ''
                    })
                  }}
                >
                  Cancel
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
