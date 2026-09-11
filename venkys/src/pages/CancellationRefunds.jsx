// CancellationRefunds — Cancellation and refund policy page
import Seo from '../components/Seo'
import { RefundContent } from '../components/legal/LegalContent'

export default function CancellationRefunds() {
  return (
    <div className="page-wrap py-10">
      <Seo
        title="Cancellation & Refunds | Venky's Chicken Xperience Durgapur"
        description="Our cancellation window and refund processing time for orders placed on Venky's Chicken Xperience Durgapur."
        path="/cancellation-refunds"
      />
      <div className="max-w-3xl mx-auto">
        <RefundContent />
      </div>
    </div>
  )
}
