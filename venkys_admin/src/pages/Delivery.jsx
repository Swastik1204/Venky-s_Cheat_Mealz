// Delivery — Real-time delivery operations dashboard
import { useCallback, useEffect, useMemo, useState } from 'react'

import { collection, onSnapshot, query, where } from 'firebase/firestore'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import AdminLayout from '../layouts/AdminLayout'
import { isCounterDocId, updateOrder } from '../lib/data'
import { db } from '../lib/firebase'

const TERMINAL_DELIVERY_STATUSES = ['delivered', 'rejected', 'cancelled']

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const t = Date.parse(value)
    return Number.isNaN(t) ? null : new Date(t)
  }
  return null
}

function formatElapsed(placedAt, nowMs) {
  if (!placedAt) return 'Unknown'
  const diffMs = Math.max(0, nowMs - placedAt.getTime())
  const totalMins = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMins / 1440)
  const hours = Math.floor((totalMins % 1440) / 60)
  const mins = totalMins % 60
  if (days > 0) return `${days}d ${hours}h ago`
  if (hours > 0) return `${hours}h ${mins}m ago`
  return `${mins}m ago`
}

function getAddressObject(order) {
  const raw = order?.customer?.address ?? order?.address ?? order?.deliveryAddress ?? null
  return raw && typeof raw === 'object' ? raw : null
}

function getAddressLine(order) {
  const raw = order?.customer?.address ?? order?.address ?? order?.deliveryAddress ?? ''
  if (!raw) return 'No address provided'
  if (typeof raw === 'string') return raw.trim() || 'No address provided'
  const parts = [raw.line1, raw.line2, raw.landmark, raw.city, raw.state, raw.pin]
    .map((v) => (v == null ? '' : String(v).trim()))
    .filter(Boolean)
  return parts.length ? parts.join(', ') : 'No address provided'
}

function getCoords(order) {
  const addr = getAddressObject(order)
  const lat = Number(addr?.lat)
  const lng = Number(addr?.lng)
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  return null
}

function getPinUrl(order) {
  const explicit = [order?.mapUrl, getAddressObject(order)?.mapUrl]
    .find((value) => typeof value === 'string' && value.trim())
  if (explicit) return explicit
  const coords = getCoords(order)
  if (!coords) return ''
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
}

function getPaymentMethod(order) {
  return String(order?.payment?.method || order?.customer?.payment?.method || 'cod').trim().toLowerCase()
}

function statusBadgeClass(status) {
  if (status === 'placed') return 'badge-info'
  if (status === 'preparing') return 'badge-warning'
  if (status === 'ready') return 'badge-success'
  if (status === 'delivered') return 'badge-neutral'
  if (status === 'rejected') return 'badge-error'
  return 'badge-ghost'
}

