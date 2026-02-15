// Shared constants, helpers and utilities for the data layer
import { auth } from './firebase'

// ── Branding ──
export const BRAND_LONG = "Venky's Chicken Xperience Durgapur"
export const BRAND_SHORT = "Venky's"

// ── Counter / ID helpers ──
export const DAILY_COUNTER_DOC = 'dailyCounter'

export function isCounterDocId(id) {
  return typeof id === 'string' && id.startsWith('__counter__')
}

export function safeRandomId(prefix = '') {
  const core = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  return prefix ? `${prefix}-${core}` : core
}

export function formatUserSegment(userId) {
  const raw = typeof userId === 'string' && userId.trim() ? userId.trim() : null
  if (!raw) return 'GUEST'
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '')
  if (!cleaned) return 'GUEST'
  return cleaned.length > 10 ? cleaned.slice(-10).toUpperCase() : cleaned.toUpperCase()
}

// ── Money / discount normalisers ──
export function toMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 100) / 100
}

export function toDiscount(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  const clamped = Math.max(0, Math.min(100, num))
  const rounded = Math.round(clamped * 10) / 10
  return rounded > 0 ? rounded : null
}

// ── Error helpers ──
export function isPermissionDenied(err) {
  return err && (err.code === 'permission-denied' || /insufficient permissions/i.test(String(err.message || '')))
}

// ── Firestore data sanitiser ──
export function sanitizeFirestoreData(input) {
  if (input === undefined) return undefined
  if (input === null) return null
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null
  }
  if (typeof input === 'string' || typeof input === 'boolean') {
    return input
  }
  if (input instanceof Date) {
    return input
  }
  if (Array.isArray(input)) {
    return input
      .map((value) => sanitizeFirestoreData(value))
      .filter((value) => value !== undefined)
  }
  if (typeof input === 'object') {
    const out = {}
    Object.entries(input).forEach(([key, value]) => {
      const sanitized = sanitizeFirestoreData(value)
      if (sanitized !== undefined) {
        out[key] = sanitized
      }
    })
    return out
  }
  return null
}

// ── Spotlight helpers ──
export const DEFAULT_SPOTLIGHT = { hotDeals: [], chefSpecials: [], hiddenHotDeals: false, hiddenChefSpecials: false, hiddenSpotlight: false }

export function makeSpotlightKey(categoryId, name) {
  const cat = (categoryId || '').trim().toLowerCase()
  const label = (name || '').trim().toLowerCase()
  return cat && label ? `${cat}::${label}` : ''
}

export function normalizeSpotlightEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const id = typeof entry.id === 'string' && entry.id ? entry.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const categoryId = typeof entry.categoryId === 'string' ? entry.categoryId.trim() : ''
  const itemName = typeof entry.itemName === 'string' ? entry.itemName.trim() : ''
  const matchKey = typeof entry.matchKey === 'string' && entry.matchKey.trim()
    ? entry.matchKey.trim()
    : makeSpotlightKey(categoryId, itemName)
  if (!categoryId || !itemName || !matchKey) return null
  return { id, categoryId, itemName, matchKey }
}

export function normalizeSpotlight(raw) {
  const ensureList = (value) => {
    if (!Array.isArray(value)) return []
    return value
      .map(normalizeSpotlightEntry)
      .filter(Boolean)
  }
  return {
    hotDeals: ensureList(raw?.hotDeals || raw?.discounted),
    chefSpecials: ensureList(raw?.chefSpecials || raw?.specials),
    hiddenHotDeals: !!raw?.hiddenHotDeals,
    hiddenChefSpecials: !!raw?.hiddenChefSpecials,
    hiddenSpotlight: !!raw?.hiddenSpotlight,
  }
}

// ── API URL builder ──
export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
  const normalize = (value) => {
    if (!value) return ''
    return value.endsWith('/') ? value.slice(0, -1) : value
  }
  const productionBase = 'https://venkys.vercel.app'
  const envBase = env?.VITE_API_BASE_URL
    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
    || env?.VITE_SITE_URL
    || env?.VITE_PUBLIC_BASE_URL
  if (envBase) {
    return `${normalize(envBase)}${normalizedPath}`
  }
  if (typeof window !== 'undefined') {
    const runtimeBase = window.__APP_API_BASE__ || window.__API_BASE__ || window.__API_BASE_URL__
    if (runtimeBase) {
      return `${normalize(runtimeBase)}${normalizedPath}`
    }
    if (env?.DEV) {
      return `${productionBase}${normalizedPath}`
    }
    return `${window.location.origin}${normalizedPath}`
  }
  return `${productionBase}${normalizedPath}`
}

// ── Auth header helper ──
export async function getAuthHeaders() {
  try {
    const user = auth.currentUser
    if (!user) return {}
    const token = await user.getIdToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
