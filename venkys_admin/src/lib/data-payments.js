// Razorpay payment helpers & public-config (admin POS) routed through resilient apiClient
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
  } catch (e) {
    console.error('[getRazorpayKeyId] Failed to fetch config:', e)
  }
  return ''
}

// Admin POS: trusted caller — no cart-item verification needed
export async function createRazorpayOrder(amount) {
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Invalid amount for Razorpay order')
  const res = await apiClient.post('/api/create-order', { amount: value })
  if (!res.ok) {
    throw new Error(res.message || `Failed to create Razorpay order (${res.status})`)
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
