import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { UIProvider } from './context/UIContext'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing root element')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}
