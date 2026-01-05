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
  const { user } = useAuth()
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
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { authMode } = useUI()
  const { user, loading, roleLoading, isStaffMember, canAccess, role } = useAuth()

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

  const pageDefs = [
    { key: 'analytics', path: '/admin/analytics', element: <Analytics /> },
    { key: 'inventory', path: '/admin/inventory', element: <Inventory /> },
    { key: 'stock', path: '/admin/stock', element: <StockManager /> },
    { key: 'orders', path: '/admin/orders', element: <Orders /> },
    { key: 'appearance', path: '/admin/appearance', element: <Appearance /> },
    { key: 'settings', path: '/admin/settings', element: <Settings /> },
    { key: 'logs', path: '/admin/logs', element: <AuditLogs /> },
    { key: 'biller', path: '/admin/biller', element: <AdminBiller /> },
    { key: 'delivery', path: '/admin/delivery', element: <Delivery /> },
  ]

  const allowedPages = pageDefs.filter((p) => canAccess(p.key))
  
  // Use user's defaultPage if set and allowed, otherwise first allowed page
  const defaultPageKey = role?.defaultPage
  const defaultPageDef = defaultPageKey ? allowedPages.find(p => p.key === defaultPageKey) : null
  const firstAllowedPath = defaultPageDef?.path || allowedPages[0]?.path || '/admin'

  // If a staff role exists but has no allowed pages, treat as denied.
  if (isStaffMember && allowedPages.length === 0) {
    return (
      <>
        <InstallPWA />
        <AccessDenied />
      </>
    )
  }

  return (
    <>
      <InstallPWA />
      <div className="admin-shell">
        <AdminTopNav />
        <main className={`page-wrap pb-16 pt-6 transition-all duration-200 ${authMode ? 'blur-when-auth-open' : ''}`}>
          <Suspense fallback={<div className="py-20 text-center text-sm opacity-70">Loading module…</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/admin" replace />} />

              <Route path="/admin" element={<Navigate to={firstAllowedPath} replace />} />
              {allowedPages.map((p) => (
                <Route key={p.key} path={p.path} element={p.element} />
              ))}

              <Route path="*" element={<Navigate to={firstAllowedPath} replace />} />
            </Routes>
          </Suspense>
        </main>
        <AuthModal />
      </div>
    </>
  )
}
