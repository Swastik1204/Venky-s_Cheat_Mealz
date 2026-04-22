import { useCallback, useEffect, useMemo, useState } from 'react'

import { MdHistory, MdRefresh } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'
import { deleteExpiredHistory, fetchChangeHistory, restoreVersion } from '../lib/data'

const ACTION_BADGE = {
  create: 'badge-success',
  update: 'badge-info',
  delete: 'badge-error',
  restore: 'badge-primary',
}

const COLLECTION_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Menu', value: 'menu' },
  { label: 'Orders', value: 'orders' },
  { label: 'Settings', value: 'miscellaneous' },
  { label: 'Roles', value: 'roles' },
  { label: 'Admin Users', value: 'adminUsers' },
]

function toDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : new Date(parsed)
  }
  return null
}

function formatTimestamp(value) {
  const date = toDate(value)
  if (!date) return 'Unknown time'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function stringifyValue(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function collectDiffs(before, after, prefix = '') {
  const beforeObj = before && typeof before === 'object' ? before : {}
  const afterObj = after && typeof after === 'object' ? after : {}
  const keys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]))

  const rows = []
  keys.forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key
    const left = beforeObj[key]
    const right = afterObj[key]

    const leftJson = JSON.stringify(left)
    const rightJson = JSON.stringify(right)
    if (leftJson === rightJson) return

    const bothObjects = left && right && typeof left === 'object' && typeof right === 'object' && !Array.isArray(left) && !Array.isArray(right)
    if (bothObjects) {
      rows.push(...collectDiffs(left, right, path))
      return
    }

    rows.push({ field: path, before: left, after: right })
  })

  return rows
}

