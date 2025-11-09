import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Notes.css'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = () => {
    // TODO: Fetch from API
    // Mock data - bệnh nhân đã được xử lý từ alerts
    setNotes([
      { 
        id: 101, 
        name: 'Nguyễn Thị X', 
        cccd: '111222333', 
        room: 'A301',
        completedAt: '2025-11-01 14:30',
        doctorName: 'BS. Nguyễn Văn Minh',
        treatmentNote: 'Đã xử lý cấp cứu do sốt cao 39°C. Tiêm hạ sốt, truyền dịch bồi phụ. Tình trạng ổn định, tiếp tục theo dõi.'
      },
      { 
        id: 102, 
        name: 'Trần Văn Y', 
        cccd: '444555666', 
        room: 'B201',
        completedAt: '2025-11-01 16:45',
        doctorName: 'BS. Lê Thị Hoa',
        treatmentNote: 'Bệnh nhân đau ngực, khó thở. Đã tiêm thuốc giảm đau, cho uống thuốc theo đơn. Cần theo dõi thêm 24h.'
      },
      { 
        id: 103, 
        name: 'Lê Thị Z', 
        cccd: '777888999', 
        room: 'A302',
        completedAt: '2025-11-02 08:15',
        doctorName: 'BS. Nguyễn Văn Minh',
        treatmentNote: 'Xử lý hạ sốt cho bệnh nhân sốt 38.5°C. Đã cho thuốc hạ sốt Paracetamol 500mg, kê đơn thuốc về nhà.'
      },
    ])
  }

  // const handleDelete = (noteId) => {
  //   if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return
    
  //   // TODO: Call API to delete note
  //   setNotes(notes.filter(note => note.id !== noteId))
  //   alert('Đã xóa ghi chú')
  // }

  const filteredNotes = notes.filter(note => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      note.name.toLowerCase().includes(term) ||
      note.cccd.includes(term) ||
      note.room.toLowerCase().includes(term)
    )
  })

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h2>📝 Medical Notes</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by name, ID, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="notes-stats">
        <div className="stat-card">
          <div className="stat-number">{notes.length}</div>
          <div className="stat-label">Total processed cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {notes.filter(n => {
              const today = new Date().toISOString().split('T')[0]
              return n.completedAt.startsWith(today)
            }).length}
          </div>
          <div className="stat-label">Processed today</div>
        </div>
      </div>

      <div className="table-container">
        <table className="notes-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Time</th>
              <th>Name</th>
              <th>ID</th>
              <th>Room</th>
              <th>Doctor</th>
              <th>Treatment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map((note, index) => (
              <tr key={note.id}>
                <td>{index + 1}</td>
                <td>
                  <small>{note.completedAt}</small>
                </td>
                <td><strong>{note.name}</strong></td>
                <td>{note.cccd}</td>
                <td>
                  <Link to={`/rooms/${note.room}`} className="room-link">
                    {note.room}
                  </Link>
                </td>
                <td>{note.doctorName}</td>
                <td>
                  <div className="note-text">{note.treatmentNote}</div>
                </td>
                <td>
                  <Link 
                    to={`/patients/${note.id}`} 
                    className="btn-view"
                  >
                    👁️ View
                  </Link>
                </td>
              </tr>
            ))}
            {filteredNotes.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có ghi chú nào'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredNotes.length > 0 && (
        <div className="notes-footer">
          <p>Hiển thị {filteredNotes.length} / {notes.length} ghi chú</p>
        </div>
      )}
    </div>
  )
}
