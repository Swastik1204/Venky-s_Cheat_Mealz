/* eslint-disable no-restricted-globals */
// Custom service worker used by vite-plugin-pwa (injectManifest strategy)
// Caches app shell, precaches build assets via injected manifest, with navigation fallback.

const CACHE = 'venkys-pwa-v1'
const APP_SHELL = ['/', '/index.html']
// This array is replaced at build time by vite-plugin-pwa (workbox-inject-manifest)
// eslint-disable-next-line no-underscore-dangle
const WB_MANIFEST = self.__WB_MANIFEST || []

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // Precache build assets from injected manifest
      const urls = WB_MANIFEST.map((e) => e.url)
      try { await cache.addAll([...APP_SHELL, ...urls]) } catch {}
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

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    )
    return
  }

  if (url.pathname.match(/\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$/)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
          return res
        })
      })
    )
    return
  }

  event.respondWith(fetch(req).catch(() => caches.match(req)))
})
