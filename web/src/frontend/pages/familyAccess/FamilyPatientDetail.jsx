import React, { useState, useEffect } from 'react'
import { useParams, useNavigate} from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import routers from '../../utils/routers'
import '../patients/PatientDetail.css'

export default function FamilyPatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [familyAccess, setFamilyAccess] = useState(null)
  const [patient, setPatient] = useState(null)
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo data - trong thực tế gọi từ API
    const DEMO_PATIENTS = {
      '1': {
        id: '1',
        name: 'Nguyễn Văn A',
        cccd: '001234567890',
        gender: 'Nam',
        age: 65,
        dob: '1960-03-15',
        address: 'Số 10, Đường ABC, Quận 1, TP.HCM',
        phone: '0912345678',
        emergencyContact: '0923456789',
        room: 'A101',
        status: 'normal',
        heartRate: 75,
        spo2: 98,
        temperature: 36.8,
        diagnosis: 'Theo dõi sau phẫu thuật tim',
        admissionDate: '2025-11-05',
        doctor: 'BS. Trần Thị B',
      },
      '2': {
        id: '2',
        name: 'Trần Thị B',
        cccd: '001234567891',
        gender: 'Nữ',
        age: 58,
        dob: '1967-08-20',
        address: 'Số 25, Đường XYZ, Quận 3, TP.HCM',
        phone: '0987654321',
        emergencyContact: '0976543210',
        room: 'B205',
        status: 'normal',
        heartRate: 82,
        spo2: 97,
        temperature: 37.1,
        diagnosis: 'Đái tháo đường type 2',
        admissionDate: '2025-11-06',
        doctor: 'BS. Lê Văn C',
      },
    }

    const DEMO_VITALS = {
      '1': [
        { time: '00:00', heartRate: 72, spo2: 97, temperature: 36.5 },
        { time: '00:15', heartRate: 73, spo2: 97, temperature: 36.6 },
        { time: '00:30', heartRate: 74, spo2: 98, temperature: 36.6 },
        { time: '00:45', heartRate: 72, spo2: 97, temperature: 36.5 },
        { time: '01:00', heartRate: 73, spo2: 97, temperature: 36.6 },
        { time: '01:15', heartRate: 75, spo2: 98, temperature: 36.8 },
        { time: '01:30', heartRate: 76, spo2: 96, temperature: 36.9 },
        { time: '01:45', heartRate: 74, spo2: 97, temperature: 36.7 },
        { time: '02:00', heartRate: 73, spo2: 98, temperature: 36.8 },
        { time: '02:15', heartRate: 75, spo2: 97, temperature: 36.7 },
      ],
      '2': [
        { time: '00:00', heartRate: 80, spo2: 96, temperature: 36.9 },
        { time: '00:15', heartRate: 81, spo2: 96, temperature: 37.0 },
        { time: '00:30', heartRate: 82, spo2: 97, temperature: 37.0 },
        { time: '00:45', heartRate: 80, spo2: 96, temperature: 36.9 },
        { time: '01:00', heartRate: 81, spo2: 96, temperature: 37.0 },
        { time: '01:15', heartRate: 82, spo2: 97, temperature: 37.1 },
        { time: '01:30', heartRate: 84, spo2: 95, temperature: 37.2 },
        { time: '01:45', heartRate: 81, spo2: 96, temperature: 37.0 },
        { time: '02:00', heartRate: 82, spo2: 97, temperature: 37.1 },
        { time: '02:15', heartRate: 82, spo2: 96, temperature: 37.0 },
      ],
    }

    // Kiểm tra quyền truy cập
    const accessData = sessionStorage.getItem('familyAccess')
    if (!accessData) {
      navigate(routers.FamilyAccess)
      return
    }

    const access = JSON.parse(accessData)
    setFamilyAccess(access)

    // Kiểm tra xem có quyền xem bệnh nhân này không
    if (access.patientId !== id) {
      alert('Bạn không có quyền xem thông tin bệnh nhân này!')
      navigate(routers.FamilyAccess)
      return
    }

    // Load dữ liệu bệnh nhân
    setTimeout(() => {
      const patientData = DEMO_PATIENTS[id]
      const vitalsData = DEMO_VITALS[id]
      
      if (patientData) {
        setPatient(patientData)
        setVitals(vitalsData || [])
      } else {
        alert('Không tìm thấy thông tin bệnh nhân!')
        navigate(routers.FamilyAccess)
      }
      setLoading(false)
    }, 500)
  }, [id, navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('familyAccess')
    navigate(routers.FamilyAccess)
  }

  const getStatusBadge = (status) => {
    const badges = {
      normal: { text: '✅ Bình thường', class: 'status-normal' },
      warning: { text: '⚠️ Cảnh báo', class: 'status-warning' },
    }
    return badges[status] || badges.normal
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  if (!patient || !familyAccess) {
    return null
  }

  const badge = getStatusBadge(patient.status)

  return (
    <div className="patient-detail-container">
      <div className="detail-header">
        <button onClick={handleLogout} className="btn-back">← Logout</button>
        <h2>Patient Information</h2>
      </div>

      <div className="detail-grid">
        <div className="info-card">
          <h3>📋 Personal Information</h3>
          <div className="info-row">
            <span className="label">Full Name:</span>
            <span className="value"><strong>{patient.name}</strong></span>
          </div>
          <div className="info-row">
            <span className="label">CCCD:</span>
            <span className="value">{patient.cccd}</span>
          </div>
          <div className="info-row">
            <span className="label">Date of Birth:</span>
            <span className="value">{patient.dob}</span>
          </div>
          <div className="info-row">
            <span className="label">Age:</span>
            <span className="value">{patient.age}</span>
          </div>
          <div className="info-row">
            <span className="label">Gender:</span>
            <span className="value">{patient.gender}</span>
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
            <span className="label">Emergency Contact:</span>
            <span className="value">{patient.emergencyContact}</span>
          </div>
          <div className="info-row">
            <span className="label">Room:</span>
            <span className="value">{patient.room}</span>
          </div>
          <div className="info-row">
            <span className="label">Bác sỹ điều trị:</span>
            <span className="value"><strong>{patient.doctor}</strong></span>
          </div>
          <div className="info-row">
            <span className="label">Chuẩn đoán:</span>
            <span className="value diagnosis-text">{patient.diagnosis}</span>
          </div>
        </div>

        <div className="vitals-card">
          <h3>❤️ Current Vitals</h3>
          <div className="vitals-grid">
            <div className="vital-box">
              <div className="vital-icon">❤️</div>
              <div className="vital-value">{patient.heartRate}</div>
              <div className="vital-label">Heart Rate (bpm)</div>
            </div>
            <div className="vital-box">
              <div className="vital-icon">🫁</div>
              <div className="vital-value">{patient.spo2}</div>
              <div className="vital-label">SpO2 (%)</div>
            </div>
            <div className="vital-box">
              <div className="vital-icon">🌡️</div>
              <div className="vital-value">{patient.temperature}</div>
              <div className="vital-label">Temperature (°C)</div>
            </div>
          </div>
          <div className="status-badge-large">
            <span className={`badge ${badge.class}`}>{badge.text}</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <h3>📊 Health Metrics Chart</h3>
        
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
      </div>
    </div>
  )
}
