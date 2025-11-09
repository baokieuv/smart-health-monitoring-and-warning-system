import React, { useState, useEffect } from 'react'
import './patientMonitor.css'

const PatientMonitor = () => {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    // TODO: Fetch data from API
    // Temporary mock data
    setPatients([
      { cccd: '123456789', name: 'Nguyễn Văn A', heartRate: 75, o2: 98, temperature: 36.5, status: 'normal' },
      { cccd: '987654321', name: 'Trần Thị B', heartRate: 92, o2: 95, temperature: 37.2, status: 'warning' },
      { cccd: '456789123', name: 'Lê Văn C', heartRate: 110, o2: 89, temperature: 38.5, status: 'danger' },
    ])
  }, [])

  const getStatusClass = (status) => {
    switch(status) {
      case 'normal': return 'status-normal'
      case 'warning': return 'status-warning'
      case 'danger': return 'status-danger'
      default: return ''
    }
  }

  return (
    <div className="patient-monitor">
      <h2>Dashboard - Giám sát bệnh nhân</h2>
      
      <div className="patients-grid">
        {patients.map((patient) => (
          <div key={patient.cccd} className={`patient-card ${getStatusClass(patient.status)}`}>
            <h3>{patient.name}</h3>
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
      </div>
    </div>
  )
}

export default PatientMonitor
