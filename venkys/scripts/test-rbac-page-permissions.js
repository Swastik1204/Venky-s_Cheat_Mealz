// Regression test for the client-visible-capability vs backend-enforced-capability
// mismatch bug (Settings/Stock/Delivery pages). Proves, against the real
// firestore.rules via the Firestore emulator, that every staff page a user
// can see (client canAccess(pageKey)) maps to a write permission the backend
// actually grants — not just that the UI hides the button.
//
// Run: firebase emulators:exec --project test-rules-project --only firestore "node scripts/test-rbac-page-permissions.js"
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc } from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runTests() {
  console.log('--- Initializing Firestore Rules Test Environment ---')
  const rules = readFileSync(join(__dirname, '../firestore.rules'), 'utf8')

  const testEnv = await initializeTestEnvironment({
    projectId: 'test-rules-project',
    firestore: { rules, host: '127.0.0.1', port: 8080 }
  })

  try {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()

      await setDoc(doc(db, 'roles', 'admin@example.com'), { role: 'admin', email: 'admin@example.com' })

      // Staff with ONLY the page under test granted (isolates each gate).
      await setDoc(doc(db, 'roles', 'settings-staff@example.com'), { role: 'staff', pages: { settings: true } })
      await setDoc(doc(db, 'roles', 'no-settings-staff@example.com'), { role: 'staff', pages: { orders: true } })

      await setDoc(doc(db, 'roles', 'stock-staff@example.com'), { role: 'staff', pages: { stock: true } })
      await setDoc(doc(db, 'roles', 'inventory-staff@example.com'), { role: 'staff', pages: { inventory: true } })
      await setDoc(doc(db, 'roles', 'no-stock-staff@example.com'), { role: 'staff', pages: { orders: true } })

      await setDoc(doc(db, 'roles', 'delivery-page-staff@example.com'), { role: 'staff', pages: { delivery: true } })
      await setDoc(doc(db, 'roles', 'no-delivery-staff@example.com'), { role: 'staff', pages: { inventory: true } })
      await setDoc(doc(db, 'roles', 'delivery-role@example.com'), { role: 'delivery' })

      await setDoc(doc(db, 'roles', 'orders-staff@example.com'), { role: 'staff', pages: { orders: true } })
      await setDoc(doc(db, 'roles', 'biller-staff@example.com'), { role: 'staff', pages: { biller: true } })
      await setDoc(doc(db, 'roles', 'inventory-menu-staff@example.com'), { role: 'staff', pages: { inventory: true } })
      await setDoc(doc(db, 'roles', 'appearance-staff@example.com'), { role: 'staff', pages: { appearance: true } })

      await setDoc(doc(db, 'miscellaneous', 'settings'), { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 })
      await setDoc(doc(db, 'miscellaneous', 'appearance'), { themeColor: '#000' })
      await setDoc(doc(db, 'raw_materials', 'rm-1'), { name: 'Chicken', unit: 'kg', quantity: 10 })
      await setDoc(doc(db, 'menu', 'starters'), { items: [] })
      await setDoc(doc(db, 'orders', 'order-D'), {
        userId: 'customerD', orderType: 'delivery', status: 'ready', statusHistory: [], totalAmount: 300,
        customer: { name: 'Customer D', phone: '9999999993' }
      })
    })

    const ctx = (email) => testEnv.authenticatedContext(email.split('@')[0], { email }).firestore()

    console.log('\n=== SETTINGS PAGE ===')
    console.log('[1] Staff WITHOUT settings-page access writes to miscellaneous/settings...')
    await assertFails(updateDoc(doc(ctx('no-settings-staff@example.com'), 'miscellaneous', 'settings'), { maxLat: 5 }))
    console.log('✅ PASS: Denied (403), as expected.')

    console.log('[2] Staff WITH settings-page access writes to miscellaneous/settings...')
    await assertSucceeds(updateDoc(doc(ctx('settings-staff@example.com'), 'miscellaneous', 'settings'), { maxLat: 5 }))
    console.log('✅ PASS: Write now persists (this was the reported bug — used to fail).')

    console.log('[3] Admin writes to miscellaneous/settings (regression check)...')
    await assertSucceeds(updateDoc(doc(ctx('admin@example.com'), 'miscellaneous', 'settings'), { maxLat: 6 }))
    console.log('✅ PASS: Admin still works.')

    console.log('\n=== STOCK PAGE (raw_materials) ===')
    console.log('[4] Staff WITHOUT stock/inventory/biller access writes to raw_materials...')
    await assertFails(updateDoc(doc(ctx('no-stock-staff@example.com'), 'raw_materials', 'rm-1'), { quantity: 20 }))
    console.log('✅ PASS: Denied (403), as expected.')

    console.log('[5] Staff WITH stock-page access writes to raw_materials...')
    await assertSucceeds(updateDoc(doc(ctx('stock-staff@example.com'), 'raw_materials', 'rm-1'), { quantity: 20 }))
    console.log('✅ PASS: Write now persists (this was the reported bug — used to fail).')

    console.log('[6] Staff WITH inventory-page access writes to raw_materials (regression check)...')
    await assertSucceeds(updateDoc(doc(ctx('inventory-staff@example.com'), 'raw_materials', 'rm-1'), { quantity: 21 }))
    console.log('✅ PASS: Inventory-page staff still works.')

    console.log('\n=== DELIVERY PAGE (orders lifecycle fields) ===')
    console.log('[7] Staff WITHOUT delivery-page access updates order status...')
    await assertFails(updateDoc(doc(ctx('no-delivery-staff@example.com'), 'orders', 'order-D'), { status: 'delivered', updatedAt: 1 }))
    console.log('✅ PASS: Denied (403), as expected.')

    console.log('[8] Staff WITH delivery-page access updates order status...')
    await assertSucceeds(updateDoc(doc(ctx('delivery-page-staff@example.com'), 'orders', 'order-D'), { status: 'delivered', updatedAt: 2 }))
    console.log('✅ PASS: Write now persists (this was the reported bug — used to fail).')

    console.log('[9] role:"delivery" user updates only its allowed fields (regression check)...')
    await assertSucceeds(updateDoc(doc(ctx('delivery-role@example.com'), 'orders', 'order-D'), { status: 'ready', updatedAt: 3 }))
    console.log('✅ PASS: Existing delivery-role path still works.')

    console.log('[10] role:"delivery" user tries to touch a field outside its allowlist (regression check)...')
    await assertFails(updateDoc(doc(ctx('delivery-role@example.com'), 'orders', 'order-D'), { totalAmount: 999 }))
    console.log('✅ PASS: Still field-locked as before.')

    console.log('\n=== PREVIOUSLY-CORRECT PAGES (no regression) ===')
    console.log('[11] Orders-page staff updates order status...')
    await assertSucceeds(updateDoc(doc(ctx('orders-staff@example.com'), 'orders', 'order-D'), { status: 'preparing', updatedAt: 4 }))
    console.log('✅ PASS.')

    console.log('[12] Biller-page staff edits order items/subtotal...')
    await assertSucceeds(updateDoc(doc(ctx('biller-staff@example.com'), 'orders', 'order-D'), { subtotal: 250, updatedAt: 5 }))
    console.log('✅ PASS.')

    console.log('[13] Inventory-page staff edits menu...')
    await assertSucceeds(updateDoc(doc(ctx('inventory-menu-staff@example.com'), 'menu', 'starters'), { description: 'Updated' }))
    console.log('✅ PASS.')

    console.log('[14] Appearance-page staff edits appearance doc...')
    await assertSucceeds(updateDoc(doc(ctx('appearance-staff@example.com'), 'miscellaneous', 'appearance'), { themeColor: '#fff' }))
    console.log('✅ PASS.')

    console.log('\n🎉 ALL 14 RBAC PAGE-PERMISSION TESTS PASSED — client-visible capability now matches backend-enforced capability for every page.')
  } finally {
    await testEnv.cleanup()
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err)
  process.exit(1)
})
