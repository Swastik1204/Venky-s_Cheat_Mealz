// main — React DOM entry point with providers
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { UIProvider } from './context/UIContext'
import App from './App.jsx'
import { setupPWAHooks } from './pwa'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </UIProvider>
    </BrowserRouter>
  </StrictMode>
)

// PWA hooks (beforeinstallprompt etc.)
setupPWAHooks()

// Catch unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  event.preventDefault()
})

// In development, do NOT keep a service worker: unregister any existing one and clear caches
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Best-effort cleanup of existing SWs/caches that may hold stale prebundles
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
  }).catch(() => {})
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {})
  }
}

// Only register the service worker in production
if (import.meta.env.PROD) {
  registerSW({
    immediate: false,
    onNeedRefresh() {
      // Dispatch a custom event that the UI can listen to
      window.dispatchEvent(new CustomEvent('pwa-update-available'))
    },
    onOfflineReady() {
      if (import.meta.env.DEV) console.log('[PWA] App ready for offline use')
    },
  })
}
