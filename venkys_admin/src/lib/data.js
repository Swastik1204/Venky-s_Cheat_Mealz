// Data layer for Firestore (synced with customer app for consistency)
import { collection, doc, getDocs, getDoc, query, where, addDoc, setDoc, serverTimestamp, orderBy, deleteDoc, arrayUnion, writeBatch, runTransaction, limit as fsLimit, deleteField, increment, Timestamp } from 'firebase/firestore'
export const BRAND_LONG = "Venky's Chicken Xperience Durgapur"
export const BRAND_SHORT = "Venky's"
import { db } from './firebase'
import { logOrderChange, logInventoryChange, logStaffChange, logSettingsChange, logMenuChange, logBillingChange } from './auditLog'

function apiUrl(path) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
	const normalize = (value) => {
		if (!value) return ''
		return value.endsWith('/') ? value.slice(0, -1) : value
	}
	
	// IMPORTANT: Always use Vercel URL for API calls since:
	// - Frontend is hosted on Firebase Hosting (venkys-admin.web.app)
	// - API endpoints are on Vercel (venkys-admin.vercel.app)
	// Firebase Hosting does NOT support serverless functions
	const productionBase = 'https://venkys-admin.vercel.app'
	
	// Allow override via env var if needed (useful for staging/testing)
	const envBase = env?.VITE_API_BASE_URL
		|| (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
	if (envBase) {
		return `${normalize(envBase)}${normalizedPath}`
	}
	
	// Check for runtime override
	if (typeof window !== 'undefined') {
		const runtimeBase = window.__APP_API_BASE__ || window.__API_BASE__ || window.__API_BASE_URL__
		if (runtimeBase) {
			return `${normalize(runtimeBase)}${normalizedPath}`
		}
	}
	
	// Always use Vercel production URL (APIs don't run on Firebase Hosting)
	return `${productionBase}${normalizedPath}`
}

