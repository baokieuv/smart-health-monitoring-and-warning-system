import React from 'react'

export default function ChartPlaceholder({ data = [], height = 220 }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ height, border: '1px dashed var(--border)', borderRadius: 8 }} />
  }

  const w = 500
  const h = height
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = w / Math.max(1, data.length - 1)
  const points = data
    .map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 10) - 5}`)
    .join(' ')

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
      <polyline fill="none" stroke="var(--primary)" strokeWidth="3" points={points} />
    </svg>
  )
}
