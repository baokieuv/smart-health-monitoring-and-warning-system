import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPatientDetail, updatePatient, getDoctorsList, allocateDevice, recallDevice, getPatientHealthInfo } from '../../utils/api';
import './PatientDetail.css';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [healthInfo, setHealthInfo] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);
  
  // Check if user is patient (family member)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPatientRole = user.role === 'patient';

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadPatient(), loadDoctors()]);
    };
    loadData();
  }, [id]);

  // Auto-refresh health info every 15 seconds
  useEffect(() => {
    if (patient?.deviceId) {
      // Clear old vitals when device changes
      setVitals([]);
      
      // Load immediately
      loadHealthInfo();
      
      // Then refresh every 10 seconds
      const interval = setInterval(() => {
        loadHealthInfo();
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    } else {
      // Clear vitals if no device
      setVitals([]);
    }
  }, [patient?.deviceId]);

  const loadHealthInfo = async () => {
    if (!patient?.deviceId) return;
    
    setLoadingHealth(true);
    try {
      const res = await getPatientHealthInfo(id);
      if (res?.status === 'success' && res?.health_info) {
        setHealthInfo(res.health_info);
        
        // Add to vitals chart data
        const newDataPoint = {
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          heartRate: res.health_info.heart_rate || null,
          spo2: res.health_info.SpO2 || null,
          temperature: res.health_info.temperature || null
        };
        
        setVitals(prev => {
          const updated = [...prev, newDataPoint];
          // Keep only last 20 data points
          return updated.slice(-20);
        });
      }
    } catch (e) {
      console.error('Load health info error:', e);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleAllocateDevice = async () => {
    if (!window.confirm('Bạn có chắc muốn cấp phát thiết bị cho bệnh nhân này?')) {
      return;
    }

    setDeviceLoading(true);
    try {
      const res = await allocateDevice(id);
      if (res?.status === 'success') {
        alert(`Cấp phát thiết bị thành công! Device ID: ${res.device_id}`);
        await loadPatient(); // Reload patient to get updated deviceId
      }
    } catch (e) {
      console.error('Allocate device error:', e);
      alert(e?.response?.data?.message || 'Không thể cấp phát thiết bị');
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleRecallDevice = async () => {
    if (!window.confirm('Bạn có chắc muốn thu hồi thiết bị từ bệnh nhân này?')) {
      return;
    }

    setDeviceLoading(true);
    try {
      const res = await recallDevice(id);
      if (res?.status === 'success') {
        alert('Thu hồi thiết bị thành công!');
        setHealthInfo(null); // Clear health info
        await loadPatient(); // Reload patient
      }
    } catch (e) {
      console.error('Recall device error:', e);
      alert(e?.response?.data?.message || 'Không thể thu hồi thiết bị');
    } finally {
      setDeviceLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await getDoctorsList()
      console.log('getDoctorsList API response:', res)
      if (res?.status === 'success' && res?.data?.doctors) {
        console.log('Setting doctors to:', res.data.doctors)
        setDoctors(res.data.doctors)
      }
    } catch (e) {
      console.error('Load doctors error:', e)
    }
  }

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
  
  const getDoctorName = (doctorId) => {
    if (!doctorId) return '-'
    if (doctors.length === 0) return 'Đang tải...'
    
    // Convert ObjectId to string for comparison (patient.doctorId is ObjectId, doctors._id is string)
    const idToMatch = (typeof doctorId === 'object' && doctorId.toString) 
      ? doctorId.toString() 
      : String(doctorId)
    
    console.log('Looking for doctor with ID:', idToMatch)
    console.log('Available doctors:', doctors)
    console.log('Patient object:', patient)
    
    const doctor = doctors.find(d => d._id === idToMatch)
    console.log('Found doctor:', doctor)
    return doctor ? `${doctor.full_name} (${doctor.specialization})` : '-'
  }

  return (
    <div className="patient-detail-container">
      <div className="detail-header">
        <Link to="/patients" className="btn-back">← Return to List</Link>
        <h2>Patient Information</h2>
        {!isPatientRole && (
          <button className="btn-edit" onClick={() => setShowEditModal(true)}>✏️ Edit</button>
        )}
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
            <span className="label">Doctor:</span>
            <span className="value">{getDoctorName(patient.doctorId)}</span>
          </div>
          <div className="info-row">
            <span className="label">Device ID:</span>
            <span className="value">{patient.deviceId || 'Chưa gán'}</span>
          </div>
        </div>

        {/* Device Management Card - Only show for doctors */}
        {!isPatientRole && (
          <div className="info-card">
            <h3>🔧 Quản Lý Thiết Bị</h3>
            {patient.deviceId ? (
              <div>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Device hiện tại:</strong> {patient.deviceId}
                </p>
                <button 
                  className="btn-recall-device"
                  onClick={handleRecallDevice}
                  disabled={deviceLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: deviceLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: deviceLoading ? 0.6 : 1
                  }}
                >
                  {deviceLoading ? 'Đang xử lý...' : '🔴 Thu Hồi Thiết Bị'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '12px', color: '#999' }}>
                  Bệnh nhân chưa được cấp phát thiết bị
                </p>
                <button 
                  className="btn-allocate-device"
                  onClick={handleAllocateDevice}
                  disabled={deviceLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: deviceLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: deviceLoading ? 0.6 : 1
                  }}
                >
                  {deviceLoading ? 'Đang xử lý...' : '✅ Cấp Phát Thiết Bị'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Health Info Card - Only show if device is allocated */}
        {patient.deviceId && (
          <div className="info-card health-card">
            <h3>🩺 Thông Tin Sức Khỏe</h3>
            {loadingHealth ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Đang tải...</p>
            ) : healthInfo ? (
              <div>
              
                <div className="vital-grid" style={{ display: 'grid', gap: '12px' }}>
                  <div className="vital-box" style={{ background: '#fee', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #dc3545' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>❤️ Nhịp Tim</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545' }}>
                      {healthInfo.heart_rate ? `${healthInfo.heart_rate} bpm` : 'N/A'}
                    </div>
                  </div>
                  <div className="vital-box" style={{ background: '#e8f4fd', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>🫁 SpO2</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#17a2b8' }}>
                      {healthInfo.SpO2 ? `${healthInfo.SpO2}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="vital-box" style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>🌡️ Nhiệt Độ</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>
                      {healthInfo.temperature ? `${healthInfo.temperature}°C` : 'N/A'}
                    </div>
                  </div>
                </div>
                {healthInfo.alarm_status && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#fee', borderRadius: '8px', color: '#dc3545', fontWeight: '600' }}>
                    🚨 Alarm: {healthInfo.alarm_status}
                  </div>
                )}
                {healthInfo.last_measurement && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#999', textAlign: 'right' }}>
                    Cập nhật lúc: {new Date(healthInfo.last_measurement).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                Chưa có dữ liệu sức khỏe
              </p>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditPatientModal
          patient={patient}
          doctors={doctors}
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
                  <YAxis domain={[50, 120]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#e74c3c" 
                    strokeWidth={2} 
                    name="Nhịp tim"
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                    connectNulls={true}
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
                  <YAxis domain={[85, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="spo2" 
                    stroke="#3498db" 
                    strokeWidth={2} 
                    name="SpO2"
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                    connectNulls={true}
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
                  <YAxis domain={[35, 40]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#2ecc71" 
                    strokeWidth={2} 
                    name="Nhiệt độ"
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                    connectNulls={true}
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
function EditPatientModal({ patient, doctors, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: patient.full_name || '',
    birthday: patient.birthday ? new Date(patient.birthday).toISOString().split('T')[0] : '',
    address: patient.address || '',
    phone: patient.phone || '',
    room: patient.room || '',
    doctorId: patient.doctorId || '',
    deviceId: patient.deviceId || ''
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

          <div className="form-group">
            <label>Doctor: <span style={{ fontSize: '12px', color: '#999' }}>(Tùy chọn)</span></label>
            <select name="doctorId" value={formData.doctorId} onChange={handleChange}>
              {/* <option value="">-- Chọn bác sĩ phụ trách --</option> */}
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.full_name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Device ID: <span style={{ fontSize: '12px', color: '#999' }}>(Tùy chọn)</span></label>
            <input
              type="text"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              placeholder="ID thiết bị"
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