function safeRandomId(prefix = '') {
	const core = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
		? crypto.randomUUID()
		: `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
	return prefix ? `${prefix}-${core}` : core
}

// Document ID for daily order counter in miscellaneous collection
const DAILY_COUNTER_DOC = 'dailyCounter'

function formatUserSegment(userId) {
	const raw = typeof userId === 'string' && userId.trim() ? userId.trim() : null
	if (!raw) return 'GUEST'
	const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '')
	if (!cleaned) return 'GUEST'
	return cleaned.length > 10 ? cleaned.slice(-10).toUpperCase() : cleaned.toUpperCase()
}

// Legacy filter - kept for backward compatibility to filter old __counter__ docs from orders
function isCounterDocId(id) {
	return typeof id === 'string' && id.startsWith('__counter__')
}

// Export for use in components that need to filter counter docs
export { isCounterDocId }

function toMoney(value) {
	const num = Number(value)
	if (!Number.isFinite(num) || num < 0) return null
	return Math.round(num * 100) / 100
}

function toDiscount(value) {
	const num = Number(value)
	if (!Number.isFinite(num) || num <= 0) return null
	const clamped = Math.max(0, Math.min(100, num))
	const rounded = Math.round(clamped * 10) / 10
	return rounded > 0 ? rounded : null
}

const DEFAULT_SPOTLIGHT = { hotDeals: [], chefSpecials: [], hiddenHotDeals: false, hiddenChefSpecials: false, hiddenSpotlight: false }

function makeSpotlightKey(categoryId, name) {
	const cat = (categoryId || '').trim().toLowerCase()
	const label = (name || '').trim().toLowerCase()
	return cat && label ? `${cat}::${label}` : ''
}

function normalizeSpotlightEntry(entry) {
	if (!entry || typeof entry !== 'object') return null
	const id = typeof entry.id === 'string' && entry.id ? entry.id : safeRandomId('spot')
	const categoryId = typeof entry.categoryId === 'string' ? entry.categoryId.trim() : ''
	const itemName = typeof entry.itemName === 'string' ? entry.itemName.trim() : ''
	const matchKey = typeof entry.matchKey === 'string' && entry.matchKey.trim()
		? entry.matchKey.trim()
		: makeSpotlightKey(categoryId, itemName)
	if (!categoryId || !itemName || !matchKey) return null
	// Strip deprecated fields like label, caption, badge, itemIndex
	return { id, categoryId, itemName, matchKey }
}

function normalizeSpotlight(raw) {
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

// DEPRECATED: Old categories API - use fetchMenuCategories instead
// export async function fetchCategories() { ... }

// ---- Raw Materials / Stock Management ---- //

export async function fetchRawMaterials() {
	try {
		const snap = await getDocs(collection(db, 'raw_materials'))
		return snap.docs.map(d => ({ id: d.id, ...d.data() }))
	} catch (e) {
		console.error('fetchRawMaterials failed', e)
		return []
	}
}

export async function saveRawMaterial(data, performedBy = 'admin') {
	const { id, ...rest } = data
	const payload = {
		...rest,
		updatedAt: serverTimestamp()
	}
	
	if (id) {
		// Update existing - get before state
		const ref = doc(db, 'raw_materials', id)
		const beforeSnap = await getDoc(ref)
		const before = beforeSnap.exists() ? { id, ...beforeSnap.data() } : null
		
		await setDoc(ref, payload, { merge: true })
		
		// Get after state
		const afterSnap = await getDoc(ref)
		const after = afterSnap.exists() ? { id, ...afterSnap.data() } : null
		
		// Log the update
		await logInventoryChange('update', id, before, after, performedBy, {
			reason: 'Inventory item updated'
		}).catch(err => console.error('Failed to log inventory update:', err))
		
		return id
	} else {
		// Create new
		const ref = await addDoc(collection(db, 'raw_materials'), { ...payload, createdAt: serverTimestamp() })
		const newId = ref.id
		
		// Log the creation
		await logInventoryChange('create', newId, null, { id: newId, ...payload }, performedBy, {
			reason: 'New inventory item created'
		}).catch(err => console.error('Failed to log inventory creation:', err))
		
		return newId
	}
}

export async function deleteRawMaterial(id, performedBy = 'admin') {
	if (!id) return
	
	// Get before state
	const ref = doc(db, 'raw_materials', id)
	const beforeSnap = await getDoc(ref)
	const before = beforeSnap.exists() ? { id, ...beforeSnap.data() } : null
	
	await deleteDoc(ref)
	
	// Log the deletion
	await logInventoryChange('delete', id, before, null, performedBy, {
		reason: 'Inventory item deleted'
	}).catch(err => console.error('Failed to log inventory deletion:', err))
}

export async function updateRawMaterialStock(id, delta) {
	if (!id || !delta) return
	const ref = doc(db, 'raw_materials', id)
	await setDoc(ref, { 
		stock: increment(Number(delta)),
		updatedAt: serverTimestamp()
	}, { merge: true })
}

// Deduct stock based on order items
// This should be called when an order is accepted/confirmed
export async function deductStockForOrder(orderItems) {
	if (!Array.isArray(orderItems) || !orderItems.length) return
	
	// 1. Fetch all categories to get the recipe/ingredients map
	// (In a larger app, we might want to fetch only relevant items or store recipes separately)
	const categories = await fetchMenuCategories()
	const itemMap = new Map()
	categories.forEach(cat => {
		if (Array.isArray(cat.items)) {
			cat.items.forEach(item => {
				// Key by name (or ID if available, but currently items are inside category arrays)
				// Assuming item names are unique enough or we match by category+name
				itemMap.set(item.name, item) 
			})
		}
	})

	const batch = writeBatch(db)
	let hasUpdates = false

	for (const orderItem of orderItems) {
		const menuName = orderItem.name || orderItem.itemName
		const qty = Number(orderItem.qty || orderItem.quantity || 1)
		const menuItem = itemMap.get(menuName)

		if (menuItem && Array.isArray(menuItem.ingredients)) {
			for (const ing of menuItem.ingredients) {
				if (ing.materialId && ing.quantity) {
					const deduction = Number(ing.quantity) * qty
					const ref = doc(db, 'raw_materials', ing.materialId)
					batch.update(ref, { stock: increment(-deduction) })
					hasUpdates = true
				}
			}
		}
	}

	if (hasUpdates) {
		await batch.commit()
	}
}


export async function fetchMenuItems(activeOnly = true) {
	try {
		const col = collection(db, 'menuItems')
		const q = activeOnly ? query(col, where('active', '==', true)) : col
		let snap = await getDocs(q)
		if (activeOnly && snap.empty) {
			snap = await getDocs(col)
		}
		return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
	} catch (err) {
		console.error('[firestore] fetchMenuItems failed:', err)
		return []
	}
}

export async function generateDailyOrderNo(orderType = 'dine-in', userId = null) {
	const type = String(orderType || 'dine-in').toLowerCase()
	const now = new Date()
	const y = now.getFullYear()
	const m = String(now.getMonth() + 1).padStart(2, '0')
	const d = String(now.getDate()).padStart(2, '0')
	const dateKey = `${y}${m}${d}`
	// Use single counter document in miscellaneous collection with daily reset
	const counterRef = doc(db, 'miscellaneous', DAILY_COUNTER_DOC)
	const next = await runTransaction(db, async (tx) => {
		const snap = await tx.get(counterRef)
		const data = snap.exists() ? snap.data() : {}
		// Reset counter if it's a new day
		const currentDateKey = data.currentDate || ''
		const currentTotal = currentDateKey === dateKey ? (Number(data.total) || 0) : 0
		const newTotal = currentTotal + 1
		tx.set(counterRef, {
			currentDate: dateKey,
			total: newTotal,
			lastOrderType: type,
			updatedAt: serverTimestamp(),
		}, { merge: true })
		return newTotal
	})
	const seq = String(next).padStart(4, '0')
	const segment = formatUserSegment(userId)
	return `${dateKey}-${seq}-${segment}`
}

export async function createOrder({
	userId = null,
	customer = {},
	items,
	orderType = 'delivery',
	source = 'web',
	orderNo = null,
	taxRate = null,
	taxAmount = null,
	totalAmount = null,
	status = 'placed',
	guestOrder = null,
	guestOrderDate = null,
	guestOrderAt = null,
	cashManagerOtp = null,
	cashManagerOtpFor = null,
	cashManagerOtpVerified = null,
	cashManagerOtpVerifiedAt = null,
	cashManagerOtpVerifiedBy = null,
} = {}) {
	const safeItems = Array.isArray(items) ? items : []
	if (!safeItems.length) {
		throw new Error('Order must include at least one item')
	}

	const normalizedItems = safeItems.map((item, idx) => {
		const price = Number(item?.price) || 0
		const qty = Number(item?.qty) || 0
		const total = Number((price * qty).toFixed(2))
		const normalized = {
			id: item?.id || `item-${idx + 1}`,
			name: String(item?.name || `Item ${idx + 1}`).trim(),
			price,
			qty,
			total,
		}
		if (item?.note) normalized.note = String(item.note)
		if (item?.modifiers) normalized.modifiers = item.modifiers
		return normalized
	})
	const subtotal = Number(normalizedItems.reduce((sum, it) => sum + (Number(it.total) || (it.price * it.qty)), 0).toFixed(2))
	const normalizedTaxRate = typeof taxRate === 'number' ? taxRate : (taxRate != null ? Number(taxRate) : null)
	const normalizedTaxAmount = taxAmount != null ? Number(taxAmount) : (normalizedTaxRate != null ? Number((subtotal * normalizedTaxRate).toFixed(2)) : null)
	const resolvedTotalAmount = totalAmount != null ? Number(totalAmount) : Number((subtotal + (normalizedTaxAmount || 0)).toFixed(2))
	const resolvedOrderNo = orderNo || await generateDailyOrderNo(orderType, userId || customer?.servedBy || customer?.phone || null)

	const payment = (() => {
		const raw = customer?.payment && typeof customer.payment === 'object' ? customer.payment : {}
		return {
			method: raw.method || 'cod',
			status: raw.status || 'pending',
			reference: raw.reference || null,
			collectedBy: raw.collectedBy || null,
			collectedAt: raw.collectedAt || null,
			metadata: raw.metadata || null,
		}
	})()

	const customerPayload = {
		name: customer?.name ? String(customer.name).trim() : '',
		phone: customer?.phone ? String(customer.phone).trim() : '',
		address: customer?.address || '',
		instructions: customer?.instructions || '',
		landmark: customer?.landmark || '',
		servedBy: customer?.servedBy || '',
		table: customer?.table || '',
		payment,
	}
	if (customer?.email) customerPayload.email = String(customer.email).trim()
	if (customer?.geoHash) customerPayload.geoHash = customer.geoHash
	if (customer?.location) customerPayload.location = customer.location

	const statusActor = source === 'pos' ? 'pos' : (userId ? `user:${userId}` : 'guest')

	// Use Timestamp.now() instead of serverTimestamp() in arrays (Firestore limitation)
	const nowTs = Timestamp.now()

	const normalizedStatus = String(status || 'placed').toLowerCase()
	const safeStatus = ['placed', 'preparing', 'ready', 'delivered', 'rejected'].includes(normalizedStatus) ? normalizedStatus : 'placed'
	const base = {
		userId: userId || null,
		customer: customerPayload,
		items: normalizedItems,
		subtotal,
		orderType,
		source,
		orderNo: resolvedOrderNo,
		status: safeStatus,
		statusHistory: [{ status: safeStatus, at: nowTs, actor: statusActor }],
		payment,
		totalAmount: resolvedTotalAmount,
		revisionCount: 0,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	}

	const normalizedOrderType = String(orderType || '').toLowerCase()
	const normalizedPayMethod = String(payment?.method || '').toLowerCase()
	const needsManagerOtp = normalizedOrderType === 'dine-in' && normalizedPayMethod === 'cod'
	if (needsManagerOtp) {
		const providedOtp = String(cashManagerOtp || '').trim()
		if (providedOtp) {
			base.cashManagerOtp = providedOtp
			base.cashManagerOtpFor = String(cashManagerOtpFor || 'dine-in-cod')
		} else {
			let otp = ''
			try {
				if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
					const buf = new Uint32Array(1)
					crypto.getRandomValues(buf)
					otp = String(buf[0] % 1000000).padStart(6, '0')
				} else {
					otp = String(Math.floor(100000 + Math.random() * 900000))
				}
			} catch {
				otp = String(Math.floor(100000 + Math.random() * 900000))
			}
			base.cashManagerOtp = otp
			base.cashManagerOtpFor = 'dine-in-cod'
		}
	}

	if (cashManagerOtpVerified != null) base.cashManagerOtpVerified = !!cashManagerOtpVerified
	if (cashManagerOtpVerifiedAt) base.cashManagerOtpVerifiedAt = cashManagerOtpVerifiedAt
	if (cashManagerOtpVerifiedBy) base.cashManagerOtpVerifiedBy = cashManagerOtpVerifiedBy
	if (guestOrder != null) base.guestOrder = !!guestOrder
	if (guestOrderDate) base.guestOrderDate = String(guestOrderDate)
	if (guestOrderAt) base.guestOrderAt = String(guestOrderAt)
	if (normalizedTaxRate != null) base.taxRate = normalizedTaxRate
	if (normalizedTaxAmount != null) base.taxAmount = normalizedTaxAmount

	const topRef = doc(db, 'orders', resolvedOrderNo)
	// Single source of truth: always store orders in top-level `orders/{orderId}`.
	// We no longer duplicate full orders into `users/{uid}/orders/{orderId}`.
	await setDoc(topRef, base)
	// Best-effort: notify Cash Manager
	try { void notifyCashManagerOnOrder(resolvedOrderNo, base) } catch { /* noop */ }
	return resolvedOrderNo
}

function normalizeWhatsappPhone(phone) {
	// Handle different input types
	let raw = ''
	if (typeof phone === 'string') {
		raw = phone.trim()
	} else if (typeof phone === 'number') {
		raw = String(phone).trim()
	} else if (phone && typeof phone === 'object') {
		// If phone is an object, try to extract a string value
		raw = String(phone.phone || phone.value || phone.number || '').trim()
	} else {
		raw = String(phone || '').trim()
	}
	
	if (!raw) return ''
	
	// Extract only digits
	const digits = raw.replace(/\D/g, '')
	
	// If 10 digits, add 91 prefix (Indian mobile)
	if (digits.length === 10) {
		return `91${digits}`
	}
	
	// If 12 digits starting with 91, return as-is
	if (digits.length === 12 && digits.startsWith('91')) {
		return digits
	}
	
	// Return digits as-is for other cases
	return digits
}

async function notifyCashManagerOnOrder(orderId, orderPayload) {
	try {
		const settings = await fetchAppSettings()
		const rawList = Array.isArray(settings?.cashManagerPhones) && settings.cashManagerPhones.length
			? settings.cashManagerPhones
			: [settings?.cashManagerPhone || '']
		const phones = rawList.map((p) => normalizeWhatsappPhone(p)).filter(Boolean)
		if (!phones.length) return { __skipped: 'no_cash_manager_phone' }

		const orderNo = orderPayload?.orderNo || orderId
		const type = String(orderPayload?.orderType || '').toLowerCase()
		const method = String(orderPayload?.payment?.method || '').toLowerCase()
		const otp = orderPayload?.cashManagerOtp

		// OTP should ONLY be sent for dine-in COD orders, and only if the OTP exists on the order.
		if (!(type === 'dine-in' && method === 'cod' && otp)) {
			return { __skipped: 'not_dinein_cod_or_missing_otp', orderNo }
		}

		// Template has a URL button that requires a parameter (Meta error 131008).
		// Meta enforces a max length of 15 characters for URL button parameters.
		// Prefer OTP (short) and fall back to a truncated orderNo.
		const rawButtonParam = otp ? String(otp) : String(orderNo || '')
		const buttonParam = rawButtonParam.replace(/\s+/g, '').slice(0, 15)
		const templatePayload = {
			templateName: 'venkys_otp',
			templateLanguage: 'en',
			components: [
				{
					type: 'body',
					parameters: [
						{ type: 'text', text: String(otp) },
					],
				},
				{
					type: 'button',
					sub_type: 'url',
					index: '0',
					parameters: [{ type: 'text', text: buttonParam }],
				},
			]
		}
		const results = await Promise.allSettled(phones.map((p) => sendWhatsAppInvoice(p, templatePayload)))
		const ok = results.filter(r => r.status === 'fulfilled' && !r.value?.__error).length
		if (ok === 0) {
			const firstErr = results.find(r => r.status === 'fulfilled' && r.value?.__error)?.value
			try {
				console.warn('[OTP Template Failed]', JSON.stringify({
					error: firstErr?.__error,
					message: firstErr?.message,
					details: firstErr?.data?.error?.error_data?.details,
					template: { name: 'venkys_otp', language: 'en', bodyParamCount: 1, urlButtonIndex0Param: buttonParam }
				}, null, 2))
			} catch {}
			// Fallback to plain text if template send fails.
			await Promise.allSettled(phones.map((p) => sendWhatsAppInvoice(p, { text: `OTP: ${otp}` })))
			return { __error: firstErr?.__error || 'template_failed', message: firstErr?.message || 'Template send failed' }
		}
		return { ok, total: phones.length }
	} catch (e) {
		return { __error: 'notify_failed', message: String(e) }
	}
}

export async function sendWhatsAppInvoice(phone, payload) {
	try {
		const normalizedPhone = normalizeWhatsappPhone(phone)
		if (!normalizedPhone) {
			return { __skipped: 'missing_phone' }
		}
		
		// Use apiUrl() to get the correct URL (production in dev, relative in prod)
		const url = apiUrl('/api/send-whatsapp')
		
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phone: normalizedPhone, payload })
		})
		let body = null
		try { body = await res.json() } catch { /* ignore non-JSON responses */ }
		
		if (res.ok) {
			return body || {}
		}
		const errObj = { __error: 'http_error', status: res.status, ...(body || {}) }
		try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
		return errObj
	} catch (e) {
		const errObj = { __error: 'network', message: String(e) }
		try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
		return errObj
	}
}

// Dedicated order_messenger sender (template-based) for online order notifications.
// Uses the Vercel API function /api/send-order-messenger.
export async function sendOrderMessengerViaWhatsApp(phone, { customerName, totalAmount, address } = {}) {
	try {
		// Use raw number (just digits) without forcing 91 prefix
		const normalizedPhone = String(phone || '').replace(/\D/g, '')
		if (!normalizedPhone || normalizedPhone.length < 10) return { __skipped: 'missing_phone' }

		const url = apiUrl('/api/send-order-messenger')
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				phone: normalizedPhone,
				customerName: String(customerName || '').trim(),
				totalAmount,
				address: String(address || '').trim(),
			}),
		})
		let body = null
		try { body = await res.json() } catch { /* ignore */ }
		if (res.ok) return body || {}
		const errObj = { __error: 'http_error', status: res.status, ...(body || {}) }
		try { console.warn('[order_messenger] send failed', JSON.stringify(errObj, null, 2)) } catch {}
		return errObj
	} catch (e) {
		return { __error: 'network', message: String(e) }
	}
}

let __publicConfigCache = null
let __publicConfigFailed = false

export async function fetchPublicConfig() {
	// Return cached config if available
	if (__publicConfigCache) {
		console.log('[fetchPublicConfig] Returning cached config')
		return __publicConfigCache
	}
	
	// Don't retry if previous attempt failed (until page refresh)
	if (__publicConfigFailed) {
		console.warn('[fetchPublicConfig] Previous fetch failed - returning failure')
		throw new Error('Public config fetch previously failed - page refresh required')
	}
	
	try {
		const url = apiUrl('/api/public-config')
		console.log('[fetchPublicConfig] Fetching from:', url)
		const res = await fetch(url, { method: 'GET' })
		console.log('[fetchPublicConfig] Response status:', res.status, res.statusText)
		let body = null
		try { body = await res.json() } catch {}
		if (!res.ok) {
			__publicConfigFailed = true
			const errorMsg = body?.error || `Failed to load public config (${res.status})`
			console.error('[fetchPublicConfig] Failed:', errorMsg)
			throw new Error(errorMsg)
		}
		__publicConfigCache = body || {}
		console.log('[fetchPublicConfig] Success, razorpayKeyId present:', !!__publicConfigCache.razorpayKeyId)
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

/**
 * Send OTP via WhatsApp using template (works outside 24h window)
 * Uses venkys_otp template with OTP as parameter
 * Falls back to plain text if template fails
 */
export async function sendOtpViaWhatsApp(phone, otp, orderRef = '') {
	// sendWhatsAppInvoice already normalizes the phone, so don't normalize here
	if (!phone) {
		return { __error: 'missing_phone' }
	}
	
	// First try template (works outside 24h window)
	// Note: venkys_otp template has a URL button that *requires* a parameter.
	// Meta enforces a max length of 15 chars for URL button parameters.
	const rawButtonParam = otp ? String(otp) : String(orderRef || '')
	const buttonParam = rawButtonParam.replace(/\s+/g, '').slice(0, 15) || '0'
	const templatePayload = {
		templateName: 'venkys_otp',
		templateLanguage: 'en',
		components: [
			{
				type: 'body',
				parameters: [
					{ type: 'text', text: String(otp) },
				],
			},
			{
				type: 'button',
				sub_type: 'url',
				index: '0',
				parameters: [{ type: 'text', text: buttonParam }],
			},
		]
	}
	
	const res = await sendWhatsAppInvoice(phone, templatePayload)
	
	// If template succeeded, return
	if (!res?.__error) {
		return res
	}
	
	// Fallback to plain text (only works within 24h window)
	const textMessage = orderRef
		? `🔐 Dine-in COD OTP\nOrder: ${orderRef}\nOTP: ${otp}`
		: `🔐 Your OTP: ${otp}`
	
	return await sendWhatsAppInvoice(phone, { text: textMessage })
}

export async function updateOrder(userId, orderId, data = {}, actor = null) {
	if (!orderId) throw new Error('Missing orderId')
	const patch = (data && typeof data === 'object') ? { ...data } : {}
	
	let beforeState = null
	let afterState = null

	await runTransaction(db, async (tx) => {
		const orderRef = doc(db, 'orders', orderId)
		const requestedUserId = userId || null

		let orderSnap = await tx.get(orderRef)
		let legacyNestedRef = null

		// Legacy fallback: some older deployments duplicated orders under users/{uid}/orders/{orderId}
		if (!orderSnap.exists() && requestedUserId) {
			const nestedRef = doc(db, 'users', requestedUserId, 'orders', orderId)
			const nestedSnap = await tx.get(nestedRef)
			if (nestedSnap.exists()) {
				orderSnap = nestedSnap
				legacyNestedRef = nestedRef
			}
		}

		if (!orderSnap.exists()) throw new Error('Order not found')

		const prev = orderSnap.data() || {}
		beforeState = { id: orderId, ...prev } // Capture before state
		const resolvedUserId = requestedUserId || prev.userId || null
		const actorId = actor || (resolvedUserId ? `user:${resolvedUserId}` : 'admin')

		const updatePayload = { ...patch, updatedAt: serverTimestamp(), revisionCount: increment(1) }
		if (Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status !== prev.status) {
			// Use Timestamp.now() instead of serverTimestamp() in arrays (Firestore limitation)
			updatePayload.statusHistory = arrayUnion({
				status: patch.status,
				note: patch.statusNote || null,
				actor: actorId,
				at: Timestamp.now(),
			})
		}
		delete updatePayload.statusNote
		
		afterState = { id: orderId, ...prev, ...updatePayload } // Capture after state

		// Canonical storage: always write to top-level order doc.
		// If this is a legacy nested-only order, migrate it to top-level and remove the nested duplicate.
		if (legacyNestedRef) {
			tx.set(orderRef, { ...prev, ...updatePayload, userId: resolvedUserId || null }, { merge: true })
			try { tx.delete(legacyNestedRef) } catch { /* noop */ }
		} else {
			tx.set(orderRef, updatePayload, { merge: true })
		}
	})
	
	// Log the order update (after transaction completes)
	if (beforeState && afterState) {
		await logOrderChange('update', orderId, beforeState, afterState, actor || 'system', {
			userId,
			reason: `Order ${patch.status ? `status changed to ${patch.status}` : 'updated'}`
		}).catch(err => console.error('Failed to log order update:', err))
	}
}

export async function fetchOrder(userId, orderId) {
	// Prefer canonical top-level orders; fallback to legacy nested orders if needed.
	const topSnap = await getDoc(doc(db, 'orders', orderId))
	if (topSnap.exists()) return { id: topSnap.id, ...topSnap.data() }
	if (userId) {
		const nestedSnap = await getDoc(doc(db, 'users', userId, 'orders', orderId))
		return nestedSnap.exists() ? { id: nestedSnap.id, ...nestedSnap.data() } : null
	}
	return null
}

export async function fetchAllOrders() {
	try {
		const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
		return snap.docs
			.filter((d) => !isCounterDocId(d.id))
			.map(d => ({ id: d.id, ...d.data() }))
	} catch (err) {
		console.error('[firestore] fetchAllOrders failed', err)
		return []
	}
}

export async function fetchRecentOrders(limitCount = 10, sourceFilter = null) {
	try {
		const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), fsLimit(Math.max(10, limitCount))))
		let list = snap.docs
			.filter((d) => !isCounterDocId(d.id))
			.map(d => ({ id: d.id, ...d.data() }))
		if (sourceFilter) list = list.filter(o => (o.source || null) === sourceFilter)
		if (list.length > limitCount) list = list.slice(0, limitCount)
		return list
	} catch (err) {
		console.error('[firestore] fetchRecentOrders failed', err)
		return []
	}
}

export const GUEST_USER_ID = 'guest'

export async function ensureGuestUser() {
	const ref = doc(db, 'users', GUEST_USER_ID)
	let exists = false
	try {
		const snap = await getDoc(ref)
		exists = snap.exists()
	} catch {
		// ignore existence check errors; still attempt to create/merge
	}
	const payload = {
		isGuest: true,
		name: 'Guest',
		role: 'guest',
		updatedAt: serverTimestamp(),
	}
	if (!exists) payload.createdAt = serverTimestamp()
	await setDoc(ref, payload, { merge: true })
	return GUEST_USER_ID
}

export function nextOrderStatus(current) {
	const flow = ['placed', 'preparing', 'ready', 'delivered']
	const idx = flow.indexOf(current)
	return idx === -1 ? flow[0] : (idx < flow.length - 1 ? flow[idx + 1] : flow[idx])
}

export async function fetchLatestUserOrder(userId) {
	if (!userId) return null
	const orders = await fetchUserOrders(userId)
	return orders.length ? orders[0] : null
}

export async function fetchUserOrders(userId) {
	try {
		// Preferred: top-level orders (single source of truth)
		const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId), fsLimit(100)))
		const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
		list.sort((a, b) => {
			const ta = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0)
			const tb = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0)
			return tb - ta
		})
		return list
	} catch (err) {
		// Fallback: legacy nested orders (if some deployments still used users/{uid}/orders)
		try {
			const nested = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc')))
			return nested.docs.map((d) => ({ id: d.id, ...d.data() }))
		} catch {
			console.error('[firestore] fetchUserOrders failed:', err)
			return []
		}
	}
}

export async function getUser(uid) {
	const ref = doc(db, 'users', uid)
	const snap = await getDoc(ref)
	return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUser(uid, data) {
	const ref = doc(db, 'users', uid)
	await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getUserTheme(uid) {
	if (!uid) return null
	try {
		const snap = await getDoc(doc(db, 'users', uid))
		if (!snap.exists()) return null
		const t = snap.data().theme
		return t === 'venkys_dark' || t === 'venkys_light' ? t : null
	} catch {
		return null
	}
}

export async function setUserTheme(uid, theme) {
	if (!uid) return
	const normalized = theme === 'venkys_dark' ? 'venkys_dark' : 'venkys_light'
	await setDoc(doc(db, 'users', uid), { theme: normalized, updatedAt: serverTimestamp() }, { merge: true })
}

export async function fetchItems() {
	try {
		const snap = await getDocs(collection(db, 'items'))
		return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
	} catch (err) {
		console.error('[firestore] fetchItems failed:', err)
		return []
	}
}

export async function addItem(item) {
	return addDoc(collection(db, 'items'), {
		item_name: item.item_name,
		MRP: Number(item.MRP) || 0,
		GST: Number(item.GST) || 0,
		Discount: Number(item.Discount) || 0,
		createdAt: serverTimestamp(),
	})
}

export async function upsertCategory(id, data) {
	const ref = doc(db, 'categories', id)
	await setDoc(ref, { name: data.name, updatedAt: serverTimestamp() }, { merge: true })
	return id
}

export async function upsertMenuItem(id, data) {
	const ref = doc(db, 'menuItems', id)
	await setDoc(
		ref,
		{
			name: data.name,
			price: Number(data.price) || 0,
			categoryId: data.categoryId,
			active: data.active ?? true,
			desc: data.desc ?? '',
			image: data.image ?? '',
			updatedAt: serverTimestamp(),
			createdAt: data.createdAt || serverTimestamp(),
		},
		{ merge: true }
	)
	return id
}

export async function deleteMenuItem(id) {
	await deleteDoc(doc(db, 'menuItems', id))
}

export async function fetchMenuCategories() {
	try {
		const snap = await getDocs(collection(db, 'menu'))
		let cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
		try {
			const appearanceRef = doc(db, 'miscellaneous', 'appearance')
			const appSnap = await getDoc(appearanceRef)
			if (appSnap.exists()) {
				const data = appSnap.data()
				if (Array.isArray(data.categoriesOrder) && data.categoriesOrder.length) {
					const orderMap = new Map(data.categoriesOrder.map((id, idx) => [id, idx]))
					cats.sort((a,b) => {
						const ai = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER
						const bi = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER
						if (ai === bi) return a.id.localeCompare(b.id)
						return ai - bi
					})
				}
			}
		} catch { /* ignore categories appearance ordering */ }
		return cats
	} catch (err) {
		console.error('[firestore] fetchMenuCategories failed:', err)
		return []
	}
}

export async function fetchAppearanceSettings() {
	try {
		const ref = doc(db, 'miscellaneous', 'appearance')
		const snap = await getDoc(ref)
		if (!snap.exists()) {
			const fallback = { categoriesOrder: [], spotlight: DEFAULT_SPOTLIGHT }
			try {
				await setDoc(ref, { ...fallback, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
			} catch (err) {
				console.warn('[firestore] unable to prime appearance doc', err)
			}
			return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __exists: false }
		}
		const data = snap.data() || {}
		const categoriesOrder = Array.isArray(data.categoriesOrder) ? data.categoriesOrder : []
		const spotlight = normalizeSpotlight(data.spotlight || DEFAULT_SPOTLIGHT)
		// Backfill spotlight field if entirely missing OR if any key like hiddenSpotlight is missing
		const needsFlagBackfill = !data.spotlight || (
			data.spotlight && (
				data.spotlight.hiddenSpotlight === undefined ||
				data.spotlight.hiddenHotDeals === undefined ||
				data.spotlight.hiddenChefSpecials === undefined
			)
		)
		// Also backfill if deprecated fields exist in any entry (label, caption, badge, itemIndex)
		const hasDeprecated = (() => {
			const hasBad = (arr) => Array.isArray(arr) && arr.some((e) => e && typeof e === 'object' && (
				Object.prototype.hasOwnProperty.call(e, 'label') ||
				Object.prototype.hasOwnProperty.call(e, 'caption') ||
				Object.prototype.hasOwnProperty.call(e, 'badge') ||
				Object.prototype.hasOwnProperty.call(e, 'itemIndex')
			))
			return hasBad(data.spotlight?.hotDeals) || hasBad(data.spotlight?.chefSpecials)
		})()
		const needsBackfill = needsFlagBackfill || hasDeprecated
		if (needsBackfill) {
			try { await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] unable to backfill spotlight field', err) }
		}
		return { categoriesOrder, spotlight, __exists: true }
	} catch (e) {
		console.error('[firestore] fetchAppearanceSettings failed', e)
		return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __exists: false }
	}
}

export async function saveCategoriesOrder(orderIds) {
	if (!Array.isArray(orderIds)) return false
	const ref = doc(db, 'miscellaneous', 'appearance')
	await setDoc(ref, { categoriesOrder: orderIds, updatedAt: serverTimestamp() }, { merge: true })
	return true
}

export async function saveAppearanceSpotlight(spotlightLike) {
	const ref = doc(db, 'miscellaneous', 'appearance')
	const spotlight = normalizeSpotlight(spotlightLike || DEFAULT_SPOTLIGHT)
	await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true })
	return spotlight
}

export async function fetchAppSettings() {
	try {
		const snap = await getDoc(doc(db, 'miscellaneous', 'settings'))
		if (!snap.exists()) return {
			gstRate: 0.05,
			adminMobile: '',
			cashManagerPhones: [],
			orderMessengerPhones: [],
			shopAddress: '',
			shopPhone: '',
			chefName: '',
			centerLat: '',
			centerLng: '',
			radiusKm: 8,
			locationLink: '',
			minLat: null,
			maxLat: null,
			minLng: null,
			maxLng: null,
			googlePlaceId: ''
		}
		const d = snap.data()
		const normalize10 = (p) => {
			let digits = String(p || '').replace(/\D/g, '')
			if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
			return digits.length === 10 ? digits : null
		}
		const gstRate = typeof d.gstRate === 'number' ? d.gstRate : (Number(d.gstRate) || 0.05)
		const adminMobile = d.adminMobile || ''
		const orderMessengerPhones = Array.isArray(d.orderMessengerPhones)
			? d.orderMessengerPhones.map((p) => normalize10(p)).filter(Boolean)
			: []
		const shopAddress = d.shopAddress || ''
		const shopPhone = d.shopPhone || ''
		const chefName = d.chefName || ''
		const centerLat = typeof d.centerLat === 'number' ? String(d.centerLat) : (typeof d.centerLat === 'string' ? d.centerLat : '')
		const centerLng = typeof d.centerLng === 'number' ? String(d.centerLng) : (typeof d.centerLng === 'string' ? d.centerLng : '')
		const radiusKm = typeof d.radiusKm === 'number' ? d.radiusKm : 8
		const locationLink = typeof d.locationLink === 'string' ? d.locationLink : ''
		const minLat = typeof d.minLat === 'number' ? d.minLat : null
		const maxLat = typeof d.maxLat === 'number' ? d.maxLat : null
		const minLng = typeof d.minLng === 'number' ? d.minLng : null
		const maxLng = typeof d.maxLng === 'number' ? d.maxLng : null
		const googlePlaceId = d.googlePlaceId || ''
		let cashManagerPhones = Array.isArray(d.cashManagerPhones)
			? d.cashManagerPhones.map((p) => normalize10(p)).filter(Boolean)
			: []
		const legacyCashManager = normalize10(d.cashManagerPhone)
		if (!cashManagerPhones.length && legacyCashManager) cashManagerPhones = [legacyCashManager]
		const cashManagerPhone = cashManagerPhones[0] || legacyCashManager || ''
		return {
			gstRate,
			cashManagerPhone,
			cashManagerPhones,
			adminMobile,
			orderMessengerPhones,
			shopAddress,
			shopPhone,
			chefName,
			centerLat,
			centerLng,
			radiusKm,
			locationLink,
			minLat,
			maxLat,
			minLng,
			maxLng,
			googlePlaceId
		}
	} catch {
		return {
			gstRate: 0.05,
			cashManagerPhone: '',
			cashManagerPhones: [],
			adminMobile: '',
			orderMessengerPhones: [],
			shopAddress: '',
			shopPhone: '',
			chefName: '',
			centerLat: '',
			centerLng: '',
			radiusKm: 8,
			locationLink: '',
			minLat: null,
			maxLat: null,
			minLng: null,
			maxLng: null,
			googlePlaceId: ''
		}
	}
}

export async function saveAppSettings(partial) {
	const payload = {}
	const normalize10 = (p) => {
		let digits = String(p || '').replace(/\D/g, '')
		if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
		return digits.length === 10 ? digits : ''
	}
	if (partial.gstRate !== undefined) payload.gstRate = Number(partial.gstRate) || 0
	if (partial.adminMobile !== undefined) payload.adminMobile = String(partial.adminMobile || '')
	if (partial.cashManagerPhones !== undefined) {
		const list = Array.isArray(partial.cashManagerPhones)
			? partial.cashManagerPhones.map((p) => normalize10(p)).filter(Boolean)
			: []
		payload.cashManagerPhones = list
		// keep legacy single-field in sync for older clients
		payload.cashManagerPhone = list[0] || ''
	}
	if (partial.orderMessengerPhones !== undefined) {
		payload.orderMessengerPhones = Array.isArray(partial.orderMessengerPhones)
			? partial.orderMessengerPhones.map((p) => normalize10(p)).filter(Boolean)
			: []
	}
	if (partial.shopAddress !== undefined) payload.shopAddress = String(partial.shopAddress || '')
	if (partial.shopPhone !== undefined) payload.shopPhone = String(partial.shopPhone || '')
	if (partial.chefName !== undefined) payload.chefName = String(partial.chefName || '')
	if (partial.cashManagerPhone !== undefined && partial.cashManagerPhones === undefined) {
		const one = normalize10(partial.cashManagerPhone)
		payload.cashManagerPhone = one
		payload.cashManagerPhones = one ? [one] : []
	}
	if (partial.googlePlaceId !== undefined) payload.googlePlaceId = String(partial.googlePlaceId || '')
	// Delivery fields
	if (partial.centerLat !== undefined) payload.centerLat = Number(partial.centerLat)
	if (partial.centerLng !== undefined) payload.centerLng = Number(partial.centerLng)
	if (partial.radiusKm !== undefined) payload.radiusKm = Number(partial.radiusKm)
	if (partial.locationLink !== undefined) payload.locationLink = String(partial.locationLink || '')
	// Calculate min/max lat/lng if centerLat, centerLng, and radiusKm are provided
	if (payload.centerLat != null && payload.centerLng != null && payload.radiusKm != null) {
		const toRad = (x) => (x * Math.PI) / 180
		const degLatPerKm = 1 / 110.574
		const degLngPerKm = 1 / (111.320 * Math.cos(toRad(payload.centerLat || 0)) || 1)
		const dLat = payload.radiusKm * degLatPerKm
		const dLng = payload.radiusKm * degLngPerKm
		payload.minLat = payload.centerLat - dLat
		payload.maxLat = payload.centerLat + dLat
		payload.minLng = payload.centerLng - dLng
		payload.maxLng = payload.centerLng + dLng
	}
	
	// Get before state
	const ref = doc(db, 'miscellaneous', 'settings')
	const beforeSnap = await getDoc(ref)
	const before = beforeSnap.exists() ? beforeSnap.data() : null
	
	await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true })
	
	// Get after state
	const afterSnap = await getDoc(ref)
	const after = afterSnap.exists() ? afterSnap.data() : null
	
	// Log the settings change
	await logSettingsChange('update', 'settings', before, after, 'admin', {
		reason: 'App settings updated',
		fields: Object.keys(payload)
	}).catch(err => console.error('Failed to log settings update:', err))
	
	return true
}

// --- Business Profile (synced from Google Places) --- //
export async function fetchBusinessProfile() {
	try {
		const snap = await getDoc(doc(db, 'miscellaneous', 'businessProfile'))
		if (!snap.exists()) return null
		return snap.data()
	} catch {
		return null
	}
}

export async function syncBusinessProfile(placeId) {
	const url = import.meta.env.VITE_SYNC_BUSINESS_PROFILE_URL || '/api/sync-business-profile'
	let res
	try {
		res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ placeId })
		})
	} catch (e) {
		throw new Error(
			`Sync failed: cannot reach the sync API. ` +
			`In dev, Vite doesn't serve /api routes. Run \`vercel dev\` (default http://localhost:3000) ` +
			`or set VITE_SYNC_BUSINESS_PROFILE_URL to your deployed /api/sync-business-profile URL.`
		)
	}
	if (!res.ok) {
		const error = await res.json().catch(() => ({}))
		if (res.status === 404 && String(url || '').startsWith('/')) {
			throw new Error(
				`Sync failed: /api/sync-business-profile not found (404). ` +
				`In dev, start \`vercel dev\` so /api routes exist (and keep Vite running), ` +
				`or set VITE_SYNC_BUSINESS_PROFILE_URL to a deployed API URL.`
			)
		}
		throw new Error(error.error || `Sync failed: ${res.status}`)
	}
	return res.json()
}

