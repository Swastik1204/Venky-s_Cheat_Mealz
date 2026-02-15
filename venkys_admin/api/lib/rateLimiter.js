/* eslint-env node */

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
    const { Redis } = require('@upstash/redis')
    _redis = new Redis({ url, token })
    return _redis
  } catch {
    _redisInitFailed = true
    return null
  }
}

const _rateLimiters = new Map()

function getRedisRateLimiter(routeName, config) {
  if (_rateLimiters.has(routeName)) return _rateLimiters.get(routeName)
  const redis = getRedis()
  if (!redis) return null
  try {
    const { Ratelimit } = require('@upstash/ratelimit')
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
  'send-whatsapp': { requests: 10, windowMs: 60000, burst: 3 },       // 10/min, burst 3
  'send-order-messenger': { requests: 10, windowMs: 60000, burst: 3 }, // 10/min, burst 3
  'create-order': { requests: 30, windowMs: 60000, burst: 10 },        // 30/min, burst 10
  'verify-payment': { requests: 50, windowMs: 60000, burst: 15 },      // 50/min, burst 15
  'public-config': { requests: 100, windowMs: 60000, burst: 20 },      // 100/min, burst 20
  'sync-business-profile': { requests: 5, windowMs: 300000, burst: 2 }, // 5/5min, burst 2
  'wa-webhook': { requests: 100, windowMs: 60000, burst: 30 },         // 100/min, burst 30
  'send-log-email': { requests: 20, windowMs: 60000, burst: 5 },       // 20/min, burst 5 (prevent email spam)
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

function getClientId(req) {
  // Try to get unique identifier: Firebase UID > IP > forwarded IP
  const uid = req.headers['x-user-id'] || req.query.uid || null
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.connection?.remoteAddress 
    || 'unknown'
  return uid ? `uid:${uid}` : `ip:${ip}`
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
// EXPORTS
// ============================================================================

export {
  createRateLimiter,
  RATE_LIMITS,
  KILL_SWITCH_ENABLED,
  RATE_LIMIT_DISABLED
}
