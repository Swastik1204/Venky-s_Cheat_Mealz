import { useEffect, useMemo, useState, useRef } from 'react'
import { fetchMenuCategories, createOrder, fetchImagesByIds, fetchRecentOrders, generateDailyOrderNo, fetchAllOrders, updateOrder, sendWhatsAppInvoice, fetchAppSettings, getRandomOtp, BRAND_LONG, BRAND_SHORT } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { MdPayment, MdQrCode, MdCreditCard, MdHistory, MdSearch, MdKeyboardReturn } from 'react-icons/md'

const PAYMENT_OPTIONS = [
  { key: 'cod', label: 'Cash', helper: 'Collect cash at counter', icon: MdPayment },
  { key: 'upi', label: 'UPI', helper: 'Scan & pay (PhonePe/GPay)', icon: MdQrCode },
  { key: 'card', label: 'Card', helper: 'Swipe or tap card', icon: MdCreditCard },
]

const PAYMENT_LABELS = PAYMENT_OPTIONS.reduce((map, opt) => ({ ...map, [opt.key]: opt.label }), {})

function normalizePaymentMethod(method) {
  return PAYMENT_OPTIONS.some((opt) => opt.key === method) ? method : 'cod'
}

function formatPaymentMethod(method) {
  return PAYMENT_LABELS[method] || (method ? method.toUpperCase() : 'Unknown')
}

function timestampToDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : new Date(parsed)
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }
  return null
}

function getStatusHistory(order) {
  if (!order || !Array.isArray(order.statusHistory)) return []
  const sorted = [...order.statusHistory].sort((a, b) => {
    const da = timestampToDate(a?.at)?.getTime() ?? 0
    const db = timestampToDate(b?.at)?.getTime() ?? 0
    return da - db
  })
  return sorted.map((entry) => ({
    status: entry?.status || order.status || 'placed',
    at: timestampToDate(entry?.at) || timestampToDate(order.updatedAt) || timestampToDate(order.createdAt) || new Date(),
    actor: entry?.actor || 'system',
  }))
}

function getLatestStatus(order) {
  const history = getStatusHistory(order)
  if (history.length) return history[history.length - 1]
  return {
    status: order?.status || 'placed',
    at: timestampToDate(order?.updatedAt) || timestampToDate(order?.createdAt) || null,
    actor: order?.customer?.servedBy || 'system',
  }
}

function statusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'ready':
      return 'badge-success'
    case 'preparing':
      return 'badge-warning'
    case 'delivered':
      return 'badge-primary'
    case 'rejected':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

