/* eslint-env node */
// Health check endpoint
// GET /api/health
// Returns: { status: 'ok', timestamp, env: 'production/development' }

import { handleCors } from './lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res, 'GET, OPTIONS')) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    status: 'ok',
    app: 'venkys-admin',
    timestamp: new Date().toISOString()
  })
}