export async function upsertMenuCategory(name) {
	const ref = doc(db, 'menu', name)
	await setDoc(ref, {}, { merge: true })
	return name
}

export async function appendMenuItems(categoryName, items) {
	const ref = doc(db, 'menu', categoryName)
	await setDoc(ref, {}, { merge: true })
	for (const it of items) {
		const rate = toMoney(it.rate ?? it.price)
		const price = rate !== null ? rate : (Number(it.price) || 0)
		const mrp = toMoney(it.mrp ?? it.MRP)
		const discountSource = it.discountPercent ?? it.discount
		const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
		const discount = toDiscount(discountSource ?? derivedDiscount)
		const item = { name: it.name, price, veg: it.veg === false ? false : true }
		if (rate !== null) item.rate = rate
		if (mrp !== null) item.mrp = mrp
		if (discount !== null) item.discountPercent = discount
		if (it.active === false) item.active = false
		if (it.imageId) item.imageId = it.imageId
		if (it.needsReview) item.needsReview = true
		await setDoc(ref, { items: arrayUnion(item) }, { merge: true })
	}
	return true
}

export async function addMenuItems(categoryName, rawItems) {
	if (!Array.isArray(rawItems) || rawItems.length === 0) return { added: 0, skipped: 0 }
	const ref = doc(db, 'menu', categoryName)
	const snap = await getDoc(ref)
	const existing = snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : []
	const existingNames = new Set(existing.map(i => (i.name || '').trim().toLowerCase()))
	const toAdd = []
	let skipped = 0
	for (const r of rawItems) {
		const name = (r.name || '').trim()
		if (!name) { skipped++; continue }
		const key = name.toLowerCase()
		if (existingNames.has(key)) { skipped++; continue }
		existingNames.add(key)
		const rate = toMoney(r.rate ?? r.price)
		const price = rate !== null ? rate : (Number(r.price) || 0)
		const mrp = toMoney(r.mrp ?? r.MRP)
		const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
		const discount = toDiscount(r.discountPercent ?? derivedDiscount)
		const item = { name, price, veg: r.veg === false ? false : true }
		if (rate !== null) item.rate = rate
		if (mrp !== null) item.mrp = mrp
		if (r.needsReview) item.needsReview = true
		if (discount !== null) item.discountPercent = discount
		toAdd.push(item)
	}
	if (toAdd.length) {
		await appendMenuItems(categoryName, toAdd)
	} else {
		if (!snap.exists()) await setDoc(ref, {}, { merge: true })
	}
	return { added: toAdd.length, skipped }
}

