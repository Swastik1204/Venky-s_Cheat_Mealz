// CartDrawer — Slide-out cart panel with item list and totals
import { Link } from 'react-router-dom'
import { MdDelete, MdShoppingCart, MdClose, MdAdd, MdRemove } from 'react-icons/md'

import { useCart } from '../context/CartContext'
import { formatINR } from '../lib/formatCurrency'

export default function CartDrawer({ children }) {
  const { entries, subtotal, remove, setQty, clear } = useCart()

  return (
    <div className="drawer drawer-end" id="cartDrawerRoot">
      <input id="cart-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {children}
      </div>
      <div className="drawer-side z-50">
        <label htmlFor="cart-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="w-80 sm:w-96 min-h-full flex flex-col bg-base-100">
          {/* Header */}
          <div className="p-4 border-b border-base-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MdShoppingCart className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Your Cart</h2>
              {entries.length > 0 && (
                <span className="badge badge-primary badge-sm">{entries.length}</span>
              )}
            </div>
            <label htmlFor="cart-drawer" className="btn btn-ghost btn-sm btn-circle">
              <MdClose className="w-5 h-5" />
            </label>
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center mb-4">
                  <MdShoppingCart className="w-12 h-12 opacity-30" />
                </div>
                <h3 className="font-bold text-lg mb-1">Your cart is empty</h3>
                <p className="text-sm opacity-60 mb-6">Looks like you haven't added anything yet</p>
                <Link 
                  to="/" 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const checkbox = document.getElementById('cart-drawer')
                    if (checkbox) checkbox.checked = false
                  }}
                >
                  Browse Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(({ item: it, qty }) => (
                  <div key={it.id} className="card bg-base-200/50 border border-base-200">
                    <div className="card-body p-3">
                      <div className="flex gap-3">
                        {it.imageUrl || it.img ? (
                          <img src={it.imageUrl || it.img} alt={it.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-base-300 rounded-lg flex items-center justify-center text-2xl">🍽️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-sm leading-tight truncate">{it.name}</h4>
                            <button className="btn btn-ghost btn-xs btn-circle flex-shrink-0 opacity-50 hover:opacity-100 hover:text-error" onClick={() => remove(it.id)}>
                              <MdClose className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm font-bold text-primary mt-1">{formatINR(Number(it?.rate ?? it?.price ?? 0) * qty)}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-60">{formatINR(Number(it?.rate ?? it?.price ?? 0))} each</span>
                            <div className="join join-horizontal">
                              <button 
                                className="btn btn-xs join-item" 
                                onClick={() => qty > 1 ? setQty(it.id, qty - 1) : remove(it.id)}
                              >
                                {qty > 1 ? <MdRemove className="w-3 h-3" /> : <MdDelete className="w-3 h-3" />}
                              </button>
                              <span className="btn btn-xs join-item no-animation pointer-events-none min-w-[2rem]">{qty}</span>
                              <button className="btn btn-xs join-item" onClick={() => setQty(it.id, qty + 1)}>
                                <MdAdd className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {entries.length > 0 && (
            <div className="p-4 border-t border-base-200 bg-base-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70">Subtotal ({entries.reduce((s, e) => s + e.qty, 0)} items)</span>
                <span className="font-bold text-lg">{formatINR(subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={clear} className="btn btn-ghost btn-sm flex-1">Clear</button>
                <Link to="/checkout" className="btn btn-primary btn-sm flex-1" onClick={() => {
                  const checkbox = document.getElementById('cart-drawer')
                  if (checkbox) checkbox.checked = false
                }}>Checkout</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
