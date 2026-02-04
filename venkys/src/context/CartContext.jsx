import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { useAuth } from './AuthContext'
import { loadCart, saveCart } from '../lib/data'
import { useUI } from './UIContext'

const CartContext = createContext(null)
const GUEST_CART_KEY = 'venkys_guest_cart_v1'

function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const items = action.items && typeof action.items === 'object' ? action.items : {}
      return { items }
    }
    case 'ADD': {
      const { item } = action
      const existing = state.items[item.id]
      const qty = (existing?.qty || 0) + (action.qty || 1)
      return {
        ...state,
        items: {
          ...state.items,
          [item.id]: { item, qty },
        },
      }
    }
    case 'REMOVE': {
      const { id } = action
      const { [id]: _, ...rest } = state.items
      return { ...state, items: rest }
    }
    case 'SET_QTY': {
      const { id, qty } = action
      if (qty <= 0) {
        const { [id]: _, ...rest } = state.items
        return { ...state, items: rest }
      }
      return {
        ...state,
        items: {
          ...state.items,
          [id]: { item: state.items[id].item, qty },
        },
      }
    }
    case 'CLEAR':
      return { items: {} }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: {} })
  const { user } = useAuth()
  const { pushToast, openAuth } = useUI()
  const saveTimer = useRef(null)
  const lastSerialized = useRef('')
  const saveDeniedRef = useRef(false)
  const loadedOnceRef = useRef(false)
  const guestLoadedRef = useRef(false)

  function readGuestCart() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_CART_KEY) : null
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  function writeGuestCart(items) {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items || {}))
    } catch { /* no-op */ }
  }
  function clearGuestCart() {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(GUEST_CART_KEY) } catch { /* no-op */ }
  }

  // Load cart when user logs in; merge guest cart if present
  useEffect(() => {
    if (!user) {
      // Hydrate guest cart from localStorage when not logged in
      if (!guestLoadedRef.current) {
        const guestItems = readGuestCart()
        dispatch({ type: 'HYDRATE', items: guestItems })
        guestLoadedRef.current = true
      }
      return
    }
    let mounted = true
    loadCart(user.uid).then(items => {
      if (!mounted) return
      if (items && items.__error === 'permission-denied') {
        pushToast('Cart access denied. Please re-login or check permissions.', 'error', 6000)
        loadedOnceRef.current = true
        return
      }
      if (items && typeof items === 'object') {
        const backendItems = items.__error ? {} : items
        const guestItems = readGuestCart()
        // Merge guest into backend (sum quantities)
        const merged = { ...backendItems }
        Object.entries(guestItems || {}).forEach(([id, entry]) => {
          const current = merged[id]
          const qty = (current?.qty || 0) + (entry?.qty || 0)
          if (qty > 0) merged[id] = { item: entry.item || current?.item, qty }
        })
        dispatch({ type: 'HYDRATE', items: merged })
        // Save merged to backend and clear guest storage
        saveCart(user.uid, merged).catch(() => {})
        clearGuestCart()
      }
      loadedOnceRef.current = true
    })
    return () => { mounted = false }
  }, [user, pushToast])

  // Persist (debounced) when items change
  useEffect(() => {
    const serialized = JSON.stringify(state.items)
    if (serialized === lastSerialized.current) return
    lastSerialized.current = serialized
    // Guest persistence
    if (!user) {
      writeGuestCart(state.items)
      return
    }
    if (!loadedOnceRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await saveCart(user.uid, state.items)
      if (res && res.__error === 'permission-denied' && !saveDeniedRef.current) {
        saveDeniedRef.current = true
        pushToast('Cannot save cart (permission denied).', 'error', 5000)
      }
    }, 600) // debounce 600ms
    return () => saveTimer.current && clearTimeout(saveTimer.current)
  }, [state.items, user, pushToast])

  const value = useMemo(() => {
    const entries = Object.values(state.items)
    const subtotal = entries.reduce((sum, { item, qty }) => {
      const unit = Number(item?.rate ?? item?.price ?? 0)
      return sum + unit * qty
    }, 0)
    const totalQty = entries.reduce((sum, { qty }) => sum + qty, 0)

    return {
      items: state.items,
      entries,
      subtotal,
      totalQty,
      add: (item, qty = 1) => {
        dispatch({ type: 'ADD', item, qty })
        // Optional: Notify user item added
        // pushToast(`Added ${item.name} to cart`, 'success')
      },
      remove: (id) => dispatch({ type: 'REMOVE', id }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      clear: () => {
        dispatch({ type: 'CLEAR' })
        try { if (typeof localStorage !== 'undefined') localStorage.removeItem(GUEST_CART_KEY) } catch {}
        if (user) {
          saveCart(user.uid, {}).catch(() => {})
        }
      },
    }
  }, [state, user])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
