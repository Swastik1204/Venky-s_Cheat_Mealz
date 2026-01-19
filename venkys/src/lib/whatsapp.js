import { sendWhatsAppInvoice } from './data'

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
      const price = item.price || 0
      const total = item.total || (qty * price)
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

function formatItemsList(items) {
  if (!Array.isArray(items)) return 'No items'
  // WhatsApp templates don't allow newlines in parameters, use comma separation
  const lines = items.map(item => {
    const qty = item.qty || 0
    const total = item.total || (qty * (item.price || 0))
    let line = `${qty} x ${item.name} (₹${total})`
    if (item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0) {
       line += ` + ${item.modifiers.map(m => m.name).join(', ')}`
    }
    return line
  })
  
  const joined = lines.join(', ')
  if (joined.length > 1000) {
    return joined.slice(0, 997) + '...'
  }
  return joined
}

export async function sendBillToCustomer(order) {
  if (!order || !order.customer || !order.customer.phone) {
    console.warn('Cannot send WhatsApp bill: Missing order or customer phone')
    return { ok: false, error: 'missing_phone' }
  }

  const phone = order.customer.phone

  // Use Template Message (Recommended for 24h window compliance)
  // Template Name: venkys_bill
  // Variables: {{1}}=Name, {{2}}=OrderNo, {{3}}=Total, {{4}}=Items

  const itemsList = formatItemsList(order.items)
  
  const payload = {
    templateName: 'venkys_bill',
    templateLanguage: 'en', 
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: order.customer.name || 'Customer' },
          { type: 'text', text: String(order.orderNo) },
          { type: 'text', text: String(order.totalAmount) },
          { type: 'text', text: itemsList },
        ]
      }
    ]
  }

  // Use the existing data layer function which calls the API
  const templateRes = await sendWhatsAppInvoice(phone, payload)
  if (!templateRes?.__error && !templateRes?.__skipped) {
    return templateRes
  }

  // Fallback to plain text (may work inside the 24h window; serverless also tries to open a session template when needed)
  const text = formatBillMessage(order)
  const textRes = await sendWhatsAppInvoice(phone, { text })
  if (!textRes?.__error && !textRes?.__skipped) {
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
  throw new Error(`WhatsApp failed: ${details}`)
}
