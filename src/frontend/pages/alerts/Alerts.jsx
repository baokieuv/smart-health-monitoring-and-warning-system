import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Alerts.css'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all') // all, urgent, receiving
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = () => {
    // TODO: Fetch from API
    // Mock data - chỉ lấy bệnh nhân có status warning
    setAlerts([
      { 
        id: 2, 
        name: 'Trần Thị B', 
        cccd: '987654321', 
        gender: 'Nữ', 
        age: 52, 
        phone: '0923456789', 
        room: 'A302',
        alertStatus: 'urgent', // urgent, receiving
        timestamp: '2025-11-02 08:30'
      },
      { 
        id: 3, 
        name: 'Lê Văn C', 
        cccd: '456789123', 
        gender: 'Nam', 
        age: 38, 
        phone: '0934567890', 
        room: 'B201',
        alertStatus: 'urgent',
        timestamp: '2025-11-02 09:15'
      },
      { 
        id: 5, 
        name: 'Hoàng Văn E', 
        cccd: '654321789', 
        gender: 'Nam', 
        age: 29, 
        phone: '0956789012', 
        room: 'B202',
        alertStatus: 'receiving',
        timestamp: '2025-11-02 07:45'
      },
    ])
  }

  const getStatusBadge = (status) => {
    const badges = {
      warning: { text: '⚠️ Cảnh báo', class: 'status-warning' }
    }
    return badges[status] || badges.warning
  }

  const getAlertStatusBadge = (alertStatus) => {
    const badges = {
      urgent: { text: '🚨 Warning', class: 'alert-urgent' },
      receiving: { text: '🔵 Processing', class: 'alert-processing' }
    }
    return badges[alertStatus] || badges.urgent
  }

  const handleReceive = (alertId) => {
    // TODO: Call API to update alert status
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, alertStatus: 'receiving' }
        : alert
    ))
    alert('Đã chuyển sang trạng thái "Đang tiếp nhận"')
  }

  const handleComplete = async (alertId) => {
    const alertItem = alerts.find(a => a.id === alertId)
    setSelectedAlert(alertItem)
    setShowNoteModal(true)
  }

  const handleSaveNote = async (treatmentNote) => {
    try {
      // TODO: Call API to move to notes with treatment note
      const completedAlert = {
        ...selectedAlert,
        treatmentNote,
        doctorName: 'BS. Nguyễn Văn Minh', // TODO: Get from logged in user
        completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
      
      console.log('Moving to notes:', completedAlert)
      
      // Remove from alerts
      setAlerts(alerts.filter(alert => alert.id !== selectedAlert.id))
      
      setShowNoteModal(false)
      setSelectedAlert(null)
      alert('Đã hoàn thành xử lý. Bệnh nhân đã được chuyển sang Ghi chú.')
    } catch (error) {
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.alertStatus === filter)

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h2>🚨 Alerts List</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All ({alerts.length})
          </button>
          <button 
            className={filter === 'urgent' ? 'active' : ''} 
            onClick={() => setFilter('urgent')}
          >
            Warning ({alerts.filter(a => a.alertStatus === 'urgent').length})
          </button>
          <button 
            className={filter === 'receiving' ? 'active' : ''} 
            onClick={() => setFilter('receiving')}
          >
            Processing ({alerts.filter(a => a.alertStatus === 'receiving').length})
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Time</th>
              <th>Name</th>
              <th>CCCD</th>
              <th>Room</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alertItem, index) => {
         //      const badge = getStatusBadge(alertItem.status)
              const alertBadge = getAlertStatusBadge(alertItem.alertStatus)
              return (
                <tr key={alertItem.id} className={`row-${alertItem.status}`}>
                  <td>{index + 1}</td>
                  <td><small>{alertItem.timestamp}</small></td>
                  <td><strong>{alertItem.name}</strong></td>
                  <td>{alertItem.cccd}</td>
                  {/* <td>
                    <span className={`badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </td> */}
                  <td>
                    <Link to={`/rooms/${alertItem.room}`} className="room-link">
                      {alertItem.room}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${alertBadge.class}`}>
                      {alertBadge.text}
                    </span>
                  </td>
                  <td>
                    {alertItem.alertStatus === 'urgent' ? (
                      <button 
                        className="btn-receive"
                        onClick={() => handleReceive(alertItem.id)}
                      >
                        📥 Process
                      </button>
                    ) : (
                      <button 
                        className="btn-complete"
                        onClick={() => handleComplete(alertItem.id)}
                      >
                        ✅ Done
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredAlerts.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  Không có cảnh báo nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Treatment Note Modal */}
      {showNoteModal && selectedAlert && (
        <TreatmentNoteModal
          patient={selectedAlert}
          onSave={handleSaveNote}
          onClose={() => {
            setShowNoteModal(false)
            setSelectedAlert(null)
          }}
        />
      )}
    </div>
  )
}

// Treatment Note Modal Component
function TreatmentNoteModal({ patient, onSave, onClose }) {
  const [treatmentNote, setTreatmentNote] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!treatmentNote.trim()) {
      alert('Vui lòng nhập phương pháp điều trị')
      return
    }
    onSave(treatmentNote)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>✅ Treatment Note</h3>
        <div className="patient-info">
          <p><strong>Patient:</strong> {patient.name}</p>
          <p><strong>ID Card:</strong> {patient.cccd}</p>
          <p><strong>Room:</strong> {patient.room}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Treatment Method: <span className="required">*</span></label>
            <textarea
              value={treatmentNote}
              onChange={(e) => setTreatmentNote(e.target.value)}
              rows="5"
              placeholder="Nhập mô tả chi tiết về phương pháp điều trị, thuốc sử dụng, kết quả..."
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-primary">Confirm</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
