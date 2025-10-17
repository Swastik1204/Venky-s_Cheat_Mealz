import { useEffect, useMemo, useState } from 'react'
import { fetchMenuCategories, fetchLatestUserOrder, fetchImagesByIdsCached, fetchStoreStatus, getImageDataUrl } from '../lib/data'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MenuItemCard from '../components/MenuItemCard'
import FilterBar from '../components/FilterBar'
import CategoriesBar from '../components/CategoriesBar'


// CategoriesBar will be populated dynamically from Firestore categories

export default function Home() {
  const [categories, setCategories] = useState([]) // docs from 'menu'
  const [menu, setMenu] = useState([]) // flattened items with categoryId
  const [imageMap, setImageMap] = useState({}) // { imageId: { data, mime } }
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [vegFilter, setVegFilter] = useState('all') // all | veg | nonveg
  const [sortBy, setSortBy] = useState('default') // default | price-asc | price-desc | name-asc | name-desc
  const [searchVisibleCount, setSearchVisibleCount] = useState(24)
  const [activeOrder, setActiveOrder] = useState(null)
  const [storeOpen, setStoreOpen] = useState(true)
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    fetchMenuCategories()
      .then((docs) => {
        if (!mounted) return
        // Normalize categories: id = doc id, name field optional
        const cats = docs.map((d) => ({
          id: d.id,
          name: d.name || d.id,
            // Preserve category-level imageId so CategoriesBar can render thumbnails
          imageId: d.imageId || null,
          items: Array.isArray(d.items) ? d.items : []
        }))
        // Flatten items and attach categoryId
        const flat = cats.flatMap((c) =>
          (c.items || []).map((it, idx) => ({
            id: `${c.id}-${idx}-${(it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: it.name,
            price: it.price,
            veg: it.veg === false ? false : true, // missing -> veg
            active: it.active === false ? false : true,
            categoryId: c.id,
            category: c.id,
            imageId: it.imageId || null,
            // pass-through for item modal details
            components: Array.isArray(it.components) ? it.components : [],
            isCustom: !!it.isCustom,
          }))
        )
        setCategories(cats)
        setMenu(flat)
        // Item images are loaded later in a category-by-category sequence (see dedicated effect below)
      })
      .finally(() => mounted && setLoading(false))
    fetchStoreStatus().then(s => { if (mounted) setStoreOpen(s.open !== false) })
    return () => { mounted = false }
  }, [])

  // Load latest order for banner
  useEffect(() => {
    if (!user) { setActiveOrder(null); return }
    let active = true
    fetchLatestUserOrder(user.uid).then(o => {
      if (active) setActiveOrder(o && o.status !== 'delivered' ? o : null)
    })
    const id = setInterval(() => {
      fetchLatestUserOrder(user.uid).then(o => {
        if (active) setActiveOrder(o && o.status !== 'delivered' ? o : null)
      })
    }, 15000) // poll every 15s for demo
    return () => { active = false; clearInterval(id) }
  }, [user])

  // Respond to navigation state for scrolling (Home / Menu shortcuts)
  useEffect(() => {
    if (location.state?.reset) {
      // Reset live state to defaults
      setQ('')
      setVegFilter('all')
      setSortBy('default')
      setSearchVisibleCount(24)
      // remove the state so back/forward doesn't re-trigger
      navigate(location.pathname, { replace: true })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // clean state
      navigate(location.pathname, { replace: true })
    } else if (location.state?.scrollTo === 'menu') {
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      navigate(location.pathname, { replace: true })
    } else if (location.hash === '#menu') {
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else if (location.hash) {
      // Smooth scroll to category with a slight offset for sticky header
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        // ensure the section has scroll-margin to account for any sticky header
        el.style.scrollMarginTop = '84px'
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
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

  const categoryBarItems = useMemo(() =>
    categories.map((c) => ({ id: c.id, label: c.name, href: `#${c.id}`, image: c.imageId && categoryImageMap[c.imageId] })),
    [categories, categoryImageMap]
  )

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = menu.filter((m) => {
      if (term && !(m.name || '').toLowerCase().includes(term)) return false
      if (vegFilter === 'veg') return m.veg !== false // treat undefined as veg
      if (vegFilter === 'nonveg') return m.veg === false
      if (m.active === false) return false
      return true
    })
    // Sorting
    const sorted = [...base]
    if (sortBy === 'price-asc') sorted.sort((a,b) => (a.price||0) - (b.price||0))
    else if (sortBy === 'price-desc') sorted.sort((a,b) => (b.price||0) - (a.price||0))
    else if (sortBy === 'name-asc') sorted.sort((a,b) => (a.name||'').localeCompare(b.name||''))
    else if (sortBy === 'name-desc') sorted.sort((a,b) => (b.name||'').localeCompare(a.name||''))
    return sorted
  }, [menu, q, vegFilter, sortBy])

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
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const term = params.get('q') || ''
    setQ(term)
    setSearchVisibleCount(24)
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
        } catch {}
        await new Promise(r => setTimeout(r, 0))
      }
    }
    run()
    return () => { cancelled = true }
  }, [q, menu])

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
    <div className="page-wrap py-6">
      {!storeOpen && (
        <div className="alert alert-warning bg-warning/10 border border-warning/30 mb-6 text-sm">
          <span>The store is currently closed. Browsing only.</span>
        </div>
      )}
      {activeOrder && (
        <div className="alert bg-base-200/70 border border-base-300/60 mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm">
            Order <strong>#{activeOrder.id.slice(-6)}</strong> status: <span className="font-semibold">{activeOrder.status}</span>
          </span>
          <div className="text-xs opacity-70">(auto-refreshing)</div>
          <div className="ml-auto text-xs flex gap-2">
            <a href="/profile#orders" className="link link-primary">View</a>
          </div>
        </div>
      )}
      <div className="mt-2">
        <CategoriesBar items={categoryBarItems} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 mb-3" id="menu">
        <h2 className="section-title">Menu</h2>
      </div>
      <FilterBar
        vegFilter={vegFilter}
        sortBy={sortBy}
        onVegChange={(v) => setVegFilter(v)}
        onSortChange={(s) => setSortBy(s)}
      />

      {/* If a search term exists, show a single unified "Search results" section and hide other items */}
      {q.trim() ? (
        <section className="mb-10" id="search-results">
          <h3 className="text-2xl font-bold mb-4">Search results for "{q.trim()}"</h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.slice(0, searchVisibleCount).map((item) => {
              const imgObj = item.imageId && imageMap[item.imageId]
              const imageUrl = imgObj ? getImageDataUrl(imgObj) : undefined
              return <MenuItemCard key={item.id} item={{ ...item, imageUrl, storeClosed: !storeOpen }} />
            })}
          </div>
          {filtered.length > searchVisibleCount && (
            <div className="flex justify-center mt-6">
              <button className="btn btn-outline" onClick={() => setSearchVisibleCount(c => c + 24)}>Load more</button>
            </div>
          )}
          <div className="mt-4">
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
          {filtered.length === 0 && (
            <div className="opacity-60">No matching items.</div>
          )}
        </section>
      ) : (
        // Default: show categories with their items as before
        (categories.length > 0 ? (
          categories.map((cat) => {
            const catItems = filtered.filter((m) => m.categoryId === cat.id)
            if (catItems.length === 0) return null
            return (
              <section key={cat.id} className="mb-10 scroll-mt-24" id={cat.id}>
                <h3 className="text-2xl font-bold mb-4">{cat.name}</h3>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {catItems.map((item) => {
                    const imgObj = item.imageId && imageMap[item.imageId]
                    const imageUrl = imgObj ? getImageDataUrl(imgObj) : undefined
                    return <MenuItemCard key={item.id} item={{ ...item, imageUrl, storeClosed: !storeOpen }} />
                  })}
                </div>
              </section>
            )
          })
        ) : (
          <section className="mb-10" id="all-items">
            <h3 className="text-2xl font-bold mb-4">All items</h3>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => {
                const imgObj = item.imageId && imageMap[item.imageId]
                const imageUrl = imgObj ? getImageDataUrl(imgObj) : undefined
                return <MenuItemCard key={item.id} item={{ ...item, imageUrl, storeClosed: !storeOpen }} />
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