export async function setMenuItems(categoryName, items) {
	const ref = doc(db, 'menu', categoryName)
	await setDoc(
		ref,
		{
			items: items.map((it) => ({
				name: it.name,
				...(() => {
					const rate = toMoney(it.rate ?? it.price)
					const price = rate !== null ? rate : (Number(it.price) || 0)
					const mrp = toMoney(it.mrp ?? it.MRP)
					const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
					const discount = toDiscount(it.discountPercent ?? derivedDiscount)
					const base = { price }
					if (rate !== null) base.rate = rate
					if (mrp !== null) base.mrp = mrp
					if (discount !== null) base.discountPercent = discount
					return base
				})(),
				veg: it.veg === false ? false : true,
				...(it.active === false ? { active: false } : {}),
				...(it.imageId ? { imageId: it.imageId } : {}),
				...(it.needsReview ? { needsReview: true } : {}),
				...(Array.isArray(it.components) && it.components.length
					? {
							components: it.components
								.filter((r) => r && (String(r.text || '').trim() || String(r.qty || '').trim() || String(r.unit || '').trim()))
								.map((r) => ({ qty: String(r.qty || '').trim(), unit: String(r.unit || '').trim(), text: String(r.text || '').trim() })),
						}
					: {}),
				...(it.isCustom ? { isCustom: true } : {}),
				...(Array.isArray(it.variants) && it.variants.length
					? {
							variants: it.variants.map(v => ({
								name: String(v.name || '').trim(),
								price: Number(v.price) || Number(v.rate) || 0,
								rate: Number(v.rate) || Number(v.price) || 0,
								mrp: Number(v.mrp) || null,
								discountPercent: Number(v.discountPercent) || null
							}))
						}
					: {}),
			})),
		},
		{ merge: true },
	)
	return true
}

