/* eslint-env node */
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

/**
 * VERCEL BILL PROTECTION - Rate Limiter + Kill Switch
 * 
 * FEATURES:
 * 1. Per-route rate limiting (token bucket / sliding window)
 * 2. Per-IP + Per-User tracking
 * 3. Global kill switch (emergency shutdown)
 * 4. Automatic logging of violations
 * 5. Upstash Redis support for distributed rate limiting (serverless-safe)
 * 
 * CONFIGURATION:
 * - Set RATE_LIMIT_DISABLED=1 to bypass rate limiting (dev/testing)
 * - Set API_KILL_SWITCH=1 to shut down all APIs (emergency)
 * - Set API_KILL_SWITCH_REASON="..." for custom message
 * - Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for distributed rate limiting
 *   (falls back to in-memory when not configured)
 */

// ============================================================================
// REDIS STORE (Upstash - distributed, serverless-safe)
// ============================================================================

let _redis = null
let _redisInitFailed = false

function getRedis() {
  if (_redis) return _redis
  if (_redisInitFailed) return null
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim()
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  if (!url || !token) return null
  try {
    _redis = new Redis({ url, token })
    return _redis
  } catch {
    _redisInitFailed = true
    return null
  }
}

// Upstash sliding-window rate limiter instances (cached per route)
const _rateLimiters = new Map()

