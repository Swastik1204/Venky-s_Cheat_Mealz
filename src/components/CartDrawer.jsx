import { useCart } from '../context/CartContext'
import { MdDelete } from 'react-icons/md'
import { MdRemoveShoppingCart } from 'react-icons/md'
import { Link } from 'react-router-dom'

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
          <ul className="menu w-72 sm:w-80 min-h-full p-4 space-y-4 bg-base-100">
            <div className="flex items-center">
              <h2 className="text-xl font-bold">Your Cart</h2>
            </div>
          <div className="divide-y">
            {entries.length === 0 ? (
                <div className="py-14 text-center">
                  <MdRemoveShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <div className="font-medium opacity-80">Your cart is empty</div>
                  <div className="text-sm opacity-60">Add items to get started</div>
                </div>
            ) : (
              entries.map(({ item: it, qty }) => (
                <div key={it.id} className="py-3 flex items-center gap-3">
                  {it.imageUrl || it.img ? (
                    <img src={it.imageUrl || it.img} alt={it.name} className="img-thumb-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-base-200 grid place-items-center rounded">🍽️</div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm opacity-70">₹{it.price} x {qty}</div>
                  </div>
                  <div className="join">
                    {qty > 1 ? (
                      <button className="btn btn-xs join-item" onClick={() => setQty(it.id, Math.max(1, qty - 1))}>-</button>
                    ) : (
                      <button className="btn btn-xs join-item" aria-label="Remove item" onClick={() => remove(it.id)}>
                        <MdDelete className="w-4 h-4" />
                      </button>
                    )}
                    <input className="input input-xs input-bordered w-12 text-center join-item" value={qty} onChange={(e)=> {
                      const n = Number(e.target.value)
                      setQty(it.id, Number.isFinite(n) && n > 0 ? Math.floor(n) : 1)
                    }} />
                    <button className="btn btn-xs join-item" onClick={() => setQty(it.id, qty + 1)}>+</button>
                  </div>
                  <button className="btn btn-ghost btn-xs" onClick={() => remove(it.id)}>✕</button>
                </div>
              ))
            )}
          </div>
          <div className="panel-footer">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Subtotal</div>
              <div className="font-bold">₹{subtotal}</div>
            </div>
            <div className="flex gap-2">
              <label htmlFor="cart-drawer" className="btn btn-ghost flex-1">Continue</label>
              <Link to="/checkout" className="btn btn-primary flex-1" onClick={() => {
                const checkbox = document.getElementById('cart-drawer')
                if (checkbox) checkbox.checked = false
              }}>Checkout</Link>
            </div>
          </div>
        </ul>
      </div>
    </div>
  )
}