function paymentStatusBadge(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'badge-success'
    case 'pending':
      return 'badge-warning'
    case 'failed':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

export default function AdminBiller() {
  const { user } = useAuth()
  const { pushToast } = useUI()

  const [items, setItems] = useState([])
  const [catsMeta, setCatsMeta] = useState([])
  const [q, setQ] = useState('')
  const [bill, setBill] = useState({})
  const [payMethod, setPayMethod] = useState('cod')
  const [loading, setLoading] = useState(true)
  const [openCats, setOpenCats] = useState(() => new Set())
  
  // OTP State

  const [otpInput, setOtpInput] = useState('')
  const [expectedOtp, setExpectedOtp] = useState(null)
  const [otpSending, setOtpSending] = useState(false)
  const searchInputRef = useRef(null)

  // New State for Redesign
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [checkoutStep, setCheckoutStep] = useState(0) // 0: closed, 1: details, 2: payment
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' })
  
  const [imageMap, setImageMap] = useState({})
  const [recent, setRecent] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [successPhone, setSuccessPhone] = useState('')
  const [editOrder, setEditOrder] = useState(null)
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [allOrders, setAllOrders] = useState([])
  const [viewOrder, setViewOrder] = useState(null)
  const [confettiActive, setConfettiActive] = useState(false)
  const [appSettings, setAppSettings] = useState({ gstRate: 0.05, adminMobile: '' })

  const [showCalc, setShowCalc] = useState(false)
  const [calcExpr, setCalcExpr] = useState('')

  useEffect(() => {
    if (!showCalc) return
    const onKey = (e) => { if (e.key === 'Escape') setShowCalc(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCalc])

  useEffect(() => {
    let mounted = true
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
      
      // Collect all image IDs (items + categories)
      const itemImageIds = flat.map(i => i.imageId).filter(Boolean)
      const catImageIds = cats.map(c => {
        if (c.image || c.imageUrl || c.img) return null // URL, not ID
        // If no URL, try to find first item with image
        const first = (c.items || []).find(i => i.imageId)
        return first ? first.imageId : null
      }).filter(Boolean)
      
      setCatsMeta(cats.map(c => {
        let img = c.image || c.imageUrl || c.img
        let isId = false
        if (!img) {
           const first = (c.items || []).find(i => i.imageId)
           if (first) { img = first.imageId; isId = true }
        }
        return { id: c.id, name: c.name || c.id, image: img, isId }
      }))

      const ids = Array.from(new Set([...itemImageIds, ...catImageIds]))
      if (ids.length) {
        // Try to load from local storage first
        let cachedMap = {}
        try {
          const raw = localStorage.getItem('biller_image_map')
          if (raw) cachedMap = JSON.parse(raw)
        } catch { /* ignore */ }

        const missingIds = ids.filter(id => !cachedMap[id])
        
        if (mounted) setImageMap(cachedMap)

        if (missingIds.length > 0) {
          // Fetch missing in background
          fetchImagesByIds(missingIds).then((newMap) => {
            if (!mounted) return
            const combined = { ...cachedMap, ...newMap }
            setImageMap(combined)
            try {
              localStorage.setItem('biller_image_map', JSON.stringify(combined))
            } catch (e) {
              console.warn('Failed to cache images to localStorage', e)
            }
          }).catch(err => console.warn('Failed to fetch images', err))
        }
      } else {
        setImageMap({})
      }
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  async function refreshRecent() {
    const list = await fetchRecentOrders(10, 'pos')
    setRecent(list)
  }
  useEffect(() => { refreshRecent() }, [])

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

  const grouped = useMemo(() => {
    const map = new Map()
    for (const it of filtered) {
      const arr = map.get(it.categoryId) || []
      arr.push(it)
      map.set(it.categoryId, arr)
    }
    const groups = catsMeta
      .map(c => ({ id: c.id, name: c.name, items: map.get(c.id) || [] }))
      .filter(g => g.items.length > 0)
    const term = q.trim()
    if (term) {
      groups.sort((a,b) => (b.items.length - a.items.length) || a.name.localeCompare(b.name))
    }
    return groups
  }, [filtered, catsMeta, q])

  useEffect(() => {
    const term = q.trim()
    if (!term) { setOpenCats(new Set()); return }
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
  function clearBill() { setBill({}) }

  const lines = Object.values(bill)
  const subtotal = lines.reduce((s, l) => s + (l.item.price || 0) * (l.qty || 0), 0)
  const gstRate = typeof appSettings.gstRate === 'number' ? appSettings.gstRate : 0.05
  const gstAmount = Math.round(subtotal * gstRate)
  const grandTotal = subtotal + gstAmount

  const buildPaymentPayload = (method) => {
    const normalized = normalizePaymentMethod(method)
    const collectedBy = user?.uid || user?.email || 'pos'
    const nowIso = new Date().toISOString()
    const payload = {
      method: normalized,
      status: 'paid',
      collectedBy,
      collectedAt: nowIso,
      metadata: {
        channel: 'pos',
        terminal: 'counter',
        recordedAt: nowIso,
        reviewMode,
      },
    }
    if (normalized !== 'cod') {
      payload.reference = `POS-${Date.now().toString(36)}`
    }
    return payload
  }

  async function handleCheckoutNext() {
    if (checkoutStep === 1) {
       if (!customerDetails.name.trim()) { pushToast('Enter customer name', 'error'); return }
       if (!/^\d{10}$/.test(customerDetails.phone)) { pushToast('Enter valid 10-digit phone', 'error'); return }
       setCheckoutStep(2)
    } else if (checkoutStep === 2) {
       if (payMethod === 'cod') {
          setOtpSending(true)
          try {
             const otpDoc = await getRandomOtp()
             if (!otpDoc) {
                if (confirm('No OTPs found. Proceed without OTP?')) {
                   await submitBill()
                }
                return
             }
             const code = otpDoc.code
             setExpectedOtp(code)
             
             const managerPhone = appSettings.cashManagerPhone || appSettings.adminMobile
             if (managerPhone) {
                const msg = `*New Dine-in Order OTP*\nCode: *${code}*\nTotal: ₹${grandTotal}`
                const smsUrl = import.meta.env.VITE_SMS_FUNCTION_URL
                if (smsUrl) {
                  fetch(smsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: `91${managerPhone}`, text: `Venky's OTP: ${code} for order ₹${grandTotal}` }) }).catch(console.error)
                }
                console.log('Sending OTP to Manager:', managerPhone, msg)
             } else {
               pushToast('Manager mobile not set. OTP shown in console.', 'warning')
               console.log('OTP:', code)
             }
             setCheckoutStep(3)
             setOtpInput('')
          } catch (e) {
             pushToast('OTP Error: ' + e.message, 'error')
          } finally {
             setOtpSending(false)
          }
       } else {
          await submitBill()
       }
    } else if (checkoutStep === 3) {
       if (otpInput === expectedOtp) {
          await submitBill()
       } else {
          pushToast('Incorrect OTP', 'error')
       }
    }
  }

  async function submitBill() {
    if (!lines.length) { pushToast('Add items to bill', 'error'); return }
    try {
      setSubmitting(true)
      const orderItems = lines.map(({ item, qty }) => ({ name: item.name, price: Number(item.price) || 0, qty }))
      const payment = buildPaymentPayload(payMethod)
      const customer = { 
        dineIn: true, 
        servedBy: user?.email || user?.uid || 'biller', 
        payment,
        name: customerDetails.name,
        phone: customerDetails.phone
      }
      
      let createdOrderNo = null
      if (editOrder && editOrder.id) {
        await updateOrder(null, editOrder.id, { items: orderItems, subtotal, customer, orderType: 'dine-in', source: 'pos', taxRate: gstRate, taxAmount: gstAmount, totalAmount: grandTotal }, user?.uid || user?.email || 'pos')
        pushToast(`Order updated #${editOrder.orderNo || editOrder.id}`, 'success')
        setEditOrder(null)
        await refreshRecent()
      } else {
        createdOrderNo = await generateDailyOrderNo('dine-in', user?.uid || user?.email || 'POS')
        const id = await createOrder({ userId: null, customer, items: orderItems, orderType: 'dine-in', source: 'pos', orderNo: createdOrderNo, taxRate: gstRate, taxAmount: gstAmount, totalAmount: grandTotal })
        setSuccess({ id, orderNo: createdOrderNo, items: orderItems, subtotal, gstAmount, total: grandTotal, gstRate, payment })
        pushToast(`Bill created #${createdOrderNo}`, 'success')
        await refreshRecent()
      }
      
      // Send Invoice automatically if phone provided
      if (customerDetails.phone) {
          const phoneRaw = customerDetails.phone
          const finalOrderNo = (editOrder?.orderNo) || createdOrderNo || ''
          const itemsList = orderItems.map(it => `${it.qty} x ${it.name} (₹${(it.price||0)* (it.qty||0)})`).join(', ')
          const templatePayload = {
            templateName: 'venkys_order_bill',
            templateLanguage: 'en',
            components: [
              { type: 'body', parameters: [
                  { type: 'text', text: customerDetails.name || 'Valued Customer' },
                  { type: 'text', text: String(finalOrderNo) },
                  { type: 'text', text: String(grandTotal) },
                  { type: 'text', text: itemsList },
                  { type: 'text', text: 'Dine-in' }
                ]
              }
            ]
          }
          try { await sendWhatsAppInvoice(`91${phoneRaw}`, templatePayload) } catch { /* noop */ }
      }

      setCheckoutStep(0)
      setCustomerDetails({ name: '', phone: '' })
      clearBill(); setQ(''); setSuccessPhone(''); setReviewPhone(''); setReviewMode('save'); setReviewPhoneError('')
    } catch (e) {
      pushToast(e.message || 'Failed to create bill', 'error')
    } finally { setSubmitting(false) }
  }

  async function loadAllOrders() {
    const res = await fetchAllOrders()
    if (Array.isArray(res)) setAllOrders(res)
    else if (Array.isArray(res.list)) setAllOrders(res.list)
  }

  function calcAppend(ch) { setCalcExpr((s) => (s + ch)) }
  function calcClear() { setCalcExpr('') }
  function calcEval() {
    try {
      const safe = calcExpr.replace(/[^0-9+\-*/().]/g, '')
      const val = Function(`"use strict"; return (${safe || '0'})`)()
      setCalcExpr(String(val))
    } catch { setCalcExpr('Err') }
  }

  const viewOrderHistory = viewOrder ? getStatusHistory(viewOrder) : []
  const viewOrderPayment = viewOrder?.payment || null

  return (
    <div className="page-wrap py-6 pb-32">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold"><span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Biller POS</span></h2>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" onClick={clearBill}>Clear</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCalc(s => !s)} title="Calculator">🧮</button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
        <input 
          ref={searchInputRef}
          type="text" 
          className="input input-bordered w-full pl-10" 
          placeholder="Search items..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
      </div>

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

      {/* Main Content */}
      {!selectedCategory && !q ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {catsMeta.map(cat => {
             const imgObj = cat.isId ? imageMap[cat.image] : null
             const imgUrl = imgObj ? `data:${imgObj.mime};base64,${imgObj.data}` : (cat.image || '/icons/icon-192x192.png')
             return (
               <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition cursor-pointer active:scale-95 rounded-2xl">
                 <figure className="px-4 pt-4">
                   <img src={imgUrl} alt={cat.name} className="rounded-xl h-32 w-full object-cover bg-base-200" onError={(e) => { e.target.onerror = null; e.target.src = '/icons/icon-192x192.png' }} />
                 </figure>
                 <div className="card-body items-center text-center p-4">
                   <h2 className="card-title text-sm">{cat.name}</h2>
                 </div>
               </div>
             )
          })}
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Sidebar Categories */}
          <div className="w-48 shrink-0 overflow-y-auto pr-2 hidden md:block border-r border-base-200">
            <button 
              className="btn btn-sm btn-ghost w-full justify-start mb-2 gap-2" 
              onClick={() => { setSelectedCategory(null); setQ('') }}
            >
              <MdKeyboardReturn /> All Categories
            </button>
            <div className="flex flex-col gap-1">
              {catsMeta.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm justify-start text-left h-auto py-2 ${selectedCategory?.id === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="flex items-center gap-2 mb-4 md:hidden">
               <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedCategory(null); setQ('') }}>
                 <MdKeyboardReturn /> Back
               </button>
               <h3 className="font-bold text-lg truncate">{selectedCategory?.name || 'Search Results'}</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
               {(q ? filtered : (grouped.find(g => g.id === selectedCategory?.id)?.items || [])).map(it => {
                  const obj = it.imageId && imageMap[it.imageId]
                  const imgUrl = obj ? `data:${obj.mime || 'image/*'};base64,${obj.data}` : null
                  const qty = bill[it.id]?.qty || 0
                  return (
                    <button key={it.id} type="button" className={`group relative rounded-lg border bg-base-100 p-2 text-left shadow-sm transition ${qty > 0 ? 'border-primary ring-1 ring-primary' : 'border-base-300 hover:border-primary/50'}`} onClick={() => addLine(it)}>
                      <div className="w-full aspect-[5/4] rounded-lg overflow-hidden bg-base-200 grid place-items-center relative">
                        <img 
                          src={imgUrl || '/icons/icon-192x192.png'} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.onerror = null; e.target.src = '/icons/icon-192x192.png' }} 
                        />
                        {qty > 0 && (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl">
                              {qty}
                           </div>
                        )}
                      </div>
                      <div className="mt-1.5 text-[11px] font-medium leading-tight line-clamp-2 min-h-[2.1em]">{it.name}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">₹{it.price}</div>
                      {qty > 0 && (
                         <div className="mt-2 flex items-center justify-between bg-base-200 rounded p-1" onClick={e => e.stopPropagation()}>
                            <div className="btn btn-xs btn-ghost px-1 h-6 min-h-0" onClick={() => decLine(it.id)}>-</div>
                            <div className="text-xs font-bold">{qty}</div>
                            <div className="btn btn-xs btn-ghost px-1 h-6 min-h-0" onClick={() => incLine(it.id)}>+</div>
                         </div>
                      )}
                    </button>
                  )
               })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Checkout Bar */}
      {lines.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-64 md:right-8 z-30">
           <div className="bg-base-100 shadow-2xl rounded-2xl p-4 flex justify-between items-center border border-primary/20 max-w-2xl mx-auto">
              <div className="flex items-center gap-4">
                 <div className="indicator">
                    <span className="indicator-item badge badge-primary">{lines.reduce((a,b)=>a+b.qty,0)}</span>
                    <button className="btn btn-circle btn-ghost btn-sm" onClick={clearBill}>✕</button>
                 </div>
                 <div>
                    <div className="text-xs opacity-70">Total</div>
                    <div className="font-bold text-lg">₹{grandTotal}</div>
                 </div>
              </div>
              <button onClick={() => setCheckoutStep(1)} className="btn btn-primary px-8">Checkout</button>
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutStep > 0 && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
               {checkoutStep === 1 && 'Customer Details'}
               {checkoutStep === 2 && 'Payment Method'}
               {checkoutStep === 3 && 'Verify OTP'}
            </h3>
            
            {checkoutStep === 1 && (
               <div className="space-y-4">
                  <div className="form-control">
                     <label className="label"><span className="label-text">Name</span></label>
                     <input className="input input-bordered" value={customerDetails.name} onChange={e => setCustomerDetails(s => ({...s, name: e.target.value}))} placeholder="Customer Name" autoFocus />
                  </div>
                  <div className="form-control">
                     <label className="label"><span className="label-text">Phone</span></label>
                     <input className="input input-bordered" value={customerDetails.phone} onChange={e => setCustomerDetails(s => ({...s, phone: e.target.value.replace(/\D/g,'')}))} placeholder="10-digit Mobile" maxLength={10} />
                  </div>
               </div>
            )}

            {checkoutStep === 2 && (
               <div className="grid gap-2">
                  {PAYMENT_OPTIONS.map(opt => (
                     <button key={opt.key} onClick={() => setPayMethod(opt.key)} className={`btn justify-start h-auto py-3 ${payMethod === opt.key ? 'btn-primary' : 'btn-outline'}`}>
                        <opt.icon className="w-6 h-6 mr-2" />
                        <div className="text-left">
                           <div className="font-bold">{opt.label}</div>
                           <div className="text-xs font-normal opacity-70">{opt.helper}</div>
                        </div>
                     </button>
                  ))}
               </div>
            )}

            {checkoutStep === 3 && (
               <div className="text-center">
                  <p className="mb-4">Enter the OTP sent to the Cash Manager.</p>
                  <input className="input input-bordered text-center text-2xl tracking-widest w-full font-mono" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g,''))} maxLength={4} autoFocus />
               </div>
            )}

            <div className="modal-action">
               <button className="btn" onClick={() => setCheckoutStep(0)}>Cancel</button>
               <button className="btn btn-primary" onClick={handleCheckoutNext} disabled={otpSending || submitting}>
                  {otpSending ? 'Sending...' : submitting ? 'Processing...' : (checkoutStep === 3 ? 'Verify & Place' : 'Next')}
               </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-[80]">
          {confettiActive && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="confetti">
                {Array.from({ length: 120 }).map((_, i) => {
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
                <div className="text-center mb-3">
                  <div className="text-lg font-bold">{BRAND_LONG}</div>
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
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase opacity-70">Payment</div>
                    <div className="font-semibold">{formatPaymentMethod(success.payment?.method || payMethod)}</div>
                  </div>
                  <span className={`badge ${paymentStatusBadge(success.payment?.status || 'paid')}`}>{(success.payment?.status || 'paid').toUpperCase()}</span>
                </div>
                <div className="mt-4 text-center">
                  <button className="btn btn-primary" onClick={()=>setSuccess(null)}>Done</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
