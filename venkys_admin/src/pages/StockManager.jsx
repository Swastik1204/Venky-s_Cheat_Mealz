import { useEffect, useState, useMemo } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import { fetchRawMaterials, saveRawMaterial, deleteRawMaterial, updateRawMaterialStock } from '../lib/data'
import { useUI } from '../context/UIContext'
import { MdAdd, MdDelete, MdEdit, MdWarning, MdHistory, MdTrendingDown, MdTrendingUp } from 'react-icons/md'

export default function StockManager() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', unit: 'kg', stock: 0, lowStockThreshold: 5, costPerUnit: 0 })
  const { pushToast, confirm } = useUI()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchRawMaterials()
      setMaterials(data.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (e) {
      pushToast('Failed to load stock data', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    setEditingItem(null)
    setFormData({ name: '', unit: 'kg', stock: 0, lowStockThreshold: 5, costPerUnit: 0 })
    setModalOpen(true)
  }

  function handleEdit(item) {
    setEditingItem(item)
    setFormData({ 
      name: item.name, 
      unit: item.unit || 'kg', 
      stock: item.stock || 0, 
      lowStockThreshold: item.lowStockThreshold || 5,
      costPerUnit: item.costPerUnit || 0
    })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      await saveRawMaterial({
        id: editingItem?.id,
        ...formData,
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        costPerUnit: Number(formData.costPerUnit)
      })
      pushToast(editingItem ? 'Material updated' : 'Material added', 'success')
      setModalOpen(false)
      loadData()
    } catch (e) {
      pushToast(e.message, 'error')
    }
  }

  async function handleDelete(id) {
    if (await confirm('Delete this material? This might break recipes using it.')) {
      try {
        await deleteRawMaterial(id)
        pushToast('Material deleted', 'success')
        loadData()
      } catch (e) {
        pushToast('Failed to delete', 'error')
      }
    }
  }

  async function quickUpdateStock(id, delta) {
    try {
      await updateRawMaterialStock(id, delta)
      // Optimistic update
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, stock: (m.stock || 0) + delta } : m))
      pushToast('Stock updated', 'success')
    } catch (e) {
      pushToast('Update failed', 'error')
      loadData() // Revert on error
    }
  }

  const lowStockItems = useMemo(() => materials.filter(m => (m.stock || 0) <= (m.lowStockThreshold || 0)), [materials])

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{lineHeight:'1.1', color:'var(--color-base-content)'}}>
            Stock Manager
          </h2>
          <p className="text-sm opacity-60 mt-1">Manage raw materials and inventory levels.</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={handleAdd}>
          <MdAdd size={20} /> Add Material
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning shadow-sm mb-6">
          <MdWarning size={24} />
          <div>
            <h3 className="font-bold">Low Stock Alert</h3>
            <div className="text-xs">
              {lowStockItems.map(m => m.name).join(', ')} are running low.
            </div>
          </div>
        </div>
      )}

      <div className="admin-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                <th>Cost / Unit</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 opacity-50">Loading stock data...</td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 opacity-50">No raw materials found. Add some to get started.</td></tr>
              ) : (
                materials.map(item => {
                  const isLow = (item.stock || 0) <= (item.lowStockThreshold || 0)
                  return (
                    <tr key={item.id} className="hover">
                      <td className="font-medium">{item.name}</td>
                      <td className="opacity-70">{item.unit}</td>
                      <td className="opacity-70">₹{item.costPerUnit || 0}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${isLow ? 'text-error' : ''}`}>
                            {item.stock || 0}
                          </span>
                          <div className="join">
                            <button className="btn btn-xs join-item" onClick={() => quickUpdateStock(item.id, -1)}>-</button>
                            <button className="btn btn-xs join-item" onClick={() => quickUpdateStock(item.id, 1)}>+</button>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-error badge-sm gap-1">
                            <MdTrendingDown /> Low
                          </span>
                        ) : (
                          <span className="badge badge-success badge-sm gap-1 badge-outline">
                            <MdTrendingUp /> Good
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="btn btn-ghost btn-xs btn-square" onClick={() => handleEdit(item)}>
                            <MdEdit size={16} />
                          </button>
                          <button className="btn btn-ghost btn-xs btn-square text-error" onClick={() => handleDelete(item.id)}>
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit Material' : 'Add Raw Material'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Chicken Breast, Oil, Buns"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Unit</span></label>
                  <select 
                    className="select select-bordered" 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Cost per Unit (₹)</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input input-bordered" 
                    value={formData.costPerUnit}
                    onChange={e => setFormData({...formData, costPerUnit: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Current Stock</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input input-bordered" 
                    required 
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Low Stock Alert At</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input input-bordered" 
                    value={formData.lowStockThreshold}
                    onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)}></div>
        </div>
      )}
    </AdminLayout>
  )
}
