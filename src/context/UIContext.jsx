import { createContext, useContext, useMemo, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [authMode, setAuthMode] = useState(null) // 'login' | 'signup' | null

  const value = useMemo(() => ({
    selectedItem,
    openItem: (item) => setSelectedItem(item),
    closeItem: () => setSelectedItem(null),
    authMode,
    openAuth: (mode) => setAuthMode(mode),
    closeAuth: () => setAuthMode(null),
  }), [selectedItem, authMode])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
