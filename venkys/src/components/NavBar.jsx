// NavBar — Top navigation bar with theme toggle, auth, and search
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import { MdLocationOn, MdLogin, MdPerson, MdSearch } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import { fetchMenuCategories, getUserTheme, setUserTheme } from '../lib/data'
import { formatMoney } from '../lib/formatCurrency'

export default function NavBar() {
  const logoUrl = `${import.meta.env.BASE_URL}icons/Logo.png`

  // ── State & refs ──
  const [scrolled, setScrolled] = useState(false)
  const [hiddenOnScroll, setHiddenOnScroll] = useState(false)
  const [theme, setTheme] = useState('venkys_light')
  const { user /*, logout */ } = useAuth()
  const navRef = useRef(null)

  // ── Side-effects ──
  useEffect(() => {
    const root = document.documentElement
    async function initTheme() {
      let saved = null
  try { saved = localStorage.getItem('theme') } catch { /* noop */ }
      // If user is logged in, prefer their cloud theme
      let cloud = null
      if (user) {
  try { cloud = await getUserTheme(user.uid) } catch { /* noop */ }
      }
      const next = (cloud === 'venkys_dark' || cloud === 'venkys_light') ? cloud : (saved === 'venkys_dark' ? 'venkys_dark' : 'venkys_light')
      setTheme(next)
      root.setAttribute('data-theme', next)
      // if user exists and local differs, sync up to cloud
      if (user && cloud !== next) {
  try { await setUserTheme(user.uid, next) } catch { /* noop */ }
      }
      // persist to local for guests
  try { localStorage.setItem('theme', next) } catch { /* noop */ }
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

  useEffect(() => {
    let lastY = window.scrollY
    const revealTop = 96
    const hideThreshold = 20
    const showThreshold = 10

    const onScrollDirection = () => {
      const y = window.scrollY
      const delta = y - lastY

      if (y <= revealTop) {
        setHiddenOnScroll(false)
        lastY = y
        return
      }

      if (delta > hideThreshold) {
        setHiddenOnScroll(true)
      } else if (delta < -showThreshold) {
        setHiddenOnScroll(false)
      }

      lastY = y
    }

    window.addEventListener('scroll', onScrollDirection, { passive: true })
    return () => window.removeEventListener('scroll', onScrollDirection)
  }, [])

  useEffect(() => {
    const cls = 'customer-nav-hidden'
    if (hiddenOnScroll) document.body.classList.add(cls)
    else document.body.classList.remove(cls)
    return () => document.body.classList.remove(cls)
  }, [hiddenOnScroll])

  useEffect(() => {
    const updateNavHeight = () => {
      const height = navRef.current?.offsetHeight || 80
      document.documentElement.style.setProperty('--customer-nav-height', `${height}px`)
    }
    updateNavHeight()
    window.addEventListener('resize', updateNavHeight)
    return () => window.removeEventListener('resize', updateNavHeight)
  }, [])
  const isDark = theme === 'venkys_dark'
  const { label: locLabel, loading: isLocating, locate } = useDeliveryLocation()
  // user obtained earlier
  const { openAuth } = useUI()
  const displayLabel = (() => {
    const name = user?.displayName?.trim()
    if (name) return name.split(/\s+/)[0]
    const email = user?.email || ''
    const local = email.split('@')[0]
    return local || 'User'
  })()

  // ── Search state ──
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [allSearchItems, setAllSearchItems] = useState([]) // {type:'category'|'item', label, cat?, veg?, rate?, mrp?, discountPercent?}
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
            const rateNumber = typeof it.rate === 'number' ? it.rate : Number(it.rate)
            const rate = Number.isFinite(rateNumber) && rateNumber >= 0
              ? Math.round(rateNumber)
              : Math.round(Number(it.price) || 0)
            const mrpRaw = typeof it.mrp === 'number' ? it.mrp : Number(it.mrp)
            const mrp = Number.isFinite(mrpRaw) && mrpRaw > 0 ? Math.round(mrpRaw) : null
            const discountRaw = typeof it.discountPercent === 'number' ? it.discountPercent : Number(it.discountPercent)
            const derivedDiscount = mrp && mrp > rate && mrp > 0
              ? Math.max(0, Math.round(((mrp - rate) / mrp) * 100))
              : null
            const discountPercent = Number.isFinite(discountRaw) && discountRaw > 0
              ? Math.round(Math.max(0, Math.min(99, discountRaw)))
              : (derivedDiscount && derivedDiscount > 0 ? derivedDiscount : null)
            coll.push({ type: 'item', label: it.name, cat: cat.id, veg: it.veg !== false, rate, mrp, discountPercent })
          })
        }
      })
      setAllSearchItems(coll)
    }).catch(()=>{})
  }, [])

  // ── Search helpers ──
  // Simple fuzzy scoring: case-insensitive includes boost + Levenshtein distance threshold
  const levenshtein = useMemo(() => {
    return (a, b) => {
      a = (a||'').toLowerCase(); b = (b||'').toLowerCase()
      const m = a.length, n = b.length
      if (m === 0) return n
      if (n === 0) return m
  const dp = Array.from({length: m+1}, () => Array(n+1).fill(0))
      for (let i=0;i<=m;i++) dp[i][0] = i
      for (let j=0;j<=n;j++) dp[0][j] = j
      for (let i=1;i<=m;i++) {
        for (let j=1;j<=n;j++) {
          const cost = a[i-1] === b[j-1] ? 0 : 1
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,
            dp[i][j-1] + 1,
            dp[i-1][j-1] + cost
          )
        }
      }
      return dp[m][n]
    }
  }, [])

  const results = useMemo(() => {
    const raw = query.trim()
    if (!raw) return []
    const q = raw.toLowerCase()
    // Compute a simple score; lower distance is better. Direct includes gets strong boost.
    const scored = allSearchItems.map(x => {
      const label = x.label || ''
      const l = label.toLowerCase()
      const includes = l.includes(q)
      const dist = levenshtein(q, l)
      // Normalize with length to avoid favoring short strings unfairly
      const norm = dist / Math.max(1, l.length)
      let score = includes ? -1 : norm // lower is better; -1 beats any norm
      return { x, score }
    })
    scored.sort((a,b) => a.score - b.score)
    // Keep only reasonable matches: allow up to 0.5 normalized distance, or direct includes
    const filtered = scored.filter(s => s.score <= 0.5 || s.score === -1).slice(0, 12)
    return filtered.map(s => s.x)
  }, [query, allSearchItems, levenshtein])

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

  // ── Handlers ──
  const executeSearch = useCallback((value) => {
    const v = (value ?? query).trim()
    if (!v) return
    setSearchOpen(false)
    try { inputRef.current?.blur() } catch { /* noop */ }
    setActiveIndex(-1)
    const catMatch = allSearchItems.find(x => x.type === 'category' && x.label.toLowerCase() === v.toLowerCase())
    if (catMatch) {
      navigate({ pathname: '/', hash: `#${catMatch.cat}` }, { replace: false })
      return
    }
    navigate({ pathname: '/', search: `q=${encodeURIComponent(v)}` })
  }, [query, allSearchItems, navigate])

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
  }, [results, activeIndex, searchOpen, query, executeSearch])

  useEffect(() => {
    if (searchOpen) {
      document.addEventListener('keydown', onKeyDown)
    } else {
      document.removeEventListener('keydown', onKeyDown)
    }
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [searchOpen, onKeyDown])

  // ── Render ──
  return (
    <div ref={navRef} className={`nav-sticky w-full transition-transform duration-300 ${hiddenOnScroll ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="flex justify-center px-2 sm:px-4">
  <nav className={`navbar mx-auto w-full max-w-6xl rounded-3xl border border-base-300/50 bg-base-100 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.55)] transition-shadow duration-300 ${scrolled ? 'mt-0 shadow-[0_32px_60px_-26px_rgba(15,23,42,0.65)] border-base-300/60' : 'mt-1'}`}>
          <div className="flex w-full items-center gap-3 sm:gap-4">
            {/* Left: Logo */}
            <div className="shrink-0">
              <Link to="/" className="inline-flex items-center" aria-label="Home">
                <img src={logoUrl} alt="Venky's" className="brand-logo" />
              </Link>
            </div>

            {/* Middle: Search box */}
            <div className="flex-1 min-w-0" ref={searchWrapRef}>
              <div className={`relative flex w-full items-center gap-2 sm:gap-3 rounded-2xl bg-transparent px-0 sm:px-1 py-1 transition ${searchOpen ? 'ring-2 ring-primary/30' : ''}`}>
                <div className="relative hidden sm:flex">
                <button
                  type="button"
                  onClick={() => setLocPanelOpen(o => !o)}
                  className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-base-100/90 px-3 py-1.5 text-sm font-medium text-base-content shadow-sm transition ${locPanelOpen ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}
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
                <span className="hidden sm:block h-5 w-px bg-base-300/70" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  ref={inputRef}
                  value={query}
                  onChange={(e)=> { setQuery(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                  className="input input-ghost flex-1 min-w-0 border-none shadow-none focus:outline-none px-0 text-sm sm:text-base placeholder:text-base-content/50 placeholder:opacity-80 focus:placeholder:opacity-60"
                  aria-label="Search dishes"
                />
                <button
                  type="button"
                  aria-label="Search"
                  className="btn btn-primary btn-sm min-h-[2.5rem] rounded-xl px-4 gap-2 shadow-sm"
                  onClick={() => executeSearch()}
                >
                  <MdSearch className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-semibold tracking-tight">Search</span>
                </button>
                {searchOpen && results.length > 0 && (
                  <div className="absolute left-0 top-full mt-3 w-full z-50">
                    <ul className="bg-base-100/95 backdrop-blur border border-base-300/70 rounded-3xl shadow-[0_25px_70px_-30px_rgba(15,23,42,0.65)] max-h-80 overflow-auto divide-y divide-base-300/30 p-2">
                      {results.map((r, i) => (
                        <li key={r.type + r.label + i}>
                          <button
                            className={`flex items-center gap-3 justify-start w-full px-4 py-3 text-left rounded-2xl transition ${i === activeIndex ? 'bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-base-200/60'}`}
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseDown={(e) => { e.preventDefault(); executeSearch(r.label) }}
                          >
                            <span className={`shrink-0 w-10 h-10 rounded-2xl grid place-items-center ${r.type === 'item' ? (r.veg !== false ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200') : 'bg-secondary/10 text-secondary border border-secondary/30'}`}>
                              {r.type === 'item' ? (r.veg !== false ? '🌱' : '🍖') : '📁'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-base-content truncate">{r.label}</p>
                              <p className="text-xs opacity-70 truncate">{r.type === 'item' ? (r.veg !== false ? 'Vegetarian dish' : 'Non-veg dish') : 'Category shortcut'}</p>
                            </div>
                            {r.type === 'item' && r.rate !== undefined && r.rate !== '' && (
                              <span className="text-sm font-semibold text-base-content/80">₹{formatMoney(r.rate)}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Theme toggle */}
            <div className="shrink-0 flex items-center gap-2">
            <label aria-label="Toggle theme" className="btn btn-ghost btn-square swap swap-rotate">
              <input
                type="checkbox"
                className="theme-controller"
                checked={isDark}
                onChange={async (e) => {
                  const next = e.target.checked ? 'venkys_dark' : 'venkys_light'
                  setTheme(next)
                  try { localStorage.setItem('theme', next) } catch { /* noop */ }
                  if (user) { try { await setUserTheme(user.uid, next) } catch { /* noop */ } }
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
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm btn-square sm:w-auto sm:px-4" onClick={() => openAuth('login')}>
                  <MdLogin className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              </div>
            ) : (
              <Link to="/profile" className="btn btn-ghost btn-sm px-2 gap-2 items-center">
                <MdPerson className="w-5 h-5 opacity-70" />
                <span className="hidden md:inline max-w-[8rem] truncate font-medium">{displayLabel}</span>
              </Link>
            )}

            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
