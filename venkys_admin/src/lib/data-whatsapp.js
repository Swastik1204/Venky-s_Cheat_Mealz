// WhatsApp messaging functions (admin)
import { normalizeWhatsappPhone, apiUrl, getAuthHeaders } from './data-common'

export async function sendWhatsAppInvoice(phone, payload) {
  try {
    const normalizedPhone = normalizeWhatsappPhone(phone)
    if (!normalizedPhone) {
      return { __skipped: 'missing_phone' }
    }
    console.log('[WA_TRIGGER_C_BILLER_OTP] sending_to', normalizedPhone)
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
      const out = body || {}
      console.log('[WA_TRIGGER_C_BILLER_OTP] send_result', out)
      return out
    }
    const errObj = { __error: 'http_error', status: res.status, ...(body || {}) }
    console.log('[WA_TRIGGER_C_BILLER_OTP] send_result', errObj)
    try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
    return errObj
  } catch (e) {
    const errObj = { __error: 'network', message: String(e) }
    console.log('[WA_TRIGGER_C_BILLER_OTP] send_result', errObj)
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

// Send OTP via WhatsApp using only the OTP template.
export async function sendOtpViaWhatsApp(phone, otp, orderRef = '') {
  const normalizedPhone = normalizeWhatsappPhone(phone)
  if (!normalizedPhone) return { __error: 'missing_phone' }

  const otpCode = String(otp || '').trim()
  if (!otpCode) return { __error: 'missing_otp' }

  // venkys_otp is an Authentication template with Copy Code delivery.
  // Meta requires TWO components: body with OTP and button with copy_code sub_type carrying the same OTP.
  const otpPayload = {
    templateName: 'venkys_otp',
    templateLanguage: 'en',
    otp: otpCode,
    components: [
      {
        type: 'body',
        parameters: [{ type: 'text', text: otpCode }],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: otpCode }],
      },
    ],
  }

  const result = await sendWhatsAppInvoice(normalizedPhone, otpPayload)
  if (result?.__error) {
    console.warn('[WA_TRIGGER_C_BILLER_OTP] send_failed', {
      orderRef: String(orderRef || '').trim() || 'unknown_order',
      reason: result?.message || result?.error || result?.__error || 'unknown',
    })
  }
  return result
}