export default function ChangeHistory() {
  const { isSuperAdmin, user } = useAuth()
  const hasPageAccess = isSuperAdmin

  const [entries, setEntries] = useState([])
  const [lastDoc, setLastDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cleanupBusy, setCleanupBusy] = useState(false)
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false)
  const [restoreConfirmEntry, setRestoreConfirmEntry] = useState(null)
  const [diffEntry, setDiffEntry] = useState(null)
  const [filters, setFilters] = useState({
    collection: '',
    fromDate: '',
    toDate: '',
  })

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const { entries: fetched, lastDoc: nextLast } = await fetchChangeHistory({
        collectionFilter: filters.collection,
        limitCount: 20,
      })
      setEntries(fetched)
      setLastDoc(nextLast)
    } catch (err) {
      console.error('Failed to load change history:', err)
      setEntries([])
      setLastDoc(null)
    } finally {
      setLoading(false)
    }
  }, [filters.collection])

  useEffect(() => {
    if (!isSuperAdmin) return
    loadInitial()
  }, [isSuperAdmin, loadInitial])

  async function loadMore() {
    if (!lastDoc) return
    setLoadingMore(true)
    try {
      const { entries: nextEntries, lastDoc: nextLast } = await fetchChangeHistory({
        collectionFilter: filters.collection,
        limitCount: 20,
        startAfterDoc: lastDoc,
      })
      setEntries((prev) => [...prev, ...nextEntries])
      setLastDoc(nextLast)
    } catch (err) {
      console.error('Failed to load more change history:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  function handleCollectionChange(value) {
    setFilters((prev) => ({ ...prev, collection: value }))
    setEntries([])
    setLastDoc(null)
  }

  const visibleEntries = useMemo(() => {
    const from = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null
    const to = filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null

    return entries.filter((entry) => {
      const at = toDate(entry.timestamp)
      if (!at) return true
      if (from && at < from) return false
      if (to && at > to) return false
      return true
    })
  }, [entries, filters.fromDate, filters.toDate])

  async function confirmCleanupExpired() {
    setCleanupBusy(true)
    try {
      await deleteExpiredHistory()
      await loadInitial()
    } catch (err) {
      console.error('Failed to clean expired history:', err)
    } finally {
      setCleanupBusy(false)
      setCleanupConfirmOpen(false)
    }
  }

  async function confirmRestore(entry) {
    if (!entry?.id) return
    try {
      const actor = user?.email || user?.uid || 'super-admin'
      await restoreVersion({ changeId: entry.id, performedBy: actor })
      await loadInitial()
    } catch (err) {
      console.error('Restore failed:', err)
    } finally {
      setRestoreConfirmEntry(null)
    }
  }

  if (!hasPageAccess) {
    return <div className="p-8"><div className="alert alert-error">Only super admin can access change history.</div></div>
  }

  return (
    <AdminLayout section="analytics">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <MdHistory /> Change History
            </h2>
            <p className="text-sm opacity-70 mt-1">
              All system changes from the last 7 days. Entries older than 7 days are automatically removed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-outline gap-2" onClick={loadInitial} disabled={loading}>
              <MdRefresh className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="btn btn-sm btn-warning" onClick={() => setCleanupConfirmOpen(true)}>
              Clean up expired
            </button>
          </div>
        </div>

        <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Collection</label>
            <select
              className="select select-bordered select-sm"
              value={filters.collection}
              onChange={(e) => handleCollectionChange(e.target.value)}
            >
              {COLLECTION_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">From date</label>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={filters.fromDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
            />
          </div>
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">To date</label>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={filters.toDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
            />
          </div>
          <div className="form-control justify-end">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setFilters((prev) => ({ ...prev, fromDate: '', toDate: '' }))}
            >
              Clear date filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 opacity-60">
            <span className="loading loading-spinner loading-lg" />
            <p className="mt-3">Loading change history...</p>
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="text-center py-16 opacity-60 bg-base-100 rounded-xl border border-base-200">
            No history entries found for the selected filters.
          </div>
        ) : (
          <ul className="timeline timeline-vertical">
            {visibleEntries.map((entry) => {
              const action = String(entry.action || 'update').toLowerCase()
              const badgeClass = ACTION_BADGE[action] || 'badge-info'
              const when = formatTimestamp(entry.timestamp)
              const who = String(entry.performedBy || 'system')
              const description = String(entry.description || 'Change recorded')

              return (
                <li key={entry.id}>
                  <div className="timeline-middle">●</div>
                  <div className="timeline-end mb-6 w-full">
                    <article className="bg-base-100 border border-base-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2"><span className={`badge ${badgeClass}`}>{action}</span></div>
                          <p className="text-base sm:text-lg font-semibold leading-snug">{description}</p>
                          <p className="text-sm opacity-70 mt-1">{who} • {when}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-sm btn-outline" onClick={() => setDiffEntry(entry)}>
                            View changes
                          </button>
                          {entry.restorable === true && (
                            <button className="btn btn-sm btn-primary" onClick={() => setRestoreConfirmEntry(entry)}>
                              Restore this version
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  </div>
                  <hr />
                </li>
              )
            })}
          </ul>
        )}

        {lastDoc && (
          <div className="flex justify-center">
            <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {diffEntry && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-5xl">
            <h3 className="font-bold text-lg">Changed fields</h3>
            <p className="text-sm opacity-70 mt-1">Only fields that differ are shown.</p>

            <div className="overflow-x-auto mt-4">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Before</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {collectDiffs(diffEntry.before, diffEntry.after).map((row) => (
                    <tr key={row.field}>
                      <td className="font-semibold align-top">{row.field}</td>
                      <td><pre className="text-xs whitespace-pre-wrap break-words">{stringifyValue(row.before)}</pre></td>
                      <td><pre className="text-xs whitespace-pre-wrap break-words">{stringifyValue(row.after)}</pre></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setDiffEntry(null)}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setDiffEntry(null)}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {cleanupConfirmOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Clean up expired history?</h3>
            <p className="py-2 text-sm opacity-80">This will permanently delete all expired change-history records.</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setCleanupConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-warning" disabled={cleanupBusy} onClick={confirmCleanupExpired}>
                {cleanupBusy ? 'Cleaning…' : 'Confirm cleanup'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setCleanupConfirmOpen(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {restoreConfirmEntry && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Restore this version?</h3>
            <p className="py-2 text-sm opacity-80">
              This will restore {String(restoreConfirmEntry.collection || 'unknown')} / {String(restoreConfirmEntry.docId || 'unknown')} to its state from {formatTimestamp(restoreConfirmEntry.timestamp)}. The current state will be overwritten. Are you sure?
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setRestoreConfirmEntry(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => confirmRestore(restoreConfirmEntry)}>
                Confirm restore
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setRestoreConfirmEntry(null)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </AdminLayout>
  )
}
