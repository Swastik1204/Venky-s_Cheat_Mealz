// Audit logging system for tracking all changes
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Log any modification to the audit trail
 * @param {Object} params
 * @param {string} params.action - Type of action (create, update, delete)
 * @param {string} params.collection - Which collection/entity (orders, inventory, staff, settings, etc.)
 * @param {string} params.documentId - ID of the document changed
 * @param {Object} params.before - Previous state (null for create)
 * @param {Object} params.after - New state (null for delete)
 * @param {string} params.performedBy - Email of user who made the change
 * @param {Object} params.metadata - Additional context (page, reason, etc.)
 */
export async function logChange({
	action,
	collection: collectionName,
	documentId,
	before = null,
	after = null,
	performedBy,
	metadata = {}
}) {
	try {
		const sanitize = (value) => {
			if (value === undefined) return undefined
			if (value === null) return null
			if (Array.isArray(value)) {
				return value
					.map((v) => sanitize(v))
					.filter((v) => v !== undefined)
			}
			if (typeof value === 'object') {
				const out = {}
				Object.entries(value).forEach(([k, v]) => {
					const next = sanitize(v)
					if (next !== undefined) out[k] = next
				})
				return out
			}
			return value
		}

		const logEntry = {
			action, // 'create' | 'update' | 'delete'
			collection: collectionName,
			documentId,
			before: before ? JSON.parse(JSON.stringify(before)) : null, // Deep clone
			after: after ? JSON.parse(JSON.stringify(after)) : null, // Deep clone
			performedBy: performedBy || 'system',
			timestamp: serverTimestamp(),
			metadata: {
				...sanitize(metadata),
				userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
				ip: 'server-side', // Can be enhanced with actual IP tracking
			}
		}

		// Store in logs collection - auto-creates if doesn't exist
		await addDoc(collection(db, 'logs'), logEntry)
		
		console.log('[AuditLog]', action, collectionName, documentId, 'by', performedBy)
	} catch (error) {
		// Don't fail the main operation if logging fails
		console.error('[AuditLog] Failed to log change:', error)
	}
}

/**
 * Helper to extract changes between two objects
 */
export function getChangedFields(before, after) {
	const changes = {}
	const allKeys = new Set([
		...Object.keys(before || {}),
		...Object.keys(after || {})
	])
	
	for (const key of allKeys) {
		const beforeVal = before?.[key]
		const afterVal = after?.[key]
		const safeBeforeVal = beforeVal === undefined ? null : beforeVal
		const safeAfterVal = afterVal === undefined ? null : afterVal
		
		// Skip Firestore Timestamps for comparison
		if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp') continue
		
		if (JSON.stringify(safeBeforeVal) !== JSON.stringify(safeAfterVal)) {
			changes[key] = {
				from: safeBeforeVal,
				to: safeAfterVal
			}
		}
	}
	
	return changes
}

/**
 * Log order changes
 */
export async function logOrderChange(action, orderId, before, after, performedBy, metadata = {}) {
	const changedFields = action === 'update' ? getChangedFields(before, after) : null

	// Filter out routine status updates (e.g. placed -> preparing -> ready)
	// Only log if there are other changes (items, price, etc.) or if the status is "destructive" (rejected/cancelled)
	if (action === 'update' && changedFields) {
		const keys = Object.keys(changedFields)
		const routineKeys = ['status', 'statusHistory', 'revisionCount', 'updatedAt']
		const isRoutine = keys.every(k => routineKeys.includes(k))

		if (isRoutine) {
			const newStatus = after?.status
			const isDestructive = ['rejected', 'cancelled'].includes(newStatus)
			if (!isDestructive) {
				return // Skip logging routine operational updates
			}
		}
	}

	return logChange({
		action,
		collection: 'orders',
		documentId: orderId,
		before,
		after,
		performedBy,
		metadata: {
			...metadata,
			page: 'orders',
			changedFields
		}
	})
}

/**
 * Log inventory/stock changes
 */
export async function logInventoryChange(action, itemId, before, after, performedBy, metadata = {}) {
	return logChange({
		action,
		collection: 'raw_materials',
		documentId: itemId,
		before,
		after,
		performedBy,
		metadata: {
			...metadata,
			page: 'inventory',
			changedFields: action === 'update' ? getChangedFields(before, after) : null
		}
	})
}

/**
 * Log staff/role changes
 */
export async function logStaffChange(action, email, before, after, performedBy, metadata = {}) {
	return logChange({
		action,
		collection: 'roles',
		documentId: email,
		before,
		after,
		performedBy,
		metadata: {
			...metadata,
			page: 'settings',
			section: 'staff_management',
			changedFields: action === 'update' ? getChangedFields(before, after) : null
		}
	})
}

/**
 * Log settings changes
 */
export async function logSettingsChange(action, settingKey, before, after, performedBy, metadata = {}) {
	return logChange({
		action,
		collection: 'miscellaneous',
		documentId: settingKey,
		before,
		after,
		performedBy,
		metadata: {
			...metadata,
			page: 'settings',
			changedFields: action === 'update' ? getChangedFields(before, after) : null
		}
	})
}

/**
 * Log menu/appearance changes
 */
export async function logMenuChange(action, itemId, before, after, performedBy, metadata = {}) {
	return logChange({
		action,
		collection: 'menu',
		documentId: itemId,
		before,
		after,
		performedBy,
		metadata: {
			...metadata,
			page: 'appearance',
			changedFields: action === 'update' ? getChangedFields(before, after) : null
		}
	})
}

/**
 * Log billing/POS changes
 */
export async function logBillingChange(action, billId, before, after, performedBy, metadata = {}) {
	return logChange({
		action,
		collection: 'orders',
		documentId: billId,
		before,
		after,
		performedBy,
		metadata: {
			...metadata,
			page: 'biller',
			type: 'pos_transaction',
			changedFields: action === 'update' ? getChangedFields(before, after) : null
		}
	})
}
