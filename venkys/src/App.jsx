// App — Root component with routing and layout
import { Suspense, lazy } from 'react'

import { Routes, Route } from 'react-router-dom'

import Layout from './layouts/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import FcmNotifications from './components/FcmNotifications'

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
  return (
    <ErrorBoundary>
      <FcmNotifications />
      <Suspense fallback={<PageLoader />}>
        <Routes>
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
    </ErrorBoundary>
  )
}

export default App