export async function removeMenuItem(categoryName, itemName) {
	if (!categoryName || !itemName) return false
	const ref = doc(db, 'menu', categoryName)
	const snap = await getDoc(ref)
	if (!snap.exists()) return false
	const data = snap.data()
	const items = Array.isArray(data.items) ? data.items : []
	const idx = items.findIndex(it => (it.name || '').trim().toLowerCase() === itemName.trim().toLowerCase())
	if (idx === -1) return false
	const next = items.filter((_, i) => i !== idx)
	await setDoc(ref, { items: next }, { merge: true })
	return true
}

export async function renameMenuCategory(oldName, newName) {
	const from = String(oldName || '').trim()
	const to = String(newName || '').trim()
	if (!from || !to || from === to) return from
	const oldRef = doc(db, 'menu', from)
	const oldSnap = await getDoc(oldRef)
	const data = oldSnap.exists() ? oldSnap.data() : { items: [] }
	const items = Array.isArray(data.items) ? data.items : []
	const newRef = doc(db, 'menu', to)
	await setDoc(newRef, { items }, { merge: true })
	await deleteDoc(oldRef)
	return to
}

export async function migrateRemoveCategoryNameFields() {
	try {
		const snap = await getDocs(collection(db, 'menu'))
		const batch = writeBatch(db)
		let count = 0
		snap.forEach(d => {
			const data = d.data()
			const needsStrip = Object.prototype.hasOwnProperty.call(data, 'name') || Object.prototype.hasOwnProperty.call(data, 'merge')
			if (needsStrip) {
				const items = Array.isArray(data.items) ? data.items : []
				batch.set(doc(db, 'menu', d.id), { items }, { merge: false })
				count++
			}
		})
		if (count > 0) await batch.commit()
		return count
	} catch (err) {
		console.error('[firestore] migrateRemoveCategoryNameFields failed', err)
		return 0
	}
}

