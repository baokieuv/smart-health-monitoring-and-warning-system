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
      
      const deviceData = response.data?.data?.devices || []
      setDevices(deviceData)
      
      // Calculate stats
      const inUse = deviceData.filter(d => d.doctor && d.patient).length
      setStats({
        total: deviceData.length,
        inUse: inUse,
        available: deviceData.length - inUse
      })
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError('Không thể tải danh sách thiết bị. Vui lòng thử lại.')
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
      <h2>📱 Quản Lý Thiết Bị</h2>
      
      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Tổng số thiết bị</p>
          </div>
        </div>
        
        <div className="stat-card in-use">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.inUse}</h3>
            <p>Đang sử dụng</p>
          </div>
        </div>
        
        <div className="stat-card available">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.available}</h3>
            <p>Còn trống</p>
          </div>
        </div>
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
          Đang sử dụng ({stats.inUse})
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
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  {showInUseOnly ? 'Không có thiết bị nào đang được sử dụng' : 'Không có thiết bị nào'}
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, index) => (
                <tr key={device.device_id}>
                  <td>{index + 1}</td>
                  <td className="device-name">
                    <strong>{device.device_name}</strong>
                  </td>
                  <td className="device-id">{device.thingsboard_device_id}</td>
                  <td>
                    {device.doctor ? (
                      <div className="doctor-info">
                        <div><strong>{device.doctor.name}</strong></div>
                        <div className="sub-info">CCCD: {device.doctor.cccd}</div>
                        <div className="sub-info">📞 {device.doctor.phone}</div>
                      </div>
                    ) : (
                      <span className="not-assigned">Chưa gán</span>
                    )}
                  </td>
                  <td>
                    {device.patient ? (
                      <div className="patient-info">
                        <div><strong>{device.patient.name}</strong></div>
                        <div className="sub-info">CCCD: {device.patient.cccd}</div>
                        <div className="sub-info">Phòng: {device.patient.room}</div>
                      </div>
                    ) : (
                      <span className="not-assigned">Chưa gán</span>
                    )}
                  </td>
                  <td>
                    {device.doctor && device.patient ? (
                      <span className="status in-use">Đang sử dụng</span>
                    ) : (
                      <span className="status available">Còn trống</span>
                    )}
                  </td>
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
