import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import logo from '../assets/logo.png'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { MdLocationOn, MdLogin, MdPerson, MdReceiptLong, MdSearch } from 'react-icons/md'
import { fetchMenuCategories, getUserTheme, setUserTheme } from '../lib/data'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState('venkys_light')
  const { totalQty } = useCart()
  const { user, logout } = useAuth()
  useEffect(() => {
    const root = document.documentElement
    async function initTheme() {
      let saved = null
      try { saved = localStorage.getItem('theme') } catch {}
      // If user is logged in, prefer their cloud theme
      let cloud = null
      if (user) {
        try { cloud = await getUserTheme(user.uid) } catch {}
      }
      const next = (cloud === 'venkys_dark' || cloud === 'venkys_light') ? cloud : (saved === 'venkys_dark' ? 'venkys_dark' : 'venkys_light')
      setTheme(next)
      root.setAttribute('data-theme', next)
      // if user exists and local differs, sync up to cloud
      if (user && cloud !== next) {
        try { await setUserTheme(user.uid, next) } catch {}
      }
      // persist to local for guests
      try { localStorage.setItem('theme', next) } catch {}
    }
    initTheme()
  }, [user])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const isDark = theme === 'venkys_dark'
  const { label: locLabel, loading: isLocating, locate } = useDeliveryLocation('Durgapur')
  // user obtained earlier
  const { openAuth } = useUI()
  const displayLabel = (() => {
    const name = user?.displayName?.trim()
    if (name) return name.split(/\s+/)[0]
    const email = user?.email || ''
    const local = email.split('@')[0]
    return local || 'User'
  })()
  // Search state
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [allSearchItems, setAllSearchItems] = useState([]) // {type:'category'|'item', label, cat?, veg?, price?}
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchWrapRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const [locPanelOpen, setLocPanelOpen] = useState(false)

  // Load categories + items once for client-side searching
  useEffect(() => {
    fetchMenuCategories().then(cats => {
      const coll = []
      cats.forEach(cat => {
        coll.push({ type: 'category', label: cat.id, cat: cat.id })
        if (Array.isArray(cat.items)) {
          cat.items.forEach(it => {
            coll.push({ type: 'item', label: it.name, cat: cat.id, veg: it.veg !== false, price: it.price })
          })
        }
      })
      setAllSearchItems(coll)
    }).catch(()=>{})
  }, [])

  const results = (() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return allSearchItems
      .filter(x => x.label?.toLowerCase().includes(q))
      .slice(0, 12)
  })()

  // Close on outside click for search & location panel
  useEffect(() => {
    function onDoc(e) {
      if (!searchWrapRef.current) return
      if (!searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false)
        setActiveIndex(-1)
        setLocPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function executeSearch(value) {
    const v = (value ?? query).trim()
    if (!v) return
    setSearchOpen(false)
    setActiveIndex(-1)
    navigate(`/search?q=${encodeURIComponent(v)}`)
  }

  const onKeyDown = useCallback((e) => {
    if (!searchOpen) return
    if (['ArrowDown','ArrowUp','Enter','Escape'].includes(e.key)) {
      e.preventDefault()
    }
    if (e.key === 'ArrowDown') {
      setActiveIndex(i => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(i => Math.max(0, (i === -1 ? 0 : i - 1)))
    } else if (e.key === 'Escape') {
      setSearchOpen(false); setActiveIndex(-1)
    } else if (e.key === 'Enter') {
      const chosen = results[activeIndex]
      if (chosen) {
        executeSearch(chosen.label)
      } else {
        executeSearch(query)
      }
    }
  }, [results, activeIndex, searchOpen, query])

  useEffect(() => {
    if (searchOpen) {
      document.addEventListener('keydown', onKeyDown)
    } else {
      document.removeEventListener('keydown', onKeyDown)
    }
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [searchOpen, onKeyDown])

  return (
    <div className="nav-sticky w-full">
      <div className={`w-full transition-colors duration-300 border-b border-base-300/50 bg-base-100/80 backdrop-blur supports-[backdrop-filter]:bg-base-100/70 ${scrolled ? 'shadow-sm' : ''}`}>        
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2">
          {/* Left: Logo */}
          <Link to="/" className="shrink-0" aria-label="Home">
            <img src={logo} alt="Venky's" className="brand-logo" />
          </Link>

          {/* Middle: Search box */}
          <div className="flex-1 min-w-0" ref={searchWrapRef}>
            <div className={`relative w-full bg-base-100 border border-base-300 rounded-xl shadow-sm px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 focus-within:ring-2 focus-within:ring-primary/40 transition ${searchOpen ? 'ring-2 ring-primary/40' : ''}`}>            
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setLocPanelOpen(o => !o)}
                  className={`btn btn-ghost btn-xs sm:btn-sm normal-case pl-1 pr-2 flex items-center gap-1 ${locPanelOpen ? 'bg-base-200/50' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={locPanelOpen}
                  aria-label="Delivery location options"
                >
                  <MdLocationOn className="w-5 h-5 text-secondary" />
                  <span className="truncate max-w-[7rem] text-left">{locLabel}</span>
                  {isLocating && <span className="loading loading-spinner loading-xs ml-1" />}
                </button>
                {locPanelOpen && (
                  <div className="absolute left-0 top-full mt-2 w-60 z-50 rounded-xl border border-base-300/60 bg-base-100/95 backdrop-blur shadow-lg p-2 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => { locate().catch(()=>{}); }}
                      className="w-full text-left p-3 rounded-lg flex items-start gap-3 hover:bg-base-200/60 transition relative"
                    >
                      <span className="text-secondary mt-0.5"><MdLocationOn className="w-5 h-5" /></span>
                      <span className="flex-1 flex flex-col">
                        <span className="text-sm font-medium text-secondary">Detect current location</span>
                        <span className="text-[11px] opacity-60">Using GPS</span>
                      </span>
                      {isLocating && <span className="loading loading-spinner loading-xs" />}
                    </button>
                    <div className="mt-1 px-2 pb-1 pt-1.5 text-[10px] leading-snug opacity-60">
                      Current label: <span className="font-medium opacity-80">{locLabel}</span>
                    </div>
                  </div>
                )}
              </div>
              <span className="hidden sm:inline opacity-30">|</span>
              <input
                type="text"
                placeholder="Search for restaurant, cuisine or a dish"
                ref={inputRef}
                value={query}
                onChange={(e)=> { setQuery(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-base placeholder:text-base-content/50 placeholder:opacity-70 focus:placeholder:opacity-60"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="btn btn-ghost btn-xs"
                  onClick={()=> { setQuery(''); setActiveIndex(-1); inputRef.current?.focus() }}
                >✕</button>
              )}
              {/* Search icon now on right */}
              <button
                type="button"
                aria-label="Search"
                className="btn btn-primary btn-xs h-7 min-h-0 px-2 flex items-center gap-1 rounded-lg shadow-sm"
                onClick={() => executeSearch()}
              >
                <MdSearch className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Search</span>
              </button>
              {searchOpen && results.length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-full z-50">
                  <ul className="menu menu-sm bg-base-100/95 backdrop-blur border border-base-300/60 rounded-xl shadow-lg max-h-80 overflow-auto divide-y divide-base-300/40">
                    {results.map((r,i)=>(
                      <li key={r.type + r.label + i}>
                        <button
                          className={`flex items-center gap-3 justify-start w-full px-3 py-2 text-left ${i===activeIndex ? 'bg-primary/10' : ''}`}
                          onMouseEnter={()=> setActiveIndex(i)}
                          onMouseDown={(e)=> { e.preventDefault(); executeSearch(r.label) }}
                        >
                          {r.type==='item' ? (
                            r.veg !== false ? (
                              <span className="w-4 h-4 rounded-sm border-2 border-green-600 relative" aria-label="Veg" title="Veg"><span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-green-600" style={{top:0,bottom:0,left:0,right:0}} /></span>
                            ) : (
                              <span className="w-4 h-4 rounded-sm border-2 border-rose-600 relative" aria-label="Non-Veg" title="Non-Veg"><span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-rose-600" style={{top:0,bottom:0,left:0,right:0}} /></span>
                            )
                          ) : (
                            <span className="w-4 h-4 rounded-sm border-2 border-secondary relative opacity-70" aria-label="Category" title="Category"><span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-secondary" style={{top:0,bottom:0,left:0,right:0}} /></span>
                          )}
                          <span className="truncate flex-1">{r.label}</span>
                          {r.type==='item' && r.price !== undefined && r.price !== '' && (
                            <span className="text-xs tabular-nums opacity-70">₹{r.price}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: Theme toggle (cart button removed; cart available via QuickDock) */}
          <div className="shrink-0 flex items-center gap-2">
            <label aria-label="Toggle theme" className="btn btn-ghost btn-square swap swap-rotate">
              <input
                type="checkbox"
                className="theme-controller"
                checked={isDark}
                onChange={async (e) => {
                  const next = e.target.checked ? 'venkys_dark' : 'venkys_light'
                  setTheme(next)
                  try { localStorage.setItem('theme', next) } catch {}
                  if (user) { try { await setUserTheme(user.uid, next) } catch {} }
                }}
              />
              <svg className="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>
              <svg className="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>
            {/* Auth actions */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => openAuth('login')}>
                  <MdLogin className="w-4 h-4 mr-1.5" />
                  Login
                </button>
              </div>
            ) : (
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-sm px-2 gap-2">
                  <div className="avatar">
                    <div className="w-8 rounded-full bg-base-300 text-base-content grid place-items-center">
                      <MdPerson className="w-5 h-5 opacity-80 relative top-[4px]" />
                    </div>
                  </div>
                  <span className="hidden md:inline max-w-[8rem] truncate font-medium">{displayLabel}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                </div>
                <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100/95 backdrop-blur rounded-xl z-[1] mt-2 w-56 p-2 shadow-lg border border-base-300/40">
                  <li><Link to="/profile" className="flex items-center gap-2"><MdPerson className="w-4 h-4" /> Profile</Link></li>
                  <li><Link to="/profile#orders" className="flex items-center gap-2"><MdReceiptLong className="w-4 h-4" /> Orders</Link></li>
                  <li className="mt-1"><button onClick={logout} className="text-error">Logout</button></li>
                </ul>
              </div>
            )}

            {/* Cart button intentionally removed – handled by QuickDock */}
          </div>
        </div>
      </div>
    </div>
  )
}
