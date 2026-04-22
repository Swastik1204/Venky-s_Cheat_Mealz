/* eslint-env node */
// Dry-run script to find and optionally remove legacy field names from orders
// Usage: node scripts/cleanup-order-fields.js           (dry run)
//        node scripts/cleanup-order-fields.js --fix     (actually removes legacy fields)
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Fields that should never appear in canonical order docs
const LEGACY_FIELDS = ['shippingFee', 'grandTotal', 'contact', 'name', 'phone']

// Fields that are legacy ONLY if a canonical replacement also exists
const CONDITIONAL_FIELDS = [
  { field: 'total', onlyIfAlsoHas: 'totalAmount' },
  { field: 'address', onlyIfAlsoHas: 'customer' },
]

const isFix = process.argv.includes('--fix')

async function run() {
  const snap = await db.collection('orders').get()
  console.log(`Scanning ${snap.size} orders...`)

  let affectedCount = 0
  const fieldCounts = {}

  for (const doc of snap.docs) {
    const data = doc.data()
    const toRemove = []

    for (const field of LEGACY_FIELDS) {
      if (field in data) toRemove.push(field)
    }
    for (const { field, onlyIfAlsoHas } of CONDITIONAL_FIELDS) {
      if (field in data && onlyIfAlsoHas in data) toRemove.push(field)
    }

    if (toRemove.length > 0) {
      affectedCount++
      toRemove.forEach(f => { fieldCounts[f] = (fieldCounts[f] || 0) + 1 })
      console.log(`Order ${doc.id}: legacy fields found: [${toRemove.join(', ')}]`)

      if (isFix) {
        const updates = {}
        toRemove.forEach(f => { updates[f] = FieldValue.delete() })
        await db.collection('orders').doc(doc.id).update(updates)
        console.log(`  → Removed from ${doc.id}`)
      }
    }
  }

  console.log('\n── Summary ──')
  console.log(`Total orders scanned: ${snap.size}`)
  console.log(`Orders with legacy fields: ${affectedCount}`)
  console.log('Legacy field counts:', fieldCounts)
  if (!isFix && affectedCount > 0) {
    console.log('\nRun with --fix to remove these fields.')
  }
  if (isFix) {
    console.log('Cleanup complete.')
  }
}

run().catch(console.error)
