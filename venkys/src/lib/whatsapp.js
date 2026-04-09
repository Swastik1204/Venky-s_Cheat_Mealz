// whatsapp — WhatsApp message formatting and delivery
import { sendWhatsAppInvoice } from './data'
import { apiUrl, getAuthHeaders } from './data-common'
import { fetchAppSettings } from './data-settings'

function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return 'unknown'
  if (digits.length <= 4) return digits
  return `***${digits.slice(-4)}`
}

// Internal helper for formatting bill messages
function formatBillMessage(order) {
  if (!order) return ''

  const { orderNo, customer, items, subtotal, taxAmount, totalAmount, orderType } = order
  const name = customer?.name || 'Customer'
  
  let message = `🧾 *Order Confirmation*\n`
  message += `Order #${orderNo}\n\n`
  message += `Hi ${name},\n`
  message += `Thanks for ordering from Venky's Chicken Xperience! 🍗\n\n`

  message += `*Order Details:*\n`
  if (Array.isArray(items)) {
    items.forEach(item => {
      const qty = item.qty || 0
      const rate = Number(item?.rate ?? item?.price ?? 0)
      const total = item.total || (qty * rate)
      message += `${qty} x ${item.name} (₹${total})\n`
      if (item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0) {
         message += `   _(${item.modifiers.map(m => m.name).join(', ')})_\n`
      }
    })
  }
  
  message += `\n`
  message += `*Subtotal:* ₹${subtotal}\n`
  if (taxAmount > 0) {
    message += `*Tax:* ₹${taxAmount}\n`
  }
  message += `*Total:* ₹${totalAmount}\n\n`
  
  if (orderType === 'delivery') {
    message += `Your order will be delivered to:\n${customer?.address || 'Address provided'}\n\n`
  } else if (orderType === 'takeaway') {
    message += `Your order will be ready for pickup shortly.\n\n`
  } else {
    message += `Your order is being prepared.\n\n`
  }

  message += `Thank you for choosing us! 🙏`
  
  return message
}

export async function sendBillToCustomer(order) {
  if (!order || !order.customer || !order.customer.phone) {
    console.warn('Cannot send WhatsApp bill: Missing order or customer phone')
    return { ok: false, error: 'missing_phone' }
  }

  const phone = order.customer.phone
  const orderRef = String(order.orderNo || order.id || 'unknown')
  console.info('[WA_TRIGGER_A_CHECKOUT_BILL] start', { orderRef, phone: maskPhone(phone) })

  // Use Template Message (Recommended for 24h window compliance)
  // Template Name: venkys_bill with 4 parameters
  // {{1}}=Name, {{2}}=OrderNo, {{3}}=Amount, {{4}}=PaymentMethod

  const customerName = order.customer.name || 'Customer'
  
  // Format {{3}}: Total amount
  const totalAmount = Number(order.totalAmount || order.subtotal || 0)
  let formattedTotal = `₹${totalAmount.toFixed(0)}`
  if (!Number.isFinite(totalAmount)) {
    formattedTotal = `₹${String(order.totalAmount || order.subtotal || '0').trim() || '0'}`
  }
  
  // Format {{4}}: Payment method
  let paymentMethodText = 'Bank Transfer'
  const paymentMethod = order.paymentMethod || order.payment?.method
  if (paymentMethod === 'cod') {
    paymentMethodText = 'Cash on Delivery'
  } else if (paymentMethod === 'online' || paymentMethod === 'razorpay') {
    paymentMethodText = 'Paid Online'
  } else if (paymentMethod) {
    paymentMethodText = String(paymentMethod).toUpperCase()
  }

  console.log('[WA_TRIGGER_A_CHECKOUT_BILL] bill_params', { 
    p1: customerName, 
    p2: orderRef, 
    p3: formattedTotal, 
    p4: paymentMethodText 
  })
  
  const payload = {
    templateName: 'venkys_bill',
    templateLanguage: 'en', 
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: orderRef },
          { type: 'text', text: formattedTotal },
          { type: 'text', text: paymentMethodText },
        ]
      }
    ]
  }

  // Use the existing data layer function which calls the API
  const templateRes = await sendWhatsAppInvoice(phone, payload)
  if (!templateRes?.__error && !templateRes?.__skipped) {
    console.info('[WA_TRIGGER_A_CHECKOUT_BILL] template_success', { orderRef, phone: maskPhone(phone) })
    return templateRes
  }

  console.warn('[WA_TRIGGER_A_CHECKOUT_BILL] template_failed_fallback_text', {
    orderRef,
    phone: maskPhone(phone),
    reason: templateRes?.message || templateRes?.__error || templateRes?.__skipped || 'unknown',
  })

  // Fallback to plain text (may work inside the 24h window; serverless also tries to open a session template when needed)
  const text = formatBillMessage(order)
  const textRes = await sendWhatsAppInvoice(phone, { text })
  if (!textRes?.__error && !textRes?.__skipped) {
    console.info('[WA_TRIGGER_A_CHECKOUT_BILL] text_fallback_success', { orderRef, phone: maskPhone(phone) })
    return { ...textRes, __fallback: 'text' }
  }

  // Surface details so callers' .catch() logs the real reason
  const details =
    templateRes?.data?.error?.message ||
    textRes?.data?.error?.message ||
    templateRes?.error ||
    textRes?.error ||
    templateRes?.message ||
    textRes?.message ||
    templateRes?.__skipped ||
    textRes?.__skipped ||
    templateRes?.__error ||
    textRes?.__error ||
    'unknown'
  const finalError = `WhatsApp failed: ${details}`
  console.error('[WA_TRIGGER_A_CHECKOUT_BILL] failed', { orderRef, phone: maskPhone(phone), error: finalError })
  return { ok: false, __error: 'wa_send_failed', message: finalError }
}

