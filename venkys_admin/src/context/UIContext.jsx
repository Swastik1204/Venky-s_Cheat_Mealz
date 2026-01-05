import { createContext, useContext, useState } from 'react'

const UIContext = createContext(null)

const genId = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`)

export function UIProvider({ children }) {
  const [authMode, setAuthMode] = useState(null) // 'login' | 'signup' | null
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  function pushToast(msg, type = 'info', ttl = 8000, action = null) {
    const id = genId()
    setToasts(t => [...t, { id, msg, type, action }])
    if (ttl > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl)
    return id
  }
  function dismissToast(id) { setToasts(t => t.filter(x => x.id !== id)) }
  function confirm(options) { setConfirmState({ ...options }) }
  function resolveConfirm(accepted) {
    if (!confirmState) return
    const { onConfirm, onCancel } = confirmState
    setConfirmState(null)
    if (accepted) onConfirm && onConfirm(); else onCancel && onCancel()
  }

  const value = {
    authMode,
    openAuth: (mode) => setAuthMode(mode),
    closeAuth: () => setAuthMode(null),
    toasts,
    pushToast,
    dismissToast,
    confirm,
    confirmState,
    resolveConfirm,
  }

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
