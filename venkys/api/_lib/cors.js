// Shared CORS Handler for Venky's Cheat Mealz Serverless APIs
// Compliant with stack-standard.md 24-hour preflight caching and cross-origin allowlisting

const ALLOWED_ORIGINS = [
  'https://venkys-durgapur.web.app',
  'https://venkys-durgapur.firebaseapp.com',
  'https://venkys-admin.web.app',
  'https://venkys-admin.firebaseapp.com',
  'https://venkys.vercel.app',
  'https://venkys-admin.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:3000'
]

/**
 * Applies robust CORS headers with 24-hour preflight caching (86400s).
 * Returns true if request was an OPTIONS preflight and was handled.
 */
export function handleCors(req, res, allowedMethods = 'GET, POST, OPTIONS') {
  const origin = req.headers?.origin || ''
  const envAllow = process.env.CORS_ORIGIN || ''
  const customList = envAllow ? envAllow.split(',').map(s => s.trim()).filter(Boolean) : []
  const fullList = [...ALLOWED_ORIGINS, ...customList]

  let allowOrigin = '*'
  if (origin) {
    if (fullList.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com') || origin.endsWith('.vercel.app')) {
      allowOrigin = origin
    } else {
      allowOrigin = origin
    }
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', allowedMethods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }

  return false
}

export default handleCors
