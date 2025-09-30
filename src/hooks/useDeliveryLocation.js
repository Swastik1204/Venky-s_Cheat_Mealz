// src/hooks/useDeliveryLocation.js
// React hook wrapping location services with state for label/loading/error.

import { useCallback, useMemo, useState } from 'react'
import { geolocate, reverseGeocode, getSavedDeliveryAddress, saveDeliveryAddress } from '../services/location'

export function useDeliveryLocation(defaultLabel = 'Durgapur') {
  const saved = typeof window !== 'undefined' ? getSavedDeliveryAddress() : null
  const [label, setLabel] = useState(saved?.label || defaultLabel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const locate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { latitude, longitude } = await geolocate()
      const rg = await reverseGeocode(latitude, longitude)
      const payload = {
        label: rg.label,
        lat: latitude,
        lon: longitude,
        address: rg.full || rg.label,
        ts: Date.now(),
      }
      saveDeliveryAddress(payload)
      setLabel(payload.label)
      return payload
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(() => ({ label, loading, error, locate }), [label, loading, error, locate])
  return value
}

export default useDeliveryLocation
