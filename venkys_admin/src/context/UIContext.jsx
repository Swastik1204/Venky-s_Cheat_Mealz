// UIContext — Global UI state (auth mode, toasts)
import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const UIContext = createContext(null)

const genId = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`)

export function UIProvider({ children }) {
  const [authMode, setAuthMode] = useState(null) // 'login' | 'signup' | null
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  const dismissToast = useCallback((id) => { setToasts(t => t.filter(x => x.id !== id)) }, [])

  const pushToast = useCallback((msg, type = 'info', ttl = 8000, action = null) => {
    const id = genId()
    setToasts(t => [...t, { id, msg, type, action }])
    if (ttl > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl)
    return id
  }, [])

  const confirm = useCallback((options) => { setConfirmState({ ...options }) }, [])

  const resolveConfirm = useCallback((accepted) => {
    setConfirmState(prev => {
      if (!prev) return null
      const { onConfirm, onCancel } = prev
      if (accepted) onConfirm && onConfirm(); else onCancel && onCancel()
      return null
    })
  }, [])

  const openAuth = useCallback((mode) => setAuthMode(mode), [])
  const closeAuth = useCallback(() => setAuthMode(null), [])

  const value = useMemo(() => ({
    authMode,
    openAuth,
    closeAuth,
    toasts,
    pushToast,
    dismissToast,
    confirm,
    confirmState,
    resolveConfirm,
  }), [authMode, toasts, confirmState, openAuth, closeAuth, pushToast, dismissToast, confirm, resolveConfirm])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
