// AuditLogs — System audit log viewer
import { useEffect, useState, useMemo } from 'react'

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { MdSearch, MdFilterList, MdRefresh, MdHistory, MdExpandMore, MdExpandLess, MdEdit, MdAdd, MdDelete, MdShoppingCart, MdPeople, MdSettings, MdInventory, MdRestaurantMenu, MdReceipt, MdUnfoldMore, MdUnfoldLess } from 'react-icons/md'

import AdminLayout from '../layouts/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'

// ── Constants ──

const ACTION_LABELS = {
  create: 'Added',
  update: 'Changed',
  delete: 'Removed',
}

const COLLECTION_LABELS = {
  orders: 'Order',
  raw_materials: 'Stock Item',
  roles: 'Staff Member',
  miscellaneous: 'Settings',
  menu: 'Menu Item',
}

const COLLECTION_ICONS = {
  orders: MdShoppingCart,
  raw_materials: MdInventory,
  roles: MdPeople,
  miscellaneous: MdSettings,
  menu: MdRestaurantMenu,
}

const ACTION_STYLES = {
  create: { bg: 'bg-success/10', text: 'text-success', icon: MdAdd, label: 'Added' },
  update: { bg: 'bg-warning/10', text: 'text-warning', icon: MdEdit, label: 'Changed' },
  delete: { bg: 'bg-error/10', text: 'text-error', icon: MdDelete, label: 'Removed' },
}

// ── Helpers ──

/** Generate a plain-English summary of what happened. */
function describeLog(log) {
  const who = log.performedBy ? log.performedBy.split('@')[0] : 'System'
  const actionLabel = ACTION_LABELS[log.action] || log.action
  const what = COLLECTION_LABELS[log.collection] || log.collection
  const docShort = log.docId || log.documentId || ''

  // Try to extract a meaningful name
  const name = log.after?.name || log.before?.name
    || log.after?.customer?.name || log.before?.customer?.name
    || log.after?.email || log.before?.email
    || ''

  // Build a natural sentence
  const parts = [`${who} ${actionLabel.toLowerCase()}`]

  if (log.collection === 'orders') {
    const orderNo = log.after?.orderNo || log.before?.orderNo || docShort.slice(-6)
    if (log.action === 'update') {
      const changes = log.metadata?.changedFields || {}
      if (changes.status) {
        const from = changes.status.from || '?'
        const to = changes.status.to || '?'
        return `${who} moved Order #${orderNo} from "${from}" to "${to}"`
      }
      const keys = Object.keys(changes)
      if (keys.length > 0) {
        return `${who} updated Order #${orderNo} — changed ${keys.map(k => humanFieldName(k)).join(', ')}`
      }
    }
    if (log.action === 'create') {
      const total = log.after?.totalAmount || log.after?.subtotal
      const cust = log.after?.customer?.name || 'a customer'
      return `${who} created Order #${orderNo} for ${cust}${total ? ` (₹${Math.round(Number(total))})` : ''}`
    }
    return `${who} ${actionLabel.toLowerCase()} Order #${orderNo}`
  }

  if (log.collection === 'raw_materials') {
    const materialName = name || docShort
    if (log.action === 'update') {
      const changes = log.metadata?.changedFields || {}
      if (changes.stock) {
        const from = changes.stock.from ?? '?'
        const to = changes.stock.to ?? '?'
        return `${who} updated stock of "${materialName}" from ${from} to ${to}`
      }
      const keys = Object.keys(changes)
      if (keys.length > 0) {
        return `${who} updated "${materialName}" — changed ${keys.map(k => humanFieldName(k)).join(', ')}`
      }
    }
    if (log.action === 'create') return `${who} added new raw material "${materialName}"`
    if (log.action === 'delete') return `${who} removed raw material "${materialName}"`
    return `${who} ${actionLabel.toLowerCase()} "${materialName}"`
  }

  if (log.collection === 'roles') {
    const email = log.after?.email || log.before?.email || log.docId || log.documentId || ''
    const role = log.after?.role || log.before?.role || ''
    if (log.action === 'create') return `${who} added ${email} as ${role || 'staff'}`
    if (log.action === 'delete') return `${who} removed ${email} from staff`
    if (log.action === 'update') {
      const changes = log.metadata?.changedFields || {}
      if (changes.role) return `${who} changed ${email}'s role from "${changes.role.from}" to "${changes.role.to}"`
      return `${who} updated ${email}'s staff settings`
    }
  }

  if (log.collection === 'miscellaneous' || log.collection === 'settings') {
    const changes = log.metadata?.changedFields || {}
    const keys = Object.keys(changes)
    if (keys.length > 0) {
      return `${who} updated settings — changed ${keys.slice(0, 3).map(k => humanFieldName(k)).join(', ')}${keys.length > 3 ? ` and ${keys.length - 3} more` : ''}`
    }
    return `${who} updated store settings`
  }

  if (log.collection === 'menu') {
    const itemName = name || docShort
    if (log.action === 'create') return `${who} added menu item "${itemName}"`
    if (log.action === 'delete') return `${who} removed menu item "${itemName}"`
    if (log.action === 'update') return `${who} updated menu item "${itemName}"`
  }

  // Fallback
  if (name) return `${who} ${actionLabel.toLowerCase()} ${what} "${name}"`
  return `${who} ${actionLabel.toLowerCase()} ${what}`
}

