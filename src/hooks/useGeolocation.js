// Generic geolocation + optional reverse geocode hook for reuse across profile, checkout, etc.
import { useCallback, useState } from 'react'
import { geolocate, reverseGeocode } from '../services/location'

/**
 * useGeolocation
 * Returns { locating, error, position, address, locate }
 * - position: { lat, lng }
 * - address: { label, full } if reverse geocode succeeded
 * Pass options: { reverse: boolean } (default true) to enable/disable reverse geocoding
 */
export function useGeolocation(options = { reverse: true }) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState(null)
  const [position, setPosition] = useState(null)
  const [address, setAddress] = useState(null)

  const locate = useCallback(async () => {
    setLocating(true)
    setError(null)
    try {
      const { latitude, longitude } = await geolocate()
      const pos = { lat: latitude, lng: longitude }
      setPosition(pos)
      if (options.reverse) {
        try {
          const rg = await reverseGeocode(latitude, longitude)
          setAddress(rg)
        } catch (e) {
          // swallow reverse geocode errors; still return position
        }
      }
      return { position: pos, address: options.reverse ? address : null }
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLocating(false)
    }
  }, [options.reverse, address])

  return { locating, error, position, address, locate }
}

export default useGeolocation
