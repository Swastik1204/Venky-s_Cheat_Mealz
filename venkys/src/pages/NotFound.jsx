// NotFound — 404 error page
import { Link } from 'react-router-dom'
import { MdHome, MdRestaurantMenu, MdSentimentDissatisfied } from 'react-icons/md'

export default function NotFound() {
  return (
    <div className="page-wrap min-h-[70vh] flex flex-col items-center justify-center py-16 text-center px-4">
      {/* Animated 404 */}
      <div className="relative mb-8">
        <div className="text-[150px] sm:text-[200px] font-black text-base-200 leading-none select-none">404</div>
        <MdSentimentDissatisfied className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 text-primary opacity-80" />
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">Oops! Page not found</h1>
      <p className="text-base-content/70 mb-8 max-w-md">
        The page you're looking for seems to have wandered off. Maybe it's out getting some delicious food!
      </p>
      
      {/* Action buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <Link to="/" className="btn btn-primary gap-2">
          <MdHome className="w-5 h-5" /> Go Home
        </Link>
        <Link to="/#menu" className="btn btn-outline gap-2">
          <MdRestaurantMenu className="w-5 h-5" /> Browse Menu
        </Link>
      </div>
      
      {/* Suggestions */}
      <div className="bg-base-200/50 rounded-2xl p-6 max-w-md w-full">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-60">Popular Destinations</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/" className="btn btn-ghost btn-sm justify-start">🏠 Home</Link>
          <Link to="/profile" className="btn btn-ghost btn-sm justify-start">👤 My Profile</Link>
          <Link to="/about" className="btn btn-ghost btn-sm justify-start">ℹ️ About Us</Link>
          <Link to="/contact" className="btn btn-ghost btn-sm justify-start">📞 Contact</Link>
        </div>
      </div>
    </div>
  )
}
