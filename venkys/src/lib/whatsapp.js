// RE-ENABLE WHEN META DISPLAY NAME APPROVED
/*
export async function sendBillToCustomer(orderData) {
  try {
    const payload = {
      templateName: 'venkys_bill',
      templateLanguage: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: orderData.customer?.name || 'Customer' },
            { type: 'text', text: String(orderData.orderNo) },
            { type: 'text', text: String(orderData.totalAmount) },
            { type: 'text', text: orderData.items?.map(it => `${it.qty}x ${it.name}`).join(', ') || '-' },
          ]
        }
      ]
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const r = await fetch(`${baseUrl}/api/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: orderData.customer?.phone,
        payload
      })
    })
    return await r.json()
  } catch (err) {
    console.error('Failed to send WA bill:', err)
    return { __error: err.message }
  }
}
*/
