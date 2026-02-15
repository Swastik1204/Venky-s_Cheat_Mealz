import { createContext, useContext, useMemo, useState, useCallback } from 'react'

const UIContext = createContext(null)

const genId = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`)

export function UIProvider({ children }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [authMode, setAuthMode] = useState(null) // 'login' | 'signup' | null
  const [toasts, setToasts] = useState([]) // {id, type, msg}
  const [confirmState, setConfirmState] = useState(null) // { message, onConfirm, onCancel }

  const pushToast = useCallback((msg, type = 'info', ttl = 5000) => {
    const id = genId()
    setToasts(t => [...t, { id, msg, type }])
    if (ttl > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl)
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const confirm = useCallback((options) => {
    setConfirmState({ ...options })
  }, [])

  const resolveConfirm = useCallback((accepted) => {
    setConfirmState(prev => {
      if (!prev) return null
      const { onConfirm, onCancel } = prev
      if (accepted) onConfirm && onConfirm()
      else onCancel && onCancel()
      return null
    })
  }, [])

  const openItem = useCallback((item) => setSelectedItem(item), [])
  const closeItem = useCallback(() => setSelectedItem(null), [])
  const openAuth = useCallback((mode) => setAuthMode(mode), [])
  const closeAuth = useCallback(() => setAuthMode(null), [])

  const value = useMemo(() => ({
    selectedItem,
    openItem,
    closeItem,
    authMode,
    openAuth,
    closeAuth,
    // Toasts
    toasts,
    pushToast,
    dismissToast,
    // Confirm modal
    confirm,
    confirmState,
    resolveConfirm,
  }), [selectedItem, authMode, toasts, confirmState, openItem, closeItem, openAuth, closeAuth, pushToast, dismissToast, confirm, resolveConfirm])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

let _uiWarned = false
export function useUI() {
  const ctx = useContext(UIContext)
  if (ctx) return ctx
  // Fallback (prevents hard crash if provider ordering issue). Warn once.
  if (!_uiWarned) {
    console.warn('[UIContext] useUI called outside of provider – returning no-op fallback. Wrap app with <UIProvider/> to enable full functionality.')
    _uiWarned = true
  }
  return {
    selectedItem: null,
    openItem: () => {},
    closeItem: () => {},
    authMode: null,
    openAuth: () => {},
    closeAuth: () => {},
    toasts: [],
  pushToast: () => genId(),
    dismissToast: () => {},
    confirm: () => {},
    confirmState: null,
    resolveConfirm: () => {},
  }
}
