import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import routers from '../../../utils/routers'
import './AdminRoomList.css'

export default function AdminRoomList() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    setLoading(true)
    try {
      // TODO: Fetch from API
      // const res = await getRoomList()
      // setRooms(res.data.rooms)
      
      // Mock data for now
      setRooms([
        { id: 1, code: 'A301', floor: 3, building: 'A', capacity: 4, occupied: 2, status: 'available', patients: ['Nguyễn Văn A', 'Phạm Thị D'] },
        { id: 2, code: 'A302', floor: 3, building: 'A', capacity: 4, occupied: 3, status: 'available', patients: ['Trần Thị B'] },
        { id: 3, code: 'B201', floor: 2, building: 'B', capacity: 2, occupied: 1, status: 'available', patients: ['Lê Văn C'] },
        { id: 4, code: 'B202', floor: 2, building: 'B', capacity: 2, occupied: 1, status: 'available', patients: ['Hoàng Văn E'] },
        { id: 5, code: 'C101', floor: 1, building: 'C', capacity: 6, occupied: 6, status: 'full', patients: [] },
      ])
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status, occupied, capacity) => {
    if (status === 'full' || occupied >= capacity) {
      return { text: '🔴 Full', class: 'status-full' }
    }
    if (occupied === 0) {
      return { text: '🟢 Empty', class: 'status-empty' }
    }
    return { text: '🟡 Available', class: 'status-available' }
  }

  const handleDelete = async (roomId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) return
    
    try {
      // TODO: Call API to delete room
      // await deleteRoom(roomId)
      alert('Xóa phòng thành công')
      loadRooms()
    } catch (error) {
      alert('Xóa phòng thất bại')
    }
  }

  return (
    <div className="admin-room-list">
      <div className="room-list-header">
        <h2 style={{ marginTop: 0, marginBottom: 20, color: '#333' }}>🏥 Rooms List</h2>
        <Link to={routers.AdminRoomCreate} className="btn primary">+ Add Room</Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Room Code</th>
              <th>Building</th>
              <th>Floor</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => {
              const badge = getStatusBadge(room.status, room.occupied, room.capacity)
              return (
                <tr key={room.id}>
                  <td>{index + 1}</td>
                  <td><strong>{room.code}</strong></td>
                  <td>Building {room.building}</td>
                  <td>Floor {room.floor}</td>
                  <td>{room.capacity}</td>
                  <td>{room.occupied}</td>
                  <td>
                    <span className={`badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </td>
                  <td>
                    <Link 
                      className="btn ghost" 
                      to={routers.AdminRoomDetail(room.code)}
                    >
                      👁️ View
                    </Link>
                    {' '}
                    <button 
                      className="btn danger" 
                      onClick={() => handleDelete(room.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
            {rooms.length === 0 && !loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 16, color: '#999' }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <div style={{ marginTop: 8, color: '#999' }}>Đang tải…</div>}
    </div>
  )
}
