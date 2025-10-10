/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { useAuth } from './AuthContext'
import { loadCart, saveCart } from '../lib/data'
import { useUI } from './UIContext'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
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
  const { pushToast } = useUI()
  const saveTimer = useRef(null)
  const lastSerialized = useRef('')
  const saveDeniedRef = useRef(false)

  // Load cart when user logs in
  useEffect(() => {
    if (!user) {
      // optionally keep guest cart; leaving as-is
      return
    }
    let mounted = true
    loadCart(user.uid).then(items => {
      if (!mounted) return
      if (items && items.__error === 'permission-denied') {
        pushToast('Cart access denied. Please re-login or check permissions.', 'error', 6000)
        return
      }
      if (items && typeof items === 'object') {
        dispatch({ type: 'HYDRATE', items: items.__error ? {} : items })
      }
    })
    return () => { mounted = false }
  }, [user])

  // Extend reducer to handle HYDRATE
  if (!cartReducer._extended) {
    const base = cartReducer
    cartReducer = function(state, action) { // eslint-disable-line no-func-assign
      if (action.type === 'HYDRATE') {
        return { items: action.items || {} }
      }
      return base(state, action)
    }
    cartReducer._extended = true
  }

  // Persist (debounced) when items change and user logged in
  useEffect(() => {
    if (!user) return
    const serialized = JSON.stringify(state.items)
    if (serialized === lastSerialized.current) return
    lastSerialized.current = serialized
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await saveCart(user.uid, state.items)
      if (res && res.__error === 'permission-denied' && !saveDeniedRef.current) {
        saveDeniedRef.current = true
        pushToast('Cannot save cart (permission denied).', 'error', 5000)
      }
    }, 600) // debounce 600ms
    return () => saveTimer.current && clearTimeout(saveTimer.current)
  }, [state.items, user])

  const value = useMemo(() => {
    const entries = Object.values(state.items)
    const subtotal = entries.reduce((sum, { item, qty }) => sum + item.price * qty, 0)
    const totalQty = entries.reduce((sum, { qty }) => sum + qty, 0)

    return {
      items: state.items,
      entries,
      subtotal,
      totalQty,
      add: (item, qty = 1) => dispatch({ type: 'ADD', item, qty }),
      remove: (id) => dispatch({ type: 'REMOVE', id }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      clear: () => dispatch({ type: 'CLEAR' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
