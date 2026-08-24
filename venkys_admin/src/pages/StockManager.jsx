// StockManager — Quick stock availability toggle panel
import { useEffect, useState, useMemo, useCallback } from 'react'

import {
  MdAdd, MdDelete, MdEdit, MdWarning, MdTrendingDown, MdTrendingUp,
  MdRefresh, MdSearch, MdRestaurantMenu, MdNotificationsActive,
  MdExpandMore, MdExpandLess, MdLink, MdRemoveCircleOutline, MdAddCircleOutline,
  MdInventory, MdSelectAll, MdDeselect, MdTune, MdLock, MdLockOpen
} from 'react-icons/md'

import AdminLayout from '../layouts/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchRawMaterials, saveRawMaterial, deleteRawMaterial, updateRawMaterialStock, fetchMenuCategories } from '../lib/data'

const UNITS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'box', label: 'Boxes' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'l', label: 'Litres (l)' },
]

// ── Helpers ──

function stockPercent(stock, threshold) {
  if (!threshold || threshold <= 0) return 100
  const full = threshold * 3
  return Math.min(100, Math.max(0, (stock / full) * 100))
}

function stockColor(stock, threshold) {
  if (threshold > 0 && stock <= threshold) return 'text-error'
  if (threshold > 0 && stock <= threshold * 1.5) return 'text-warning'
  return 'text-success'
}

function progressColor(stock, threshold) {
  if (threshold > 0 && stock <= threshold) return 'progress-error'
  if (threshold > 0 && stock <= threshold * 1.5) return 'progress-warning'
  return 'progress-success'
}

