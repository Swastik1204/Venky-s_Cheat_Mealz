// ActiveOrders — Live order tracking dashboard
import { useEffect, useMemo, useState } from 'react'

import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MdArrowBack, MdLocalShipping, MdPlace, MdReceiptLong } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchOrder } from '../lib/data'
import { db } from '../lib/firebase'

// ── Constants & helpers ──

const ORDER_STATUS_FLOW = ['placed', 'preparing', 'ready', 'delivered']

function normalizeStatus(status) {
  return String(status || 'placed').toLowerCase()
}

function isCompletedStatus(status) {
  const s = normalizeStatus(status)
  return s === 'delivered' || s === 'rejected' || s === 'cancelled'
}

function isActiveStatus(status) {
  return !isCompletedStatus(status)
}

function isCancelledOrRejected(status) {
  const s = normalizeStatus(status)
  return s === 'cancelled' || s === 'rejected'
}

function statusBadgeClass(status) {
  switch (normalizeStatus(status)) {
    case 'placed':
      return 'badge badge-warning'
    case 'preparing':
      return 'badge badge-info'
    case 'ready':
      return 'badge badge-primary'
    case 'delivered':
      return 'badge badge-success'
    case 'rejected':
      return 'badge badge-error'
    default:
      return 'badge badge-ghost'
  }
}

function statusLabel(status) {
  const s = normalizeStatus(status)
  return s.replace(/_/g, ' ')
}

