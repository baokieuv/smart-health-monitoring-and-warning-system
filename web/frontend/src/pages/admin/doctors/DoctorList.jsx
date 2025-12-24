import React, { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { getDoctorList, getDoctorSpecializations, getToken, createDoctor } from '../../../../../frontend/src/utils/api'
import routers from '../../../../../frontend/src/utils/routers'
import Pagination from '../../../components/Pagination'
import AddDoctorModal from './AddDoctorModal'

export default function DoctorList() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ doctors: [], page: 1, limit: 10, total: 0, total_pages: 0 })
  const [positionOptions, setPositionOptions] = useState(['Bác sĩ', 'Trưởng khoa', 'Điều dưỡng'])
  const [retryAfterSec, setRetryAfterSec] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const page = Number(params.get('page') || 1)
  const limit = Number(params.get('limit') || 10)
  const search = params.get('search') || ''
  const specialization = params.get('specialization') || ''

  const load = async () => {
    // Check if user is authenticated
    const token = getToken()
    if (!token) {
      console.error('No access token found')
      setError('Bạn chưa đăng nhập. Vui lòng đăng nhập.')
      setTimeout(() => navigate(routers.Login), 2000)
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const res = await getDoctorList({ page, limit, search, specialization })
      console.log('API Response:', res) // Debug log
      if (res?.status === 'success' && res?.data) {
        setData(res.data)
        // Extract unique specializations from real data
        const uniq = Array.from(new Set(res.data.items?.map((d) => d.specialization).filter(Boolean)))
        if (uniq.length) setPositionOptions(uniq)
      } else {
        console.log('Using mock data - no valid response')
        setData(mockDoctors(page, limit, search, specialization))
      }
    } catch (e) {
      console.error('Load doctors error:', e)
      
      // Handle authentication error
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        // Don't use mock data for auth errors - show error instead
        setData({ doctors: [], page: 1, limit: 10, total: 0, total_pages: 0 })
      } else if (e?.response?.status === 429) {
        const sec = e.rateLimit?.retryAfter || 30
        setRetryAfterSec(sec)
        setError(`Bạn thao tác quá nhanh. Vui lòng thử lại sau ${sec} giây.`)
        setData(mockDoctors(page, limit, search, specialization))
      } else {
        console.log('Using mock data - error occurred')
        setError('Không thể kết nối server. Hiển thị dữ liệu demo.')
        setData(mockDoctors(page, limit, search, specialization))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, specialization])

  const changeParam = (obj) => {
    const next = new URLSearchParams(params)
    Object.entries(obj).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k)
      else next.set(k, String(v))
    })
    setParams(next, { replace: true })
  }

  const handleAddDoctor = async (doctorData) => {
    try {
      console.log('Creating doctor with data:', doctorData)
      const res = await createDoctor(doctorData)
      console.log('Create doctor response:', res)
      if (res?.status === 'success') {
        setShowAddModal(false)
        load() // Reload list
        alert('Thêm bác sĩ thành công!')
      }
    } catch (e) {
      console.error('Add doctor error:', e)
      console.error('Error status:', e?.response?.status)
      console.error('Error data:', e?.response?.data)
      const msg = e?.response?.data?.message || 'Không thể thêm bác sĩ'
      alert(msg)
      throw e // Let modal handle error
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#333' }}>Doctors List</h2>
        <button className="btn primary" onClick={() => setShowAddModal(true)}>
          ➕ Add Doctor
        </button>
      </div>
      
      <div className="toolbar">
        <div className="filters">
          <select value={specialization} onChange={(e) => changeParam({ specialization: e.target.value, page: 1 })}>
            <option value="">Tất cả vị trí</option>
            {positionOptions.map((sp) => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {/* Debug info
        <div style={{ padding: '8px', background: '#f0f0f0', fontSize: '12px', marginBottom: '8px' }}>
          Total: {data.total} | Doctors count: {data.doctors?.length || 0} | Page: {data.page}/{data.total_pages}
        </div> */}
        
        <table className="table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Full Name</th>
              <th>CCCD</th>
              <th>Position</th>
              <th>Phone</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((d, index) => (
              <tr key={d._id || d.id}>
                <td>{(page - 1) * limit + index + 1}</td>
                <td>{d.full_name}</td>
                <td>{d.cccd}</td>
                <td>{d.position || d.specialization}</td>
                <td>{d.phone}</td>
                <td>
                  <Link className="btn ghost" to={routers.AdminDoctorDetail(d._id || d.id)} style={{ padding: '6px 12px', fontSize: 14 }}>👁️ View</Link>
                </td>
              </tr>
            ))}
            {data.items?.length === 0 && !loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#999' }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={data.total_pages || 1}
        onChange={(p) => changeParam({ page: p })}
      />

      {loading && <div style={{ marginTop: 8, color: '#999' }}>Đang tải…</div>}
      {error && (
        <div style={{ marginTop: 8, color: '#e5484d' }}>
          {error}
          {retryAfterSec && (
            <button className="btn ghost" style={{ marginLeft: 8 }} onClick={load}>Thử lại</button>
          )}
        </div>
      )}

      {showAddModal && (
        <AddDoctorModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddDoctor}
        />
      )}
    </div>
  )
}

function mockDoctors(page = 1, limit = 10, search = '', specialization = '') {
  const mockMongoIds = [
    '60d5ec49f1b2c72b8c8e4a1a',
    '60d5ec49f1b2c72b8c8e4a1b', 
    '60d5ec49f1b2c72b8c8e4a1c',
    '60d5ec49f1b2c72b8c8e4a1d',
    '60d5ec49f1b2c72b8c8e4a1e',
    '60d5ec49f1b2c72b8c8e4a1f',
    '60d5ec49f1b2c72b8c8e4a20',
    '60d5ec49f1b2c72b8c8e4a21'
  ]
  const all = Array.from({ length: 8 }).map((_, i) => ({
    _id: mockMongoIds[i],
    id: i + 1,
    userId: mockMongoIds[i],
    full_name: `Bác sĩ Demo ${i + 1}`,
    birthday: `198${(i % 10)}-0${(i % 9) + 1}-1${(i % 9)}`,
    address: `Số ${i + 10}, Đường Demo, Quận ${(i % 10) + 1}`,
    phone: `09${(i % 10)}${(1000000 + i).toString().slice(0,7)}`,
    department: ['Khoa Nội', 'Khoa Ngoại', 'Khoa Nhi', 'Khoa Sản'][i % 4],
    position: ['Bác sĩ', 'Trưởng khoa', 'Điều dưỡng'][i % 3],
    specialization: ['Bác sĩ', 'Trưởng khoa', 'Điều dưỡng'][i % 3],
  }))

  const filtered = all.filter((d) => {
    const bySearch = !search || d.full_name.toLowerCase().includes(search.toLowerCase())
    const byPos = !specialization || d.specialization === specialization
    return bySearch && byPos
  })
  const total = filtered.length
  const total_pages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const doctors = filtered.slice(start, start + limit)
  return { doctors, page, limit, total, total_pages }
}
