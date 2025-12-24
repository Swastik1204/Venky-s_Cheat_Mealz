import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { UIProvider } from './context/UIContext'
import { setupPWAHooks } from './pwa'
import { registerSW } from 'virtual:pwa-register'

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
  registerSW({ immediate: true })
}
