// Shipping — Delivery and shipping policy page
import Seo from '../components/Seo'

export default function Shipping() {
  return (
    <div className="page-wrap py-10">
      <Seo
        title="Shipping & Delivery | Venky's Chicken Xperience Durgapur"
        description="Delivery areas, hours, and what to expect when your order is on its way."
        path="/shipping"
      />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Shipping & Delivery</h1>
        <div className="prose max-w-none">
          <p className="opacity-90">We deliver within our serviceable locations during operating hours. ETAs are shown at checkout.</p>
          <p className="opacity-80">If there is any delay, we will notify you via the app or SMS.</p>
        </div>
      </div>
    </div>
  )
}
