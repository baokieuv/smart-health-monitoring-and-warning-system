import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getPatientDetail, updatePatient } from '../../utils/api'
import './PatientDetail.css'

export default function PatientDetail() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadPatient()
  }, [id])

  const loadPatient = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPatientDetail(id)
      console.log('Patient detail response:', res)
      if (res?.status === 'success' && res?.patient) {
        setPatient(res.patient)
      }
    } catch (e) {
      console.error('Load patient error:', e)
      setError('Không thể tải thông tin bệnh nhân')
      // Fallback mock data
      setPatient({
        _id: id,
        full_name: 'Nguyễn Văn A',
        cccd: '123456789012',
        birthday: '1979-05-15',
        address: 'Số 10, Đường ABC, Quận 1, TP.HCM',
        phone: '0912345678',
        room: 'A301'
      })
    } finally {
      setLoading(false)
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

  const handleUpdatePatient = async (updatedData) => {
    try {
      const res = await updatePatient(id, updatedData)
      if (res?.status === 'success') {
        setShowEditModal(false)
        loadPatient()
        alert('Cập nhật thông tin bệnh nhân thành công!')
      }
    } catch (e) {
      console.error('Update patient error:', e)
      alert(e?.response?.data?.message || 'Không thể cập nhật thông tin')
      throw e
    }
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  if (!patient) {
    return <div className="loading">Không tìm thấy thông tin bệnh nhân</div>
  }

  const age = calculateAge(patient.birthday)

  return (
    <div className="patient-detail-container">
      <div className="detail-header">
        <Link to="/patients" className="btn-back">← Return to List</Link>
        <h2>Patient Information</h2>
        <button className="btn-edit" onClick={() => setShowEditModal(true)}>✏️ Edit</button>
      </div>

      {error && <div style={{ padding: '16px', color: '#e5484d', background: '#fef2f2', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}

      <div className="detail-grid">
        <div className="info-card">
          <h3>📋 Personal Information</h3>
          <div className="info-row">
            <span className="label">Full Name:</span>
            <span className="value"><strong>{patient.full_name}</strong></span>
          </div>
          <div className="info-row">
            <span className="label">CCCD:</span>
            <span className="value">{patient.cccd}</span>
          </div>
          <div className="info-row">
            <span className="label">Date of Birth:</span>
            <span className="value">{patient.birthday ? new Date(patient.birthday).toLocaleDateString('vi-VN') : '-'}</span>
          </div>
          <div className="info-row">
            <span className="label">Age:</span>
            <span className="value">{age}</span>
          </div>
          <div className="info-row">
            <span className="label">Address:</span>
            <span className="value">{patient.address}</span>
          </div>
          <div className="info-row">
            <span className="label">Phone:</span>
            <span className="value">{patient.phone}</span>
          </div>
          <div className="info-row">
            <span className="label">Room:</span>
            <span className="value">
              <Link to={`/rooms/${patient.room}`} className="room-link">{patient.room}</Link>
            </span>
          </div>
          <div className="info-row">
            <span className="label">Device ID:</span>
            <span className="value">{patient.deviceId || 'Chưa gán'}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditPatientModal
          patient={patient}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdatePatient}
        />
      )}

      {/* Vital Signs Charts */}
      <div className="charts-section" style={{ marginTop: '24px' }}>
        <h3>📊 Health Metrics Chart</h3>
        
        {vitals.length === 0 ? (
          <div style={{ padding: '40px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: '#999', fontSize: '16px' }}>Biểu đồ sinh hiệu sẽ được hiển thị khi kết nối thiết bị giám sát</p>
          </div>
        ) : (
          <>
            <div className="chart-container">
              <h4>❤️ Heart Rate (bpm)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={vitals} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#e74c3c" 
                    strokeWidth={2} 
                    name="Nhịp tim"
                    dot={true}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h4>🫁 SpO2 (%)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={vitals} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="spo2" 
                    stroke="#3498db" 
                    strokeWidth={2} 
                    name="SpO2"
                    dot={true}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h4>🌡️ Temperature (°C)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={vitals} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[35.5, 37.5]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#2ecc71" 
                    strokeWidth={2} 
                    name="Nhiệt độ"
                    dot={true}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Edit Patient Modal Component
function EditPatientModal({ patient, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: patient.full_name || '',
    birthday: patient.birthday ? new Date(patient.birthday).toISOString().split('T')[0] : '',
    address: patient.address || '',
    phone: patient.phone || '',
    room: patient.room || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.full_name || !formData.birthday || !formData.address || !formData.phone || !formData.room) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc')
      return
    }
    if (!/^0\d{9}$/.test(formData.phone)) {
      alert('Số điện thoại phải có 10 số và bắt đầu bằng 0')
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>✏️ Edit Patient Information</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>CCCD: <span style={{ fontSize: '12px', color: '#999' }}>(Không thể sửa)</span></label>
            <input
              type="text"
              value={patient.cccd}
              disabled
              style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
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
            />
          </div>

          <div className="form-group">
            <label>Room: <span className="required">*</span></label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Update'}
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
