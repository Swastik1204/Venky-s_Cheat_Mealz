// FloatingCartBar — Sticky bottom bar showing cart summary
import { useMemo } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'
import { MdShoppingCart } from 'react-icons/md'

import { useCart } from '../context/CartContext'

export default function FloatingCartBar() {
  const { subtotal, totalQty } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [])

  if (!totalQty || location.pathname === '/checkout') {
    return null
  }

  const subtotalLabel = currencyFormatter.format(subtotal || 0)

  const handleBarClick = () => {
    const drawer = document.getElementById('cart-drawer')
    if (drawer) drawer.checked = true
  }

  return (
    <div className="fixed inset-x-0 bottom-[4.25rem] sm:bottom-[4.5rem] md:bottom-[4.25rem] z-40 pointer-events-none">
      <div className="px-4 pointer-events-auto">
        <div 
          onClick={handleBarClick}
          className="mx-auto max-w-4xl rounded-2xl bg-secondary text-secondary-content shadow-[0_8px_30px_rgba(239,68,68,0.5)] px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-transform active:scale-95 border border-secondary-content/10"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-content/20 text-secondary-content shadow-sm backdrop-blur-sm">
              <MdShoppingCart className="w-5 h-5" />
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] rounded-full bg-white text-secondary text-[10px] font-bold grid place-items-center px-1 shadow-sm">
                  {totalQty > 99 ? '99+' : totalQty}
                </span>
              )}
            </span>
            <div className="space-y-0.5">
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">Cart</div>
              <div className="text-sm font-bold leading-tight flex items-center gap-1.5">
                <span>{totalQty} item{totalQty === 1 ? '' : 's'}</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                <span>{subtotalLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-warning btn-sm h-10 min-h-0 rounded-xl shadow-md border-none animate-none hover:brightness-110 px-6 font-extrabold tracking-wide text-warning-content"
              onClick={(e) => {
                e.stopPropagation()
                navigate('/checkout')
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
