/* eslint-env node */
// Serverless function to fetch Google Business Profile data via Places API
// and cache it in Firestore.
//
//   GET  — scheduled sync. Requires `Authorization: Bearer <CRON_SECRET>`
//          (Vercel Cron sends it automatically; an external scheduler such as
//          cron-job.org must be configured with it). A missing or wrong header
//          is a 401, NOT a 200: this used to fall through to a public cached
//          read, which made a mis-configured scheduler look like a successful
//          job while nothing synced.
//   POST — manual sync, signed-in staff only.
//
// The cached profile is not served from here. Both apps read
// miscellaneous/businessProfile straight from Firestore (public-read rule),
// and nothing called the old public GET.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { isValidCronAuth } from './_lib/cronAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, isStaffEmail, FieldValue } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'sync-business-profile' })

const PLACES_API_URL = 'https://places.googleapis.com/v1/places'

const PLACE_FIELDS = [
  'displayName',
  'formattedAddress',
  'location',
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

function toGeo(location) {
  const lat = Number(location?.latitude)
  const lng = Number(location?.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

function transformPlaceData(data) {
  const hours = data.regularOpeningHours?.weekdayDescriptions || []
  const currentHours = data.currentOpeningHours?.weekdayDescriptions || hours
  
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
    geo: toGeo(data.location),
    phone: data.nationalPhoneNumber || '',
    phoneInternational: data.internationalPhoneNumber || '',
    website: data.websiteUri || '',
    mapsUrl: data.googleMapsUri || '',
    rating: data.rating ?? null,
    reviewCount: data.userRatingCount || 0,
    priceLevel: data.priceLevel ?? null,
    businessStatus: data.businessStatus || 'OPERATIONAL',
    businessHours,
    hoursRaw: hours,
    currentHoursRaw: currentHours,
    isOpen: data.currentOpeningHours?.openNow ?? null,
    lastSynced: new Date().toISOString(),
    source: 'google_places_api'
  }
}

const SYNC_EVENT = 'sync_business_profile'
const SYNC_FAILED_EVENT = 'sync_business_profile_failed'

async function pruneOldSyncLogs(db, event = SYNC_EVENT) {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const oldLogsSnap = await db.collection('logs')
      .where('metadata.event', '==', event)
      .where('timestamp', '<', ninetyDaysAgo)
      .limit(50)
      .get()

    if (!oldLogsSnap.empty) {
      const batch = db.batch()
      oldLogsSnap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  } catch (err) {
    console.warn('[sync-business-profile] Prune old logs failed:', err?.message || err)
  }
}

// A failed run used to leave no audit trail (only a console line, which Hobby
// keeps ~1h), so "cron never ran" and "cron ran and failed" looked identical.
// Never throws: logging must not mask the original error.
async function logSyncFailure(db, syncSource, actorEmail, err) {
  try {
    await db.collection('logs').add({
      action: 'update',
      collection: 'miscellaneous',
      documentId: 'businessProfile',
      performedBy: syncSource === 'vercel_cron' ? 'Vercel Cron' : (actorEmail || 'Admin'),
      userEmail: syncSource === 'vercel_cron' ? 'cron@system' : (actorEmail || 'admin'),
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        event: SYNC_FAILED_EVENT,
        syncSource,
        error: String(err?.message || err || 'unknown error').slice(0, 300),
      },
    })
    await pruneOldSyncLogs(db, SYNC_FAILED_EVENT)
  } catch (logErr) {
    console.warn('[sync-business-profile] Failure audit log write failed:', logErr?.message || logErr)
  }
}

async function performSync(db, placeIdOverride, syncSource, actorEmail = null) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured')
  }

  let placeId = placeIdOverride
  if (!placeId) {
    const settingsDoc = await db.collection('miscellaneous').doc('settings').get()
    placeId = settingsDoc.data()?.googlePlaceId
  }

  if (!placeId) {
    throw new Error('No Google Place ID configured in settings or request')
  }

  const placeData = await fetchPlaceDetails(placeId, apiKey)
  const transformed = transformPlaceData(placeData)

  // A place with no usable location must not blank out a previously good geo.
  const { geo, ...rest } = transformed
  await db.collection('miscellaneous').doc('businessProfile').set({
    ...rest,
    ...(geo ? { geo } : {}),
    placeId,
    updatedAt: FieldValue.serverTimestamp(),
    syncSource,
    syncedBy: actorEmail || syncSource,
  }, { merge: true })

  // Log sync event to logs collection for admin visibility
  try {
    await db.collection('logs').add({
      action: 'update',
      collection: 'miscellaneous',
      documentId: 'businessProfile',
      performedBy: syncSource === 'vercel_cron' ? 'Vercel Cron' : (actorEmail || 'Admin'),
      userEmail: syncSource === 'vercel_cron' ? 'cron@system' : (actorEmail || 'admin'),
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        event: 'sync_business_profile',
        syncSource,
        placeId,
        rating: transformed.rating,
        reviewCount: transformed.reviewCount,
        businessStatus: transformed.businessStatus,
        isOpen: transformed.isOpen,
      },
    })
  } catch (logErr) {
    console.warn('[sync-business-profile] Audit log write failed:', logErr?.message || logErr)
  }

  // 90-day retention cleanup of older sync log entries
  await pruneOldSyncLogs(db)

  return transformed
}

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'GET, POST, OPTIONS')) return
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const db = adminDb()

  // ---------------------------------------------------------
  // GET: scheduled sync, authenticated by CRON_SECRET only
  // ---------------------------------------------------------
  if (req.method === 'GET') {
    if (!isValidCronAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized: a valid cron Authorization header is required' })
    }
    try {
      const transformed = await performSync(db, null, 'vercel_cron')
      return res.status(200).json({
        success: true,
        message: 'Business profile synced successfully via cron',
        data: transformed
      })
    } catch (err) {
      console.error('[sync-business-profile] Cron sync error:', err)
      await logSyncFailure(db, 'vercel_cron', null, err)
      return res.status(500).json({ error: err.message || 'Failed to sync business profile' })
    }
  }

  // ---------------------------------------------------------
  // POST: Admin/Staff manual sync trigger
  // ---------------------------------------------------------
  const auth = await verifyAuth(req)
  if (auth.error) {
    return res.status(auth.status || 401).json({ error: auth.error })
  }

  if (!(await isStaffEmail(auth.roleEmail))) {
    return res.status(403).json({ error: 'Admin or staff access required' })
  }

  try {
    const placeId = req.body?.placeId || null
    const transformed = await performSync(db, placeId, 'manual', auth.user?.email)
    return res.status(200).json({
      success: true,
      message: 'Business profile synced successfully',
      data: transformed
    })
  } catch (err) {
    console.error('[sync-business-profile] Manual sync error:', err)
    await logSyncFailure(db, 'manual', auth.user?.email, err)
    return res.status(500).json({ error: err.message || 'Failed to sync business profile' })
  }
}
