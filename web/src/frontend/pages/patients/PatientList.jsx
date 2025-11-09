import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
// import routers from '../../utils/routers'
import './PatientList.css'

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [filter, setFilter] = useState('all') // all, normal, warning
  const [showAddModal, setShowAddModal] = useState(false)
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    loadPatients()
    loadRooms()
  }, [])

  const loadPatients = () => {
    // TODO: Fetch from API
    setPatients([
      { id: 1, name: 'Nguyễn Văn A', cccd: '123456789', gender: 'Nam', age: 45, status: 'normal', phone: '0912345678', room: 'A301' },
      { id: 2, name: 'Trần Thị B', cccd: '987654321', gender: 'Nữ', age: 52, status: 'warning', phone: '0923456789', room: 'A302' },
      { id: 3, name: 'Lê Văn C', cccd: '456789123', gender: 'Nam', age: 38, status: 'warning', phone: '0934567890', room: 'B201' },
      { id: 4, name: 'Phạm Thị D', cccd: '321654987', gender: 'Nữ', age: 61, status: 'normal', phone: '0945678901', room: 'A301' },
      { id: 5, name: 'Hoàng Văn E', cccd: '654321789', gender: 'Nam', age: 29, status: 'warning', phone: '0956789012', room: 'B202' },
    ])
  }

  const loadRooms = () => {
    // TODO: Fetch available rooms from API
    setRooms([
      { code: 'A301', capacity: 4, occupied: 2 },
      { code: 'A302', capacity: 4, occupied: 3 },
      { code: 'B201', capacity: 2, occupied: 1 },
      { code: 'B202', capacity: 2, occupied: 1 },
      { code: 'C101', capacity: 6, occupied: 6 },
    ])
  }

  const getStatusBadge = (status) => {
    const badges = {
      normal: { text: '✅ Bình thường', class: 'status-normal' },
      warning: { text: '⚠️ Cảnh báo', class: 'status-warning' }
    }
    return badges[status] || badges.normal
  }

  const filteredPatients = filter === 'all' 
    ? patients 
    : patients.filter(p => p.status === filter)

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>📋 Patients List</h2>
        <div className="header-actions">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>+ Add Patient</button>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All ({patients.length})
            </button>
            <button 
              className={filter === 'normal' ? 'active' : ''} 
              onClick={() => setFilter('normal')}
            >
              Normal ({patients.filter(p => p.status === 'normal').length})
            </button>
            <button 
              className={filter === 'warning' ? 'active' : ''} 
              onClick={() => setFilter('warning')}
            >
              Warning ({patients.filter(p => p.status === 'warning').length})
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Full Name</th>
              <th>CCCD</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Status</th>
              <th>Emergency Contact</th>
              <th>Room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient, index) => {
              const badge = getStatusBadge(patient.status)
              return (
                <tr key={patient.id} className={`row-${patient.status}`}>
                  <td>{index + 1}</td>
                  <td><strong>{patient.name}</strong></td>
                  <td>{patient.cccd}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.age}</td>
                  <td>
                    <span className={`badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </td>
                  <td>{patient.phone}</td>
                  <td>
                    <Link to={`/rooms/${patient.room}`} className="room-link">
                      {patient.room}
                    </Link>
                  </td>
                  <td>
                    <Link 
                      to={`/patients/${patient.id}`} 
                      className="btn-view"
                    >
                      👁️ View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          rooms={rooms}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadPatients()
            loadRooms()
          }}
        />
      )}
    </div>
  )
}

// Add Patient Modal Component
function AddPatientModal({ rooms, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    cccd: '',
    gender: 'Nam',
    age: '',
    phone: '',
    room: '',
    status: 'normal'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.room) {
      alert('Vui lòng chọn phòng cho bệnh nhân')
      return
    }

    const selectedRoom = rooms.find(r => r.code === formData.room)
    if (selectedRoom && selectedRoom.occupied >= selectedRoom.capacity) {
      alert('Phòng đã đầy, vui lòng chọn phòng khác')
      return
    }

    try {
      // TODO: Call API to create patient and assign room
      // await createPatient(formData)
      alert(`Thêm bệnh nhân thành công và đã gán vào phòng ${formData.room}`)
      onSuccess()
    } catch (error) {
      alert('Thêm bệnh nhân thất bại')
    }
  }

  const availableRooms = rooms.filter(r => r.occupied < r.capacity)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>➕ Add Patient</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name: <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Nhập họ tên bệnh nhân"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>CCCD: <span className="required">*</span></label>
              <input
                type="text"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                required
                placeholder="Số CCCD"
              />
            </div>
            
            <div className="form-group">
              <label>Gender:</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Age: <span className="required">*</span></label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="1"
                max="120"
                placeholder="Tuổi"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Emergency Contact Phone: <span className="required">*</span></label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Số điện thoại người nhà"
            />
          </div>
          
          <div className="form-group">
            <label>Room: <span className="required">*</span></label>
            <select name="room" value={formData.room} onChange={handleChange} required>
              <option value="">-- Chọn phòng --</option>
              {availableRooms.map(room => (
                <option key={room.code} value={room.code}>
                  {room.code} (Còn {room.capacity - room.occupied}/{room.capacity} giường)
                </option>
              ))}
            </select>
            {availableRooms.length === 0 && (
              <small style={{ color: '#dc3545' }}>Không có phòng trống. Vui lòng liên hệ quản trị viên.</small>
            )}
          </div>
          
          <div className="form-group">
            <label>Status:</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="normal">Bình thường</option>
              <option value="warning">Cảnh báo</option>
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="btn-primary">Add</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
