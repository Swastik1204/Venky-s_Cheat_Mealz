import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { getUserTheme, setUserTheme } from '../lib/data'
import { fetchStoreStatus, setStoreOpen } from '../lib/storeStatus'
import { MdLogin, MdPerson, MdMenu, MdClose, MdPrint } from 'react-icons/md'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

function AdminLinks({ section, vertical = false, onClick }) {
  const { pathname } = useLocation()
  const { canAccess } = useAuth()

  const links = useMemo(() => {
    const defs = [
      { key: 'inventory', label: 'Inventory', to: '/admin/inventory' },
      { key: 'stock', label: 'Stock', to: '/admin/stock' },
      { key: 'orders', label: 'Orders', to: '/admin/orders' },
      { key: 'analytics', label: 'Analytics', to: '/admin/analytics' },
      { key: 'appearance', label: 'Appearance', to: '/admin/appearance' },
      { key: 'settings', label: 'Settings', to: '/admin/settings' },
      { key: 'logs', label: 'Logs', to: '/admin/logs' },
      { key: 'biller', label: 'Biller', to: '/admin/biller' },
      { key: 'delivery', label: 'Delivery', to: '/admin/delivery' },
    ]
    return defs.filter((d) => canAccess(d.key))
  }, [canAccess])

  const pathSection = pathname.startsWith('/admin/') ? pathname.split('/')[2] : null
  const active = section || pathSection || links[0]?.key || 'inventory'
  
  const baseLinkClass = vertical 
    ? "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors" 
    : "admin-nav-link"

  const activeClass = vertical
    ? "bg-primary/10 text-primary"
    : "admin-nav-link--active"

  const inactiveClass = vertical
    ? "text-base-content/70 hover:bg-base-200 hover:text-base-content"
    : ""

  const linkCls = (key) => `${baseLinkClass} ${active === key ? activeClass : inactiveClass}`.trim()

  const containerClass = vertical
    ? "flex flex-col gap-1 py-2"
    : "admin-nav-links"

  return (
    <nav className={containerClass} aria-label="Admin sections">
      {links.map((l) => (
        <Link key={l.key} to={l.to} onClick={onClick} className={linkCls(l.key)} aria-current={active === l.key ? 'page' : undefined}>{l.label}</Link>
      ))}
    </nav>
  )
}

export function AdminNav({ section, bare = true }) {
  const links = <AdminLinks section={section} />
  if (bare) return links
  return (
    <div className="admin-panel px-4 py-4">
      {links}
    </div>
  )
}

