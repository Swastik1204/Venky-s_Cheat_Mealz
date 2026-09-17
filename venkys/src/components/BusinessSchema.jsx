import { useEffect } from 'react'
import { fetchBusinessProfile } from '../lib/data-settings'

const DAY_SCHEMA = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

// "11:00 AM – 9:30 PM" (en dash or hyphen) -> { opens: "11:00", closes: "21:30" }
function parseHourRange(text) {
  const m = String(text || '').match(
    /(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?\s*[–—-]\s*(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?/
  )
  if (!m) return null
  const to24 = (h, min, ap) => {
    let hour = Number(h) % 12
    if (ap.toLowerCase() === 'p') hour += 12
    return `${String(hour).padStart(2, '0')}:${min}`
  }
  return { opens: to24(m[1], m[2], m[3]), closes: to24(m[4], m[5], m[6]) }
}

// Collapses days that share the same opens/closes into one spec entry, which is
// how schema.org expects a 7-day-identical schedule to be expressed.
function buildOpeningHours(businessHours) {
  if (!businessHours || typeof businessHours !== 'object') return null
  const byRange = new Map()
  for (const [key, label] of Object.entries(DAY_SCHEMA)) {
    const parsed = parseHourRange(businessHours[key])
    if (!parsed) continue
    const rangeKey = `${parsed.opens}-${parsed.closes}`
    if (!byRange.has(rangeKey)) byRange.set(rangeKey, { ...parsed, dayOfWeek: [] })
    byRange.get(rangeKey).dayOfWeek.push(label)
  }
  if (!byRange.size) return null
  return [...byRange.values()].map((r) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: r.dayOfWeek,
    opens: r.opens,
    closes: r.closes,
  }))
}

/**
 * Keeps the FastFoodRestaurant JSON-LD in sync with the live business profile.
 *
 * index.html carries the static facts so non-JS crawlers see a complete record.
 * Hours are the part that actually drifts, so they are never hardcoded: this
 * component reads miscellaneous/businessProfile — the same Google Business
 * Profile sync /contact renders — and patches openingHoursSpecification,
 * telephone and address into the existing @graph. Nothing is written if the
 * fetch fails, so the static record stands.
 */
export default function BusinessSchema() {
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const profile = await fetchBusinessProfile()
      if (cancelled || !profile) return

      const script = document.querySelector('script[type="application/ld+json"]')
      if (!script) return

      let data
      try {
        data = JSON.parse(script.textContent)
      } catch {
        return
      }

      const graph = Array.isArray(data['@graph']) ? data['@graph'] : []
      const restaurant = graph.find((n) => String(n['@type'] || '').endsWith('Restaurant'))
      if (!restaurant) return

      const hours = buildOpeningHours(profile.businessHours)
      if (hours) restaurant.openingHoursSpecification = hours
      if (profile.phoneInternational || profile.phone) {
        restaurant.telephone = profile.phoneInternational || profile.phone
      }
      if (profile.address && restaurant.address) {
        // profile.address is the full formatted string; keep the structured
        // locality/region/postcode already in the record and only refresh the
        // street portion that precedes them.
        const street = String(profile.address).split(', Durgapur')[0]
        if (street) restaurant.address.streetAddress = street
      }
      if (profile.mapsUrl) restaurant.hasMap = profile.mapsUrl

      script.textContent = JSON.stringify(data)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
