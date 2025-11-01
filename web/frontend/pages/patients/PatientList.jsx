import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './PatientList.css'

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [filter, setFilter] = useState('all') // all, normal, warning, danger

  useEffect(() => {
    // TODO: Fetch from API
    setPatients([
      { id: 1, name: 'Nguyễn Văn A', cccd: '123456789', gender: 'Nam', age: 45, status: 'normal', phone: '0912345678', room: 'A301' },
      { id: 2, name: 'Trần Thị B', cccd: '987654321', gender: 'Nữ', age: 52, status: 'warning', phone: '0923456789', room: 'A302' },
      { id: 3, name: 'Lê Văn C', cccd: '456789123', gender: 'Nam', age: 38, status: 'danger', phone: '0934567890', room: 'B201' },
      { id: 4, name: 'Phạm Thị D', cccd: '321654987', gender: 'Nữ', age: 61, status: 'normal', phone: '0945678901', room: 'A301' },
      { id: 5, name: 'Hoàng Văn E', cccd: '654321789', gender: 'Nam', age: 29, status: 'warning', phone: '0956789012', room: 'B202' },
    ])
  }, [])

  const getStatusBadge = (status) => {
    const badges = {
      normal: { text: '✅ Bình thường', class: 'status-normal' },
      warning: { text: '⚠️ Cảnh báo', class: 'status-warning' },
      danger: { text: '🚨 Nguy hiểm', class: 'status-danger' }
    }
    return badges[status] || badges.normal
  }

  const filteredPatients = filter === 'all' 
    ? patients 
    : patients.filter(p => p.status === filter)

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>📋 Danh sách bệnh nhân</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            Tất cả ({patients.length})
          </button>
          <button 
            className={filter === 'normal' ? 'active' : ''} 
            onClick={() => setFilter('normal')}
          >
            Bình thường ({patients.filter(p => p.status === 'normal').length})
          </button>
          <button 
            className={filter === 'warning' ? 'active' : ''} 
            onClick={() => setFilter('warning')}
          >
            Cảnh báo ({patients.filter(p => p.status === 'warning').length})
          </button>
          <button 
            className={filter === 'danger' ? 'active' : ''} 
            onClick={() => setFilter('danger')}
          >
            Nguy hiểm ({patients.filter(p => p.status === 'danger').length})
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ và tên</th>
              <th>CCCD</th>
              <th>Giới tính</th>
              <th>Tuổi</th>
              <th>Tình trạng</th>
              <th>SĐT người nhà</th>
              <th>Phòng</th>
              <th>Hành động</th>
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
                      👁️ Xem
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
