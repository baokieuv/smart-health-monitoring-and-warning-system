import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createDoctor, getDoctorDetail, updateDoctor } from '../../../utils/api'
import routers from '../../../utils/routers'
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
          if (res?.status === 'success' && res?.doctor) setForm(res.doctor)
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
      <div className="card header-actions" style={{ marginBottom: 12 }}>
        <Link className="btn ghost" to={routers.AdminDoctors}>Quay lại</Link>
        <button className="btn" onClick={onSubmit} disabled={loading}>{isCreate ? 'Tạo mới' : 'Cập nhật'}</button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>{isCreate ? 'Thêm bác sĩ' : 'Cập nhật bác sĩ'}</h2>

        <div className="form" style={{ marginTop: 8 }}>
          {!isCreate && (
            <div className="field">
              <label>ID</label>
              <input value={id} disabled />
            </div>
          )}
          <div className="field">
            <label>Họ và tên</label>
            <input value={form.full_name} onChange={(e) => onChange('full_name', e.target.value)} />
          </div>
          <div className="field">
            <label>Ngày sinh (YYYY-MM-DD)</label>
            <input value={form.birthday} onChange={(e) => onChange('birthday', e.target.value)} />
          </div>
          <div className="field">
            <label>Địa chỉ</label>
            <input value={form.address} onChange={(e) => onChange('address', e.target.value)} />
          </div>
          <div className="field">
            <label>Số điện thoại</label>
            <input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
          </div>
          <div className="field">
            <label>Vị trí</label>
            <input value={form.specialization} onChange={(e) => onChange('specialization', e.target.value)} />
          </div>
          <div className="field">
            <label>Mật khẩu {isCreate ? '' : '(để trống nếu không đổi)'} </label>
            <input type="password" value={form.password} onChange={(e) => onChange('password', e.target.value)} />
          </div>
        </div>

        {error && <div style={{ color: '#e5484d', marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  )
}
