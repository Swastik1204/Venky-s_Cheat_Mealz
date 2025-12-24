import { useEffect } from 'react'

/**
 * Scales the root font-size (and optional CSS variable) based on viewport width.
 * Keeps design comfortable on very large or very small screens without manual zoom.
 * Usage: call inside top-level layout component.
 */
export default function useAdaptiveScale({
  minWidth = 360,
  maxWidth = 1600,
  minRem = 14,
  maxRem = 18,
  varName = '--app-scale'
} = {}) {
  useEffect(() => {
    function apply() {
      const w = window.innerWidth
      const clamped = Math.min(Math.max(w, minWidth), maxWidth)
      // linear interpolate font-size between minRem and maxRem
      const t = (clamped - minWidth) / (maxWidth - minWidth)
      const size = (minRem + (maxRem - minRem) * t)
      document.documentElement.style.fontSize = size + 'px'
      document.documentElement.style.setProperty(varName, (size / 16).toFixed(4))
    }
    apply()
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    return () => {
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [minWidth, maxWidth, minRem, maxRem, varName])
}
