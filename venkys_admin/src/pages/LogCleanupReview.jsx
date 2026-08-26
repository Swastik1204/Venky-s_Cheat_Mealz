// LogCleanupReview — /admin/log-cleanup?token=... — review-before-delete
// UI for the weekly old-logs cleanup batch. Reached only from within the
// already-authenticated admin app (see App.jsx route gate: isSuperAdmin),
// so a leaked link alone does nothing without that session.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { MdCheckCircle, MdError, MdDeleteSweep } from 'react-icons/md'

import { db } from '../lib/firebase'
import { useUI } from '../context/UIContext'
import { deleteSelectedLogs } from '../lib/data-log-cleanup'

export default function LogCleanupReview() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { pushToast } = useUI()

  const [state, setState] = useState('loading') // loading | not_found | superseded | completed | ready | deleting | done
  const [batch, setBatch] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!token) {
      setState('not_found')
      return
    }
    let cancelled = false
    getDoc(doc(db, 'pendingLogCleanup', token)).then((snap) => {
      if (cancelled) return
      if (!snap.exists()) {
        setState('not_found')
        return
      }
      const data = snap.data()
      setBatch(data)
      if (data.status === 'pending') {
        setSelected(new Set((data.candidates || []).map((c) => c.id)))
        setState('ready')
      } else if (data.status === 'superseded') {
        setState('superseded')
      } else {
        setState('completed')
      }
    }).catch(() => setState('not_found'))
    return () => { cancelled = true }
  }, [token])

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const doDelete = async () => {
    setConfirmOpen(false)
    setState('deleting')
    try {
      const res = await deleteSelectedLogs(token, Array.from(selected))
      setResult(res)
      setState('done')
      pushToast(`Deleted ${res.deletedCount} log${res.deletedCount === 1 ? '' : 's'}`, 'success')
    } catch (err) {
      pushToast(err.message || 'Failed to delete logs', 'error')
      setState('ready')
    }
  }

  return (
    <div className="page-wrap py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Log Cleanup Review</h1>
      <p className="text-sm opacity-70 mb-6">Weekly batch of audit logs older than 2 months. Nothing is deleted until you confirm.</p>

      {state === 'loading' && (
        <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>
      )}

      {state === 'not_found' && (
        <div className="alert alert-error"><MdError className="text-xl" /><span>This review link is invalid or has already been cleared.</span></div>
      )}

      {state === 'superseded' && (
        <div className="alert alert-warning"><MdError className="text-xl" /><span>This batch was superseded by a newer weekly scan — check your most recent cleanup email for the current link.</span></div>
      )}

      {state === 'completed' && (
        <div className="alert alert-info"><MdCheckCircle className="text-xl" /><span>This batch has already been actioned.</span></div>
      )}

      {(state === 'ready' || state === 'deleting') && batch && (
        <>
          <div className="rounded-2xl border border-base-300/60 bg-base-100/80 p-4 mb-4 flex items-center justify-between">
            <span className="text-sm">{selected.size} of {batch.candidates.length} selected for deletion</span>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-xs" onClick={() => setSelected(new Set(batch.candidates.map((c) => c.id)))}>Select all</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelected(new Set())}>Select none</button>
            </div>
          </div>

          <div className="rounded-2xl border border-base-300/60 divide-y divide-base-300/40 max-h-[60vh] overflow-y-auto">
            {batch.candidates.map((c) => (
              <label key={c.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-base-200/40">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-0.5"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  disabled={state === 'deleting'}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{c.readableAction}</div>
                  <div className="text-xs opacity-50 mt-0.5">{c.timestampLabel}{c.collection ? ` • ${c.collection}` : ''}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              className="btn btn-error gap-2"
              disabled={selected.size === 0 || state === 'deleting'}
              onClick={() => setConfirmOpen(true)}
            >
              <MdDeleteSweep className="text-lg" />
              {state === 'deleting' ? 'Deleting…' : `Delete Selected (${selected.size})`}
            </button>
          </div>
        </>
      )}

      {state === 'done' && result && (
        <div className="alert alert-success">
          <MdCheckCircle className="text-2xl" />
          <span>Deleted {result.deletedCount} log{result.deletedCount === 1 ? '' : 's'}. Done — you can close this page.</span>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmOpen(false)}>
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Are you sure?</h3>
            <p className="text-sm opacity-80 mb-6">This will permanently delete {selected.size} log{selected.size === 1 ? '' : 's'}. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-error" onClick={doDelete}>Delete {selected.size}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
