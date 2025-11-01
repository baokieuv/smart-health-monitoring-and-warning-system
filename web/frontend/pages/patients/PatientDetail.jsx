import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import './PatientDetail.css'

export default function PatientDetail() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [vitals, setVitals] = useState([])

  useEffect(() => {
    // TODO: Fetch patient by ID from API
    setPatient({
      id: id,
      name: 'Nguyễn Văn A',
      cccd: '123456789',
      gender: 'Nam',
      age: 45,
      dob: '1979-05-15',
      address: 'Số 10, Đường ABC, Quận 1, TP.HCM',
      phone: '0912345678',
      emergencyContact: '0923456789',
      room: 'A301',
      status: 'normal',
      heartRate: 75,
      spo2: 98,
      temperature: 36.5
    })

    setVitals([
      { time: '08:00', heartRate: 72, spo2: 97, temperature: 36.3 },
      { time: '12:00', heartRate: 75, spo2: 98, temperature: 36.5 },
      { time: '16:00', heartRate: 78, spo2: 96, temperature: 36.6 },
      { time: '20:00', heartRate: 74, spo2: 97, temperature: 36.4 },
    ])
  }, [id])

  if (!patient) {
    return <div className="loading">Đang tải...</div>
  }

  const getStatusBadge = (status) => {
    const badges = {
      normal: { text: '✅ Bình thường', class: 'status-normal' },
      warning: { text: '⚠️ Cảnh báo', class: 'status-warning' },
      danger: { text: '🚨 Nguy hiểm', class: 'status-danger' }
    }
    return badges[status] || badges.normal
  }

  const badge = getStatusBadge(patient.status)

  return (
    <div className="patient-detail-container">
      <div className="detail-header">
        <Link to="/patients" className="btn-back">← Quay lại danh sách</Link>
        <h2>Thông tin bệnh nhân</h2>
      </div>

      <div className="detail-grid">
        <div className="info-card">
          <h3>📋 Thông tin cá nhân</h3>
          <div className="info-row">
            <span className="label">Họ tên:</span>
            <span className="value"><strong>{patient.name}</strong></span>
          </div>
          <div className="info-row">
            <span className="label">CCCD:</span>
            <span className="value">{patient.cccd}</span>
          </div>
          <div className="info-row">
            <span className="label">Ngày sinh:</span>
            <span className="value">{patient.dob}</span>
          </div>
          <div className="info-row">
            <span className="label">Tuổi:</span>
            <span className="value">{patient.age}</span>
          </div>
          <div className="info-row">
            <span className="label">Giới tính:</span>
            <span className="value">{patient.gender}</span>
          </div>
          <div className="info-row">
            <span className="label">Địa chỉ:</span>
            <span className="value">{patient.address}</span>
          </div>
          <div className="info-row">
            <span className="label">SĐT:</span>
            <span className="value">{patient.phone}</span>
          </div>
          <div className="info-row">
            <span className="label">SĐT người nhà:</span>
            <span className="value">{patient.emergencyContact}</span>
          </div>
          <div className="info-row">
            <span className="label">Phòng:</span>
            <span className="value">
              <Link to={`/rooms/${patient.room}`} className="room-link">{patient.room}</Link>
            </span>
          </div>
        </div>

        <div className="vitals-card">
          <h3>❤️ Chỉ số hiện tại</h3>
          <div className="vitals-grid">
            <div className="vital-box">
              <div className="vital-icon">❤️</div>
              <div className="vital-value">{patient.heartRate}</div>
              <div className="vital-label">Nhịp tim (bpm)</div>
            </div>
            <div className="vital-box">
              <div className="vital-icon">🫁</div>
              <div className="vital-value">{patient.spo2}</div>
              <div className="vital-label">SpO2 (%)</div>
            </div>
            <div className="vital-box">
              <div className="vital-icon">🌡️</div>
              <div className="vital-value">{patient.temperature}</div>
              <div className="vital-label">Nhiệt độ (°C)</div>
            </div>
          </div>
          <div className="status-badge-large">
            <span className={`badge ${badge.class}`}>{badge.text}</span>
          </div>
        </div>
      </div>

      <div className="history-card">
        <h3>📊 Lịch sử chỉ số</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Nhịp tim</th>
              <th>SpO2</th>
              <th>Nhiệt độ</th>
            </tr>
          </thead>
          <tbody>
            {vitals.map((v, i) => (
              <tr key={i}>
                <td>{v.time}</td>
                <td>{v.heartRate} bpm</td>
                <td>{v.spo2}%</td>
                <td>{v.temperature}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
