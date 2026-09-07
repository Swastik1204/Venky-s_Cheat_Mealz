// Razorpay payment functions routed through resilient apiClient
import { apiClient } from '../utils/apiClient'

let __publicConfigCache = null

export async function fetchPublicConfig() {
  if (__publicConfigCache) return __publicConfigCache
  const res = await apiClient.get('/api/public-config')
  if (!res.ok) {
    throw new Error(res.message || `Failed to load public config (${res.status})`)
  }
  __publicConfigCache = res.data || {}
  return __publicConfigCache
}

export async function getRazorpayKeyId() {
  const fromVite = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (fromVite) return String(fromVite)
  try {
    const cfg = await fetchPublicConfig()
    if (cfg?.razorpayKeyId) return String(cfg.razorpayKeyId)
  } catch { /* noop */ }
  return ''
}

// orderNo: the Firestore order doc ID from a prior /api/place-order call — the
//   server binds the Razorpay order to it (notes.firestoreOrderId) so
//   verify-payment.js can confirm the payment is for THIS order, not another
//   same-priced one the caller owns.
// items: [{ name, rate, qty, categoryId? }] - sent for server-side price verification
export async function createRazorpayOrder(orderNo, amount, items = null, cartChecksum = null) {
  if (!orderNo || typeof orderNo !== 'string') {
    throw new Error('orderNo is required to create a Razorpay order')
  }
  const value = Number(amount)
  if (!value || value <= 0) {
    throw new Error('Invalid amount for Razorpay order')
  }
  const payload = { orderNo, amount: value, cartChecksum: cartChecksum || undefined }
  if (Array.isArray(items) && items.length) {
    payload.items = items.map(it => ({
      name: it.name,
      rate: Number(it.rate ?? it.price ?? 0),
      qty: Number(it.qty || 1),
      categoryId: it.categoryId || undefined,
    }))
  }
  const res = await apiClient.post('/api/create-order', payload)
  if (!res.ok) {
    throw new Error(res.message || `Failed to create Razorpay order (${res.status})`)
  }
  if (!res.data) {
    throw new Error('Received empty response from server when creating Razorpay order')
  }
  return res.data
}

export async function verifyRazorpayPayment(payload) {
  const res = await apiClient.post('/api/verify-payment', payload)
  if (!res.ok) {
    throw new Error(res.message || `Payment verification failed (${res.status})`)
  }
  return res.data
}
