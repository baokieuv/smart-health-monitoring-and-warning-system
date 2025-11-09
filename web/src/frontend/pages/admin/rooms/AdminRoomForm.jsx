import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import routers from '../../../utils/routers'
import './AdminRoomForm.css'

export default function AdminRoomForm() {
  const { code } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(code)
  
  const [formData, setFormData] = useState({
    code: '',
    building: 'A',
    floor: 1,
    capacity: 2,
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      loadRoomData()
    }
  }, [code])

  const loadRoomData = async () => {
    setLoading(true)
    try {
      // TODO: Fetch room data from API
      // const res = await getRoomDetail(code)
      // setFormData(res.data)
      
      // Mock data
      setFormData({
        code: code,
        building: code.charAt(0),
        floor: parseInt(code.charAt(1)) || 1,
        capacity: 4,
        description: 'Phòng bệnh nhân nội trú'
      })
    } catch (err) {
      setError('Không thể tải thông tin phòng')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isEdit) {
        // TODO: Call API to update room
        // await updateRoom(code, formData)
        alert('Cập nhật phòng thành công')
      } else {
        // TODO: Call API to create room
        // await createRoom(formData)
        alert('Thêm phòng thành công')
      }
      navigate(routers.AdminRooms)
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="admin-room-form">
      <div className="form-header">
        <h2>{isEdit ? '✏️ Sửa phòng' : '➕ Thêm phòng mới'}</h2>
        <button className="btn ghost" onClick={() => navigate(routers.AdminRooms)}>← Quay lại</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mã phòng: <span className="required">*</span></label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ví dụ: A301"
              required
              disabled={isEdit}
            />
            <small>Định dạng: [Tòa][Tầng][Số phòng] - Ví dụ: A301 (Tòa A, Tầng 3, Phòng 01)</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tòa nhà: <span className="required">*</span></label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                required
              >
                <option value="A">Tòa A</option>
                <option value="B">Tòa B</option>
                <option value="C">Tòa C</option>
                <option value="D">Tòa D</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tầng: <span className="required">*</span></label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                min="1"
                max="20"
                required
              />
            </div>

            <div className="form-group">
              <label>Sức chứa: <span className="required">*</span></label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="10"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mô tả:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Mô tả thêm về phòng (tùy chọn)"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm phòng')}
            </button>
            <button 
              type="button" 
              className="btn ghost" 
              onClick={() => navigate(routers.AdminRooms)}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
