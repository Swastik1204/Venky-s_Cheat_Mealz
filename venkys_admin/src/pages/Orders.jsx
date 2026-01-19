import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import { db } from '../lib/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { fetchAllOrders, nextOrderStatus, updateOrder, deductStockForOrder, getAvatarUrl, fetchAppSettings, sendWhatsAppInvoice, sendOtpViaWhatsApp, sendOrderMessengerViaWhatsApp, isCounterDocId } from '../lib/data'
import { printOrderReceiptViaRawBT, shouldUseRawBT } from '../lib/rawbtPrint'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { MdWarningAmber, MdPrint } from 'react-icons/md'

export default function Orders() {
  const location = useLocation()
  const { confirmState, resolveConfirm, pushToast } = useUI()
  const { user, roleLoading, isStaffMember } = useAuth()
  const [orders, setOrders] = useState([])
  const [liveEnabled] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const historyHeaderRefs = useRef({})
  const [openHistoryKey, setOpenHistoryKey] = useState(null)
  const [cashManagerPhones, setCashManagerPhones] = useState([])
  const [orderMessengerPhones, setOrderMessengerPhones] = useState([])
  const notifiedRef = useRef(new Set())

  function normalizeWhatsappPhone(phone) {
    const raw = String(phone || '').trim()
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return `91${digits}`
    if (digits.length === 12 && digits.startsWith('91')) return digits
    return digits
  }

  function isOnlineOrder(o) {
    const source = String(o?.source || '').toLowerCase()
    if (source === 'pos') return false
    const method = String(o?.payment?.method || o?.customer?.payment?.method || '').toLowerCase()
    return method === 'online' || method === 'razorpay'
  }

  const buildOrderAddressString = useCallback((o) => {
    const raw = o?.address ?? o?.customer?.address ?? o?.deliveryAddress ?? ''
    if (!raw) return '-'
    if (typeof raw === 'string') return raw.trim() || '-'
    if (typeof raw === 'object') {
      const parts = [raw.line1, raw.line2, raw.landmark, raw.city, raw.state, raw.pin]
        .map(v => (v == null ? '' : String(v).trim()))
        .filter(Boolean)
      return parts.length ? parts.join(', ') : '-'
    }
    return String(raw).trim() || '-'
  }, [])

  const buildOrderMessengerData = useCallback((o) => {
    const customerName = String(o?.customer?.name || o?.name || 'Customer').trim() || 'Customer'
    const totalAmount = Number(o?.totalAmount ?? o?.subtotal ?? 0)
    const address = buildOrderAddressString(o)
    return { customerName, totalAmount, address }
  }, [buildOrderAddressString])

  function playNewOrderSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.value = 0.03
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
      osc.onended = () => { try { ctx.close() } catch { /* noop */ } }
    } catch (e) {
      console.error('Audio beep failed', e)
    }
  }

  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpModalOrder, setOtpModalOrder] = useState(null)
  const [otpValue, setOtpValue] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpResendBusy, setOtpResendBusy] = useState(false)

  function isDineInCod(o) {
    const type = String(o?.orderType || '').toLowerCase()
    const method = String(o?.payment?.method || o?.customer?.payment?.method || '').toLowerCase()
    return type === 'dine-in' && method === 'cod'
  }

  function openOtpModalForOrder(o) {
    setOtpModalOrder(o)
    setOtpValue('')
    setOtpModalOpen(true)
  }

  async function verifyOtpAndAccept(o, rawOtp) {
    if (!o || o.status !== 'placed') return
    if (!isDineInCod(o)) return
    if (!o.cashManagerOtp) {
      pushToast('OTP not found on this order', 'warning')
      return
    }
    if (o.cashManagerOtpVerified) return

    const typed = String(rawOtp || '').trim()
    const expected = String(o.cashManagerOtp).trim()
    if (!typed || typed !== expected) {
      pushToast('Incorrect OTP', 'error')
      return
    }

    setOtpBusy(true)
    try {
      const collectedAt = new Date().toISOString()
      await updateOrder(o.userId || null, o.id, {
        status: 'preparing',
        cashManagerOtpVerified: true,
        cashManagerOtpVerifiedAt: collectedAt,
        cashManagerOtpVerifiedBy: user?.email || user?.uid || 'staff',
        payment: {
          ...(o.payment || {}),
          status: 'paid',
          collectedAt,
          collectedBy: user?.email || user?.uid || 'staff',
          metadata: { ...(o.payment?.metadata || {}), verifiedBy: 'otp' },
        },
      }, user?.email)

      if (Array.isArray(o.items)) {
        deductStockForOrder(o.items).catch(err => console.error('Stock deduction failed', err))
      }

      setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'preparing', cashManagerOtpVerified: true, payment: { ...(o.payment || {}), status: 'paid', collectedAt, collectedBy: user?.email || user?.uid || 'staff', metadata: { ...(o.payment?.metadata || {}), verifiedBy: 'otp' } } } : x))
      pushToast('Order accepted', 'success')
      setOtpModalOpen(false)
      setOtpModalOrder(null)
      setOtpValue('')
    } catch (err) {
      console.error('[Orders] OTP accept failed:', err)
      pushToast('Failed to accept order', 'error')
    } finally {
      setOtpBusy(false)
    }
  }

  async function resendOtpForOrder(o) {
    if (!o) return
    if (!isDineInCod(o)) {
      pushToast('OTP resend only applies to dine-in COD orders', 'warning')
      return
    }
    if (!o.cashManagerOtp) {
      pushToast('OTP not found on this order', 'warning')
      return
    }
    if (!Array.isArray(cashManagerPhones) || cashManagerPhones.length === 0) {
      pushToast('Cash manager phone(s) not configured', 'error')
      return
    }

    setOtpResendBusy(true)
    try {
      const orderRef = o.orderNo || o.id
      const otp = String(o.cashManagerOtp).trim()

      // Send the same OTP to all cash-manager phones simultaneously
      const results = await Promise.allSettled(
        cashManagerPhones.map((p) => sendOtpViaWhatsApp(p, otp, orderRef))
      )
      const successCount = results.filter(r => r.status === 'fulfilled' && !r.value?.__error).length
      if (successCount === 0) {
        const firstErr = results.find(r => r.status === 'fulfilled' && r.value?.__error)?.value
        throw new Error(firstErr?.message || firstErr?.__error || 'WhatsApp send failed')
      }

      const resentAt = new Date().toISOString()
      const nextCount = Number(o.cashManagerOtpResentCount || 0) + 1
      await updateOrder(o.userId || null, o.id, {
        cashManagerOtpResentAt: resentAt,
        cashManagerOtpResentBy: user?.email || user?.uid || 'staff',
        cashManagerOtpResentCount: nextCount,
      }, user?.email)

      setOrders(arr => arr.map(x => x.id === o.id ? { ...x, cashManagerOtpResentAt: resentAt, cashManagerOtpResentBy: user?.email || user?.uid || 'staff', cashManagerOtpResentCount: nextCount } : x))
      pushToast('OTP resent', 'success')
    } catch (err) {
      console.error('[Orders] OTP resend failed:', err)
      pushToast(err?.message || 'Failed to resend OTP', 'error')
    } finally {
      setOtpResendBusy(false)
    }
  }

  const printOrderBill = (order) => {
    if (!order) return

    // Mobile/tablet/PWA: use RawBT deep-link printing (Android)
    if (shouldUseRawBT()) {
      try {
        printOrderReceiptViaRawBT(order, { title: "Venky's Cheat Mealz", width: 42 })
      } catch (e) {
        console.error('[Orders] RawBT print failed', e)
        pushToast('RawBT print failed. Please ensure RawBT is installed and try again.', 'error', 5000)
      }
      return
    }

    const w = window.open('', '_blank', 'width=280,height=600')
    if (!w) {
        alert('Please allow popups to print the bill')
        return
    }
    
    // Helper to truncate/wrap text for thermal printer (72mm ≈ 42 chars at 9pt monospace)
    const wrapText = (text, maxLen = 32) => {
      if (!text || text.length <= maxLen) return text
      const words = text.split(' ')
      const lines = []
      let current = ''
      for (const word of words) {
        if ((current + ' ' + word).trim().length <= maxLen) {
          current = current ? current + ' ' + word : word
        } else {
          if (current) lines.push(current)
          current = word.length > maxLen ? word.slice(0, maxLen) : word
        }
      }
      if (current) lines.push(current)
      return lines.join('<br/>')
    }

    const itemsHtml = (order.items || []).map(item => {
      const itemName = String(item.name || '').trim()
      const qty = Number(item.qty) || 1
      const price = Number(item.price) || 0
      const lineTotal = (qty * price).toFixed(0)
      // Format: "2x Chicken Burger" on one line, price right-aligned on next line if name is long
      const nameWrapped = wrapText(itemName, 28)
      return `
        <tr>
          <td style="padding: 2px 0; vertical-align: top; width: 25px;">${qty}x</td>
          <td style="padding: 2px 0; vertical-align: top;">${nameWrapped}</td>
          <td style="text-align: right; padding: 2px 0; vertical-align: top; white-space: nowrap; width: 50px;">₹${lineTotal}</td>
        </tr>
      `
    }).join('')

    const dateStr = order.createdAt?.seconds 
      ? new Date(order.createdAt.seconds * 1000).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
      : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    const total = Number(order.totalAmount || order.subtotal || 0).toFixed(0)
    const addr = order.address || order.customer?.address || {}
    const addressParts = [addr?.line1, addr?.line2, addr?.city].filter(Boolean)
    const addressStr = addressParts.length > 0 ? wrapText(addressParts.join(', '), 32) : ''
    const customerName = wrapText(String(order.customer?.name || order.name || 'Guest'), 32)
    const orderRef = String(order.orderNo || order.id || '').slice(-8)
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill #${orderRef}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', 'Courier', monospace; 
            font-size: 9pt;
            line-height: 1.3;
            width: 72mm;
            max-width: 72mm;
            margin: 0;
            padding: 4mm 2mm;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .small { font-size: 8pt; }
          .header { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #000; }
          .title { font-size: 11pt; font-weight: bold; margin-bottom: 3px; }
          .section { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          td { padding: 2px 0; vertical-align: top; word-wrap: break-word; }
          .totals { border-top: 1px dashed #000; padding-top: 6px; margin-top: 8px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; line-height: 1.2; }
          .footer { text-align: center; margin-top: 12px; font-size: 8pt; }
          @page { 
            size: 72mm auto;
            margin: 0;
          }
          @media print {
            body { 
              width: 72mm;
              max-width: 72mm;
              padding: 2mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="title">Venky's Cheat Mealz</div>
          <div class="small">Order #${orderRef}</div>
          <div class="small">${dateStr}</div>
        </div>
        
        <div class="section small">
          <div class="bold">${customerName}</div>
          ${order.customer?.phone || order.phone ? `<div>${order.customer?.phone || order.phone}</div>` : ''}
          ${addressStr ? `<div style="margin-top: 2px;">${addressStr}</div>` : ''}
        </div>
        
        <table>
          ${itemsHtml}
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span class="bold">₹${Number(order.subtotal || 0).toFixed(0)}</span>
          </div>
          ${order.deliveryFee ? `<div class="total-row"><span>Delivery:</span><span>₹${Number(order.deliveryFee).toFixed(0)}</span></div>` : ''}
          ${order.discount ? `<div class="total-row"><span>Discount:</span><span>-₹${Number(order.discount).toFixed(0)}</span></div>` : ''}
          <div class="total-row" style="font-size: 11pt; margin-top: 4px; padding-top: 4px; border-top: 1px solid #000;">
            <span class="bold">TOTAL:</span>
            <span class="bold">₹${total}</span>
          </div>
          <div class="total-row small" style="margin-top: 3px;">
            <span>Payment:</span>
            <span style="text-transform: uppercase;">${order.payment?.method || 'COD'}</span>
          </div>
          ${order.payment?.status === 'paid' ? '<div class="center small" style="margin-top: 3px;">✓ PAID</div>' : ''}
        </div>
        
        <div class="footer">
          Thank you for ordering!<br/>
          Visit us again 🍗
        </div>
        
        <script>
          setTimeout(() => {
            window.print();
          }, 300);
        </script>
      </body>
      </html>
    `
    w.document.write(html)
    w.document.close()
  }

  useEffect(() => {
    fetchAppSettings().then(s => {
      const to10 = (v) => {
        const digits = String(v || '').replace(/\D/g, '')
        const no91 = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
        return no91.length === 10 ? no91 : ''
      }

      const cm = Array.isArray(s?.cashManagerPhones) ? s.cashManagerPhones : []
      const cmList = cm.map(to10).filter(Boolean)
      const legacy = to10(s?.cashManagerPhone)
      setCashManagerPhones(cmList.length ? cmList : (legacy ? [legacy] : []))

      const list = Array.isArray(s?.orderMessengerPhones) ? s.orderMessengerPhones : []
      setOrderMessengerPhones(list.map(to10).filter(Boolean))
    })
  }, [])

  useEffect(() => {
    // Wait for role to load before setting up listener
    if (!liveEnabled || roleLoading || !user || !isStaffMember) return undefined
    const qy = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qy, (snap) => {
      const newOrders = snap.docs
        .filter(d => !isCounterDocId(d.id))
        .map(d => ({ id: d.id, ...d.data() }))
      
      // Check for new placed orders
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const order = change.doc.data()
          // Skip counter documents
          if (isCounterDocId(change.doc.id)) return
          
          // Only notify for orders created very recently (e.g. last 1 minute) to avoid noise on reload
          // But 'added' in snapshot usually means new to the query. 
          // If we load 100 orders, all are 'added'. We need to distinguish initial load.
          // Actually, onSnapshot fires with all docs as 'added' initially.
          // We can check if the timestamp is very recent.
          const isRecent = order.createdAt?.toMillis ? (Date.now() - order.createdAt.toMillis() < 60000) : true
          
          if (order.status === 'placed' && isRecent) {
            // Play sound
            playNewOrderSound()

            const id = change.doc.id
            if (!id || notifiedRef.current.has(id)) return
            notifiedRef.current.add(id)

            // Notifications are intentionally handled at their source:
            // - Order messenger: sent by customer app when order is created
            // - Cash manager OTP: sent by admin biller when dine-in COD bill is created
          }
        }
      })
      setOrders(newOrders)
    }, (err) => {
      console.error('[Orders] onSnapshot error:', err)
    })
    return () => unsub()
  }, [liveEnabled, roleLoading, user, isStaffMember, cashManagerPhones, orderMessengerPhones, buildOrderMessengerData])

  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const result = await fetchAllOrders()
      setOrders(Array.isArray(result) ? result : [])
    } finally { setLoadingOrders(false) }
  }

  const statusFlow = ['placed', 'preparing', 'ready', 'delivered']
  function statusColor(s) { return s==='placed'?'badge-info':s==='preparing'?'badge-warning':s==='ready'?'badge-success':s==='delivered'?'badge-neutral':s==='rejected'?'badge-error':'badge-ghost' }
  const baseFiltered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  function orderSearchText(o) { return [o.id,o.name,o.customer?.name,o.address?.name,o.phone,o.customer?.phone,o.address?.phone,o.contact?.phone].filter(Boolean).join(' ').toLowerCase() }
  const q = (orderSearch||'').trim().toLowerCase()
  const filteredOrders = q ? baseFiltered.filter(o => orderSearchText(o).includes(q) || (o.id||'').toLowerCase().includes(q)) : baseFiltered
  const metrics = statusFlow.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc }, { all: orders.length, rejected: orders.filter(o => o.status === 'rejected').length })

  async function acceptOrder(o) { 
    if (o.status !== 'placed') return; 
    try {
      // For dine-in COD orders, OTP (if present) must be verified before accepting.
      if (isDineInCod(o) && o.cashManagerOtp && !o.cashManagerOtpVerified) {
        openOtpModalForOrder(o)
        return
      }
      console.log('[Orders] Accepting order:', o.id, 'userId:', o.userId)
      await updateOrder(o.userId || null, o.id, { status: 'preparing' }, user?.email); 
      console.log('[Orders] Order accepted successfully:', o.id)
      // Deduct stock when order is accepted
      if (Array.isArray(o.items)) {
        deductStockForOrder(o.items).catch(err => console.error('Stock deduction failed', err))
      }
      setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'preparing' } : x)) 
    } catch (err) {
      console.error('[Orders] Failed to accept order:', o.id, err)
    }
  }
  async function rejectOrder(o) { if (o.status !== 'placed') return; await updateOrder(o.userId || null, o.id, { status: 'rejected' }, user?.email); setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'rejected' } : x)) }
  async function advanceOrder(o) { 
    const next = nextOrderStatus(o.status); 
    if (next === o.status) return; 
    await updateOrder(o.userId || null, o.id, { status: next }, user?.email); 
    setOrders((arr) => arr.map(x => x.id === o.id ? { ...x, status: next } : x))
    
    // Send Google review request if order just became delivered
    if (next === 'delivered' && o.status !== 'delivered') {
      const phone = o.customer?.phone || o.phone
      if (phone) {
        try {
          const settings = await fetchAppSettings()
          const googlePlaceId = settings.googlePlaceId
          if (googlePlaceId) {
            const reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
            const message = `Thank you for your order at Venky's Cheat Mealz! 🍽️\n\nWe hope you enjoyed your meal. Your feedback helps us improve! Please take a moment to share your experience:\n\n${reviewUrl}\n\nThank you! 😊`
            await sendWhatsAppInvoice(phone, { text: message })
          }
        } catch (err) {
          console.error('[Orders] Failed to send review request:', err)
        }
      }
    }
  }

  function progressPercent(s) { const idx = statusFlow.indexOf(s); if (idx === -1) return 0; return ((idx + 1) / statusFlow.length) * 100 }
  function toggleHistory(key, el) { const beforeTop = el?.getBoundingClientRect?.().top; setOpenHistoryKey(prev => (prev === key ? null : key)); requestAnimationFrame(() => { const afterTop = el?.getBoundingClientRect?.().top; if (typeof beforeTop === 'number' && typeof afterTop === 'number') { window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: 'auto' }) } }) }

  // If navigated from the Biller, auto-open the newly created order.
  useEffect(() => {
    const st = location?.state
    const highlightId = st?.highlightOrderId
    const autoOpen = !!st?.autoOpen
    if (!autoOpen || !highlightId || !orders.length) return
    const target = orders.find(o => o.id === highlightId || o.orderNo === highlightId)
    if (!target) return
    setSelectedOrder(target)
    setOrderModalOpen(true)
  }, [location, orders])

  return (
    <AdminLayout section="orders">
      {otpModalOpen && otpModalOrder && (
        <dialog open className="modal modal-open z-[200]">
          <div className="modal-box z-[210]">
            <h3 className="font-bold text-lg">Verify OTP</h3>
            <p className="text-sm opacity-70 mt-1">Enter OTP to accept this dine-in COD order.</p>

            <div className="mt-4">
              <div className="text-xs opacity-60 mb-1">Order</div>
              <div className="font-mono text-sm">{otpModalOrder.orderNo || otpModalOrder.id}</div>
            </div>

            <div className="mt-4">
              <input
                className="input input-bordered w-full text-center font-mono text-xl tracking-widest"
                value={otpValue}
                onChange={(e) => {
                  const expectedLen = otpModalOrder?.cashManagerOtp ? String(otpModalOrder.cashManagerOtp).trim().length : 6
                  setOtpValue(e.target.value.replace(/\D/g, '').slice(0, Math.max(expectedLen, 4)))
                }}
                inputMode="numeric"
                placeholder="Enter OTP"
                autoFocus
              />
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                disabled={otpBusy || otpResendBusy}
                onClick={() => resendOtpForOrder(otpModalOrder)}
              >
                {otpResendBusy ? 'Resending…' : 'Resend OTP'}
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (otpBusy) return
                  setOtpModalOpen(false)
                  setOtpModalOrder(null)
                  setOtpValue('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={otpBusy || otpResendBusy}
                onClick={() => verifyOtpAndAccept(otpModalOrder, otpValue)}
              >
                {otpBusy ? 'Verifying…' : 'Verify & Accept'}
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop z-[205]"
            onClick={() => {
              if (otpBusy) return
              setOtpModalOpen(false)
              setOtpModalOrder(null)
              setOtpValue('')
            }}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight" style={{lineHeight:'1.1', color:'var(--color-base-content)'}}>
          Orders
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="hidden md:block" />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="join w-full md:w-80">
              <input className="input input-bordered join-item input-sm w-full" placeholder="Search id, name or phone" value={orderSearch} onChange={(e)=> setOrderSearch(e.target.value)} />
              {orderSearch && (<button className="btn btn-sm join-item" onClick={()=> setOrderSearch('')}>Clear</button>)}
            </div>
            <button className="btn btn-sm btn-outline" onClick={loadOrders} disabled={loadingOrders} title="Refresh">
              {loadingOrders ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="stat admin-surface-alt p-4"><div className="stat-title text-xs">Total</div><div className="stat-value text-lg">{metrics.all}</div></div>
          {statusFlow.map(s => (
            <div key={s} className="stat admin-surface-alt p-4"><div className="stat-title text-xs capitalize flex items-center gap-1"><span>{s}</span></div><div className="stat-value text-lg">{metrics[s]}</div></div>
          ))}
          <div className="stat admin-surface-alt p-4"><div className="stat-title text-xs capitalize">Rejected</div><div className="stat-value text-lg">{metrics.rejected}</div></div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', ...statusFlow, 'rejected'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`btn btn-xs ${statusFilter === f ? 'btn-primary' : 'btn-ghost'} rounded-full`}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>

        {/* Derived groups: Today and History */}
        {(() => {
          const today = new Date()
          function addDays(d, delta) { const x = new Date(d); x.setDate(x.getDate()+delta); return x }
          function dateKey(d) { const dt = d instanceof Date ? d : (d?.seconds ? new Date(d.seconds * 1000) : null); if (!dt) return 'unknown'; const y = dt.getFullYear(); const m = String(dt.getMonth()+1).padStart(2,'0'); const da = String(dt.getDate()).padStart(2,'0'); return `${y}-${m}-${da}` }
          const todayKey = dateKey(today); const yesterdayKey = dateKey(addDays(today, -1))
          const groups = new Map();
          filteredOrders.forEach(o => { const key = dateKey(o.createdAt); const arr = groups.get(key) || []; arr.push(o); groups.set(key, arr) })
          const orderedKeys = Array.from(groups.keys()).sort((a,b)=> a<b ? 1 : a>b ? -1 : 0)
          const renderCard = (o, frozen = false) => {
            const next = nextOrderStatus(o.status); const advanceDisabled = next === o.status
            const createdAt = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
            const time24 = createdAt ? createdAt.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : null
            const isPos = (o.source || '').toLowerCase() === 'pos'
            const pct = progressPercent(o.status); const isDelivered = o.status === 'delivered'; const isRejected = o.status === 'rejected'
            const isActive = o.status === 'placed' || o.status === 'preparing'
            return (
              <div
                key={o.id}
                className={`card admin-panel group cursor-pointer transition overflow-hidden hover:border-primary/20 hover:shadow-xl ${isRejected ? 'opacity-70' : ''} ${isDelivered ? 'border-success/40 bg-success/10' : ''} ${isActive && !frozen ? 'order-card-active' : ''}`}
                onClick={() => { setSelectedOrder(o); setOrderModalOpen(true) }}
              >
                <div className="card-body p-4 gap-3">
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold tracking-wide">#{o.id.slice(-6)}</div>
                        <span className={`badge badge-ghost badge-xs ${isPos ? 'text-purple-600' : 'text-sky-600'}`} title={isPos ? 'Placed from Admin Biller (POS)' : 'Placed from Consumer App'}>{isPos ? 'Biller' : 'App'}</span>
                      </div>
                      <div className="text-[11px] opacity-60 flex gap-2">
                        {time24 && <span>{time24}</span>}
                        <span>{o.items?.length || 0} items</span>
                        <span>₹{o.subtotal}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge badge-sm ${statusColor(o.status)} capitalize`}>{o.status}</span>
                      {o.status === 'placed' && (
                        <div className="flex gap-1" onClick={(e)=> e.stopPropagation()}>
                          <button className="btn btn-xs btn-success" onClick={() => acceptOrder(o)} disabled={frozen} title={frozen ? 'Actions disabled for past orders' : 'Accept'}>Accept</button>
                          <button className="btn btn-xs btn-error" onClick={() => rejectOrder(o)} disabled={frozen} title={frozen ? 'Actions disabled for past orders' : 'Reject'}>Reject</button>
                        </div>
                      )}
                      {o.status !== 'placed' && o.status !== 'rejected' && (
                        <button className="btn btn-xs btn-primary" onClick={(e) => { e.stopPropagation(); if (!frozen) advanceOrder(o) }} disabled={advanceDisabled || frozen} title={frozen ? 'Actions disabled for past orders' : (advanceDisabled ? 'Final state reached' : `Advance to ${next}`)}>
                          {advanceDisabled ? 'Complete' : `Mark ${next}`}
                        </button>
                      )}
                    </div>
                  </div>
                  {o.status !== 'rejected' && (
                    <div className="mb-3">
                      <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
                        <div className="order-progress-bar h-full bg-gradient-to-r from-primary to-secondary" style={{ width: pct + '%' }} />
                      </div>
                      <div className="flex justify-between mt-1">{statusFlow.map(s => (<span key={s} className={`flex-1 text-center text-[9px] tracking-wide uppercase ${o.status === s ? 'text-primary font-semibold' : 'opacity-40'}`}>{s[0]}</span>))}</div>
                    </div>
                  )}
                  <div className="text-[11px] flex flex-wrap gap-2">
                    {o.items?.slice(0,5).map((it, idx) => (<span key={it.id || `item-${idx}`} className="px-2 py-0.5 rounded-full bg-base-200/70 border border-base-300/60 group-hover:border-primary/50 transition">{it.name}×{it.qty}</span>))}
                    {o.items?.length > 5 && (<span className="opacity-60">+{o.items.length - 5} more</span>)}
                  </div>
                  {o.payment?.method && (<div className="mt-2 text-[10px] uppercase tracking-wide opacity-60">{o.payment.method}</div>)}
                  {(() => { const idx = statusFlow.indexOf(o.status); const pending = statusFlow.slice(idx + 1); if (!pending.length) return null; const nextMissing = pending[0]; return (
                    <div className="mt-2 text-[11px] text-warning flex items-center gap-1"><MdWarningAmber className="w-4 h-4" /><span>Not marked as {nextMissing} yet</span></div>
                  )})()}
                  <div className="pt-1 flex justify-end"><button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setOrderModalOpen(true) }}>View</button></div>
                </div>
              </div>
            )
          }

          const chunks = orderedKeys.reduce((acc, k) => { const list = groups.get(k) || []; if (k === todayKey) { acc.today = { placed: list.filter(o => o.status === 'placed'), preparing: list.filter(o => o.status === 'preparing'), ready: list.filter(o => o.status === 'ready'), delivered: list.filter(o => o.status === 'delivered'), rejected: list.filter(o => o.status === 'rejected') } } else { acc.history.push({ key: k, list }) } return acc }, { today: null, history: [] })
          return (
            <div className="space-y-6">
              {chunks.today && (
                <div>
                  <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-semibold">Today</h3><div className="text-xs opacity-60">{Object.values(chunks.today).reduce((n, arr)=> n + arr.length, 0)} orders</div></div>
                  {(['placed','preparing','ready','delivered','rejected']).map(bucket => { const arr = chunks.today[bucket]; if (!arr || arr.length === 0) return null; return (
                    <div key={bucket} className="mb-4"><div className="text-sm font-medium mb-2 capitalize flex items-center gap-2"><span className={`badge ${statusColor(bucket)} badge-sm`}></span><span>{bucket}</span><span className="opacity-60">({arr.length})</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{arr.map(o => renderCard(o))}</div></div>
                  )})}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-semibold">Order history</h3><span className="text-xs opacity-60">{chunks.history.reduce((n, g)=> n + g.list.length, 0)} orders</span></div>
                {chunks.history.length === 0 && <div className="opacity-60 text-sm">No previous days.</div>}
                <div className="space-y-3">
                  {chunks.history.map(g => { const title = g.key === yesterdayKey ? 'Yesterday' : new Date(g.key + 'T00:00:00').toLocaleDateString(); const open = openHistoryKey === g.key; return (
                    <div key={g.key} className={`collapse collapse-arrow admin-panel transition ${open ? 'ring-1 ring-primary/20' : ''}`}>
                      <input type="checkbox" checked={open} onChange={() => toggleHistory(g.key, historyHeaderRefs.current[g.key])} />
                      <div className="collapse-title text-sm font-medium flex items-center justify-between" ref={(el)=>{ if (el) historyHeaderRefs.current[g.key] = el }}>
                        <span>{title}</span>
                        <span className="badge badge-ghost badge-sm">{g.list.length}</span>
                      </div>
                      <div className="collapse-content"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{g.list.map(o => renderCard(o, true))}</div></div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {orderModalOpen && selectedOrder && (
        <dialog open className="modal modal-open z-[100]">
          <div className="modal-box z-[110]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Order #{selectedOrder.id.slice(-6)} 
                <span className={`badge ${statusColor(selectedOrder.status)} badge-sm capitalize`}>{selectedOrder.status}</span>
              </h3>
              <div className="text-xs opacity-60 font-mono">
                Placed: {selectedOrder.createdAt?.seconds ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
              </div>
            </div>
            
            <div className="space-y-6 text-sm">
              {/* Customer & Address Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-base-200/30 rounded-xl border border-base-200">
                <div className="flex items-start gap-4">
                   <div className="avatar">
                     <div className="w-16 h-16 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-2">
                       <img src={getAvatarUrl(selectedOrder.customer || { name: selectedOrder.name || 'Guest' })} alt="Avatar" />
                     </div>
                   </div>
                   <div className="min-w-0 flex-1">
                     <div className="font-bold text-lg">{selectedOrder.customer?.name || selectedOrder.name || 'Guest'}</div>
                     <button
                       className="text-lg font-mono text-primary hover:underline flex items-center gap-2 mt-1"
                       onClick={() => {
                         const phone = selectedOrder.customer?.phone || selectedOrder.phone;
                         if (phone && confirm(`Call ${phone}?`)) {
                           window.location.href = `tel:${phone}`;
                         }
                       }}
                     >
                       {selectedOrder.customer?.phone || selectedOrder.phone || 'No phone'} 📞
                     </button>
                     <div className="text-[10px] opacity-50 mt-1 break-all">ID: {selectedOrder.id}</div>
                   </div>
                </div>
                <div className="pl-0 md:pl-4 md:border-l border-base-300/50">
                  {(() => {
                    const addr = selectedOrder.address || selectedOrder.customer?.address || {}
                    const addressParts = [addr?.line1, addr?.line2, addr?.city, addr?.pin].filter(Boolean)
                    const hasAddress = addressParts.length > 0
                    const hasCoords = addr?.lat && addr?.lng
                    return (
                      <>
                        <div className="font-bold text-xs uppercase opacity-50 mb-1">Delivery Address</div>
                        <div className="text-xs leading-relaxed mb-2">
                          {hasAddress ? addressParts.join(', ') : 'No address provided'}
                        </div>
                        
                        {/* Explicit Lat/Lng Display */}
                        {(addr?.lat || addr?.lng) && (
                          <div className="text-[10px] font-mono opacity-60 mb-2 select-all">
                            Lat: {addr?.lat || 'N/A'}, Lng: {addr?.lng || 'N/A'}
                          </div>
                        )}

                        {hasCoords ? (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline btn-primary gap-1 w-full">
                            Open in Google Maps ↗
                          </a>
                        ) : (
                          <button disabled className="btn btn-xs btn-outline gap-1 w-full opacity-50">
                            No Location Coordinates
                          </button>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Embedded Map */}
              {(() => {
                const addr = selectedOrder.address || selectedOrder.customer?.address || {}
                if (!addr?.lat || !addr?.lng) return null
                return (
                  <div className="w-full h-64 rounded-xl overflow-hidden border border-base-300 shadow-inner bg-base-200 relative">
                     <iframe 
                       width="100%" 
                       height="100%" 
                       frameBorder="0" 
                       scrolling="no" 
                       marginHeight="0" 
                       marginWidth="0" 
                       src={`https://maps.google.com/maps?q=${addr.lat},${addr.lng}&z=15&output=embed`}
                       className="absolute inset-0"
                       title="Customer Location"
                     ></iframe>
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-1">Payment Details</div>
                  <div className="space-y-1 opacity-80">
                    <div className="text-lg font-bold">₹{selectedOrder.subtotal}</div>
                    <div className="badge badge-outline uppercase text-xs font-bold">{selectedOrder.payment?.method || 'COD'}</div>
                  </div>
                </div>
                <div>
                  {/* Timestamps moved to header, keeping update time here if needed or removing */}
                  {selectedOrder.updatedAt?.seconds && (
                    <div className="text-xs opacity-60 text-right">
                      Last updated: {new Date(selectedOrder.updatedAt.seconds * 1000).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {(() => { const idx = statusFlow.indexOf(selectedOrder.status); const pending = statusFlow.slice(idx + 1); if (!pending.length) return null; const nextMissing = pending[0]; return (
                <div className="alert alert-warning py-2 min-h-0"><div className="flex items-center gap-2"><MdWarningAmber className="w-5 h-5" /><span className="text-sm">Not marked as {nextMissing} yet</span></div></div>
              )})()}
              
              <div>
                <div className="font-medium mb-1">Items ({selectedOrder.items?.length || 0})</div>
                <div className="overflow-x-auto rounded border border-base-300/60">
                  <table className="table table-xs w-full">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td>
                            <div className="flex items-center gap-2">
                              {it.imageUrl && <img src={it.imageUrl} alt="" className="w-8 h-8 rounded object-cover bg-base-200" />}
                              <span className="font-medium">{it.name}</span>
                            </div>
                          </td>
                          <td className="text-right font-bold">{it.qty}</td>
                          <td className="text-right">₹{it.price}</td>
                          <td className="text-right">₹{(it.price || 0) * (it.qty || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-action flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'placed' && (<><button className="btn btn-sm btn-success" onClick={() => { acceptOrder(selectedOrder) }}>Accept</button><button className="btn btn-sm btn-error" onClick={() => { rejectOrder(selectedOrder) }}>Reject</button></>)}
                {selectedOrder.status !== 'placed' && selectedOrder.status !== 'rejected' && nextOrderStatus(selectedOrder.status) !== selectedOrder.status && (<button className="btn btn-sm btn-primary" onClick={() => { advanceOrder(selectedOrder) }}>Mark {nextOrderStatus(selectedOrder.status)}</button>)}
                <button className="btn btn-sm btn-ghost gap-2 border-base-300" onClick={() => printOrderBill(selectedOrder)}>
                  <MdPrint className="w-4 h-4" /> Print Bill
                </button>
              </div>
              <button className="btn btn-sm" onClick={() => { setOrderModalOpen(false); setSelectedOrder(null) }}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => { setOrderModalOpen(false); setSelectedOrder(null) }}><button>close</button></form>
        </dialog>
      )}
      {/* Page-scoped Confirm Modal */}
      {confirmState && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-semibold text-lg mb-3">Confirm</h3>
            <div role="alert" className="alert alert-warning">
              <span className="whitespace-pre-wrap text-sm">{confirmState.message || 'Confirm action?'}</span>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => resolveConfirm(false)}>{confirmState.cancelText || 'Cancel'}</button>
              <button className="btn btn-error" onClick={() => resolveConfirm(true)}>{confirmState.confirmText || 'Delete'}</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => resolveConfirm(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}


    </AdminLayout>
  )
}
