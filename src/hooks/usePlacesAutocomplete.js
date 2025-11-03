import { useEffect, useRef } from 'react'
import { initAutocomplete } from '../lib/google'

const INSTANCE_KEY = '__venkysPlacesAutocomplete'

function cleanupInstance(instance) {
  if (!instance) return
  try {
    if (typeof instance.removeAllListeners === 'function') {
      instance.removeAllListeners()
    } else if (instance.gm_accessors_ && typeof window !== 'undefined' && window.google?.maps?.event?.clearInstanceListeners) {
      window.google.maps.event.clearInstanceListeners(instance)
    }
  } catch {
    // Swallow errors from best-effort cleanup.
  }
}

export default function usePlacesAutocomplete(inputRef, onSelect, options = {}) {
  const { enabled = true, resetKey } = options
  const handlerRef = useRef(onSelect)
  handlerRef.current = onSelect

  useEffect(() => {
    const el = inputRef?.current
    if (!enabled || !el) return undefined

    // Reuse existing instance if already attached to avoid duplicate listeners.
    const existing = el[INSTANCE_KEY]
    if (existing?.instance) {
      existing.callbackRef = handlerRef
      return undefined
    }

    let cancelled = false

    initAutocomplete(el, (parts, place) => {
      if (cancelled) return
      try {
        const callback = el[INSTANCE_KEY]?.callbackRef?.current || handlerRef.current
        if (callback) callback(parts, place)
      } catch {
        // Ignore callback errors to keep autocomplete responsive.
      }
    }).then((instance) => {
      if (!instance || cancelled) {
        cleanupInstance(instance)
        return
      }
      el[INSTANCE_KEY] = { instance, callbackRef: handlerRef }
    }).catch(() => {
      // No-op: autocomplete unavailable (likely missing API key)
    })

    return () => {
      cancelled = true
      const stored = el[INSTANCE_KEY]
      if (stored && stored.instance) {
        cleanupInstance(stored.instance)
        delete el[INSTANCE_KEY]
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef, enabled, resetKey])
}
