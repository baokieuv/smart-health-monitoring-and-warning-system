import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createDoctor, getDoctorDetail, updateDoctor } from '../../../../../frontend/src/utils/api'
import routers from '../../../../../frontend/src/utils/routers'

const empty = { full_name: '', birthday: '', address: '', phone: '', specialization: '', password: '' }

export default function DoctorForm() {
  const { id } = useParams()
  const isCreate = id === undefined
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        try {
          const res = await getDoctorDetail(id)
          if (res?.status === 'success' && res?.data?.doctor) setForm(res.data.doctor)
        } catch (e) {
          setError(e?.response?.data?.message || 'Không tải được dữ liệu')
        }
      }
    }
    load()
  }, [id, isCreate])

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (isCreate) {
        const res = await createDoctor(payload)
        if (res?.status === 'success') navigate(routers.AdminDoctors)
      } else {
        const res = await updateDoctor(id, payload)
        if (res?.status === 'success') navigate(routers.AdminDoctors)
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Lưu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card header-actions">
        <Link className="btn ghost" to={routers.AdminDoctors}>← Quay lại</Link>
        <button className="btn" onClick={onSubmit} disabled={loading}>
          {isCreate ? '✓ Tạo mới' : '✓ Cập nhật'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, color: '#667eea' }}>{isCreate ? 'Thêm bác sĩ mới' : 'Cập nhật thông tin bác sĩ'}</h2>

        <div className="form" style={{ marginTop: 20 }}>
          {!isCreate && (
            <div className="field">
              <label>ID</label>
              <input value={id} disabled style={{ background: '#f5f5f5' }} />
            </div>
          )}
          <div className="field">
            <label>Họ và tên *</label>
            <input value={form.full_name} onChange={(e) => onChange('full_name', e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div className="field">
            <label>Ngày sinh (YYYY-MM-DD) *</label>
            <input value={form.birthday} onChange={(e) => onChange('birthday', e.target.value)} placeholder="1990-01-01" />
          </div>
          <div className="field">
            <label>Địa chỉ *</label>
            <input value={form.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Số 10, Đường ABC, Quận 1" />
          </div>
          <div className="field">
            <label>Số điện thoại *</label>
            <input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="0912345678" />
          </div>
          <div className="field">
            <label>Vị trí *</label>
            <input value={form.specialization} onChange={(e) => onChange('specialization', e.target.value)} placeholder="Bác sĩ" />
          </div>
          <div className="field">
            <label>Mật khẩu {isCreate ? '*' : '(để trống nếu không đổi)'}</label>
            <input type="password" value={form.password} onChange={(e) => onChange('password', e.target.value)} placeholder="••••••••" />
          </div>
        </div>

        {error && <div style={{ color: '#e5484d', marginTop: 16, padding: 12, background: '#ffebee', borderRadius: 8 }}>{error}</div>}
      </div>
    </div>
  )
}