export default function AdminTopNav() {
  const { user, logout, isStaffMember, roleLoading, isAdmin, role } = useAuth()
  const { openAuth } = useUI()
  const { pathname } = useLocation()
  const [theme, setTheme] = useState('venkys_light')
  const [themeReady, setThemeReady] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [liveEnabled, setLiveEnabled] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)


  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    let cancelled = false
    async function initTheme() {
      setThemeReady(false)
      let saved = 'venkys_light'
      try {
        const local = localStorage.getItem('theme')
        if (local === 'venkys_dark' || local === 'venkys_light') saved = local
      } catch { /* ignore storage read issues */ }

      if (user) {
        try {
          const remote = await getUserTheme(user.uid)
          if ((remote === 'venkys_dark' || remote === 'venkys_light') && !cancelled) {
            setTheme(remote)
            setThemeReady(true)
            return
          }
        } catch { /* ignore remote theme miss */ }
      }

      if (!cancelled) {
        setTheme(saved)
        setThemeReady(true)
      }
    }
    initTheme()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (!themeReady) return
    try { localStorage.setItem('theme', theme) } catch { /* ignore storage write issues */ }
    if (user) {
      setUserTheme(user.uid, theme).catch(() => { /* ignore cloud sync errors */ })
    }
  }, [theme, user, themeReady])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchStoreStatus()
      .then((res) => { if (!cancelled) setLiveEnabled(res.open !== false) })
      .catch(() => { /* ignore initial status failure */ })
    return () => { cancelled = true }
  }, [])

  const isDark = theme === 'venkys_dark'
  const activeSection = pathname.startsWith('/admin/') ? pathname.split('/')[2] : 'inventory'

  const displayLabel = useMemo(() => {
    const name = user?.displayName?.trim()
    if (name) return name.split(/\s+/)[0]
    const email = user?.email || ''
    return email.split('@')[0] || 'User'
  }, [user])

  const handleToggleTheme = (nextIsDark) => {
    const next = nextIsDark ? 'venkys_dark' : 'venkys_light'
    setTheme(next)
  }

  const handleToggleStore = async () => {
    const next = !liveEnabled
    setLiveEnabled(next)
    try {
      await setStoreOpen(next)
    } catch {
      setLiveEnabled(!next)
    }
  }

  const handlePrinterConnect = async () => {
    try {
      if (!navigator.bluetooth) {
        alert('Bluetooth is not supported on this browser. Please use Chrome or Edge.')
        return
      }

      // Request bluetooth device (58mm thermal printer typically uses Serial Port Profile)
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      })

      alert(`Connected to: ${device.name || 'Bluetooth Printer'}`)
      // Store device reference if needed for later use
      console.log('Bluetooth device connected:', device)
    } catch (error) {
      if (error.name === 'NotFoundError') {
        console.log('User cancelled device selection')
      } else {
        console.error('Bluetooth connection error:', error)
        alert(`Bluetooth error: ${error.message}`)
      }
    }
  }

  return (
    <>
      <header className="nav-sticky">
        <div className={`border-b border-base-300/60 bg-base-200/95 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-base-200/80 ${scrolled ? 'shadow-lg' : 'shadow-md'}`}>
          <div className="page-wrap flex items-center gap-3 py-3 md:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button 
                className="btn btn-square btn-ghost btn-sm md:hidden -ml-2" 
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <MdMenu className="h-6 w-6" />
              </button>
              
              <Link to="/admin" className="shrink-0" aria-label="Admin home">
                <img src="/icons/logo.png" alt="Venky's" className="brand-logo drop-shadow-sm" />
              </Link>
              
              <div className="hidden md:block min-w-0 flex-1">
                <AdminLinks section={activeSection} />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide ${liveEnabled ? 'border-success/40 bg-success/15 text-success' : 'border-error/40 bg-error/10 text-error'}`}>
                <span className={`relative inline-flex h-2 w-2 rounded-full ${liveEnabled ? 'bg-success' : 'bg-error'}`}>
                  {liveEnabled ? <span className="absolute inset-0 rounded-full bg-success/40 blur-[2px]" aria-hidden="true" /> : null}
                </span>
                {liveEnabled ? 'Store live' : 'Store paused'}
              </div>
              <button
                type="button"
                onClick={handleToggleStore}
                className={`btn btn-xs sm:btn-sm ${liveEnabled ? 'btn-outline btn-success' : 'btn-outline btn-error'}`}
              >
                {liveEnabled ? 'Pause' : 'Resume'}
              </button>

              <button
                className="btn btn-ghost btn-circle btn-sm"
                onClick={handlePrinterConnect}
                title="Connect Bluetooth Printer"
              >
                <MdPrint className="h-5 w-5" />
              </button>

              <label aria-label="Toggle theme" className="btn btn-ghost btn-circle btn-sm swap swap-rotate hidden sm:inline-grid">
                <input
                  type="checkbox"
                  className="theme-controller"
                  checked={isDark}
                  onChange={(e) => handleToggleTheme(e.target.checked)}
                />
                <svg className="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Z" />
                </svg>
                <svg className="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                </svg>
              </label>

              {!user ? (
                <button className="btn btn-primary btn-sm" onClick={() => openAuth('login')}>
                  <MdLogin className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              ) : (
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-sm px-2 gap-2">
                    <div className="avatar">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-base-300 text-base-content">
                        <MdPerson className="h-5 w-5 opacity-80" />
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="max-w-[8rem] truncate text-sm font-medium leading-tight">{displayLabel}</span>
                      {isStaffMember && !roleLoading && (
                        <span className={`text-[10px] leading-tight ${isAdmin ? 'text-primary' : 'text-secondary'}`}>
                          {role?.role || 'staff'}
                        </span>
                      )}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 24 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <ul tabIndex={0} className="menu menu-sm dropdown-content z-[1] mt-2 w-52 rounded-xl border border-base-300/40 bg-base-100/95 p-2 shadow-xl backdrop-blur">
                    <li className="menu-title px-2 py-1">
                      <div className="text-xs opacity-60">{user.email}</div>
                      {isStaffMember && (
                        <div className={`badge badge-sm mt-1 ${isAdmin ? 'badge-primary' : 'badge-secondary'}`}>
                          {role?.role || 'staff'}
                        </div>
                      )}
                      {!isStaffMember && !roleLoading && (
                        <div className="badge badge-sm badge-ghost mt-1">No staff access</div>
                      )}
                    </li>
                    <div className="divider my-1"></div>
                    <li><button onClick={logout} className="text-error">Logout</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[80vw] bg-base-100 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-base-200 flex items-center justify-between bg-base-200/50">
              <div className="flex items-center gap-3">
                <img src="/icons/logo.png" alt="Venky's" className="h-8 w-auto" />
                <span className="font-bold text-lg tracking-tight">Admin</span>
              </div>
              <button className="btn btn-square btn-ghost btn-sm" onClick={() => setDrawerOpen(false)}>
                <MdClose className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-base-content/50">Menu</div>
              <AdminLinks section={activeSection} vertical onClick={() => setDrawerOpen(false)} />
              
              <div className="my-2 border-t border-base-200 mx-2"></div>
              
              <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-base-content/50">Preferences</div>
              <div className="px-2 flex flex-col gap-1">
                <label className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-base-200 cursor-pointer">
                  <span className="font-medium">Dark Mode</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-sm toggle-primary" 
                    checked={isDark}
                    onChange={(e) => handleToggleTheme(e.target.checked)}
                  />
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-base-200 bg-base-200/30">
              {user ? (
                <div className="flex items-center gap-3 mb-4">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                      <span className="text-lg">{displayLabel.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{displayLabel}</div>
                    <div className="text-xs text-base-content/60 truncate">{user.email}</div>
                  </div>
                </div>
              ) : null}
              {user && (
                <button onClick={logout} className="btn btn-outline btn-error btn-sm w-full">
                  Logout
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
