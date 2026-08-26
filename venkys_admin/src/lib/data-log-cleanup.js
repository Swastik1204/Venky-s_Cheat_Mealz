// Log cleanup review — client wrapper for the delete endpoint. Reading a
// pendingLogCleanup/{token} doc is a direct Firestore read (super-admin-only
// per firestore.rules), done inline on the review page, not here.
import { apiClient } from '../utils/apiClient'

export async function deleteSelectedLogs(token, logIds) {
  const res = await apiClient.post('/api/cleanup-logs-delete', { token, logIds })
  if (!res.ok) {
    throw new Error(res.body?.error || res.message || 'Failed to delete logs')
  }
  return res.data
}
