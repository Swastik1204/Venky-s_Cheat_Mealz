// App — Admin root component with role-based routing
import { Suspense, lazy } from 'react'

import { Routes, Route, Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import { useUI } from './context/UIContext'
import AdminTopNav from './components/AdminNav'
import AuthModal from './components/AuthModal'
import AuthSkeleton from './components/AuthSkeleton'
import ErrorBoundary from './components/ErrorBoundary'
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

function PageRestricted({ pageName }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl border border-base-300 max-w-md w-full">
        <div className="card-body text-center">
          <div className="text-5xl">🔒</div>
          <h3 className="text-xl font-bold mt-2">Restricted Page</h3>
          <p className="text-sm opacity-70 mt-1">
            You are not authorized to access {pageName}.
          </p>
          <p className="text-xs opacity-60 mt-2">
            Contact an admin if this page should be enabled for your role.
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
    { key: 'analytics', label: 'Analytics', path: '/admin/analytics', element: <Analytics /> },
    { key: 'inventory', label: 'Inventory', path: '/admin/inventory', element: <Inventory /> },
    { key: 'stock', label: 'Stock', path: '/admin/stock', element: <StockManager /> },
    { key: 'orders', label: 'Orders', path: '/admin/orders', element: <Orders /> },
    { key: 'appearance', label: 'Appearance', path: '/admin/appearance', element: <Appearance /> },
    { key: 'settings', label: 'Settings', path: '/admin/settings', element: <Settings /> },
    { key: 'logs', label: 'Logs', path: '/admin/logs', element: <AuditLogs /> },
    { key: 'biller', label: 'Biller', path: '/admin/biller', element: <AdminBiller /> },
    { key: 'delivery', label: 'Delivery', path: '/admin/delivery', element: <Delivery /> },
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
      <ErrorBoundary>
        <div className="admin-shell">
          <AdminTopNav />
          <main className={`page-wrap pb-16 pt-6 transition-all duration-200 ${authMode ? 'blur-when-auth-open' : ''}`}>
            <Suspense fallback={<div className="py-20 text-center text-sm opacity-70">Loading module…</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/admin" replace />} />

                <Route path="/admin" element={<Navigate to={firstAllowedPath} replace />} />
                {pageDefs.map((p) => (
                  <Route
                    key={p.key}
                    path={p.path}
                    element={canAccess(p.key) ? p.element : <PageRestricted pageName={p.label} />}
                  />
                ))}

                <Route path="*" element={<Navigate to={firstAllowedPath} replace />} />
              </Routes>
            </Suspense>
          </main>
          <AuthModal />
        </div>
      </ErrorBoundary>
    </>
  )
}
