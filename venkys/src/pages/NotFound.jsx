// NotFound — 404 error page
import { Link } from 'react-router-dom'
import { MdHome, MdRestaurantMenu } from 'react-icons/md'
import Seo from '../components/Seo'

/**
 * Animated 404 — an empty plate with a wandering steam wisp, standing in for
 * "the dish you ordered isn't on the menu". Pure CSS/SVG animation, no new
 * dependencies, matches the warm amber restaurant branding used elsewhere.
 */
export default function NotFound() {
  return (
    <div className="page-wrap min-h-[70vh] flex flex-col items-center justify-center py-16 text-center px-4">
      <Seo
        title="Page Not Found | Venky's Chicken Xperience Durgapur"
        description="The page you're looking for doesn't exist. Browse the menu or head back home."
        path="/404"
      />

      <svg viewBox="0 0 200 200" className="w-40 h-40 mb-6 notfound-plate" aria-hidden="true">
        <circle cx="100" cy="120" r="58" fill="var(--color-base-200, #f3f4f6)" stroke="var(--color-primary)" strokeWidth="4" />
        <circle cx="100" cy="120" r="38" fill="none" stroke="var(--color-primary)" strokeWidth="2" opacity="0.4" />
        <text x="100" y="130" textAnchor="middle" fontSize="34" fontWeight="900" fill="var(--color-primary)">404</text>
        <path className="notfound-steam notfound-steam-1" d="M78 70 Q74 58 80 48" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path className="notfound-steam notfound-steam-2" d="M100 66 Q96 52 102 40" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path className="notfound-steam notfound-steam-3" d="M122 70 Q118 58 124 48" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>

      <h1 className="text-2xl sm:text-3xl font-bold mb-3">Not on today's menu</h1>
      <p className="text-base-content/70 mb-8 max-w-md">
        The page you're looking for doesn't exist. Maybe it got eaten before
        you got here — let's get you back to something delicious.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary gap-2">
          <MdHome className="w-5 h-5" /> Go Home
        </Link>
        <Link to="/#menu" className="btn btn-outline gap-2">
          <MdRestaurantMenu className="w-5 h-5" /> Browse Menu
        </Link>
      </div>

      <style>{`
        .notfound-steam { animation: notfound-rise 2.4s ease-in-out infinite; transform-origin: bottom center; }
        .notfound-steam-2 { animation-delay: 0.3s; }
        .notfound-steam-3 { animation-delay: 0.6s; }
        @keyframes notfound-rise {
          0% { opacity: 0; transform: translateY(4px) scale(0.9); }
          40% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-10px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .notfound-steam { animation: none; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
