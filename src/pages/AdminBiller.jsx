import { useEffect, useMemo, useState } from 'react'
import { fetchMenuCategories, createOrder, fetchImagesByIds, fetchRecentOrders, generateDailyOrderNo, fetchAllOrders, updateOrder, sendWhatsAppInvoice, fetchAppSettings } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

export default function AdminBiller() {
  const { user } = useAuth()
  const { pushToast } = useUI()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  const [items, setItems] = useState([]) // flattened items from categories
  const [catsMeta, setCatsMeta] = useState([]) // [{id,name}]
  const [q, setQ] = useState('')
  const [bill, setBill] = useState({}) // key -> { item, qty }
  const [payMethod, setPayMethod] = useState('cash') // cash | upi
  const [loading, setLoading] = useState(true)
  const [openCats, setOpenCats] = useState(() => new Set())
  const [imageMap, setImageMap] = useState({}) // { imageId: { data, mime } }
  const [recent, setRecent] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null) // { id, orderNo, items, subtotal }
  const [successPhone, setSuccessPhone] = useState('')
  const [editOrder, setEditOrder] = useState(null) // full order object when editing
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [allOrders, setAllOrders] = useState([])
  const [viewOrder, setViewOrder] = useState(null)
  const [confettiActive, setConfettiActive] = useState(false)
  const [appSettings, setAppSettings] = useState({ gstRate: 0.05, adminMobile: '' })
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewPhone, setReviewPhone] = useState('')
  const [reviewPhoneError, setReviewPhoneError] = useState('')
  // Calculator & tendering
  const [showCalc, setShowCalc] = useState(false)
  const [calcExpr, setCalcExpr] = useState('')

  // Close calculator on ESC
  useEffect(() => {
    if (!showCalc) return
    const onKey = (e) => { if (e.key === 'Escape') setShowCalc(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCalc])

  // Access check: keep client gate minimal; Firestore rules enforce real permissions
  useEffect(() => {
    let active = true
    async function check() {
      try {
        if (!user) { setAllowed(false); return }
        // Allow signed-in users; server-side rules will enforce roles.
        if (active) setAllowed(true)
      } catch {
        if (active) setAllowed(false)
      } finally {
        if (active) setChecking(false)
      }
    }
    check()
    return () => { active = false }
  }, [user])

  // Load menu
  useEffect(() => {
    let mounted = true
    // Load app settings (GST, admin mobile)
    fetchAppSettings().then((s) => { if (mounted) setAppSettings(s) }).catch(()=>{})
    fetchMenuCategories().then((cats) => {
      if (!mounted) return
      const flat = cats.flatMap((c) => (Array.isArray(c.items) ? c.items : []).map((it, idx) => ({
        id: `${c.id}-${idx}-${(it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: it.name,
        price: Number(it.price) || 0,
        veg: it.veg === false ? false : true,
        categoryId: c.id,
        imageId: it.imageId || null,
      })))
      setItems(flat)
      setCatsMeta(cats.map(c => ({ id: c.id, name: c.name || c.id })))
      const ids = Array.from(new Set(flat.map(i => i.imageId).filter(Boolean)))
      if (ids.length) {
        fetchImagesByIds(ids).then((map) => { if (mounted) setImageMap(map) })
      } else {
        setImageMap({})
      }
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  // Load recent orders (POS-only to keep focused) and refresh after new bill
  async function refreshRecent() {
    const list = await fetchRecentOrders(10, 'pos')
    setRecent(list)
  }
  useEffect(() => { refreshRecent() }, [])

  // When success modal opens, run confetti for a short time then stop
  useEffect(() => {
    if (success) {
      setConfettiActive(true)
      const t = setTimeout(() => setConfettiActive(false), 3000)
      return () => clearTimeout(t)
    } else {
      setConfettiActive(false)
    }
  }, [success])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter((it) => (it.name || '').toLowerCase().includes(term))
  }, [items, q])

  // Group filtered items by category
  const grouped = useMemo(() => {
    const map = new Map()
    for (const it of filtered) {
      const arr = map.get(it.categoryId) || []
      arr.push(it)
      map.set(it.categoryId, arr)
    }
    // Keep category order by catsMeta
    const groups = catsMeta
      .map(c => ({ id: c.id, name: c.name, items: map.get(c.id) || [] }))
      .filter(g => g.items.length > 0)
    // When searching, prioritize groups with more matches and then by name
    const term = q.trim()
    if (term) {
      groups.sort((a,b) => (b.items.length - a.items.length) || a.name.localeCompare(b.name))
    }
    return groups
  }, [filtered, catsMeta, q])

  // Auto-open matched groups on search
  useEffect(() => {
    const term = q.trim()
    if (!term) { setOpenCats(new Set()); return }
    // Open only the top-matching group to avoid clutter; user can expand others.
    const first = grouped.length ? grouped[0].id : null
    setOpenCats(first ? new Set([first]) : new Set())
  }, [q, grouped])

  function addLine(it) {
    setBill((prev) => {
      const key = it.id
      const cur = prev[key]
      const qty = (cur?.qty || 0) + 1
      return { ...prev, [key]: { item: it, qty } }
    })
    // If searching, collapse results after selecting to reduce clutter
    if (q.trim()) setOpenCats(new Set())
  }
  function decLine(key) {
    setBill((prev) => {
      const cur = prev[key]
      if (!cur) return prev
      const qty = (cur.qty || 0) - 1
      const next = { ...prev }
      if (qty <= 0) delete next[key]; else next[key] = { ...cur, qty }
      return next
    })
  }
  function incLine(key) {
    setBill((prev) => {
      const cur = prev[key]
      if (!cur) return prev
      return { ...prev, [key]: { ...cur, qty: (cur.qty || 0) + 1 } }
    })
  }
  function clearBill() {
    setBill({})
  }

  const lines = Object.values(bill)
  const subtotal = lines.reduce((s, l) => s + (l.item.price || 0) * (l.qty || 0), 0)
  const gstRate = typeof appSettings.gstRate === 'number' ? appSettings.gstRate : 0.05
  const gstAmount = Math.round(subtotal * gstRate)
  const grandTotal = subtotal + gstAmount

  async function submitBill() {
    if (!lines.length) { pushToast('Add items to bill', 'error'); return }
    // Validate phone number if provided: must be Indian 10-digit (strict)
    if (reviewPhone && !/^\d{10}$/.test(reviewPhone.replace(/\D/g,''))) {
      setReviewPhoneError('Enter 10-digit Indian mobile number')
      return
    }
    try {
      setSubmitting(true)
      const orderItems = lines.map(({ item, qty }) => ({ name: item.name, price: Number(item.price) || 0, qty }))
      const customer = {
        dineIn: true,
        table: null,
        servedBy: user?.email || user?.uid || 'biller',
        payment: { method: payMethod, status: 'paid' },
      }
      let createdOrderNo = null
      if (editOrder && editOrder.id) {
        await updateOrder(null, editOrder.id, { items: orderItems, subtotal, customer, orderType: 'dine-in', source: 'pos', taxRate: gstRate, taxAmount: gstAmount, totalAmount: grandTotal })
        pushToast(`Order updated #${editOrder.orderNo || editOrder.id}`, 'success')
        setEditOrder(null)
        await refreshRecent()
      } else {
        createdOrderNo = await generateDailyOrderNo('dine-in')
        const id = await createOrder({ userId: null, customer, items: orderItems, orderType: 'dine-in', source: 'pos', orderNo: createdOrderNo, taxRate: gstRate, taxAmount: gstAmount, totalAmount: grandTotal })
  setSuccess({ id, orderNo: createdOrderNo, items: orderItems, subtotal, gstAmount, total: grandTotal, gstRate })
        pushToast(`Bill created #${createdOrderNo}`, 'success')
        await refreshRecent()
      }
      // Build and send customer messages (WhatsApp full, SMS short) if phone provided
      try {
        const phoneRaw = (reviewPhone || '').replace(/\D/g,'')
        if (phoneRaw && phoneRaw.length === 10) {
          const store = appSettings || {}
          const header = `*${"Venky's Cheat Mealz"}*\n${store.shopAddress ? store.shopAddress + "\n" : ''}${store.shopPhone ? '📞 ' + store.shopPhone + "\n" : ''}${store.chefName ? '👨‍🍳 ' + store.chefName + "\n" : ''}`
          const linesText = orderItems.map(it => `• ${it.name} × ${it.qty} — ₹${(it.price||0)* (it.qty||0)}`).join('\n')
          const totals = `Subtotal: ₹${subtotal}\nGST (${Math.round(gstRate*100)}%): ₹${gstAmount}\n*Total: ₹${grandTotal}*`
          const thank = '\n\nThank you for dining with us!'
          const finalOrderNo = (editOrder?.orderNo) || createdOrderNo || ''
          const fullMsg = `${header}\nOrder #${finalOrderNo}\n\n${linesText}\n\n${totals}${thank}`
          const logoUrl = `${location.origin}/icons/logo.png`
          // WhatsApp (rich content through your backend template); we pass payload as before
          try { await sendWhatsAppInvoice(`91${phoneRaw}`, { orderNo: finalOrderNo, text: fullMsg, logoUrl, items: orderItems, subtotal, taxRate: gstRate, taxAmount: gstAmount, total: grandTotal, store: { name: "Venky's Cheat Mealz", address: store.shopAddress||'', phone: store.shopPhone||'', chef: store.chefName||'' } }) } catch {}
          // SMS fallback (short) - call backend directly to avoid import issues
          const smsText = `Venky's: Order ${finalOrderNo}: Total ₹${grandTotal}. Thank you!`
          try {
            const smsUrl = import.meta.env.VITE_SMS_FUNCTION_URL
            if (smsUrl) {
              await fetch(smsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: `91${phoneRaw}`, text: smsText }) })
            }
          } catch {}
        }
      } catch {}
      // Close review modal after successful action (create or update)
      setReviewOpen(false)
      clearBill()
      setQ('')
      setSuccessPhone('')
      setReviewPhone('')
      setReviewPhoneError('')
    } catch (e) {
      pushToast(e.message || 'Failed to create bill', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function loadAllOrders() {
    const res = await fetchAllOrders()
    if (Array.isArray(res)) setAllOrders(res)
    else if (Array.isArray(res.list)) setAllOrders(res.list)
  }

  // --- Calculator helpers ---
  function calcAppend(ch) {
    setCalcExpr((s) => (s + ch))
  }
  function calcClear() {
    setCalcExpr('')
  }
  function calcEval() {
    try {
      const safe = calcExpr.replace(/[^0-9+\-*/().]/g, '')
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${safe || '0'})`)()
      setCalcExpr(String(val))
    } catch {
      setCalcExpr('Err')
    }
  }

  if (checking) {
    return (
      <div className="page-wrap py-10"><span className="loading loading-spinner loading-lg text-primary" /></div>
    )
  }
  if (!allowed) {
    return (
      <div className="page-wrap py-10">
        <div className="alert alert-error">
          <span>Access denied. This page requires the biller role.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap py-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">Biller POS</h1>
        <div className="flex items-center gap-2">
          <select className="select select-sm select-bordered" value={payMethod} onChange={(e)=>setPayMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </select>
          {editOrder ? (
            <>
              <button className="btn btn-sm" onClick={() => { setEditOrder(null); clearBill() }}>Cancel edit</button>
              <button className="btn btn-primary btn-sm" onClick={() => setReviewOpen(true)} disabled={!lines.length || submitting}>{submitting ? 'Saving…' : 'Review'}</button>
            </>
          ) : (
            <>
              <button className="btn btn-sm" onClick={clearBill}>Clear</button>
              <button className="btn btn-primary btn-sm" onClick={() => setReviewOpen(true)} disabled={!lines.length || submitting}>{submitting ? 'Placing…' : 'Place order'}</button>
            </>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCalc(s => !s)} title="Calculator">🧮</button>
        </div>
      </div>

      {/* Floating calculator */}
      {showCalc && (
        <>
        <div className="fixed inset-0 z-40" onClick={()=>setShowCalc(false)} />
  <div className="fixed right-4 top-20 z-50 w-56 rounded-xl border border-primary/40 bg-base-100/90 backdrop-blur shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-sm">Calculator</div>
            <button className="btn btn-ghost btn-xs" onClick={()=>setShowCalc(false)}>✕</button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input className="input input-bordered input-xs flex-1" value={calcExpr} onChange={(e)=>setCalcExpr(e.target.value)} />
            <button className="btn btn-xs" onClick={calcClear}>C</button>
            <button className="btn btn-primary btn-xs" onClick={calcEval}>=</button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','+','('].map(ch => (
              <button key={ch} className="btn btn-ghost btn-xs" onClick={()=>calcAppend(ch)}>{ch}</button>
            ))}
            <button className="btn btn-ghost btn-xs" onClick={()=>calcAppend(')')}>)</button>
          </div>
        </div>
        </>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: item picker */}
  <div className="rounded-xl border border-primary/40 bg-base-100/70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <input className="input input-bordered input-sm w-full" placeholder="Search items" value={q} onChange={(e)=>setQ(e.target.value)} />
            {grouped.length > 0 && (
              (() => {
                const allOpen = grouped.every(g => openCats.has(g.id))
                const label = allOpen ? 'Collapse all' : 'Expand all'
                return (
                  <button className="btn btn-xs" onClick={() => setOpenCats(prev => {
                    if (allOpen) return new Set()
                    return new Set(grouped.map(g => g.id))
                  })}>{label}</button>
                )
              })()
            )}
          </div>
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <div className="space-y-2">
              {grouped.map(group => {
                const open = openCats.has(group.id)
                return (
                  <div key={group.id} className={`collapse collapse-arrow border border-primary/40 rounded-lg bg-base-100/60 shadow-sm ${open ? 'ring-0' : ''}`}>
                    <input type="checkbox" checked={open} onChange={() => setOpenCats(prev => { const next = new Set(prev); next.has(group.id) ? next.delete(group.id) : next.add(group.id); return next })} />
                    <div className="collapse-title py-2 px-3 pr-10 text-sm font-medium flex items-center justify-between gap-2">
                      <span className="truncate">{group.name}</span>
                      <span className="badge badge-outline badge-xs shrink-0">{group.items.length}</span>
                    </div>
                    <div className="collapse-content py-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {group.items.map(it => {
                          const obj = it.imageId && imageMap[it.imageId]
                          const imgUrl = obj ? `data:${obj.mime || 'image/*'};base64,${obj.data}` : null
                          return (
                            <button
                              key={it.id}
                              type="button"
                              className="group rounded-lg border border-primary/30 bg-base-100/70 p-2 text-left shadow-sm hover:border-primary/50 hover:shadow transition"
                              onClick={() => addLine(it)}
                              title={it.name}
                            >
                               <div className="w-full aspect-[5/4] rounded-md overflow-hidden bg-base-200 grid place-items-center">
                                {imgUrl ? (
                                   <img src={imgUrl} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                                ) : (
                                  <span className="text-xs opacity-50">No image</span>
                                )}
                              </div>
                               <div className="mt-1.5 text-[11px] font-medium leading-tight line-clamp-2 min-h-[2.1em]">{it.name}</div>
                               <div className="text-[10px] opacity-70 mt-0.5">₹{it.price}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
              {grouped.length === 0 && <div className="opacity-60 text-sm">No items match.</div>}
            </div>
          )}
        </div>
        {/* Right: current bill */}
  <div className="rounded-xl border border-primary/40 bg-base-100/70 p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Current Bill</h3>
          {lines.length === 0 && <div className="opacity-60 text-sm">No items added.</div>}
          {lines.length > 0 && (
            <div className="space-y-2">
              {Object.entries(bill).map(([key, line]) => (
                <div key={key} className="flex items-center gap-2 border border-primary/30 rounded p-2 shadow-sm">
                  <div className="flex-1">
                    <div className="font-medium leading-tight">{line.item.name}</div>
                    <div className="text-xs opacity-70">₹{line.item.price} each</div>
                  </div>
                  <div className="join">
                    <button className="btn btn-xs join-item" onClick={() => decLine(key)}>-</button>
                    <span className="px-3 text-sm join-item grid place-items-center">{line.qty}</span>
                    <button className="btn btn-xs join-item" onClick={() => incLine(key)}>+</button>
                  </div>
                  <div className="w-16 text-right font-medium">₹{(line.item.price || 0) * (line.qty || 0)}</div>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center justify-between">
                <div className="opacity-70">Subtotal</div>
                <div className="font-semibold">₹{subtotal}</div>
              </div>
              {/* Cash received removed as per request */}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
  <div className="mt-6 rounded-xl border border-primary/40 bg-base-100/70 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Recent Orders</h3>
          <div className="flex items-center gap-2">
            <button className="btn btn-xs" onClick={refreshRecent}>Refresh</button>
            <button className="btn btn-outline btn-xs" onClick={()=>{ setShowAllOrders(true); loadAllOrders() }}>View all</button>
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="opacity-60 text-sm">No recent orders.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Time</th>
                  <th>Payment</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">
                      <button className="link link-primary link-hover" onClick={()=>setViewOrder(o)}>{o.orderNo || o.id}</button>
                    </td>
                    <td className="capitalize text-xs">{o.orderType || '-'}</td>
                    <td>₹{o.totalAmount || o.subtotal || 0}</td>
                    <td className="text-xs opacity-70">{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleTimeString() : '-'}</td>
                    <td className="text-xs">{o.payment?.method || '-'}</td>
                    <td className="text-right">
                      <button className="btn btn-xs" onClick={()=>{
                        // Load into editor
                        const b = {}
                        for (const it of (o.items||[])) {
                          const refItem = items.find(x => x.name === it.name && Number(x.price) === Number(it.price))
                          const key = refItem ? refItem.id : `${it.name}-${it.price}`
                          b[key] = { item: refItem || { id: key, name: it.name, price: Number(it.price)||0 }, qty: Number(it.qty)||1 }
                        }
                        setBill(b)
                        setEditOrder(o)
                        setPayMethod(o.payment?.method || 'cash')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Orders Modal */}
      {showAllOrders && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowAllOrders(false)} />
          <div className="relative bg-base-100 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto border border-primary/40">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">All Orders</h3>
              <div className="flex items-center gap-2">
                <button className="btn btn-xs" onClick={loadAllOrders}>Refresh</button>
                <button className="btn btn-ghost btn-xs" onClick={()=>setShowAllOrders(false)}>✕</button>
              </div>
            </div>
            <div className="p-3 overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Order #</th><th>Type</th><th>Total</th><th>Time</th><th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map(o => (
                    <tr key={o.id}>
                      <td className="font-mono text-xs"><button className="link link-primary link-hover" onClick={()=>setViewOrder(o)}>{o.orderNo || o.id}</button></td>
                      <td className="capitalize text-xs">{o.orderType || '-'}</td>
                      <td>₹{o.totalAmount || o.subtotal || 0}</td>
                      <td className="text-xs opacity-70">{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : '-'}</td>
                      <td className="text-xs">{o.payment?.method || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setViewOrder(null)} />
          <div className="relative bg-base-100 rounded-xl shadow-xl w-full max-w-md border border-primary/40">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Order Details</h3>
              <button className="btn btn-ghost btn-xs" onClick={()=>setViewOrder(null)}>✕</button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <div>Order #</div>
                <div className="font-mono">{viewOrder.orderNo || viewOrder.id}</div>
              </div>
              <div className="text-xs opacity-70 mb-2">{viewOrder.createdAt?.toDate ? viewOrder.createdAt.toDate().toLocaleString() : ''}</div>
              <div className="divider my-2" />
              <div className="space-y-1 mb-2">
                {(viewOrder.items||[]).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="truncate mr-2">{it.name} <span className="opacity-60">× {it.qty}</span></div>
                    <div>₹{Number(it.price||0) * Number(it.qty||0)}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between font-medium">
                <div>Subtotal</div>
                <div>₹{viewOrder.subtotal || 0}</div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn btn-ghost btn-sm" onClick={()=>setViewOrder(null)}>Close</button>
                <button className="btn btn-primary btn-sm" onClick={()=>{
                  const o = viewOrder
                  const b = {}
                  for (const it of (o.items||[])) {
                    const refItem = items.find(x => x.name === it.name && Number(x.price) === Number(it.price))
                    const key = refItem ? refItem.id : `${it.name}-${it.price}`
                    b[key] = { item: refItem || { id: key, name: it.name, price: Number(it.price)||0 }, qty: Number(it.qty)||1 }
                  }
                  setBill(b)
                  setEditOrder(o)
                  setPayMethod(o.payment?.method || 'cash')
                  setViewOrder(null)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success modal with confetti */}
      {success && (
        <div className="fixed inset-0 z-[80]">
          {/* Confetti overlay */}
          {confettiActive && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="confetti">
                {Array.from({ length: 140 }).map((_, i) => {
                  const left = Math.random() * 100
                  const delay = Math.random() * 0.6
                  const duration = 2.6 + Math.random() * 2
                  const colors = ['#f59e0b','#ef4444','#22c55e','#3b82f6','#eab308']
                  const bg = colors[i % colors.length]
                  const style = { left: `${left}%`, backgroundColor: bg, animationDuration: `${duration}s`, animationDelay: `${delay}s` }
                  return <span key={i} style={style}></span>
                })}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50" onClick={()=>setSuccess(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-md border border-primary/40">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold">Order Placed</div>
                <button className="btn btn-ghost btn-xs" onClick={()=>setSuccess(null)}>✕</button>
              </div>
              <div className="p-4">
                {/* Receipt-style layout */}
                <div className="text-center mb-3">
                  <div className="text-lg font-bold">Venky's Cheat Mealz</div>
                  <div className="text-xs opacity-70">Dine-in | POS</div>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div>Order #</div>
                  <div className="font-mono font-semibold">{success.orderNo}</div>
                </div>
                <div className="flex items-center justify-between text-xs opacity-70 mb-3">
                  <div>{new Date().toLocaleDateString()}</div>
                  <div>{new Date().toLocaleTimeString()}</div>
                </div>
                <div className="divider my-2" />
                <div className="space-y-1 mb-2">
                  {(success.items && success.items.length > 0) ? success.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="truncate mr-2">{it.name} <span className="opacity-60">× {it.qty}</span></div>
                      <div>₹{Number(it.price||0) * Number(it.qty||0)}</div>
                    </div>
                  )) : (
                    <div className="text-xs opacity-70">Items saved with order.</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="opacity-80">Subtotal</div>
                  <div>₹{success.subtotal ?? 0}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="opacity-80">GST ({Math.round(((success.gstRate ?? 0.05) * 100))}%)</div>
                  <div>₹{success.gstAmount ?? Math.round((success.subtotal ?? 0) * (success.gstRate ?? 0.05))}</div>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <div>Total</div>
                  <div>₹{success.total ?? ((success.subtotal ?? 0) + Math.round((success.subtotal ?? 0) * (success.gstRate ?? 0.05)))}</div>
                </div>
                <div className="form-control mt-4">
                  <label className="label py-1">
                    <span className="label-text">Customer mobile (WhatsApp)</span>
                  </label>
                  <div className="flex gap-2">
                    <input className="input input-bordered input-sm flex-1" placeholder="10-digit mobile" value={successPhone} onChange={(e)=>setSuccessPhone(e.target.value)} />
                    {successPhone && <a className="btn btn-sm" href={`https://wa.me/91${successPhone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <button className="btn btn-primary" onClick={async ()=>{
                    try {
                      const phone = successPhone.replace(/\D/g,'')
                      if (phone && phone.length >= 10) {
                        const rate = success.gstRate ?? 0.05
                        const payload = { orderNo: success.orderNo, items: success.items, subtotal: success.subtotal, taxRate: rate, taxAmount: (success.gstAmount ?? Math.round((success.subtotal ?? 0) * rate)), total: (success.total ?? ((success.subtotal ?? 0) + Math.round((success.subtotal ?? 0) * rate))) }
                        await sendWhatsAppInvoice(`91${phone}`, payload)
                        pushToast('Invoice sent via WhatsApp', 'success')
                      }
                    } catch (e) {
                      pushToast('Failed to send WhatsApp invoice', 'error')
                    } finally {
                      setSuccess(null); setSuccessPhone('');
                    }
                  }}>Done</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal (confirm before saving) */}
      {reviewOpen && (
        <div className="fixed inset-0 z-[78] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setReviewOpen(false)} />
          <div className="relative bg-base-100 rounded-xl shadow-2xl w-full max-w-md border border-primary/40">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Review Order</div>
              <button className="btn btn-ghost btn-xs" onClick={()=>setReviewOpen(false)}>✕</button>
            </div>
            <div className="p-4">
              <div className="text-sm mb-2 flex items-center justify-between">
                <span className="opacity-70">Payment</span>
                <span className="font-medium uppercase">{payMethod}</span>
              </div>
              <div className="divider my-2" />
              {lines.length === 0 ? (
                <div className="opacity-70 text-sm">No items.</div>
              ) : (
                <div className="space-y-1 mb-3">
                  {Object.values(bill).map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="truncate mr-2">{l.item.name} <span className="opacity-60">× {l.qty}</span></div>
                      <div>₹{(l.item.price||0) * (l.qty||0)}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="opacity-80">Subtotal</div>
                <div>₹{subtotal}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="opacity-80">GST ({Math.round(gstRate*100)}%)</div>
                <div>₹{gstAmount}</div>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <div>Total</div>
                <div>₹{grandTotal}</div>
              </div>
              {/* Customer phone for e-bill */}
              <div className="form-control mt-3">
                <label className="label py-1"><span className="label-text">Customer mobile (+91, 10 digits)</span></label>
                <div className="flex items-center gap-2">
                  <span className="opacity-70 text-sm">+91</span>
                  <input
                    className={`input input-bordered input-sm flex-1 ${reviewPhoneError ? 'input-error' : ''}`}
                    placeholder="XXXXXXXXXX"
                    value={reviewPhone}
                    onChange={(e)=>{ setReviewPhone(e.target.value.replace(/\D/g,'')); setReviewPhoneError('') }}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="\\d{10}"
                  />
                </div>
                {reviewPhoneError && <span className="text-xs text-error mt-1">{reviewPhoneError}</span>}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn btn-ghost" onClick={()=>setReviewOpen(false)}>Back</button>
                <button className="btn btn-primary" onClick={submitBill} disabled={!lines.length || submitting}>{editOrder ? (submitting ? 'Saving…' : 'Save changes') : (submitting ? 'Checking out…' : 'Checkout')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
