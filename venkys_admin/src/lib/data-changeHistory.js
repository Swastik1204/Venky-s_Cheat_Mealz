import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import { db } from './firebase'

const CHANGE_HISTORY_COLLECTION = 'changeHistory'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_PAGE_SIZE = 20
const MAX_BATCH_DELETE = 500

function sanitizeForFirestore(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined)
  }
  if (typeof value === 'object') {
    const out = {}
    Object.entries(value).forEach(([key, val]) => {
      const next = sanitizeForFirestore(val)
      if (next !== undefined) out[key] = next
    })
    return out
  }
  return value
}

function toSafeObject(value) {
  if (!value || typeof value !== 'object') return null
  return sanitizeForFirestore(value)
}

export async function recordChange({
  collection: collectionName,
  docId,
  before = null,
  after = null,
  action = 'update',
  performedBy = 'system',
  description = '',
}) {
  const payload = {
    collection: String(collectionName || '').trim(),
    docId: String(docId || '').trim(),
    before: toSafeObject(before),
    after: toSafeObject(after),
    action: String(action || 'update').trim().toLowerCase(),
    performedBy: String(performedBy || 'system').trim() || 'system',
    description: String(description || '').trim() || 'System change recorded',
    timestamp: serverTimestamp(),
    expiresAt: Date.now() + SEVEN_DAYS_MS,
    restored: false,
    restorable: String(action || '').trim().toLowerCase() !== 'create',
  }

  if (!payload.collection || !payload.docId) {
    throw new Error('recordChange requires collection and docId')
  }

  const ref = await addDoc(collection(db, CHANGE_HISTORY_COLLECTION), payload)
  return { id: ref.id }
}

export async function fetchChangeHistory({
  collectionFilter = '',
  limitCount = DEFAULT_PAGE_SIZE,
  startAfterDoc = null,
} = {}) {
  const safeLimit = Number.isFinite(Number(limitCount)) && Number(limitCount) > 0
    ? Math.min(Number(limitCount), 100)
    : DEFAULT_PAGE_SIZE

  const constraints = []
  const filter = String(collectionFilter || '').trim()
  if (filter) constraints.push(where('collection', '==', filter))
  constraints.push(orderBy('timestamp', 'desc'))
  if (startAfterDoc) constraints.push(startAfter(startAfterDoc))
  constraints.push(limit(safeLimit))

  const snap = await getDocs(query(collection(db, CHANGE_HISTORY_COLLECTION), ...constraints))
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const lastDoc = snap.docs.length ? snap.docs[snap.docs.length - 1] : null

  return { entries, lastDoc }
}

export async function restoreVersion({ changeId, performedBy = 'system' } = {}) {
  const id = String(changeId || '').trim()
  if (!id) return { success: false, reason: 'missing_change_id' }

  const changeRef = doc(db, CHANGE_HISTORY_COLLECTION, id)
  const changeSnap = await getDoc(changeRef)
  if (!changeSnap.exists()) return { success: false, reason: 'change_not_found' }

  const change = changeSnap.data() || {}
  if (!change.restorable) return { success: false, reason: 'not_restorable' }

  const beforeState = toSafeObject(change.before)
  if (!beforeState) return { success: false, reason: 'missing_before_snapshot' }

  const targetCollection = String(change.collection || '').trim()
  const targetDocId = String(change.docId || '').trim()
  if (!targetCollection || !targetDocId) {
    return { success: false, reason: 'invalid_target_reference' }
  }

  const targetRef = doc(db, targetCollection, targetDocId)
  const currentSnap = await getDoc(targetRef)
  const overwrittenState = currentSnap.exists() ? currentSnap.data() : null

  await setDoc(targetRef, beforeState, { merge: false })

  try {
    const originalAt = change.timestamp?.toDate?.()
      ? change.timestamp.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'previous snapshot'
    await recordChange({
      collection: targetCollection,
      docId: targetDocId,
      before: overwrittenState,
      after: beforeState,
      action: 'restore',
      performedBy,
      description: `Restored ${targetCollection}/${targetDocId} to its state from ${originalAt}`,
    })
  } catch (err) {
    console.error('[changeHistory] restore record failed', err)
  }

  try {
    await updateDoc(changeRef, {
      restored: true,
      restoredAt: serverTimestamp(),
      restoredBy: String(performedBy || 'system').trim() || 'system',
    })
  } catch (err) {
    console.error('[changeHistory] restore marker update failed', err)
  }

  return { success: true }
}

export async function deleteExpiredHistory() {
  const colRef = collection(db, CHANGE_HISTORY_COLLECTION)
  let deletedCount = 0

  while (true) {
    const cutoff = Date.now()
    const snap = await getDocs(query(
      colRef,
      where('expiresAt', '<', cutoff),
      orderBy('expiresAt', 'asc'),
      limit(MAX_BATCH_DELETE),
    ))

    if (snap.empty) break

    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deletedCount += snap.docs.length

    if (snap.docs.length < MAX_BATCH_DELETE) break
  }

  return { deletedCount }
}
