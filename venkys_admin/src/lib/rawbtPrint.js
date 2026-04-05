// RawBT thermal-printer helpers (ESC/POS receipt builder)

function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  // Android/Chrome
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari (not relevant for RawBT, but harmless)
   
  return window.navigator?.standalone === true
}

function isLikelyMobileOrTablet() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const byUa = /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(ua)
  const byTouch = (navigator.maxTouchPoints || 0) > 1 && window.innerWidth < 1100
  return byUa || byTouch
}

export function shouldUseRawBT() {
  // RawBT is Android-only; prefer it on mobile/tablet/PWA.
  return isAndroid() && (isLikelyMobileOrTablet() || isStandalonePwa())
}

function padLeft(text, width) {
  const s = String(text ?? '')
  if (s.length >= width) return s.slice(-width)
  return ' '.repeat(width - s.length) + s
}

function padBetween(left, right, width) {
  const l = String(left ?? '')
  const r = String(right ?? '')
  const space = Math.max(1, width - l.length - r.length)
  const line = (l + ' '.repeat(space) + r)
  return line.length > width ? (line.slice(0, width)) : line
}

function wrapLine(text, width) {
  const s = String(text ?? '').trim()
  if (!s) return ['']
  const words = s.split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    if (!cur) {
      cur = w
      continue
    }
    if ((cur + ' ' + w).length <= width) {
      cur = cur + ' ' + w
    } else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  // Hard-split any overlong words
  const out = []
  for (const line of lines) {
    if (line.length <= width) out.push(line)
    else {
      for (let i = 0; i < line.length; i += width) out.push(line.slice(i, i + width))
    }
  }
  return out
}

function formatDate(order) {
  const createdAt = order?.createdAt
  try {
    if (createdAt?.seconds) return new Date(createdAt.seconds * 1000).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    if (createdAt?.toDate) return createdAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    // ignore
  }
  return new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
}

export function buildEscPosReceiptForOrder(order, opts = {}) {
  const width = Number(opts.width || 42) // ~72mm at small font
  const sep = '-'.repeat(width)

  const title = String(opts.title || "Venky's Cheat Mealz")
  const orderRef = String(order?.orderNo || order?.id || '').slice(-8)
  const dateStr = formatDate(order)

  const customerName = String(order?.customer?.name || order?.name || 'Guest').trim() || 'Guest'
  const phone = String(order?.customer?.phone || order?.phone || '').trim()
  const addr = order?.address || order?.customer?.address || {}
  const addressParts = [addr?.line1, addr?.line2, addr?.city].filter(Boolean).map(v => String(v).trim()).filter(Boolean)
  const addressStr = addressParts.join(', ')

  const items = Array.isArray(order?.items) ? order.items : []
  const subtotal = Number(order?.subtotal || 0) || 0
  const deliveryFee = Number(order?.deliveryFee || 0) || 0
  const discount = Number(order?.discount || 0) || 0
  const total = Number(order?.totalAmount || order?.subtotal || 0) || 0
  const paymentMethod = String(order?.payment?.method || 'COD')
  const paymentStatus = String(order?.payment?.status || '')

  // ESC/POS commands
  const INIT = "\x1B\x40"
  const ALIGN_CENTER = "\x1B\x61\x01"
  const ALIGN_LEFT = "\x1B\x61\x00"
  const BOLD_ON = "\x1B\x45\x01"
  const BOLD_OFF = "\x1B\x45\x00"
  const CUT = "\x1D\x56\x42\x00" // may be ignored by some printers

  let out = ''
  out += INIT

  // Header
  out += ALIGN_CENTER + BOLD_ON
  out += title + "\n"
  out += BOLD_OFF
  if (orderRef) out += `Order #${orderRef}\n`
  out += dateStr + "\n"
  out += ALIGN_LEFT
  out += sep + "\n"

  // Customer
  wrapLine(customerName, width).forEach(l => { out += l + "\n" })
  if (phone) out += phone.slice(0, width) + "\n"
  if (addressStr) wrapLine(addressStr, width).forEach(l => { out += l + "\n" })
  out += sep + "\n"

  // Items
  for (const it of items) {
    const qty = Number(it?.qty) || 1
    const name = String(it?.name || '').trim() || 'Item'
    const rate = Number(it?.rate ?? it?.price) || 0
    const lineTotal = Math.round(qty * rate)

    const prefix = `${qty}x `
    const nameWidth = Math.max(10, width - prefix.length)
    const lines = wrapLine(name, nameWidth)
    lines.forEach((l, idx) => {
      out += (idx === 0 ? prefix : ' '.repeat(prefix.length)) + l + "\n"
    })
    out += padLeft(`Rs ${lineTotal}`, width) + "\n"
  }

  out += sep + "\n"
  out += padBetween('Subtotal:', `Rs ${Math.round(subtotal)}`, width) + "\n"
  if (deliveryFee) out += padBetween('Delivery:', `Rs ${Math.round(deliveryFee)}`, width) + "\n"
  if (discount) out += padBetween('Discount:', `-Rs ${Math.round(discount)}`, width) + "\n"
  out += BOLD_ON
  out += padBetween('TOTAL:', `Rs ${Math.round(total)}`, width) + "\n"
  out += BOLD_OFF
  out += padBetween('Payment:', paymentMethod.toUpperCase(), width) + "\n"
  if (paymentStatus.toLowerCase() === 'paid') {
    out += ALIGN_CENTER + 'PAID' + ALIGN_LEFT + "\n"
  }

  out += "\n\n\n" // feed lines
  out += CUT
  return out
}

function toBase64Utf8(text) {
  const enc = new TextEncoder()
  const bytes = enc.encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export function printOrderReceiptViaRawBT(order, options = {}) {
  const receiptText = buildEscPosReceiptForOrder(order, options)
  const base64Data = toBase64Utf8(receiptText)
  // rawbt:base64, tells Android to open RawBT and print the payload.
  window.location.href = 'rawbt:base64,' + base64Data
}
