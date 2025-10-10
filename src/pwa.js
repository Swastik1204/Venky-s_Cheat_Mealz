// Optional: Hooks for prompting install and handling updates
export function setupPWAHooks() {
  // Listen for the beforeinstallprompt event (Android/Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent mini-infobar
    e.preventDefault()
    // You can store this event and show your own Install UI
    window.__pwaInstallPrompt = e
  })

  // Notify when app is ready offline
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed')
  })
}
