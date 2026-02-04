// Custom service worker used by vite-plugin-pwa (injectManifest strategy)
// Caches app shell, precaches build assets via injected manifest, with navigation fallback.

const CACHE = 'venkys-pwa-v2'
const APP_SHELL = ['/', '/index.html']
// This array is replaced at build time by vite-plugin-pwa (workbox-inject-manifest)
const WB_MANIFEST = self.__WB_MANIFEST || []
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // Precache build assets from injected manifest
      const urls = WB_MANIFEST.map((e) => e.url)
  try { await cache.addAll([...APP_SHELL, ...urls]) } catch { /* noop */ }
    })()
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? undefined : caches.delete(k))))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Skip caching for API calls and external resources
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req))
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Only cache essential static assets (CSS, JS, icons, fonts)
  // Exclude large images from menu items to save storage
  if (url.pathname.match(/\.(?:css|js|woff2?|ttf|eot)$/) || url.pathname.includes('/icons/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
      })
    )
    return
  }

  // For everything else, network-first
  event.respondWith(fetch(req).catch(() => caches.match(req)))
})
