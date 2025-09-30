// src/services/location.js
// Centralized location utilities: geolocation, reverse geocoding, and persistence.

const STORAGE_KEY = 'deliveryAddress'

export function getSavedDeliveryAddress() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveDeliveryAddress(payload) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {}
}

export function geolocate(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(Object.assign(new Error('Geolocation unsupported'), { code: 'UNSUPPORTED' }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      },
      (err) => reject(err),
      options
    )
  })
}

export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1&accept-language=en`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('Reverse geocode failed')
    const data = await res.json()
    const a = data.address || {}
    const city = a.city || a.town || a.village || a.suburb || a.county || a.state || 'Current location'
    return { label: city, full: data.display_name }
  } catch (e) {
    return { label: `${lat.toFixed(3)}, ${lon.toFixed(3)}` }
  }
}

export { STORAGE_KEY }
