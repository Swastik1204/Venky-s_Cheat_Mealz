import { useEffect, useState } from 'react'
import { fetchMenuCategories, upsertMenuCategory, appendMenuItems, setMenuItems, renameMenuCategory } from '../lib/data'
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
  const [editing, setEditing] = useState({ key: null, name: '', price: '' }) // key: `${catId}:${idx}`
  const [editingCat, setEditingCat] = useState({ id: null, name: '' })
  const [showError, setShowError] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

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

  // Fade-out alerts
  useEffect(() => {
    if (!error) return
    setShowError(true)
    const t1 = setTimeout(() => setShowError(false), 4700) // start fade
    const t2 = setTimeout(() => setError(''), 5200) // then clear
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [error])

  useEffect(() => {
    if (!info) return
    setShowInfo(true)
    const t1 = setTimeout(() => setShowInfo(false), 4700)
    const t2 = setTimeout(() => setInfo(''), 5200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
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
      const grouped = new Map()
      for (const r of newItems) {
        if (!r.name || !r.name.trim() || !r.category || !r.category.trim()) continue
        const catName = r.category
        const arr = grouped.get(catName) || []
  arr.push({ name: r.name.trim(), price: r.price, veg: !!r.veg })
        grouped.set(catName, arr)
      }
      for (const [catName, arr] of grouped.entries()) {
        await upsertMenuCategory(catName)
        await appendMenuItems(catName, arr)
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
        <div className={`alert alert-error mb-4 transition-opacity duration-500 ${showError ? 'opacity-100' : 'opacity-0'}`}>{error}</div>
      )}
      {info && (
        <div className={`alert alert-success mb-4 transition-opacity duration-500 ${showInfo ? 'opacity-100' : 'opacity-0'}`}>{info}</div>
      )}

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Quick add categories</h2>
          <div className="space-y-2">
            {newCats.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="input input-bordered input-sm w-48"
                  placeholder="Category name"
                  value={row.name}
                  onChange={(e) => {
                    const v = [...newCats]
                    v[idx] = { ...v[idx], name: e.target.value }
                    setNewCats(v)
                  }}
                />
                <button
                  className="btn btn-sm btn-ghost"
                  title="Add another"
                  onClick={() => setNewCats((v) => [...v, { name: '' }])}
                >+
                </button>
                {newCats.length > 1 && (
                  <button
                    className="btn btn-sm btn-ghost"
                    title="Remove"
                    onClick={() => setNewCats((v) => v.filter((_, i) => i !== idx))}
                  >×
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-end">
              <button className="btn btn-primary btn-sm" onClick={saveCategories} disabled={loading}>Save categories</button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Quick add items</h2>
          <div className="space-y-2">
            {newItems.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select
                  className="select select-bordered select-sm col-span-2"
                  value={row.category}
                  onChange={(e) => {
                    const v = [...newItems]
                    v[idx] = { ...v[idx], category: e.target.value }
                    setNewItems(v)
                  }}
                >
                  <option value="" disabled hidden>Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id || c.name}>{c.name || c.id}</option>
                  ))}
                </select>
                <input
                  className="input input-bordered input-sm col-span-5"
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
                  className="input input-bordered input-sm col-span-2"
                  placeholder="Price"
                  value={row.price}
                  onChange={(e) => {
                    const v = [...newItems]
                    v[idx] = { ...v[idx], price: e.target.value }
                    setNewItems(v)
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <div className="col-span-12 flex justify-between items-center">
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
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-sm btn-ghost"
                      title="Add another"
                      onClick={() => setNewItems((v) => [...v, { category: '', name: '', price: '', veg: true }])}
                    >+
                    </button>
                    {newItems.length > 1 && (
                      <button
                        className="btn btn-sm btn-ghost"
                        title="Remove"
                        onClick={() => setNewItems((v) => v.filter((_, i) => i !== idx))}
                      >×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <button
                className="btn btn-primary btn-sm"
                onClick={saveItems}
                disabled={loading || newItems.some(r => r.veg === undefined)}
                title={newItems.some(r => r.veg === undefined) ? 'Select Veg / Non-Veg for all rows' : 'Save items'}
              >Save items</button>
            </div>
          </div>
        </section>
      </div>

      {/* Listing table */}
      <div className="mt-10 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Current menu</h2>
        <table className="table">
          <thead>
            <tr>
              <th className="w-64">Category</th>
              <th>Item</th>
              <th className="w-24 text-right">Price</th>
              <th className="w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center opacity-70">No data yet</td>
              </tr>
            )}
            {categories.map((c) => {
              const items = Array.isArray(c.items) && c.items.length > 0 ? c.items : []
              if (items.length === 0) {
                return (
                  <tr key={`${c.id}-empty`}>
                    <td>{c.name || c.id}</td>
                    <td className="opacity-60">—</td>
                    <td className="text-right"></td>
                    <td className="text-right"></td>
                  </tr>
                )
              }
              return items.map((it, idx) => {
                const key = `${c.id}:${idx}`
                const isEditing = editing.key === key
                return (
                  <tr key={key}>
                    <td>
                      {idx === 0 ? (
                        editingCat.id === c.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              className="input input-bordered input-xs"
                              value={editingCat.name}
                              onChange={(e) => setEditingCat((s) => ({ ...s, name: e.target.value }))}
                            />
                            <div className="join">
                              <button
                                className="btn btn-success btn-xs join-item"
                                onClick={async () => {
                                  try {
                                    const newId = await renameMenuCategory(c.id, editingCat.name.trim())
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
                                onClick={() => setEditingCat({ id: null, name: '' })}
                                title="Cancel"
                              >✕</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span>{c.name || c.id}</span>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setEditingCat({ id: c.id, name: c.name || c.id })}
                              title="Edit category"
                            >✎</button>
                          </div>
                        )
                      ) : ''}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="input input-bordered input-xs w-full"
                          value={editing.name}
                          onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
                        />
                      ) : (
                        it.name
                      )}
                    </td>
                    <td className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            className="input input-bordered input-xs w-20 text-right"
                            type="text"
                            inputMode="decimal"
                            value={editing.price}
                            onChange={(e) => setEditing((s) => ({ ...s, price: e.target.value }))}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                          <div className="join">
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${editing.veg !== false ? 'btn-success' : 'btn-ghost'}`}
                              onClick={() => setEditing((s) => ({ ...s, veg: true }))}
                            >V</button>
                            <button
                              type="button"
                              className={`btn btn-xs join-item ${editing.veg === false ? 'btn-error' : 'btn-ghost'}`}
                              onClick={() => setEditing((s) => ({ ...s, veg: false }))}
                            >NV</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span>{(it.price !== undefined && it.price !== '' ? `₹${it.price}` : '')}</span>
                          {it.veg !== false ? (
                            <span className="w-3 h-3 rounded-sm border-2 border-green-600 relative">
                              <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-green-600" style={{ top:0,bottom:0,left:0,right:0 }} />
                            </span>
                          ) : (
                            <span className="w-3 h-3 rounded-sm border-2 border-rose-600 relative">
                              <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-rose-600" style={{ top:0,bottom:0,left:0,right:0 }} />
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-right">
                      {isEditing ? (
                        <div className="join">
                          <button
                            className="btn btn-success btn-xs join-item"
                            onClick={async () => {
                              try {
                                const updated = categories.map((cat) =>
                                  cat.id === c.id
                                    ? { ...cat, items: cat.items.map((x, i) => (i === idx ? { name: editing.name.trim(), price: Number(editing.price) || 0, veg: editing.veg !== false } : x)) }
                                    : cat
                                )
                                setCategories(updated)
                                await setMenuItems(c.id, updated.find((x) => x.id === c.id).items)
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
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setEditing({ key, name: it.name, price: String(it.price ?? ''), veg: it.veg !== false })}
                          title="Edit"
                        >✎</button>
                      )}
                    </td>
                  </tr>
                )
              })
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

