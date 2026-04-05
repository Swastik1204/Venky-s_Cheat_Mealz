// Home — Menu browsing page with search, filters, and categories
import { useCallback, useEffect, useMemo, useState, startTransition } from 'react'

import { doc, onSnapshot } from 'firebase/firestore'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdLocalOffer, MdOutlineAutoAwesome, MdOutlineBolt, MdTrackChanges } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import CategoriesBar from '../components/CategoriesBar'
import FilterBar from '../components/FilterBar'
import MenuItemCard from '../components/MenuItemCard'
import ProfileCompletionAlert from '../components/ProfileCompletionAlert'
import { DEFAULT_SPOTLIGHT, fetchAppearanceSettings, fetchImagesByIdsCached, fetchLatestUserOrder, fetchMenuCategories, fetchUserProfile, getImageDataUrl, fetchAddresses } from '../lib/data'
import { db } from '../lib/firebase'

// ── Helpers ──

// Debounce helper for search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function Home() {
  // ── State & refs ──
  const [categories, setCategories] = useState([]) // docs from 'menu'
  const [menu, setMenu] = useState([]) // flattened items with categoryId
  const [imageMap, setImageMap] = useState({}) // { imageId: { data, mime } }
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const debouncedQ = useDebounce(q, 300)
  const [vegFilter, setVegFilter] = useState('all') // all | veg | nonveg
  const [sortBy, setSortBy] = useState('default') // default | price-asc | price-desc | name-asc | name-desc
  const [searchVisibleCount, setSearchVisibleCount] = useState(24)
  const [activeOrder, setActiveOrder] = useState(null)
  const [storeOpen, setStoreOpen] = useState(true)
  const [spotlight, setSpotlight] = useState(() => ({
    hotDeals: Array.isArray(DEFAULT_SPOTLIGHT.hotDeals) ? [...DEFAULT_SPOTLIGHT.hotDeals] : [],
    chefSpecials: Array.isArray(DEFAULT_SPOTLIGHT.chefSpecials) ? [...DEFAULT_SPOTLIGHT.chefSpecials] : [],
    hiddenHotDeals: !!DEFAULT_SPOTLIGHT.hiddenHotDeals,
    hiddenChefSpecials: !!DEFAULT_SPOTLIGHT.hiddenChefSpecials,
    hiddenSpotlight: !!DEFAULT_SPOTLIGHT.hiddenSpotlight,
  }))
  const [spotlightLoaded, setSpotlightLoaded] = useState(false)
  const { user } = useAuth()
  // Removed unused profile state
  const [profileForm, setProfileForm] = useState({ displayName: '', phone: '', gender: '' })
  const [addrState, setAddrState] = useState({ list: [], defaultId: null })
  // Keep prompt flag without exposing unused setter
  const [showProfilePrompt] = useState(true)
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [])
  const formatCurrency = useCallback((value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null
    return currencyFormatter.format(value)
  }, [currencyFormatter])

  // ── Side-effects ──
  // Load profile and addresses for completion calculation - with fallback to auth user data
  useEffect(() => {
    if (!user) { setProfileForm({ displayName: '', phone: '', gender: '' }); setAddrState({ list: [], defaultId: null }); return }
    fetchUserProfile(user.uid).then(p => {
      setProfileForm({
        displayName: p?.displayName || user.displayName || '',
        phone: p?.phone || user.phoneNumber || '',
        gender: p?.gender || ''
      })
    })
    // Fetch addresses
    fetchAddresses(user.uid).then(a => setAddrState(a)).catch(() => setAddrState({ list: [], defaultId: null }))
  }, [user])

  const location = useLocation()
  const navigate = useNavigate()
  // Completion UI handled by ProfileCompletionAlert component

  useEffect(() => {
    let mounted = true
    fetchMenuCategories()
      .then((docs) => {
        if (!mounted) return
        const cats = docs.map((d) => ({
          id: d.id,
          name: d.name || d.id,
          imageId: d.imageId || null,
          items: Array.isArray(d.items) ? d.items : []
        }))
        const flat = cats.flatMap((c) =>
          (c.items || []).flatMap((it, idx) => {
            const processItem = (sourceItem, idSuffixOverride = null) => {
              const sourceRate = (typeof sourceItem.rate === 'number' ? sourceItem.rate : Number(sourceItem.rate))
              const sourceMrp = (typeof sourceItem.mrp === 'number' ? sourceItem.mrp : Number(sourceItem.mrp))
              const sourceDiscount = (typeof sourceItem.discountPercent === 'number' ? sourceItem.discountPercent : Number(sourceItem.discountPercent))

              const rateNumber = typeof sourceRate === 'number' ? sourceRate : Number(sourceRate)
              const effectiveRate = Number.isFinite(rateNumber) && rateNumber >= 0 
                ? Math.round(rateNumber) 
                : Math.round(Number(sourceItem.price) || 0)

              const mrpNumberRaw = typeof sourceMrp === 'number' ? sourceMrp : Number(sourceMrp)
              
              const discountRaw = typeof sourceDiscount === 'number' ? sourceDiscount : Number(sourceDiscount)
              
              // If we have a fixed discount in DB, use it directly (user preference)
              // Otherwise derive it from MRP/Rate if possible
              let discountNumber = Number.isFinite(discountRaw) && discountRaw > 0 ? discountRaw : null

              // Recalculate MRP if discount is fixed (Rate / (1 - Disc%))
              // The user requested only MRP needs recalculation in this case
              let mrpNumber = Number.isFinite(mrpNumberRaw) && mrpNumberRaw > 0 ? Math.round(mrpNumberRaw) : null
              
              if (discountNumber !== null && effectiveRate > 0) {
                 const calculatedMrp = (effectiveRate * 100) / (100 - discountNumber)
                 mrpNumber = Math.round(calculatedMrp)
              } else if (mrpNumber && mrpNumber > effectiveRate) {
                 // Fallback: derive discount if not explicit
                 const derived = ((mrpNumber - effectiveRate) / mrpNumber) * 100
                 if (discountNumber === null) {
                    discountNumber = Math.round(derived)
                 }
              }

              const baseName = sourceItem.name || ''
              
              const uniqueIdSuffix = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

              const finalIdx = idSuffixOverride !== null ? idSuffixOverride : idx

              return {
                id: `${c.id}-${finalIdx}-${uniqueIdSuffix}`,
                name: baseName,
                desc: sourceItem.desc || sourceItem.description || '',
                rate: effectiveRate,
                mrp: mrpNumber,
                discountPercent: discountNumber,
                rating: typeof sourceItem.rating === 'number' ? sourceItem.rating : Number(sourceItem.rating),
                veg: sourceItem.veg === false ? false : true,
                active: sourceItem.active === false ? false : true,
                categoryId: c.id,
                category: c.id,
                categoryName: c.name || c.id,
                imageId: sourceItem.imageId || null,
                components: Array.isArray(sourceItem.components) ? sourceItem.components : [],
                isCustom: !!sourceItem.isCustom,
                variants: Array.isArray(sourceItem.variants) ? sourceItem.variants : []
              }
            }

            // Handle nested variants: Item -> Variant -> Sizes
            // We split items with nested variants into separate cards (e.g. "Grilled Chicken (Tandoori)")
            // each containing their respective sizes.
            if (Array.isArray(it.variants) && it.variants.some(v => Array.isArray(v.sizes) && v.sizes.length > 0)) {
               return it.variants.map((v, vIdx) => {
                  const cloned = { ...it, ...v }
                  // Use a descriptive name: "Variant Name Item Name" (Admin style)
                  cloned.name = `${v.name} ${it.name}`
                  // The new item's variants are now the sizes from the nested structure
                  cloned.variants = v.sizes
                  // Use image from variant if available
                  if (v.imageId) cloned.imageId = v.imageId
                  if (v.image) cloned.image = v.image

                  // Find the costlier option (max price) to display on the card
                  // This is purely for display; actual selection happens in modal/dropdown
                  if (Array.isArray(v.sizes) && v.sizes.length > 0) {
                     const maxPriceSize = v.sizes.reduce((prev, curr) => {
                        const prevRate = Number(prev.rate ?? prev.price ?? 0)
                        const currRate = Number(curr.rate ?? curr.price ?? 0)
                        return currRate > prevRate ? curr : prev
                     }, v.sizes[0])
                     
                     if (maxPriceSize) {
                        cloned.rate = Math.round(Number(maxPriceSize.rate ?? maxPriceSize.price ?? 0))
                        // If discount logic needs to apply to the displayed max price
                        if (cloned.discountPercent) {
                           // Recalc MRP based on this new rate + fixed discount
                           const calcMrp = (cloned.rate * 100) / (100 - cloned.discountPercent)
                           cloned.mrp = Math.round(calcMrp)
                        } else {
                           cloned.mrp = Math.round(Number(maxPriceSize.mrp ?? 0))
                        }
                     }
                  }

                  return processItem(cloned, `${idx}-v${vIdx}`) 
               })
            }

            return processItem(it)
          })
        )
        setCategories(cats)
        setMenu(flat)
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  // Live store status
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'miscellaneous', 'settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (Object.prototype.hasOwnProperty.call(data, 'open')) {
          setStoreOpen(data.open !== false)
        }
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let active = true
    fetchAppearanceSettings()
      .then((res) => {
        if (!active) return
        const incoming = res?.spotlight && typeof res.spotlight === 'object' ? res.spotlight : DEFAULT_SPOTLIGHT
        const normalized = {
          hotDeals: Array.isArray(incoming.hotDeals) ? [...incoming.hotDeals] : [],
          chefSpecials: Array.isArray(incoming.chefSpecials) ? [...incoming.chefSpecials] : [],
          hiddenHotDeals: !!incoming.hiddenHotDeals,
          hiddenChefSpecials: !!incoming.hiddenChefSpecials,
          hiddenSpotlight: !!incoming.hiddenSpotlight,
        }
        setSpotlight(normalized)
      })
      .catch(() => {
        if (!active) return
        setSpotlight({ hotDeals: [], chefSpecials: [], hiddenHotDeals: false, hiddenChefSpecials: false })
      })
      .finally(() => {
        if (active) setSpotlightLoaded(true)
      })
    return () => { active = false }
  }, [])

  // Load latest order for banner - reduced polling frequency
  useEffect(() => {
    if (!user) { setActiveOrder(null); return }
    let active = true
    fetchLatestUserOrder(user.uid).then(o => {
      if (!active) return
      const status = String(o?.status || '').toLowerCase()
      setActiveOrder(o && status && status !== 'delivered' && status !== 'rejected' ? o : null)
    })
    const id = setInterval(() => {
      fetchLatestUserOrder(user.uid).then(o => {
        if (!active) return
        const status = String(o?.status || '').toLowerCase()
        setActiveOrder(o && status && status !== 'delivered' && status !== 'rejected' ? o : null)
      })
    }, 30000) // poll every 30s (was 15s) to reduce network load
    return () => { active = false; clearInterval(id) }
  }, [user])

  // Respond to navigation state and custom events for scrolling/resetting
  useEffect(() => {
    // Custom event listener for "soft" resets when already on page
    const handleReset = () => {
      setQ('')
      setVegFilter('all')
      setSortBy('default')
      setSearchVisibleCount(24)
    }
    window.addEventListener('reset-home-view', handleReset)

    if (location.state?.reset) {
      setQ('')
      setVegFilter('all')
      setSortBy('default')
      setSearchVisibleCount(24)
      // If we only wanted to reset filters without scrolling to top:
      // if (!location.state?.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      navigate(location.pathname, { replace: true, state: {} })
    } else if (location.state?.scrollTo === 'menu') {
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      navigate(location.pathname, { replace: true, state: {} })
    } else if (location.hash === '#menu') {
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1))
      const el = document.getElementById(id)
      if (el) {
        el.style.scrollMarginTop = '84px'
        // Use smooth scrolling for a subtle transition
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    
    return () => window.removeEventListener('reset-home-view', handleReset)
  }, [location, navigate])

  // Map Firestore categories to CategoriesBar items (id, label, optional href)
  // Resolve category-level images (imageId stored on category doc)
  const [categoryImageMap, setCategoryImageMap] = useState({}) // { imageId: dataUrl }
  useEffect(() => {
    const ids = categories.map(c => c.imageId).filter(Boolean)
    if (!ids.length) { setCategoryImageMap({}); return }
    let active = true
    fetchImagesByIdsCached(ids).then(map => {
      if (!active) return
      const out = {}
      Object.entries(map).forEach(([id, d]) => {
        out[id] = getImageDataUrl(d)
      })
      setCategoryImageMap(out)
    }).catch(()=>{})
    return () => { active = false }
  }, [categories])

  // ── Image helpers ──
  // Clean resolver: just compute imageUrl, no debug logging
  function resolveImageUrlFor(item) {
    const imgObj = item.imageId && imageMap[item.imageId]
    return imgObj ? getImageDataUrl(imgObj) : undefined
  }

  const categoryBarItems = useMemo(() =>
    categories.map((c) => ({ id: c.id, label: c.name, href: `#${encodeURIComponent(c.id)}`, image: c.imageId && categoryImageMap[c.imageId] })),
    [categories, categoryImageMap]
  )

  const filtered = useMemo(() => {
    const term = debouncedQ.trim().toLowerCase()
    const base = menu.filter((m) => {
      if (term && !(m.name || '').toLowerCase().includes(term)) return false
      if (vegFilter === 'veg') return m.veg !== false // treat undefined as veg
      if (vegFilter === 'nonveg') return m.veg === false
      if (m.active === false) return false
      return true
    })
    // Sorting
    const sorted = [...base]
    if (sortBy === 'price-asc') sorted.sort((a,b) => (a.rate||0) - (b.rate||0))
    else if (sortBy === 'price-desc') sorted.sort((a,b) => (b.rate||0) - (a.rate||0))
    else if (sortBy === 'name-asc') sorted.sort((a,b) => (a.name||'').localeCompare(b.name||''))
    else if (sortBy === 'name-desc') sorted.sort((a,b) => (b.name||'').localeCompare(a.name||''))
    return sorted
  }, [menu, debouncedQ, vegFilter, sortBy])

  const categoryNameMap = useMemo(() => {
    const map = {}
    categories.forEach(c => { map[c.id] = c.name || c.id })
    return map
  }, [categories])

  const makeMatchKey = useCallback((categoryId, itemName) => {
    const cat = String(categoryId || '').trim().toLowerCase()
    const label = String(itemName || '').trim().toLowerCase()
    return cat && label ? `${cat}::${label}` : ''
  }, [])

  const menuMatchMap = useMemo(() => {
    const map = new Map()
    menu.forEach((item) => {
      const key = makeMatchKey(item.categoryId, item.name)
      if (key) map.set(key, item)
    })
    return map
  }, [menu, makeMatchKey])

  const resolvedSpotlight = useMemo(() => {
    const classify = (entries) => {
      const safe = Array.isArray(entries) ? entries : []
      const active = []
      const inactive = []
      const missing = []
      safe.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return
        const keyCandidate = typeof entry.matchKey === 'string' && entry.matchKey.trim() ? entry.matchKey.trim().toLowerCase() : null
        const fallbackKey = makeMatchKey(entry.categoryId, entry.itemName)
        const key = keyCandidate || fallbackKey
        if (!key) {
          missing.push(entry)
          return
        }
        const matched = menuMatchMap.get(key)
        if (!matched) {
          missing.push(entry)
          return
        }
        if (matched.active === false) {
          inactive.push({ entry, item: matched })
          return
        }
        active.push({ entry, item: matched })
      })
      return { active, inactive, missing }
    }
    return {
      hotDeals: classify(spotlight?.hotDeals),
      chefSpecials: classify(spotlight?.chefSpecials),
    }
  }, [makeMatchKey, menuMatchMap, spotlight])

  const showSpotlightParent = !spotlight.hiddenSpotlight
  const showHotDealsCard = !spotlight.hiddenHotDeals
  const showChefSpecialsCard = !spotlight.hiddenChefSpecials
  const showSpotlightSection = showSpotlightParent && (showHotDealsCard || showChefSpecialsCard)

  const activeOrderSummary = useMemo(() => {
    if (!activeOrder) return null
    const itemCount = Array.isArray(activeOrder.items)
      ? activeOrder.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0)
      : null
    const total = typeof activeOrder.total === 'number'
      ? activeOrder.total
      : (typeof activeOrder.amount === 'number' ? activeOrder.amount : null)
    const billLabel = total != null ? formatCurrency(total) : null
    return { itemCount, total, billLabel }
  }, [activeOrder, formatCurrency])

  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }, [])

  const userFirstName = useMemo(() => {
    const raw = (profileForm.displayName || user?.displayName || '').trim()
    if (!raw) return 'there'
    return raw.split(/\s+/)[0]
  }, [profileForm.displayName, user])

  const handleSpotlightSelect = useCallback((itemName) => {
    const label = typeof itemName === 'string' ? itemName.trim() : ''
    if (!label) return
    const params = new URLSearchParams(location.search)
    params.set('q', label)
    navigate({ pathname: location.pathname, search: params.toString() })
  }, [location.pathname, location.search, navigate])

  // ── Spotlight cards ──
  function renderSpotlightCard({ key, title, icon, bucket, accentClass = 'text-primary', iconWrapperClass = 'bg-primary/10 text-primary', badgeClass = 'badge-warning' }) {
    const activeItems = bucket?.active || []
    const inactiveCount = bucket?.inactive?.length || 0
    const missingCount = bucket?.missing?.length || 0
    const hasIssues = inactiveCount + missingCount > 0
    const items = activeItems.slice(0, 3)
    const emptyMessage = !spotlightLoaded
      ? 'Loading spotlight picks...'
      : hasIssues
        ? 'Some specials are temporarily unavailable. New picks are on the way.'
        : 'Our spotlight dishes will appear here soon.'

    return (
      <article key={key} className="rounded-2xl border border-primary/30 bg-base-100/95 shadow-sm p-4 flex flex-col gap-3">
        <div className={`flex items-center gap-2 ${accentClass}`}>
          <span className={`w-9 h-9 rounded-xl grid place-items-center ${iconWrapperClass}`}>
            {icon}
          </span>
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <ul className="space-y-3">
          {items.length ? items.map(({ entry, item }) => {
            const imageUrl = item ? resolveImageUrlFor(item) : undefined
            const priceLabel = item ? formatCurrency(item?.rate ?? item?.price ?? 0) : null
            const discountLabel = item && typeof item.discountPercent === 'number'
              ? Math.round(item.discountPercent)
              : null
            const badgeText = entry?.badge || (discountLabel ? `-${discountLabel}%` : null)
            const titleLabel = entry?.label || item?.name || entry?.itemName || 'Spotlight dish'
            const captionLabel = entry?.caption
              || (item ? `${categoryNameMap[item.categoryId] || item.categoryId}${priceLabel ? ` • ${priceLabel}` : ''}` : null)
            const searchName = item?.name || entry?.itemName
            return (
              <li key={entry?.id || makeMatchKey(entry?.categoryId, entry?.itemName)}>
                <button
                  type="button"
                  onClick={() => handleSpotlightSelect(searchName)}
                  disabled={!searchName}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 text-left transition hover:border-primary/60 hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${searchName ? '' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <span className="w-12 h-12 rounded-lg overflow-hidden bg-primary/10 text-primary grid place-items-center font-semibold">
                    {imageUrl ? (
                      <img src={imageUrl} alt={titleLabel} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      (titleLabel || '?').charAt(0)
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-sm truncate">{titleLabel}</span>
                    {captionLabel ? <span className="text-xs opacity-70 block mt-0.5 truncate">{captionLabel}</span> : null}
                  </span>
                  {badgeText ? (
                    <span className={`badge ${badgeClass} badge-sm whitespace-nowrap`}>{badgeText}</span>
                  ) : null}
                </button>
              </li>
            )
          }) : (
            <li className="text-sm opacity-60">{emptyMessage}</li>
          )}
        </ul>
        {spotlightLoaded && items.length > 0 && hasIssues ? (
          <p className="text-xs opacity-60 border-t border-primary/20 pt-3">
            Some spotlight dishes are currently unavailable. We will refresh this list soon.
          </p>
        ) : null}
      </article>
    )
  }

  // Strict image loading chronology:
  // 1) Categories bar images (handled above)
  // 2) Then one category at a time in the current appearance order
  useEffect(() => {
    if (categories.length === 0) return
    let cancelled = false
    // Build sequential batches per category
    const perCategoryIds = categories.map(c => ({
      id: c.id,
      imageIds: Array.from(new Set((Array.isArray(c.items) ? c.items : []).map(i => i.imageId).filter(Boolean)))
    })).filter(x => x.imageIds.length)
    if (perCategoryIds.length === 0) return
    // Run sequentially to focus network on one category at a time
    async function run() {
      // Let the categories bar paint first
      await new Promise(r => requestAnimationFrame(r))
      for (const batch of perCategoryIds) {
        if (cancelled) return
        const ids = [...batch.imageIds]
        // Even within the category, fetch in small chunks to keep UI responsive
        const CHUNK = 12
        while (ids.length && !cancelled) {
          const slice = ids.splice(0, CHUNK)
          try {
            const res = await fetchImagesByIdsCached(slice)
            if (cancelled) return
            setImageMap(prev => ({ ...prev, ...res }))
          } catch { /* ignore network hiccups for individual slices */ }
          // Yield to main thread briefly between slices
          await new Promise(r => setTimeout(r, 0))
        }
        // Optional small gap between categories to smoothen LCP
        await new Promise(r => setTimeout(r, 20))
      }
    }
    run()
    return () => { cancelled = true }
  }, [categories])

  // Wire Home to URL query for integrated search only (filters remain live/local)
  // Use startTransition to keep UI responsive during search updates
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const term = params.get('q') || ''
    startTransition(() => {
      setQ(term)
      setSearchVisibleCount(24)
    })
  }, [location.search])

  // Reset filters on page change (route) – defaults every time
  useEffect(() => {
    setVegFilter('all')
    setSortBy('default')
  }, [location.pathname])

  // If searching, prefetch only the images needed for currently filtered items, in chunks.
  useEffect(() => {
    const term = q.trim().toLowerCase()
    if (!term) return
    const ids = Array.from(new Set(menu
      .filter(m => (m.name || '').toLowerCase().includes(term))
      .map(m => m.imageId)
      .filter(Boolean)))
    if (!ids.length) return
    let cancelled = false
    async function run() {
      const queue = [...ids]
      const CHUNK = 16
      while (queue.length && !cancelled) {
        const slice = queue.splice(0, CHUNK)
          try {
            const res = await fetchImagesByIdsCached(slice)
            if (cancelled) return
            setImageMap(prev => ({ ...prev, ...res }))
          } catch { /* noop */ }
        await new Promise(r => setTimeout(r, 0))
      }
    }
    run()
    return () => { cancelled = true }
  }, [q, menu])

  const searchTerm = q.trim()
  const isSearching = searchTerm.length > 0

  // ── Render ──
  if (loading) {
    return (
      <div className="page-wrap py-10">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap py-6 space-y-8 overflow-x-hidden">
      {isSearching ? (
        <>
          <section className="space-y-4" aria-labelledby="search-results-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="search-results-heading" className="text-3xl font-semibold">Search results</h2>
                <p className="text-sm opacity-70 mt-1">
                  {filtered.length
                    ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'} for “${searchTerm}”`
                    : `No dishes matched “${searchTerm}” yet.`}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setQ('')
                  setSearchVisibleCount(24)
                  const params = new URLSearchParams(location.search)
                  params.delete('q')
                  navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
                }}
              >Clear search</button>
            </div>
            <div className="px-1 sm:px-2">
              <FilterBar
                vegFilter={vegFilter}
                sortBy={sortBy}
                onVegChange={(v) => setVegFilter(v)}
                onSortChange={(s) => setSortBy(s)}
              />
            </div>
            <section className="space-y-4" id="search-results">
              <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.slice(0, searchVisibleCount).map((item) => {
                  const imageUrl = resolveImageUrlFor(item)
                  const categoryName = categoryNameMap[item.categoryId] || item.categoryName || item.categoryId
                  return <MenuItemCard key={item.id} item={{ ...item, categoryName, imageUrl, storeClosed: !storeOpen }} />
                })}
              </div>
              {filtered.length > searchVisibleCount && (
                <div className="flex justify-center">
                  <button className="btn btn-primary btn-outline" onClick={() => setSearchVisibleCount((c) => c + 24)}>Load more</button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs opacity-70">
                <span>Showing {Math.min(searchVisibleCount, filtered.length)} of {filtered.length}</span>
              </div>
              {filtered.length === 0 && (
                <div className="opacity-60">No matching items.</div>
              )}
            </section>
          </section>
        </>
      ) : (
        <>
          {activeOrder && (
            <section className="space-y-3">
              <div className="alert w-full rounded-3xl bg-secondary/10 border border-secondary/40 text-secondary shadow-lg animate-heartbeat flex flex-row flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                    <MdTrackChanges className="w-6 h-6" />
                  </span>
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-[0.12em]">Active order #{(activeOrder.id || '').slice(-6)}</p>
                    <p className="text-sm mt-1">
                      <span className="font-medium capitalize">{activeOrder.status}</span>
                      {activeOrderSummary?.itemCount ? ` • ${activeOrderSummary.itemCount} item${activeOrderSummary.itemCount === 1 ? '' : 's'}` : ''}
                    </p>
                    {activeOrderSummary?.billLabel ? (
                      <p className="text-sm opacity-80 mt-1">Bill total {activeOrderSummary.billLabel}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button" className="btn btn-sm btn-ghost text-secondary" onClick={() => navigate('/active-orders')}>
                    View order status
                  </button>
                </div>
              </div>
            </section>
          )}
          <section className="space-y-6">
            {!storeOpen && (
              <div className="rounded-2xl border border-red-600/40 bg-red-600 text-white shadow-lg p-4 flex flex-col gap-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-[0.12em]">Temporarily closed</span>
                  <span className="badge badge-xs badge-white text-red-600 font-bold">Offline</span>
                </div>
                <p className="text-sm leading-relaxed font-medium">
                  We are currently closed. You can still browse and add items to your cart. We'll be back soon!
                </p>
              </div>
            )}
            <div className="blend-panel hero-panel px-5 py-6 sm:px-10 sm:py-10 border border-transparent">
              <div className="flex flex-col gap-4 max-w-3xl">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.3em]">
                  <MdOutlineBolt className="w-4 h-4" />
                  Serving joy all day
                </span>
                <h1 className="text-3xl sm:text-5xl font-semibold leading-tight text-base-content/90">Good {timeOfDay}, {userFirstName}!</h1>
                <p className="text-sm sm:text-lg text-base-content/70 max-w-2xl">
                  {storeOpen
                    ? 'Your favourites are standing by. Browse, customise, and order whenever the craving hits.'
                    : 'We are prepping the kitchen right now. Plan your meal and add dishes to the cart—we will nudge you the moment we reopen.'}
                </p>
              </div>
            </div>
            {user && showProfilePrompt ? (
              <ProfileCompletionAlert
                user={user}
                profileForm={profileForm}
                addrState={addrState}
                onEdit={() => navigate('/profile', { state: { completeNow: true } })}
                className="bg-base-100/95 border-primary/30 rounded-2xl"
              />
            ) : null}
          </section>

          <section aria-label="Browse categories" className="space-y-4">
            <CategoriesBar items={categoryBarItems} />
          </section>

          {showSpotlightSection && (
            <section id="spotlight-deals" className="space-y-4">
              <div className="rounded-3xl border border-primary/25 bg-base-100/95 shadow-sm p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MdOutlineBolt className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Spotlight picks</h2>
                  </div>
                  <p className="text-sm opacity-70">
                    {spotlightLoaded
                      ? 'Handpicked highlights to help you decide faster.'
                      : 'Fetching spotlight selections from the kitchen...'}
                  </p>
                </div>
                <div className={`grid gap-4 ${showHotDealsCard && showChefSpecialsCard ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
                  {showHotDealsCard ? renderSpotlightCard({
                    key: 'hot-deals',
                    title: 'Hot deals',
                    icon: <MdLocalOffer className="w-5 h-5" />,
                    bucket: resolvedSpotlight.hotDeals,
                    accentClass: 'text-primary'
                  }) : null}
                  {showChefSpecialsCard ? renderSpotlightCard({
                    key: 'chef-specials',
                    title: 'Chef specials',
                    icon: <MdOutlineAutoAwesome className="w-5 h-5" />,
                    bucket: resolvedSpotlight.chefSpecials,
                    accentClass: 'text-secondary',
                    iconWrapperClass: 'bg-secondary/10 text-secondary',
                    badgeClass: 'badge-secondary'
                  }) : null}
                </div>
              </div>
            </section>
          )}

          <section className="space-y-5" aria-labelledby="menu-heading">
            <div className="flex flex-wrap items-end justify-between gap-3" id="menu">
              <div>
                <h2 id="menu-heading" className="text-3xl font-semibold">Menu</h2>
                <p className="text-sm opacity-70 mt-1">
                  {`${filtered.length} dishes ${vegFilter === 'veg' ? '• vegetarian only' : vegFilter === 'nonveg' ? '• non-veg only' : 'ready to order'}`}
                </p>
              </div>
            </div>
            <div className="px-1 sm:px-2">
              <FilterBar
                vegFilter={vegFilter}
                sortBy={sortBy}
                onVegChange={(v) => setVegFilter(v)}
                onSortChange={(s) => setSortBy(s)}
              />
            </div>

            {categories.length > 0 ? (
              categories.map((cat) => {
                const catItems = filtered.filter((m) => m.categoryId === cat.id)
                if (catItems.length === 0) return null
                return (
                  <section key={cat.id} className="mb-10 scroll-mt-24" id={cat.id}>
                    <h3 className="text-2xl font-semibold mb-4">{cat.name}</h3>
                    <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {catItems.map((item) => {
                        const imageUrl = resolveImageUrlFor(item)
                        const categoryName = categoryNameMap[item.categoryId] || item.categoryName || item.categoryId
                        return <MenuItemCard key={item.id} item={{ ...item, categoryName, imageUrl, storeClosed: !storeOpen }} />
                      })}
                    </div>
                  </section>
                )
              })
            ) : (
              <section className="mb-10" id="all-items">
                <h3 className="text-2xl font-semibold mb-4">All items</h3>
                <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((item) => {
                    const imageUrl = resolveImageUrlFor(item)
                    const categoryName = categoryNameMap[item.categoryId] || item.categoryName || item.categoryId
                    return <MenuItemCard key={item.id} item={{ ...item, categoryName, imageUrl, storeClosed: !storeOpen }} />
                  })}
                </div>
              </section>
            )}
          </section>
        </>
      )}
    </div>
  )
}
