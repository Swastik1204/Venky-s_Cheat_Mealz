import { useEffect, useState } from 'react'
import { fetchMenuCategories, upsertMenuCategory, addMenuItems, setMenuItems, renameMenuCategory, fetchAllOrders, updateOrder, nextOrderStatus, migrateRemoveCategoryNameFields, removeMenuItem, appendMenuItems as lowAppend, fetchStoreStatus, setStoreOpen, fetchAppearanceSettings, saveCategoriesOrder, fetchImagesByIds, fetchAppSettings, saveAppSettings } from '../lib/data'
import { Link } from 'react-router-dom'
import { MdDelete, MdAdd, MdKeyboardArrowDown } from 'react-icons/md'
import { useUI } from '../context/UIContext'
import { db } from '../lib/firebase'
import { doc, setDoc, deleteDoc, onSnapshot, query, collection, orderBy } from 'firebase/firestore'

export default function Admin({ section = 'inventory' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [connOk, setConnOk] = useState(false)
  const [writeOk, setWriteOk] = useState(false)
  const [categories, setCategories] = useState([])
  const [newCats, setNewCats] = useState([{ name: '' }])
  const [newItems, setNewItems] = useState([{ category: '', name: '', price: '', veg: true }])
  const [editing, setEditing] = useState({ key: null, name: '', price: '' })
  const [editingCat, setEditingCat] = useState({ id: null, name: '' })
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [liveEnabled, setLiveEnabled] = useState(true)
  // Load persisted store status
  useEffect(() => {
    fetchStoreStatus().then(s => setLiveEnabled(s.open !== false)).catch(()=>{})
  }, [])
  const [statusFilter, setStatusFilter] = useState('all')
  const { confirm, pushToast } = useUI()
  const [pendingRestore, setPendingRestore] = useState(null) // {categoryId,item,timeoutId,toastId}
  const [openCats, setOpenCats] = useState(() => new Set()) // which category accordions are open
  const [imageModal, setImageModal] = useState({ open: false, categoryId: null, itemIndex: null, itemName: '', preview: null, file: null, uploading: false, progress: 0, error: '', mode: 'item' }) // mode: 'item' | 'category'
  const [catImages, setCatImages] = useState({}) // { imageId: dataUrl }
  // Appearance (category order)
  const [appearanceOrder, setAppearanceOrder] = useState([]) // array of category ids
  const [appearanceLoading, setAppearanceLoading] = useState(false)
  const [appearanceSaving, setAppearanceSaving] = useState(false)
  // Mobile-friendly swap reorder mode for appearance ordering
  const [appearanceSwapMode, setAppearanceSwapMode] = useState(false)
  const [appearanceSwapIndex, setAppearanceSwapIndex] = useState(null) // index of first selected item
  // Appearance collapsible panels open state
  const [appearancePanels, setAppearancePanels] = useState(() => ({ order: true, visibility: true }))
  // Settings
  const [appSettings, setAppSettings] = useState({ gstRate: 0.05, adminMobile: '' })
  const [appSettingsLoading, setAppSettingsLoading] = useState(false)
  const [appSettingsSaving, setAppSettingsSaving] = useState(false)

  // Load appearance settings when switching to appearance section
  useEffect(() => {
    if (section !== 'appearance') return
    let active = true
    async function syncAppearance() {
      setAppearanceLoading(true)
      try {
        const settings = await fetchAppearanceSettings()
        const existing = settings.categoriesOrder || []
        const catIds = categories.map(c => c.id)
        if (catIds.length === 0) { // wait for categories
          setAppearanceOrder([])
        } else {
          const normalized = [...existing.filter(id => catIds.includes(id)), ...catIds.filter(id => !existing.includes(id))]
          if (active) setAppearanceOrder(normalized)
          if (settings.__exists === false && !settings.__error) {
            try { await saveCategoriesOrder(normalized) } catch {}
          }
        }
      } catch (e) {
        if (active) setError(e.message || 'Failed to load appearance settings')
      } finally {
        active && setAppearanceLoading(false)
      }
    }
    syncAppearance()
    return () => { active = false }
  }, [section, categories])

  // Load app settings on Settings section
  useEffect(() => {
    if (section !== 'settings') return
    let active = true
    setAppSettingsLoading(true)
    fetchAppSettings().then(s => { if (active) setAppSettings(s) }).finally(()=> active && setAppSettingsLoading(false))
    return () => { active = false }
  }, [section])

  function moveAppearance(idx, delta) {
    setAppearanceOrder(o => {
      const next = [...o]
      const ni = idx + delta
      if (ni < 0 || ni >= next.length) return o
      const tmp = next[idx]
      next[idx] = next[ni]
      next[ni] = tmp
      return next
    })
  }
  function swapAppearance(i, j) {
    if (i === j) return
    setAppearanceOrder(o => {
      const next = [...o]
      const tmp = next[i]
      next[i] = next[j]
      next[j] = tmp
      return next
    })
  }
  function removeAppearance(id) {
    setAppearanceOrder(o => o.filter(x => x !== id))
  }
  function addMissingAppearance() {
    setAppearanceOrder(o => {
      const all = categories.map(c => c.id)
      const missing = all.filter(id => !o.includes(id))
      return [...o, ...missing]
    })
  }
  async function saveAppearanceOrder() {
    setAppearanceSaving(true)
    try {
      await saveCategoriesOrder(appearanceOrder)
      pushToast('Category order saved', 'success')
      setInfo('Category order saved.')
    } catch (e) {
      const msg = (e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''))) ?
        'Permission denied saving appearance. Ensure Firestore rules allow write to miscellaneous/appearance for admin emails.' :
        (e.message || 'Appearance save failed')
      pushToast(msg, 'error')
      setError(msg)
    } finally {
      setAppearanceSaving(false)
    }
  }

  // Core forward flow (excludes rejected which is a terminal branch)
  const statusFlow = ['placed', 'preparing', 'ready', 'delivered']

  // Helper to consistently display category
  function displayCategory(c) {
    return c?.id || c?.name || ''
  }

  function statusColor(s) {
    switch (s) {
      case 'placed': return 'badge-info'
      case 'preparing': return 'badge-warning'
      case 'ready': return 'badge-success'
      case 'delivered': return 'badge-neutral'
      case 'rejected': return 'badge-error'
      default: return 'badge-ghost'
    }
  }

  function progressPercent(s) {
    const idx = statusFlow.indexOf(s)
    if (idx === -1) return 0
    return ((idx + 1) / statusFlow.length) * 100
  }

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  const metrics = statusFlow.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc }, { all: orders.length, rejected: orders.filter(o => o.status === 'rejected').length })

  function toggleCat(id) {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchMenuCategories()
      .then((cats) => {
        if (!mounted) return
        setCategories(cats)
        setConnOk(true)
      })
      .catch((e) => {
        setError(e.message || 'Failed to load data')
        setConnOk(false)
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  // Resolve imageIds (both category and item) to data URLs
  useEffect(() => {
    const catIds = categories.map(c => c.imageId).filter(Boolean)
    const itemIds = categories.flatMap(c => (Array.isArray(c.items) ? c.items : [])
      .map(it => it.imageId)
      .filter(Boolean))
    const ids = Array.from(new Set([...catIds, ...itemIds]))
    if (!ids.length) { setCatImages({}); return }
    let active = true
    fetchImagesByIds(ids).then(map => {
      if (!active) return
      const out = {}
      Object.entries(map).forEach(([id, d]) => { out[id] = `data:${d.mime || 'image/*'};base64,${d.data}` })
      setCatImages(out)
    }).catch(()=>{})
    return () => { active = false }
  }, [categories])

  async function checkConnection() {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const cats = await fetchMenuCategories()
      setCategories(cats)
      setConnOk(true)
    } catch (e) {
      setConnOk(false)
    }
    try {
      await setDoc(doc(db, 'menu', '__health__'), { ok: true }, { merge: true })
      await deleteDoc(doc(db, 'menu', '__health__'))
      setWriteOk(true)
    } catch (e) {
      setWriteOk(false)
      if (!connOk) setError(e.message || 'Firestore write check failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadOrders() { // manual refresh fallback
    setLoadingOrders(true)
    try {
      const result = await fetchAllOrders()
      if (Array.isArray(result)) {
        setOrders(result)
      } else if (result && result.__error === 'permission-denied') {
        setOrders([])
        setError('Admin access required to view orders.')
      } else if (result && result.__error) {
        setError('Failed to load orders.')
      } else if (result && Array.isArray(result.list)) {
        setOrders(result.list)
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load orders.')
    } finally {
      setLoadingOrders(false)
    }
  }

  // Live subscription for orders
  useEffect(() => {
    if (!liveEnabled) return
    const qy = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setOrders(list)
    }, (err) => {
      console.warn('orders live snapshot error', err)
      if (err && /permission/i.test(String(err.message||''))) {
        setError('Admin access required to view live orders.')
      }
    })
    return () => unsub()
  }, [liveEnabled])

  async function advanceOrder(o) {
    const next = nextOrderStatus(o.status)
    if (next === o.status) return
    await updateOrder(o.userId || null, o.id, { status: next })
    setOrders((arr) => arr.map(x => x.id === o.id ? { ...x, status: next } : x))
  }

  async function acceptOrder(o) {
    if (o.status !== 'placed') return
    await updateOrder(o.userId || null, o.id, { status: 'preparing' })
    setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'preparing' } : x))
  }

  async function rejectOrder(o) {
    if (o.status !== 'placed') return
    await updateOrder(o.userId || null, o.id, { status: 'rejected' })
    setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'rejected' } : x))
  }

  // Simple auto-clear (optional) for alerts (short lived)
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 6000)
    return () => clearTimeout(t)
  }, [error])
  useEffect(() => {
    if (!info) return
    const t = setTimeout(() => setInfo(''), 4000)
    return () => clearTimeout(t)
  }, [info])

  async function saveCategories() {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      for (const r of newCats) {
        if (!r.name || !r.name.trim()) continue
        await upsertMenuCategory(r.name.trim())
      }
      setNewCats([{ name: '' }])
      const cats = await fetchMenuCategories()
      setCategories(cats)
      setInfo('Categories saved.')
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  async function saveItems() {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      // Build a list of items per selected category to append (never overwrite existing)
      const grouped = new Map()
      for (const r of newItems) {
        const name = r.name?.trim()
        const catName = r.category?.trim()
        if (!name || !catName) continue
        const arr = grouped.get(catName) || []
        arr.push({ name, price: Number(r.price) || 0, veg: r.veg !== false })
        grouped.set(catName, arr)
      }
      for (const [catName, items] of grouped.entries()) {
        await upsertMenuCategory(catName)
        await addMenuItems(catName, items)
      }
      setNewItems([{ category: '', name: '', price: '', veg: true }])
      const cats = await fetchMenuCategories()
      setCategories(cats)
      setInfo('Items saved.')
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-3xl font-bold mr-4">Admin</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-ghost" onClick={checkConnection} disabled={loading}>Check connection</button>
          <span className={`badge whitespace-nowrap ${connOk ? 'badge-success' : 'badge-error'}`}>
            {connOk ? 'Firestore connected' : 'Firestore error'}
          </span>
          <span className={`badge whitespace-nowrap ${writeOk ? 'badge-success' : 'badge-warning'}`}>
            {writeOk ? 'Write allowed' : 'Write blocked'}
          </span>
        </div>
      </div>

      {/* Secondary admin navbar */}
      <div className="mb-8 rounded-xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm px-4 py-3 flex flex-wrap gap-2 shadow-sm">
  <Link to="/admin/inventory" className={`btn btn-xs sm:btn-sm ${section==='inventory' ? 'btn-primary' : 'btn-outline'}`}>Inventory</Link>
  <Link to="/admin/orders" className={`btn btn-xs sm:btn-sm ${section==='orders' ? 'btn-primary' : 'btn-outline'}`}>Orders</Link>
  <Link to="/admin/analytics" className={`btn btn-xs sm:btn-sm ${section==='analytics' ? 'btn-primary' : 'btn-outline'}`}>Analytics</Link>
  <Link to="/admin/appearance" className={`btn btn-xs sm:btn-sm ${section==='appearance' ? 'btn-primary' : 'btn-outline'}`}>Appearance</Link>
  <Link to="/admin/settings" className={`btn btn-xs sm:btn-sm ${section==='settings' ? 'btn-primary' : 'btn-outline'}`}>Settings</Link>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${liveEnabled ? 'border-success/40 bg-success/10 text-success' : 'border-error/40 bg-error/10 text-error'}`}>
            <span className={`w-2 h-2 rounded-full ${liveEnabled ? 'bg-success animate-pulse' : 'bg-error'}`}></span>
            {liveEnabled ? 'Store Open' : 'Store Paused'}
          </span>
          <button className="btn btn-xs" onClick={async () => {
            setLiveEnabled(v => !v)
            try { await setStoreOpen(!liveEnabled) } catch {}
          }}>{liveEnabled ? 'Pause live' : 'Resume live'}</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setError('')}>✕</button>
        </div>
      )}
      {info && (
        <div className="alert alert-success mb-4">
          <span>{info}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setInfo('')}>✕</button>
        </div>
      )}

  {/* Inventory Section */}
  {section === 'inventory' && (
  <>
  {/* Unified toolbar style quick add row */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm p-5 flex flex-col gap-4 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Quick add categories</h2>
          <div className="flex flex-wrap items-center gap-3 w-full">
            {newCats.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="input input-sm input-bordered w-48"
                  placeholder="Category name"
                  value={row.name}
                  onChange={(e) => {
                    const v = [...newCats]
                    v[idx] = { ...v[idx], name: e.target.value }
                    setNewCats(v)
                  }}
                />
                {idx === newCats.length - 1 && (
                  <button
                    className="btn btn-ghost btn-sm px-1 min-h-0 h-auto hover:bg-base-200/70 transition"
                    title="Add category row"
                    aria-label="Add category"
                    onClick={() => setNewCats((v) => [...v, { name: '' }])}
                  >
                    <MdAdd className="w-8 h-8 text-black" />
                  </button>
                )}
                {newCats.length > 1 && (
                  <button
                    className="btn btn-xs btn-ghost text-lg"
                    title="Remove"
                    onClick={() => setNewCats((v) => v.filter((_, i) => i !== idx))}
                  >×
                  </button>
                )}
              </div>
            ))}
            <div className="ml-auto">
              <button className="btn btn-primary btn-sm" onClick={saveCategories} disabled={loading}>Save categories</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm p-5 flex flex-col gap-4 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Quick add items</h2>
          {newItems.map((row, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3">
              <select
                className="select select-bordered select-sm w-40"
                value={row.category}
                onChange={(e) => {
                  const v = [...newItems]
                  v[idx] = { ...v[idx], category: e.target.value }
                  setNewItems(v)
                }}
              >
                <option value="" disabled hidden>Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={displayCategory(c)}>{displayCategory(c)}</option>
                ))}
              </select>
              <input
                className="input input-bordered input-sm w-52"
                placeholder="Item name"
                value={row.name}
                onChange={(e) => {
                  const v = [...newItems]
                  v[idx] = { ...v[idx], name: e.target.value }
                  setNewItems(v)
                }}
              />
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                className="input input-bordered input-sm w-28"
                placeholder="Price"
                value={row.price}
                onChange={(e) => {
                  const v = [...newItems]
                  v[idx] = { ...v[idx], price: e.target.value }
                  setNewItems(v)
                }}
                onWheel={(e) => e.currentTarget.blur()}
              />
              <div className="join">
                <button
                  type="button"
                  className={`btn btn-xs join-item ${row.veg ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => {
                    const v = [...newItems]
                    v[idx] = { ...v[idx], veg: true }
                    setNewItems(v)
                  }}
                >Veg</button>
                <button
                  type="button"
                  className={`btn btn-xs join-item ${!row.veg ? 'btn-error' : 'btn-ghost'}`}
                  onClick={() => {
                    const v = [...newItems]
                    v[idx] = { ...v[idx], veg: false }
                    setNewItems(v)
                  }}
                >Non-Veg</button>
              </div>
              {idx === newItems.length - 1 && (
                <button
                  className="btn btn-ghost btn-sm px-1 min-h-0 h-auto hover:bg-base-200/70 transition"
                  title="Add item row"
                  aria-label="Add item"
                  onClick={() => setNewItems((v) => [...v, { category: '', name: '', price: '', veg: true }])}
                >
                  <MdAdd className="w-8 h-8 text-black" />
                </button>
              )}
              {newItems.length > 1 && (
                <button
                  className="btn btn-xs btn-ghost text-lg"
                  title="Remove"
                  onClick={() => setNewItems((v) => v.filter((_, i) => i !== idx))}
                >×
                </button>
              )}
              {idx === newItems.length - 1 && (
                <div className="ml-auto">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveItems}
                    disabled={loading || newItems.some(r => r.veg === undefined)}
                    title={newItems.some(r => r.veg === undefined) ? 'Select Veg / Non-Veg for all rows' : 'Save items'}
                  >Save items</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

  {/* Accordion style current menu */}
      <div className="mt-10 space-y-3">
        <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
          <h2 className="text-xl font-semibold">Current menu</h2>
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              (() => {
                const allOpen = categories.every(c => openCats.has(c.id))
                const label = allOpen ? 'Collapse all' : 'Expand all'
                return (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      if (allOpen) {
                        setOpenCats(new Set())
                      } else {
                        setOpenCats(new Set(categories.map(c => c.id)))
                      }
                    }}
                    title={label}
                  >{label}</button>
                )
              })()
            )}
          </div>
        </div>
        {categories.length === 0 && (
          <div className="opacity-60 text-sm">No categories yet.</div>
        )}
        {categories.map(c => {
          const items = Array.isArray(c.items) ? c.items : []
          const catIsEditing = editingCat.id === c.id
          const open = openCats.has(c.id)
          return (
            <div
              key={c.id}
              className={`collapse bg-base-100/70 backdrop-blur-sm border border-base-300/60 rounded-xl transition-all duration-300 group relative overflow-hidden ${open ? 'ring-1 ring-primary/30 shadow-sm' : 'hover:border-base-300 hover:bg-base-100/50'}`}
            >
              {/* Keep the control non-focusable and not aria-hidden to avoid focus on hidden ancestors. We toggle via header click/keyboard. */}
              <input type="checkbox" className="sr-only" checked={open} onChange={() => toggleCat(c.id)} />
              {/* Decorative left accent when open */}
              {open && <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/70 via-primary/30 to-secondary/60" />}
              <div
                className="collapse-title py-3 pr-4 pl-5 flex items-center justify-between gap-4 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                role="button"
                tabIndex={0}
                onClick={() => toggleCat(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    // Only toggle if header itself has focus (not a child control)
                    if (e.currentTarget === e.target) {
                      e.preventDefault()
                      toggleCat(c.id)
                    }
                  }
                }}
                aria-expanded={open}
                aria-controls={`cat-panel-${c.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {c.imageId && catImages[c.imageId] && (
                    <img src={catImages[c.imageId]} alt="" className="w-8 h-8 rounded object-cover border border-base-300/60" />
                  )}
                  {catIsEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="input input-bordered input-xs"
                        value={editingCat.name}
                        onClick={e => e.stopPropagation()}
                        onChange={(e) => setEditingCat(s => ({ ...s, name: e.target.value }))}
                      />
                      <div className="join">
                        <button
                          className="btn btn-success btn-xs join-item"
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await renameMenuCategory(c.id, editingCat.name.trim())
                              const cats = await fetchMenuCategories()
                              setCategories(cats)
                              setEditingCat({ id: null, name: '' })
                              setInfo('Category renamed.')
                            } catch (e) {
                              setError(e.message || 'Rename failed')
                            }
                          }}
                          title="Save"
                        >✓</button>
                        <button
                          className="btn btn-error btn-xs join-item"
                          onClick={(e) => { e.stopPropagation(); setEditingCat({ id: null, name: '' }) }}
                          title="Cancel"
                        >✕</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="font-medium tracking-tight text-base-content/90 hover:text-base-content btn btn-ghost btn-xs px-2 normal-case"
                      onClick={(e) => { e.stopPropagation(); setEditingCat({ id: c.id, name: displayCategory(c) }) }}
                      title="Rename category"
                    >{displayCategory(c)}</button>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 text-xs rounded-full border transition-colors ${open ? 'bg-primary/10 border-primary/40 text-primary-content/80' : 'bg-base-200/70 border-base-300/60 group-hover:border-primary/40'}`}>{items.length} item{items.length !== 1 && 's'}</span>
                  <MdKeyboardArrowDown className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180 text-primary' : 'text-base-content/50 group-hover:text-base-content/80'}`} />
                </div>
              </div>
              <div id={`cat-panel-${c.id}`} className="collapse-content pt-0">
                <div className={`${open ? 'overflow-visible max-h-none' : 'overflow-hidden max-h-0'} transition-[max-height] duration-300 ease-in-out`}> {/* height wrapper without hard cap */}
                  <div className={`${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} transition-all duration-300`}>  
                    {open && (
                      <div className="mb-3 p-3 rounded-lg border border-base-300/60 bg-base-100/80 flex items-center gap-4">
                        {c.imageId && catImages[c.imageId] ? (
                          <img src={catImages[c.imageId]} alt="Category" className="w-16 h-16 rounded-md object-cover border border-base-300/60" />
                        ) : (
                          <div className="w-16 h-16 rounded-md border border-dashed border-base-300/70 grid place-items-center text-[11px] opacity-60">No image</div>
                        )}
                        <div className="flex flex-col gap-2">
                          <div className="text-xs opacity-60 -mb-1">Category image</div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
                              onClick={() => setImageModal({ open: true, categoryId: c.id, itemIndex: null, itemName: c.id, preview: null, file: null, uploading: false, progress: 0, error: '', mode: 'category' })}
                            >{c.imageId ? 'Change image' : '(+ cat image)'}</button>
                            {c.imageId && (
                              <button
                                type="button"
                                className="btn btn-xs btn-ghost text-error"
                                onClick={async () => {
                                  try {
                                    const target = categories.find(ct => ct.id === c.id)
                                    const itemsOnly = target?.items || []
                                    await setMenuItems(c.id, itemsOnly)
                                    setCategories(prev => prev.map(ct => ct.id === c.id ? { ...ct, imageId: undefined } : ct))
                                    setInfo('Category image removed.')
                                  } catch (er) { setError(er.message || 'Failed to remove image') }
                                }}
                              >Delete</button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {items.length === 0 && (
                      <div className="opacity-50 text-sm italic pt-2">No items in this category.</div>
                    )}
                    {items.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-base-300/60 mt-2">
                        <table className="table table-sm">
                      <thead>
                        <tr>
                          <th className="w-1/3">Item</th>
                          <th className="w-24 text-right">Price</th>
                          <th className="w-16 text-center">Type</th>
                          <th className="w-24 text-center">Image</th>
                          <th className="w-32 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const key = `${c.id}:${idx}`
                          const isEditing = editing.key === key
                          const hasImg = !!it.imageId
                          const imgSrc = hasImg && catImages[it.imageId] ? catImages[it.imageId] : null
                          return (
                            <tr key={key}>
                              <td>
                                <div className="flex items-center gap-2">
                                  {imgSrc ? (
                                    <img src={imgSrc} alt="" className="w-8 h-8 rounded object-cover border border-base-300/60" />
                                  ) : (
                                    <div className="w-8 h-8 rounded border border-dashed border-base-300/60 grid place-items-center text-[9px] opacity-50">—</div>
                                  )}
                                {isEditing ? (
                                  <input
                                    className="input input-bordered input-xs w-full"
                                    value={editing.name}
                                    onChange={(e) => setEditing(s => ({ ...s, name: e.target.value }))}
                                  />
                                ) : <span className="truncate" title={it.name}>{it.name}</span>}
                                </div>
                              </td>
                              <td className="text-right">
                                {isEditing ? (
                                  <input
                                    className="input input-bordered input-xs w-20 text-right"
                                    type="text"
                                    inputMode="decimal"
                                    value={editing.price}
                                    onChange={(e) => setEditing(s => ({ ...s, price: e.target.value }))}
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                ) : (it.price !== undefined && it.price !== '' ? `₹${it.price}` : '')}
                              </td>
                              <td className="text-center">
                                {isEditing ? (
                                  <div className="join">
                                    <button
                                      type="button"
                                      className={`btn btn-xs join-item ${editing.veg !== false ? 'btn-success' : 'btn-ghost'}`}
                                      onClick={() => setEditing(s => ({ ...s, veg: true }))}
                                    >V</button>
                                    <button
                                      type="button"
                                      className={`btn btn-xs join-item ${editing.veg === false ? 'btn-error' : 'btn-ghost'}`}
                                      onClick={() => setEditing(s => ({ ...s, veg: false }))}
                                    >NV</button>
                                  </div>
                                ) : (
                                  it.veg !== false ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5" aria-label="Vegetarian" title="Vegetarian">
                                      <span className="w-3.5 h-3.5 rounded-sm border-2 border-green-600 relative">
                                        <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-green-600" />
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-5 h-5" aria-label="Non-Vegetarian" title="Non-Vegetarian">
                                      <span className="w-3.5 h-3.5 rounded-sm border-2 border-rose-600 relative">
                                        <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-rose-600" />
                                      </span>
                                    </span>
                                  )
                                )}
                              </td>
                              <td className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline"
                                    title={it.imageId ? 'Change image' : 'Add image'}
                                    onClick={() => setImageModal({ open: true, categoryId: c.id, itemIndex: idx, itemName: it.name, preview: null, file: null, uploading: false, progress: 0, error: '', mode: 'item' })}
                                  >{it.imageId ? 'Change image' : '(+ image)'}</button>
                                  {it.imageId && (
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-ghost text-error"
                                      title="Delete image"
                                      onClick={async () => {
                                        try {
                                          // Update local state
                                          setCategories(prev => prev.map(cat => {
                                            if (cat.id !== c.id) return cat
                                            const items = cat.items.map((x, i2) => i2 === idx ? { ...x, imageId: undefined } : x)
                                            return { ...cat, items }
                                          }))
                                          // Persist change
                                          const target = categories.find(cat => cat.id === c.id)
                                          if (target) {
                                            const items = target.items.map((x, i2) => i2 === idx ? { ...x, imageId: undefined } : x)
                                            await setMenuItems(c.id, items)
                                          }
                                          pushToast('Item image removed.', 'info')
                                        } catch (er) {
                                          setError(er.message || 'Failed to remove image')
                                        }
                                      }}
                                    >Delete</button>
                                  )}
                                </div>
                              </td>
                              <td className="text-right">
                                {isEditing ? (
                                  <div className="join justify-end">
                                    <button
                                      className="btn btn-success btn-xs join-item"
                                      onClick={async () => {
                                        try {
                                          const updated = categories.map(cat =>
                                            cat.id === c.id
                                              ? { ...cat, items: cat.items.map((x, i) => (i === idx ? { name: editing.name.trim(), price: Number(editing.price) || 0, veg: editing.veg !== false, imageId: x.imageId } : x)) }
                                              : cat
                                          )
                                          setCategories(updated)
                                          await setMenuItems(c.id, updated.find(x => x.id === c.id).items)
                                          setEditing({ key: null, name: '', price: '' })
                                          setInfo('Item updated.')
                                        } catch (e) {
                                          setError(e.message || 'Update failed')
                                        }
                                      }}
                                      title="Save"
                                    >✓</button>
                                    <button
                                      className="btn btn-error btn-xs join-item"
                                      onClick={() => setEditing({ key: null, name: '', price: '' })}
                                      title="Cancel"
                                    >✕</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      className="btn btn-ghost btn-xs"
                                      onClick={() => setEditing({ key, name: it.name, price: String(it.price ?? ''), veg: it.veg !== false })}
                                      title="Edit item"
                                    >✎</button>
                                    <button
                                      className="btn btn-ghost btn-xs text-error"
                                      title="Delete item"
                                      onClick={() => {
                                        const itemCopy = { ...it }
                                        confirm({
                                          message: `Delete "${it.name}" from ${displayCategory(c)}?\nYou can undo for 5 seconds.`,
                                          onConfirm: async () => {
                                            try {
                                              const ok = await removeMenuItem(c.id, it.name)
                                              if (ok) {
                                                setCategories(prev => prev.map(cat => cat.id === c.id ? { ...cat, items: cat.items.filter((x, i2) => i2 !== idx) } : cat))
                                                const timeoutId = setTimeout(() => setPendingRestore(null), 5000)
                                                const toastId = pushToast(`Deleted ${it.name}.`, 'info', 5000, {
                                                  label: 'Undo',
                                                  onClick: async () => {
                                                    setPendingRestore(pr => {
                                                      if (!pr) return null
                                                      clearTimeout(pr.timeoutId)
                                                      return pr
                                                    })
                                                    const pr = pendingRestore
                                                    if (!pr) return
                                                    const current = categories.find(cat => cat.id === pr.categoryId)
                                                    if (current && !current.items.some(x => (x.name || '').toLowerCase() === pr.item.name.toLowerCase())) {
                                                      await lowAppend(pr.categoryId, [pr.item])
                                                      setCategories(prev => prev.map(cat => cat.id === pr.categoryId ? { ...cat, items: [...cat.items, pr.item] } : cat))
                                                      pushToast('Restored item', 'success', 2500)
                                                    }
                                                    setPendingRestore(null)
                                                  }
                                                })
                                                setPendingRestore({ categoryId: c.id, item: itemCopy, timeoutId, toastId })
                                              } else {
                                                pushToast('Delete failed (not found).', 'error')
                                              }
                                            } catch (e) {
                                              pushToast(e.message || 'Delete failed', 'error')
                                            }
                                          }
                                        })
                                      }}
                                    >
                                      <MdDelete className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

  </>
  )}

  {/* Orders Section */}
  {section === 'orders' && (
  <div className="mt-4">
        {/* Migration utility (one-time). Hidden by default; toggle manually if needed */}
        {/* <button className="btn btn-xs btn-outline mb-4" onClick={async () => { await migrateRemoveCategoryNameFields(); const cats = await fetchMenuCategories(); setCategories(cats); setInfo('Migrated old category docs.'); }}>Run category name cleanup</button> */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Orders</span>
              <span className="text-sm font-normal opacity-60 flex items-center gap-1">
                {liveEnabled && <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Live</span>}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm btn-outline" onClick={() => setLiveEnabled(v => !v)}>{liveEnabled ? 'Pause live' : 'Resume live'}</button>
              <button className="btn btn-sm btn-outline" onClick={loadOrders} disabled={loadingOrders || liveEnabled} title={liveEnabled ? 'Pause live to use manual refresh' : 'Manual refresh'}>
                {loadingOrders ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="stat shadow-sm bg-base-100/50 backdrop-blur rounded-xl p-3 border border-base-200/50">
              <div className="stat-title text-xs">Total</div>
              <div className="stat-value text-lg">{metrics.all}</div>
            </div>
            {statusFlow.map(s => (
              <div key={s} className="stat shadow-sm bg-base-100/50 backdrop-blur rounded-xl p-3 border border-base-200/50">
                <div className="stat-title text-xs capitalize flex items-center gap-1">
                  <span>{s}</span>
                </div>
                <div className="stat-value text-lg">{metrics[s]}</div>
              </div>
            ))}
            <div className="stat shadow-sm bg-base-100/50 backdrop-blur rounded-xl p-3 border border-base-200/50">
              <div className="stat-title text-xs capitalize">Rejected</div>
              <div className="stat-value text-lg">{metrics.rejected}</div>
            </div>
          </div>

          {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {['all', ...statusFlow, 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`btn btn-xs ${statusFilter === f ? 'btn-primary' : 'btn-ghost'} rounded-full`}
                >{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>

          {orders.length === 0 && !loadingOrders && (
            <div className="opacity-60 text-sm italic">No orders yet.</div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map(o => {
              const next = nextOrderStatus(o.status)
              const advanceDisabled = next === o.status
              const createdAt = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
              const ageMins = createdAt ? Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 60000)) : null
              const pct = progressPercent(o.status)
              return (
                <div key={o.id} className="card bg-base-100/70 backdrop-blur-sm border border-base-300/60 shadow-sm hover:shadow-md transition overflow-hidden">
                  <div className="card-body p-4 gap-3">
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-primary/5 via-transparent to-secondary/10"></div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-col">
                      <div className="font-semibold tracking-wide">#{o.id.slice(-6)}</div>
                      <div className="text-[11px] opacity-60 flex gap-2">
                        {ageMins !== null && <span>{ageMins}m ago</span>}
                        <span>{o.items?.length || 0} items</span>
                        <span>₹{o.subtotal}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge badge-sm ${statusColor(o.status)} capitalize`}>{o.status}</span>
                      {o.status === 'placed' && (
                        <div className="flex gap-1">
                          <button className="btn btn-xs btn-success" onClick={() => acceptOrder(o)}>Accept</button>
                          <button className="btn btn-xs btn-error" onClick={() => rejectOrder(o)}>Reject</button>
                        </div>
                      )}
                      {o.status !== 'placed' && o.status !== 'rejected' && (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => advanceOrder(o)}
                          disabled={advanceDisabled}
                          title={advanceDisabled ? 'Final state reached' : `Advance to ${next}`}
                        >{advanceDisabled ? 'Complete' : `Mark ${next}`}</button>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  {o.status !== 'rejected' && (
                    <div className="mb-3">
                      <div className="h-1.5 w-full rounded bg-base-300/50 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: pct + '%' }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        {statusFlow.map(s => (
                          <span key={s} className={`flex-1 text-center text-[9px] tracking-wide ${o.status === s ? 'text-primary font-semibold' : 'opacity-40'}`}>{s[0].toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Items preview */}
                  <div className="text-[11px] flex flex-wrap gap-2">
                    {o.items?.slice(0,5).map(it => (
                      <span key={it.id} className="px-2 py-0.5 rounded-full bg-base-200/70 border border-base-300/60 group-hover:border-primary/50 transition">
                        {it.name}×{it.qty}
                      </span>
                    ))}
                    {o.items?.length > 5 && (
                      <span className="opacity-60">+{o.items.length - 5} more</span>
                    )}
                  </div>
                  {o.payment?.method && (
                    <div className="mt-2 text-[10px] uppercase tracking-wide opacity-60">{o.payment.method}</div>
                  )}
                  <div className="pt-1 flex justify-end">
                    <button className="btn btn-ghost btn-xs" onClick={() => { setSelectedOrder(o); setOrderModalOpen(true) }}>View</button>
                  </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      )}

      {/* Analytics Section (placeholder) */}
      {section === 'analytics' && (
        <div className="mt-4 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Analytics (Coming Soon)</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
              <h3 className="font-semibold mb-1">Sales Overview</h3>
              <p className="text-xs opacity-70">Daily / Weekly / Monthly aggregation placeholder.</p>
            </div>
            <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
              <h3 className="font-semibold mb-1">Top Items</h3>
              <p className="text-xs opacity-70">Rank best-selling menu items (to implement).</p>
            </div>
            <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
              <h3 className="font-semibold mb-1">Category Performance</h3>
              <p className="text-xs opacity-70">Compare categories by revenue / orders.</p>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-base-300/60 p-6 text-sm opacity-70">
            Future filters: date range picker, quick presets (Today / 7d / 30d), export CSV, gross vs net, average order value, repeat customers, time-of-day heatmap.
          </div>
        </div>
      )}

      {/* Appearance Section */}
      {section === 'appearance' && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Appearance</h2>
          {/* Category Order Panel */}
          <div className="collapse collapse-arrow rounded-xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm mb-6 overflow-hidden">
            <input type="checkbox" checked={appearancePanels.order} onChange={() => setAppearancePanels(p => ({ ...p, order: !p.order }))} />
            <div className="collapse-title px-5 py-4 flex items-center justify-between gap-4 cursor-pointer">
              <h3 className="font-semibold m-0">Category Order</h3>
              <span className="text-xs opacity-60">Rearrange how categories appear to customers</span>
            </div>
            <div className="collapse-content px-5 pb-6 pt-0">
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="toggle toggle-sm" checked={appearanceSwapMode} onChange={(e)=>{ setAppearanceSwapMode(e.target.checked); setAppearanceSwapIndex(null) }} />
                <span>Swap mode</span>
              </label>
              {appearanceSwapMode && <span className="text-xs opacity-70">Tap first item, then second item to swap. (Mobile friendly)</span>}
            </div>
            {appearanceLoading && <div className="loading loading-spinner loading-sm" />}
            {!appearanceLoading && (
              <>
                {appearanceOrder.length === 0 && <div className="opacity-60 text-sm">No categories available.</div>}
                <ul className="space-y-2">
                  {appearanceOrder.map((id, idx) => {
                    const selected = appearanceSwapMode && appearanceSwapIndex === idx
                    return (
                      <li
                        key={id}
                        className={`flex items-center gap-2 p-2 rounded-lg border bg-base-100/70 transition relative ${selected ? 'border-primary ring-1 ring-primary/40 bg-primary/5' : 'border-base-300/60'} ${appearanceSwapMode ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (!appearanceSwapMode) return
                          if (appearanceSwapIndex === null) {
                            setAppearanceSwapIndex(idx)
                          } else if (appearanceSwapIndex === idx) {
                            setAppearanceSwapIndex(null)
                          } else {
                            swapAppearance(appearanceSwapIndex, idx)
                            setAppearanceSwapIndex(null)
                          }
                        }}
                      >
                        <span className="w-6 text-[11px] text-center opacity-60 select-none">{idx+1}</span>
                        <span className="font-medium flex-1 truncate" title={id}>{id}</span>
                        {/* Arrow move controls always visible on md+, hidden when swap mode active */}
                        <div className={`join ${appearanceSwapMode ? 'hidden' : 'flex'} sm:flex`}>
                          <button className="btn btn-xs join-item" onClick={(e) => { e.stopPropagation(); moveAppearance(idx,-1) }} disabled={idx===0}>↑</button>
                          <button className="btn btn-xs join-item" onClick={(e) => { e.stopPropagation(); moveAppearance(idx,1) }} disabled={idx===appearanceOrder.length-1}>↓</button>
                        </div>
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={(e) => { e.stopPropagation(); removeAppearance(id) }}
                          title="Remove from ordering list"
                        >✕</button>
                        {appearanceSwapMode && selected && <span className="absolute inset-0 pointer-events-none rounded-lg ring-2 ring-primary/50" aria-hidden="true" />}
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-sm" onClick={addMissingAppearance}>Add missing categories</button>
                  <button className="btn btn-primary btn-sm" disabled={appearanceSaving} onClick={saveAppearanceOrder}>{appearanceSaving ? 'Saving…' : 'Save order'}</button>
                </div>
                <p className="mt-4 text-xs opacity-70 leading-relaxed space-y-1">
                  <span className="block">Stored in <code>miscellaneous/appearance</code>. Order applied on next fetch.</span>
                  <span className="block">Use arrows (desktop) or enable Swap mode (mobile) to reorder. Drag & drop can be added later.</span>
                </p>
              </>
            )}
            </div>
          </div>
          {/* Item Visibility Management */}
          <div className="collapse collapse-arrow rounded-xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm mb-6 overflow-hidden">
            <input type="checkbox" checked={appearancePanels.visibility} onChange={() => setAppearancePanels(p => ({ ...p, visibility: !p.visibility }))} />
            <div className="collapse-title px-5 py-4 flex flex-col gap-1 cursor-pointer">
              <h3 className="font-semibold m-0">Item Visibility</h3>
              <p className="text-xs opacity-60 m-0 leading-relaxed">Toggle which items customers can see. Hidden items are kept for later use.</p>
            </div>
            <div className="collapse-content px-5 pb-6 pt-0">
            <div className="space-y-3">
              {categories.length === 0 && <div className="opacity-60 text-sm">No categories.</div>}
              {categories.map(cat => {
                const items = Array.isArray(cat.items) ? cat.items : []
                const open = openCats.has('vis-'+cat.id)
                return (
                  <div key={cat.id} className={`collapse collapse-arrow border border-base-300/60 rounded-lg bg-base-100/60 ${open ? 'shadow-sm' : ''}`}> 
                    <input type="checkbox" checked={open} onChange={() => {
                      setOpenCats(prev => { const next = new Set(prev); const key = 'vis-'+cat.id; next.has(key) ? next.delete(key) : next.add(key); return next })
                    }} />
                    <div className="collapse-title text-sm font-medium flex items-center gap-2">
                      <span className="truncate flex-1">{cat.id}</span>
                      <span className="badge badge-outline text-[10px]">{items.filter(i => i.active === false).length} hidden</span>
                    </div>
                    <div className="collapse-content">
                      {items.length === 0 && <div className="opacity-50 text-xs italic">No items.</div>}
                      {items.length > 0 && (
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 py-2">
                          {items.map((it, idx) => {
                            const inactive = it.active === false
                            return (
                              <div key={idx} className={`group relative p-3 rounded-lg border text-xs flex flex-col gap-2 transition ${inactive ? 'border-error/40 bg-error/5 opacity-70' : 'border-base-300/60 bg-base-100/70'} hover:border-primary/50`}>
                                <div className="flex-1 min-h-[34px] font-medium leading-snug truncate" title={it.name}>{it.name}</div>
                                <div className="flex items-center justify-between text-[10px] opacity-70">
                                  <span>{it.veg === false ? 'Non-Veg' : 'Veg'}</span>
                                  {it.price !== undefined && <span>₹{it.price}</span>}
                                </div>
                                <button
                                  type="button"
                                  className={`btn btn-ghost btn-xs mt-1 ${inactive ? 'text-success' : 'text-error'}`}
                                  onClick={async () => {
                                    try {
                                      setCategories(prev => prev.map(c => {
                                        if (c.id !== cat.id) return c
                                        const items = c.items.map((x,i2) => i2===idx ? { ...x, active: x.active === false ? true : false } : x)
                                        return { ...c, items }
                                      }))
                                      const target = categories.find(c => c.id === cat.id)
                                      if (target) {
                                        const newItems = target.items.map((x,i2) => i2===idx ? { ...x, active: x.active === false ? true : false } : x)
                                        await setMenuItems(cat.id, newItems)
                                      }
                                      pushToast(inactive ? 'Item activated' : 'Item hidden', 'success')
                                    } catch (e) {
                                      pushToast(e.message || 'Toggle failed', 'error')
                                    }
                                  }}
                                >{inactive ? 'Activate' : 'Hide'}</button>
                                {inactive && <span className="absolute top-1 right-1 text-[9px] px-1 py-0.5 rounded bg-error/20 text-error">Hidden</span>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {items.some(i => i.active === false) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={async () => {
                              try {
                                setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, items: c.items.map(it => ({ ...it, active: true })) } : c))
                                const target = categories.find(c => c.id === cat.id)
                                if (target) {
                                  await setMenuItems(cat.id, target.items.map(it => ({ ...it, active: true })))
                                }
                                pushToast('All items activated', 'success')
                              } catch (e) { pushToast(e.message || 'Action failed', 'error') }
                            }}
                          >Activate all</button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={async () => {
                              try {
                                setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, items: c.items.map(it => ({ ...it, active: false })) } : c))
                                const target = categories.find(c => c.id === cat.id)
                                if (target) {
                                  await setMenuItems(cat.id, target.items.map(it => ({ ...it, active: false })))
                                }
                                pushToast('All items hidden', 'success')
                              } catch (e) { pushToast(e.message || 'Action failed', 'error') }
                            }}
                          >Hide all</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-dashed border-base-300/60 text-xs opacity-70">
              Planned extensions: category visibility toggles, theme presets, accent color picker, layout density controls.
            </div>
            <div className="p-4 rounded-xl border border-dashed border-base-300/60 text-xs opacity-70">
              Tip: Reordering does not delete categories; removed entries can be re-added via Add missing categories.
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {section === 'settings' && (
        <div className="mt-4 max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Settings</h2>
          <div className="rounded-xl border border-base-300/60 bg-base-100/70 p-4 space-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">GST Rate (%)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input input-bordered"
                value={Math.round((appSettings.gstRate || 0) * 10000)/100}
                onChange={(e)=> setAppSettings(s => ({ ...s, gstRate: (Number(e.target.value)||0)/100 }))}
              />
              <span className="text-xs opacity-60 mt-1">Default used in POS; can be overridden later.</span>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Admin mobile (WhatsApp)</span></label>
              <input className="input input-bordered" value={appSettings.adminMobile} onChange={(e)=> setAppSettings(s => ({ ...s, adminMobile: e.target.value }))} placeholder="91XXXXXXXXXX" />
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" disabled={appSettingsSaving} onClick={async ()=>{
                setAppSettingsSaving(true)
                try {
                  await saveAppSettings(appSettings)
                  setInfo('Settings saved')
                } catch (e) {
                  setError(e.message || 'Failed to save settings')
                } finally { setAppSettingsSaving(false) }
              }}>{appSettingsSaving ? 'Saving…' : 'Save'}</button>
              <button className="btn btn-ghost" disabled={appSettingsLoading} onClick={async ()=>{
                setAppSettingsLoading(true)
                try { setAppSettings(await fetchAppSettings()) } catch {} finally { setAppSettingsLoading(false) }
              }}>{appSettingsLoading ? 'Loading…' : 'Reload'}</button>
            </div>
          </div>
        </div>
      )}

      {orderModalOpen && selectedOrder && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">Order #{selectedOrder.id.slice(-6)} <span className={`badge ${statusColor(selectedOrder.status)} badge-sm capitalize`}>{selectedOrder.status}</span></h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-1">Summary</div>
                  <div className="space-y-1 opacity-80">
                    <div>Items: {selectedOrder.items?.length || 0}</div>
                    <div>Subtotal: ₹{selectedOrder.subtotal}</div>
                    {selectedOrder.payment?.method && <div>Payment: {selectedOrder.payment.method}</div>}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">Timestamps</div>
                  <div className="space-y-1 opacity-80">
                    {selectedOrder.createdAt?.seconds && <div>Created: {new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString()}</div>}
                    {selectedOrder.updatedAt?.seconds && <div>Updated: {new Date(selectedOrder.updatedAt.seconds * 1000).toLocaleString()}</div>}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Items</div>
                <div className="overflow-x-auto rounded border border-base-300/60">
                  <table className="table table-xs">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map(it => (
                        <tr key={it.id}>
                          <td>{it.name}</td>
                          <td>{it.qty}</td>
                          <td>₹{it.price}</td>
                          <td>₹{(it.price || 0) * (it.qty || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-action flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'placed' && (
                  <>
                    <button className="btn btn-sm btn-success" onClick={() => { acceptOrder(selectedOrder) }}>Accept</button>
                    <button className="btn btn-sm btn-error" onClick={() => { rejectOrder(selectedOrder) }}>Reject</button>
                  </>
                )}
                {selectedOrder.status !== 'placed' && selectedOrder.status !== 'rejected' && nextOrderStatus(selectedOrder.status) !== selectedOrder.status && (
                  <button className="btn btn-sm btn-primary" onClick={() => { advanceOrder(selectedOrder) }}>Mark {nextOrderStatus(selectedOrder.status)}</button>
                )}
              </div>
              <button className="btn btn-sm" onClick={() => { setOrderModalOpen(false); setSelectedOrder(null) }}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => { setOrderModalOpen(false); setSelectedOrder(null) }}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {imageModal.open && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-semibold mb-2 text-lg">{imageModal.itemName}: {imageModal.mode==='category'?'category image':'item image'} upload</h3>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered file-input-sm w-full"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  // Reset state for new file
                  setImageModal(m => ({ ...m, file: null, preview: null, progress: 0, error: '', uploading: false }))
                  // Basic validations
                  if (!file.type.startsWith('image/')) {
                    setImageModal(m => ({ ...m, error: 'Not an image file.' }))
                    return
                  }
                  const maxBytes = 1024 * 1024 // 1MB cap
                  if (file.size > maxBytes) {
                    setImageModal(m => ({ ...m, error: `File too large (${Math.round(file.size/1024)}KB). Max 1MB.` }))
                    return
                  }
                  const reader = new FileReader()
                  reader.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                      const pct = Math.min(100, Math.round((ev.loaded / ev.total) * 100))
                      setImageModal(m => ({ ...m, progress: pct }))
                    }
                  }
                  reader.onerror = () => {
                    setImageModal(m => ({ ...m, error: 'Failed to read file.' }))
                  }
                  reader.onload = (ev) => {
                    setImageModal(m => ({ ...m, file, preview: ev.target?.result || null, progress: 100 }))
                  }
                  setImageModal(m => ({ ...m, file, progress: 0 }))
                  reader.readAsDataURL(file)
                }}
              />
              {/* Preview / progress */}
              {imageModal.preview && !imageModal.error && (
                <div className="rounded-lg overflow-hidden border border-base-300/60 relative">
                  <img src={imageModal.preview} alt="preview" className="max-h-56 w-full object-cover" />
                  {imageModal.uploading && (
                    <div className="absolute inset-0 bg-base-300/40 backdrop-blur-sm flex items-center justify-center">
                      <span className="loading loading-spinner loading-sm" />
                    </div>
                  )}
                </div>
              )}
              {!imageModal.preview && imageModal.file && !imageModal.error && (
                <div className="w-full h-32 rounded-lg border border-dashed border-base-300/70 flex flex-col items-center justify-center gap-2 text-xs opacity-70">
                  <span className="loading loading-spinner loading-sm" />
                  <span>Reading file… {imageModal.progress}%</span>
                </div>
              )}
              {imageModal.progress > 0 && imageModal.progress < 100 && !imageModal.error && (
                <progress className="progress progress-primary w-full" value={imageModal.progress} max="100" />
              )}
              {imageModal.error && (
                <div className="alert alert-error py-2 min-h-0 text-xs flex items-center justify-between">
                  <span>{imageModal.error}</span>
                  <button className="btn btn-ghost btn-xs" onClick={() => setImageModal(m => ({ ...m, error: '', file: null, preview: null, progress: 0 }))}>Clear</button>
                </div>
              )}
              <p className="text-xs opacity-70 leading-relaxed space-y-1">
                <span className="block">Image stored inline as base64 (demo / low volume).</span>
                <span className="block">For production, prefer Cloud Storage + CDN, thumbnails, caching.</span>
                <span className="block">Limit: 1MB (~1024KB) (enforced).</span>
              </p>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-sm btn-primary"
                disabled={imageModal.uploading || !imageModal.file || !!imageModal.error || imageModal.progress < 100 || !imageModal.preview}
                onClick={async () => {
                  if (!imageModal.file) return
                  try {
                    setImageModal(m => ({ ...m, uploading: true, error: '' }))
                    // Extract base64 without prefix
                    const dataUrl = imageModal.preview
                    const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl)
                    const mime = match ? match[1] : imageModal.file.type
                    const b64 = match ? match[2] : null
                    if (!b64) throw new Error('Invalid data URL')
                    const { saveBase64Image, setMenuItems } = await import('../lib/data')
                    const imageId = await saveBase64Image(
                      b64,
                      mime,
                      imageModal.mode === 'category'
                        ? { ownerType: 'category', categoryId: imageModal.categoryId }
                        : { ownerType: 'item', categoryId: imageModal.categoryId, itemName: imageModal.itemName }
                    )
                    if (imageModal.mode === 'item') {
                      // Attach imageId to a specific item
                      setCategories(prev => prev.map(cat => {
                        if (cat.id !== imageModal.categoryId) return cat
                        const items = cat.items.map((it, i) => i === imageModal.itemIndex ? { ...it, imageId } : it)
                        return { ...cat, items }
                      }))
                      const target = categories.find(cat => cat.id === imageModal.categoryId)
                      if (target) {
                        const items = target.items.map((it, i) => i === imageModal.itemIndex ? { ...it, imageId } : it)
                        await setMenuItems(imageModal.categoryId, items)
                      }
                    } else if (imageModal.mode === 'category') {
                      // Persist category-level imageId by rewriting doc (items preserved)
                      const target = categories.find(cat => cat.id === imageModal.categoryId)
                      const items = target?.items || []
                      // setMenuItems only writes items array; we need a direct write to store imageId alongside items
                      const { doc, setDoc } = await import('firebase/firestore')
                      const { db } = await import('../lib/firebase')
                      await setDoc(doc(db, 'menu', imageModal.categoryId), { items, imageId }, { merge: true })
                      setCategories(prev => prev.map(cat => cat.id === imageModal.categoryId ? { ...cat, imageId } : cat))
                    }
                    pushToast('Image saved', 'success')
                    setImageModal({ open: false, categoryId: null, itemIndex: null, itemName: '', preview: null, file: null, uploading: false, progress: 0, error: '', mode: 'item' })
                  } catch (e) {
                    console.error(e)
                    pushToast(e.message || 'Upload failed', 'error')
                    setImageModal(m => ({ ...m, uploading: false, error: e.message || 'Upload failed' }))
                  }
                }}
              >{imageModal.uploading ? <span className="flex items-center gap-2"><span className="loading loading-spinner loading-xs"/>Saving…</span> : 'Save image'}</button>
              <button className="btn btn-sm" disabled={imageModal.uploading} onClick={() => setImageModal({ open: false, categoryId: null, itemIndex: null, itemName: '', preview: null, file: null, uploading: false, progress: 0, error: '', mode: 'item' })}>Cancel</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => !imageModal.uploading && setImageModal({ open: false, categoryId: null, itemIndex: null, itemName: '', preview: null, file: null, uploading: false, progress: 0, error: '' })}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  )
}
