import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './RoomList.css'

export default function RoomList() {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    // TODO: Fetch from API
    setRooms([
      { id: 1, code: 'A301', floor: 3, building: 'A', capacity: 4, occupied: 2, status: 'available' },
      { id: 2, code: 'A302', floor: 3, building: 'A', capacity: 4, occupied: 3, status: 'available' },
      { id: 3, code: 'B201', floor: 2, building: 'B', capacity: 2, occupied: 1, status: 'available' },
      { id: 4, code: 'B202', floor: 2, building: 'B', capacity: 2, occupied: 1, status: 'available' },
      { id: 5, code: 'C101', floor: 1, building: 'C', capacity: 6, occupied: 6, status: 'full' },
    ])
  }, [])

  const getStatusBadge = (status, occupied, capacity) => {
    if (status === 'full' || occupied >= capacity) {
      return { text: '🔴 Full', class: 'status-full' }
    }
    if (occupied === 0) {
      return { text: '🟢 Empty', class: 'status-empty' }
    }
    return { text: '🟡 Available', class: 'status-available' }
  }

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <h2>🏥 Rooms List</h2>
      </div>

      <div className="table-container">
        <table className="room-table">
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
                    <Link to={`/rooms/${room.code}`} className="btn-view">
                      👁️ View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
