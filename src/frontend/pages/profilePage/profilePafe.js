import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './profilePage.scss'

const ProfilePage = () => {
  const { cccd } = useParams()
  const [patient, setPatient] = useState(null)

  useEffect(() => {
    // TODO: Fetch patient data by CCCD from API
    // Temporary mock data
    setPatient({
      cccd: cccd,
      name: 'Nguyễn Văn A',
      age: 45,
      gender: 'Nam',
      room: 'A301',
      heartRate: 75,
      o2: 98,
      temperature: 36.5,
      status: 'normal',
      history: [
        { time: '10:00', heartRate: 72, o2: 97, temperature: 36.3 },
        { time: '11:00', heartRate: 75, o2: 98, temperature: 36.5 },
        { time: '12:00', heartRate: 78, o2: 96, temperature: 36.6 },
      ]
    })
  }, [cccd])

  if (!patient) {
    return <div className="loading">Đang tải thông tin bệnh nhân...</div>
  }

  return (
    <div className="profile-page">
      <h2>Thông tin bệnh nhân</h2>
      
      <div className="patient-info">
        <div className="info-section">
          <h3>Thông tin cá nhân</h3>
          <p><strong>Họ tên:</strong> {patient.name}</p>
          <p><strong>CCCD:</strong> {patient.cccd}</p>
          <p><strong>Tuổi:</strong> {patient.age}</p>
          <p><strong>Giới tính:</strong> {patient.gender}</p>
          <p><strong>Phòng:</strong> {patient.room}</p>
        </div>

        <div className="vitals-section">
          <h3>Chỉ số hiện tại</h3>
          <div className="vital-cards">
            <div className="vital-card">
              <div className="icon">❤️</div>
              <div className="value">{patient.heartRate}</div>
              <div className="label">Nhịp tim (bpm)</div>
            </div>
            <div className="vital-card">
              <div className="icon">🫁</div>
              <div className="value">{patient.o2}</div>
              <div className="label">SpO2 (%)</div>
            </div>
            <div className="vital-card">
              <div className="icon">🌡️</div>
              <div className="value">{patient.temperature}</div>
              <div className="label">Nhiệt độ (°C)</div>
            </div>
          </div>
        </div>

        <div className="history-section">
          <h3>Lịch sử chỉ số</h3>
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
              {patient.history.map((record, index) => (
                <tr key={index}>
                  <td>{record.time}</td>
                  <td>{record.heartRate} bpm</td>
                  <td>{record.o2}%</td>
                  <td>{record.temperature}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
