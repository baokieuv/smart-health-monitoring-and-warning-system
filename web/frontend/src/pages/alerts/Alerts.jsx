import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Alerts.css';
import { useSocket } from '../../contexts/SocketContext';

export default function Alerts() {
  const { notifications, markAsRead, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('all'); // all, CRITICAL, WARNING, INFO

  // Get filtered notifications
  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.severity === filter);
  };

  const filteredNotifications = getFilteredNotifications();

  // Get last alert timestamp
  const getLastAlertTime = () => {
    if (notifications.length === 0) return null;
    
    // Find the most recent notification
    const latestNotification = notifications.reduce((latest, current) => {
      return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
    }, notifications[0]);
    
    const date = new Date(latestNotification.timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get severity badge
  const getSeverityBadge = (severity) => {
    const badges = {
      CRITICAL: { text: ' CRITICAL', class: 'severity-critical', color: '#dc3545' },
      WARNING: { text: ' WARNING', class: 'severity-warning', color: '#ffc107' },
      INFO: { text: 'ℹ INFO', class: 'severity-info', color: '#17a2b8' }
    };
    return badges[severity] || badges.INFO;
  };

  // Handle notification click - mark as read and navigate to patient detail
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.patient?.id) {
      navigate(`/patients/${notification.patient.id}`);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h2> Alert List</h2>
        <div className="alerts-actions">
          <button 
            className="btn-clear-all"
            onClick={clearNotifications}
            disabled={notifications.length === 0}
          >
            Delete All Alerts
          </button>
        </div>
      </div>

      {/* Last alert timestamp */}
      {notifications.length > 0 && (
        <div className="last-alert-time">
          Last alerts sent: <span className="timestamp">{getLastAlertTime()}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({notifications.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'CRITICAL' ? 'active' : ''}`}
          onClick={() => setFilter('CRITICAL')}
        >
          Critical ({notifications.filter(n => n.severity === 'CRITICAL').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'WARNING' ? 'active' : ''}`}
          onClick={() => setFilter('WARNING')}
        >
          Warning ({notifications.filter(n => n.severity === 'WARNING').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'INFO' ? 'active' : ''}`}
          onClick={() => setFilter('INFO')}
        >
          Info ({notifications.filter(n => n.severity === 'INFO').length})
        </button>
      </div>

      {/* Notifications list */}
      <div className="alerts-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <p>Không có cảnh báo nào</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const badge = getSeverityBadge(notification.severity);
            return (
              <div 
                key={notification.id}
                className={`alert-card ${notification.read ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: 'pointer' }}
              >
                <div className="alert-card-header">
                  <span className={`severity-badge ${badge.class}`} style={{ backgroundColor: badge.color }}>
                    {badge.text}
                  </span>
                  <span className="alert-time">{formatTimestamp(notification.timestamp)}</span>
                </div>

                <div className="alert-card-body">
                  <h3 className="alert-title">{notification.alarmType.replace(/_/g, ' ')}</h3>
                  
                  <div className="patient-info">
                    <div className="info-row">
                      <span className="info-label">Bệnh nhân:</span>
                      <span className="info-value">{notification.patient?.full_name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">CCCD:</span>
                      <span className="info-value">{notification.patient?.cccd}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phòng:</span>
                      <span className="info-value">{notification.patient?.room || 'N/A'}</span>
                    </div>
                  </div>

                  {notification.data && (
                    <div className="vital-signs">
                      {notification.data.heart_rate && (
                        <div className="vital-item">
                          <span className="vital-label"> Nhịp tim:</span>
                          <span className="vital-value">{notification.data.heart_rate} bpm</span>
                        </div>
                      )}
                      {notification.data.SpO2 && (
                        <div className="vital-item">
                          <span className="vital-label"> SpO2:</span>
                          <span className="vital-value">{notification.data.SpO2}%</span>
                        </div>
                      )}
                      {notification.data.temperature && (
                        <div className="vital-item">
                          <span className="vital-label"> Nhiệt độ:</span>
                          <span className="vital-value">{notification.data.temperature}C</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!notification.read && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
