// Razorpay payment helpers & public-config (admin POS)
import { apiUrl, getAuthHeaders } from './data-common'

let __publicConfigCache = null
let __publicConfigFailed = false

export async function fetchPublicConfig() {
	if (__publicConfigCache) return __publicConfigCache
	// Don't retry after a failure (until page refresh)
	if (__publicConfigFailed) {
		throw new Error('Public config fetch previously failed - page refresh required')
	}
	try {
		const url = apiUrl('/api/public-config')
		const res = await fetch(url, { method: 'GET' })
		let body = null
		try { body = await res.json() } catch {}
		if (!res.ok) {
			__publicConfigFailed = true
			const errorMsg = body?.error || `Failed to load public config (${res.status})`
			console.error('[fetchPublicConfig] Failed:', errorMsg)
			throw new Error(errorMsg)
		}
		__publicConfigCache = body || {}
		return __publicConfigCache
	} catch (e) {
		__publicConfigFailed = true
		console.error('[fetchPublicConfig] Exception:', e)
		throw e
	}
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
	const authHeaders = await getAuthHeaders()
	const res = await fetch(apiUrl('/api/create-order'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders },
		body: JSON.stringify({ amount: value })
	})
	let body = null
	try { body = await res.json() } catch { /* ignore */ }
	if (!res.ok) {
		throw new Error(body?.error || `Failed to create Razorpay order (${res.status})`)
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
	try { body = await res.json() } catch { /* ignore */ }
	if (!res.ok) {
		throw new Error(body?.error || `Payment verification failed (${res.status})`)
	}
	return body
}