/** Convert camelCase/snake_case field names to human-readable */
function humanFieldName(field) {
  const map = {
    shopPhone: 'shop phone',
    cashManagerPhones: 'cash manager phones',
    orderMessengerPhones: 'order messenger phones',
    shopAddress: 'shop address',
    locationLink: 'location link',
    googlePlaceId: 'Google Place ID',
    centerLat: 'latitude',
    centerLng: 'longitude',
    radiusKm: 'delivery radius',
    lowStockThreshold: 'low stock alert level',
    costPerUnit: 'cost per unit',
    discountPercent: 'discount %',
    totalAmount: 'total amount',
    subtotal: 'subtotal',
    statusHistory: 'status history',
    revisionCount: 'revision count',
  }
  if (map[field]) return map[field]
  // camelCase → words
  return field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toLowerCase()
}

/** Pretty-print a field value for display */
function prettyValue(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (Array.isArray(val)) {
    if (val.length === 0) return '(empty)'
    if (val.length <= 3) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ')
    return `${val.length} items`
  }
  if (typeof val === 'object') {
    // Try to pick a meaningful field
    if (val.name) return val.name
    if (val.email) return val.email
    const keys = Object.keys(val)
    if (keys.length <= 3) return keys.map(k => `${k}: ${val[k]}`).join(', ')
    return `{${keys.length} fields}`
  }
  return String(val)
}

