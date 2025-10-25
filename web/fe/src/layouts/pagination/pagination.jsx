import React from 'react'
import './pagination.scss'

export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  const prev = () => onChange?.(Math.max(1, page - 1))
  const next = () => onChange?.(Math.min(totalPages, page + 1))
  return (
    <div className="pagination">
      <button className="btn ghost" disabled={page <= 1} onClick={prev}>Trang trước</button>
      <div className="stats">Trang {page} / {Math.max(1, totalPages || 1)}</div>
      <button className="btn ghost" disabled={page >= (totalPages || 1)} onClick={next}>Trang sau</button>
    </div>
  )
}
