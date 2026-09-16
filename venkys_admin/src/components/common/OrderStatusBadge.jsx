import React from 'react'

const ADMIN_STATUS_COLOR_MAP = {
  placed: 'badge-info',
  preparing: 'badge-warning',
  ready: 'badge-success',
  delivered: 'badge-neutral',
  rejected: 'badge-error',
  cancelled: 'badge-error',
  'pending-payment': 'badge-ghost',
}

function getAdminStatusBadgeClass(status) {
  const s = String(status || '').trim().toLowerCase()
  return ADMIN_STATUS_COLOR_MAP[s] || 'badge-ghost'
}

function formatAdminStatusLabel(status, capitalize = false) {
  const s = String(status || '').trim().toLowerCase()
  if (!capitalize) return s
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

export default function OrderStatusBadge({ status, size = '', className = '', capitalize = false }) {
  const colorClass = getAdminStatusBadgeClass(status)
  const label = formatAdminStatusLabel(status, capitalize)

  return (
    <span className={`badge ${colorClass} ${size} ${className}`.trim()}>
      {label}
    </span>
  )
}
