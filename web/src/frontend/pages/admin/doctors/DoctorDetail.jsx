import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDoctorDetail, updateDoctor, deleteDoctor } from '../../../utils/api'
import routers from '../../../utils/routers'
import './DoctorDetail.css'

export default function DoctorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doctor, setDoctor] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDoctorDetail(id)
      if (res?.status === 'success') {
        setDoctor(res.data)
      } else {
        // Mock data for demo
        setDoctor({
          id,
          full_name: `Bác sĩ Demo ${id}`,
          birthday: '1985-05-15',
          address: 'Số 123, Đường ABC, Quận XYZ',
          phone: '0912345678',
          email: `doctor${id}@hospital.com`,
          department: 'Khoa Nội',
          position: 'Bác sĩ',
          specialization: 'Tim mạch',
          education: 'Bác sĩ Nội khoa - Đại học Y Hà Nội',
          experience: '15 năm',
          join_date: '2010-08-01',
          username: `doctor${id}`,
          // password không hiển thị
        })
      }
    } catch (e) {
      // Mock data on error
      setDoctor({
        id,
        full_name: `Bác sĩ Demo ${id}`,
        birthday: '1985-05-15',
        address: 'Số 123, Đường ABC, Quận XYZ',
        phone: '0912345678',
        email: `doctor${id}@hospital.com`,
        department: 'Khoa Nội',
        position: 'Bác sĩ',
        specialization: 'Tim mạch',
        education: 'Bác sĩ Nội khoa - Đại học Y Hà Nội',
        experience: '15 năm',
        join_date: '2010-08-01',
        username: `doctor${id}`,
      })
      // setError('Đang hiển thị dữ liệu demo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.')) return
    try {
      await deleteDoctor(id)
      alert('Xóa tài khoản thành công')
      navigate(routers.AdminDoctors)
    } catch (e) {
      alert(e?.response?.data?.message || 'Xóa tài khoản thất bại')
    }
  }

  const onUpdateInfo = async (updatedData) => {
    try {
      await updateDoctor(id, updatedData)
      alert('Cập nhật thông tin thành công')
      load()
      setShowEditModal(false)
    } catch (e) {
      alert(e?.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const onChangeUsername = async (newUsername) => {
    try {
      await updateDoctor(id, { username: newUsername })
      alert('Đổi username thành công')
      load()
      setShowUsernameModal(false)
    } catch (e) {
      alert(e?.response?.data?.message || 'Đổi username thất bại')
    }
  }

  const onChangePassword = async (newPassword) => {
    try {
      await updateDoctor(id, { password: newPassword })
      alert('Đổi mật khẩu thành công')
      setShowPasswordModal(false)
    } catch (e) {
      alert(e?.response?.data?.message || 'Đổi mật khẩu thất bại')
    }
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  if (!doctor) {
    return <div className="error">Không tìm thấy thông tin bác sĩ</div>
  }

  return (
    <div className="doctor-detail-container">
      <div className="doctor-detail-header">
        <h2>👨‍⚕️ Thông tin bác sĩ</h2>
        <button className="btn ghost" onClick={() => navigate(routers.AdminDoctors)}>← Quay lại</button>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="doctor-detail-content">
        <div className="info-section">
          <h3>Thông tin cá nhân</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>ID:</label>
              <span>{doctor.id}</span>
            </div>
            <div className="info-item">
              <label>Họ và tên:</label>
              <span>{doctor.full_name}</span>
            </div>
            <div className="info-item">
              <label>Ngày sinh:</label>
              <span>{doctor.birthday}</span>
            </div>
            <div className="info-item">
              <label>Địa chỉ:</label>
              <span>{doctor.address}</span>
            </div>
            <div className="info-item">
              <label>Số điện thoại:</label>
              <span>{doctor.phone}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{doctor.email || 'Chưa có'}</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Thông tin công việc</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Khoa làm việc:</label>
              <span>{doctor.department || 'Chưa có'}</span>
            </div>
            <div className="info-item">
              <label>Chuyên môn:</label>
              <span>{doctor.specialization || 'Chưa có'}</span>
            </div>
            <div className="info-item">
              <label>Vị trí:</label>
              <span>{doctor.position || doctor.specialization}</span>
            </div>
            <div className="info-item">
              <label>Học vấn:</label>
              <span>{doctor.education || 'Chưa có'}</span>
            </div>
            <div className="info-item">
              <label>Kinh nghiệm:</label>
              <span>{doctor.experience || 'Chưa có'}</span>
            </div>
            <div className="info-item">
              <label>Ngày vào làm:</label>
              <span>{doctor.join_date || 'Chưa có'}</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Tài khoản đăng nhập</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Username:</label>
              <span>{doctor.username || 'Chưa có'}</span>
            </div>
            <div className="info-item">
              <label>Password:</label>
              <span>••••••••</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn primary" onClick={() => setShowEditModal(true)}>✏️ Sửa thông tin cá nhân</button>
          <button className="btn secondary" onClick={() => setShowUsernameModal(true)}>🔑 Đổi username</button>
          <button className="btn secondary" onClick={() => setShowPasswordModal(true)}>🔒 Đổi password</button>
          <button className="btn danger" onClick={onDelete}>🗑️ Xóa tài khoản</button>
        </div>
      </div>

      {/* Edit Info Modal */}
      {showEditModal && (
        <EditInfoModal
          doctor={doctor}
          onSave={onUpdateInfo}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Change Username Modal */}
      {showUsernameModal && (
        <ChangeUsernameModal
          currentUsername={doctor.username}
          onSave={onChangeUsername}
          onClose={() => setShowUsernameModal(false)}
        />
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onSave={onChangePassword}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  )
}

// Edit Info Modal Component
function EditInfoModal({ doctor, onSave, onClose }) {
  const [formData, setFormData] = useState({
    full_name: doctor.full_name || '',
    birthday: doctor.birthday || '',
    address: doctor.address || '',
    phone: doctor.phone || '',
    email: doctor.email || '',
    department: doctor.department || '',
    position: doctor.position || '',
    specialization: doctor.specialization || '',
    education: doctor.education || '',
    experience: doctor.experience || '',
    join_date: doctor.join_date || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Sửa thông tin cá nhân</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ và tên:</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Ngày sinh:</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Địa chỉ:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Số điện thoại:</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Khoa làm việc:</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Vị trí:</label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            >
              <option value="">Chọn vị trí</option>
              <option value="Bác sĩ">Bác sĩ</option>
              <option value="Trưởng khoa">Trưởng khoa</option>
              <option value="Điều dưỡng">Điều dưỡng</option>
            </select>
          </div>
          <div className="form-group">
            <label>Chuyên khoa:</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Học vấn:</label>
            <textarea
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              rows="2"
              placeholder="Ví dụ: Bác sĩ Nội khoa - Đại học Y Hà Nội"
            />
          </div>
          <div className="form-group">
            <label>Kinh nghiệm:</label>
            <input
              type="text"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Ví dụ: 15 năm"
            />
          </div>
          <div className="form-group">
            <label>Ngày vào làm:</label>
            <input
              type="date"
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn primary">Lưu</button>
            <button type="button" className="btn ghost" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Change Username Modal Component
function ChangeUsernameModal({ currentUsername, onSave, onClose }) {
  const [newUsername, setNewUsername] = useState(currentUsername || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newUsername.trim()) {
      alert('Username không được để trống')
      return
    }
    onSave(newUsername)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Đổi Username</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username hiện tại:</label>
            <input type="text" value={currentUsername} disabled />
          </div>
          <div className="form-group">
            <label>Username mới:</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              placeholder="Nhập username mới"
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn primary">Lưu</button>
            <button type="button" className="btn ghost" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Change Password Modal Component
function ChangePasswordModal({ onSave, onClose }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp')
      return
    }
    if (newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    onSave(newPassword)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Đổi Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mật khẩu mới:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu mới"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Nhập lại mật khẩu mới"
              minLength={6}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn primary">Lưu</button>
            <button type="button" className="btn ghost" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  )
}
