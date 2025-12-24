import { useUI } from '../context/UIContext'

const toastClassMap = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
}

export default function AdminLayout({ children, title, description, actions }) {
  const { toasts, dismissToast, confirmState, resolveConfirm } = useUI()

  return (
    <section className="admin-layout space-y-4">
      <div className="page-wrap space-y-6">
        {(title || description || actions) && (
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {title && <h1 className="text-3xl font-semibold tracking-tight text-base-content">{title}</h1>}
              {description && <p className="text-sm opacity-70">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </header>
        )}
        <div className="space-y-6">
          {children}
        </div>
      </div>

      {toasts && toasts.length > 0 && (
        <div className="toast toast-bottom toast-end z-[9999]">
          {toasts.map((toast) => (
            <div key={toast.id} className={`alert shadow-lg ${toastClassMap[toast.type] || 'alert-info'}`}>
              <span className="text-sm flex-1 whitespace-pre-wrap">{toast.msg}</span>
              {toast.action && toast.action.label && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    dismissToast(toast.id)
                    try { toast.action.onClick?.() } catch (err) { console.warn('[toast action] failed', err) }
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => dismissToast(toast.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {confirmState && (
        <dialog open className="modal modal-open">
          <div className="modal-box space-y-4">
            {confirmState.title && <h3 className="text-lg font-semibold">{confirmState.title}</h3>}
            {confirmState.message && <p className="text-sm whitespace-pre-wrap">{confirmState.message}</p>}
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => resolveConfirm(false)}>
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${confirmState.confirmTone === 'danger' ? 'btn-error' : 'btn-primary'}`}
                onClick={() => resolveConfirm(true)}
              >
                {confirmState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => resolveConfirm(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </section>
  )
}
