import { useMemo } from 'react'
import { MdShoppingCart } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'
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

  return (
    <div className="fixed inset-x-0 bottom-16 sm:bottom-20 lg:bottom-6 z-40 pointer-events-none">
      <div className="px-4 pointer-events-auto">
        <div className="mx-auto max-w-4xl rounded-2xl border border-base-300/70 bg-base-100 shadow-[0_10px_40px_-15px_rgba(15,23,42,0.65)] px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
              <MdShoppingCart className="w-5 h-5" />
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] rounded-full bg-primary text-primary-content text-[10px] font-semibold grid place-items-center px-1">
                  {totalQty > 99 ? '99+' : totalQty}
                </span>
              )}
            </span>
            <div className="space-y-0">
              <div className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Cart</div>
              <div className="text-sm font-bold text-base-content leading-tight">{totalQty} item{totalQty === 1 ? '' : 's'} • {subtotalLabel}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary btn-sm h-10 min-h-0 rounded-xl shadow-md shadow-primary/30 px-6"
              onClick={() => navigate('/checkout')}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
