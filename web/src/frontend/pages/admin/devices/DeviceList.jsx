import React, { useState, useEffect } from 'react'
import { api } from '../../../utils/api'
import './DeviceList.scss'

const DeviceList = () => {
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    inUse: 0,
    available: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInUseOnly, setShowInUseOnly] = useState(false)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/api/v1/admin/devices', {
        params: { page: 1, limit: 100 }
      })
      
      console.log('Devices response:', response.data)
      const deviceData = response.data?.data?.devices || []
      setDevices(deviceData)
      
      // Calculate stats - device is in use if it has both doctor and patient
      const connected = deviceData.filter(d => d.doctor && d.patient).length
      setStats({
        total: deviceData.length,
        inUse: connected,
        available: deviceData.length - connected
      })
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError(err.response?.data?.message || 'Không thể tải danh sách thiết bị. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const filteredDevices = showInUseOnly 
    ? devices.filter(d => d.doctor && d.patient)
    : devices

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="device-list-page">
      <h2>📱 Device Management</h2>
      
      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Số thiết bị đang hoạt động</p>
          </div>
        </div>
        
        <div className="stat-card in-use">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.inUse}</h3>
            <p>Đang kết nối</p>
          </div>
        </div>
        
        {/* <div className="stat-card available">
          <div className="stat-icon">🔓</div>
          <div className="stat-info">
            <h3>{stats.available}</h3>
            <p>Chưa kết nối</p>
          </div>
        </div> */}
      </div>

      {/* Filter Toggle */}
      <div className="filter-section">
        <button 
          className={`filter-btn ${!showInUseOnly ? 'active' : ''}`}
          onClick={() => setShowInUseOnly(false)}
        >
          Tất cả ({stats.total})
        </button>
        <button 
          className={`filter-btn ${showInUseOnly ? 'active' : ''}`}
          onClick={() => setShowInUseOnly(true)}
        >
          Đang kết nối ({stats.inUse})
        </button>
      </div>

      {/* Devices Table */}
      <div className="table-container">
        <table className="device-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên thiết bị</th>
              <th>ThingsBoard ID</th>
              <th>Bác sĩ phụ trách</th>
              <th>Bệnh nhân sử dụng</th>
              {/* <th>Trạng thái</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  {showInUseOnly ? 'Không có thiết bị nào đang được kết nối' : 'Không có thiết bị nào'}
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, index) => (
                <tr key={device.device_id}>
                  <td>{index + 1}</td>
                  <td className="device-name">
                    <strong>{device.device_name || 'Unnamed Device'}</strong>
                  </td>
                  <td className="device-id">
                    <code style={{ fontSize: '11px', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                      {device.thingsboard_device_id}
                    </code>
                  </td>
                  <td>
                    {device.doctor ? (
                      <div className="doctor-info">
                        <div><strong>{device.doctor.name}</strong></div>
                        <div className="sub-info" style={{ fontSize: '12px', color: '#666' }}>
                          {device.doctor.specialization}
                        </div>
                        <div className="sub-info" style={{ fontSize: '11px', color: '#999' }}>
                          CCCD: {device.doctor.cccd}
                        </div>
                      </div>
                    ) : (
                      <span className="not-assigned" style={{ color: '#999', fontStyle: 'italic' }}>Chưa gán</span>
                    )}
                  </td>
                  <td>
                    {device.patient ? (
                      <div className="patient-info">
                        <div><strong>{device.patient.name}</strong></div>
                        <div className="sub-info" style={{ fontSize: '12px', color: '#666' }}>
                          CCCD: {device.patient.cccd}
                        </div>
                        <div className="sub-info" style={{ fontSize: '11px', color: '#999' }}>
                          Phòng {device.patient.room}
                        </div>
                      </div>
                    ) : (
                      <span className="not-assigned" style={{ color: '#999', fontStyle: 'italic' }}>Chưa gán</span>
                    )}
                  </td>
                  {/* <td>
                    {device.doctor && device.patient ? (
                      <span className="status in-use" style={{ 
                        background: '#d4edda', 
                        color: '#155724', 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>✅ Đang kết nối</span>
                    ) : (
                      <span className="status disconnected" style={{ 
                        background: '#f8d7da', 
                        color: '#721c24', 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>⚠️ Chưa kết nối</span>
                    )}
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DeviceList