export default function StockManager() {
  const { canAccess } = useAuth()
  const hasPageAccess = canAccess('stock')

  // ── State & refs ──
  const [materials, setMaterials] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [modalLocked, setModalLocked] = useState(true)
  const [expandedCard, setExpandedCard] = useState(null)
  const [formData, setFormData] = useState({
    name: '', unit: 'g', stock: 0, lowStockThreshold: 5
  })
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkApplying, setBulkApplying] = useState(false)
  const [bulkData, setBulkData] = useState({ unit: '', stockDelta: '', lowStockThreshold: '' })
  const { pushToast, confirm } = useUI()

  const confirmAsync = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      confirm({
        title: options.title || 'Please confirm',
        message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  }, [confirm])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [mats, cats] = await Promise.all([fetchRawMaterials(), fetchMenuCategories()])
      setMaterials(mats.sort((a, b) => a.name.localeCompare(b.name)))
      const allItems = []
      cats.forEach(cat => {
        if (Array.isArray(cat.items)) {
          cat.items.forEach(item => {
            allItems.push({ ...item, categoryName: cat.name || cat.id })
          })
        }
      })
      setMenuItems(allItems)
    } catch {
      pushToast('Failed to load stock data', 'error')
    } finally {
      setLoading(false)
    }
  }, [pushToast])

  useEffect(() => { loadData() }, [loadData])

  // ── Derived data ──
  // Reverse lookup: materialId -> dishes that use it
  const linkedDishes = useMemo(() => {
    const map = new Map()
    menuItems.forEach(item => {
      if (Array.isArray(item.ingredients)) {
        item.ingredients.forEach(ing => {
          if (ing.materialId) {
            if (!map.has(ing.materialId)) map.set(ing.materialId, [])
            map.get(ing.materialId).push({
              dishName: item.name,
              categoryName: item.categoryName,
              qtyPerServing: Number(ing.quantity || 0),
            })
          }
        })
      }
    })
    return map
  }, [menuItems])

  const filteredMaterials = useMemo(() => {
    let list = materials
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m => m.name?.toLowerCase().includes(q))
    }
    if (filterStatus === 'low') {
      list = list.filter(m => (m.stock || 0) <= (m.lowStockThreshold || 0) && (m.lowStockThreshold || 0) > 0)
    } else if (filterStatus === 'good') {
      list = list.filter(m => !((m.stock || 0) <= (m.lowStockThreshold || 0) && (m.lowStockThreshold || 0) > 0))
    }
    return list
  }, [materials, search, filterStatus])

  const lowStockCount = useMemo(() =>
    materials.filter(m => (m.stock || 0) <= (m.lowStockThreshold || 0) && (m.lowStockThreshold || 0) > 0).length
  , [materials])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedFilteredCount = useMemo(() => filteredMaterials.filter(m => selectedSet.has(m.id)).length, [filteredMaterials, selectedSet])

  // ── Handlers ──
  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleSelectFiltered() {
    const ids = filteredMaterials.map(m => m.id)
    if (!ids.length) return
    const allSelected = ids.every(id => selectedSet.has(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])])
    }
  }

  async function applyBulkEdits() {
    if (!selectedIds.length) {
      pushToast('Select at least one material', 'warning')
      return
    }

    const hasUnit = !!bulkData.unit
    const hasThreshold = bulkData.lowStockThreshold !== ''
    const hasStockDelta = bulkData.stockDelta !== ''
    const thresholdValue = Number(bulkData.lowStockThreshold)
    const deltaValue = Number(bulkData.stockDelta)

    if (!hasUnit && !hasThreshold && !hasStockDelta) {
      pushToast('Set at least one bulk value to apply', 'warning')
      return
    }
    if (hasThreshold && (!Number.isFinite(thresholdValue) || thresholdValue < 0)) {
      pushToast('Threshold must be a valid number >= 0', 'error')
      return
    }
    if (hasStockDelta && (!Number.isFinite(deltaValue) || deltaValue === 0)) {
      pushToast('Stock delta must be a non-zero number', 'error')
      return
    }

    const ok = await confirmAsync(
      `Apply bulk edits to ${selectedIds.length} material(s)?\n\n${hasUnit ? `• Unit: ${bulkData.unit}\n` : ''}${hasThreshold ? `• Alert threshold: ${thresholdValue}\n` : ''}${hasStockDelta ? `• Stock change: ${deltaValue > 0 ? '+' : ''}${deltaValue}` : ''}`,
      { title: 'Bulk Edit Materials', confirmText: 'Apply Changes' }
    )
    if (!ok) return

    setBulkApplying(true)
    let success = 0
    let failed = 0
    for (const id of selectedIds) {
      try {
        const existing = materials.find(m => m.id === id)
        if (!existing) continue
        const patch = { id, name: existing.name }
        if (hasUnit) patch.unit = bulkData.unit
        if (hasThreshold) patch.lowStockThreshold = thresholdValue
        if (hasUnit || hasThreshold) {
          await saveRawMaterial(patch)
        }
        if (hasStockDelta) {
          await updateRawMaterialStock(id, deltaValue)
        }
        success++
      } catch {
        failed++
      }
    }
    setBulkApplying(false)

    if (success > 0) {
      pushToast(`Bulk edit applied to ${success} material(s)${failed ? `, ${failed} failed` : ''}`, failed ? 'warning' : 'success')
      setSelectedIds([])
      setBulkData({ unit: '', stockDelta: '', lowStockThreshold: '' })
      await loadData()
    } else {
      pushToast('Bulk edit failed for all selected materials', 'error')
    }
  }

  function handleAdd() {
    setEditingItem(null)
    setFormData({ name: '', unit: 'g', stock: 0, lowStockThreshold: 5 })
    setModalLocked(false)
    setModalOpen(true)
  }

  function handleEdit(item) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      unit: item.unit || 'g',
      stock: item.stock || 0,
      lowStockThreshold: item.lowStockThreshold || 5
    })
    setModalLocked(true)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      await saveRawMaterial({
        id: editingItem?.id,
        ...formData,
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold)
      })
      pushToast(editingItem ? 'Material updated' : 'Material added', 'success')
      setModalOpen(false)
      loadData()
    } catch (err) {
      pushToast(err.message, 'error')
    }
  }

  async function handleDelete(id) {
    const dishes = linkedDishes.get(id) || []
    const dishWarning = dishes.length > 0
      ? `\n\nThis material is used by: ${dishes.map(d => d.dishName).join(', ')}. Stock auto-deduction will stop for those dishes.`
      : ''
    if (await confirmAsync(`Delete this material?${dishWarning}`, { confirmText: 'Delete' })) {
      try {
        await deleteRawMaterial(id)
        pushToast('Material deleted', 'success')
        loadData()
      } catch {
        pushToast('Failed to delete', 'error')
      }
    }
  }

  if (!hasPageAccess) {
    return <div className="p-8"><div className="alert alert-error">You don't have permission to access this page.</div></div>
  }

  // ── Render ──
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <MdInventory /> Stock Manager
            </h2>
            <p className="text-sm opacity-60 mt-1">
              Manage raw materials, link to dishes, and set alert thresholds
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-outline gap-1" onClick={loadData} disabled={loading}>
              <MdRefresh className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button className="btn btn-sm btn-primary gap-1" onClick={handleAdd}>
              <MdAdd /> Add Material
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-base-100 rounded-xl border border-base-200 p-3 text-center">
            <div className="text-2xl font-bold">{materials.length}</div>
            <div className="text-xs opacity-50">Total Items</div>
          </div>
          <div
            className="bg-error/5 rounded-xl border border-error/20 p-3 text-center cursor-pointer hover:bg-error/10 transition-colors"
            onClick={() => setFilterStatus(f => f === 'low' ? 'all' : 'low')}
          >
            <div className="text-2xl font-bold text-error">{lowStockCount}</div>
            <div className="text-xs opacity-50">Low Stock</div>
          </div>
          <div className="bg-success/5 rounded-xl border border-success/20 p-3 text-center">
            <div className="text-2xl font-bold text-success">{materials.length - lowStockCount}</div>
            <div className="text-xs opacity-50">Well Stocked</div>
          </div>
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {new Set([...linkedDishes.values()].flat().map(d => d.dishName)).size}
            </div>
            <div className="text-xs opacity-50">Linked Dishes</div>
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {lowStockCount > 0 && (
          <div className="alert alert-warning shadow-sm">
            <MdWarning size={22} />
            <div>
              <h3 className="font-bold text-sm">Low Stock Alert</h3>
              <p className="text-xs">
                {materials.filter(m => (m.stock || 0) <= (m.lowStockThreshold || 0) && (m.lowStockThreshold || 0) > 0)
                  .map(m => m.name).join(', ')} — running low. Email alerts are sent automatically when stock drops below threshold on orders.
              </p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="input input-bordered input-sm flex items-center gap-2 flex-1">
            <MdSearch className="opacity-40" />
            <input
              type="text"
              className="grow"
              placeholder="Search materials..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>
          <div className="join">
            {['all', 'low', 'good'].map(s => (
              <button
                key={s}
                className={`btn btn-sm join-item ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'all' ? 'All' : s === 'low' ? '⚠ Low' : '✓ Good'}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Edit Panel */}
        <details className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-xl">
          <summary className="collapse-title text-sm font-semibold flex items-center gap-2 min-h-0 py-3">
            <MdTune size={16} /> Bulk Edit
            {selectedIds.length > 0 && (
              <span className="badge badge-sm badge-primary ml-1">{selectedIds.length} selected</span>
            )}
          </summary>
          <div className="collapse-content px-4 pb-4 pt-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button className="btn btn-xs btn-outline gap-1" onClick={toggleSelectFiltered}>
                {selectedFilteredCount === filteredMaterials.length && filteredMaterials.length > 0
                  ? <><MdDeselect size={14} /> Unselect Filtered</>
                  : <><MdSelectAll size={14} /> Select Filtered</>
                }
              </button>
              <button className="btn btn-xs btn-ghost" onClick={() => setSelectedIds([])} disabled={!selectedIds.length}>
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <label className="form-control w-full">
                <div className="label py-1"><span className="label-text text-xs">Unit</span></div>
                <select
                  className="select select-bordered select-sm w-full"
                  value={bulkData.unit}
                  onChange={e => setBulkData(prev => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="">No change</option>
                  {UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </label>
              <label className="form-control w-full">
                <div className="label py-1"><span className="label-text text-xs">Alert threshold</span></div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered input-sm w-full"
                  placeholder="e.g. 5"
                  value={bulkData.lowStockThreshold}
                  onChange={e => setBulkData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                />
              </label>
              <label className="form-control w-full">
                <div className="label py-1"><span className="label-text text-xs">Stock ±</span></div>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered input-sm w-full"
                  placeholder="e.g. +5 or -3"
                  value={bulkData.stockDelta}
                  onChange={e => setBulkData(prev => ({ ...prev, stockDelta: e.target.value }))}
                />
              </label>
              <label className="form-control w-full">
                <div className="label py-1"><span className="label-text text-xs invisible">Apply</span></div>
                <button className="btn btn-sm btn-primary w-full" onClick={applyBulkEdits} disabled={bulkApplying || !selectedIds.length}>
                  {bulkApplying ? <span className="loading loading-spinner loading-xs" /> : 'Apply'}
                </button>
              </label>
            </div>
          </div>
        </details>

        {/* Materials Grid */}
        {loading ? (
          <div className="text-center py-16 opacity-50">
            <span className="loading loading-spinner loading-lg" />
            <p className="mt-3">Loading stock data...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-16 opacity-50 bg-base-100 rounded-xl border border-base-200">
            <MdInventory size={48} className="mx-auto mb-2 opacity-30" />
            <p>{search || filterStatus !== 'all' ? 'No materials match your filters.' : 'No raw materials yet. Add some to get started.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterials.map(item => {
              const isLow = (item.lowStockThreshold || 0) > 0 && (item.stock || 0) <= (item.lowStockThreshold || 0)
              const isWarning = !isLow && (item.lowStockThreshold || 0) > 0 && (item.stock || 0) <= (item.lowStockThreshold || 0) * 1.5
              const dishes = linkedDishes.get(item.id) || []
              const isExpanded = expandedCard === item.id
              const pct = stockPercent(item.stock || 0, item.lowStockThreshold || 0)

              return (
                <div
                  key={item.id}
                  className={`bg-base-100 rounded-xl border overflow-hidden transition-all ${
                    isLow ? 'border-error/40 shadow-error/10 shadow-md' :
                    isWarning ? 'border-warning/30' : 'border-base-200'
                  } ${selectedSet.has(item.id) ? 'ring-2 ring-primary/40' : ''}`}
                >
                  {/* Card Header - Clickable for Edit */}
                  <div className="p-4 cursor-pointer hover:bg-base-200/20 transition-colors" onClick={() => handleEdit(item)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary mt-0.5"
                          checked={selectedSet.has(item.id)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="badge badge-sm badge-outline">{item.unit}</span>
                          {dishes.length > 0 && (
                            <span className="badge badge-sm badge-ghost gap-1" onClick={(e) => { e.stopPropagation(); setExpandedCard(isExpanded ? null : item.id); }}>
                              <MdLink size={12} /> {dishes.length} dish{dishes.length > 1 ? 'es' : ''}
                            </span>
                          )}
                        </div>
                        </div>
                      </div>
                      {isLow ? (
                        <span className="badge badge-error badge-sm gap-1 shrink-0">
                          <MdTrendingDown size={12} /> Low
                        </span>
                      ) : isWarning ? (
                        <span className="badge badge-warning badge-sm gap-1 shrink-0">
                          <MdWarning size={12} /> Warning
                        </span>
                      ) : (
                        <span className="badge badge-success badge-sm badge-outline gap-1 shrink-0">
                          <MdTrendingUp size={12} /> Good
                        </span>
                      )}
                    </div>

                    {/* Stock bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={`font-bold text-lg ${stockColor(item.stock || 0, item.lowStockThreshold || 0)}`}>
                          {item.stock || 0} <span className="text-xs font-normal opacity-60">{item.unit}</span>
                        </span>
                        {(item.lowStockThreshold || 0) > 0 && (
                          <span className="text-xs opacity-40 flex items-center gap-1">
                            <MdNotificationsActive size={12} />
                            Alert at {item.lowStockThreshold} {item.unit}
                          </span>
                        )}
                      </div>
                      <progress
                        className={`progress w-full h-2 ${progressColor(item.stock || 0, item.lowStockThreshold || 0)}`}
                        value={pct}
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Quick Actions Footer - Removed Stock Buttons */}
                  <div className="px-4 pb-3 flex justify-end">
                    <div className="flex items-center gap-1">
                      {dishes.length > 0 && (
                        <button
                          className="btn btn-xs btn-ghost gap-1"
                          onClick={(e) => { e.stopPropagation(); setExpandedCard(isExpanded ? null : item.id); }}
                        >
                          <MdRestaurantMenu size={14} />
                          {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Linked Dishes */}
                  {isExpanded && dishes.length > 0 && (
                    <div className="border-t border-base-200 bg-base-200/30 p-3">
                      <div className="text-xs font-bold uppercase opacity-50 mb-2">Linked Dishes (auto-deducted on sale)</div>
                      <div className="space-y-1.5">
                        {dishes.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-base-100 rounded-lg px-3 py-1.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MdRestaurantMenu size={14} className="opacity-40 shrink-0" />
                              <span className="truncate font-medium">{d.dishName}</span>
                              <span className="text-xs opacity-40 shrink-0">{d.categoryName}</span>
                            </div>
                            <span className="text-xs font-mono opacity-60 shrink-0">
                              -{d.qtyPerServing} {item.unit}/serving
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] opacity-40 mt-2">
                        Stock is automatically reduced when orders containing these dishes are accepted.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* How It Works Info */}
        {materials.length > 0 && (
          <div className="bg-base-200/50 rounded-xl p-4 text-xs opacity-60 space-y-1">
            <p className="font-bold text-sm opacity-80">How auto-deduction works:</p>
            <p>1. Link raw materials to dishes in the <strong>Menu Editor</strong> (Inventory page → Edit item → Recipe / Ingredients).</p>
            <p>2. When an order is <strong>accepted</strong>, stock is automatically reduced based on the ingredient quantities × order quantity.</p>
            <p>3. If stock drops below the <strong>alert threshold</strong>, an email alert is sent automatically.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-lg p-0 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-base-200/50 px-6 py-4 border-b border-base-200 flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-2">
                {editingItem ? <MdEdit className="text-primary" /> : <MdAdd className="text-primary" />}
                {editingItem ? 'Edit Material' : 'New Material'}
              </h3>
              <div className="flex items-center gap-2">
               {editingItem && (
                  <button 
                    className={`btn btn-sm btn-ghost gap-2 ${modalLocked ? 'text-success' : 'text-warning'}`}
                    onClick={() => setModalLocked(!modalLocked)}
                    type="button"
                  >
                    {modalLocked ? <MdLock size={16} /> : <MdLockOpen size={16} />}
                    {modalLocked ? 'Locked' : 'Unlocked'}
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-circle btn-ghost" 
                  onClick={() => setModalOpen(false)}
                >✕</button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Name Field */}
              <div className="form-control w-full">
                <div className="label"><span className="label-text font-bold">Item Name</span></div>
                <label className={`input input-bordered flex items-center gap-2 ${!modalLocked ? 'focus-within:input-primary' : 'bg-base-200/50'}`}>
                  <MdInventory className="opacity-40" size={18} />
                  <input
                    type="text"
                    className="grow"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Chicken Breast, Cooking Oil"
                    disabled={modalLocked && !!editingItem}
                  />
                </label>
              </div>

              {/* Grid: Unit & Current Stock */}
              <div className="grid grid-cols-2 gap-5">
                <div className="form-control w-full">
                  <div className="label"><span className="label-text font-bold">Unit Type</span></div>
                  <select
                    className="select select-bordered w-full focus:select-primary disabled:bg-base-200/50"
                    value={formData.unit || ''}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    disabled={modalLocked && !!editingItem}
                  >
                    {UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control w-full">
                  <div className="label"><span className="label-text font-bold">Current Stock</span></div>
                  <label className={`input input-bordered flex items-center gap-2 font-mono text-lg ${modalLocked ? 'bg-base-200/50' : ''}`}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="grow w-0"
                      required
                      value={formData.stock || ''}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      disabled={modalLocked && !!editingItem}
                    />
                    <span className="text-xs font-bold opacity-40 uppercase">{formData.unit}</span>
                  </label>
                </div>
              </div>

              {/* Low Stock Alert Section */}
              <div className="bg-base-200/30 rounded-xl p-4 border border-base-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-warning/10 rounded-lg text-warning">
                    <MdNotificationsActive size={16} />
                  </div>
                  <span className="font-bold text-sm">Low Stock Alert</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs opacity-60 leading-relaxed">
                      Automatically notify via email when stock drops below this level.
                    </p>
                  </div>
                  <div className="w-24 relative shrink-0">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input input-bordered input-sm w-full font-mono text-center disabled:bg-transparent"
                      value={formData.lowStockThreshold || ''}
                      onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      disabled={modalLocked && !!editingItem}
                    />
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              {!editingItem && (
                <div className="text-xs opacity-50 px-1">
                  Once added, go to <strong>Menu then Inventory</strong> to link this material to dishes for automatic deduction.
                </div>
              )}

              {/* Actions */}
              <div className="modal-action mt-8 pt-4 border-t border-base-200 flex justify-between items-center">
                {editingItem ? (
                  <button 
                    type="button" 
                    className="btn btn-ghost text-error hover:bg-error/10 btn-sm gap-2"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this item?')) {
                         setModalOpen(false)
                         handleDelete(editingItem.id)
                      }
                    }}
                    disabled={modalLocked}
                  >
                    <MdDelete /> Delete
                  </button>
                ) : <div />}
                
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-8" disabled={modalLocked && !!editingItem}>
                    {editingItem ? 'Save Changes' : 'Create Material'}
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
        </div>
      )}
    </AdminLayout>
  )
}