function getRedisRateLimiter(routeName, config) {
  if (_rateLimiters.has(routeName)) return _rateLimiters.get(routeName)
  const redis = getRedis()
  if (!redis) return null
  try {
    const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000))
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${windowSec} s`),
      prefix: `rl:${routeName}`,
      analytics: false,
    })
    _rateLimiters.set(routeName, limiter)
    return limiter
  } catch {
    return null
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RATE_LIMITS = {
  // Route-specific limits (requests per window)
  'send-order-messenger': { requests: 20, windowMs: 60000, burst: 5 }, // 20/min, burst 5 (multiple recipients per order)
  'create-order': { requests: 30, windowMs: 60000, burst: 10 },        // 30/min, burst 10
  'place-order': { requests: 20, windowMs: 60000, burst: 8 },          // 20/min, burst 8 (server-owned order creation)
  'notify-order': { requests: 20, windowMs: 60000, burst: 5 },         // 20/min, burst 5 (staff new-order push)
  'notify-status': { requests: 60, windowMs: 60000, burst: 15 },       // 60/min, burst 15 (customer status push)
  'verify-payment': { requests: 50, windowMs: 60000, burst: 15 },      // 50/min, burst 15
  'public-config': { requests: 100, windowMs: 60000, burst: 20 },      // 100/min, burst 20
  'sync-business-profile': { requests: 5, windowMs: 300000, burst: 2 }, // 5/5min, burst 2
  'send-log-email': { requests: 20, windowMs: 60000, burst: 5 },       // 20/min, burst 5
  'place-order-per-uid': { requests: 3, windowMs: 900000 },            // 3 orders / 15 min per customer UID (college-audience abuse guard)
  // NOTE (found while adding these two): 'create-invite', 'verify-invite',
  // 'redeem-invite', 'revoke-invite' (routeNames used by invites.js's other
  // four actions) are NOT keys in this map either, despite invites.js's own
  // header comment asserting specific tight limits for them ("'redeem' ...
  // stays tight at 5/hour") — they've been silently falling through to
  // 'default' (60/min) the whole time. Same shape as Blobby's WS-70 Finding
  // A (merged handlers passing a routeName that was never a real key).
  // Flagged, not fixed here — out of scope for this change.
  'update-staff': { requests: 20, windowMs: 60000, burst: 5 },         // 20/min, burst 5 (admin staff-management UI)
  'remove-staff': { requests: 20, windowMs: 60000, burst: 5 },         // 20/min, burst 5 (admin staff-management UI)
  'default': { requests: 60, windowMs: 60000, burst: 15 }              // Default: 60/min, burst 15
}

// Global kill switch
const KILL_SWITCH_ENABLED = process.env.API_KILL_SWITCH === '1' || process.env.API_KILL_SWITCH === 'true'
const KILL_SWITCH_REASON = process.env.API_KILL_SWITCH_REASON || 'API temporarily disabled for maintenance'

// Rate limit bypass (for development)
const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === '1' || process.env.RATE_LIMIT_DISABLED === 'true'

// ============================================================================
// IN-MEMORY STORAGE (simple token bucket)
// ============================================================================

const buckets = new Map() // key -> { tokens, lastRefill, violations }

// Lazy cleanup - runs during request processing instead of setInterval
// This avoids issues with serverless cold starts
let lastCleanup = Date.now()
function maybeCleanupBuckets() {
  const now = Date.now()
  if (now - lastCleanup < 600000) return // Only clean every 10 min
  lastCleanup = now
  const staleThreshold = 600000
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > staleThreshold) {
      buckets.delete(key)
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// ── Client identity for rate limiting ──
//
// SECURITY: the bucket key must never come from anything the caller chooses.
// The previous shape read `x-user-id` / `?uid=` and PREFERRED it over the IP,
// so a caller who rotated that header got a brand-new bucket on every request
// and was never throttled at all — verified end-to-end: 10/10 requests allowed
// against a 5-per-window limit. No client in any of these apps ever sent that
// header, so it existed purely as an attacker's escape hatch. Both inputs are
// gone and neither may come back.
//
// Rate limiting is now two layers:
//   Layer 1 — this middleware, which runs BEFORE verifyAuth on every request
//             and keys on the real client IP. It cannot key on the UID: it
//             exists partly to protect the token-verification work itself, so
//             it must decide before that work happens.
//   Layer 2 — checkUidRateLimit(), called by handlers AFTER verifyAuth with
//             the UID from the *server-verified* ID token. That is where
//             per-user limits belong, because that is the first point at
//             which a trustworthy user identity exists.
function getClientIp(req) {
  const h = req.headers || {}
  const first = (v) => (Array.isArray(v) ? v[0] : v)

  // Vercel writes this itself and strips any caller-supplied copy, so it is
  // the one hop-identity header here that cannot be forged through the proxy.
  const vercelIp = first(h['x-vercel-forwarded-for'])
  if (typeof vercelIp === 'string' && vercelIp.trim()) {
    return vercelIp.split(',').pop().trim()
  }

  const realIp = first(h['x-real-ip'])
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim()

  // x-forwarded-for: the proxy APPENDS the true client IP to whatever the
  // caller already put there, so the LAST entry is the trustworthy one.
  // Reading [0] — the previous shape — reads the caller's own spoofed value,
  // which was a second, quieter bypass of the same limiter.
  const xff = first(h['x-forwarded-for'])
  if (typeof xff === 'string' && xff.trim()) {
    const last = xff.split(',').pop().trim()
    if (last) return last
  }

  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown'
}

function getClientId(req) {
  return `ip:${getClientIp(req)}`
}

function getRouteName(req) {
  // Extract route name from URL path
  const path = req.url || req.path || ''
  const match = path.match(/\/api\/([^?/]+)/)
  return match ? match[1] : 'unknown'
}

function getRateLimitConfig(routeName) {
  return RATE_LIMITS[routeName] || RATE_LIMITS.default
}

function refillTokens(bucket, config, now) {
  const elapsed = now - bucket.lastRefill
  const refillAmount = (elapsed / config.windowMs) * config.requests
  bucket.tokens = Math.min(config.requests, bucket.tokens + refillAmount)
  bucket.lastRefill = now
}

// ============================================================================
// EMAIL NOTIFICATION (sends alert to admin)
// ============================================================================

async function sendEmailNotification({ type, message, metadata }) {
  try {
    // Get the base URL from environment or construct it
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/send-log-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.API_INTERNAL_SECRET ? { 'X-Internal-Secret': process.env.API_INTERNAL_SECRET } : {})
      },
      body: JSON.stringify({ type, message, metadata })
    })
    
    if (!response.ok) {
      console.warn('[rateLimiter] Email notification failed:', response.status)
    }
  } catch (err) {
    console.error('[rateLimiter] Failed to send email:', err.message)
  }
}

// ============================================================================
// LOGGING (to Firestore logs collection)
// ============================================================================

async function logRateLimitViolation(clientId, routeName, reason) {
  // Only log in production to avoid dev noise
  if (process.env.NODE_ENV !== 'production' && !process.env.LOG_RATE_LIMITS) {
    return
  }

  try {
    // Dynamically import Firebase Admin (only in Node.js environment)
    const { getFirestore } = await import('firebase-admin/firestore')
    const { initializeApp, getApps } = await import('firebase-admin/app')
    
    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
      initializeApp()
    }
    
    const db = getFirestore()
    await db.collection('logs').add({
      type: 'rate_limit_violation',
      clientId,
      routeName,
      reason,
      timestamp: new Date(),
      severity: 'warning',
      source: 'api_rate_limiter'
    })

    // Also send email notification
    await sendEmailNotification({
      type: 'rate_limit_violation',
      message: `Rate limit exceeded for ${routeName}`,
      metadata: { clientId, routeName, reason, timestamp: new Date().toISOString() }
    })
  } catch (err) {
    console.error('[rateLimiter] Failed to log violation:', err.message)
  }
}

// ============================================================================
// MAIN RATE LIMITER MIDDLEWARE
// ============================================================================

/**
 * Rate limiter middleware factory
 * @param {Object} options - Optional override config
 * @returns {Function} Express/Vercel middleware
 */
function createRateLimiter(options = {}) {
  return async function rateLimiter(req, res, next) {
    // Lazy cleanup of stale buckets
    maybeCleanupBuckets()
    
    // 1. Check global kill switch
    if (KILL_SWITCH_ENABLED) {
      console.warn('[rateLimiter] Kill switch activated')
      res.status(503).json({ 
        error: 'service_unavailable',
        message: KILL_SWITCH_REASON,
        retryAfter: 3600 // Suggest retry after 1 hour
      })
      return
    }

    // 2. Bypass if disabled (dev mode)
    if (RATE_LIMIT_DISABLED) {
      if (next) return next()
      return
    }

    // 3. Extract client and route info
    const clientId = getClientId(req)
    const routeName = options.routeName || getRouteName(req)
    const config = options.config || getRateLimitConfig(routeName)

    // 4. Try Redis-based rate limiting first (distributed, serverless-safe)
    const redisLimiter = getRedisRateLimiter(routeName, config)
    if (redisLimiter) {
      try {
        const { success, limit, remaining, reset } = await redisLimiter.limit(clientId)
        res.setHeader('X-RateLimit-Limit', limit)
        res.setHeader('X-RateLimit-Remaining', remaining)
        res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString())
        if (success) {
          if (next) return next()
          return
        }
        // Rate limit exceeded
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
        logRateLimitViolation(clientId, routeName, `Exceeded ${config.requests} requests per ${config.windowMs}ms (redis)`)
          .catch(err => console.error('[rateLimiter] Log error:', err))
        res.status(429).json({
          error: 'rate_limit_exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
          limit: config.requests,
          window: `${config.windowMs / 1000}s`
        })
        return
      } catch (redisErr) {
        // Redis failed, fall through to in-memory
        console.warn('[rateLimiter] Redis error, falling back to in-memory:', redisErr.message)
      }
    }

    // 5. In-memory fallback (per-instance, resets on cold start)
    const bucketKey = `${routeName}:${clientId}`

    // 6. Get or create bucket
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        tokens: config.requests,
        lastRefill: Date.now(),
        violations: 0
      })
    }

    const bucket = buckets.get(bucketKey)
    const now = Date.now()

    // 7. Refill tokens based on time elapsed
    refillTokens(bucket, config, now)

    // 8. Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.requests)
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens))
      res.setHeader('X-RateLimit-Reset', new Date(bucket.lastRefill + config.windowMs).toISOString())

      if (next) return next()
      return
    }

    // 9. Rate limit exceeded
    bucket.violations += 1
    const retryAfter = Math.ceil((config.windowMs - (now - bucket.lastRefill)) / 1000)

    // Log violation (async, don't block response)
    logRateLimitViolation(clientId, routeName, `Exceeded ${config.requests} requests per ${config.windowMs}ms`)
      .catch(err => console.error('[rateLimiter] Log error:', err))

    // Send 429 response
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      limit: config.requests,
      window: `${config.windowMs / 1000}s`
    })
  }
}


// ============================================================================
// DIRECT UID RATE LIMIT CHECK (not tied to req/res — for use after auth)
// ============================================================================

/**
 * Checks (and consumes on success) a rate-limit bucket keyed purely by
 * `uid:<uid>`, independent of the per-route req/res middleware above. Used
 * for the order-placement per-customer throttle, which must run *after*
 * verifyAuth (there is no trustworthy uid before that), unlike the generic
 * per-route limiter which runs on every request regardless of auth.
 *
 * The uid passed here MUST come from a verified Firebase ID token
 * (`auth.user.uid` from verifyAuth) — never from a request header, query
 * param, or body field. See the getClientId comment above for why.
 *
 * Uses the same Redis-first / in-memory-fallback storage as createRateLimiter.
 *
 * @returns {Promise<{allowed: boolean, retryAfter: number, limit: number, windowMs: number}>}
 */
async function checkUidRateLimit(uid, routeName) {
  const config = RATE_LIMITS[routeName] || RATE_LIMITS.default
  const clientId = `uid:${uid}`

  if (RATE_LIMIT_DISABLED) return { allowed: true, retryAfter: 0, limit: config.requests, windowMs: config.windowMs }

  const redisLimiter = getRedisRateLimiter(routeName, config)
  if (redisLimiter) {
    try {
      const { success, reset } = await redisLimiter.limit(clientId)
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      if (!success) {
        logRateLimitViolation(clientId, routeName, `Exceeded ${config.requests} requests per ${config.windowMs}ms (redis, uid-direct)`)
          .catch(err => console.error('[rateLimiter] Log error:', err))
      }
      return { allowed: success, retryAfter: success ? 0 : retryAfter, limit: config.requests, windowMs: config.windowMs }
    } catch (redisErr) {
      console.warn('[rateLimiter] Redis error (uid-direct), falling back to in-memory:', redisErr.message)
    }
  }

  maybeCleanupBuckets()
  const bucketKey = `${routeName}:${clientId}`
  if (!buckets.has(bucketKey)) {
    buckets.set(bucketKey, { tokens: config.requests, lastRefill: Date.now(), violations: 0 })
  }
  const bucket = buckets.get(bucketKey)
  const now = Date.now()
  refillTokens(bucket, config, now)

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, retryAfter: 0, limit: config.requests, windowMs: config.windowMs }
  }

  bucket.violations += 1
  const retryAfter = Math.ceil((config.windowMs - (now - bucket.lastRefill)) / 1000)
  logRateLimitViolation(clientId, routeName, `Exceeded ${config.requests} requests per ${config.windowMs}ms (uid-direct)`)
    .catch(err => console.error('[rateLimiter] Log error:', err))
  return { allowed: false, retryAfter, limit: config.requests, windowMs: config.windowMs }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  createRateLimiter,
  checkUidRateLimit,
  RATE_LIMITS,
  KILL_SWITCH_ENABLED,
  RATE_LIMIT_DISABLED
}
