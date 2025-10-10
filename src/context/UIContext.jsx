import { createContext, useContext, useMemo, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [authMode, setAuthMode] = useState(null) // 'login' | 'signup' | null
  const [toasts, setToasts] = useState([]) // {id, type, msg}
  const [confirmState, setConfirmState] = useState(null) // { message, onConfirm, onCancel }

  function pushToast(msg, type = 'info', ttl = 4000) {
    const id = crypto.randomUUID()
    setToasts(t => [...t, { id, msg, type }])
    if (ttl > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl)
    return id
  }

  function dismissToast(id) {
    setToasts(t => t.filter(x => x.id !== id))
  }

  function confirm(options) {
    setConfirmState({ ...options })
  }

  function resolveConfirm(accepted) {
    if (!confirmState) return
    const { onConfirm, onCancel } = confirmState
    setConfirmState(null)
    if (accepted) onConfirm && onConfirm()
    else onCancel && onCancel()
  }

  const value = useMemo(() => ({
    selectedItem,
    openItem: (item) => setSelectedItem(item),
    closeItem: () => setSelectedItem(null),
    authMode,
    openAuth: (mode) => setAuthMode(mode),
    closeAuth: () => setAuthMode(null),
    // Toasts
    toasts,
    pushToast,
    dismissToast,
    // Confirm modal
    confirm,
    confirmState,
    resolveConfirm,
  }), [selectedItem, authMode, toasts, confirmState])

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
  const genId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))
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
