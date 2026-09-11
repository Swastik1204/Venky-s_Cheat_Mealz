// Shipping — Delivery and shipping policy page
import Seo from '../components/Seo'
import { ShippingContent } from '../components/legal/LegalContent'

export default function Shipping() {
  return (
    <div className="page-wrap py-10">
      <Seo
        title="Shipping & Delivery | Venky's Chicken Xperience Durgapur"
        description="Delivery areas, hours, and what to expect when your order is on its way."
        path="/shipping"
      />
      <div className="max-w-3xl mx-auto">
        <ShippingContent />
      </div>
    </div>
  )
}
