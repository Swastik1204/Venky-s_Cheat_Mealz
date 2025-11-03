// src/hooks/useDeliveryLocation.js
// React hook wrapping location services with state for label/loading/error.

import { useCallback, useMemo, useState, useEffect } from 'react'
import { geolocate, reverseGeocode, getSavedDeliveryAddress, saveDeliveryAddress } from '../services/location'

function useDeliveryLocation(defaultLabel = 'Durgapur') {
  const saved = typeof window !== 'undefined' ? getSavedDeliveryAddress() : null
  const [label, setLabel] = useState(saved?.label || defaultLabel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(saved ? { lat: saved.lat, lon: saved.lon } : null)
  const [distance, setDistance] = useState(null)
  const [isWithinRegion, setIsWithinRegion] = useState(true)
  const [region, setRegion] = useState({ center: { lat: Number(import.meta.env.VITE_DELIVERY_CENTER_LAT ?? 23.5204), lng: Number(import.meta.env.VITE_DELIVERY_CENTER_LNG ?? 87.3119) }, radiusKm: Number(import.meta.env.VITE_DELIVERY_RADIUS_KM ?? 8) })

  // Fetch delivery region from Firestore
  useEffect(() => {
    let active = true
    import('../lib/data').then(m => m.fetchDeliverySettings && m.fetchDeliverySettings()).then(d => {
      if (!active || !d) return
      if (typeof d.centerLat === 'number' && typeof d.centerLng === 'number') {
        setRegion(r => ({ ...r, center: { lat: d.centerLat, lng: d.centerLng } }))
      }
      if (typeof d.radiusKm === 'number') setRegion(r => ({ ...r, radiusKm: d.radiusKm }))
    }).catch(() => {})
    return () => { active = false }
  }, [])

  function haversineKm(a, b) {
    // Accept a = {lat, lon|lng}, b = {lat, lng}
    const aLng = typeof a.lng === 'number' ? a.lng : a.lon
    if (!a || !b || typeof a.lat !== 'number' || typeof aLng !== 'number' || typeof b.lat !== 'number' || typeof b.lng !== 'number') return Infinity
    const R = 6371
    const toRad = (x) => (x * Math.PI) / 180
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - aLng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
  }

  const distanceTo = useCallback((lat, lng) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return Infinity
    return haversineKm({ lat, lng }, region.center)
  }, [region])

  const checkWithin = useCallback((lat, lng) => {
    const dist = distanceTo(lat, lng)
    const ok = dist <= region.radiusKm
    return { ok, distance: dist, radiusKm: region.radiusKm }
  }, [distanceTo, region])

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
      setLocation({ lat: latitude, lon: longitude })
      // Geofencing check
      const dist = haversineKm({ lat: latitude, lon: longitude }, region.center)
      setDistance(dist)
      if (dist > region.radiusKm) {
        setIsWithinRegion(false)
        setError(`Location is outside delivery region (${dist.toFixed(2)} km > ${region.radiusKm} km)`)
      } else {
        setIsWithinRegion(true)
        setError(null)
      }
      return { ...payload, isWithinRegion: dist <= region.radiusKm, distance: dist }
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [region])

  const value = useMemo(() => ({ label, loading, error, locate, location, isWithinRegion, distance, region, checkWithin, distanceTo }), [label, loading, error, locate, location, isWithinRegion, distance, region, checkWithin, distanceTo])
  return value
}

export default useDeliveryLocation
