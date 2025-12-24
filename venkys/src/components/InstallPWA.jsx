import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [offset, setOffset] = useState(72)

  useEffect(() => {
    function onBip(e) {
      e.preventDefault()
      setPromptEvent(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    // If already installed (standalone), hide
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false)
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
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('resize', measure)
      if (ro) ro.disconnect()
    }
  }, [])

  if (!canInstall || !promptEvent) return null

  return (
    <div className="fixed right-3 z-[95]" style={{ bottom: offset }}>
      <button
        className="btn btn-primary shadow-lg strobe"
        onClick={async () => {
          try {
            await promptEvent.prompt()
            await promptEvent.userChoice
            setCanInstall(false)
            setPromptEvent(null)
          } catch { /* noop */ }
        }}
      >Install app</button>
    </div>
  )
}
