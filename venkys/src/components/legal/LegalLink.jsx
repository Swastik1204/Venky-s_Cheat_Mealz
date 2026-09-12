import { Link, useLocation } from 'react-router-dom'

/**
 * A legal-page link for use inside the app (footer, profile page). Clicking
 * it does a normal SPA navigation to the real route (URL bar, back button,
 * bookmarking all behave correctly) but attaches the current location as
 * `state.background`. App.jsx renders the primary <Routes> tree against
 * `state.background` when present, so whatever page you were on keeps
 * rendering underneath, and a second <Routes> tree renders the same page
 * component inside <LegalModal> on top — see App.jsx.
 *
 * A user who lands on the same URL directly (shared link, bookmark, crawler,
 * fresh load) never has `state.background` set, so they get the full
 * standalone page instead of a modal.
 */
const PATHS = {
  terms: '/terms',
  privacy: '/privacy',
  shipping: '/shipping',
  refund: '/cancellation-refunds',
}

export default function LegalLink({ type, className, children, onClick }) {
  const location = useLocation()
  const to = PATHS[type]
  if (!to) return null
  return (
    <Link to={to} state={{ background: location }} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
