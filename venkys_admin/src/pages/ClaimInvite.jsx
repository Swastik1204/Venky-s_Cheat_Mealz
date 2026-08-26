// ClaimInvite — Public route /claim?token=...
// Handles staff invite redemption: verifies the token, prompts sign-in with
// the exact invited email, then redeems. Mirrors the proven FSW
// onboard/redeem-invite pattern, adapted to Venky's roles/{email} model.
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MdCheckCircle, MdError, MdLogin, MdLogout, MdArrowForward } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { verifyInvite, redeemInvite } from '../lib/data-invites'
import AuthModal from '../components/AuthModal'

const REASON_MESSAGES = {
  no_token: 'No invite link found. Check the link in your email and try again.',
  not_found: "This invite link doesn't exist. Ask your admin for a new one.",
  claimed: 'This invite has already been used.',
  revoked: 'This invite was revoked by an admin.',
  expired: 'This invite link has expired. Ask your admin to send a new one.',
  network_error: "Couldn't reach the server. Check your connection and try again.",
  unknown: 'This invite link is not valid.',
}

export default function ClaimInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const { user, loginWithGoogle, logout } = useAuth()
  const { openAuth } = useUI()

  const [state, setState] = useState('loading') // loading | invalid | valid | redeeming | success | error
  const [invite, setInvite] = useState(null)
  const [reason, setReason] = useState('')
  const [redeemError, setRedeemError] = useState('')

  useEffect(() => {
    if (!token) {
      setState('invalid')
      setReason('no_token')
      return
    }
    let cancelled = false
    verifyInvite(token).then((data) => {
      if (cancelled) return
      if (data.valid) {
        setInvite(data)
        setState('valid')
      } else {
        setState('invalid')
        setReason(data.reason || 'unknown')
      }
    })
    return () => { cancelled = true }
  }, [token])

  const doRedeem = useCallback(async () => {
    if (!user || !invite || !token) return
    setState('redeeming')
    setRedeemError('')
    try {
      await redeemInvite(token)
      setState('success')
      setTimeout(() => navigate('/admin', { replace: true }), 1500)
    } catch (err) {
      setState('error')
      setRedeemError(err.message || 'Failed to activate access')
    }
  }, [user, invite, token, navigate])

  useEffect(() => {
    if (state === 'valid' && user && invite && user.email?.toLowerCase() === invite.email?.toLowerCase()) {
      doRedeem()
    }
  }, [state, user, invite, doRedeem])

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body items-center text-center gap-6 py-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight">Venky's Staff</h1>
            <p className="text-sm opacity-60">Invite activation</p>
          </div>
          <div className="divider my-0 opacity-20" />

          {state === 'loading' && (
            <div className="py-4">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="text-sm opacity-70 mt-3">Checking your invite…</p>
            </div>
          )}

          {state === 'invalid' && (
            <div className="alert alert-error shadow-sm text-sm w-full">
              <MdError className="text-xl shrink-0" />
              <span>{REASON_MESSAGES[reason] || REASON_MESSAGES.unknown}</span>
            </div>
          )}

          {state === 'valid' && !user && (
            <div className="space-y-5 w-full">
              <div className="bg-base-200/50 p-5 rounded-2xl space-y-2">
                <p className="text-sm font-medium opacity-70">You've been invited as</p>
                <div className="badge badge-primary badge-lg font-black uppercase tracking-widest text-xs py-3 px-5">
                  {invite.role}
                </div>
                <p className="text-xs opacity-50">Invited by {invite.invitedByName}</p>
              </div>
              <div className="alert alert-info text-xs py-3 shadow-sm">
                <span>Please sign in with <strong className="font-mono">{invite.email}</strong></span>
              </div>
              <button onClick={loginWithGoogle} className="btn btn-primary btn-block gap-2">
                <MdLogin className="text-xl" /> Sign in with Google
              </button>
              <button onClick={() => openAuth('login')} className="btn btn-ghost btn-sm btn-block">
                Sign in another way
              </button>
              <AuthModal />
            </div>
          )}

          {state === 'valid' && user && user.email?.toLowerCase() !== invite?.email?.toLowerCase() && (
            <div className="space-y-4 w-full">
              <div className="alert alert-error shadow-sm text-left text-sm">
                <MdError className="text-xl shrink-0" />
                <div>
                  <p className="font-bold">Wrong account</p>
                  <p className="mt-1">This invite was sent to <strong className="font-mono">{invite.email}</strong>, but you're signed in as <strong className="font-mono">{user.email}</strong>.</p>
                </div>
              </div>
              <button onClick={() => logout()} className="btn btn-error btn-block gap-2">
                <MdLogout className="text-lg" /> Sign out & switch account
              </button>
            </div>
          )}

          {state === 'redeeming' && (
            <div className="py-4">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="text-sm opacity-70 mt-3">Activating your access…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="alert alert-success shadow-sm text-sm w-full">
              <MdCheckCircle className="text-2xl shrink-0" />
              <div className="text-left">
                <p className="font-bold">Access activated! 🎉</p>
                <p className="opacity-80">Redirecting you to the admin panel…</p>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4 w-full">
              <div className="alert alert-error shadow-sm text-sm">
                <MdError className="text-xl shrink-0" />
                <span>{redeemError}</span>
              </div>
              <button onClick={doRedeem} className="btn btn-outline btn-block gap-2">
                Try again <MdArrowForward />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