function statusLabelCapitalized(status) {
  return statusLabel(status).replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  if (typeof value.milliseconds === 'number') return new Date(value.milliseconds)
  if (typeof value === 'number') return new Date(value)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateTime(value) {
  const dt = toDate(value)
  if (!dt) return ''
  return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function safeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatCurrency(value) {
  const num = safeNumber(value)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num)
}

function orderIdentifier(order) {
  if (!order) return '#—'
  if (order.orderNo) return String(order.orderNo)
  if (order.id) return `#${String(order.id).slice(-6)}`
  return '#—'
}

function orderProgressPercent(status) {
  const s = normalizeStatus(status)
  const idx = ORDER_STATUS_FLOW.indexOf(s)
  if (idx === -1) return 0
  if (ORDER_STATUS_FLOW.length === 1) return 100
  return Math.max(0, Math.min(100, Math.round((idx / (ORDER_STATUS_FLOW.length - 1)) * 100)))
}

export default function ActiveOrders() {
  const { user } = useAuth()
  const { pushToast, openAuth } = useUI()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // ── State ──
  const selectedIdFromUrl = params.get('id') || ''
  const [loading, setLoading] = useState(true)
  const [activeOrders, setActiveOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [completionProgress, setCompletionProgress] = useState(0)

  const resolvedSelectedId = selectedOrder?.id || selectedIdFromUrl || ''

  const activeOrdersSorted = useMemo(() => {
    const list = Array.isArray(activeOrders) ? [...activeOrders] : []
    list.sort((a, b) => {
      const ta = toDate(a?.createdAt)?.getTime() ?? 0
      const tb = toDate(b?.createdAt)?.getTime() ?? 0
      return tb - ta
    })
    return list
  }, [activeOrders])

  const selectedOrderTimeline = useMemo(() => {
    if (!selectedOrder) return []
    const history = Array.isArray(selectedOrder.statusHistory) ? selectedOrder.statusHistory.filter(Boolean) : []
    if (!history.length) {
      return [{ status: 'placed', at: selectedOrder.createdAt, actor: selectedOrder.customer?.name || 'system' }]
    }
    return [...history]
      .map((entry) => ({
        status: entry?.status || selectedOrder.status || 'placed',
        at: entry?.at || selectedOrder.updatedAt || selectedOrder.createdAt,
        actor: entry?.actor || 'system',
      }))
      .sort((a, b) => {
        const ta = toDate(a?.at)?.getTime() ?? 0
        const tb = toDate(b?.at)?.getTime() ?? 0
        return ta - tb
      })
  }, [selectedOrder])

  const itemCountFor = (order) => {
    const items = Array.isArray(order?.items) ? order.items : []
    return items.reduce((sum, it) => sum + (Number(it?.qty) || 0), 0)
  }

  const totalFor = (order) => {
    const explicit = order?.totalAmount ?? order?.total ?? order?.grandTotal
    if (explicit != null && Number.isFinite(Number(explicit))) return Number(explicit)
    const items = Array.isArray(order?.items) ? order.items : []
    return items.reduce((sum, it) => sum + (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0), 0)
  }

  // ── Side-effects ──
  useEffect(() => {
    if (!user?.uid) {
      setActiveOrders([])
      setLoading(false)
      return
    }
    setLoading(true)
    const qy = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      where('status', 'not-in', ['delivered', 'rejected', 'cancelled']),
    )
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setActiveOrders(list.filter((o) => isActiveStatus(o?.status)))
      setLoading(false)
    }, () => {
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  // Resolve initial selection
  useEffect(() => {
    if (loading) return

    if (!user?.uid) return

    if (selectedIdFromUrl) {
      const match = activeOrdersSorted.find((o) => String(o.id) === String(selectedIdFromUrl) || String(o.orderNo) === String(selectedIdFromUrl))
      if (match) {
        setSelectedOrder(match)
        return
      }
      // If user deep-linked to an order id but it's not active anymore, exit the page.
      ;(async () => {
        try {
          const fetched = await fetchOrder(user.uid, selectedIdFromUrl)
          if (fetched && isActiveStatus(fetched.status)) {
            setSelectedOrder(fetched)
            setActiveOrders((prev) => {
              const list = Array.isArray(prev) ? [...prev] : []
              const idx = list.findIndex((o) => String(o.id) === String(fetched.id))
              if (idx === -1) list.unshift(fetched)
              return list
            })
            return
          }
          if (fetched && isCompletedStatus(fetched.status)) {
            pushToast('That order is completed and is no longer active.', 'info', 3500)
            navigate('/profile#orders', { replace: true })
          }
        } catch {
          // ignore
        }
      })()
      return
    }

    if (activeOrdersSorted.length === 1) {
      const only = activeOrdersSorted[0]
      setSelectedOrder(only)
      setParams({ id: only.id })
      return
    }

    if (activeOrdersSorted.length === 0) {
      pushToast('No active orders right now.', 'info', 2500)
      const t = setTimeout(() => navigate('/', { replace: true }), 900)
      return () => clearTimeout(t)
    }

    setSelectedOrder(null)
  }, [activeOrdersSorted, loading, navigate, params, pushToast, selectedIdFromUrl, setParams, user?.uid])

  // Real-time updates for the selected order (auto-exit on completion)
  useEffect(() => {
    if (!resolvedSelectedId) return
    if (!user?.uid) return
	// Orders are stored at top-level `orders/{orderId}`.
	const ref = doc(db, 'orders', resolvedSelectedId)
    let redirectTimeout = null
    let completionHandled = false

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return
      const data = snap.data() || {}
      const next = { id: snap.id, ...data }
      if (isCompletedStatus(next.status)) {
        if (completionHandled) return
        completionHandled = true
        pushToast('Order completed. Thanks for ordering!', 'success', 3500)
        setCompletedOrder(next)
        setCompletionProgress(0)
        setTimeout(() => setCompletionProgress(100), 40)
        redirectTimeout = setTimeout(() => {
          navigate('/', { replace: true })
        }, 4000)
        return
      }
      setCompletedOrder(null)
      setCompletionProgress(0)
      setSelectedOrder(next)
      setActiveOrders((prev) => {
        const list = Array.isArray(prev) ? [...prev] : []
        const idx = list.findIndex((o) => String(o.id) === String(next.id))
		if (idx === -1) {
			// If this order isn't in the list yet, add it.
			if (isActiveStatus(next.status)) list.unshift(next)
			return list
		}
		list[idx] = { ...list[idx], ...next }
        return list
      })
    }, () => {})

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout)
      unsub()
    }
  }, [navigate, pushToast, resolvedSelectedId, user?.uid])

  const handleSelect = (order) => {
    if (!order) return
    setSelectedOrder(order)
    setParams({ id: order.id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Render ──
  return (
    <div className="page-wrap py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-sm btn-ghost gap-2" onClick={() => navigate(-1)}>
            <MdArrowBack className="w-5 h-5" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <MdLocalShipping className="text-primary" /> Active Orders
            </h1>
            <p className="text-xs opacity-60">Only ongoing orders show up here.</p>
          </div>
        </div>
      </div>

      {!user ? (
        <div className="rounded-3xl border border-base-300/60 bg-base-100/80 p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Sign in to view order status</h2>
            <p className="text-sm opacity-70">Log in to see your active orders and live updates.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn btn-primary" onClick={() => openAuth('login')}>Login</button>
            <Link to="/" className="btn btn-ghost">Go home</Link>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <div className="space-y-3">
            <div className="rounded-3xl border border-base-300/60 bg-base-100/70 backdrop-blur p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] opacity-60">Active now</div>
                  <div className="text-xl font-semibold mt-1">{activeOrdersSorted.length}</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-success/10 border border-success/30 px-3 py-2">
                  <MdReceiptLong className="w-5 h-5 text-success" />
                  <span className="text-sm font-semibold text-success">Live tracking</span>
                </div>
              </div>
            </div>

            {activeOrdersSorted.length === 0 ? (
              <div className="text-center py-10 bg-base-100 rounded-3xl border border-base-200 border-dashed">
                <p className="opacity-70">No active orders right now.</p>
                <Link to="/" className="btn btn-link btn-sm mt-2">Browse Menu</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrdersSorted.map((o) => {
                  const selected = resolvedSelectedId && String(o.id) === String(resolvedSelectedId)
                  const status = o.status || 'placed'
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => handleSelect(o)}
                      className={`w-full text-left rounded-3xl border p-4 shadow-sm transition ${selected ? 'border-primary bg-primary/5' : 'border-base-300/60 bg-base-100/70 hover:shadow-md'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{orderIdentifier(o)}</div>
                            <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
                          </div>
                          <div className="text-xs opacity-70 mt-1 flex flex-wrap gap-2">
                            <span>{formatDateTime(o.createdAt) || '—'}</span>
                            <span>{itemCountFor(o)} item{itemCountFor(o) === 1 ? '' : 's'}</span>
                            <span>Total {formatCurrency(totalFor(o))}</span>
                          </div>
                        </div>
                        <div className="text-right text-xs opacity-60">Tap to view</div>
                      </div>
                      <div className="mt-3">
                        {isCancelledOrRejected(status) ? (
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-error/40 bg-error/10 px-3 py-1 text-xs font-semibold text-error">
                            Order {normalizeStatus(status)}
                          </div>
                        ) : (
                          <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${orderProgressPercent(status)}%` }} />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-base-300/60 bg-base-100/80 backdrop-blur p-5 shadow-sm">
            {completedOrder ? (
              <div className="min-h-[420px] flex flex-col items-center justify-center text-center px-4 py-6">
                <div className={`text-6xl ${normalizeStatus(completedOrder.status) === 'delivered' ? '' : 'text-error'}`}>
                  {normalizeStatus(completedOrder.status) === 'delivered' ? '✅' : '❌'}
                </div>
                <h2 className="mt-5 text-2xl font-bold">
                  Order {orderIdentifier(completedOrder)} {statusLabel(completedOrder.status)}
                </h2>
                <p className="mt-2 text-sm opacity-75">
                  {normalizeStatus(completedOrder.status) === 'delivered'
                    ? 'Thank you for ordering! 🍗 Redirecting you home...'
                    : 'Sorry about that. Redirecting you home...'}
                </p>
                <div className="w-full max-w-md mt-6">
                  <progress
                    className={`progress w-full ${normalizeStatus(completedOrder.status) === 'delivered' ? 'progress-success' : 'progress-error'}`}
                    value={completionProgress}
                    max="100"
                    style={{ transition: 'all 4s linear' }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary mt-6"
                  onClick={() => navigate('/', { replace: true })}
                >
                  Go home now
                </button>
              </div>
            ) : selectedOrder ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-success/10 border border-success/30 px-3 py-2">
                      <span className="text-xs uppercase tracking-[0.22em] font-bold text-success">Order</span>
                      <span className="font-mono font-bold text-success">{orderIdentifier(selectedOrder)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={statusBadgeClass(selectedOrder.status)}>{statusLabel(selectedOrder.status)}</span>
                      <span className="text-xs opacity-60">Placed {formatDateTime(selectedOrder.createdAt) || '—'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setSelectedOrder(null)
                      const next = new URLSearchParams(params)
                      next.delete('id')
                      setParams(next)
                    }}
                  >
                    Back to list
                  </button>
                </div>

                <div className="space-y-2">
                  {isCancelledOrRejected(selectedOrder.status) ? (
                    <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3">
                      <span className="badge badge-error">Order {normalizeStatus(selectedOrder.status)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="h-2 w-full rounded-full bg-base-300/50 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${orderProgressPercent(selectedOrder.status)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] opacity-60">
                        {ORDER_STATUS_FLOW.map((step) => (
                          <span key={step} className={normalizeStatus(selectedOrder.status) === step ? 'text-primary font-semibold' : ''}>{step}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-2xl border border-base-300/60 bg-base-100 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] opacity-60 font-bold">Order timeline</div>
                  <div className="mt-3 space-y-3">
                    {selectedOrderTimeline.map((entry, idx) => (
                      <div key={`${selectedOrder.id}-${entry.status}-${idx}`} className="flex items-start gap-3">
                        <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary/70" />
                        <div className="min-w-0">
                          <span className={statusBadgeClass(entry.status)}>{statusLabelCapitalized(entry.status)}</span>
                          <div className="text-xs opacity-70 mt-1">{formatDateTime(entry.at) || '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-base-300/60 overflow-hidden">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length ? (
                    <table className="table table-sm">
                      <thead>
                        <tr className="text-xs uppercase opacity-60">
                          <th className="bg-transparent">Item</th>
                          <th className="bg-transparent text-right">Qty</th>
                          <th className="bg-transparent text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((it) => {
                          const lineTotal = (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0)
                          return (
                            <tr key={`${selectedOrder.id}-${it.id || it.name}`} className="text-sm">
                              <td>{it.name}</td>
                              <td className="text-right">{it.qty}</td>
                              <td className="text-right">{formatCurrency(lineTotal)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-sm opacity-70">No items recorded for this order.</div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-base-300/60 bg-base-100 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] opacity-60 font-bold">Delivery</div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="font-semibold">{selectedOrder.customer?.name || '—'}</div>
                      {selectedOrder.customer?.phone ? <div className="opacity-80">{selectedOrder.customer.phone}</div> : null}
                      {(selectedOrder.customer?.address?.line || selectedOrder.customer?.address?.line1) ? (
                        <div className="mt-2 text-sm opacity-80">
                          <div className="flex items-start gap-2">
                            <MdPlace className="w-4 h-4 mt-0.5 opacity-60" />
                            <div>
                              <div>{selectedOrder.customer?.address?.line || [selectedOrder.customer?.address?.line1, selectedOrder.customer?.address?.line2].filter(Boolean).join(', ')}</div>
                              <div className="text-xs opacity-60">{[selectedOrder.customer?.address?.city, selectedOrder.customer?.address?.pin].filter(Boolean).join(' • ')}</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-base-300/60 bg-base-100 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] opacity-60 font-bold">Payment</div>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span>Method</span><span className="uppercase tracking-wide">{selectedOrder.payment?.method ? String(selectedOrder.payment.method) : '—'}</span></div>
                      <div className="flex items-center justify-between"><span>Status</span><span className="capitalize opacity-80">{selectedOrder.payment?.status ? String(selectedOrder.payment.status) : '—'}</span></div>
                      <div className="divider my-2" />
                      <div className="flex items-center justify-between font-semibold"><span>Total</span><span>{formatCurrency(totalFor(selectedOrder))}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-14">
                <h2 className="text-lg font-semibold">Select an order to track</h2>
                <p className="text-sm opacity-70 mt-1">Tap an order from the left panel to see full details and live status.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
