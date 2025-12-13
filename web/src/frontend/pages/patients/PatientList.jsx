import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPatientList, createPatient, getDoctorsList, deletePatient } from '../../utils/api'
// import routers from '../../utils/routers'
import './PatientList.css'

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [rooms, setRooms] = useState([])
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    loadPatients()
    loadRooms()
    loadDoctors()
  }, [page])

  const loadPatients = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPatientList({ page, limit: 10 })
      console.log('Patient list response:', res)
      console.log('Patients array:', res?.data?.patients)
      console.log('Total patients:', res?.data?.total)
      
      if (res?.status === 'success' && res?.data) {
        const patientsList = res.data.patients || []
        console.log('Setting patients:', patientsList)
        setPatients(patientsList)
        setTotalPages(res.data.total_pages || 1)
        
        // Show message if no patients
        if (patientsList.length === 0) {
          console.log('No patients found for this doctor')
        }
      }
    } catch (e) {
      console.error('Load patients error:', e)
      console.error('Error response:', e?.response)
      setError('Error when loading patients list: ' + (e?.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
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

  const loadDoctors = async () => {
    try {
      const res = await getDoctorsList()
      if (res?.status === 'success' && res?.data?.doctors) {
        setDoctors(res.data.doctors)
      }
    } catch (e) {
      console.error('Load doctors error:', e)
    }
  }

  const calculateAge = (birthday) => {
    if (!birthday) return '-'
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleAddPatient = async (patientData) => {
    try {
      console.log('Creating patient with data:', patientData)
      const res = await createPatient(patientData)
      console.log('Create patient response:', res)
      if (res?.status === 'success') {
        setShowAddModal(false)
        loadPatients()
        alert('Thêm bệnh nhân thành công!')
      }
    } catch (e) {
      console.error('Add patient error:', e)
      const msg = e?.response?.data?.message || 'Không thể thêm bệnh nhân'
      alert(msg)
      throw e
    }
  }

  const handleDeletePatient = async (patientId, patientName) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bệnh nhân "${patientName}"?\nThao tác này không thể hoàn tác.`)
    if (!confirmed) return

    try {
      const res = await deletePatient(patientId)
      if (res?.status === 'success') {
        alert('Xóa bệnh nhân thành công!')
        loadPatients()
      }
    } catch (e) {
      console.error('Delete patient error:', e)
      const msg = e?.response?.data?.message || 'Không thể xóa bệnh nhân'
      alert(msg)
    }
  }

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>📋 Patients List</h2>
        <div className="header-actions">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>+ Add Patient</button>
          <div style={{ color: '#666', fontSize: '14px' }}>
            Total: {patients.length} patients
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Đang tải...</div>}
      {error && <div style={{ padding: '20px', color: '#e5484d' }}>{error}</div>}

      <div className="table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Full Name</th>
              <th>CCCD</th>
              <th>Room</th>
              <th>Doctor</th>
              <th>Device ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, index) => {
              const age = calculateAge(patient.birthday)
              return (
                <tr key={patient._id}>
                  <td>{(page - 1) * 10 + index + 1}</td>
                  <td><strong>{patient.full_name}</strong></td>
                  <td>{patient.cccd}</td>
                  <td>
                    <Link to={`/rooms/${patient.room}`} className="room-link">
                      {patient.room}
                    </Link>
                  </td>
                  <td>
                    {patient.doctor ? (
                      <div>
                        <div style={{ fontWeight: '600' }}>{patient.doctor.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{patient.doctor.specialization}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{patient.deviceId || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Link 
                        to={`/patients/${patient._id}`} 
                        className="btn-view"
                      >
                        👁️ View
                      </Link>
                      <button
                        onClick={() => handleDeletePatient(patient._id, patient.full_name)}
                        className="btn-delete"
                        title="Delete patient"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {patients.length === 0 && !loading && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Không có bệnh nhân nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            style={{ padding: '8px 16px' }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 16px' }}>Page {page} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
            style={{ padding: '8px 16px' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          rooms={rooms}
          doctors={doctors}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPatient}
        />
      )}
    </div>
  )
}

// Add Patient Modal Component
function AddPatientModal({ rooms, doctors, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cccd: '',
    full_name: '',
    birthday: '',
    address: '',
    phone: '',
    room: '',
    doctorId: '',
    deviceId: ''
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
    if (!formData.full_name || !formData.birthday || !formData.address || !formData.phone || !formData.room || !formData.doctorId) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc')
      return
    }
    if (!/^0\d{9}$/.test(formData.phone)) {
      alert('Số điện thoại phải có 10 số và bắt đầu bằng 0')
      return
    }

    const selectedRoom = rooms.find(r => r.code === formData.room)
    if (selectedRoom && selectedRoom.occupied >= selectedRoom.capacity) {
      alert('Phòng đã đầy, vui lòng chọn phòng khác')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableRooms = rooms.filter(r => r.occupied < r.capacity)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>➕ Add Patient</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>CCCD: <span className="required">*</span></label>
            <input
              type="text"
              name="cccd"
              value={formData.cccd}
              onChange={handleChange}
              required
              maxLength={12}
              placeholder="12 số CCCD"
            />
          </div>

          <div className="form-group">
            <label>Full Name: <span className="required">*</span></label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder="Nhập họ tên bệnh nhân"
            />
          </div>
          
          <div className="form-group">
            <label>Birthday: <span className="required">*</span></label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone: <span className="required">*</span></label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              maxLength={10}
              placeholder="Số điện thoại (0xxxxxxxxx)"
            />
          </div>

          <div className="form-group">
            <label>Address: <span className="required">*</span></label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Địa chỉ đầy đủ"
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
            <label>Doctor: <span className="required">*</span></label>
            <select name="doctorId" value={formData.doctorId} onChange={handleChange} required>
              <option value="">-- Chọn bác sĩ phụ trách --</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.full_name} - {doctor.specialization}
                </option>
              ))}
            </select>
            {doctors.length === 0 && (
              <small style={{ color: '#dc3545' }}>Không có bác sĩ nào trong hệ thống.</small>
            )}
          </div>

          <div className="form-group">
            <label>Device ID:</label>
            <input
              type="text"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              placeholder="ID thiết bị (tùy chọn)"
            />
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang thêm...' : 'Add Patient'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
