/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useReducer } from 'react'

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
