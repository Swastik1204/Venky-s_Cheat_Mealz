// InstallPWA — PWA install banner prompt
import { useEffect, useRef, useState } from 'react'

export default function InstallPWA() {
  const deferredPromptRef = useRef(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const [offset, setOffset] = useState(72)

  useEffect(() => {
    function onInstallReady(event) {
      const promptEvent = event?.detail
      if (!promptEvent || typeof promptEvent.prompt !== 'function') return
      deferredPromptRef.current = promptEvent
      setShowInstallButton(true)
    }

    function onUpdateAvailable() {
      setShowUpdateBanner(true)
      setUpdateDismissed(false)
    }

    function onAppInstalled() {
      deferredPromptRef.current = null
      setShowInstallButton(false)
    }

    window.addEventListener('pwa-install-ready', onInstallReady)
    window.addEventListener('appinstalled', onAppInstalled)
    window.addEventListener('pwa-update-available', onUpdateAvailable)

    if (window.__pwaInstallPrompt && typeof window.__pwaInstallPrompt.prompt === 'function') {
      deferredPromptRef.current = window.__pwaInstallPrompt
      setShowInstallButton(true)
    }

    // If already installed (standalone), hide
    if (window.matchMedia('(display-mode: standalone)').matches) {
      deferredPromptRef.current = null
      setShowInstallButton(false)
    }

    // measure dock height
    const measure = () => {
      const el = document.getElementById('quick-dock-bar')
      if (el) {
        const h = el.getBoundingClientRect().height
        setOffset(Math.max(56, h + 12))
      } else {
        setOffset(72)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    const ro = (window.ResizeObserver ? new ResizeObserver(measure) : null)
    if (ro) {
      const el = document.getElementById('quick-dock-bar')
      if (el) ro.observe(el)
    }
    return () => {
      window.removeEventListener('pwa-install-ready', onInstallReady)
      window.removeEventListener('appinstalled', onAppInstalled)
      window.removeEventListener('pwa-update-available', onUpdateAvailable)
      window.removeEventListener('resize', measure)
      if (ro) ro.disconnect()
    }
  }, [])

  const showInstallPrompt = showInstallButton && deferredPromptRef.current !== null
  const showUpdatePrompt = showUpdateBanner && !updateDismissed
  if (!showInstallPrompt && !showUpdatePrompt) return null

  const updateBottom = showInstallPrompt ? offset + 64 : offset

  return (
    <>
      {showUpdatePrompt && (
        <div className="fixed left-3 right-3 z-[80]" style={{ bottom: updateBottom }}>
          <div className="alert alert-info shadow-lg backdrop-blur-md bg-base-100/85 border border-info/30">
            <span>A new version is available</span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={() => {
                  location.reload()
                }}
              >
                Update now
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setUpdateDismissed(true)}
                aria-label="Dismiss update prompt"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstallPrompt && (
        <div className="fixed right-3 z-[95]" style={{ bottom: offset }}>
          <button
            className="btn btn-primary shadow-lg strobe"
            onClick={async () => {
              try {
                const deferredPrompt = deferredPromptRef.current
                if (!deferredPrompt) return
                if (import.meta.env.DEV) console.log('[PWA] install prompt shown')
                await deferredPrompt.prompt()
                const choice = await deferredPrompt.userChoice
                if (import.meta.env.DEV) console.log('[PWA] install choice', choice?.outcome || choice)
                deferredPromptRef.current = null
                setShowInstallButton(false)
              } catch { /* noop */ }
            }}
          >Install app</button>
        </div>
      )}
    </>
  )
}
