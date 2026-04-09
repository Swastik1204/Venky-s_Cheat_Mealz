import { useEffect, useMemo, useState } from 'react'

import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { activateAdminUser, getAdminUser } from '../lib/data-adminUsers'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isInviteValid(adminUserDoc, token) {
  if (!adminUserDoc) return false
  if (adminUserDoc.inviteTokenUsed) return false
  if (String(adminUserDoc.inviteToken || '').trim() !== String(token || '').trim()) return false
  const expiry = Number(adminUserDoc.inviteTokenExpiry || 0)
  if (!Number.isFinite(expiry)) return false
  return Date.now() <= expiry
}

export default function InviteAccept() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pushToast } = useUI()
  const { user, loginWithGoogle, refreshRole } = useAuth()

  const uid = String(params.get('uid') || '').trim()
  const token = String(params.get('token') || '').trim()

  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [inviteDoc, setInviteDoc] = useState(null)
  const [error, setError] = useState('')

  const inviteIsValid = useMemo(() => isInviteValid(inviteDoc, token), [inviteDoc, token])

  useEffect(() => {
    let active = true

    async function checkInvite() {
      if (!uid || !token) {
        if (active) {
          setError('This invite link is invalid or has expired. Please ask your administrator for a new invite.')
          setLoading(false)
        }
        return
      }

      try {
        const adminUser = await getAdminUser(uid)
        if (!active) return

        if (!isInviteValid(adminUser, token)) {
          setError('This invite link is invalid or has expired. Please ask your administrator for a new invite.')
          setInviteDoc(null)
          setLoading(false)
          return
        }

        setInviteDoc(adminUser)
        setError('')
      } catch {
        if (!active) return
        setError('This invite link is invalid or has expired. Please ask your administrator for a new invite.')
        setInviteDoc(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    checkInvite()
    return () => { active = false }
  }, [uid, token])

  async function handleAcceptInvite() {
    if (!inviteDoc || !inviteIsValid) return
    setActivating(true)
    setError('')

    try {
      const signedInUser = user || await loginWithGoogle()
      const signedInEmail = normalizeEmail(signedInUser?.email)
      const inviteEmail = normalizeEmail(inviteDoc.email)

      if (!signedInEmail || signedInEmail !== inviteEmail) {
        setError(`Please sign in with the email address this invite was sent to: ${inviteDoc.email}`)
        return
      }

      const activated = await activateAdminUser(uid, token)
      if (!activated?.success) {
        setError('This invite link is invalid or has expired. Please ask your administrator for a new invite.')
        return
      }

      await refreshRole()
      pushToast('Welcome! Your admin account is now active.', 'success')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Unable to accept invite right now. Please try again.')
    } finally {
      setActivating(false)
    }
  }

  if (!uid || !token) {
    return <Navigate to="/invite" replace />
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <div className="w-full max-w-xl">
        {loading ? (
          <div className="card bg-base-100 shadow-xl border border-base-300/60">
            <div className="card-body items-center text-center py-10">
              <span className="loading loading-spinner loading-lg" />
              <p className="text-sm opacity-70 mt-2">Checking invite…</p>
            </div>
          </div>
        ) : !inviteIsValid ? (
          <div className="card bg-base-100 shadow-xl border border-base-300/60">
            <div className="card-body">
              <div className="alert alert-error">
                <span>{error || 'This invite link is invalid or has expired. Please ask your administrator for a new invite.'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl border border-base-300/60">
            <div className="card-body gap-5">
              <h1 className="text-2xl font-bold">Welcome, {inviteDoc.displayName || 'Team member'}!</h1>
              <p className="opacity-80">
                You were invited to join the admin dashboard as <span className="font-semibold">{inviteDoc.role || 'staff'}</span>.
              </p>
              <p className="text-sm opacity-70">Invite email: {inviteDoc.email}</p>

              {error ? (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAcceptInvite}
                  disabled={activating}
                >
                  {activating ? 'Activating…' : 'Accept Invite & Sign In'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
