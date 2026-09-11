/**
 * Legal content for Venky's Chicken Xperience Durgapur — shared between the
 * standalone /terms, /privacy, /shipping, /cancellation-refunds pages and
 * the in-app modal versions of the same pages (see LegalModal.jsx /
 * LegalLink.jsx). Drafted 2026-09-11, replacing the previous thin stubs.
 *
 * <Fill> renders an open question verbatim, highlighted — it must NOT be
 * silently filled with a guess. Each one is a real business fact only the
 * operator can supply (registration number, jurisdiction, grievance officer,
 * refund timelines).
 */
export const UPDATED = '[date]'

export function Fill({ children }) {
  return (
    <mark className="bg-warning/25 text-warning-content px-1 rounded font-semibold not-italic">
      [{children}]
    </mark>
  )
}

export function Section({ n, title, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-black tracking-tight mb-2">{n}. {title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-base-content/80">{children}</div>
    </section>
  )
}

export function LegalHeader({ title }) {
  return (
    <>
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      <p className="text-xs text-base-content/50 mt-1 mb-4">Last updated: {UPDATED}</p>
    </>
  )
}

export function TermsContent() {
  return (
    <div className="max-w-2xl">
      <LegalHeader title="Terms & Conditions" />

      <div className="p-3 mb-6 border border-warning/40 text-xs text-base-content/70 rounded-xl bg-base-200/50">
        These Terms govern your use of this website and any purchase made
        through it, operated by:
        <div className="mt-2 font-semibold text-base-content/90 not-italic">
          FAMILY SHOPPING WORLD<br />
          GSTIN: 19BKBPS1335J1Z0<br />
          Address: MNAV-36, Bengal Ambuja, City Center, Durgapur, West Bengal 713216, India<br />
          Contact: swastiksaha1204@gmail.com | +91 89185 86567
        </div>
      </div>

      <p className="text-sm text-base-content/80 mb-6">
        By accessing or using this site, placing an order, or creating an
        account, you agree to these Terms. If you do not agree, please do not
        use this site.
      </p>

      <Section n="1" title="Franchise disclosure">
        <p>
          This outlet is operated under a franchise arrangement with the
          Venky's Chicken Xperience brand. Your order contract is with the
          local franchisee operating this outlet (details above), not with
          the brand owner directly.
        </p>
      </Section>

      <Section n="2" title="Eligibility">
        <p>
          You must be at least 18 years old to place an order on this site.
          By signing in with your Google account, you confirm the
          information provided by that account is accurate.
        </p>
      </Section>

      <Section n="3" title="Account & sign-in">
        <p>
          We use Google Sign-In for authentication. You are responsible for
          maintaining the security of the Google account you use to sign in.
          We do not have access to your Google account password.
        </p>
      </Section>

      <Section n="4" title="Menu, pricing & availability">
        <p>
          Menu items, prices, and availability may change without notice and
          may vary by time of day or ingredient availability. Images are for
          illustration; actual presentation may vary.
        </p>
        <p>
          We reserve the right to limit quantities, refuse or cancel any
          order, at our discretion, including in cases of suspected fraud,
          pricing error, or unavailability of stock/ingredients.
        </p>
      </Section>

      <Section n="5" title="Orders & payment">
        <p>
          Orders are confirmed only once payment is completed (for prepaid
          orders) or the order is placed (for Cash on Delivery, where
          available). Online payments are processed by Razorpay; we do not
          store your card, UPI, or bank details on our servers. Prices are
          inclusive of applicable taxes unless stated otherwise.
        </p>
      </Section>

      <Section n="6" title="Delivery">
        <p>
          Delivery times shown at checkout are estimates and may vary due to
          traffic, weather, or order volume.
        </p>
      </Section>

      <Section n="7" title="Cancellations, returns & refunds">
        <p>See our separate Cancellation &amp; Refund Policy, which forms part of these Terms.</p>
      </Section>

      <Section n="8" title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>use the site for any unlawful purpose;</li>
          <li>attempt to access, probe, or interfere with the site's systems, accounts, or data beyond your own;</li>
          <li>upload or submit content that infringes another's intellectual property, is obscene, defamatory, or unlawful;</li>
          <li>misuse the ordering system (e.g., placing fraudulent orders, chargebacks without cause).</li>
        </ul>
      </Section>

      <Section n="9" title="Intellectual property">
        <p>
          All site content (branding, design, text, images) is owned by us or
          our licensors and may not be reproduced without permission.
        </p>
      </Section>

      <Section n="10" title="Liability">
        <p>
          To the maximum extent permitted by law, we are not liable for
          indirect, incidental, or consequential losses arising from your use
          of the site or a product purchased through it. Our total liability
          for any claim is limited to the amount you paid for the relevant
          order. Nothing in these Terms limits liability that cannot be
          limited under Indian law (e.g., liability for our own fraud or
          gross negligence).
        </p>
      </Section>

      <Section n="11" title="Changes to these Terms">
        <p>
          We may update these Terms from time to time. Continued use of the
          site after a change constitutes acceptance of the updated Terms.
        </p>
      </Section>

      <Section n="12" title="Governing law & jurisdiction">
        <p>
          These Terms are governed by the laws of India. Subject to the
          Consumer Protection Act, 2019 (which allows you to file a complaint
          in the jurisdiction where you reside or the cause of action arose),
          any dispute not covered by that Act shall be subject to the
          exclusive jurisdiction of the courts at Paschim Burdwan district,
          West Bengal.
        </p>
      </Section>

      <Section n="13" title="Contact & grievance officer">
        <p>
          For any question about these Terms, or to raise a grievance under
          the Consumer Protection (E-Commerce) Rules, 2020, contact{' '}
          <Fill>Grievance Officer name &amp; designation — required by law, please supply</Fill>{' '}
          at swastiksaha1204@gmail.com / +91 89185 86567. We aim to
          acknowledge grievances within 48 hours and resolve them within 1
          month of receipt.
        </p>
      </Section>
    </div>
  )
}

