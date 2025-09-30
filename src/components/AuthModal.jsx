import { useEffect, useState } from 'react'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { auth } from '../lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { FcGoogle } from 'react-icons/fc'

export default function AuthModal() {
  const { authMode, closeAuth, openAuth } = useUI()
  const { login, signup, loginWithGoogle } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // validation: enable signup only when name/email/password present and email is valid

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    setError('')
    setInfo('')
  }, [authMode])

  if (!authMode) return null

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (authMode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, name)
      }
      closeAuth()
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog open className="modal">
      <div className="modal-box max-w-sm sm:max-w-md rounded-2xl shadow-2xl text-center py-8 px-8 min-h-[36rem]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-3xl w-full text-left">{authMode === 'login' ? 'Login' : 'Signup'}</h3>
          <form method="dialog">
            <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={closeAuth}>✕</button>
          </form>
        </div>

        <div className="space-y-6">
          {error && <div className="alert alert-error text-sm">{error}</div>}
          {info && <div className="alert alert-success text-sm">{info}</div>}

          {authMode !== 'login' && (
            <form onSubmit={onSubmit} className="space-y-5 text-left">
              {/* compute validity in render */}
              {(() => {
                return null
              })()}
              <label className="form-control">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="input input-bordered input-lg rounded-xl w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="form-control">
                <input
                  type="email"
                  placeholder="Email"
                  className={`input input-bordered input-lg rounded-xl w-full ${email && !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'input-error' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {email && !/^\S+@\S+\.\S+$/.test(email.trim()) && (
                  <div className="text-error text-xs mt-1">Enter a valid email</div>
                )}
              </label>
              <label className="form-control">
                <input
                  type="password"
                  placeholder="Password"
                  className="input input-bordered input-lg rounded-xl w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button
                className="btn btn-primary btn-lg w-full"
                disabled={
                  loading ||
                  !(name.trim() && email.trim() && password.trim() && /^\S+@\S+\.\S+$/.test(email.trim()))
                }
              >
                {loading ? 'Please wait…' : 'Create account'}
              </button>
            </form>
          )}

          {authMode === 'login' && (
            <form onSubmit={onSubmit} className="space-y-5 text-left">
              <label className="form-control">
                <input
                  type="email"
                  placeholder="Email"
                  className="input input-bordered input-lg rounded-xl w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="form-control">
                <input
                  type="password"
                  placeholder="Password"
                  className="input input-bordered input-lg rounded-xl w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <div className="text-right -mt-2">
                <button
                  type="button"
                  className="link text-sm"
                  onClick={async () => {
                    try {
                      setError('')
                      setInfo('')
                      if (!email) { setError('Enter your email to reset password'); return }
                      setLoading(true)
                      await sendPasswordResetEmail(auth, email)
                      setInfo('Password reset email sent. Check your inbox.')
                    } catch (e) {
                      setError(e.message || 'Failed to send reset email')
                    } finally {
                      setLoading(false)
                    }
                  }}
                >Forgot password?</button>
              </div>
              <button className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? 'Please wait…' : 'Login'}
              </button>
            </form>
          )}

          <div className="divider my-2">or</div>

          <button
            className="btn btn-outline btn-lg w-full justify-center"
            onClick={async () => {
              try { setLoading(true); await loginWithGoogle(); closeAuth(); }
              catch (e) { setError(e.message || 'Google sign-in failed') }
              finally { setLoading(false) }
            }}
          >
            <span className="inline-flex items-center gap-2"><FcGoogle /> Sign in with Google</span>
          </button>

          <div className="pt-2 border-t text-sm text-left">
            {authMode === 'login' ? (
              <span>New to Venky’s? <button className="link" onClick={() => openAuth('signup')}>Create account</button></span>
            ) : (
              <span>Already have an account? <button className="link" onClick={() => openAuth('login')}>Login</button></span>
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop backdrop-blur-[2px] bg-black/20">
        <button onClick={closeAuth}>close</button>
      </form>
    </dialog>
  )
}
