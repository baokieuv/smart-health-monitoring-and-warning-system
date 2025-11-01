import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import './RoomDetail.css'

export default function RoomDetail() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [patients, setPatients] = useState([])

  useEffect(() => {
    // TODO: Fetch from API
    setRoom({
      code: code,
      floor: 3,
      building: 'A',
      capacity: 4,
      occupied: 2
    })

    setPatients([
      { id: 1, name: 'Nguyễn Văn A', cccd: '123456789', status: 'normal', heartRate: 75, o2: 98, temperature: 36.5 },
      { id: 2, name: 'Phạm Thị D', cccd: '321654987', status: 'normal', heartRate: 72, o2: 97, temperature: 36.4 },
    ])
  }, [code])

  const handleDelete = (id) => {
    if (window.confirm('Xác nhận xóa bệnh nhân khỏi phòng?')) {
      setPatients(patients.filter(p => p.id !== id))
    }
  }

  if (!room) {
    return <div className="loading">Đang tải...</div>
  }

  const getStatusClass = (status) => {
    switch(status) {
      case 'normal': return 'status-normal'
      case 'warning': return 'status-warning'
      case 'danger': return 'status-danger'
      default: return ''
    }
  }

  return (
    <div className="room-detail-container">
      <div className="detail-header">
        <Link to="/rooms" className="btn-back">← Quay lại danh sách phòng</Link>
        <h2>🏥 Phòng {room.code} - Tòa {room.building}, Tầng {room.floor}</h2>
        <Link to={`/rooms/${code}/add-patient`} className="btn-add">+ Thêm bệnh nhân</Link>
      </div>

      <div className="room-info">
        <div className="info-item">
          <span>Sức chứa:</span>
          <strong>{room.capacity} người</strong>
        </div>
        <div className="info-item">
          <span>Đang sử dụng:</span>
          <strong>{room.occupied} người</strong>
        </div>
        <div className="info-item">
          <span>Còn trống:</span>
          <strong>{room.capacity - room.occupied} giường</strong>
        </div>
      </div>

      <h3>📋 Danh sách bệnh nhân trong phòng</h3>

      <div className="patients-grid">
        {patients.map((patient) => (
          <div key={patient.id} className={`patient-card ${getStatusClass(patient.status)}`}>
            <div className="card-header">
              <h4>{patient.name}</h4>
              <div className="card-actions">
                <Link to={`/patients/${patient.id}`} className="btn-icon" title="Xem chi tiết">
                  👁️
                </Link>
                <button onClick={() => handleDelete(patient.id)} className="btn-icon btn-delete" title="Xóa">
                  🗑️
                </button>
              </div>
            </div>
            <p className="cccd">CCCD: {patient.cccd}</p>
            <div className="vitals">
              <div className="vital-item">
                <span className="label">❤️ Nhịp tim:</span>
                <span className="value">{patient.heartRate} bpm</span>
              </div>
              <div className="vital-item">
                <span className="label">🫁 SpO2:</span>
                <span className="value">{patient.o2}%</span>
              </div>
              <div className="vital-item">
                <span className="label">🌡️ Nhiệt độ:</span>
                <span className="value">{patient.temperature}°C</span>
              </div>
            </div>
            <div className={`status ${patient.status}`}>
              {patient.status === 'normal' && '✅ Bình thường'}
              {patient.status === 'warning' && '⚠️ Cảnh báo'}
              {patient.status === 'danger' && '🚨 Nguy hiểm'}
            </div>
          </div>
        ))}

        {patients.length === 0 && (
          <div className="empty-state">
            <p>Phòng hiện đang trống</p>
            <Link to={`/rooms/${code}/add-patient`} className="btn-add">+ Thêm bệnh nhân</Link>
          </div>
        )}
      </div>
    </div>
  )
}