export function RefundContent() {
  return (
    <div className="max-w-2xl">
      <LegalHeader title="Cancellation & Refund Policy" />

      <Section n="1" title="General policy">
        <p>
          All sales are final. We do not offer refunds or exchanges for
          change of mind, incorrect selection made by the customer (e.g.,
          wrong item or spice level chosen at checkout), or delay caused by
          factors outside our control (courier delay, incorrect address
          supplied, etc.).
        </p>
      </Section>

      <Section n="2" title="Damaged or defective items">
        <p>
          If your order arrives damaged, incomplete, or not as ordered, you
          may be eligible for a resolution (replacement or refund, at our
          discretion) under the following conditions:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>You must report the issue to us at swastiksaha1204@gmail.com or +91 89185 86567 within 3 (three) calendar days of the date you receive the product. Reports made after this window will not be eligible.</li>
          <li>You must provide clear photographic/video evidence of the issue at the time of reporting.</li>
          <li>The reported issue must be verified by us through direct communication with you before any refund or replacement is approved. No refund is issued automatically or without this verification.</li>
          <li>Once verified, we will confirm the resolution (replacement or refund) and the expected timeline in writing (email/message).</li>
        </ol>
      </Section>

      <Section n="3" title="Order cancellation">
        <p>
          Orders can be cancelled only before preparation begins. Once
          preparation has started, the order cannot be cancelled.
        </p>
      </Section>

      <Section n="4" title="Refund method & timeline">
        <p>
          Approved refunds are issued to the original payment method within
          3–4 business days of approval. Refunds for Cash on Delivery
          orders, where approved, will be processed via bank transfer or
          UPI.
        </p>
      </Section>

      <p className="text-xs text-base-content/50 mt-8">
        This policy is designed to be fair to genuine cases of damage or
        defect while protecting against misuse. It does not affect any
        statutory right you may have under the Consumer Protection Act, 2019,
        that cannot be excluded by this policy.
      </p>
    </div>
  )
}

