// Shared constants, helpers and utilities for the admin data layer
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
  return Math.round(num)
}

export function toDiscount(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  const clamped = Math.max(0, Math.min(99, num))
  const rounded = Math.round(clamped)
  return rounded > 0 ? rounded : null
}

export function normalizeTextKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function dedupeByTextKey(list, keySelector) {
  const seen = new Set()
  const out = []
  for (const item of Array.isArray(list) ? list : []) {
    const raw = keySelector ? keySelector(item) : item
    const key = normalizeTextKey(raw)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
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
  const id = typeof entry.id === 'string' && entry.id ? entry.id : safeRandomId('spot')
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
    hotDeals: ensureList(raw?.hotDeals),
    chefSpecials: ensureList(raw?.chefSpecials),
    hiddenHotDeals: !!raw?.hiddenHotDeals,
    hiddenChefSpecials: !!raw?.hiddenChefSpecials,
    hiddenSpotlight: !!raw?.hiddenSpotlight,
  }
}

// ── Phone normalizer (WhatsApp) ──
export function normalizeWhatsappPhone(phone) {
  let raw = ''
  if (typeof phone === 'string') {
    raw = phone.trim()
  } else if (typeof phone === 'number') {
    raw = String(phone).trim()
  } else if (phone && typeof phone === 'object') {
    raw = String(phone.phone || phone.value || phone.number || '').trim()
  } else {
    raw = String(phone || '').trim()
  }
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')

  // Common local formats: 0XXXXXXXXXX or 0091XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 14 && digits.startsWith('0091')) digits = digits.slice(2)
  if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(1)

  if (digits.length === 10) digits = `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits

  // Reject non-Indian or malformed numbers for WA sends.
  return ''
}

// ── API URL builder ──
export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
  const normalize = (value) => {
    if (!value) return ''
    return value.endsWith('/') ? value.slice(0, -1) : value
  }
  const productionBase = 'https://venkys-admin.vercel.app'
  const envBase = env?.VITE_API_BASE_URL
    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
  if (envBase) {
    return `${normalize(envBase)}${normalizedPath}`
  }
  if (typeof window !== 'undefined') {
    const runtimeBase = window.__APP_API_BASE__ || window.__API_BASE__ || window.__API_BASE_URL__
    if (runtimeBase) {
      return `${normalize(runtimeBase)}${normalizedPath}`
    }
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
