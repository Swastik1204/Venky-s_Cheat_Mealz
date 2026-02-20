// InstallPWA — PWA install banner prompt
import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

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

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
    }
  }, [])

  if (!canInstall || !promptEvent) return null

  return (
    <div className="fixed right-4 bottom-4 z-[95]">
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
