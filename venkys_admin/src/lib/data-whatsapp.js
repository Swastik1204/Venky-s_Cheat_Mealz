// WhatsApp messaging functions (admin)
import { normalizeWhatsappPhone, apiUrl, getAuthHeaders } from './data-common'

export async function sendWhatsAppInvoice(phone, payload) {
	try {
		const normalizedPhone = normalizeWhatsappPhone(phone)
		if (!normalizedPhone) {
			return { __skipped: 'missing_phone' }
		}
		const url = apiUrl('/api/send-whatsapp')
		const authHeaders = await getAuthHeaders()
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...authHeaders },
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

// Template-based order notification via /api/send-order-messenger
export async function sendOrderMessengerViaWhatsApp(phone, { customerName, totalAmount, address } = {}) {
	try {
		const normalizedPhone = String(phone || '').replace(/\D/g, '')
		if (!normalizedPhone || normalizedPhone.length < 10) return { __skipped: 'missing_phone' }
		const url = apiUrl('/api/send-order-messenger')
		const authHeaders = await getAuthHeaders()
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...authHeaders },
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

// Send OTP via WhatsApp using template with plain-text fallback
export async function sendOtpViaWhatsApp(phone, otp, orderRef = '') {
	if (!phone) {
		return { __error: 'missing_phone' }
	}
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
	if (!res?.__error) {
		return res
	}
	const textMessage = orderRef
		? `🔐 Dine-in COD OTP\nOrder: ${orderRef}\nOTP: ${otp}`
		: `🔐 Your OTP: ${otp}`
	return await sendWhatsAppInvoice(phone, { text: textMessage })
}
