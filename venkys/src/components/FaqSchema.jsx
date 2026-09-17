import { useEffect } from 'react'

// FAQPage schema. Every answer below is a faithful restatement of text that is
// ALREADY PUBLISHED on this site's own pages — the questions are the ones
// those policies exist to answer, not invented "commonly asked" filler, and no
// fact appears here that a customer could not already read on the site.
//
// Sources, per entry:
//   1, 2, 3, 4 -> ShippingContent (LegalContent.jsx) = /shipping
//   5, 6, 7    -> RefundContent   (LegalContent.jsx) = /cancellation-refunds
//   8          -> PAYMENT_METHODS in pages/Checkout.jsx (the live options)
//
// Opening hours are deliberately NOT an FAQ entry: they come from the live
// Google Business Profile sync (see BusinessSchema.jsx) and would go stale if
// restated as static text here.
//
// Editing a policy page without updating the matching answer makes the
// structured data disagree with the visible page, which Google's
// structured-data guidelines forbid. Keep the two in step.
const FAQ = [
  {
    q: "Where does Venky's Chicken Xperience deliver?",
    a: 'We deliver within our serviceable area in and around Durgapur, West Bengal. Your delivery address is checked against this area at checkout — if you are outside it, the app tells you before you place the order.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery times shown at checkout are estimates and may vary due to traffic, weather, or order volume. They are not guarantees.',
  },
  {
    q: 'Is there a delivery fee?',
    a: 'Any delivery fee applicable to your order is shown at checkout before you pay, and depends on your order value and distance.',
  },
  {
    q: 'What happens if nobody is available to receive the order?',
    a: 'Someone must be available at the delivery address to receive the order, and to pay for it on Cash on Delivery orders. If delivery fails because nobody is reachable or the address is incorrect, we may reschedule or cancel the order.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Orders can be cancelled only before preparation begins. Once preparation has started, the order cannot be cancelled.',
  },
  {
    q: 'What if my order arrives damaged, incomplete, or not as ordered?',
    a: 'Report it to swastiksaha1204@gmail.com or +91 89185 86567 within 3 calendar days of receiving the order, with clear photographic or video evidence. We verify the issue with you directly before approving any replacement or refund — nothing is issued automatically. Reports made after 3 days are not eligible.',
  },
  {
    q: 'How long do refunds take?',
    a: 'Approved refunds are issued to the original payment method within 3 to 4 business days of approval. Approved refunds for Cash on Delivery orders are processed by bank transfer.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Cash on Delivery, UPI through Razorpay (PhonePe, Google Pay, BHIM and similar), or debit and credit cards through Razorpay.',
  },
]

/**
 * Injects FAQPage JSON-LD as its own <script>, separate from the
 * FastFoodRestaurant @graph in index.html, so the two can be edited
 * independently (BusinessSchema.jsx patches that one from live data).
 *
 * Mounted once at the app root: the FAQ covers store-wide delivery, refund and
 * payment policy, which applies on every page.
 */
export default function FaqSchema() {
  useEffect(() => {
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.dataset.faqSchema = 'true'
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    })
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  return null
}
