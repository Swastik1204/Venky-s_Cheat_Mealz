// App — Root component with routing and layout
import { Suspense, lazy } from 'react'

import { Routes, Route, useLocation } from 'react-router-dom'

import Layout from './layouts/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import FcmNotifications from './components/FcmNotifications'
import LegalModal from './components/legal/LegalModal'
import { TermsContent, PrivacyContent, RefundContent, ShippingContent } from './components/legal/LegalContent'

// Lazy load all pages for faster initial load
const Home = lazy(() => import('./pages/Home'))
const Checkout = lazy(() => import('./pages/Checkout'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Profile = lazy(() => import('./pages/Profile'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Shipping = lazy(() => import('./pages/Shipping'))
const CancellationRefunds = lazy(() => import('./pages/CancellationRefunds'))
const ActiveOrders = lazy(() => import('./pages/ActiveOrders'))

// Minimal loading skeleton
function PageLoader() {
  return (
    <div className="page-wrap py-10 flex justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  )
}

function App() {
  // Modal-route pattern: a <LegalLink> (footer/profile) navigates with
  // `state.background` set to the page you were already on. The primary
  // <Routes> below renders against that background location instead of the
  // real one, so the page underneath keeps rendering; a second <Routes> then
  // matches the real location and renders the same page component inside
  // LegalModal on top. Landing on /terms etc. directly (no background
  // state) skips all of this and just renders the full standalone page.
  const location = useLocation()
  const backgroundLocation = location.state && location.state.background

  return (
    <ErrorBoundary>
      <FcmNotifications />
      <Suspense fallback={<PageLoader />}>
        <Routes location={backgroundLocation || location}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
            <Route path="/active-orders" element={<ActiveOrders />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      {backgroundLocation && (
        <Suspense fallback={null}>
          <Routes>
            <Route path="/terms" element={<LegalModal title="Terms & Conditions"><TermsContent /></LegalModal>} />
            <Route path="/privacy" element={<LegalModal title="Privacy Policy"><PrivacyContent /></LegalModal>} />
            <Route path="/cancellation-refunds" element={<LegalModal title="Cancellation & Refund Policy"><RefundContent /></LegalModal>} />
            <Route path="/shipping" element={<LegalModal title="Shipping & Delivery Policy"><ShippingContent /></LegalModal>} />
          </Routes>
        </Suspense>
      )}
    </ErrorBoundary>
  )
}

export default App
