const CACHE = 'venkys-admin-pwa-v1'
const APP_SHELL = ['/', '/index.html']
const WB_MANIFEST = self.__WB_MANIFEST || []

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const urls = WB_MANIFEST.map((e) => e.url)
  try { await cache.addAll([...APP_SHELL, ...urls]) } catch { /* noop */ }
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE ? undefined : caches.delete(k)))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/index.html')))
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
