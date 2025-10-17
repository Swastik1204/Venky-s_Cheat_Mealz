// Google Maps/Places helpers (graceful fallback when API key not set)

let mapsLoading = null

export function getGoogleApiKey() {
  try {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  } catch {
    return ''
  }
}

export function loadGoogleMaps(apiKey = getGoogleApiKey()) {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google)
  }
  if (!apiKey) {
    return Promise.resolve(null)
  }
  if (mapsLoading) return mapsLoading
  mapsLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true
    s.defer = true
    s.onload = () => resolve(window.google || null)
    s.onerror = (e) => reject(e)
    document.head.appendChild(s)
  })
  return mapsLoading
}

export function extractAddressFromPlace(place) {
  const out = { line1: '', line2: '', city: '', state: '', zip: '', country: '', lat: null, lng: null, placeId: '', mapUrl: '', formatted: '' }
  if (!place) return out
  const comp = place.address_components || []
  const get = (type) => {
    const c = comp.find(a => a.types?.includes(type))
    return c ? c.long_name : ''
  }
  const streetNumber = get('street_number')
  const route = get('route')
  out.line1 = [streetNumber, route].filter(Boolean).join(' ') || place.name || ''
  out.city = get('locality') || get('sublocality') || get('administrative_area_level_2')
  out.state = get('administrative_area_level_1')
  out.zip = get('postal_code')
  out.country = get('country')
  out.formatted = place.formatted_address || ''
  out.placeId = place.place_id || ''
  if (place.geometry?.location) {
    const loc = place.geometry.location
    out.lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat
    out.lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng
    out.mapUrl = `https://www.google.com/maps?q=${out.lat},${out.lng}`
  }
  return out
}

export async function initAutocomplete(inputEl, onPlaceSelected) {
  const key = getGoogleApiKey()
  if (!inputEl || !key) return null
  const g = await loadGoogleMaps(key).catch(() => null)
  if (!g || !g.maps?.places) return null
  const ac = new g.maps.places.Autocomplete(inputEl, {
    fields: ['address_components', 'geometry', 'formatted_address', 'place_id', 'name'],
    types: ['geocode'],
    componentRestrictions: undefined,
  })
  ac.addListener('place_changed', () => {
    const place = ac.getPlace()
    const parts = extractAddressFromPlace(place)
    try { onPlaceSelected && onPlaceSelected(parts, place) } catch {}
  })
  return ac
}

export async function reverseGeocode(lat, lng) {
  const key = getGoogleApiKey()
  if (!key || lat == null || lng == null) return null
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.length) return null
    // Pick the first formatted result
    const place = data.results[0]
    const parts = extractAddressFromPlace({ ...place, geometry: { location: { lat, lng } } })
    parts.formatted = place.formatted_address || parts.formatted
    parts.placeId = place.place_id || parts.placeId
    return parts
  } catch (e) {
    return null
  }
}
