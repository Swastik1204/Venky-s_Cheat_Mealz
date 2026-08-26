/* eslint-env node */
// Vercel Serverless Function: delete exactly the admin-approved subset of a
// pending log-cleanup batch.
// Endpoint: /api/cleanup-logs-delete
// Method: POST
// Auth: super admin only (isSuperAdminEmail — hardcoded email, matching the
// logs/{logId} and pendingLogCleanup/{token} firestore.rules exactly, not
// the admin-app client's broader isSuperAdmin display flag).
// Body: { token, logIds: string[] }
// Returns: { ok: true, deletedCount }

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, isSuperAdminEmail, FieldValue } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'cleanup-logs-delete' })

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const callerEmail = String(auth.user?.email || '').trim()
  if (!isSuperAdminEmail(callerEmail)) {
    return res.status(403).json({ error: 'Super admin access required to delete logs' })
  }

  try {
    const { token, logIds } = req.body || {}
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing token' })
    }
    if (!Array.isArray(logIds) || logIds.length === 0) {
      return res.status(400).json({ error: 'No log IDs selected' })
    }

    const db = adminDb()
    const batchRef = db.collection('pendingLogCleanup').doc(token)
    const batchSnap = await batchRef.get()
    if (!batchSnap.exists) {
      return res.status(404).json({ error: 'Review batch not found' })
    }
    const batchData = batchSnap.data()
    if (batchData.status !== 'pending') {
      return res.status(400).json({ error: `This batch is already ${batchData.status}` })
    }

    // Defense in depth: only ever delete IDs that were actually part of the
    // original candidate list captured at scan time — a tampered/forged
    // request body can't smuggle in arbitrary log IDs via this endpoint.
    const candidateSet = new Set(Array.isArray(batchData.logIds) ? batchData.logIds : [])
    const toDelete = logIds.filter((id) => candidateSet.has(id))
    if (toDelete.length === 0) {
      return res.status(400).json({ error: 'None of the submitted IDs are part of this review batch' })
    }

    const writeBatch = db.batch()
    toDelete.forEach((id) => writeBatch.delete(db.collection('logs').doc(id)))
    writeBatch.delete(batchRef)
    await writeBatch.commit()

    await db.collection('logs').add({
      action: 'delete',
      collection: 'logs',
      documentId: token,
      performedBy: callerEmail,
      readableAction: `${callerEmail} deleted ${toDelete.length} old audit log${toDelete.length === 1 ? '' : 's'} (${batchData.count - toDelete.length} of the ${batchData.count} candidates kept)`,
      metadata: { deletedCount: toDelete.length, candidateCount: batchData.count, keptCount: batchData.count - toDelete.length, batchToken: token },
      timestamp: FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ ok: true, deletedCount: toDelete.length })
  } catch (error) {
    console.error('[cleanup-logs-delete] error', error)
    return res.status(500).json({ error: 'Failed to delete logs' })
  }
}
