import React from 'react'

const STATUS_COLOR_MAP = {
  placed: 'badge-warning',
  preparing: 'badge-info',
  ready: 'badge-primary',
  delivered: 'badge-success',
  rejected: 'badge-error',
  cancelled: 'badge-error',
  'pending-payment': 'badge-ghost',
}

function getStatusBadgeClass(status) {
  const s = String(status || '').trim().toLowerCase()
  return STATUS_COLOR_MAP[s] || 'badge-ghost'
}

function formatStatusLabel(status) {
  const s = String(status || '').trim().toLowerCase().replace(/[-_]/g, ' ')
  return s.replace(/\b\w/g, (ch) => ch.toUpperCase())
}

export default function OrderStatusBadge({ status, size = '', className = '' }) {
  const colorClass = getStatusBadgeClass(status)
  const label = formatStatusLabel(status)

  return (
    <span className={`badge ${colorClass} ${size} ${className}`.trim()}>
      {label}
    </span>
  )
}
