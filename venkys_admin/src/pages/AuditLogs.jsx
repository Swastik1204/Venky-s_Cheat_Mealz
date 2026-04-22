import { useEffect, useMemo, useState } from 'react'

import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { MdHistory, MdRefresh, MdSearch } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'
import { formatLogEntry } from '../lib/auditLog'
import { db } from '../lib/firebase'

const ACTION_BADGE = {
  create: 'badge-success',
  update: 'badge-info',
  delete: 'badge-error',
  restore: 'badge-primary',
}

function getAction(log) {
  return String(log?.action || log?.type || 'update').toLowerCase()
}

function formatTimestamp(value) {
  try {
    const date = value?.toDate?.() || value
    return date instanceof Date
      ? date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Unknown time'
  } catch {
    return 'Unknown time'
  }
}

export default function AuditLogs() {
  const { isSuperAdmin } = useAuth()
  const hasPageAccess = isSuperAdmin

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: 'all',
    collection: 'all',
    who: '',
  })

  useEffect(() => {
    if (!isSuperAdmin) return
    loadLogs()
  }, [isSuperAdmin])

  async function loadLogs() {
    setLoading(true)
    try {
      const qy = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(300))
      const snap = await getDocs(qy)
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setLogs(next)
    } catch (err) {
      console.error('Failed to load logs:', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const action = getAction(log)
      if (filters.action !== 'all' && action !== filters.action) return false
      if (filters.collection !== 'all' && String(log.collection || '') !== filters.collection) return false
      if (filters.who) {
        const who = String(log.performedBy || log.userEmail || '').toLowerCase()
        if (!who.includes(filters.who.toLowerCase())) return false
      }
      return true
    })
  }, [logs, filters])

  if (!hasPageAccess) {
    return <div className="p-8"><div className="alert alert-error">Only super admin can access audit logs.</div></div>
  }

  return (
    <AdminLayout section="analytics">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <MdHistory /> Activity Log
            </h2>
            <p className="text-sm opacity-70 mt-1">Human-readable system activity with technical details on demand.</p>
          </div>
          <button onClick={loadLogs} className="btn btn-sm btn-outline gap-2" disabled={loading}>
            <MdRefresh className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Action</label>
            <select
              className="select select-bordered select-sm w-full"
              value={filters.action}
              onChange={(e) => setFilters((s) => ({ ...s, action: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="restore">Restore</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Collection</label>
            <select
              className="select select-bordered select-sm w-full"
              value={filters.collection}
              onChange={(e) => setFilters((s) => ({ ...s, collection: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="orders">Orders</option>
              <option value="menu">Menu</option>
              <option value="raw_materials">Stock</option>
              <option value="roles">Roles</option>
              <option value="miscellaneous">Settings</option>
            </select>
          </div>
          <div className="form-control md:col-span-2">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Performed by</label>
            <label className="input input-bordered input-sm flex items-center gap-2">
              <MdSearch className="opacity-40" />
              <input
                type="text"
                className="grow"
                placeholder="Search by email"
                value={filters.who}
                onChange={(e) => setFilters((s) => ({ ...s, who: e.target.value }))}
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16 opacity-60">
              <span className="loading loading-spinner loading-lg" />
              <p className="mt-3">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 opacity-60 bg-base-100 rounded-xl border border-base-200">
              No logs found for the selected filters.
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const action = getAction(entry)
              const badgeClass = ACTION_BADGE[action] || 'badge-info'
              const primaryText = entry.readableAction || formatLogEntry(entry)
              const secondaryText = formatTimestamp(entry.timestamp)

              return (
                <article key={entry.id} className="bg-base-100 rounded-xl border border-base-200 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`badge ${badgeClass}`}>{action}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base sm:text-lg font-semibold leading-snug">{primaryText}</p>
                      <p className="text-sm opacity-70 mt-1">
                        {String(entry.performedBy || entry.userEmail || 'System')} • {secondaryText}
                      </p>
                    </div>
                  </div>

                  <div className="collapse collapse-arrow bg-base-200/40 mt-3">
                    <input type="checkbox" />
                    <div className="collapse-title text-sm font-medium">Details</div>
                    <div className="collapse-content">
                      <pre className="text-xs overflow-auto">{JSON.stringify(entry, null, 2)}</pre>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