export default function AuditLogs() {
  // ── State ──
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    collection: 'all',
    action: 'all',
    performedBy: '',
  })
  const [expandedLog, setExpandedLog] = useState(null)
  const [openDates, setOpenDates] = useState(new Set())

  // ── Side-effects ──
  useEffect(() => {
    if (!isAdmin) return
    loadLogs()
  }, [isAdmin])

  async function loadLogs() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      )
      const snap = await getDocs(q)
      const logsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }))
      setLogs(logsData)
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived data ──
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.collection !== 'all' && log.collection !== filters.collection) return false
      if (filters.action !== 'all' && log.action !== filters.action) return false
      if (filters.performedBy && !log.performedBy?.toLowerCase().includes(filters.performedBy.toLowerCase())) return false
      return true
    })
  }, [logs, filters])

  const groupedLogs = useMemo(() => {
    const groups = {}
    filteredLogs.forEach(log => {
      const dateKey = log.timestamp.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(log)
    })
    return groups
  }, [filteredLogs])

  // ── Handlers ──
  function formatTime(date) {
    if (!date) return '—'
    try {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  function toggleDate(dateKey) {
    setOpenDates(prev => {
      const next = new Set(prev)
      next.has(dateKey) ? next.delete(dateKey) : next.add(dateKey)
      return next
    })
  }

  function toggleAllDates() {
    const allKeys = Object.keys(groupedLogs)
    if (openDates.size === allKeys.length) {
      setOpenDates(new Set())
    } else {
      setOpenDates(new Set(allKeys))
    }
  }

  // Auto-open first date group when data loads
  useEffect(() => {
    const keys = Object.keys(groupedLogs)
    if (keys.length > 0 && openDates.size === 0) {
      setOpenDates(new Set([keys[0]]))
    }
  }, [groupedLogs]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ──
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="page-wrap py-20 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-sm opacity-70 mt-2">Only administrators can view activity logs.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout section="analytics">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <MdHistory /> Activity Log
            </h2>
            <p className="text-sm opacity-70 mt-1">See what happened, when, and by whom</p>
          </div>
          <button onClick={loadLogs} className="btn btn-sm btn-outline gap-2" disabled={loading}>
            <MdRefresh className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-base-100 rounded-xl border border-base-200 p-3 text-center">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <div className="text-xs opacity-50">Total Activities</div>
          </div>
          <div className="bg-success/5 rounded-xl border border-success/20 p-3 text-center">
            <div className="text-2xl font-bold text-success">{filteredLogs.filter(l => l.action === 'create').length}</div>
            <div className="text-xs opacity-50">Items Added</div>
          </div>
          <div className="bg-warning/5 rounded-xl border border-warning/20 p-3 text-center">
            <div className="text-2xl font-bold text-warning">{filteredLogs.filter(l => l.action === 'update').length}</div>
            <div className="text-xs opacity-50">Changes Made</div>
          </div>
          <div className="bg-error/5 rounded-xl border border-error/20 p-3 text-center">
            <div className="text-2xl font-bold text-error">{filteredLogs.filter(l => l.action === 'delete').length}</div>
            <div className="text-xs opacity-50">Items Removed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">What changed</label>
            <select
              className="select select-bordered select-sm w-full"
              value={filters.collection}
              onChange={e => setFilters(f => ({ ...f, collection: e.target.value }))}
            >
              <option value="all">Everything</option>
              <option value="orders">Orders</option>
              <option value="menu">Menu</option>
              <option value="raw_materials">Stock / Inventory</option>
              <option value="roles">Staff &amp; Roles</option>
              <option value="miscellaneous">Settings</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Type of change</label>
            <select
              className="select select-bordered select-sm w-full"
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="create">Added</option>
              <option value="update">Changed</option>
              <option value="delete">Removed</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Who did it</label>
            <label className="input input-bordered input-sm flex items-center gap-2">
              <MdSearch className="opacity-40" />
              <input
                type="text"
                className="grow"
                placeholder="Search by name or email..."
                value={filters.performedBy}
                onChange={e => setFilters(f => ({ ...f, performedBy: e.target.value }))}
              />
            </label>
          </div>
          <div className="form-control flex justify-end">
            <button
              className="btn btn-sm btn-ghost w-full"
              onClick={() => setFilters({ collection: 'all', action: 'all', performedBy: '' })}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Logs Timeline */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20 opacity-50">
              <span className="loading loading-spinner loading-lg" />
              <p className="mt-3">Loading activity log...</p>
            </div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <div className="text-center py-20 opacity-50 bg-base-100 rounded-xl border border-base-200">
              <div className="text-4xl mb-2">📭</div>
              <p>No activities found matching your filters</p>
            </div>
          ) : (
            <>
              {/* Expand / Collapse all */}
              <div className="flex justify-end">
                <button className="btn btn-xs btn-ghost gap-1 opacity-60" onClick={toggleAllDates}>
                  {openDates.size === Object.keys(groupedLogs).length
                    ? <><MdUnfoldLess size={14} /> Collapse All</>
                    : <><MdUnfoldMore size={14} /> Expand All</>
                  }
                </button>
              </div>

              {Object.entries(groupedLogs).map(([date, dayLogs]) => {
                const isOpen = openDates.has(date)
                return (
                  <div key={date} className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-xl overflow-hidden">
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={() => toggleDate(date)}
                    />
                    <div className="collapse-title text-sm font-semibold flex items-center gap-2 min-h-0 py-3">
                      📅 {date}
                      <span className="badge badge-sm badge-ghost ml-1">
                        {dayLogs.length} {dayLogs.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>
                    <div className="collapse-content px-3 pb-3">
                      <div className="space-y-1.5">
                        {dayLogs.map(log => {
                          const style = ACTION_STYLES[log.action] || ACTION_STYLES.update
                          const IconComponent = COLLECTION_ICONS[log.collection] || MdReceipt
                          const ActionIcon = style.icon
                          const description = describeLog(log)
                          const changedFields = log.metadata?.changedFields
                          const hasChanges = changedFields && Object.keys(changedFields).length > 0
                          const isExpanded = expandedLog === log.id

                          return (
                            <div
                              key={log.id}
                              className={`bg-base-100 rounded-lg border overflow-hidden transition-all duration-200 ${isExpanded ? 'border-primary/30 shadow-md' : 'border-base-200 hover:border-base-300'}`}
                            >
                              {/* Main row */}
                              <div
                                className="p-3 flex items-start sm:items-center gap-3 cursor-pointer"
                                onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 ${style.bg}`}>
                                  <ActionIcon className={`w-4 h-4 ${style.text}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-snug">{description}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs opacity-40">{formatTime(log.timestamp)}</span>
                                    <span className="inline-flex items-center gap-1 text-[10px] opacity-40">
                                      <IconComponent className="w-3 h-3" />
                                      {COLLECTION_LABELS[log.collection] || log.collection}
                                    </span>
                                  </div>
                                </div>
                                {hasChanges && (
                                  <div className="opacity-30 shrink-0">
                                    {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                                  </div>
                                )}
                              </div>

                              {/* Expanded details */}
                              {isExpanded && hasChanges && (
                                <div className="px-4 pb-4 border-t border-base-200/50">
                                  <div className="mt-3 text-sm font-semibold opacity-60 mb-2">What changed:</div>
                                  <div className="space-y-2">
                                    {Object.entries(changedFields).map(([field, val]) => (
                                      <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm py-1.5 border-b border-base-200/50 last:border-0">
                                        <span className="font-medium text-base-content/70 min-w-[120px] capitalize">{humanFieldName(field)}</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="bg-error/10 text-error/80 px-2 py-0.5 rounded text-xs line-through">
                                            {prettyValue(val.from)}
                                          </span>
                                          <span className="opacity-30">→</span>
                                          <span className="bg-success/10 text-success/80 px-2 py-0.5 rounded text-xs font-medium">
                                            {prettyValue(val.to)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-4 text-xs opacity-40">
                                    <span>By: {log.performedBy || 'System'}</span>
                                    {(log.docId || log.documentId) && <span>Ref: {log.docId || log.documentId}</span>}
                                  </div>
                                </div>
                              )}

                              {isExpanded && !hasChanges && (
                                <div className="px-4 pb-4 border-t border-base-200/50">
                                  <div className="mt-3 flex flex-wrap gap-4 text-xs opacity-40">
                                    <span>By: {log.performedBy || 'System'}</span>
                                    {(log.docId || log.documentId) && <span>Ref: {log.docId || log.documentId}</span>}
                                    {log.metadata?.reason && <span>Reason: {log.metadata.reason}</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
