import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import Home from './pages/Home'
import Checkout from './pages/Checkout'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Admin from './pages/Admin'
import AdminInventory from './pages/AdminInventory'
import AdminOrders from './pages/AdminOrders'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminAppearance from './pages/AdminAppearance'
import Profile from './pages/Profile'
import SearchPage from './pages/SearchPage'
import AdminBiller from './pages/AdminBiller'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin section="inventory" />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
  <Route path="/admin/appearance" element={<AdminAppearance />} />
  <Route path="/admin/settings" element={<Admin section="settings" />} />
        <Route path="/admin/biller" element={<AdminBiller />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