export async function saveCart(uid, cartItems) {
	if (!uid) return
	try {
		const ref = doc(db, 'users', uid, 'meta', 'cart')
		await setDoc(ref, { items: cartItems, updatedAt: serverTimestamp() }, { merge: true })
	} catch (e) {
		console.warn('saveCart failed', e)
	}
}

export async function fetchUserProfile(uid) {
	if (!uid) return null
	try {
		const snap = await getDoc(doc(db, 'users', uid))
		if (!snap.exists()) return null
		return { id: snap.id, ...snap.data() }
	} catch (e) {
		console.warn('fetchUserProfile failed', e)
		return null
	}
}

export async function updateUserProfile(uid, data) {
	if (!uid) return
	const allowed = ['displayName', 'phone']
	const out = {}
	for (const k of allowed) {
		if (data[k] === undefined) continue
		let v = data[k]
		if (typeof v === 'string') v = v.trim()
		out[k] = v
	}
	await setDoc(doc(db, 'users', uid), { ...out, updatedAt: serverTimestamp() }, { merge: true })
}

export async function addAddress(uid, address) {
	if (!uid) return
	const ref = doc(db, 'users', uid, 'meta', 'addresses')
	const snap = await getDoc(ref)
	const list = snap.exists() && Array.isArray(snap.data().list) ? snap.data().list : []
	const id = address.id || safeRandomId('addr')
	const normalized = (() => {
		const nm = (v) => (typeof v === 'string' ? v.trim() : v)
		const obj = {
			id,
			name: nm(address.name) || nm(address.tag) || 'Address',
			tag: nm(address.tag) || 'Other',
			line1: nm(address.line1) || '',
			...(nm(address.line2) ? { line2: nm(address.line2) } : {}),
			city: nm(address.city) || '',
			zip: nm(address.zip) || '',
			...(nm(address.phone) ? { phone: nm(address.phone) } : {}),
			...(typeof address.lat === 'number' ? { lat: address.lat } : {}),
			...(typeof address.lng === 'number' ? { lng: address.lng } : {}),
			...(nm(address.placeId) ? { placeId: nm(address.placeId) } : {}),
			...(nm(address.mapUrl) ? { mapUrl: nm(address.mapUrl) } : {}),
		}
		return obj
	})()
	const next = [...list, normalized]
	const payload = { list: next, updatedAt: serverTimestamp() }
	if (list.length === 0) payload.defaultId = id
	await setDoc(ref, payload, { merge: true })
	return id
}

