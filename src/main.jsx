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
  </StrictMode>,
)

// Register the service worker via vite-plugin-pwa (autoUpdate)
registerSW({ immediate: true })
setupPWAHooks()
