// Appearance — Store appearance and branding configuration
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { MdLocalOffer, MdOutlineAutoAwesome, MdDelete, MdDragIndicator, MdAdd } from 'react-icons/md'

import AdminLayout from '../layouts/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchAppearanceSettings, fetchMenuCategories, saveAppearanceSpotlight, saveCategoriesOrder, setMenuItems, fetchImagesByIdsCached, getImageDataUrl } from '../lib/data'

export default function Appearance() {
  const { canAccess } = useAuth()
  const hasPageAccess = canAccess('appearance')

  // ── State & refs ──
  const [categories, setCategories] = useState([])
  const [appearanceOrder, setAppearanceOrder] = useState([])
  const [originalAppearanceOrder, setOriginalAppearanceOrder] = useState([])
  const [appearanceLoading, setAppearanceLoading] = useState(false)
  const [appearanceSaving, setAppearanceSaving] = useState(false)
  const [rearrangeMode, setRearrangeMode] = useState(false)
  const [rearrangeFromIndex, setRearrangeFromIndex] = useState(null)
  const [spotlightDraft, setSpotlightDraft] = useState({ hotDeals: [], chefSpecials: [], hiddenHotDeals: false, hiddenChefSpecials: false, hiddenSpotlight: false })
  const [originalSpotlightDraft, setOriginalSpotlightDraft] = useState(null)
  const [spotlightForm, setSpotlightForm] = useState({
    hotDeals: { categoryId: '', itemName: '' },
    chefSpecials: { categoryId: '', itemName: '' }
  })
  const [spotlightSaving, setSpotlightSaving] = useState(false)
  const { pushToast } = useUI()
  const [openCats, setOpenCats] = useState(() => new Set())
  const headerRefs = useRef({})
  const [categoryImageMap, setCategoryImageMap] = useState({})
  const [itemImageMap, setItemImageMap] = useState({})
  const [spotlightDragItem, setSpotlightDragItem] = useState(null)
  const [spotlightDragOver, setSpotlightDragOver] = useState(null)
  const [categoryDragIndex, setCategoryDragIndex] = useState(null)
  const [categoryDropIndex, setCategoryDropIndex] = useState(null)

  const makeSpotlightId = useCallback(() => (
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `spot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  ), [])

  const categoryById = useMemo(() => {
    const map = new Map()
    categories.forEach(cat => { map.set(cat.id, cat) })
    return map
  }, [categories])

  const makeMatchKey = useCallback((categoryId, itemName) => {
    const cat = String(categoryId || '').trim().toLowerCase()
    const label = String(itemName || '').trim().toLowerCase()
    return cat && label ? `${cat}::${label}` : ''
  }, [])

  const menuMatchMap = useMemo(() => {
    const map = new Map()
    categories.forEach(cat => {
      if (Array.isArray(cat.items)) {
        cat.items.forEach(item => {
          const key = makeMatchKey(cat.id, item.name)
          if (key) map.set(key, { ...item, categoryId: cat.id })
        })
      }
    })
    return map
  }, [categories, makeMatchKey])

  // ── Side-effects ──
  // Fetch images for spotlight items
  useEffect(() => {
    const allItems = [...(spotlightDraft.hotDeals || []), ...(spotlightDraft.chefSpecials || [])]
    const imageIds = new Set()
    
    allItems.forEach(entry => {
      const key = makeMatchKey(entry.categoryId, entry.itemName)
      const item = menuMatchMap.get(key)
      if (item && item.imageId) imageIds.add(item.imageId)
    })

    const ids = Array.from(imageIds)
    if (!ids.length) return

    let active = true
    fetchImagesByIdsCached(ids).then(map => {
      if (!active) return
      const out = {}
      Object.entries(map).forEach(([id, d]) => {
        out[id] = getImageDataUrl(d)
      })
      setItemImageMap(prev => ({ ...prev, ...out }))
    }).catch(()=>{})
    return () => { active = false }
  }, [spotlightDraft, menuMatchMap, makeMatchKey])


  useEffect(() => { fetchMenuCategories().then(setCategories).catch(()=>{}) }, [])
  useEffect(() => {
    let active = true
    async function syncAppearance() {
      setAppearanceLoading(true)
      try {
        const settings = await fetchAppearanceSettings()
        const existing = settings.categoriesOrder || []
        const catIds = categories.map(c => c.id)
        const normalizedOrder = catIds.length === 0
          ? []
          : [...existing.filter(id => catIds.includes(id)), ...catIds.filter(id => !existing.includes(id))]
        const ensureList = (list) => (Array.isArray(list) ? list.map(entry => ({ ...entry, id: entry.id || makeSpotlightId() })) : [])
        const normalizedSpotlight = {
          hotDeals: ensureList(settings.spotlight?.hotDeals),
          chefSpecials: ensureList(settings.spotlight?.chefSpecials),
          hiddenHotDeals: !!settings.spotlight?.hiddenHotDeals,
          hiddenChefSpecials: !!settings.spotlight?.hiddenChefSpecials,
          hiddenSpotlight: !!settings.spotlight?.hiddenSpotlight
        }
        if (active) {
          setAppearanceOrder(normalizedOrder)
          setOriginalAppearanceOrder(normalizedOrder)
          setSpotlightDraft(normalizedSpotlight)
          setOriginalSpotlightDraft(normalizedSpotlight)
        }
      } finally { active && setAppearanceLoading(false) }
    }
    syncAppearance(); return () => { active = false }
  }, [categories, makeSpotlightId])

  useEffect(() => {
    const ids = categories.map(c => c.imageId).filter(Boolean)
    if (!ids.length) { setCategoryImageMap({}); return }
    let active = true
    
    // Use intersection observer for lazy loading if list is long, 
    // but for horizontal scroll of ~10 items, direct fetch is fine.
    // We'll stick to cached fetch which is already efficient.
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

  useEffect(() => {
    if (!categories.length) return
    setSpotlightForm(prev => {
      const resolveNext = (key) => {
        const base = prev[key] || { categoryId: '', itemName: '' }
        const hasCategory = base.categoryId && categories.some(c => c.id === base.categoryId)
        const categoryId = hasCategory ? base.categoryId : categories[0].id
        const cat = categories.find(c => c.id === categoryId)
        const items = Array.isArray(cat?.items) ? cat.items : []
        const hasItem = base.itemName && items.some(it => it?.name === base.itemName)
        return {
          categoryId,
          itemName: hasItem ? base.itemName : ''
        }
      }
      const nextHot = resolveNext('hotDeals')
      const nextChef = resolveNext('chefSpecials')
      if (
        nextHot.categoryId === (prev.hotDeals?.categoryId || '') &&
        nextHot.itemName === (prev.hotDeals?.itemName || '') &&
        nextChef.categoryId === (prev.chefSpecials?.categoryId || '') &&
        nextChef.itemName === (prev.chefSpecials?.itemName || '')
      ) {
        return prev
      }
      return {
        hotDeals: nextHot,
        chefSpecials: nextChef
      }
    })
  }, [categories])

  // ── Handlers ──
  function moveAppearanceAbove(from, to) {
    if (from === to) return
    setAppearanceOrder(o => {
      const next = [...o]
      const [item] = next.splice(from, 1)
      let insertIndex = to
      if (from < to) insertIndex = to - 1 // if pulling from above, target shifts left by one
      next.splice(insertIndex, 0, item)
      return next
    })
  }
  function removeAppearance(id) { setAppearanceOrder(o => o.filter(x => x !== id)) }
  function moveAppearanceByDelta(index, delta) {
    setAppearanceOrder((order) => {
      const to = index + delta
      if (to < 0 || to >= order.length) return order
      const next = [...order]
      const [item] = next.splice(index, 1)
      next.splice(to, 0, item)
      return next
    })
  }
  async function saveAppearance() { 
    setAppearanceSaving(true); 
    try { 
      await saveCategoriesOrder(appearanceOrder); 
      setOriginalAppearanceOrder(appearanceOrder);
      pushToast('Category order saved', 'success') 
    } catch (e) { 
      pushToast(e.message || 'Appearance save failed', 'error') 
    } finally { 
      setAppearanceSaving(false) 
    } 
  }
  function cancelAppearance() {
    setAppearanceOrder(originalAppearanceOrder)
    pushToast('Changes reverted', 'info')
  }

  function toggleCat(id, el) {
    const headerEl = el || headerRefs.current[id]
    const beforeTop = headerEl?.getBoundingClientRect?.().top
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    requestAnimationFrame(() => {
      const afterTop = headerEl?.getBoundingClientRect?.().top
      if (typeof beforeTop === 'number' && typeof afterTop === 'number') {
        window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: 'auto' })
      }
    })
  }

  function patchSpotlight(patch) {
    setSpotlightDraft(prev => ({ ...prev, ...patch }))
  }

  function addSpotlightItem(type) {
    const form = spotlightForm[type]
    if (!form.categoryId || !form.itemName) return
    
    const newItem = {
      id: makeSpotlightId(),
      categoryId: form.categoryId,
      itemName: form.itemName,
      label: '',
      badge: '',
      caption: ''
    }

    setSpotlightDraft(prev => ({
      ...prev,
      [type]: [newItem, ...(prev[type] || [])]
    }))

    // Reset form for this type
    setSpotlightForm(prev => ({
      ...prev,
      [type]: { ...prev[type], itemName: '' } // Keep category selected
    }))
  }

  function removeSpotlightItem(type, id) {
    setSpotlightDraft(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }))
  }

  function handleSpotlightDragStart(e, type, index) {
    setSpotlightDragItem({ type, index })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleSpotlightDragOver(e, type, index) {
    e.preventDefault()
    if (!spotlightDragItem || spotlightDragItem.type !== type) return
    setSpotlightDragOver({ type, index })
  }

  function handleSpotlightDrop(e, type, index) {
    e.preventDefault()
    if (!spotlightDragItem || spotlightDragItem.type !== type) return
    
    const list = [...spotlightDraft[type]]
    const [moved] = list.splice(spotlightDragItem.index, 1)
    list.splice(index, 0, moved)
    
    setSpotlightDraft(prev => ({ ...prev, [type]: list }))
    setSpotlightDragItem(null)
    setSpotlightDragOver(null)
  }

  function renderSpotlightPreview(type, title, icon, accentClass, iconWrapperClass) {
    const items = spotlightDraft[type] || []
    const isHidden = type === 'hotDeals' ? spotlightDraft.hiddenHotDeals : spotlightDraft.hiddenChefSpecials
    
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              className="toggle toggle-sm toggle-primary" 
              checked={!isHidden}
              onChange={(e) => patchSpotlight({ [type === 'hotDeals' ? 'hiddenHotDeals' : 'hiddenChefSpecials']: !e.target.checked })}
            />
            <span className="font-medium opacity-70">Show {title} Card</span>
          </div>
        </div>

        <div className={`rounded-2xl border border-base-300 bg-base-100/50 p-4 flex flex-col gap-3 ${isHidden ? 'opacity-50 grayscale' : ''}`}>
          <div className={`flex items-center gap-2 ${accentClass}`}>
            <span className={`w-9 h-9 rounded-xl grid place-items-center ${iconWrapperClass}`}>
              {icon}
            </span>
            <h3 className="font-semibold text-base">{title}</h3>
          </div>

          <ul className="space-y-3 min-h-[100px]">
            {items.length === 0 ? (
              <li className="text-sm opacity-50 text-center py-8 border-2 border-dashed border-base-300 rounded-xl">
                No items added yet
              </li>
            ) : (
              items.map((entry, index) => {
                const key = makeMatchKey(entry.categoryId, entry.itemName)
                const item = menuMatchMap.get(key)
                const imageUrl = item && item.imageId ? itemImageMap[item.imageId] : null
                const titleLabel = entry.label || item?.name || entry.itemName || 'Unknown Item'
                const captionLabel = entry.caption || (item ? `${categoryById.get(entry.categoryId)?.name || entry.categoryId}` : 'Item not found')
                const isDragging = spotlightDragItem?.type === type && spotlightDragItem?.index === index
                const isOver = spotlightDragOver?.type === type && spotlightDragOver?.index === index
                
                return (
                  <li 
                    key={entry.id}
                    draggable
                    onDragStart={(e) => handleSpotlightDragStart(e, type, index)}
                    onDragOver={(e) => handleSpotlightDragOver(e, type, index)}
                    onDragLeave={() => {
                      if (spotlightDragOver?.type === type && spotlightDragOver?.index === index) {
                        setSpotlightDragOver(null)
                      }
                    }}
                    onDrop={(e) => handleSpotlightDrop(e, type, index)}
                    className={`
                      relative group flex items-center gap-3 p-3 rounded-xl border 
                      ${isOver ? 'border-primary bg-primary/5 translate-y-2' : 'border-base-200 bg-base-100'} 
                      ${isDragging ? 'opacity-20' : 'opacity-100'}
                      transition-all cursor-move hover:border-primary/40 hover:shadow-sm
                    `}
                  >
                    {isOver && (
                      <div className="absolute -top-3 left-0 right-0 h-1 bg-primary rounded-full z-20 animate-pulse pointer-events-none" />
                    )}
                    <div className="cursor-grab active:cursor-grabbing text-base-content/30 hover:text-base-content/60">
                      <MdDragIndicator size={20} />
                    </div>
                    
                    <span className="w-12 h-12 rounded-lg overflow-hidden bg-base-200 grid place-items-center font-semibold text-base-content/40 shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={titleLabel} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        (titleLabel || '?').charAt(0)
                      )}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{titleLabel}</div>
                      <div className="text-xs opacity-60 truncate">{captionLabel}</div>
                    </div>

                    <button 
                      onClick={() => removeSpotlightItem(type, entry.id)}
                      className="btn btn-ghost btn-xs btn-square text-error opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove item"
                    >
                      <MdDelete size={16} />
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          {/* Add Item Form */}
          <div className="pt-3 border-t border-base-200 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <select 
                className="select select-bordered select-sm w-full"
                value={spotlightForm[type].categoryId}
                onChange={e => setSpotlightForm(prev => ({
                  ...prev,
                  [type]: { ...prev[type], categoryId: e.target.value, itemName: '' }
                }))}
              >
                <option value="" disabled>Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              
              <select 
                className="select select-bordered select-sm w-full"
                value={spotlightForm[type].itemName}
                disabled={!spotlightForm[type].categoryId}
                onChange={e => setSpotlightForm(prev => ({
                  ...prev,
                  [type]: { ...prev[type], itemName: e.target.value }
                }))}
              >
                <option value="" disabled>Select Item</option>
                {categories.find(c => c.id === spotlightForm[type].categoryId)?.items?.map((it, idx) => (
                  <option key={idx} value={it.name}>{it.name}</option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-sm btn-primary w-full"
              disabled={!spotlightForm[type].categoryId || !spotlightForm[type].itemName}
              onClick={() => addSpotlightItem(type)}
            >
              <MdAdd size={16} /> Add to {title}
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function saveSpotlight() {
    setSpotlightSaving(true)
    try {
      const saved = await saveAppearanceSpotlight(spotlightDraft)
      const normalized = {
        hotDeals: Array.isArray(saved.hotDeals) ? saved.hotDeals.map(entry => ({ ...entry, id: entry.id || makeSpotlightId() })) : [],
        chefSpecials: Array.isArray(saved.chefSpecials) ? saved.chefSpecials.map(entry => ({ ...entry, id: entry.id || makeSpotlightId() })) : [],
        hiddenHotDeals: !!saved.hiddenHotDeals,
        hiddenChefSpecials: !!saved.hiddenChefSpecials,
        hiddenSpotlight: !!saved.hiddenSpotlight
      }
      setSpotlightDraft(normalized)
      setOriginalSpotlightDraft(normalized)
      pushToast('Spotlight updated.', 'success')
    } catch (e) {
      pushToast(e.message || 'Failed to save spotlight.', 'error')
    } finally {
      setSpotlightSaving(false)
    }
  }

  function cancelSpotlight() {
    if (originalSpotlightDraft) {
      setSpotlightDraft(originalSpotlightDraft)
      pushToast('Spotlight changes reverted.', 'info')
    }
  }

  if (!hasPageAccess) {
    return <div className="p-8"><div className="alert alert-error">You don't have permission to access this page.</div></div>
  }

  return (
    <AdminLayout>
      <h2 className="text-3xl font-extrabold tracking-tight" style={{lineHeight:'1.1', color:'var(--color-base-content)'}}>
          Appearance
        </h2>
  <div className="collapse collapse-arrow admin-panel mb-6 overflow-hidden">
        <input type="checkbox" />
        <div className="collapse-title px-5 py-4 flex flex-col gap-1 cursor-pointer">
          <h3 className="font-semibold m-0">Category Order</h3>
          <p className="text-xs opacity-60 m-0">Rearrange how categories appear to customers.</p>
        </div>
        <div className="collapse-content px-5 pb-6 pt-0">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="toggle toggle-sm" checked={rearrangeMode} onChange={(e)=>{ setRearrangeMode(e.target.checked); setRearrangeFromIndex(null) }} />
              <span>Rearrange mode</span>
            </label>
            {rearrangeMode && <span className="text-xs opacity-70">Tap the first item, then the second item — the first will move just above the second.</span>}
          </div>
          {appearanceLoading && <div className="loading loading-spinner loading-sm" />}
          {!appearanceLoading && (
            <>
              {appearanceOrder.length === 0 && <div className="opacity-60 text-sm">No categories available.</div>}
              
              <div className="blend-panel strip-accent p-5 sm:p-6 md:p-7 relative border border-transparent overflow-hidden rounded-2xl bg-base-100/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {appearanceOrder.map((catId, idx) => {
                    const cat = categoryById.get(catId)
                    const selected = rearrangeMode && rearrangeFromIndex === idx
                    const imageUrl = cat?.imageId ? categoryImageMap[cat.imageId] : null
                    const isDropTarget = !rearrangeMode && categoryDropIndex === idx && categoryDragIndex !== null && categoryDragIndex !== idx

                    return (
                      <div
                        key={catId}
                        draggable={!rearrangeMode}
                        onDragStart={(e) => {
                          if (rearrangeMode) return
                          e.dataTransfer.setData('text/plain', String(idx))
                          e.dataTransfer.effectAllowed = 'move'
                          setCategoryDragIndex(idx)
                        }}
                        onDragOver={(e) => {
                          if (rearrangeMode) return
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          if (categoryDragIndex !== null && categoryDragIndex !== idx) setCategoryDropIndex(idx)
                        }}
                        onDragLeave={() => {
                          if (categoryDropIndex === idx) setCategoryDropIndex(null)
                        }}
                        onDrop={(e) => {
                          if (rearrangeMode) return
                          e.preventDefault()
                          const from = Number(e.dataTransfer.getData('text/plain'))
                          if (!Number.isNaN(from)) moveAppearanceAbove(from, idx)
                          setCategoryDragIndex(null)
                          setCategoryDropIndex(null)
                        }}
                        onDragEnd={() => {
                          setCategoryDragIndex(null)
                          setCategoryDropIndex(null)
                        }}
                        onClick={() => {
                          if (!rearrangeMode) return
                          if (rearrangeFromIndex === null) setRearrangeFromIndex(idx)
                          else if (rearrangeFromIndex === idx) setRearrangeFromIndex(null)
                          else {
                            moveAppearanceAbove(rearrangeFromIndex, idx)
                            setRearrangeFromIndex(null)
                          }
                        }}
                        className={`group relative rounded-xl border bg-base-100/80 p-3 transition-all ${rearrangeMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} ${selected ? 'ring-2 ring-primary border-primary' : 'border-base-300'} ${isDropTarget ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
                      >
                        {isDropTarget && <div className="absolute -top-1 left-4 right-4 h-1 rounded-full bg-primary" />}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <MdDragIndicator className="opacity-50 shrink-0" />
                            <div className="font-medium text-sm truncate">{cat?.name || catId}</div>
                          </div>
                          <button
                            className="btn btn-ghost btn-xs btn-circle text-error"
                            onClick={(e) => { e.stopPropagation(); removeAppearance(catId) }}
                            title="Remove"
                          >✕</button>
                        </div>

                        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-base-200 grid place-items-center">
                          {imageUrl ? (
                            <img src={imageUrl} alt={cat?.name || catId} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="text-3xl font-bold text-primary/70">{(cat?.name || catId || '?').charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="badge badge-outline badge-sm">#{idx + 1}</span>
                          <div className="join">
                            <button
                              className="btn btn-xs join-item"
                              disabled={idx === 0}
                              onClick={(e) => { e.stopPropagation(); moveAppearanceByDelta(idx, -1) }}
                            >↑</button>
                            <button
                              className="btn btn-xs join-item"
                              disabled={idx === appearanceOrder.length - 1}
                              onClick={(e) => { e.stopPropagation(); moveAppearanceByDelta(idx, 1) }}
                            >↓</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button className="btn btn-primary btn-sm" disabled={appearanceSaving} onClick={saveAppearance}>{appearanceSaving ? 'Saving...' : 'Save order'}</button>
                <button className="btn btn-ghost btn-sm" disabled={appearanceSaving} onClick={cancelAppearance}>Cancel</button>
              </div>
              <p className="mt-4 text-xs opacity-70 leading-relaxed space-y-1"><span className="block">Stored in <code>miscellaneous/appearance</code>. Order applied on next fetch.</span><span className="block">Use drag-and-drop or enable Rearrange mode to reorder.</span></p>
            </>
          )}
        </div>
      </div>

      {/* Item Visibility Management */}
  <div className="collapse collapse-arrow admin-panel mb-6 overflow-hidden">
        <input type="checkbox" />
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
                <div key={cat.id} className={`collapse collapse-arrow admin-panel ${open ? 'ring-1 ring-primary/20' : ''}`}>
                  <input type="checkbox" checked={open} onChange={() => toggleCat('vis-'+cat.id, headerRefs.current['vis-'+cat.id])} />
                  <div className="collapse-title text-sm font-medium flex items-center gap-2" ref={(el)=>{ if (el) headerRefs.current['vis-'+cat.id] = el }}>
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
                            <div key={idx} className={`group relative p-3 rounded-lg admin-surface-alt text-xs flex flex-col gap-2 transition ${inactive ? 'border-error/40 bg-error/5 opacity-70' : ''} hover:border-primary/50`}>
                              <div className="flex-1 min-h-[34px] font-medium leading-snug truncate" title={it.name}>{it.name}</div>
                              <div className="flex items-center justify-between text-[10px] opacity-70">
                                <span>{it.veg === false ? 'Non-Veg' : 'Veg'}</span>
                                  {it.rate !== undefined && <span>₹{it.rate}</span>}
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
                              if (target) { await setMenuItems(cat.id, target.items.map(it => ({ ...it, active: true }))) }
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
                              if (target) { await setMenuItems(cat.id, target.items.map(it => ({ ...it, active: false }))) }
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

      {/* Spotlight Picks Management */}
  <div className="collapse collapse-arrow admin-panel mb-6 overflow-hidden">
        <input type="checkbox" />
        <div className="collapse-title px-5 py-4 flex flex-col gap-1 cursor-pointer">
          <h3 className="font-semibold m-0">Spotlight Picks</h3>
          <p className="text-xs opacity-60 m-0 leading-relaxed">Control the dishes that appear under Spotlight on the customer home page.</p>
        </div>
        <div className="collapse-content px-5 pb-6 pt-0">
          {/* Parent Visibility Toggle (inside accordion) */}
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="text-xs opacity-60">Turn the entire Spotlight section on or off for customers.</div>
            <label className="flex items-center gap-2 text-xs select-none">
              <input
                type="checkbox"
                className="toggle toggle-xs"
                checked={!!spotlightDraft.hiddenSpotlight}
                onChange={(e) => {
                  const hidden = e.target.checked
                  patchSpotlight({
                    hiddenSpotlight: hidden,
                    hiddenHotDeals: hidden ? true : false,
                    hiddenChefSpecials: hidden ? true : false,
                  })
                }}
              />
              <span>{spotlightDraft.hiddenSpotlight ? 'Hidden on home page' : 'Visible on home page'}</span>
            </label>
          </div>
          <div className="divider my-0"></div>
          
          {categories.length === 0 ? (
            <div className="opacity-60 text-sm">Load categories to curate spotlight dishes.</div>
          ) : (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {renderSpotlightPreview(
                  'hotDeals', 
                  'Hot deals', 
                  <MdLocalOffer size={20} />, 
                  'text-warning', 
                  'bg-warning/10 text-warning'
                )}
                
                {renderSpotlightPreview(
                  'chefSpecials', 
                  'Chef specials', 
                  <MdOutlineAutoAwesome size={20} />, 
                  'text-secondary', 
                  'bg-secondary/10 text-secondary'
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-base-200">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={saveSpotlight}
                  disabled={spotlightSaving}
                >{spotlightSaving ? 'Saving...' : 'Save spotlight'}</button>
                <button 
                  className="btn btn-ghost btn-sm" 
                  disabled={spotlightSaving} 
                  onClick={cancelSpotlight}
                >Cancel</button>
                <span className="text-xs opacity-60 ml-2">Changes sync to `miscellaneous/appearance.spotlight`.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
