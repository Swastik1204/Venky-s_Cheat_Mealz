import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { MdHome, MdRestaurantMenu, MdShoppingCart, MdPerson, MdReceiptLong, MdLogin } from 'react-icons/md'

/* DaisyUI dock: appears fixed bottom on mobile, side-floating on desktop */
export default function QuickDock() {
  const { totalQty } = useCart()
  const { user } = useAuth()
  const { openAuth } = useUI()
  const navigate = useNavigate()
  const location = useLocation()

  function goHome() {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollToTop: true } })
    }
  }

  function goMenu() {
    if (location.pathname === '/') {
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/', { state: { scrollTo: 'menu' } })
    }
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 pointer-events-none">
      <div className="pointer-events-auto flex w-full bg-base-100/85 backdrop-blur border-t border-base-300/60 shadow-lg">
        <button onClick={goHome} className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
          <MdHome className="icon-mobile" />
          <span className="label-mobile">Home</span>
        </button>
        <button onClick={goMenu} className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
          <MdRestaurantMenu className="icon-mobile" />
          <span className="label-mobile">Menu</span>
        </button>
        <label htmlFor="cart-drawer" className="dock-btn relative flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition cursor-pointer">
          <MdShoppingCart className="icon-mobile" />
          <span className="label-mobile">Cart</span>
          {totalQty > 0 && <span className="badge badge-secondary badge-xs absolute top-1 right-1 translate-x-1/2 -translate-y-1/2">{totalQty}</span>}
        </label>
        {user ? (
          <Link to="/profile" className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
            <MdPerson className="icon-mobile" />
            <span className="label-mobile">Profile</span>
          </Link>
        ) : (
          <button className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition" onClick={() => openAuth('login')}>
            <MdLogin className="icon-mobile" />
            <span className="label-mobile">Login</span>
          </button>
        )}
        <Link to="/profile#orders" className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
          <MdReceiptLong className="icon-mobile" />
          <span className="label-mobile">Orders</span>
        </Link>
      </div>
      {/* Utility styles for icons (could move to global CSS if desired) */}
      <style>{`
        .icon-mobile { width:1.75rem; height:1.75rem; }
        .label-mobile { font-size:0.65rem; line-height:0.9rem; }
        @media (min-width: 640px) { /* sm and up shrink icons */
          .icon-mobile { width:1.25rem; height:1.25rem; }
          .label-mobile { font-size:0.6rem; }
        }
        @media (orientation: landscape) and (max-height: 500px) {
          .icon-mobile { width:1.2rem; height:1.2rem; }
        }
      `}</style>
    </div>
  )
}
