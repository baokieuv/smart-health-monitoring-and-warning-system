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

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDoctorDetail(id)
      if (res?.status === 'success') {
        setDoctor(res.doctor)
      }
    } catch (e) {
      console.error('Load doctor error:', e)
      setError('Không thể tải thông tin bác sĩ')
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
              <label>CCCD:</label>
              <span>{doctor.cccd}</span>
            </div>
            <div className="info-item">
              <label>Họ và tên:</label>
              <span>{doctor.full_name}</span>
            </div>
            <div className="info-item">
              <label>Ngày sinh:</label>
              <span>{doctor.birthday ? new Date(doctor.birthday).toLocaleDateString('vi-VN') : '-'}</span>
            </div>
            <div className="info-item">
              <label>Địa chỉ:</label>
              <span>{doctor.address || 'Chưa có'}</span>
            </div>
            <div className="info-item">
              <label>Số điện thoại:</label>
              <span>{doctor.phone}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{doctor.email}</span>
            </div>
            <div className="info-item">
              <label>Chuyên khoa:</label>
              <span>{doctor.specialization}</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Tài khoản đăng nhập</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Username (CCCD):</label>
              <span>{doctor.cccd}</span>
            </div>
            <div className="info-item">
              <label>Password:</label>
              <span>••••••••</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn primary" onClick={() => setShowEditModal(true)}>✏️ Sửa thông tin</button>
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
    </div>
  )
}

// Edit Info Modal Component
function EditInfoModal({ doctor, onSave, onClose }) {
  const [formData, setFormData] = useState({
    full_name: doctor.full_name || '',
    birthday: doctor.birthday ? new Date(doctor.birthday).toISOString().split('T')[0] : '',
    address: doctor.address || '',
    phone: doctor.phone || '',
    email: doctor.email || '',
    specialization: doctor.specialization || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.full_name || !formData.birthday || !formData.phone || !formData.email || !formData.specialization) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc')
      return
    }
    if (!/^0\d{9}$/.test(formData.phone)) {
      alert('Số điện thoại phải có 10 số và bắt đầu bằng 0')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      alert('Email không hợp lệ')
      return
    }
    
    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Sửa thông tin bác sĩ</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>CCCD: <span style={{ fontSize: '12px', color: '#999' }}>(Không thể sửa)</span></label>
            <input
              type="text"
              value={doctor.cccd}
              disabled
              style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Họ và tên: <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email: <span style={{ color: 'red' }}>*</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Ngày sinh: <span style={{ color: 'red' }}>*</span></label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại: <span style={{ color: 'red' }}>*</span></label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              maxLength={10}
              placeholder="0xxxxxxxxx"
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Địa chỉ chi tiết"
            />
          </div>

          <div className="form-group">
            <label>Chuyên khoa: <span style={{ color: 'red' }}>*</span></label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              required
            >
              <option value="">-- Chọn chuyên khoa --</option>
              <option value="Bác sĩ">Bác sĩ</option>
              <option value="Trưởng khoa">Trưởng khoa</option>
              <option value="Điều dưỡng">Điều dưỡng</option>
              <option value="Tim mạch">Tim mạch</option>
              <option value="Nội khoa">Nội khoa</option>
              <option value="Ngoại khoa">Ngoại khoa</option>
              <option value="Nhi khoa">Nhi khoa</option>
              <option value="Sản khoa">Sản khoa</option>
            </select>
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
