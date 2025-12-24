import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminTopNav from './components/AdminNav'
import AuthModal from './components/AuthModal'
import { useUI } from './context/UIContext'
import { useAuth } from './context/AuthContext'
import AuthSkeleton from './components/AuthSkeleton'
import InstallPWA from './components/InstallPWA'

const Inventory = lazy(() => import('./pages/Inventory'))
const StockManager = lazy(() => import('./pages/StockManager'))
const Orders = lazy(() => import('./pages/Orders'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Appearance = lazy(() => import('./pages/Appearance'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminBiller = lazy(() => import('./pages/AdminBiller'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const Delivery = lazy(() => import('./pages/Delivery'))

// Access denied component for guests/unregistered users
function AccessDenied() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 shadow-xl max-w-md mx-4">
        <div className="card-body text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="card-title justify-center text-2xl">Access Denied</h2>
          <p className="opacity-70 mt-2">
            You don't have permission to access the admin panel.
          </p>
          {user?.email && (
            <p className="text-sm opacity-60 mt-1">
              Signed in as: {user.email}
            </p>
          )}
          <p className="text-sm opacity-60 mt-4">
            Contact an administrator to get access.
          </p>
          <div className="card-actions justify-center mt-6">
            <button className="btn btn-primary" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { authMode } = useUI()
  const { user, loading, roleLoading, isStaffMember, isAdmin, role } = useAuth()

  // Show skeleton while loading auth or role
  if (loading || roleLoading) {
    return (
      <>
        <InstallPWA />
        <AuthSkeleton />
        <AuthModal />
      </>
    )
  }

  // No user = show login
  if (!user) {
    return (
      <>
        <InstallPWA />
        <AuthSkeleton />
        <AuthModal />
      </>
    )
  }

  // User logged in but no staff role = access denied
  if (!isStaffMember) {
    return (
      <>
        <InstallPWA />
        <AccessDenied />
      </>
    )
  }

  // Staff member (admin or staff) - show app with appropriate routes
  // Admin: Full access to all pages
  // Staff: Access to Orders, Biller (POS) only
  // Delivery: Access to Delivery page only

  const isDelivery = role?.role === 'delivery'

  return (
    <>
      <InstallPWA />
      <div className="admin-shell">
        <AdminTopNav />
        <main className={`page-wrap pb-16 pt-6 transition-all duration-200 ${authMode ? 'blur-when-auth-open' : ''}`}>
          <Suspense fallback={<div className="py-20 text-center text-sm opacity-70">Loading module…</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              
              {isAdmin ? (
                <>
                  {/* Admin routes - full access */}
                  <Route path="/admin" element={<Navigate to="/admin/analytics" replace />} />
                  <Route path="/admin/inventory" element={<Inventory />} />
                  <Route path="/admin/stock" element={<StockManager />} />
                  <Route path="/admin/orders" element={<Orders />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="/admin/appearance" element={<Appearance />} />
                  <Route path="/admin/settings" element={<Settings />} />
                  <Route path="/admin/logs" element={<AuditLogs />} />
                  <Route path="/admin/biller" element={<AdminBiller />} />
                  <Route path="/admin/delivery" element={<Delivery />} />
                  <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
                </>
              ) : isDelivery ? (
                <>
                  {/* Delivery routes */}
                  <Route path="/admin" element={<Navigate to="/admin/delivery" replace />} />
                  <Route path="/admin/delivery" element={<Delivery />} />
                  <Route path="*" element={<Navigate to="/admin/delivery" replace />} />
                </>
              ) : (
                <>
                  {/* Staff routes - expanded access */}
                  <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
                  <Route path="/admin/orders" element={<Orders />} />
                  <Route path="/admin/biller" element={<AdminBiller />} />
                  <Route path="/admin/inventory" element={<Inventory />} />
                  <Route path="/admin/stock" element={<StockManager />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="*" element={<Navigate to="/admin/orders" replace />} />
                </>
              )}
            </Routes>
          </Suspense>
        </main>
        <AuthModal />
      </div>
    </>
  )
}