export async function updateAddress(uid, id, patch) {
	if (!uid) return
	const ref = doc(db, 'users', uid, 'meta', 'addresses')
	const snap = await getDoc(ref)
	if (!snap.exists()) return
	const data = snap.data()
	const list = Array.isArray(data.list) ? data.list : []
	const nm = (v) => (typeof v === 'string' ? v.trim() : v)
	const allowedKeys = new Set(['name','tag','line1','line2','city','zip','phone','lat','lng','placeId','mapUrl'])
	const cleaned = {}
	Object.entries(patch || {}).forEach(([k,v]) => {
		if (!allowedKeys.has(k)) return
		const val = nm(v)
		if (val === '' || val === undefined) {
			cleaned[k] = ''
		} else {
			cleaned[k] = val
		}
	})
	const next = list.map(a => {
		if (a.id !== id) return a
		const base = {
			id: a.id,
			name: nm(cleaned.name ?? a.name) || nm(cleaned.tag ?? a.tag) || 'Address',
			tag: nm(cleaned.tag ?? a.tag) || 'Other',
			line1: nm(cleaned.line1 ?? a.line1) || '',
			...(nm(cleaned.line2 ?? a.line2) ? { line2: nm(cleaned.line2 ?? a.line2) } : {}),
			city: nm(cleaned.city ?? a.city) || '',
			zip: nm(cleaned.zip ?? a.zip) || '',
			...(nm(cleaned.phone ?? a.phone) ? { phone: nm(cleaned.phone ?? a.phone) } : {}),
			...(typeof (cleaned.lat ?? a.lat) === 'number' ? { lat: Number(cleaned.lat ?? a.lat) } : {}),
			...(typeof (cleaned.lng ?? a.lng) === 'number' ? { lng: Number(cleaned.lng ?? a.lng) } : {}),
			...(nm(cleaned.placeId ?? a.placeId) ? { placeId: nm(cleaned.placeId ?? a.placeId) } : {}),
			...(nm(cleaned.mapUrl ?? a.mapUrl) ? { mapUrl: nm(cleaned.mapUrl ?? a.mapUrl) } : {}),
		}
		return base
	})
	await setDoc(ref, { list: next, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteAddress(uid, id) {
	if (!uid) return
	const ref = doc(db, 'users', uid, 'meta', 'addresses')
	const snap = await getDoc(ref)
	if (!snap.exists()) return
	const data = snap.data()
	const list = Array.isArray(data.list) ? data.list : []
	const next = list.filter(a => a.id !== id)
	const payload = { list: next, updatedAt: serverTimestamp() }
	if (data.defaultId === id) {
		payload.defaultId = next.length ? next[0].id : null
	}
	await setDoc(ref, payload, { merge: true })
}

export async function fetchAddresses(uid) {
	if (!uid) return []
	const ref = doc(db, 'users', uid, 'meta', 'addresses')
	const snap = await getDoc(ref)
	if (!snap.exists()) return { list: [], defaultId: null }
	const data = snap.data()
	return { list: Array.isArray(data.list) ? data.list : [], defaultId: data.defaultId || null }
}

export async function setDefaultAddress(uid, id) {
	if (!uid || !id) return
	const ref = doc(db, 'users', uid, 'meta', 'addresses')
	await setDoc(ref, { defaultId: id, updatedAt: serverTimestamp() }, { merge: true })
}

export async function saveBase64Image(base64, mime, meta = {}) {
	if (!base64) throw new Error('No image data')
	const imagesCol = collection(db, 'images')
	const ref = doc(imagesCol)
	const payload = { data: base64, mime: mime || null, createdAt: serverTimestamp() }
	if (meta && typeof meta === 'object') {
		const { ownerType, categoryId, itemName } = meta
		if (ownerType) payload.ownerType = ownerType
		if (categoryId) payload.categoryId = categoryId
		if (itemName) payload.itemName = itemName
	}
	await setDoc(ref, payload)
	return ref.id
}

export async function fetchImagesByIds(ids) {
	if (!Array.isArray(ids) || ids.length === 0) return {}
	const unique = Array.from(new Set(ids.filter(Boolean)))
	const out = {}
	await Promise.all(unique.map(async (id) => {
		try {
			const snap = await getDoc(doc(db, 'images', id))
			if (snap.exists()) {
				const d = snap.data()
				out[id] = d
			}
		} catch (e) {
			console.warn('fetchImagesByIds failed for', id, e)
		}
	}))
	return out
}

// --- Image caching ---
// IMPORTANT: Do not persist large base64 blobs into localStorage/sessionStorage.
// It easily exceeds browser quotas (QuotaExceededError) and can break the biller UI.
// We keep a small in-memory cache only.

function purgeLegacyStorageImageCache() {
	try {
		if (typeof window === 'undefined') return
		const stores = [window.localStorage, window.sessionStorage].filter(Boolean)
		stores.forEach((store) => {
			try {
				const toRemove = []
				for (let i = 0; i < store.length; i++) {
					const k = store.key(i)
					if (k && k.startsWith('img:')) toRemove.push(k)
				}
				toRemove.forEach((k) => {
					try { store.removeItem(k) } catch { /* ignore */ }
				})
			} catch { /* ignore */ }
		})
	} catch { /* ignore */ }
}

// Run once on module load in the browser
purgeLegacyStorageImageCache()

const __imageObjectCache = new Map() // id -> { data, mime } or { url }
const __imageObjectCacheOrder = []
const __MAX_IMAGE_OBJECT_CACHE = 250

function getCachedImageObject(id) {
	return __imageObjectCache.get(id) || null
}

function setCachedImageObject(id, obj) {
	if (!id || !obj) return
	__imageObjectCache.set(id, obj)
	__imageObjectCacheOrder.push(id)
	while (__imageObjectCacheOrder.length > __MAX_IMAGE_OBJECT_CACHE) {
		const oldest = __imageObjectCacheOrder.shift()
		if (oldest) __imageObjectCache.delete(oldest)
	}
}

export async function fetchImagesByIdsCached(ids) {
	if (!Array.isArray(ids) || ids.length === 0) return {}
	const unique = Array.from(new Set(ids.filter(Boolean)))
	const cachedOut = {}
	const toFetch = []
	for (const id of unique) {
		const hit = getCachedImageObject(id)
		if (hit) cachedOut[id] = hit
		else toFetch.push(id)
	}
	if (!toFetch.length) return cachedOut
	const fetched = await fetchImagesByIds(toFetch)
	Object.entries(fetched).forEach(([id, obj]) => {
		setCachedImageObject(id, obj)
	})
	return { ...fetched, ...cachedOut }
}

const memoryImageCache = new Map()
export function getImageDataUrl(obj) {
	if (!obj) return ''
	if (typeof obj === 'string') return obj
	if (typeof obj === 'object' && typeof obj.url === 'string' && obj.url.trim()) {
		return obj.url.trim()
	}
	const data = (typeof obj === 'object' && typeof obj.data === 'string') ? obj.data.trim() : ''
	if (!data) return ''
	const mime = (typeof obj === 'object' && typeof obj.mime === 'string' && obj.mime.trim()) ? obj.mime.trim() : 'image/*'
	const key = `${mime}:${data.slice(0, 24)}:${data.length}`
	if (memoryImageCache.has(key)) return memoryImageCache.get(key)
	const url = `data:${mime};base64,${data}`
	memoryImageCache.set(key, url)
	return url
}

// Permanently delete an image document by id from Firestore 'images' collection
export async function deleteImageById(imageId) {
	if (!imageId) return false
	try {
		await deleteDoc(doc(db, 'images', imageId))
		return true
	} catch (e) {
		console.warn('deleteImageById failed', imageId, e)
		return false
	}
}

// Remove a category's image by deleting the imageId field and optionally deleting the image doc
export async function removeCategoryImage(categoryId) {
	if (!categoryId) return { ok: false }
	try {
		const ref = doc(db, 'menu', categoryId)
		const snap = await getDoc(ref)
		const existing = snap.exists() ? snap.data() : {}
		const imageId = existing.imageId || null
		// Delete the field from the document
		await setDoc(ref, { imageId: deleteField(), updatedAt: serverTimestamp() }, { merge: true })
		// Delete the backing image document if present
		if (imageId) {
			await deleteImageById(imageId)
		}
		return { ok: true, deletedImageId: imageId }
	} catch (e) {
		console.error('removeCategoryImage failed', e)
		return { ok: false, error: String(e?.message || e) }
	}
}

// ===== Staff Management =====
// Role documents are stored in /roles/{email} with fields:
// - role: 'admin' | 'staff' | 'delivery'
// - name: string
// - pages: { [pageKey]: boolean } (optional for fine-grained access)
// - addedAt/addedBy/updatedAt/updatedBy

function normalizeRolePages(pages) {
	if (!pages || typeof pages !== 'object') return null
	const out = {}
	for (const [k, v] of Object.entries(pages)) {
		out[k] = !!v
	}
	return out
}

function assertValidStaffRole(role) {
	if (!['admin', 'staff', 'delivery'].includes(role)) throw new Error('Invalid role - must be admin, staff, or delivery')
}

export async function fetchStaff() {
	try {
		const snap = await getDocs(collection(db, 'roles'))
		return snap.docs.map(d => ({ email: d.id, ...d.data() }))
	} catch (err) {
		console.error('[firestore] fetchStaff failed', err)
		return []
	}
}

export async function getStaffMember(email) {
	if (!email) return null
	try {
		const ref = doc(db, 'roles', email.toLowerCase().trim())
		const snap = await getDoc(ref)
		return snap.exists() ? { email: snap.id, ...snap.data() } : null
	} catch (err) {
		console.error('[firestore] getStaffMember failed', err)
		return null
	}
}

export async function addStaffMember(email, role, name, addedByEmail, pages = null, defaultPage = null) {
	if (!email || !role) throw new Error('Email and role are required')
	const normalizedEmail = email.toLowerCase().trim()
	assertValidStaffRole(role)
	
	const newData = {
		role,
		name: name || '',
		addedAt: serverTimestamp(),
		addedBy: addedByEmail || null
	}

	// pages can be passed as 5th argument
	const normalizedPages = normalizeRolePages(pages)
	if (normalizedPages) newData.pages = normalizedPages
	
	// defaultPage can be passed as 6th argument
	if (defaultPage && typeof defaultPage === 'string') {
		newData.defaultPage = defaultPage
	}
	
	const ref = doc(db, 'roles', normalizedEmail)
	await setDoc(ref, newData)
	
	// Log the creation
	await logStaffChange('create', normalizedEmail, null, { ...newData, email: normalizedEmail }, addedByEmail, {
		reason: 'Staff member added'
	})
	
	return { email: normalizedEmail, role, name, defaultPage: defaultPage || null }
}

export async function updateStaffMember(email, updates, updatedByEmail) {
	if (!email) throw new Error('Email is required')
	const normalizedEmail = email.toLowerCase().trim()
	const ref = doc(db, 'roles', normalizedEmail)
	if (updates?.role) assertValidStaffRole(updates.role)
	
	// If promoting to admin, clear any stale per-page permissions/default landing.
	if (updates?.role === 'admin') {
		updates = { ...updates, pages: deleteField(), defaultPage: deleteField() }
	}
	if (Object.prototype.hasOwnProperty.call(updates || {}, 'pages')) {
		updates = { ...updates, pages: normalizeRolePages(updates.pages) }
	}
	
	// Get current state before update
	const beforeSnap = await getDoc(ref)
	const before = beforeSnap.exists() ? { email: normalizedEmail, ...beforeSnap.data() } : null
	
	const updateData = { ...updates, updatedAt: serverTimestamp(), updatedBy: updatedByEmail || null }
	await setDoc(ref, updateData, { merge: true })
	
	// Get new state after update
	const afterSnap = await getDoc(ref)
	const after = afterSnap.exists() ? { email: normalizedEmail, ...afterSnap.data() } : null
	
	// Log the update
	await logStaffChange('update', normalizedEmail, before, after, updatedByEmail, {
		reason: 'Staff member updated'
	})
}

export async function removeStaffMember(email, removedByEmail) {
	if (!email) throw new Error('Email is required')
	const normalizedEmail = email.toLowerCase().trim()
	const ref = doc(db, 'roles', normalizedEmail)
	
	// Get current state before deletion
	const beforeSnap = await getDoc(ref)
	const before = beforeSnap.exists() ? { email: normalizedEmail, ...beforeSnap.data() } : null
	
	await deleteDoc(ref)
	
	// Log the deletion
	await logStaffChange('delete', normalizedEmail, before, null, removedByEmail, {
		reason: 'Staff member removed'
	})
}

export function getAvatarUrl(userOrProfile) {
  if (userOrProfile?.photoURL) return userOrProfile.photoURL
  const seed = userOrProfile?.displayName || userOrProfile?.name || userOrProfile?.email || 'User'
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
  if (userOrProfile?.gender) {
    const g = userOrProfile.gender.toLowerCase()
    if (g === 'male') {
      url += `&top[]=shortHair&top[]=shortHairDreads&top[]=shortHairFrizzle&top[]=shortHairShaggy&top[]=shortHairSides&top[]=shortHairTheCaesar&facialHairProbability=50`
    } else if (g === 'female') {
      url += `&top[]=longHair&top[]=longHairBob&top[]=longHairBun&top[]=longHairCurly&top[]=longHairCurvy&top[]=longHairDreads&top[]=longHairFrida&top[]=longHairFro&top[]=longHairMiaWallace&top[]=longHairNotTooLong&top[]=longHairShavedSides&top[]=longHairStraight&top[]=longHairStraight2&top[]=longHairStraightStrand&facialHairProbability=0`
    }
  }
  return url
}

export async function getRandomOtp() {
  const snap = await getDocs(collection(db, 'otps'))
  if (snap.empty) return null
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const random = list[Math.floor(Math.random() * list.length)]
  return random
}

// ---- Razorpay helpers (Admin POS) ---- //
export async function createRazorpayOrder(amount) {
	const value = Number(amount)
	if (!value || value <= 0) {
		throw new Error('Invalid amount for Razorpay order')
	}
	// Use apiUrl() to get the correct URL (production in dev, relative in prod)
	const res = await fetch(apiUrl('/api/create-order'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ amount: value })
	})
	let body = null
	try { body = await res.json() } catch { /* ignore */ }
	if (!res.ok) {
		const message = body?.error || `Failed to create Razorpay order (${res.status})`
		throw new Error(message)
	}
	return body
}

export async function verifyRazorpayPayment(payload) {
	// Use apiUrl() to get the correct URL (production in dev, relative in prod)
	const res = await fetch(apiUrl('/api/verify-payment'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	})
	let body = null
	try { body = await res.json() } catch { /* ignore */ }
	if (!res.ok) {
		const message = body?.error || `Payment verification failed (${res.status})`
		throw new Error(message)
	}
	return body
}
