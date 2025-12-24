import { useEffect } from 'react'
import { useUI } from '../context/UIContext'

export default function AuthSkeleton() {
  const { openAuth } = useUI()

  useEffect(() => {
    document.body.classList.add('auth-loading')
    return () => { document.body.classList.remove('auth-loading') }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200/50 text-base-content p-4">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-base-100 shadow-lg animate-pulse">
        <div className="h-8 w-2/3 bg-base-300 rounded mb-6"></div>
        <div className="h-6 w-full bg-base-300 rounded mb-4"></div>
        <div className="h-6 w-5/6 bg-base-300 rounded mb-4"></div>
        <div className="h-6 w-4/6 bg-base-300 rounded mb-4"></div>
        <div className="h-10 w-full bg-base-300 rounded mt-8"></div>
      </div>

      <div className="mt-8 text-base-content/60 text-center">
        <button
          type="button"
          className="inline-block bg-warning/20 text-warning px-3 py-2 rounded-lg font-semibold btn btn-warning btn-wide"
          onClick={() => openAuth('login')}
        >
          Authentication required
        </button>
        <div className="mt-2">Please log in to access the admin dashboard.</div>
      </div>
    </div>
  )
}
