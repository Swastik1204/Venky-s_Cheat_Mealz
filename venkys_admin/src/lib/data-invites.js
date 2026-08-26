// Staff invite management (admin) — client wrappers around the invite API
// endpoints, plus a direct Firestore read for the pending-invites list
// (staffInvites is admin-readable per firestore.rules, same as fetchStaff()
// reads roles/ directly).
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { apiClient } from '../utils/apiClient'

export async function fetchInvites() {
  try {
    const snap = await getDocs(collection(db, 'staffInvites'))
    return snap.docs.map((d) => ({ token: d.id, ...d.data() }))
  } catch (err) {
    console.error('[data-invites] fetchInvites failed', err)
    return []
  }
}

export async function createInvite({ email, role, pages, defaultPage }) {
  const res = await apiClient.post('/api/create-invite', { email, role, pages, defaultPage })
  if (!res.ok) {
    throw new Error(res.body?.error || res.message || 'Failed to create invite')
  }
  return res.data
}

export async function revokeInvite(token) {
  const res = await apiClient.post('/api/revoke-invite', { token })
  if (!res.ok) {
    throw new Error(res.body?.error || res.message || 'Failed to revoke invite')
  }
  return res.data
}

export async function verifyInvite(token) {
  const res = await apiClient.post('/api/verify-invite', { token })
  if (!res.ok) {
    return { valid: false, reason: 'network_error' }
  }
  return res.data
}

export async function redeemInvite(token) {
  const res = await apiClient.post('/api/redeem-invite', { token })
  if (!res.ok) {
    throw new Error(res.body?.error || res.message || 'Failed to activate access')
  }
  return res.data
}

/** Invite status, computed client-side the same way the server does. */
export function inviteStatus(invite) {
  if (invite.status === 'claimed') return 'claimed'
  if (invite.status === 'revoked') return 'revoked'
  const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt)
  if (expiresAt < new Date()) return 'expired'
  return 'pending'
}
