/* eslint-env node */
// Health check endpoint
// GET /api/health
// Returns: { status: 'ok', timestamp, env: 'production/development' }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const checks = {
    wa_configured: !!(process.env.WA_TOKEN && process.env.WA_PHONE_NUMBER_ID),
    razorpay_configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    vite_razorpay_key: !!process.env.VITE_RAZORPAY_KEY_ID
  }

  return res.status(200).json({
    status: 'ok',
    app: 'venkys-admin',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    checks
  })
}