export default function Delivery() {
  const { pushToast } = useUI()
  const { user, role, roleLoading, canAccess } = useAuth()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyOrderId, setBusyOrderId] = useState('')
  const [nowMs, setNowMs] = useState(Date.now())

  const canViewDelivery = canAccess('delivery')

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (roleLoading) return undefined
    if (!canViewDelivery) {
      setLoading(false)
      return undefined
    }

    let unsub = () => {}
    let switchedToFallback = false

    const bind = (fallback = false) => {
      const qy = fallback
        ? query(collection(db, 'orders'), where('orderType', '==', 'delivery'))
        : query(
          collection(db, 'orders'),
          where('orderType', '==', 'delivery'),
          where('status', 'not-in', TERMINAL_DELIVERY_STATUSES),
        )

      unsub = onSnapshot(
        qy,
        (snap) => {
          const next = snap.docs
            .filter((d) => !isCounterDocId(d.id))
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((o) => !TERMINAL_DELIVERY_STATUSES.includes(String(o?.status || '').toLowerCase()))
            .sort((a, b) => {
              const ta = toDate(a.createdAt)?.getTime() || 0
              const tb = toDate(b.createdAt)?.getTime() || 0
              return tb - ta
            })
          setOrders(next)
          setError('')
          setLoading(false)
        },
        (err) => {
          if (!fallback && !switchedToFallback) {
            switchedToFallback = true
            try { unsub() } catch { /* noop */ }
            bind(true)
            return
          }
          console.error('[Delivery] live query failed', err)
          setError('Could not load delivery orders in real time.')
          setLoading(false)
        },
      )
    }

    setLoading(true)
    bind(false)
    return () => {
      try { unsub() } catch { /* noop */ }
    }
  }, [roleLoading, canViewDelivery])

  const stats = useMemo(() => {
    const total = orders.length
    const gpsCount = orders.filter((o) => !!getCoords(o)).length
    const codCount = orders.filter((o) => getPaymentMethod(o) === 'cod').length
    const onlineCount = Math.max(0, total - codCount)
    return { total, gpsCount, codCount, onlineCount }
  }, [orders])

  const updateStatus = useCallback(async (order, nextStatus) => {
    if (!order?.id || !nextStatus || busyOrderId) return
    setBusyOrderId(order.id)
    try {
      const patch = { status: nextStatus }
      if (nextStatus === 'delivered') {
        patch.deliveredAt = new Date().toISOString()
      }
      await updateOrder(order.userId || null, order.id, patch, user?.email || user?.uid || 'delivery')
      pushToast(`Order ${order.orderNo || order.id} marked ${nextStatus}`, 'success')
    } catch (err) {
      console.error('[Delivery] status update failed', err)
      pushToast('Failed to update order status', 'error')
    } finally {
      setBusyOrderId('')
    }
  }, [busyOrderId, pushToast, user])

  const renderActions = (order) => {
    const status = String(order?.status || '').toLowerCase()
    const disabled = busyOrderId === order.id
    if (status === 'placed') {
      return (
        <>
          <button className="btn btn-success btn-sm" disabled={disabled} onClick={() => updateStatus(order, 'preparing')}>Accept</button>
          <button className="btn btn-error btn-sm" disabled={disabled} onClick={() => updateStatus(order, 'rejected')}>Reject</button>
        </>
      )
    }
    if (status === 'preparing') {
      return (
        <>
          <button className="btn btn-primary btn-sm" disabled={disabled} onClick={() => updateStatus(order, 'ready')}>Mark Ready</button>
          <button className="btn btn-error btn-sm" disabled={disabled} onClick={() => updateStatus(order, 'rejected')}>Reject</button>
        </>
      )
    }
    if (status === 'ready') {
      return (
        <>
          <button className="btn btn-accent btn-sm" disabled={disabled} onClick={() => updateStatus(order, 'delivered')}>Mark Delivered</button>
          <button className="btn btn-error btn-sm" disabled={disabled} onClick={() => updateStatus(order, 'rejected')}>Reject</button>
        </>
      )
    }
    return null
  }

  if (!roleLoading && !canViewDelivery) {
    return <div className="p-8"><div className="alert alert-error">You don't have permission to access this page.</div></div>
  }

  return (
    <AdminLayout title="Delivery" description="Live delivery visibility and status control">
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
        <div className="stat">
          <div className="stat-title">Active Delivery Orders</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="stat-title">GPS Verified</div>
          <div className="stat-value text-success">{stats.gpsCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">COD</div>
          <div className="stat-value text-warning">{stats.codCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Online</div>
          <div className="stat-value text-info">{stats.onlineCount}</div>
        </div>
      </div>

      {loading && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <span className="loading loading-spinner loading-md" />
            <span className="opacity-70">Loading delivery orders...</span>
          </div>
        </div>
      )}

      {!!error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h2 className="card-title">No active delivery orders</h2>
            <p className="opacity-70">New delivery orders will appear here in real time.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => {
          const createdAt = toDate(order.createdAt)
          const customerName = String(order?.customer?.name || order?.name || 'Customer').trim() || 'Customer'
          const phone = String(order?.customer?.phone || order?.phone || '').trim() || 'No phone'
          const address = getAddressLine(order)
          const totalAmount = Number(order?.totalAmount ?? order?.subtotal ?? 0)
          const status = String(order?.status || 'placed').toLowerCase()
          const pinUrl = getPinUrl(order)
          const paymentMethod = getPaymentMethod(order)

          return (
            <div key={order.id} className="card bg-base-100 shadow-md border border-base-300">
              <div className="card-body gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="card-title text-base">#{order.orderNo || order.id}</h3>
                    <p className="text-sm opacity-70">{formatElapsed(createdAt, nowMs)}</p>
                  </div>
                  <span className={`badge badge-sm capitalize ${statusBadgeClass(status)}`}>{status}</span>
                </div>

                <div className="divider my-0" />

                <div className="space-y-1 text-sm">
                  <div><span className="font-semibold">Customer:</span> {customerName}</div>
                  <div><span className="font-semibold">Phone:</span> {phone}</div>
                  <div><span className="font-semibold">Address:</span> {address}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span><span className="font-semibold">Total:</span> ₹{totalAmount}</span>
                    <span className={`badge badge-outline badge-sm ${paymentMethod === 'cod' ? 'badge-warning' : 'badge-info'}`}>
                      {paymentMethod === 'cod' ? 'COD' : 'ONLINE'}
                    </span>
                  </div>
                  {typeof order?.mapUrl === 'string' && order.mapUrl.trim() && (
                    <a className="link link-primary text-xs" href={order.mapUrl} target="_blank" rel="noreferrer">Saved map URL</a>
                  )}
                </div>

                {pinUrl ? (
                  <a href={pinUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-block">
                    📍 Open location
                  </a>
                ) : (
                  <button className="btn btn-disabled btn-block" disabled>
                    📍 Location unavailable
                  </button>
                )}

                <div className="card-actions justify-end">
                  {renderActions(order)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {role && (
        <div className="alert alert-info">
          <span>Signed in as {role.role || 'staff'}</span>
        </div>
      )}
    </AdminLayout>
  )
}
