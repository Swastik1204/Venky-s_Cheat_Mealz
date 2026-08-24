// Shared API Client for Venky's Cheat Mealz (Customer App)
// Compliant with stack-standard.md cross-origin hosting split specification

import { auth } from '../lib/firebase'

const DEFAULT_API_BASE = 'https://venkys.vercel.app'

/**
 * Resolves the absolute API base URL. Never falls back to relative paths in production.
 */
export function getApiBaseUrl() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
  const raw = env?.VITE_API_BASE_URL
    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
    || env?.VITE_SITE_URL
    || env?.VITE_PUBLIC_BASE_URL
    || DEFAULT_API_BASE

  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

/**
 * Builds the full absolute URL for an API endpoint.
 */
export function buildApiUrl(path) {
  const base = getApiBaseUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

/**
 * Gets a fresh Firebase ID Token.
 */
async function getIdToken(forceRefresh = false) {
  try {
    const user = auth?.currentUser
    if (!user) return null
    return await user.getIdToken(forceRefresh)
  } catch {
    return null
  }
}

/**
 * Classifies an error response into a typed result.
 */
function classifyError(status, textBody, jsonBody, rawError) {
  if (rawError) {
    if (rawError.name === 'TypeError' && /failed to fetch|networkerror/i.test(rawError.message)) {
      return { type: 'network', status: 0, body: null, message: 'Network request failed or blocked by CORS' }
    }
    return { type: 'error', status: 0, body: null, message: rawError.message || 'Unknown error' }
  }

  // Check for HTML body tell (misrouted rewrite)
  if (typeof textBody === 'string' && (textBody.trim().startsWith('<!DOCTYPE html>') || textBody.trim().startsWith('<html'))) {
    return {
      type: 'html_response',
      status,
      body: textBody,
      message: 'Received HTML response instead of expected API JSON (misrouted rewrite / split origin tell)'
    }
  }

  if (status === 401) {
    return { type: 'auth', status, body: jsonBody, message: jsonBody?.error || 'Authentication required' }
  }
  if (status === 403) {
    return { type: 'forbidden', status, body: jsonBody, message: jsonBody?.error || 'Access forbidden' }
  }
  if (status >= 500) {
    return { type: 'server', status, body: jsonBody, message: jsonBody?.error || `Server error (${status})` }
  }

  return { type: 'error', status, body: jsonBody, message: jsonBody?.error || `Request failed (${status})` }
}

/**
 * Performs a resilient cross-origin API request with automatic token attachment
 * and automatic token refresh retry on HTTP 403.
 */
export async function apiRequest(path, options = {}) {
  const url = buildApiUrl(path)
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    ...rest
  } = options

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const execute = async (forceTokenRefresh = false) => {
    const token = await getIdToken(forceTokenRefresh)
    const reqHeaders = {
      Accept: 'application/json',
      ...headers
    }

    if (!isFormData && body && typeof body === 'object') {
      reqHeaders['Content-Type'] = 'application/json'
    }
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: reqHeaders,
        body: isFormData ? body : (body && typeof body === 'object' ? JSON.stringify(body) : body),
        signal: controller.signal,
        ...rest
      })
      clearTimeout(timer)

      const text = await response.text()
      let json = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }

      if (response.ok) {
        // If 200 OK returned HTML, it's a misrouted catch-all SPA rewrite
        if (typeof text === 'string' && (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html'))) {
          const classified = classifyError(response.status, text, json)
          return { ok: false, ...classified }
        }
        return { ok: true, data: json, status: response.status }
      }

      // Check if 403 can be retried once with force token refresh
      if (response.status === 403 && !forceTokenRefresh) {
        return null // signal retry
      }

      const classified = classifyError(response.status, text, json)
      return { ok: false, ...classified }
    } catch (err) {
      clearTimeout(timer)
      const classified = classifyError(0, null, null, err)
      return { ok: false, ...classified }
    }
  }

  // Attempt initial request
  let res = await execute(false)
  // If 403 received, force-refresh token and retry once
  if (res === null) {
    res = await execute(true)
  }

  return res
}

export const apiClient = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' }),
  buildUrl: buildApiUrl
}

export default apiClient
