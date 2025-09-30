import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import logo from '../assets/logo.png'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { MdLocationOn } from 'react-icons/md'

export default function NavBar() {
  const { totalQty } = useCart()
  // On mount, respect any previously chosen theme in localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const root = document.documentElement
    if (saved) root.setAttribute('data-theme', saved)
  }, [])
  const isDark = typeof window !== 'undefined' ? localStorage.getItem('theme') === 'dark' : false
  const { label: locLabel, loading: isLocating, locate } = useDeliveryLocation('Durgapur')
  const { user, logout } = useAuth()
  const { openAuth } = useUI()
  return (
    <div className="nav-sticky">
      <div className="nav-wrap">
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2">
          {/* Left: Logo */}
          <Link to="/" className="shrink-0" aria-label="Home">
            <img src={logo} alt="Venky's" className="brand-logo" />
          </Link>

          {/* Middle: Search box */}
          <div className="flex-1 min-w-0">
            <div className="search-box">
              {/* Location pin */}
              <MdLocationOn className="w-5 h-5 text-secondary" />
              <button
                type="button"
                onClick={() => locate().catch(() => {})}
                className="btn btn-ghost btn-xs sm:btn-sm normal-case px-1 sm:px-2 hidden sm:flex"
                aria-label="Use current location for delivery"
              >
                <span className="hidden sm:inline flex items-center">
                  {locLabel}
                  {isLocating && <span className="loading loading-spinner loading-xs ml-2" />}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-60 ml-1">
                  <path fillRule="evenodd" d="M6.72 9.22a.75.75 0 0 1 1.06.02L12 13.94l4.22-4.7a.75.75 0 1 1 1.1 1.02l-4.75 5.29a1.25 1.25 0 0 1-1.86 0L6.7 10.3a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="v-sep hidden sm:inline">|</span>
              {/* Search icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-60">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.245 12.037l3.734 3.734a.75.75 0 1 0 1.06-1.06l-3.734-3.735A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search for restaurant, cuisine or a dish"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Right: Theme toggle + Cart button */}
          <div className="shrink-0 flex items-center gap-2">
            {/* DaisyUI theme controller (venkys <-> dark) */}
            <label aria-label="Toggle theme" className="btn btn-ghost btn-square swap swap-rotate">
              {/* this hidden checkbox controls the state */}
              <input
                type="checkbox"
                className="theme-controller"
                value="dark"
                defaultChecked={isDark}
                onChange={(e) => {
                  const next = e.target.checked ? 'dark' : 'venkys'
                  try { localStorage.setItem('theme', next) } catch {}
                }}
              />

              {/* sun icon (shows in dark mode) */}
              <svg className="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>

              {/* moon icon (shows in light mode) */}
              <svg className="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>
            {/* Auth actions */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-2">
                <button className="btn btn-sm" onClick={() => openAuth('login')}>Login</button>
                <button className="btn btn-sm btn-outline" onClick={() => openAuth('signup')}>Sign up</button>
              </div>
            ) : (
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost">
                  <div className="flex items-center gap-2">
                    <div className="avatar placeholder">
                      <div className="w-7 rounded-full bg-base-300 text-base-content">
                        <span className="text-xs">{(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}</span>
                      </div>
                    </div>
                    <span className="hidden md:inline max-w-[10rem] truncate">{user.displayName || user.email}</span>
                  </div>
                </div>
                <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                  <li><Link to="/orders">My Orders</Link></li>
                  <li><button onClick={logout}>Logout</button></li>
                </ul>
              </div>
            )}

            <label htmlFor="cart-drawer" className="btn btn-primary whitespace-nowrap cursor-pointer">
              <span className="hidden md:inline">Cart</span>
              <span className="badge badge-sm ml-2">{totalQty}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
