import React from 'react'

export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  const prev = () => onChange?.(Math.max(1, page - 1))
  const next = () => onChange?.(Math.min(totalPages, page + 1))
  
  return (
    <div className="pagination">
      <button 
        className="btn ghost" 
        disabled={page <= 1} 
        onClick={prev}
        style={{ opacity: page <= 1 ? 0.5 : 1 }}
      >
        ← Trang trước
      </button>
      <div className="stats" style={{ fontWeight: 600, color: '#666' }}>
        Trang {page} / {Math.max(1, totalPages || 1)}
      </div>
      <button 
        className="btn ghost" 
        disabled={page >= (totalPages || 1)} 
        onClick={next}
        style={{ opacity: page >= (totalPages || 1) ? 0.5 : 1 }}
      >
        Trang sau →
      </button>
    </div>
  )
}
