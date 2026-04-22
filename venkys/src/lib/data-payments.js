// Razorpay payment functions
import { apiUrl, getAuthHeaders } from './data-common'

let __publicConfigCache = null

export async function fetchPublicConfig() {
  if (__publicConfigCache) return __publicConfigCache
  const url = apiUrl('/api/public-config')
  const res = await fetch(url, { method: 'GET' })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    throw new Error(body?.error || `Failed to load public config (${res.status})`)
  }
  __publicConfigCache = body || {}
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

// items: [{ name, rate, qty, categoryId? }] - sent for server-side price verification
export async function createRazorpayOrder(amount, items = null, cartChecksum = null) {
  const value = Number(amount)
  if (!value || value <= 0) {
    throw new Error('Invalid amount for Razorpay order')
  }
  const authHeaders = await getAuthHeaders()
  const payload = { amount: value, cartChecksum: cartChecksum || undefined }
  if (Array.isArray(items) && items.length) {
    payload.items = items.map(it => ({
      name: it.name,
      rate: Number(it.rate ?? it.price ?? 0),
      qty: Number(it.qty || 1),
      categoryId: it.categoryId || undefined,
    }))
  }
  const res = await fetch(apiUrl('/api/create-order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    const message = body?.error || `Failed to create Razorpay order (${res.status})`
    throw new Error(message)
  }
  if (!body) {
    throw new Error('Received empty response from server when creating Razorpay order')
  }
  return body
}

export async function verifyRazorpayPayment(payload) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(apiUrl('/api/verify-payment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    const message = body?.error || `Payment verification failed (${res.status})`
    throw new Error(message)
  }
  return body
}
