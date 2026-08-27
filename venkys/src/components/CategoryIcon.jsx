// CategoryIcon — small, hand-picked SVG glyphs per menu category.
//
// Deliberately NOT stock photos: most categories already have a real
// photo set via the admin panel (categoryImageMap), but the moment one
// gets removed or a new category is added without an image yet, the old
// fallback dropped to a plain letter initial. These are license-free,
// zero-weight inline line icons that stand in for any category with no
// image, so the bar never looks broken or half-finished.
import { memo } from 'react'

const ICONS = {
  burger: (
    <>
      <path d="M4 10.5c0-3 3.6-5.5 8-5.5s8 2.5 8 5.5" />
      <path d="M3.5 11h17a1 1 0 011 1 2.5 2.5 0 01-2.5 2.5H5a2.5 2.5 0 01-2.5-2.5 1 1 0 011-1z" />
      <path d="M4.5 16h15" />
      <path d="M5 18.5h14a1 1 0 011 1v.5a1 1 0 01-1 1H5a1 1 0 01-1-1v-.5a1 1 0 011-1z" />
    </>
  ),
  pizza: (
    <>
      <path d="M4 5l8 15 8-15a19 19 0 00-16 0z" />
      <path d="M6.3 9.2a15.5 15.5 0 0011.4 0" />
      <circle cx="12" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9.3" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  noodles: (
    <>
      <path d="M4 16c2-4 1-7-1-9M8 17c2-5 0-8-2-11M12 17.5c1.5-6 0-9-1-12M16 17c1-6 3-8 4-12M20 16.5c.5-5 2-8 2-11" />
      <ellipse cx="12" cy="19" rx="9" ry="2.2" />
    </>
  ),
  dessert: (
    <>
      <path d="M6 20l1.2-9h9.6L18 20z" />
      <path d="M5 20h14" />
      <path d="M9 11c-1-2 .5-4 1.5-4.5C10 5 11 4 12 4s2 1 1.5 2.5C14.5 7 16 9 15 11" />
      <circle cx="12" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  shake: (
    <>
      <path d="M8 3h8l-1 4H9z" />
      <path d="M8.4 7h7.2l-1.1 12.2a1.5 1.5 0 01-1.5 1.3h-2a1.5 1.5 0 01-1.5-1.3z" />
      <path d="M9.5 11h5" />
      <path d="M17 8l3-1.2M17 10.5l3.5-.5" />
    </>
  ),
  mocktail: (
    <>
      <path d="M5 4h14l-6.2 7.5v6.5h3M9.3 18h5.4" />
      <path d="M12.8 11.5V18" />
      <path d="M6.5 6h11" />
      <circle cx="15.5" cy="6.3" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  momo: (
    <>
      <path d="M4 13a8 8 0 0116 0c0 1.5-1.2 2-3 2H7c-1.8 0-3-.5-3-2z" />
      <path d="M8 13c.5-2.5 2-4 4-4s3.5 1.5 4 4" />
      <circle cx="12" cy="8.3" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  wrap: (
    <>
      <path d="M6 5.5c4-2 8-2 12 0l-3.5 15c-.3 1.3-1.5 1.3-1.8 0z" />
      <path d="M7.5 9.5c3 1.3 6 1.3 9 0M8.6 14c2.2 1 4.6 1 6.8 0" />
    </>
  ),
  appetizer: (
    <>
      <path d="M3 6l16 14M6 3l14 16" />
      <circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="11" cy="11" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  bucket: (
    <>
      <path d="M5.5 9h13l-1.6 10.2a1.5 1.5 0 01-1.5 1.3H8.6a1.5 1.5 0 01-1.5-1.3z" />
      <path d="M5 9a7 7 0 0114 0" />
      <path d="M9 12.5v5M12 12.5v5M15 12.5v5" />
    </>
  ),
  addon: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  main: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M6.3 13a5.7 5.7 0 0111.4 0" />
      <path d="M4 13h16" />
      <path d="M9 4.2V7M12 3.5V7M15 4.2V7" />
    </>
  ),
  meal: (
    <>
      <circle cx="9" cy="13" r="6" />
      <path d="M4.5 13h9" />
      <path d="M17 4v6M19.2 4v3.5a1.8 1.8 0 01-2.2 1.8V4M17 4h2.2" />
      <path d="M15.5 20.5l3.5-4.5" />
    </>
  ),
  veg: (
    <>
      <path d="M12 3c-4 2-6 5-6 9a6 6 0 0012 0c0-4-2-7-6-9z" />
      <path d="M12 8v10" />
    </>
  ),
  nonveg: (
    <>
      <path d="M8 4c2 0 3.5 1.2 4 3 .5-1.8 2-3 4-3 1.6 3-.2 6-2 7l1 6a1.5 1.5 0 01-3 0l-1-4-1 4a1.5 1.5 0 01-3 0l1-6c-1.8-1-3.6-4-2-7z" />
    </>
  ),
  default: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12h8M12 8v8" />
    </>
  ),
}

// Match a Firestore category name to one of the hand-drawn glyphs above.
// Order matters where names overlap (checked most-specific first).
// (Not exported — CategoryIcon is the only consumer, kept local so this file
// exports just the component, satisfying react-refresh/only-export-components.)
function categoryIconKey(name = '') {
  const n = String(name).toLowerCase()
  if (n.includes('burger')) return 'burger'
  if (n.includes('pizza')) return 'pizza'
  if (n.includes('maggi') || n.includes('noodle')) return 'noodles'
  if (n.includes('dessert') || n.includes('sweet') || n.includes('ice cream')) return 'dessert'
  if (n.includes('shake')) return 'shake'
  if (n.includes('mocktail') || n.includes('juice') || n.includes('drink') || n.includes('beverage')) return 'mocktail'
  if (n.includes('momo')) return 'momo'
  if (n.includes('wrap') || n.includes('roll')) return 'wrap'
  if (n.includes('starter') || n.includes('appetizer') || n.includes('appetiser')) return 'appetizer'
  if (n.includes('bucket')) return 'bucket'
  if (n.includes('add-on') || n.includes('addon') || n.includes('add on') || n.includes('side')) return 'addon'
  if (n.includes('main course') || n.includes('main-course')) return 'main'
  if (n.includes('meal') || n.includes('thali') || n.includes('combo')) return 'meal'
  if (n.includes('non veg') || n.includes('non-veg') || n.includes('chicken') || n.includes('mutton')) return 'nonveg'
  if (n.includes('veg')) return 'veg'
  return 'default'
}

function CategoryIconInner({ name, className = 'w-9 h-9 sm:w-11 sm:h-11' }) {
  const key = categoryIconKey(name)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[key] || ICONS.default}
    </svg>
  )
}

const CategoryIcon = memo(CategoryIconInner)
export default CategoryIcon
