import { useEffect, useState, useMemo } from 'react'
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'
import { MdSearch, MdFilterList, MdRefresh, MdHistory, MdExpandMore, MdExpandLess } from 'react-icons/md'

export default function AuditLogs() {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    collection: 'all',
    action: 'all',
    dateFrom: '',
    dateTo: '',
    performedBy: '',
  })
  const [expandedLog, setExpandedLog] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    loadLogs()
  }, [isAdmin])

  async function loadLogs() {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(100)
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

  function formatTime(date) {
    if (!date) return '—'
    try {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '—'
    }
  }

  function getActionBadge(action) {
    const classes = {
      create: 'badge-success',
      update: 'badge-warning',
      delete: 'badge-error'
    }
    return `badge ${classes[action] || 'badge-ghost'} badge-sm uppercase text-xs font-bold`
  }

  function getCollectionBadge(coll) {
    const colors = {
      orders: 'badge-primary',
      raw_materials: 'badge-secondary',
      roles: 'badge-accent',
      miscellaneous: 'badge-info',
      menu: 'badge-neutral'
    }
    return `badge ${colors[coll] || 'badge-ghost'} badge-sm`
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="page-wrap py-20 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-sm opacity-70 mt-2">Only administrators can view audit logs.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout section="analytics">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <MdHistory /> Audit Logs
            </h2>
            <p className="text-sm opacity-70 mt-1">Track system changes and user actions</p>
          </div>
          <button onClick={loadLogs} className="btn btn-sm btn-outline gap-2">
            <MdRefresh className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Collection</label>
            <select 
              className="select select-bordered select-sm w-full"
              value={filters.collection}
              onChange={e => setFilters(f => ({ ...f, collection: e.target.value }))}
            >
              <option value="all">All Collections</option>
              <option value="orders">Orders</option>
              <option value="menu">Menu</option>
              <option value="raw_materials">Inventory</option>
              <option value="roles">Staff & Roles</option>
              <option value="settings">Settings</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Action</label>
            <select 
              className="select select-bordered select-sm w-full"
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label label-text text-xs font-bold uppercase opacity-70">Performed By</label>
            <input 
              type="text" 
              className="input input-bordered input-sm w-full" 
              placeholder="Email or ID..."
              value={filters.performedBy}
              onChange={e => setFilters(f => ({ ...f, performedBy: e.target.value }))}
            />
          </div>
          <div className="form-control flex justify-end">
             <button 
              className="btn btn-sm btn-ghost w-full"
              onClick={() => setFilters({ collection: 'all', action: 'all', dateFrom: '', dateTo: '', performedBy: '' })}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-20 opacity-50">Loading logs...</div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <div className="text-center py-20 opacity-50 bg-base-100 rounded-xl border border-base-200">
              <div className="text-4xl mb-2">📝</div>
              No logs found matching your filters
            </div>
          ) : (
            Object.entries(groupedLogs).map(([date, dayLogs]) => (
              <div key={date} className="space-y-3">
                <div className="sticky top-0 z-10 bg-base-200/90 backdrop-blur-sm py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider opacity-70 border border-base-300/50">
                  {date}
                </div>
                <div className="grid gap-2">
                  {dayLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`bg-base-100 rounded-lg border border-base-200 overflow-hidden transition-all duration-200 ${expandedLog === log.id ? 'shadow-md ring-1 ring-primary/20' : 'hover:border-base-300'}`}
                    >
                      <div 
                        className="p-3 flex items-center gap-4 cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <div className="font-mono text-xs opacity-50 w-16 shrink-0">
                          {formatTime(log.timestamp)}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={getActionBadge(log.action)}>{log.action}</span>
                            <span className={getCollectionBadge(log.collection)}>{log.collection}</span>
                          </div>
                          <div className="text-sm font-medium truncate opacity-90">
                            {log.details || 'No details provided'}
                          </div>
                        </div>

                        <div className="text-xs opacity-60 hidden sm:block truncate max-w-[150px]">
                          {log.performedBy || 'System'}
                        </div>

                        <div className="opacity-30">
                          {expandedLog === log.id ? <MdExpandLess /> : <MdExpandMore />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedLog === log.id && (
                        <div className="px-4 pb-4 pt-0 border-t border-base-200/50 bg-base-50/50">
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="font-bold opacity-70 mb-1">Document ID</div>
                              <div className="font-mono bg-base-200 p-1 rounded select-all">{log.docId || log.documentId}</div>
                            </div>
                            <div>
                              <div className="font-bold opacity-70 mb-1">Performed By</div>
                              <div className="font-mono bg-base-200 p-1 rounded select-all">{log.performedBy}</div>
                            </div>
                          </div>
                          
                          {log.metadata?.changedFields && (
                            <div className="mt-4">
                              <div className="font-bold opacity-70 mb-2">Changes</div>
                              <div className="bg-base-100 rounded-lg border border-base-200 p-3">
                                {Object.entries(log.metadata.changedFields).map(([key, val]) => (
                                  <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-2 text-sm border-b border-base-200 last:border-0 py-2 first:pt-0 last:pb-0">
                                    <div className="font-semibold min-w-[100px] opacity-70 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="bg-base-200/50 px-2 py-1 rounded text-xs break-all">
                                        <span className="font-bold mr-1 opacity-50">PREV:</span>
                                        {typeof val.from === 'object' ? JSON.stringify(val.from) : String(val.from ?? '—')}
                                      </div>
                                      <div className="bg-primary/10 text-primary-content/90 px-2 py-1 rounded text-xs break-all">
                                        <span className="font-bold mr-1 opacity-50">NEW:</span>
                                        {typeof val.to === 'object' ? JSON.stringify(val.to) : String(val.to ?? '—')}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {log.metadata && (
                            <div className="mt-4">
                              <div className="font-bold opacity-70 mb-2">Raw Metadata</div>
                              <div className="bg-base-300/30 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