export async function sendOrderMessengerForOnlineOrder({ orderRef, customerName, totalAmount, address } = {}) {
  try {
    const settings = await fetchAppSettings()
    const phones = Array.isArray(settings?.orderMessengerPhones) ? settings.orderMessengerPhones : []
    const normalizedPhones = Array.from(new Set(
      phones
        .map((p) => {
          let digits = String(p || '').replace(/\D/g, '')
          if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
          return digits.length === 10 ? digits : ''
        })
        .filter(Boolean)
    ))

    if (!normalizedPhones.length) {
      return { __skipped: 'no_order_messenger_phones' }
    }

    console.log('[WA_TRIGGER_B_ORDER_MESSENGER] sending_to', normalizedPhones)

    const url = apiUrl('/api/send-order-messenger')
    const authHeaders = await getAuthHeaders()
    
    // venkys_order_messenger requires 3 body parameters:
    // {{1}} = customer name
    // {{2}} = total amount formatted as "₹126"
    // {{3}} = delivery address as a single string
    
    const customer = String(customerName || 'Customer').trim() || 'Customer'
    const total = Number(totalAmount || 0)
    const totalText = Number.isFinite(total)
      ? `₹${total.toFixed(0)}`
      : `₹${String(totalAmount || '').trim() || '0'}`
    const addr = String(address || '-').trim() || '-'
    
    console.log('[send-order-messenger] params', { customer, total: totalText, address: addr })
    
    const jobs = normalizedPhones.map(async (phone) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          phone,
          customerName: customer,
          totalAmount: totalText,
          address: addr,
          orderId: String(orderRef || '').trim() || undefined,
        }),
      })
      let body = null
      try { body = await res.json() } catch { /* ignore */ }
      if (!res.ok) {
        return { phone, ok: false, error: body || { status: res.status } }
      }
      return { phone, ok: true, data: body || {} }
    })

    const settled = await Promise.allSettled(jobs)
    const results = settled.map((r) => (r.status === 'fulfilled' ? r.value : { ok: false, error: String(r.reason || 'unknown') }))
    const success = results.filter((r) => r.ok).length
    const failed = results.length - success
    return { ok: failed === 0, success, failed, results }
  } catch (e) {
    return { __error: 'order_messenger_failed', message: String(e) }
  }
}
