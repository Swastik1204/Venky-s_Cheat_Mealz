import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from '../components/NavBar'
import CartDrawer from '../components/CartDrawer'
import ItemModal from '../components/ItemModal'
import Dock from '../components/QuickDock'
import AuthModal from '../components/AuthModal'
import InstallPWA from '../components/InstallPWA'
import { useUI } from '../context/UIContext'
// Removed custom hook to avoid invalid hook call caused by duplicate React resolution in some setups.

export default function Layout() {
  const { authMode, toasts, dismissToast, confirmState, resolveConfirm } = useUI()
  // Inline adaptive scale effect
  useEffect(() => {
    const opts = { minWidth: 360, maxWidth: 1800, minRem: 14, maxRem: 19, varName: '--app-scale' }
    function apply() {
      const w = window.innerWidth
      const clamped = Math.min(Math.max(w, opts.minWidth), opts.maxWidth)
      const t = (clamped - opts.minWidth) / (opts.maxWidth - opts.minWidth)
      const size = (opts.minRem + (opts.maxRem - opts.minRem) * t)
      document.documentElement.style.fontSize = size + 'px'
      document.documentElement.style.setProperty(opts.varName, (size / 16).toFixed(4))
    }
    apply()
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    return () => {
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [])

  return (
    <CartDrawer>
      <div className={`app-shell ${authMode ? 'blur-when-auth-open' : ''}`}>
        <NavBar />
        <main className="flex-1 pb-24">
          <Outlet />
        </main>
    <Dock />
        <ItemModal />
      </div>
      {/* Keep modal outside blurred container */}
      <AuthModal />
  <InstallPWA />
      {/* Toast stack */}
      <div className="fixed z-[60] bottom-20 right-4 flex flex-col gap-2 w-72">
        {toasts.map(t => (
          <div key={t.id} className={`alert shadow-sm border border-base-300/60 backdrop-blur bg-base-100/90 p-3 flex items-start gap-2 text-sm ${t.type === 'error' ? 'alert-error' : t.type === 'success' ? 'alert-success' : ''}`}>
            <div className="flex-1 leading-snug">{t.msg}</div>
            <button className="btn btn-ghost btn-xs" onClick={() => dismissToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => resolveConfirm(false)} />
          <div className="relative w-full max-w-sm mx-auto p-5 rounded-2xl bg-base-100/90 border border-base-300/60 shadow-xl flex flex-col gap-4 animate-scale-in">
            <div className="text-base font-semibold">Confirm action</div>
            <div className="text-sm opacity-80 whitespace-pre-wrap">{confirmState.message}</div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={() => resolveConfirm(false)}>Cancel</button>
              <button className="btn btn-sm btn-error" onClick={() => resolveConfirm(true)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </CartDrawer>
  )
}
