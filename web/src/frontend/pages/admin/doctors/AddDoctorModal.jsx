import React, { useState } from 'react'
import './AddDoctorModal.scss'

export default function AddDoctorModal({ onClose, onSubmit }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cccd: '',
    full_name: '',
    email: '',
    birthday: '',
    address: '',
    phone: '',
    specialization: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.cccd || formData.cccd.length !== 12) {
      alert('CCCD phải có 12 số')
      return
    }
    if (!formData.full_name || !formData.email || !formData.birthday || !formData.phone || !formData.specialization) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      alert('Email không hợp lệ')
      return
    }
    if (!/^0\d{9}$/.test(formData.phone)) {
      alert('Số điện thoại phải có 10 số và bắt đầu bằng 0')
      return
    }
    if (formData.address.length < 5) {
      alert('Địa chỉ phải có ít nhất 5 ký tự')
      return
    }

    setLoading(true)
    try {
      // Send data to API - username and password will be auto-generated as cccd
      console.log('Submitting doctor data:', formData)
      await onSubmit(formData)
    } catch (e) {
      console.error('Submit error:', e)
      console.error('Error response:', e?.response)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Doctor</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <h4>Thông tin cơ bản</h4>
            
            <div className="form-group">
              <label>CCCD <span className="required">*</span></label>
              <input
                type="text"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                placeholder="12 số"
                maxLength={12}
                required
              />
              <small>Username và password mặc định sẽ là CCCD này</small>
            </div>

            <div className="form-group">
              <label>Họ và tên <span className="required">*</span></label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Ngày sinh <span className="required">*</span></label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại <span className="required">*</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Số nhà, đường, quận, thành phố"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Thông tin công việc</h4>

            <div className="form-group">
              <label>Chuyên khoa <span className="required">*</span></label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Đang thêm...' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
