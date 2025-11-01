import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteDoctor, exportDoctorReport, getDoctorList, getDoctorSpecializations } from '../../../utils/api'
import routers from '../../../utils/routers'
import Pagination from '../../../elements/Pagination'

export default function DoctorList() {
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ doctors: [], page: 1, limit: 10, total: 0, total_pages: 0 })
  const [positionOptions, setPositionOptions] = useState(['Bác sĩ', 'Trưởng khoa', 'Điều dưỡng'])
  const [retryAfterSec, setRetryAfterSec] = useState(null)

  const page = Number(params.get('page') || 1)
  const limit = Number(params.get('limit') || 10)
  const search = params.get('search') || ''
  const specialization = params.get('specialization') || ''

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDoctorList({ page, limit, search, specialization })
      if (res?.status === 'success') setData(res.data)
      else {
        setData(mockDoctors(page, limit, search, specialization))
      }
      try {
        const sp = await getDoctorSpecializations()
        if (Array.isArray(sp?.data)) setPositionOptions(sp.data)
      } catch (e) {
        const uniq = Array.from(new Set(res?.data?.doctors?.map((d) => d.specialization).filter(Boolean)))
        if (uniq.length) setPositionOptions(uniq)
      }
    } catch (e) {
      if (e?.response?.status === 429) {
        const sec = e.rateLimit?.retryAfter || 30
        setRetryAfterSec(sec)
        setError(`Bạn thao tác quá nhanh. Vui lòng thử lại sau ${sec} giây.`)
      } else {
        setData(mockDoctors(page, limit, search, specialization))
        setError('Đang hiển thị dữ liệu demo')
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

  const onDelete = async (id) => {
    if (!window.confirm('Xóa bác sĩ này?')) return
    try {
      await deleteDoctor(id)
      load()
    } catch (e) {
      alert(e?.response?.data?.message || 'Xóa thất bại')
    }
  }

  const onExport = async () => {
    try {
      const res = await exportDoctorReport({ page, limit, search, specialization })
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'doctors_report.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e?.response?.data?.message || 'Endpoint xuất báo cáo chưa sẵn sàng.')
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20, color: '#333' }}>Danh sách bác sĩ</h2>
      
      <div className="toolbar">
        <div className="filters">
          <select value={specialization} onChange={(e) => changeParam({ specialization: e.target.value, page: 1 })}>
            <option value="">Tất cả vị trí</option>
            {positionOptions.map((sp) => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
        <div>
          <Link to={routers.AdminDoctorCreate} className="btn">+ Thêm bác sĩ</Link>
          <button className="btn secondary" style={{ marginLeft: 8 }} onClick={onExport}>Xuất báo cáo</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ và tên</th>
              <th>Ngày sinh</th>
              <th>Địa chỉ</th>
              <th>Điện thoại</th>
              <th>Vị trí</th>
              <th style={{ width: 180 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.doctors?.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.full_name}</td>
                <td>{d.birthday}</td>
                <td>{d.address}</td>
                <td>{d.phone}</td>
                <td>{d.specialization}</td>
                <td>
                  <Link className="btn ghost" to={routers.AdminDoctorDetail(d.id)} style={{ marginRight: 8, padding: '6px 12px', fontSize: 14 }}>Sửa</Link>
                  <button className="btn danger" onClick={() => onDelete(d.id)} style={{ padding: '6px 12px', fontSize: 14 }}>Xóa</button>
                </td>
              </tr>
            ))}
            {data.doctors?.length === 0 && !loading && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 16, color: '#999' }}>Không có dữ liệu</td></tr>
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
    </div>
  )
}

function mockDoctors(page = 1, limit = 10, search = '', specialization = '') {
  const all = Array.from({ length: 42 }).map((_, i) => ({
    id: i + 1,
    full_name: `Bác sĩ Demo ${i + 1}`,
    birthday: `198${(i % 10)}-0${(i % 9) + 1}-1${(i % 9)}`,
    address: `Số ${i + 10}, Đường Demo, Quận ${(i % 10) + 1}`,
    phone: `09${(i % 10)}${(1000000 + i).toString().slice(0,7)}`,
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
