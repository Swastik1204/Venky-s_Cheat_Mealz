/* eslint-env node */
// Serverless function to fetch Google Business Profile data via Places API
// and cache it in Firestore. Can be called manually or scheduled.
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'

const rateLimiter = createRateLimiter({ routeName: 'sync-business-profile' })

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  if (serviceAccount.project_id) {
    initializeApp({ credential: cert(serviceAccount) })
  } else {
    initializeApp()
  }
}

const db = getFirestore()

// Google Places API (New) endpoint
const PLACES_API_URL = 'https://places.googleapis.com/v1/places'

// Fields we want to fetch from Google
const PLACE_FIELDS = [
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'regularOpeningHours',
  'currentOpeningHours',
  'websiteUri',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'priceLevel',
  'businessStatus'
].join(',')

async function fetchPlaceDetails(placeId, apiKey) {
  const url = `${PLACES_API_URL}/${placeId}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACE_FIELDS
    }
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Places API error: ${response.status} - ${error.error?.message || 'Unknown error'}`)
  }
  
  return response.json()
}

function transformPlaceData(data) {
  // Transform Google's format to our app's format
  const hours = data.regularOpeningHours?.weekdayDescriptions || []
  const currentHours = data.currentOpeningHours?.weekdayDescriptions || hours
  
  // Parse opening hours into structured format
  const businessHours = {}
  const dayMap = {
    'Monday': 'mon', 'Tuesday': 'tue', 'Wednesday': 'wed',
    'Thursday': 'thu', 'Friday': 'fri', 'Saturday': 'sat', 'Sunday': 'sun'
  }
  
  hours.forEach(h => {
    const match = h.match(/^(\w+):\s*(.+)$/)
    if (match) {
      const day = dayMap[match[1]] || match[1].toLowerCase().slice(0, 3)
      businessHours[day] = match[2].trim()
    }
  })
  
  return {
    name: data.displayName?.text || '',
    address: data.formattedAddress || '',
    phone: data.nationalPhoneNumber || '',
    phoneInternational: data.internationalPhoneNumber || '',
    website: data.websiteUri || '',
    mapsUrl: data.googleMapsUri || '',
    rating: data.rating || null,
    reviewCount: data.userRatingCount || 0,
    priceLevel: data.priceLevel || null,
    businessStatus: data.businessStatus || 'OPERATIONAL',
    businessHours,
    hoursRaw: hours,
    currentHoursRaw: currentHours,
    isOpen: data.currentOpeningHours?.openNow ?? null,
    lastSynced: new Date().toISOString(),
    source: 'google_places_api'
  }
}

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded

  // CORS - restrict to configured origins
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    allowOrigin = list.includes(origin) ? origin : list[0] || '*'
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Support both GET (scheduled/cron) and POST (admin trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  // Verify cron requests come from Vercel (for scheduled jobs)
  const isCron = req.headers['x-vercel-cron'] === '1'

  // POST requests require Firebase Auth (admin-triggered sync)
  if (req.method === 'POST') {
    const auth = await verifyAuth(req)
    if (auth.error) return res.status(auth.status).json({ error: auth.error })
  }
  
  try {
    // Get API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not configured' })
    }
    
    // Get Place ID from request or Firestore settings
    let placeId = req.body?.placeId || req.query?.placeId
    
    if (!placeId) {
      // Try to get from app settings (miscellaneous/settings collection)
      const settingsDoc = await db.collection('miscellaneous').doc('settings').get()
      placeId = settingsDoc.data()?.googlePlaceId
    }
    
    if (!placeId) {
      return res.status(400).json({ 
        error: 'No Google Place ID configured',
        hint: 'Set googlePlaceId in admin settings or pass ?placeId=xxx'
      })
    }
    
    // Fetch from Google Places API
    const placeData = await fetchPlaceDetails(placeId, apiKey)
    const transformed = transformPlaceData(placeData)
    
    // Save to Firestore cache (miscellaneous/businessProfile)
    await db.collection('miscellaneous').doc('businessProfile').set({
      ...transformed,
      placeId,
      updatedAt: new Date(),
      syncSource: isCron ? 'vercel_cron' : 'manual'
    }, { merge: true })
    
    return res.status(200).json({
      success: true,
      message: 'Business profile synced successfully',
      data: transformed
    })
    
  } catch (error) {
    console.error('Sync business profile error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to sync business profile'
    })
  }
}
