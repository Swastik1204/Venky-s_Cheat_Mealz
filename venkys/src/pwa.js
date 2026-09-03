// pwa — PWA install prompt hooks and update handlers
export function setupPWAHooks() {
  // Listen for the beforeinstallprompt event (Android/Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent mini-infobar
    e.preventDefault()
    // You can store this event and show your own Install UI
    window.__pwaInstallPrompt = e
    window.dispatchEvent(new CustomEvent('pwa-install-ready', { detail: e }))
  })

  // Notify when app is ready offline
  window.addEventListener('appinstalled', () => {
    if (import.meta.env.DEV) console.log('PWA installed')
  })
}
