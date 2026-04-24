// AdminBiller — POS billing interface for walk-in orders
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'

import { useNavigate } from 'react-router-dom'
import { MdPayment, MdQrCode, MdSearch, MdKeyboardReturn, MdRestaurantMenu } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchMenuCategories, createOrder, fetchImagesByIdsCached, getImageDataUrl, fetchRecentOrders, generateDailyOrderNo, updateOrder, fetchAppSettings, BRAND_LONG, BRAND_SHORT, ensureGuestUser, GUEST_USER_ID, createRazorpayOrder, verifyRazorpayPayment, getRazorpayKeyId } from '../lib/data'

const PAYMENT_OPTIONS = [
  { key: 'cod', label: 'Cash', helper: 'Collect cash at counter', icon: MdPayment },
  { key: 'online', label: 'Online Payment', helper: 'Razorpay (UPI / Card)', icon: MdQrCode },
]

const PAYMENT_LABELS = PAYMENT_OPTIONS.reduce((map, opt) => ({ ...map, [opt.key]: opt.label }), {})

// ── Helpers ──

function normalizePaymentMethod(method) {
  return PAYMENT_OPTIONS.some((opt) => opt.key === method) ? method : 'cod'
}

function formatPaymentMethod(method) {
  return PAYMENT_LABELS[method] || (method ? method.toUpperCase() : 'Unknown')
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
  const { user, canAccess } = useAuth()
  const hasPageAccess = canAccess('biller')
  const { pushToast } = useUI()
  const navigate = useNavigate()

  // ── State & refs ──
  const [items, setItems] = useState([])
  const [catsMeta, setCatsMeta] = useState([])
  const [q, setQ] = useState('')
  const [bill, setBill] = useState({})
  const [payMethod, setPayMethod] = useState('cod')
  const [guestMode, setGuestMode] = useState(false)
  const [activeContactField, setActiveContactField] = useState(null) // 'name' | 'phone' | null
  const [contactSuggestions, setContactSuggestions] = useState([])
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [brokenCatImages, setBrokenCatImages] = useState({})
  const [brokenItemImages, setBrokenItemImages] = useState({})
  
  const searchInputRef = useRef(null)

  const ensureRazorpay = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window object not available'))
    }
    if (window.Razorpay) {
      return Promise.resolve(window.Razorpay)
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => {
          if (window.Razorpay) resolve(window.Razorpay); else reject(new Error('Razorpay SDK unavailable after load'))
        }, { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')), { once: true })
      })
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => { if (window.Razorpay) resolve(window.Razorpay); else reject(new Error('Razorpay SDK unavailable after load')) }
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })
  }, [])

  // New State for Redesign
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [checkoutStep, setCheckoutStep] = useState(0) // 0: closed, 1: details, 2: payment
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' })
  
  const [imageMap, setImageMap] = useState({})
  const [recent, setRecent] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [editOrder, setEditOrder] = useState(null)

  const [showCalc, setShowCalc] = useState(false)
  const [calcExpr, setCalcExpr] = useState('')


  useEffect(() => {
    if (!showCalc) return
    const onKey = (e) => { if (e.key === 'Escape') setShowCalc(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCalc])



  // ── Data loading ──
  useEffect(() => {
    let mounted = true
    fetchMenuCategories().then((cats) => {
      if (!mounted) return
      const flat = cats.flatMap((c) => (Array.isArray(c.items) ? c.items : []).map((it, idx) => ({
        id: `${c.id}-${idx}-${(it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: it.name,
        rate: Number(it.rate ?? it.price) || 0,
        veg: it.veg === false ? false : true,
        categoryId: c.id,
        imageId: it.imageId || null,
        image: (() => {
          const v = it.image || it.imageUrl || it.image_url || it.img || it.url
          return typeof v === 'string' ? v : ''
        })(),
      })))
      setItems(flat)
      
      // Build category metadata once
      const catMeta = cats.map((c) => {
        const asTrimmedString = (v) => (typeof v === 'string' ? v.trim() : '')
        const asImageObject = (v) => {
          if (!v || typeof v !== 'object') return null
          const data = asTrimmedString(v.data)
          const url = asTrimmedString(v.url)
          const mime = asTrimmedString(v.mime)
          if (url) return { url }
          if (data) return { data, mime: mime || null }
          return null
        }
        const pickId = (...vals) => {
          for (const v of vals) {
            if (!v) continue
            if (typeof v === 'string' && v.trim()) return v.trim()
            if (typeof v === 'object') {
              const fromObj = asTrimmedString(v.id) || asTrimmedString(v.imageId) || asTrimmedString(v.image_id) || asTrimmedString(v.value)
              if (fromObj) return fromObj
            }
          }
          return ''
        }

        // Match customer app behavior: category imageId lives on the category doc.
        // We allow a minimal fallback to first item's imageId so the POS still shows something.
        const explicitId = pickId(
          c.imageId,
          c.categoryImageId,
          c.category_image_id,
          c.categoryImageID,
          c.image_id,
          c.imgId,
        )
        const firstItemImageId = pickId((c.items || []).find((it) => it?.imageId)?.imageId)
        const imageId = (explicitId || firstItemImageId) ? (explicitId || firstItemImageId) : null

        const imageRaw = c.image || c.imageUrl || c.image_url || c.img || c.url || c.categoryImage || c.categoryImageUrl
        const image = typeof imageRaw === 'string' ? imageRaw : ''
        const imageObj = image ? null : asImageObject(imageRaw)
        return { id: c.id, name: c.name || c.id, imageId, image, imageObj }
      })
      setCatsMeta(catMeta)

      // Collect all unique image IDs (items + categories) and load once.
      const ids = Array.from(new Set([
        ...flat.map(i => i.imageId).filter(Boolean),
        ...catMeta.map(c => c.imageId).filter(Boolean),
      ]))

      if (ids.length) {
        fetchImagesByIdsCached(ids).then((map) => {
          if (!mounted) return
          setImageMap(map || {})
        }).catch(err => console.warn('Failed to fetch images', err))
      }
    })
    return () => { mounted = false }
  }, [])

  // If the image map refreshes, allow previously broken images to re-attempt.
  useEffect(() => {
    setBrokenCatImages({})
    setBrokenItemImages({})
  }, [imageMap])

  async function refreshRecent() {
    const list = await fetchRecentOrders(10, 'pos')
    setRecent(list)
  }
  useEffect(() => { refreshRecent() }, [])


  // Contact suggestions (from recent POS orders) driven by the active input
  useEffect(() => {
    if (!activeContactField) {
      setContactSuggestions([])
      setShowContactDropdown(false)
      return
    }

    const rawTerm = activeContactField === 'name'
      ? (customerDetails.name || '')
      : (customerDetails.phone || '')

    const term = String(rawTerm).trim().toLowerCase()
    const minLen = activeContactField === 'phone' ? 3 : 2
    if (!term || term.length < minLen) {
      setContactSuggestions([])
      setShowContactDropdown(false)
      return
    }

    const matches = recent
      .map(o => {
        const name = String(o.customer?.name || '').trim()
        const phone = String(o.customer?.phone || o.phone || '').replace(/\D/g, '').slice(-10)
        return { name, phone }
      })
      .filter(c => c.phone && c.name)
      .filter(c => {
        const nameHit = c.name.toLowerCase().includes(term)
        const phoneHit = c.phone.includes(term.replace(/\D/g, ''))
        return activeContactField === 'name' ? nameHit : phoneHit
      })
      .filter((v, i, a) => a.findIndex(t => t.phone === v.phone) === i)
      .slice(0, 6)

    setContactSuggestions(matches)
    setShowContactDropdown(matches.length > 0)
  }, [activeContactField, customerDetails.name, customerDetails.phone, recent])

  const toDataUrl = (str) => {
    const clean = String(str || '').trim()
    if (!clean) return ''
    if (/^https?:\/\//i.test(clean)) return clean
    if (clean.startsWith('data:')) return clean
    return `data:image/*;base64,${clean}`
  }

  // Memoize item image URLs to prevent flicker
  const itemImageUrls = useMemo(() => {
    const urls = {}
    for (const it of items) {
      if (it.imageId && imageMap[it.imageId]) {
        const url = getImageDataUrl(imageMap[it.imageId])
        if (url) urls[it.id] = url
      } else if (it.image) {
        urls[it.id] = toDataUrl(it.image)
      }
    }
    return urls
  }, [items, imageMap])

  // Memoize category image URLs to prevent flicker on re-renders
  const catImageUrls = useMemo(() => {
    const urls = {}
    for (const cat of catsMeta) {
      if (cat.imageId && imageMap[cat.imageId]) {
        const url = getImageDataUrl(imageMap[cat.imageId])
        if (url) {
          urls[cat.id] = url
          continue
        }
        continue
      }
      if (cat.imageObj) {
        const url = getImageDataUrl(cat.imageObj)
        if (url) {
          urls[cat.id] = url
          continue
        }
      }
      if (cat.image) {
        urls[cat.id] = toDataUrl(cat.image)
        continue
      }
      const fallbackItem = items.find((it) => it.categoryId === cat.id && (itemImageUrls[it.id] || it.image))
      if (fallbackItem) {
        urls[cat.id] = itemImageUrls[fallbackItem.id] || toDataUrl(fallbackItem.image)
        continue
      }
      urls[cat.id] = '/icons/icon-192x192.png'
    }
    return urls
  }, [catsMeta, imageMap, items, itemImageUrls])

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

  // ── Bill handlers ──
  function addLine(it) {
    setBill((prev) => {
      const key = it.id
      const cur = prev[key]
      const qty = (cur?.qty || 0) + 1
      return { ...prev, [key]: { item: it, qty } }
    })
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
  const subtotal = lines.reduce((s, l) => s + (Number(l.item?.rate ?? l.item?.price) || 0) * (l.qty || 0), 0)
  const grandTotal = subtotal

  const buildPaymentPayload = (method) => {
    const normalized = normalizePaymentMethod(method)
    const collectedBy = user?.uid || user?.email || 'pos'
    const nowIso = new Date().toISOString()
    const payload = {
      method: normalized,
      status: normalized === 'cod' ? 'pending' : 'paid',
      collectedBy,
      collectedAt: nowIso,
      metadata: {
        channel: 'pos',
        terminal: 'counter',
        recordedAt: nowIso,
      },
    }
    if (normalized !== 'cod') {
      payload.reference = `POS-${Date.now().toString(36)}`
    }
    return payload
  }

  async function handleCheckoutNext() {
    if (checkoutStep === 1) {
       if (!guestMode) {
         if (!customerDetails.name.trim()) { pushToast('Enter customer name', 'error'); return }
         if (!/^\d{10}$/.test(customerDetails.phone)) { pushToast('Enter valid 10-digit phone', 'error'); return }
       }
       setCheckoutStep(2)
    } else if (checkoutStep === 2) {
       if (payMethod === 'cod') {
          try {
            await submitBill({ navigateToOrders: false })
           } catch (e) {
              pushToast('Error: ' + e.message, 'error')
           }
       } else if (payMethod === 'online') {
         try {
           // Get Razorpay key from environment
           const keyId = await getRazorpayKeyId()
           if (!keyId) {
             throw new Error('Online payments are not configured. Please check browser console for details, or contact admin to add RAZORPAY_KEY_ID to Vercel environment variables.')
           }
           if (!grandTotal || grandTotal <= 0) throw new Error('Amount must be greater than zero.')

           const razorpayOrder = await createRazorpayOrder(Number(grandTotal))
           const RazorpayCtor = await ensureRazorpay()
           let settled = false
           const paymentResponse = await new Promise((resolve, reject) => {
             const instance = new RazorpayCtor({
               key: keyId,
               amount: razorpayOrder.amount,
               currency: razorpayOrder.currency,
               name: BRAND_LONG,
               description: 'POS dine-in payment',
               order_id: razorpayOrder.orderId,
               prefill: {
                 name: customerDetails.name || 'Dine-in Guest',
                 contact: customerDetails.phone || '',
               },
               notes: { source: 'admin_pos' },
               handler: (response) => {
                 if (settled) return
                 settled = true
                 resolve(response)
               },
               modal: {
                 ondismiss: () => { if (!settled) { settled = true; reject(new Error('Payment cancelled')) } }
               }
             })
             instance.on('payment.failed', (event) => {
               if (settled) return
               settled = true
               const description = event?.error?.description || 'Payment failed'
               reject(new Error(description))
             })
             instance.open()
           })

           const verification = await verifyRazorpayPayment({
             orderId: razorpayOrder.orderId,
             paymentId: paymentResponse.razorpay_payment_id,
             signature: paymentResponse.razorpay_signature,
           })
           if (!verification?.valid) {
             throw new Error('Payment verification failed.')
           }

           const paymentOverride = {
             method: 'online',
             status: 'paid',
             reference: paymentResponse.razorpay_payment_id,
             gateway: 'razorpay',
             orderId: razorpayOrder.orderId,
           }

           await submitBill({ otpVerified: true, navigateToOrders: false, paymentOverride })
         } catch (e) {
           console.error('Online payment failed', e)
           pushToast(e.message || 'Online payment failed', 'error')
         }
       } else {
         await submitBill()
       }
    }
  }

    async function submitBill({ navigateToOrders = false, paymentOverride = null } = {}) {
    if (!lines.length) { pushToast('Add items to bill', 'error'); return }
    try {
      setSubmitting(true)

      const userIdForOrder = guestMode ? await ensureGuestUser() : null
      const orderItems = lines.map(({ item, qty }) => ({ name: item.name, rate: Number(item.rate ?? item.price) || 0, qty }))
      const payment = paymentOverride || buildPaymentPayload(payMethod)
      const customer = { 
        dineIn: true, 
        servedBy: user?.email || user?.uid || 'biller', 
        payment,
        name: guestMode ? 'Guest' : (customerDetails.name || 'Guest'),
        phone: guestMode ? '' : (customerDetails.phone || '')
      }
      
      let createdOrderNo = null
      if (editOrder && editOrder.id) {
        const targetUserId = editOrder.userId || (guestMode ? GUEST_USER_ID : null)
        await updateOrder(targetUserId, editOrder.id, { items: orderItems, subtotal, customer, orderType: 'dine-in', source: 'pos', totalAmount: grandTotal }, user?.uid || user?.email || 'pos')
        pushToast(`Order updated #${editOrder.orderNo || editOrder.id}`, 'success')
        setEditOrder(null)
        await refreshRecent()
      } else {
        createdOrderNo = await generateDailyOrderNo('dine-in', user?.uid || user?.email || 'POS')
        const now = new Date()
        const guestMeta = guestMode ? {
          guestOrder: true,
          guestOrderDate: now.toISOString().slice(0, 10),
          guestOrderAt: now.toISOString(),
        } : {}

        const initialStatus = payment?.status === 'paid' ? 'preparing' : 'placed'

        const id = await createOrder({
          userId: userIdForOrder,
          customer,
          items: orderItems,
          orderType: 'dine-in',
          source: 'pos',
          orderNo: createdOrderNo,
          totalAmount: grandTotal,
          status: initialStatus,
          ...guestMeta,
        })
        setSuccess({
          id,
          userId: userIdForOrder,
          orderNo: createdOrderNo,
          items: orderItems,
          subtotal,
          totalAmount: grandTotal,
          payment,
          createdAt: new Date().toISOString(),
        })
        pushToast(`Bill created #${createdOrderNo}`, 'success')
        await refreshRecent()

        if (navigateToOrders) {
          navigate('/admin/orders', { state: { highlightOrderId: createdOrderNo, autoOpen: true } })
        }
      }
      
      // Send Invoice automatically if phone provided
      if (customerDetails.phone) {
          // WA invoice removed
      }

      setCheckoutStep(0)
      setCustomerDetails({ name: '', phone: '' })
      clearBill(); setQ('')
    } catch (e) {
      console.error('submitBill failed', e)
      pushToast(e.message || 'Failed to create bill', 'error')
    } finally { setSubmitting(false) }
  }

  // ── Calculator ──
  function calcAppend(ch) { setCalcExpr((s) => (s + ch)) }
  function calcClear() { setCalcExpr('') }

  // Safe math evaluator — no Function/eval, recursive-descent parser for +, -, *, /, ()
  function safeMathEval(expr) {
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g) || []
    let pos = 0
    const peek = () => tokens[pos]
    const next = () => tokens[pos++]
    function parseExpr() {
      let left = parseTerm()
      while (peek() === '+' || peek() === '-') {
        const op = next()
        const right = parseTerm()
        left = op === '+' ? left + right : left - right
      }
      return left
    }
    function parseTerm() {
      let left = parseFactor()
      while (peek() === '*' || peek() === '/') {
        const op = next()
        const right = parseFactor()
        left = op === '*' ? left * right : left / right
      }
      return left
    }
    function parseFactor() {
      if (peek() === '(') { next(); const v = parseExpr(); next(); return v }
      const t = next()
      return t === undefined ? 0 : Number(t)
    }
    const result = parseExpr()
    if (!Number.isFinite(result)) throw new Error('Invalid')
    return result
  }

  function calcEval() {
    try {
      const safe = calcExpr.replace(/[^0-9+\-*/().]/g, '')
      const val = safeMathEval(safe || '0')
      setCalcExpr(String(val))
    } catch { setCalcExpr('Err') }
  }

  function startNewBill() {
    setSuccess(null)
    setCheckoutStep(0)
    setCustomerDetails({ name: '', phone: '' })

    setGuestMode(false)
    setPayMethod('cod')
    setSelectedCategory(null)
    setActiveContactField(null)
    setShowContactDropdown(false)
    clearBill()
    setQ('')
  }

  if (!hasPageAccess) {
    return <div className="p-8"><div className="alert alert-error">You don't have permission to access this page.</div></div>
  }

  // ── Render ──
  return (
    <div className="page-wrap py-6 pb-32">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold"><span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Biller POS</span></h2>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" onClick={clearBill}>Clear</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCalc(s => !s)} title="Calculator">🧮</button>
        </div>
      </div>

      {success && (
        <div className="alert alert-success mb-4 shadow-sm">
          <div className="w-full flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold">Bill created successfully</div>
              <div className="text-sm opacity-80">Order #{success.orderNo} | Total: ₹{success.totalAmount ?? success.subtotal ?? 0} | Payment: {formatPaymentMethod(success.payment?.method || payMethod)}</div>
              <div className="mt-1"><span className={`badge badge-sm ${paymentStatusBadge(success.payment?.status || 'paid')}`}>{(success.payment?.status || 'paid').toUpperCase()}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm" onClick={() => navigate('/admin/orders', { state: { highlightOrderId: success.orderNo, autoOpen: true } })}>View Order</button>
              <button className="btn btn-sm btn-primary" onClick={startNewBill}>New Bill</button>
            </div>
          </div>
        </div>
      )}

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
             const isBroken = !!brokenCatImages[cat.id]
             const imgUrl = !isBroken ? (catImageUrls[cat.id] || null) : null
             return (
               <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition cursor-pointer active:scale-95 rounded-2xl">
                 <figure className="px-4 pt-4">
                   {imgUrl ? (
                     <img
                       src={imgUrl}
                       alt={cat.name}
                       className="rounded-xl h-32 w-full object-cover bg-base-200"
                       onError={() => setBrokenCatImages(prev => ({ ...prev, [cat.id]: true }))}
                     />
                   ) : (
                     <div className="rounded-xl h-32 w-full bg-base-200 grid place-items-center text-base-content/30">
                       <MdRestaurantMenu className="text-4xl" />
                     </div>
                   )}
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
              {catsMeta.map(cat => {
                const isBroken = !!brokenCatImages[cat.id]
                const imgUrl = !isBroken ? (catImageUrls[cat.id] || null) : null
                const hasImage = !!imgUrl
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-sm justify-start text-left h-auto py-2 ${selectedCategory?.id === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <div className="avatar placeholder">
                      <div className="w-6 h-6 rounded bg-base-300 text-base-content/50">
                        {hasImage ? (
                          <img
                            src={imgUrl}
                            alt=""
                            className="object-cover"
                            onError={() => setBrokenCatImages(prev => ({ ...prev, [cat.id]: true }))}
                          />
                        ) : (
                          <span className="text-xs">{cat.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <span className="truncate flex-1">{cat.name}</span>
                  </button>
                )
              })}
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
                  const isBroken = !!brokenItemImages[it.id]
                  const imgUrl = !isBroken ? (itemImageUrls[it.id] || null) : null
                  const qty = bill[it.id]?.qty || 0
                  return (
                    <button key={it.id} type="button" className={`group relative rounded-lg border bg-base-100 p-2 text-left shadow-sm transition ${qty > 0 ? 'border-primary ring-1 ring-primary' : 'border-base-300 hover:border-primary/50'}`} onClick={() => addLine(it)}>
                      <div className="w-full aspect-[5/4] rounded-lg overflow-hidden bg-base-200 grid place-items-center relative">
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={() => setBrokenItemImages(prev => ({ ...prev, [it.id]: true }))}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center bg-base-200 text-base-content/20 ${imgUrl ? 'hidden' : 'flex'}`}>
                           <MdRestaurantMenu className="text-4xl" />
                        </div>
                        {qty > 0 && (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl z-10">
                              {qty}
                           </div>
                        )}
                      </div>
                      <div className="mt-1.5 text-[11px] font-medium leading-tight line-clamp-2 min-h-[2.1em]">{it.name}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">₹{Number(it.rate ?? it.price) || 0}</div>
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
              <button
                onClick={() => {
                  setGuestMode(false)
                  setCustomerDetails({ name: '', phone: '' })
                  setActiveContactField(null)
                  setShowContactDropdown(false)
                  setCheckoutStep(1)
                }}
                className="btn btn-primary px-8"
              >
                Checkout
              </button>
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
            </h3>
            
            {checkoutStep === 1 && (
               <div className="space-y-4">
                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text">Mode</span>
                    </label>
                    <div className="join w-full">
                      <input
                        className="btn join-item"
                        type="radio"
                        name="biller-customer-mode"
                        aria-label="Customer"
                        checked={!guestMode}
                        onChange={() => {
                          setGuestMode(false)
                          setCustomerDetails({ name: '', phone: '' })
                          setActiveContactField('name')
                        }}
                      />
                      <input
                        className="btn join-item"
                        type="radio"
                        name="biller-customer-mode"
                        aria-label="Guest"
                        checked={guestMode}
                        onChange={() => {
                          setGuestMode(true)
                          setCustomerDetails({ name: '', phone: '' })
                          setActiveContactField(null)
                          setShowContactDropdown(false)
                          // Skip the details step entirely
                          setCheckoutStep(2)
                        }}
                      />
                    </div>
                  </div>

                  {!guestMode && (
                    <>
                      <div className="form-control relative">
                        <label className="label"><span className="label-text">Name</span></label>
                        <input
                          className="input input-bordered"
                          value={customerDetails.name}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                            setCustomerDetails(s => ({ ...s, name: clean }))
                          }}
                          onFocus={() => { setActiveContactField('name'); if (contactSuggestions.length) setShowContactDropdown(true) }}
                          onBlur={() => setTimeout(() => setShowContactDropdown(false), 150)}
                          placeholder="Customer Name"
                          autoFocus
                        />
                        {activeContactField === 'name' && showContactDropdown && contactSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {contactSuggestions.map((contact, idx) => (
                              <button
                                key={`${contact.phone}-${idx}`}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center justify-between border-b border-base-200 last:border-0"
                                onMouseDown={(ev) => {
                                  ev.preventDefault()
                                  setCustomerDetails({ name: contact.name, phone: contact.phone })
                                  setShowContactDropdown(false)
                                  setActiveContactField(null)
                                }}
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-xs opacity-60">{contact.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="form-control relative">
                        <label className="label"><span className="label-text">Phone</span></label>
                        <input
                          className="input input-bordered tabular-nums"
                          value={customerDetails.phone}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setCustomerDetails(s => ({ ...s, phone: clean }))
                          }}
                          onFocus={() => { setActiveContactField('phone'); if (contactSuggestions.length) setShowContactDropdown(true) }}
                          onBlur={() => setTimeout(() => setShowContactDropdown(false), 150)}
                          placeholder="10-digit Mobile"
                          maxLength={10}
                          inputMode="numeric"
                        />
                        {activeContactField === 'phone' && showContactDropdown && contactSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {contactSuggestions.map((contact, idx) => (
                              <button
                                key={`${contact.phone}-${idx}`}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center justify-between border-b border-base-200 last:border-0"
                                onMouseDown={(ev) => {
                                  ev.preventDefault()
                                  setCustomerDetails({ name: contact.name, phone: contact.phone })
                                  setShowContactDropdown(false)
                                  setActiveContactField(null)
                                }}
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-xs opacity-60">{contact.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
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

            <div className="modal-action">
               <button className="btn" onClick={() => setCheckoutStep(0)}>Cancel</button>
               <button className="btn btn-primary" onClick={handleCheckoutNext} disabled={submitting}>
                {submitting ? 'Processing...' : (checkoutStep === 1 ? 'Next' : 'Place')}
               </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}