export function PrivacyContent() {
  return (
    <div className="max-w-2xl">
      <LegalHeader title="Privacy Policy" />

      <p className="text-sm text-base-content/80 mb-6">
        FAMILY SHOPPING WORLD ("we", "us") operates this website. This policy
        explains what personal data we collect, why, and how it's handled.
      </p>

      <Section n="1" title="Information we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>Account information: name, email address, and profile photo from your Google Sign-In (we do not receive or store your Google password).</li>
          <li>Order information: delivery address, phone number, order contents, and order history.</li>
          <li>Payment information: payments are processed directly by Razorpay. We do not receive or store your full card number, UPI ID, or bank details — we receive only confirmation of payment success/failure and a transaction reference.</li>
          <li>Notifications: if you enable them, we use Firebase Cloud Messaging to send order-status notifications to your device.</li>
          <li>
            Analytics: we use Google Analytics to understand site usage,
            which sets cookies as described below —{' '}
            <Fill>pending confirmation of which Analytics properties stay connected; see cookies section</Fill>.
          </li>
        </ul>
      </Section>

      <Section n="2" title="How we use your information">
        <p>
          To process and fulfil your orders; to communicate with you about
          your order (including the issue-verification process under our
          Cancellation &amp; Refund Policy); to send order-status
          notifications if enabled; to understand site traffic via analytics;
          and to improve the site.
        </p>
      </Section>

      <Section n="3" title="Third parties we share data with">
        <ul className="list-disc pl-5 space-y-1">
          <li>Google Firebase (authentication, database hosting, and push notifications)</li>
          <li>Razorpay (payment processing)</li>
          <li>Google Analytics (site usage analytics)</li>
        </ul>
        <p>We do not sell your personal information to any third party.</p>
      </Section>

      <Section n="4" title="Cookies">
        <p>
          This site uses Google Analytics, which sets cookies to help us
          understand site traffic.{' '}
          <Fill>If a second linked Google Analytics property (G-ZW9DXXVZE1) is kept: data is also shared with that second linked property under the same Google account — pending a decision on whether to keep it connected</Fill>.
          You can opt out of Google Analytics tracking using your browser's
          Do Not Track setting or a Google Analytics opt-out extension.
        </p>
      </Section>

      <Section n="5" title="Data retention">
        <p>
          We retain your order history and account information for as long
          as your account is active, and as required to comply with tax and
          accounting obligations under Indian law. You may request deletion
          of your account and associated personal data at any time (see
          below).
        </p>
      </Section>

      <Section n="6" title="Your rights / account deletion">
        <p>
          To request a copy of your data, or deletion of your account and
          data, email swastiksaha1204@gmail.com from the email address
          associated with your account. We will action deletion requests
          within <Fill>X days — please confirm</Fill>, except for records we
          are legally required to retain (e.g., transaction records for tax
          purposes).
        </p>
      </Section>

      <Section n="7" title="Children's privacy">
        <p>This site is not directed at children under 18. We do not knowingly collect personal data from children.</p>
      </Section>

      <Section n="8" title="Changes to this policy">
        <p>We may update this policy from time to time; the "Last updated" date above will reflect the most recent revision.</p>
      </Section>

      <Section n="9" title="Contact">
        <p>
          Questions about this policy: swastiksaha1204@gmail.com / +91 89185
          86567. Address: MNAV-36, Bengal Ambuja, City Center, Durgapur,
          West Bengal 713216, India.
        </p>
      </Section>
    </div>
  )
}

export function ShippingContent() {
  return (
    <div className="max-w-2xl">
      <LegalHeader title="Shipping & Delivery Policy" />

      <Section n="1" title="Delivery area">
        <p>
          We deliver within our serviceable area in and around Durgapur, West
          Bengal. Your delivery address is checked against this area at
          checkout — if you're outside it, the app will let you know before
          you place an order.
        </p>
      </Section>

      <Section n="2" title="Delivery time">
        <p>
          Delivery times shown at checkout are estimates and may vary due to
          traffic, weather, or order volume. They are not guarantees.
        </p>
      </Section>

      <Section n="3" title="Delivery charges">
        <p>
          Any delivery fee applicable to your order is shown at checkout
          before you pay, and depends on your order value and distance from
          the store.
        </p>
      </Section>

      <Section n="4" title="Receiving your order">
        <p>
          Someone must be available at the delivery address to receive the
          order (and pay, for Cash on Delivery orders). If delivery fails
          because nobody is reachable or the address is incorrect, we may
          reschedule or cancel the order.
        </p>
      </Section>

      <Section n="5" title="Delays or issues">
        <p>
          If your order is delayed, contact us at swastiksaha1204@gmail.com
          or +91 89185 86567 with your order number.
        </p>
      </Section>
    </div>
  )
}
