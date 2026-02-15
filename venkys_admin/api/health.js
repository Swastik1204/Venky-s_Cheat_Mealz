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

  return res.status(200).json({
    status: 'ok',
    app: 'venkys-admin',
    timestamp: new Date().toISOString()
  })
}
