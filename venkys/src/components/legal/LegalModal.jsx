import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Generic overlay chrome for a legal page opened from in-app (footer/profile)
 * rather than a direct URL visit. Wraps the SAME content component the full
 * standalone page uses — no content duplication.
 *
 * Closing always goes back one history entry: the entry was pushed by
 * <LegalLink>'s router navigation (with `state.background`), so `navigate(-1)`
 * both removes that entry and clears `state.background`, which is what makes
 * the underlying page (not this modal) render on the next paint.
 */
export default function LegalModal({ title, children }) {
  const navigate = useNavigate()
  const close = () => navigate(-1)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-fade-in"
      onClick={close}
      role="presentation"
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[85vh] sm:rounded-2xl rounded-t-2xl bg-base-100 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-content/10 shrink-0">
          <span className="font-semibold text-sm">{title}</span>
          <button
            type="button"
            onClick={close}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
