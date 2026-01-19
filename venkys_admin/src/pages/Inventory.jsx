import { useEffect, useRef, useState } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import { fetchMenuCategories, upsertMenuCategory, addMenuItems, setMenuItems, renameMenuCategory, removeMenuItem, fetchImagesByIds, saveBase64Image, deleteImageById, removeCategoryImage, fetchRawMaterials } from '../lib/data'
import { MdDelete, MdAdd, MdKeyboardArrowDown, MdWarningAmber, MdEdit } from 'react-icons/md'
import { useUI } from '../context/UIContext'

export default function Inventory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [categories, setCategories] = useState([])
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkAspect, setBulkAspect] = useState('pricing')
  const [bulkDraft, setBulkDraft] = useState({})
  const [bulkSaving, setBulkSaving] = useState(false)
  const [rawMaterials, setRawMaterials] = useState([])
  const [newCats, setNewCats] = useState([{ name: '' }])
  const [newItems, setNewItems] = useState([{ category: '', name: '', price: '', veg: true }])
  const [editingCat, setEditingCat] = useState({ id: null, name: '' })
  const [openCats, setOpenCats] = useState(() => new Set())
  const [catImages, setCatImages] = useState({})
  const [, setImageModal] = useState({ open: false, categoryId: null, itemIndex: null, itemName: '', preview: null, file: null, uploading: false, progress: 0, error: '', mode: 'item' })
  const [editModal, setEditModal] = useState({
    open: false,
    activeTab: 'pricing',
    categoryId: null,
    itemIndex: null,
    data: {
      name: '',
      desc: '',
      veg: true,
      mrp: '',
      rate: '',
      discountPercent: '',
      hasVariants: false,
      variants: [],
      components: [],
      ingredients: [], // { materialId, quantity, unit }
      isCustom: false,
      imageId: null
    },
    imageFile: null,
    imagePreview: null,
    imageUploading: false,
    imageProgress: 0,
    imageError: '',
    saving: false,
    error: ''
  })
  const headerRefs = useRef({})
  const { confirm, pushToast } = useUI()

  useEffect(() => {
    if (error) {
      pushToast(error, 'error')
      setError('')
    }
  }, [error, pushToast])

  useEffect(() => {
    if (info) {
      pushToast(info, 'success')
      setInfo('')
    }
  }, [info, pushToast])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      fetchMenuCategories(),
      fetchRawMaterials()
    ]).then(([cats, materials]) => { 
      if (mounted) {
        setCategories(cats)
        setRawMaterials(materials)
      }
    }).catch(e => setError(e.message || 'Failed to load data')).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const catIds = categories.map(c => c.imageId).filter(Boolean)
    const itemIds = categories.flatMap(c => (Array.isArray(c.items) ? c.items : []).map(it => it.imageId).filter(Boolean))
    const ids = Array.from(new Set([...catIds, ...itemIds]))
    if (!ids.length) { setCatImages({}); return }
    let active = true
    fetchImagesByIds(ids).then(map => { if (!active) return; const out = {}; Object.entries(map).forEach(([id, d]) => { out[id] = `data:${d.mime || 'image/*'};base64,${d.data}` }); setCatImages(out) }).catch(()=>{})
    return () => { active = false }
  }, [categories])

  function bulkKey(categoryId, itemIndex) {
    return `${categoryId}::${itemIndex}`
  }

  useEffect(() => {
    if (!bulkEditModalOpen || !bulkCategory) return
    const c = categories.find(cat => cat.id === bulkCategory)
    if (!c) return
    const next = {}
    const items = Array.isArray(c.items) ? c.items : []
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx]
      const mrpNumber = parseAmount(it.mrp ?? it.MRP ?? '')
      const rateNumber = parseAmount(it.rate ?? it.price ?? '')
      const explicitDiscount = it.discountPercent !== undefined && it.discountPercent !== null ? parsePercent(it.discountPercent) : null
      const derivedDiscount = explicitDiscount !== null ? explicitDiscount : computeDiscountPercent(mrpNumber ?? undefined, rateNumber ?? undefined)
      next[bulkKey(c.id, idx)] = {
        categoryId: c.id,
        itemIndex: idx,
        name: it.name || '',
        desc: it.desc || it.description || '',
        mrp: mrpNumber !== null ? formatAmount(mrpNumber) : '',
        rate: rateNumber !== null ? formatAmount(rateNumber) : '',
        discountPercent: derivedDiscount !== null && derivedDiscount > 0 ? formatPercent(derivedDiscount) : '',
        veg: it.veg !== false,
        active: it.active !== false,
        imageId: it.imageId || null,
        isCustom: !!it.isCustom,
      }
    }
    setBulkDraft(next)
  }, [bulkEditModalOpen, bulkCategory])

  function parseAmount(value) {
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    if (!Number.isFinite(num) || num < 0) return null
    return Math.round(num * 100) / 100
  }

  function parsePercent(value) {
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    if (!Number.isFinite(num)) return null
    const clamped = Math.max(0, Math.min(100, num))
    return Math.round(clamped * 10) / 10
  }

  function formatAmount(value) {
    if (value === null || value === undefined || value === '') return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return ''
    const rounded = Math.round(num * 100) / 100
    const fixed = rounded.toFixed(2)
    return fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  }

  function formatPercent(value) {
    if (value === null || value === undefined || value === '') return ''
    const num = Number(value)
    if (!Number.isFinite(num)) return ''
    const rounded = Math.round(num * 10) / 10
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '')
  }

  function computeDiscountPercent(mrp, rate) {
    if (!Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(rate) || rate < 0) return null
    const raw = ((mrp - rate) / mrp) * 100
    if (!Number.isFinite(raw) || raw < 0) return null
    const clamped = Math.max(0, Math.min(100, raw))
    return Math.round(clamped * 10) / 10
  }

  function recomputePricing(form, changedField) {
    const mrpNumber = parseAmount(form.mrp)
    const rateNumber = parseAmount(form.rate)
    const discountNumberRaw = parsePercent(form.discountPercent)
    const discountNormalized = discountNumberRaw !== null ? Math.min(99.9, discountNumberRaw) : null

    if (changedField === 'discountPercent') {
      if (form.discountPercent === '' || discountNumberRaw === null) {
        return { ...form, discountPercent: '' }
      }
      if (rateNumber !== null && rateNumber > 0) {
        const denominator = 1 - discountNormalized / 100
        if (denominator <= 0) {
          return { ...form, discountPercent: formatPercent(discountNormalized) }
        }
        const nextMrp = Math.max(rateNumber, Math.round(rateNumber / denominator))
        return {
          ...form,
          discountPercent: formatPercent(discountNormalized),
          mrp: formatAmount(nextMrp),
        }
      }
      return { ...form, discountPercent: formatPercent(discountNormalized) }
    }

    if (changedField === 'rate') {
      const formattedRate = rateNumber !== null ? formatAmount(rateNumber) : ''
      let nextMrp = mrpNumber !== null ? formatAmount(mrpNumber) : ''
      let nextDiscount = discountNormalized !== null ? formatPercent(discountNormalized) : ''
      if (rateNumber !== null && rateNumber > 0) {
        if (discountNormalized !== null && discountNormalized > 0) {
          const denominator = 1 - discountNormalized / 100
          if (denominator > 0) {
            const calcMrp = Math.max(rateNumber, Math.round(rateNumber / denominator))
            nextMrp = formatAmount(calcMrp)
            nextDiscount = formatPercent(discountNormalized)
          }
        } else if (mrpNumber !== null && mrpNumber > 0) {
          const derived = computeDiscountPercent(mrpNumber, rateNumber)
          nextDiscount = derived !== null && derived > 0 ? formatPercent(derived) : ''
          nextMrp = formatAmount(mrpNumber)
        } else {
          nextMrp = ''
          nextDiscount = ''
        }
      } else {
        nextMrp = mrpNumber !== null ? formatAmount(mrpNumber) : ''
        nextDiscount = discountNormalized !== null && discountNormalized > 0 ? formatPercent(discountNormalized) : ''
      }
      return {
        ...form,
        rate: formattedRate,
        mrp: nextMrp,
        discountPercent: nextDiscount,
      }
    }

    if (changedField === 'mrp') {
      const formattedMrp = mrpNumber !== null ? formatAmount(mrpNumber) : ''
      let nextDiscount = ''
      if (mrpNumber !== null && rateNumber !== null && rateNumber > 0) {
        const derived = computeDiscountPercent(mrpNumber, rateNumber)
        nextDiscount = derived !== null && derived > 0 ? formatPercent(derived) : ''
      } else if (discountNormalized !== null && discountNormalized > 0) {
        nextDiscount = formatPercent(discountNormalized)
      }
      return {
        ...form,
        mrp: formattedMrp,
        discountPercent: nextDiscount,
      }
    }

    return form
  }

  function openEditModal(categoryId, itemIndex) {
    const cat = categories.find(c => c.id === categoryId)
    if (!cat) return
    const item = cat.items[itemIndex]
    
    const mrpNumber = parseAmount(item.mrp ?? item.MRP ?? '')
    const rateNumber = parseAmount(item.rate ?? item.price ?? '')
    const discountNumber = item.discountPercent !== undefined && item.discountPercent !== null
      ? parsePercent(item.discountPercent)
      : computeDiscountPercent(mrpNumber ?? undefined, rateNumber ?? undefined)

    const variants = Array.isArray(item.variants) ? item.variants.map(v => ({
      name: v.name || '',
      mrp: v.mrp ? formatAmount(v.mrp) : '',
      rate: v.rate ? formatAmount(v.rate) : '',
      discountPercent: v.discountPercent ? formatPercent(v.discountPercent) : '',
      additionalDiscounts: Array.isArray(v.additionalDiscounts) ? v.additionalDiscounts.map(d => String(d)) : ['', '']
    })) : []

    const components = Array.isArray(item.components) ? item.components.map(c => ({
      qty: String(c.qty || ''),
      unit: String(c.unit || ''),
      text: String(c.text || '')
    })) : [{ qty: '', unit: '', text: '' }]

    setEditModal({
      open: true,
      activeTab: 'pricing',
      categoryId,
      itemIndex,
      data: {
        name: item.name || '',
        desc: item.desc || item.description || '',
        veg: item.veg !== false,
        mrp: mrpNumber !== null ? formatAmount(mrpNumber) : '',
        rate: rateNumber !== null ? formatAmount(rateNumber) : '',
        discountPercent: discountNumber !== null ? formatPercent(discountNumber) : '',
        hasVariants: variants.length > 0,
        variants: variants.length > 0 ? variants : [{ name: '', mrp: '', rate: '', discountPercent: '', additionalDiscounts: ['', ''] }],
        components: components.length ? components : [{ qty: '', unit: '', text: '' }],
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        isCustom: !!item.isCustom,
        imageId: item.imageId
      },
      imageFile: null,
      imagePreview: null,
      imageUploading: false,
      imageProgress: 0,
      imageError: '',
      saving: false,
      error: ''
    })
  }

  function closeEditModal() {
    setEditModal(prev => ({ ...prev, open: false }))
  }

  function updateEditData(field, value) {
    setEditModal(prev => {
      const base = { ...prev.data, [field]: value }
      // Recompute pricing if needed (only for standard pricing mode)
      if (!base.hasVariants && (field === 'mrp' || field === 'rate' || field === 'discountPercent')) {
        const recomputed = recomputePricing(base, field)
        return { ...prev, data: recomputed }
      }
      return { ...prev, data: base }
    })
  }

  function displayCategory(c) { return c?.id || c?.name || '' }
  function toggleCat(id, el) {
    const headerEl = el || headerRefs.current[id]
    const beforeTop = headerEl?.getBoundingClientRect?.().top
    // Allow only one accordion open at a time (like the older accordions)
    setOpenCats(prev => {
      const isOpening = !prev.has(id)
      const next = new Set()
      if (isOpening) next.add(id) // open only the clicked one
      return next // if closing, keep all closed
    })
    requestAnimationFrame(() => {
      const afterTop = headerEl?.getBoundingClientRect?.().top
      if (typeof beforeTop === 'number' && typeof afterTop === 'number') {
        window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: 'auto' })
      }
    })
  }

  async function saveCategories() {
    setError(''); setInfo(''); setLoading(true)
    try {
      for (const r of newCats) { if (!r.name || !r.name.trim()) continue; await upsertMenuCategory(r.name.trim()) }
      setNewCats([{ name: '' }])
      const cats = await fetchMenuCategories(); setCategories(cats); setInfo('Categories saved.')
    } catch (e) { setError(e.message || 'Save failed') } finally { setLoading(false) }
  }
  async function saveItems() {
    setError(''); setInfo(''); setLoading(true)
    try {
      const grouped = new Map()
      for (const r of newItems) {
        const name = r.name?.trim()
        const catName = r.category?.trim()
        if (!name || !catName) continue
        const arr = grouped.get(catName) || []
        const rate = Number(r.price) || 0
        arr.push({ name, price: rate, rate, veg: r.veg !== false })
        grouped.set(catName, arr)
      }
      for (const [catName, items] of grouped.entries()) { await upsertMenuCategory(catName); await addMenuItems(catName, items) }
      setNewItems([{ category: '', name: '', price: '', veg: true }])
      const cats = await fetchMenuCategories(); setCategories(cats); setInfo('Items saved.')
    } catch (e) { setError(e.message || 'Save failed') } finally { setLoading(false) }
  }

  return (
  <AdminLayout>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-3xl font-extrabold tracking-tight" style={{lineHeight:'1.1', color:'var(--color-base-content)'}}>
      Inventory
    </h2>
    <button
      type="button"
      className="btn btn-sm btn-outline gap-2"
      onClick={() => {
        setError(''); setInfo('')
        setBulkCategory(categories.length > 0 ? categories[0].id : '')
        setBulkAspect('pricing')
        setBulkEditModalOpen(true)
      }}
      disabled={categories.length === 0}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      Bulk edit
    </button>
  </div>


  {/* Quick add rows */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm p-5 flex flex-col gap-4 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Quick add categories</h2>
          <div className="flex flex-wrap items-center gap-3 w-full">
            {newCats.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input className="input input-sm input-bordered w-48" placeholder="Category name" value={row.name} onChange={(e) => { const v = [...newCats]; v[idx] = { ...v[idx], name: e.target.value }; setNewCats(v) }} />
                {idx === newCats.length - 1 && (
                  <button className="btn btn-ghost btn-sm px-1 min-h-0 h-auto hover:bg-base-200/70 transition" title="Add category" onClick={() => setNewCats((v) => [...v, { name: '' }])}>
                    <MdAdd className="w-8 h-8 text-black" />
                  </button>
                )}
                {newCats.length > 1 && (
                  <button className="btn btn-xs btn-ghost text-lg" title="Remove" onClick={() => setNewCats((v) => v.filter((_, i) => i !== idx))}>×</button>
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
              <select className="select select-bordered select-sm w-40" value={row.category} onChange={(e) => { const v = [...newItems]; v[idx] = { ...v[idx], category: e.target.value }; setNewItems(v) }}>
                <option value="" disabled hidden>Category</option>
                {categories.map((c) => (<option key={c.id} value={displayCategory(c)}>{displayCategory(c)}</option>))}
              </select>
              <input className="input input-bordered input-sm w-52" placeholder="Item name" value={row.name} onChange={(e) => { const v = [...newItems]; v[idx] = { ...v[idx], name: e.target.value }; setNewItems(v) }} />
              <input type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" className="input input-bordered input-sm w-28" placeholder="Price" value={row.price} onChange={(e) => { const v = [...newItems]; v[idx] = { ...v[idx], price: e.target.value }; setNewItems(v) }} onWheel={(e) => e.currentTarget.blur()} />
              <div className="join">
                <button type="button" className={`btn btn-xs join-item ${row.veg ? 'btn-success' : 'btn-ghost'}`} onClick={() => { const v = [...newItems]; v[idx] = { ...v[idx], veg: true }; setNewItems(v) }}>Veg</button>
                <button type="button" className={`btn btn-xs join-item ${!row.veg ? 'btn-error' : 'btn-ghost'}`} onClick={() => { const v = [...newItems]; v[idx] = { ...v[idx], veg: false }; setNewItems(v) }}>Non-Veg</button>
              </div>
              {idx === newItems.length - 1 && (
                <button className="btn btn-ghost btn-sm px-1 min-h-0 h-auto hover:bg-base-200/70 transition" title="Add item" onClick={() => setNewItems((v) => [...v, { category: '', name: '', price: '', veg: true }])}>
                  <MdAdd className="w-8 h-8 text-black" />
                </button>
              )}
              {newItems.length > 1 && (<button className="btn btn-xs btn-ghost text-lg" title="Remove" onClick={() => setNewItems((v) => v.filter((_, i) => i !== idx))}>×</button>)}
              {idx === newItems.length - 1 && (
                <div className="ml-auto">
                  <button className="btn btn-primary btn-sm" onClick={saveItems} disabled={loading || newItems.some(r => r.veg === undefined)} title={newItems.some(r => r.veg === undefined) ? 'Select Veg / Non-Veg for all rows' : 'Save items'}>Save items</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current menu */}
      <div className="mt-10 space-y-3">
        <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
          <h2 className="text-xl font-semibold">Current menu</h2>
        </div>
        {categories.length === 0 && (<div className="opacity-60 text-sm">No categories yet.</div>)}
        {categories.map(c => {
          const items = Array.isArray(c.items) ? c.items : []
          const catIsEditing = editingCat.id === c.id
          const open = openCats.has(c.id)
          const hasPricingGap = items.some(it => {
            const mrpNumber = parseAmount(it.mrp ?? it.MRP ?? '')
            const rateNumber = parseAmount(it.rate ?? it.price ?? '')
            return mrpNumber === null || mrpNumber <= 0 || rateNumber === null || rateNumber <= 0
          })
          return (
            <div key={c.id} className={`collapse bg-base-100/70 backdrop-blur-sm border border-base-300/60 rounded-xl transition-all duration-300 group relative ${open ? 'ring-1 ring-primary/30 shadow-sm' : 'hover:border-base-300 hover:bg-base-100/50'}`}>
              <input type="checkbox" className="sr-only" checked={open} onChange={() => toggleCat(c.id, headerRefs.current[c.id])} />
              {open && <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/70 via-primary/30 to-secondary/60" />}
              <div className="collapse-title py-3 pr-4 pl-5 flex items-center justify-between gap-4 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl" role="button" tabIndex={0} ref={(el) => { if (el) headerRefs.current[c.id] = el }} onClick={() => toggleCat(c.id, headerRefs.current[c.id])}>
                <div className="flex items-center gap-3 min-w-0">
                  {c.imageId && catImages[c.imageId] && (<img src={catImages[c.imageId]} alt="" className="w-8 h-8 rounded object-cover border border-base-300/60" />)}
                  {catIsEditing ? (
                    <div className="flex items-center gap-2">
                      <input className="input input-bordered input-xs" value={editingCat.name} onClick={e => e.stopPropagation()} onChange={(e) => setEditingCat(s => ({ ...s, name: e.target.value }))} />
                      <div className="join">
                        <button className="btn btn-success btn-xs join-item" onClick={async (e) => { e.stopPropagation(); try { await renameMenuCategory(c.id, editingCat.name.trim()); const cats = await fetchMenuCategories(); setCategories(cats); setEditingCat({ id: null, name: '' }) } catch (e) { setError(e.message || 'Rename failed') } }}>✓</button>
                        <button className="btn btn-error btn-xs join-item" onClick={(e) => { e.stopPropagation(); setEditingCat({ id: null, name: '' }) }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full border border-base-300/70 bg-base-100 shadow-sm text-sm font-medium tracking-tight text-base-content/90">
                        {displayCategory(c)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs gap-1 text-base-content/70 hover:text-base-content"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingCat({ id: c.id, name: displayCategory(c) })
                        }}
                        title="Edit category name"
                      >
                        <MdEdit className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </div>
                  )}
                  {hasPricingGap && (
                    <span className="tooltip tooltip-warning ml-1 overflow-visible" data-tip="Some items need Rate and MRP">
                      <MdWarningAmber className="w-4 h-4 text-warning" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 text-xs rounded-full border transition-colors ${open ? 'bg-primary/10 border-primary/40 text-primary-content/80' : 'bg-base-200/70 border-base-300/60'}`}>{items.length} item{items.length !== 1 && 's'}</span>
                  <MdKeyboardArrowDown className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180 text-primary' : 'text-base-content/50'}`} />
                </div>
              </div>
              <div className="collapse-content pt-0">
                <div className={`${open ? 'overflow-visible max-h-none' : 'overflow-hidden max-h-0'} transition-[max-height] duration-300 ease-in-out`}>
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
                            >{c.imageId ? 'Update image' : '(add image)'}</button>
                            {c.imageId && (
                              <button
                                type="button"
                                className="btn btn-xs btn-ghost text-error"
                                onClick={() => {
                                  confirm({
                                    message: `Delete category image for "${displayCategory(c)}"? This will permanently remove it from storage.`,
                                    onConfirm: async () => {
                                      try {
                                        const res = await removeCategoryImage(c.id)
                                        if (!res.ok) throw new Error(res.error || 'Failed to remove category image')
                                        // Update local state
                                        setCategories(prev => prev.map(ct => ct.id === c.id ? { ...ct, imageId: undefined } : ct))
                                        pushToast('Category image removed.', 'info')
                                      } catch (er) {
                                        setError(er.message || 'Failed to remove image')
                                      }
                                    }
                                  })
                                }}
                              >Delete</button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {items.length === 0 && (<div className="opacity-50 text-sm italic pt-2">No items in this category.</div>)}
                    {items.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-base-300/60 mt-2">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th className="w-1/3">Item</th>
                              <th className="w-24 text-right">MRP</th>
                              <th className="w-24 text-right">Rate</th>
                              <th className="w-20 text-right">Discount</th>
                              <th className="w-16 text-center">Type</th>
                              <th className="w-24 text-center">Image</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it, idx) => {
                              const key = `${c.id}:${idx}`
                              const hasImg = !!it.imageId
                              const imgSrc = hasImg && catImages[it.imageId] ? catImages[it.imageId] : null
                              const mrpNumber = parseAmount(it.mrp ?? it.MRP ?? '')
                              const rateNumber = parseAmount(it.rate ?? it.price ?? '')
                              const explicitDiscount = it.discountPercent !== undefined && it.discountPercent !== null ? parsePercent(it.discountPercent) : null
                              const derivedDiscount = explicitDiscount !== null ? explicitDiscount : computeDiscountPercent(mrpNumber ?? undefined, rateNumber ?? undefined)
                              const discountDisplay = derivedDiscount !== null && derivedDiscount > 0 ? `${formatPercent(derivedDiscount)}%` : ''
                              const mrpDisplay = mrpNumber !== null && mrpNumber > 0 ? `₹${formatAmount(mrpNumber)}` : ''
                              const rateDisplay = rateNumber !== null ? `₹${formatAmount(rateNumber)}` : ''
                              const needsPricingAttention = mrpNumber === null || mrpNumber <= 0 || rateNumber === null || rateNumber <= 0
                              return (
                                <tr key={key}>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      {imgSrc ? (
                                        <img src={imgSrc} alt="" className="w-8 h-8 rounded object-cover border border-base-300/60" />
                                      ) : (
                                        <div className="w-8 h-8 rounded border border-dashed border-base-300/60 grid place-items-center text-[9px] opacity-50">—</div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          className="truncate text-left font-medium text-primary hover:underline"
                                          title="Edit item"
                                          onClick={() => openEditModal(c.id, idx)}
                                        >{it.name}</button>
                                        <span className={`badge badge-ghost badge-xs ${it.isCustom ? 'text-warning' : 'text-success'}`}>{it.isCustom ? 'Custom' : 'Std'}</span>
                                        {needsPricingAttention && (
                                          <span className="tooltip tooltip-warning ml-1" data-tip="Please fill in Rate and MRP">
                                            <MdWarningAmber className="w-4 h-4 text-warning" />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-right text-sm tabular-nums">{mrpDisplay || '—'}</td>
                                  <td className="text-right text-sm tabular-nums">{rateDisplay || '—'}</td>
                                  <td className="text-right text-xs tabular-nums">{discountDisplay || '—'}</td>
                                  <td className="text-center">
                                    {it.veg !== false ? (
                                      <span className="inline-flex items-center justify-center w-5 h-5" aria-label="Vegetarian" title="Vegetarian"><span className="w-3.5 h-3.5 rounded-sm border-2 border-green-600 relative"><span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-green-600" /></span></span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-5 h-5" aria-label="Non-Vegetarian" title="Non-Vegetarian"><span className="w-3.5 h-3.5 rounded-sm border-2 border-rose-600 relative"><span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-rose-600" /></span></span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {hasImg ? (
                                      <span className="text-xs text-success">✓</span>
                                    ) : (
                                      <span className="text-xs opacity-30">—</span>
                                    )}
                                  </td>
                                  {/* Actions column removed as requested */}
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
      {editModal.open && (
        <dialog open className="modal modal-open backdrop-blur-sm">
          <div className="modal-box max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between bg-base-100 z-10">
              <div>
                <h3 className="font-bold text-xl text-base-content">Edit {editModal.data.name}</h3>
                <p className="text-xs text-base-content/50 mt-0.5">Update item details, pricing, and composition</p>
              </div>
              <button className="btn btn-sm btn-circle btn-ghost hover:bg-base-200" onClick={closeEditModal}>✕</button>
            </div>
            
            {/* Tabs */}
            <div className="px-6 pt-2 bg-base-100 shrink-0 border-b border-base-200">
              <div className="tabs tabs-bordered -mb-px">
                {['pricing', 'details', 'composition', 'stock', 'image'].map(tab => (
                  <a 
                    key={tab}
                    className={`tab tab-lg px-6 pb-3 transition-all duration-200 ${editModal.activeTab === tab ? 'tab-active font-semibold border-primary text-primary' : 'text-base-content/60 hover:text-base-content'}`}
                    onClick={() => setEditModal(p => ({ ...p, activeTab: tab }))}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </a>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-base-50/50">
              {editModal.activeTab === 'stock' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <div className="bg-base-100 border border-base-200 rounded-xl p-4 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base">Recipe / Ingredients</h4>
                      <span className="text-xs opacity-60">Link raw materials to deduct stock automatically.</span>
                    </div>
                    
                    {(!editModal.data.ingredients || editModal.data.ingredients.length === 0) && (
                      <div className="text-center py-8 opacity-50 text-sm border-2 border-dashed border-base-200 rounded-lg">
                        No ingredients linked.
                      </div>
                    )}

                    <div className="space-y-3">
                      {(editModal.data.ingredients || []).map((ing, idx) => {
                        const material = rawMaterials.find(m => m.id === ing.materialId)
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-base-50 rounded-lg border border-base-200">
                            <select 
                              className="select select-bordered select-sm flex-1"
                              value={ing.materialId}
                              onChange={e => {
                                const val = e.target.value
                                setEditModal(prev => {
                                  const next = [...(prev.data.ingredients || [])]
                                  next[idx] = { ...next[idx], materialId: val }
                                  return { ...prev, data: { ...prev.data, ingredients: next } }
                                })
                              }}
                            >
                              <option value="">Select Material</option>
                              {rawMaterials.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                              ))}
                            </select>
                            <input 
                              type="number" 
                              step="0.01"
                              className="input input-bordered input-sm w-24"
                              placeholder="Qty"
                              value={ing.quantity}
                              onChange={e => {
                                const val = e.target.value
                                setEditModal(prev => {
                                  const next = [...(prev.data.ingredients || [])]
                                  next[idx] = { ...next[idx], quantity: val }
                                  return { ...prev, data: { ...prev.data, ingredients: next } }
                                })
                              }}
                            />
                            <span className="text-xs opacity-60 w-8">{material?.unit || '-'}</span>
                            <button 
                              className="btn btn-ghost btn-sm btn-square text-error"
                              onClick={() => {
                                setEditModal(prev => ({
                                  ...prev,
                                  data: { ...prev.data, ingredients: prev.data.ingredients.filter((_, i) => i !== idx) }
                                }))
                              }}
                            >✕</button>
                          </div>
                        )
                      })}
                    </div>

                    <button 
                      className="btn btn-outline btn-sm w-full border-dashed"
                      onClick={() => {
                        setEditModal(prev => ({
                          ...prev,
                          data: { 
                            ...prev.data, 
                            ingredients: [...(prev.data.ingredients || []), { materialId: '', quantity: '' }] 
                          }
                        }))
                      }}
                    >
                      + Add Ingredient
                    </button>
                  </div>
                </div>
              )}

              {editModal.activeTab === 'details' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <div className="bg-base-100 border border-base-200 rounded-xl p-5 shadow-sm space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 form-control w-full">
                        <label className="label py-1">
                          <span className="label-text font-medium">Item Name</span>
                        </label>
                        <input
                          className="input input-bordered w-full focus:input-primary transition-all"
                          value={editModal.data.name}
                          onChange={(e) => updateEditData('name', e.target.value)}
                          placeholder="e.g. Chicken Biryani"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-medium">Dietary Type</span>
                        </label>
                        <div className="join w-full grid grid-cols-2">
                          <button 
                            type="button" 
                            className={`btn join-item ${editModal.data.veg ? 'btn-success text-white' : 'btn-outline border-base-300 text-base-content/60 hover:bg-base-100'}`} 
                            onClick={() => updateEditData('veg', true)}
                          >Veg</button>
                          <button 
                            type="button" 
                            className={`btn join-item ${!editModal.data.veg ? 'btn-error text-white' : 'btn-outline border-base-300 text-base-content/60 hover:bg-base-100'}`} 
                            onClick={() => updateEditData('veg', false)}
                          >Non-Veg</button>
                        </div>
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-medium">Description</span>
                        <span className="label-text-alt opacity-60">Optional</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered min-h-32 focus:textarea-primary transition-all resize-none"
                        value={editModal.data.desc}
                        onChange={(e) => updateEditData('desc', e.target.value)}
                        placeholder="Describe the dish, ingredients, and taste profile..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {editModal.activeTab === 'pricing' && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl border border-base-200 shadow-sm">
                    <div>
                      <h4 className="font-semibold text-base-content">Pricing Strategy</h4>
                      <p className="text-xs text-base-content/60 mt-1">Choose between simple pricing or multiple variants</p>
                    </div>
                    <label className="cursor-pointer flex items-center gap-3">
                      <span className={`text-sm font-medium ${!editModal.data.hasVariants ? 'text-primary' : 'text-base-content/50'}`}>Simple</span>
                      <input 
                        type="checkbox" 
                        className="toggle toggle-primary" 
                        checked={editModal.data.hasVariants} 
                        onChange={(e) => updateEditData('hasVariants', e.target.checked)} 
                      />
                      <span className={`text-sm font-medium ${editModal.data.hasVariants ? 'text-primary' : 'text-base-content/50'}`}>Variants</span>
                    </label>
                  </div>

                  {editModal.data.hasVariants ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {editModal.data.variants.map((v, idx) => (
                          <div key={idx} className="p-5 bg-base-100 border border-base-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group">
                            <button 
                              className="btn btn-xs btn-circle btn-ghost absolute top-3 right-3 text-base-content/30 hover:text-error hover:bg-error/10 transition-all" 
                              onClick={() => setEditModal(prev => ({ ...prev, data: { ...prev.data, variants: prev.data.variants.filter((_, i) => i !== idx) } }))}
                              disabled={editModal.data.variants.length <= 1}
                              title="Remove variant"
                            >✕</button>
                            
                            <div className="flex flex-col gap-4">
                              {/* Row 1: Name and Basic Pricing */}
                              <div className="flex flex-wrap items-end gap-4">
                                <div className="form-control flex-1 min-w-[150px]">
                                  <label className="label py-1"><span className="label-text text-xs font-medium opacity-70">Variant Name</span></label>
                                  <input 
                                    className="input input-bordered input-sm focus:input-primary" 
                                    placeholder="e.g. Small, Large, Family Pack" 
                                    value={v.name} 
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setEditModal(prev => {
                                        const next = [...prev.data.variants]
                                        next[idx] = { ...next[idx], name: val }
                                        return { ...prev, data: { ...prev.data, variants: next } }
                                      })
                                    }} 
                                  />
                                </div>
                                <div className="form-control w-28">
                                  <label className="label py-1"><span className="label-text text-xs font-medium opacity-70">MRP (₹)</span></label>
                                  <input 
                                    className="input input-bordered input-sm text-right tabular-nums" 
                                    placeholder="0" 
                                    value={v.mrp} 
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9.]/g, '')
                                      setEditModal(prev => {
                                        const next = [...prev.data.variants]
                                        next[idx] = { ...next[idx], mrp: val }
                                        const r = parseAmount(next[idx].rate)
                                        const m = parseAmount(val)
                                        if (r && m && m > 0) {
                                          const d = computeDiscountPercent(m, r)
                                          if (d) next[idx].discountPercent = formatPercent(d)
                                        }
                                        return { ...prev, data: { ...prev.data, variants: next } }
                                      })
                                    }} 
                                  />
                                </div>
                                <div className="form-control w-28">
                                  <label className="label py-1"><span className="label-text text-xs font-medium opacity-70">Rate (₹)</span></label>
                                  <input 
                                    className="input input-bordered input-sm text-right tabular-nums font-semibold" 
                                    placeholder="0" 
                                    value={v.rate} 
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9.]/g, '')
                                      setEditModal(prev => {
                                        const next = [...prev.data.variants]
                                        next[idx] = { ...next[idx], rate: val }
                                        const m = parseAmount(next[idx].mrp)
                                        const r = parseAmount(val)
                                        if (r && m && m > 0) {
                                          const d = computeDiscountPercent(m, r)
                                          if (d) next[idx].discountPercent = formatPercent(d)
                                        }
                                        return { ...prev, data: { ...prev.data, variants: next } }
                                      })
                                    }} 
                                  />
                                </div>
                              </div>

                              {/* Row 2: Discounts */}
                              <div className="bg-base-200/50 rounded-lg p-3 flex flex-wrap items-center gap-4">
                                <div className="form-control w-24">
                                  <label className="label py-0 mb-1"><span className="label-text text-[10px] font-bold uppercase opacity-60">Main Disc %</span></label>
                                  <input 
                                    className="input input-bordered input-xs text-center font-bold text-success" 
                                    value={v.discountPercent} 
                                    readOnly 
                                    title="Auto-calculated"
                                  />
                                </div>
                                <div className="w-px h-8 bg-base-300 mx-2 hidden sm:block"></div>
                                <div className="flex items-center gap-3 flex-1 overflow-x-auto">
                                  <span className="text-[10px] font-bold uppercase opacity-60 whitespace-nowrap">Extra Discounts:</span>
                                  {v.additionalDiscounts.map((d, dIdx) => (
                                    <div key={dIdx} className="relative">
                                      <input 
                                        className="input input-bordered input-xs w-16 text-center" 
                                        placeholder="%" 
                                        value={d} 
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/[^0-9.]/g, '')
                                          setEditModal(prev => {
                                            const next = [...prev.data.variants]
                                            const nextDiscounts = [...next[idx].additionalDiscounts]
                                            nextDiscounts[dIdx] = val
                                            next[idx] = { ...next[idx], additionalDiscounts: nextDiscounts }
                                            return { ...prev, data: { ...prev.data, variants: next } }
                                          })
                                        }} 
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        className="btn btn-outline btn-block border-dashed border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all gap-2" 
                        onClick={() => setEditModal(prev => ({ ...prev, data: { ...prev.data, variants: [...prev.data.variants, { name: '', mrp: '', rate: '', discountPercent: '', additionalDiscounts: ['', ''] }] } }))}
                      >
                        <MdAdd className="w-5 h-5" /> Add Another Variant
                      </button>
                    </div>
                  ) : (
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                      <div className="card-body">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">MRP (₹)</span>
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="input input-bordered text-lg"
                              placeholder="e.g. 249"
                              value={editModal.data.mrp}
                              onChange={(e) => updateEditData('mrp', e.target.value.replace(/[^0-9.]/g, ''))}
                            />
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">Rate (₹)</span>
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="input input-bordered text-lg font-semibold text-primary"
                              placeholder="e.g. 199"
                              value={editModal.data.rate}
                              onChange={(e) => updateEditData('rate', e.target.value.replace(/[^0-9.]/g, ''))}
                            />
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">Discount (%)</span>
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="input input-bordered text-lg text-success font-bold"
                              placeholder="Auto"
                              value={editModal.data.discountPercent}
                              onChange={(e) => updateEditData('discountPercent', e.target.value.replace(/[^0-9.]/g, ''))}
                            />
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-base-200/50 rounded-lg text-xs text-base-content/70 flex items-center gap-2">
                          <MdWarningAmber className="w-4 h-4" />
                          <span>Enter both MRP and Rate to automatically calculate the discount percentage shown to customers.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editModal.activeTab === 'composition' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-center">
                    <div className="join p-1 bg-base-200 rounded-lg">
                      <button 
                        type="button" 
                        className={`btn btn-sm join-item px-6 ${!editModal.data.isCustom ? 'btn-white shadow-sm' : 'btn-ghost text-base-content/60'}`} 
                        onClick={() => updateEditData('isCustom', false)}
                      >Standard Item</button>
                      <button 
                        type="button" 
                        className={`btn btn-sm join-item px-6 ${editModal.data.isCustom ? 'btn-white shadow-sm' : 'btn-ghost text-base-content/60'}`} 
                        onClick={() => updateEditData('isCustom', true)}
                      >Customizable</button>
                    </div>
                  </div>
                  
                  {editModal.data.isCustom ? (
                    <div className="bg-base-100 border border-base-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center px-2 pb-2 border-b border-base-100 text-xs font-bold text-base-content/40 uppercase tracking-wider">
                        <div className="w-20">Qty</div>
                        <div className="w-24">Unit</div>
                        <div className="flex-1">Ingredient Name</div>
                        <div className="w-8"></div>
                      </div>
                      {editModal.data.components.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 group">
                          <input 
                            className="input input-bordered input-sm w-20 text-center" 
                            placeholder="1" 
                            value={r.qty} 
                            onChange={(e)=>{ const v = e.target.value; setEditModal(m => { const rows = [...m.data.components]; rows[i] = { ...rows[i], qty: v }; return { ...m, data: { ...m.data, components: rows } } }) }} 
                          />
                          <select 
                            className="select select-bordered select-sm w-24" 
                            value={r.unit || ''} 
                            onChange={(e)=> setEditModal(m => { const rows = [...m.data.components]; rows[i] = { ...rows[i], unit: e.target.value }; return { ...m, data: { ...m.data, components: rows } } })}
                          >
                            <option value="">-</option>
                            <option value="pc">pc</option>
                            <option value="pcs">pcs</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="slice">slice</option>
                            <option value="bowl">bowl</option>
                            <option value="plate">plate</option>
                          </select>
                          <input 
                            className="input input-bordered input-sm flex-1" 
                            placeholder="e.g. Chicken Breast" 
                            value={r.text} 
                            onChange={(e)=>{ const v = e.target.value; setEditModal(m => { const rows = [...m.data.components]; rows[i] = { ...rows[i], text: v }; return { ...m, data: { ...m.data, components: rows } } }) }} 
                          />
                          <button 
                            className="btn btn-ghost btn-sm btn-circle text-base-content/30 hover:text-error opacity-0 group-hover:opacity-100 transition-all" 
                            onClick={()=> setEditModal(m => ({ ...m, data: { ...m.data, components: m.data.components.filter((_,j)=>j!==i) } }))}
                          >✕</button>
                        </div>
                      ))}
                      <button 
                        className="btn btn-ghost btn-sm w-full mt-2 text-primary" 
                        onClick={()=> setEditModal(m => ({ ...m, data: { ...m.data, components: [...m.data.components, { qty: '', unit: '', text: '' }] } }))}
                      >
                        + Add Ingredient
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-base-100 border border-base-200 border-dashed rounded-xl">
                      <div className="text-4xl mb-2">📦</div>
                      <h4 className="font-medium text-base-content">Standard Item</h4>
                      <p className="text-sm text-base-content/60 mt-1">This item is sold as-is without customizable components.</p>
                    </div>
                  )}
                </div>
              )}

              {editModal.activeTab === 'image' && (
                <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Current Image */}
                    <div className="flex flex-col items-center gap-4">
                      <h4 className="font-semibold text-base-content/70 uppercase tracking-wider text-xs">Current Display Image</h4>
                      <div className="relative group w-full aspect-square max-w-sm bg-base-200 rounded-2xl overflow-hidden border-2 border-dashed border-base-300 flex items-center justify-center">
                        {editModal.data.imageId && catImages[editModal.data.imageId] ? (
                          <>
                            <img src={catImages[editModal.data.imageId]} alt="Current" className="object-cover w-full h-full" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="badge badge-lg font-bold">Active</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-base-content/30">
                            <span className="text-6xl mb-2">🖼️</span>
                            <span className="font-medium">No Image Set</span>
                          </div>
                        )}
                      </div>
                      {editModal.data.imageId && (
                        <button 
                          className="btn btn-outline btn-error btn-sm w-full max-w-sm gap-2"
                          onClick={() => {
                            confirm({
                              message: 'Delete this image permanently?',
                              onConfirm: async () => {
                                try {
                                  const imageId = editModal.data.imageId
                                  setCategories(prev => prev.map(cat => {
                                    if (cat.id !== editModal.categoryId) return cat
                                    const items = cat.items.map((x, i) => i === editModal.itemIndex ? { ...x, imageId: undefined } : x)
                                    return { ...cat, items }
                                  }))
                                  setEditModal(m => ({ ...m, data: { ...m.data, imageId: null } }))
                                  
                                  const target = categories.find(cat => cat.id === editModal.categoryId)
                                  if (target) {
                                    const items = target.items.map((x, i) => i === editModal.itemIndex ? { ...x, imageId: undefined } : x)
                                    await setMenuItems(editModal.categoryId, items)
                                  }
                                  if (imageId) await deleteImageById(imageId)
                                  pushToast('Image deleted', 'info')
                                } catch (e) {
                                  pushToast(e.message, 'error')
                                }
                              }
                            })
                          }}
                        >
                          <MdDelete className="w-4 h-4" /> Remove Image
                        </button>
                      )}
                    </div>

                    {/* Right Column: Upload New */}
                    <div className="flex flex-col gap-4">
                      <h4 className="font-semibold text-base-content/70 uppercase tracking-wider text-xs">Upload New Image</h4>
                      
                      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
                        <div className="card-body p-4 gap-4">
                          <div className="form-control w-full">
                            <input
                              type="file"
                              accept="image/*"
                              className="file-input file-input-bordered file-input-primary w-full"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setEditModal(m => ({ ...m, imageFile: null, imagePreview: null, imageProgress: 0, imageError: '', imageUploading: false }))
                                if (!file.type.startsWith('image/')) { setEditModal(m => ({ ...m, imageError: 'Not an image file.' })); return }
                                const maxBytes = 1024 * 1024
                                if (file.size > maxBytes) { setEditModal(m => ({ ...m, imageError: `File too large (${Math.round(file.size/1024)}KB). Max 1MB.` })); return }
                                const reader = new FileReader()
                                reader.onload = (ev) => { setEditModal(m => ({ ...m, imageFile: file, imagePreview: ev.target?.result || null, imageProgress: 100 })) }
                                reader.readAsDataURL(file)
                              }}
                            />
                            <label className="label pb-0">
                              <span className="label-text-alt opacity-60">Supported: JPG, PNG, WEBP (Max 1MB)</span>
                            </label>
                          </div>

                          {editModal.imageError && (
                            <div className="alert alert-error text-sm py-2 rounded-lg">
                              <MdWarningAmber /> {editModal.imageError}
                            </div>
                          )}

                          {editModal.imagePreview && (
                            <div className="space-y-3 animate-in slide-in-from-bottom-2">
                              <div className="relative rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-video">
                                <img src={editModal.imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                {editModal.imageUploading && (
                                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white backdrop-blur-sm">
                                    <span className="loading loading-spinner loading-lg"></span>
                                    <span className="text-sm font-medium">Uploading...</span>
                                  </div>
                                )}
                              </div>
                              <button 
                                className="btn btn-primary w-full" 
                                disabled={!editModal.imageFile || editModal.imageUploading}
                                onClick={async () => {
                                  if (!editModal.imageFile) return
                                  try {
                                    setEditModal(m => ({ ...m, imageUploading: true, imageError: '' }))
                                    const dataUrl = editModal.imagePreview
                                    const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl)
                                    const mime = match ? match[1] : editModal.imageFile.type
                                    const b64 = match ? match[2] : null
                                    if (!b64) throw new Error('Invalid data URL')
                                    
                                    const imageId = await saveBase64Image(b64, mime, { ownerType: 'item', categoryId: editModal.categoryId, itemName: editModal.data.name })
                                    
                                    setCategories(prev => prev.map(cat => { 
                                      if (cat.id !== editModal.categoryId) return cat; 
                                      const items = cat.items.map((it, i) => i === editModal.itemIndex ? { ...it, imageId } : it); 
                                      return { ...cat, items } 
                                    }))
                                    
                                    setEditModal(m => ({ ...m, imageUploading: false, imageFile: null, imagePreview: null, data: { ...m.data, imageId } }))
                                    
                                    const target = categories.find(cat => cat.id === editModal.categoryId)
                                    if (target) { 
                                      const items = target.items.map((it, i) => i === editModal.itemIndex ? { ...it, imageId } : it); 
                                      await setMenuItems(editModal.categoryId, items) 
                                    }
                                    
                                    pushToast('Image updated successfully', 'success')
                                  } catch (e) {
                                    setEditModal(m => ({ ...m, imageUploading: false, imageError: e.message }))
                                  }
                                }}
                              >
                                {editModal.imageUploading ? 'Uploading...' : 'Confirm Upload'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-base-200 bg-base-100 flex justify-between items-center z-10">
              <button 
                className="btn btn-ghost text-error btn-sm hover:bg-error/10"
                onClick={() => {
                  confirm({
                    message: `Delete "${editModal.data.name}"? This cannot be undone.`,
                    onConfirm: async () => {
                      try {
                        const ok = await removeMenuItem(editModal.categoryId, editModal.data.name)
                        if (ok) {
                          setCategories(prev => prev.map(cat => cat.id === editModal.categoryId ? { ...cat, items: cat.items.filter((_, i) => i !== editModal.itemIndex) } : cat))
                          pushToast('Item deleted', 'info')
                          closeEditModal()
                        } else { pushToast('Delete failed', 'error') }
                      } catch (e) { pushToast(e.message, 'error') }
                    }
                  })
                }}
              >
                <MdDelete className="w-4 h-4" /> Delete Item
              </button>
              <div className="flex gap-3">
                <button className="btn btn-ghost btn-sm" onClick={closeEditModal}>Cancel</button>
                <button 
                  className="btn btn-primary btn-sm px-6" 
                  disabled={editModal.saving}
                  onClick={async () => {
                    if (editModal.saving) return
                    const trimmedName = editModal.data.name.trim()
                    if (!trimmedName) {
                      setEditModal(prev => ({ ...prev, error: 'Name is required.' }))
                      return
                    }

                    let nextItemData = {
                      name: trimmedName,
                      desc: editModal.data.desc,
                      veg: editModal.data.veg !== false,
                      isCustom: editModal.data.isCustom,
                      components: editModal.data.isCustom ? editModal.data.components.filter(c => c.qty || c.unit || c.text) : [],
                      ingredients: (editModal.data.ingredients || []).filter(i => i.materialId && i.quantity)
                    }

                    if (editModal.data.hasVariants) {
                      const validVariants = editModal.data.variants.filter(v => v.name.trim())
                      if (validVariants.length === 0) {
                        setEditModal(prev => ({ ...prev, error: 'Add at least one variant with a name.' }))
                        return
                      }
                      for (const v of validVariants) {
                        if (!parseAmount(v.rate)) {
                          setEditModal(prev => ({ ...prev, error: `Rate is required for variant "${v.name}".` }))
                          return
                        }
                      }
                      nextItemData.variants = validVariants.map(v => ({
                        name: v.name.trim(),
                        rate: parseAmount(v.rate),
                        price: parseAmount(v.rate),
                        mrp: parseAmount(v.mrp),
                        discountPercent: parsePercent(v.discountPercent),
                        additionalDiscounts: v.additionalDiscounts.map(d => parsePercent(d)).filter(d => d !== null)
                      }))
                      // Use first variant as main price
                      nextItemData.price = nextItemData.variants[0].rate
                      nextItemData.rate = nextItemData.variants[0].rate
                      nextItemData.mrp = nextItemData.variants[0].mrp
                    } else {
                      const rateNumber = parseAmount(editModal.data.rate)
                      if (rateNumber === null || rateNumber <= 0) {
                        setEditModal(prev => ({ ...prev, error: 'Rate must be greater than 0.' }))
                        return
                      }
                      const mrpNumber = parseAmount(editModal.data.mrp)
                      const discountNumber = parsePercent(editModal.data.discountPercent)
                      const effectiveDiscount = discountNumber !== null ? discountNumber : computeDiscountPercent(mrpNumber ?? undefined, rateNumber ?? undefined)
                      
                      nextItemData.price = rateNumber
                      nextItemData.rate = rateNumber
                      if (mrpNumber !== null && mrpNumber > 0) nextItemData.mrp = mrpNumber
                      if (effectiveDiscount !== null && effectiveDiscount > 0) nextItemData.discountPercent = effectiveDiscount
                      nextItemData.variants = []
                    }

                    setEditModal(prev => ({ ...prev, saving: true, error: '' }))
                    try {
                      const targetCat = categories.find(cat => cat.id === editModal.categoryId)
                      if (!targetCat) throw new Error('Category not found')
                      const nextItems = targetCat.items.map((item, index) => {
                        if (index !== editModal.itemIndex) return item
                        // Merge with existing item to keep imageId if not changed here (though imageId is handled separately, we preserve it)
                        const merged = { ...item, ...nextItemData }
                        if (!nextItemData.mrp) delete merged.mrp
                        if (!nextItemData.discountPercent) delete merged.discountPercent
                        if (!editModal.data.hasVariants) delete merged.variants
                        return merged
                      })
                      await setMenuItems(editModal.categoryId, nextItems)
                      setCategories(prev => prev.map(cat => cat.id === editModal.categoryId ? { ...cat, items: nextItems } : cat))
                      setInfo('Item updated.')
                      closeEditModal()
                    } catch (e) {
                      setEditModal(prev => ({ ...prev, saving: false, error: e.message || 'Update failed' }))
                    }
                  }}
                >
                  {editModal.saving ? <span className="loading loading-spinner loading-xs"></span> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => !editModal.saving && closeEditModal()}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditModalOpen && (
        <dialog open className="modal modal-open backdrop-blur-sm">
          <div className="modal-box max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-base-200 bg-base-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl text-base-content">Bulk Edit</h3>
                  <p className="text-xs text-base-content/50 mt-0.5">Select category and aspect to edit multiple items at once</p>
                </div>
                <button className="btn btn-sm btn-circle btn-ghost hover:bg-base-200" onClick={() => setBulkEditModalOpen(false)}>✕</button>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="px-6 py-4 border-b border-base-200 bg-base-50 flex flex-wrap items-center gap-4">
              <div className="form-control flex-1 min-w-[200px]">
                <label className="label py-1"><span className="label-text text-xs font-medium">Category</span></label>
                <select className="select select-bordered select-sm" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
                  {categories.map(c => (<option key={c.id} value={c.id}>{displayCategory(c)}</option>))}
                </select>
              </div>
              <div className="form-control flex-1 min-w-[200px]">
                <label className="label py-1"><span className="label-text text-xs font-medium">Edit Aspect</span></label>
                <div className="join">
                  <button className={`btn btn-sm join-item ${bulkAspect === 'pricing' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkAspect('pricing')}>Pricing</button>
                  <button className={`btn btn-sm join-item ${bulkAspect === 'details' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkAspect('details')}>Details</button>
                  <button className={`btn btn-sm join-item ${bulkAspect === 'composition' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkAspect('composition')}>Composition</button>
                  <button className={`btn btn-sm join-item ${bulkAspect === 'image' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkAspect('image')}>Image</button>
                </div>
              </div>
            </div>

            {/* Bulk Edit Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const c = categories.find(cat => cat.id === bulkCategory)
                if (!c) return <div className="text-center opacity-60">Select a category</div>
                const items = Array.isArray(c.items) ? c.items : []
                if (!items.length) return <div className="text-center opacity-60">No items in this category</div>

                return (
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th className="w-12">#</th>
                          <th className="min-w-[200px]">Item Name</th>
                          {bulkAspect === 'pricing' && (
                            <>
                              <th className="w-28 text-right">MRP</th>
                              <th className="w-28 text-right">Rate</th>
                              <th className="w-28 text-right">Discount %</th>
                            </>
                          )}
                          {bulkAspect === 'details' && (
                            <>
                              <th className="w-48">Description</th>
                              <th className="w-32 text-center">Veg/Non-Veg</th>
                              <th className="w-32 text-center">Active</th>
                            </>
                          )}
                          {bulkAspect === 'composition' && (
                            <th className="w-32 text-center">Type</th>
                          )}
                          {bulkAspect === 'image' && (
                            <>
                              <th className="w-24 text-center">Current</th>
                              <th className="w-32">Status</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const key = bulkKey(c.id, idx)
                          const d = bulkDraft[key] || {
                            name: it.name || '',
                            desc: it.desc || '',
                            mrp: '',
                            rate: '',
                            discountPercent: '',
                            veg: it.veg !== false,
                            active: it.active !== false,
                          }
                          return (
                            <tr key={key}>
                              <td className="text-center opacity-60">{idx + 1}</td>
                              <td>
                                <div className="font-medium text-sm">{it.name}</div>
                              </td>
                              {bulkAspect === 'pricing' && (
                                <>
                                  <td className="text-right">
                                    <input
                                      className="input input-bordered input-xs w-24 text-right tabular-nums"
                                      inputMode="decimal"
                                      value={d.mrp}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '')
                                        const nextForm = recomputePricing({ ...d, mrp: val }, 'mrp')
                                        setBulkDraft(prev => ({ ...prev, [key]: { ...d, ...nextForm } }))
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </td>
                                  <td className="text-right">
                                    <input
                                      className="input input-bordered input-xs w-24 text-right tabular-nums font-semibold"
                                      inputMode="decimal"
                                      value={d.rate}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '')
                                        const nextForm = recomputePricing({ ...d, rate: val }, 'rate')
                                        setBulkDraft(prev => ({ ...prev, [key]: { ...d, ...nextForm } }))
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </td>
                                  <td className="text-right">
                                    <input
                                      className="input input-bordered input-xs w-24 text-right tabular-nums"
                                      inputMode="decimal"
                                      placeholder="Auto"
                                      value={d.discountPercent}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '')
                                        const nextForm = recomputePricing({ ...d, discountPercent: val }, 'discountPercent')
                                        setBulkDraft(prev => ({ ...prev, [key]: { ...d, ...nextForm } }))
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </td>
                                </>
                              )}
                              {bulkAspect === 'details' && (
                                <>
                                  <td>
                                    <input
                                      className="input input-bordered input-xs w-full"
                                      placeholder="Description"
                                      value={d.desc}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setBulkDraft(prev => ({ ...prev, [key]: { ...d, desc: val } }))
                                      }}
                                    />
                                  </td>
                                  <td className="text-center">
                                    <div className="join">
                                      <button
                                        type="button"
                                        className={`btn btn-xs join-item ${d.veg ? 'btn-success' : 'btn-ghost'}`}
                                        onClick={() => setBulkDraft(prev => ({ ...prev, [key]: { ...d, veg: true } }))}
                                      >
                                        Veg
                                      </button>
                                      <button
                                        type="button"
                                        className={`btn btn-xs join-item ${!d.veg ? 'btn-error' : 'btn-ghost'}`}
                                        onClick={() => setBulkDraft(prev => ({ ...prev, [key]: { ...d, veg: false } }))}
                                      >
                                        Non-Veg
                                      </button>
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      className="toggle toggle-sm toggle-primary"
                                      checked={d.active !== false}
                                      onChange={(e) => setBulkDraft(prev => ({ ...prev, [key]: { ...d, active: e.target.checked } }))}
                                    />
                                  </td>
                                </>
                              )}
                              {bulkAspect === 'composition' && (
                                <td className="text-center">
                                  <div className="join">
                                    <button
                                      type="button"
                                      className={`btn btn-xs join-item ${!d.isCustom ? 'btn-primary' : 'btn-ghost'}`}
                                      onClick={() => setBulkDraft(prev => ({ ...prev, [key]: { ...d, isCustom: false } }))}
                                    >
                                      Standard
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn btn-xs join-item ${d.isCustom ? 'btn-warning' : 'btn-ghost'}`}
                                      onClick={() => setBulkDraft(prev => ({ ...prev, [key]: { ...d, isCustom: true } }))}
                                    >
                                      Custom
                                    </button>
                                  </div>
                                </td>
                              )}
                              {bulkAspect === 'image' && (
                                <>
                                  <td className="text-center">
                                    {it.imageId && catImages[it.imageId] ? (
                                      <img src={catImages[it.imageId]} alt="" className="w-12 h-12 mx-auto rounded object-cover border border-base-300/60" />
                                    ) : (
                                      <div className="w-12 h-12 mx-auto rounded border border-dashed border-base-300/60 grid place-items-center text-[9px] opacity-50">—</div>
                                    )}
                                  </td>
                                  <td>
                                    <div className="text-xs">
                                      {it.imageId ? (
                                        <span className="badge badge-success badge-xs">Has image</span>
                                      ) : (
                                        <span className="badge badge-ghost badge-xs">No image</span>
                                      )}
                                      <div className="text-[10px] opacity-60 mt-1">Click item to edit image</div>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-base-200 bg-base-100 flex justify-end items-center gap-3 z-10">
              <button className="btn btn-ghost btn-sm" onClick={() => setBulkEditModalOpen(false)} disabled={bulkSaving}>Cancel</button>
              <button
                className="btn btn-primary btn-sm px-6"
                disabled={bulkSaving || !bulkCategory}
                onClick={async () => {
                  if (bulkSaving) return
                  setError(''); setInfo(''); setBulkSaving(true)
                  try {
                    const c = categories.find(cat => cat.id === bulkCategory)
                    if (!c) throw new Error('Category not found')
                    const items = Array.isArray(c.items) ? c.items : []
                    const nextItems = items.map((it, idx) => {
                      const key = bulkKey(c.id, idx)
                      const d = bulkDraft[key]
                      if (!d) return it
                      const next = { ...it }

                      if (bulkAspect === 'pricing') {
                        if (d.mrp !== '') {
                          const mrpNumber = parseAmount(d.mrp)
                          if (mrpNumber !== null) next.mrp = mrpNumber
                        }
                        if (d.rate !== '') {
                          const rateNumber = parseAmount(d.rate)
                          if (rateNumber !== null) {
                            next.rate = rateNumber
                            next.price = rateNumber
                          }
                        }
                        if (d.discountPercent !== '') {
                          const discountNumber = parsePercent(d.discountPercent)
                          if (discountNumber !== null) next.discountPercent = discountNumber
                        }
                      } else if (bulkAspect === 'details') {
                        if (d.desc !== undefined) next.desc = d.desc
                        next.veg = d.veg !== false
                        if (d.active === false) next.active = false
                        else {
                          if (next.active === false) delete next.active
                        }
                      } else if (bulkAspect === 'composition') {
                        if (d.isCustom !== undefined) next.isCustom = d.isCustom
                      }
                      return next
                    })
                    await setMenuItems(c.id, nextItems)
                    const cats = await fetchMenuCategories(); setCategories(cats)
                    // Update bulk draft with refreshed data so changes are visible if user reopens
                    const refreshedCat = cats.find(cat => cat.id === c.id)
                    if (refreshedCat) {
                      const refreshedDraft = {}
                      const refreshedItems = Array.isArray(refreshedCat.items) ? refreshedCat.items : []
                      for (let idx = 0; idx < refreshedItems.length; idx++) {
                        const it = refreshedItems[idx]
                        const mrpNumber = parseAmount(it.mrp ?? it.MRP ?? '')
                        const rateNumber = parseAmount(it.rate ?? it.price ?? '')
                        const explicitDiscount = it.discountPercent !== undefined && it.discountPercent !== null ? parsePercent(it.discountPercent) : null
                        const derivedDiscount = explicitDiscount !== null ? explicitDiscount : computeDiscountPercent(mrpNumber ?? undefined, rateNumber ?? undefined)
                        refreshedDraft[bulkKey(refreshedCat.id, idx)] = {
                          categoryId: refreshedCat.id,
                          itemIndex: idx,
                          name: it.name || '',
                          desc: it.desc || it.description || '',
                          mrp: mrpNumber !== null ? formatAmount(mrpNumber) : '',
                          rate: rateNumber !== null ? formatAmount(rateNumber) : '',
                          discountPercent: derivedDiscount !== null && derivedDiscount > 0 ? formatPercent(derivedDiscount) : '',
                          veg: it.veg !== false,
                          active: it.active !== false,
                          imageId: it.imageId || null,
                          isCustom: !!it.isCustom,
                        }
                      }
                      setBulkDraft(refreshedDraft)
                    }
                    setInfo(`Bulk ${bulkAspect} edits saved for ${displayCategory(c)}.`)
                    setBulkEditModalOpen(false)
                  } catch (e) {
                    setError(e.message || 'Bulk save failed')
                  } finally {
                    setBulkSaving(false)
                  }
                }}
              >
                {bulkSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => !bulkSaving && setBulkEditModalOpen(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </AdminLayout>
  )
}
