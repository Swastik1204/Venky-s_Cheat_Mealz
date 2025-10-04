import { useEffect, useState } from 'react'
import { fetchMenuCategories, upsertMenuCategory, addMenuItems, setMenuItems, renameMenuCategory, fetchAllOrders, updateOrder, nextOrderStatus, migrateRemoveCategoryNameFields, removeMenuItem, appendMenuItems as lowAppend } from '../lib/data'
import { MdDelete, MdAdd, MdKeyboardArrowDown } from 'react-icons/md'
import { useUI } from '../context/UIContext'
import { db } from '../lib/firebase'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

export default function Admin() {
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
  const [statusFilter, setStatusFilter] = useState('all')
  const { confirm, pushToast } = useUI()
  const [pendingRestore, setPendingRestore] = useState(null) // {categoryId,item,timeoutId,toastId}
  const [openCats, setOpenCats] = useState(() => new Set()) // which category accordions are open

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
      default: return 'badge-ghost'
    }
  }

  function progressPercent(s) {
    const idx = statusFlow.indexOf(s)
    if (idx === -1) return 0
    return ((idx + 1) / statusFlow.length) * 100
  }

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  const metrics = statusFlow.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc }, { all: orders.length })

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

  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const list = await fetchAllOrders()
      setOrders(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingOrders(false)
    }
  }

  async function advanceOrder(o) {
    const next = nextOrderStatus(o.status)
    if (next === o.status) return
    await updateOrder(o.userId || null, o.id, { status: next })
    setOrders((arr) => arr.map(x => x.id === o.id ? { ...x, status: next } : x))
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={checkConnection} disabled={loading}>Check connection</button>
          <span className={`badge ${connOk ? 'badge-success' : 'badge-error'}`}>
            {connOk ? 'Firestore: connected' : 'Firestore: error'}
          </span>
          <span className={`badge ${writeOk ? 'badge-success' : 'badge-warning'}`}>
            {writeOk ? 'Write: allowed' : 'Write: blocked'}
          </span>
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
              <input type="checkbox" tabIndex={-1} aria-hidden="true" checked={open} onChange={() => toggleCat(c.id)} />
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
                <div className={`overflow-hidden transition-[max-height] duration-400 ease-in-out ${open ? 'max-h-[900px]' : 'max-h-0'}`}> {/* height animation wrapper */}
                  <div className={`${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} transition-all duration-300`}>  
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
                          <th className="w-28 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const key = `${c.id}:${idx}`
                          const isEditing = editing.key === key
                          return (
                            <tr key={key}>
                              <td>
                                {isEditing ? (
                                  <input
                                    className="input input-bordered input-xs w-full"
                                    value={editing.name}
                                    onChange={(e) => setEditing(s => ({ ...s, name: e.target.value }))}
                                  />
                                ) : it.name}
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
                                    <span
                                      className="inline-flex items-center justify-center w-5 h-5"
                                      aria-label="Vegetarian"
                                      title="Vegetarian"
                                    >
                                      <span className="w-3.5 h-3.5 rounded-sm border-2 border-green-600 relative">
                                        <span
                                          className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-green-600"
                                          style={{ top:0,bottom:0,left:0,right:0 }}
                                        />
                                      </span>
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-center w-5 h-5"
                                      aria-label="Non-Vegetarian"
                                      title="Non-Vegetarian"
                                    >
                                      <span className="w-3.5 h-3.5 rounded-sm border-2 border-rose-600 relative">
                                        <span
                                          className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-rose-600"
                                          style={{ top:0,bottom:0,left:0,right:0 }}
                                        />
                                      </span>
                                    </span>
                                  )
                                )}
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
                                              ? { ...cat, items: cat.items.map((x, i) => (i === idx ? { name: editing.name.trim(), price: Number(editing.price) || 0, veg: editing.veg !== false } : x)) }
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

      <div className="mt-14">
        {/* Migration utility (one-time). Hidden by default; toggle manually if needed */}
        {/* <button className="btn btn-xs btn-outline mb-4" onClick={async () => { await migrateRemoveCategoryNameFields(); const cats = await fetchMenuCategories(); setCategories(cats); setInfo('Migrated old category docs.'); }}>Run category name cleanup</button> */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Orders</span>
              <span className="text-sm font-normal opacity-60">(live overview)</span>
            </h2>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm btn-outline" onClick={loadOrders} disabled={loadingOrders}>
                {loadingOrders ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          </div>

          {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {['all', ...statusFlow].map(f => (
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
                <div key={o.id} className="group relative overflow-hidden rounded-xl border border-base-300/50 bg-base-100/60 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition">
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
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => advanceOrder(o)}
                        disabled={advanceDisabled}
                        title={advanceDisabled ? 'Final state reached' : `Advance to ${next}`}
                      >{advanceDisabled ? 'Complete' : `Mark ${next}`}</button>
                    </div>
                  </div>
                  {/* Progress bar */}
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
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

