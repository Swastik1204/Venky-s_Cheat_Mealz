// Footer — subtle site footer with legal links, shown on every page via Layout
import LegalLink from './legal/LegalLink'
import { RESTAURANT_CONFIG } from '../config/restaurant.config'

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-base-300/60 py-6 text-center">
      <p className="text-xs text-base-content/40">
        © {new Date().getFullYear()} {RESTAURANT_CONFIG.brand.shortName} — {RESTAURANT_CONFIG.brand.receiptSubtitle}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-base-content/40">
        <LegalLink type="terms" className="hover:text-base-content/70 transition-colors">Terms</LegalLink>
        <LegalLink type="privacy" className="hover:text-base-content/70 transition-colors">Privacy</LegalLink>
        <LegalLink type="shipping" className="hover:text-base-content/70 transition-colors">Shipping</LegalLink>
        <LegalLink type="refund" className="hover:text-base-content/70 transition-colors">Cancellation &amp; Refunds</LegalLink>
      </div>
    </footer>
  )
}
