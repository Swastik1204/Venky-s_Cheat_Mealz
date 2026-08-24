import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, collection, query, where, setDoc } from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runTests() {
  console.log('--- Initializing Firestore Rules Test Environment ---')
  const rules = readFileSync(join(__dirname, '../firestore.rules'), 'utf8')
  
  const testEnv = await initializeTestEnvironment({
    projectId: 'test-rules-project',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080
    }
  })

  try {
    // Setup test data as admin (bypass rules)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      // Setup orders
      await setDoc(doc(db, 'orders', 'order-A'), {
        userId: 'customerA',
        totalAmount: 500,
        customer: { name: 'Customer A', phone: '9999999991' }
      })
      await setDoc(doc(db, 'orders', 'order-B'), {
        userId: 'customerB',
        totalAmount: 1200,
        customer: { name: 'Customer B', phone: '9999999992' }
      })
      // Setup staff and admin roles
      await setDoc(doc(db, 'roles', 'admin@example.com'), {
        role: 'admin',
        email: 'admin@example.com',
        name: 'Admin User'
      })
      await setDoc(doc(db, 'roles', 'staff@example.com'), {
        role: 'staff',
        email: 'staff@example.com',
        name: 'Staff Orders User',
        pages: { orders: true, biller: false }
      })
    })

    console.log('\n[TEST 1] Customer A reading own order (order-A)...')
    const customerA = testEnv.authenticatedContext('customerA', { email: 'customerA@test.com' }).firestore()
    await assertSucceeds(getDoc(doc(customerA, 'orders', 'order-A')))
    console.log('✅ PASS: Customer A can get their own order.')

    console.log('\n[TEST 2] Customer A attempting to read Customer B order (order-B)...')
    await assertFails(getDoc(doc(customerA, 'orders', 'order-B')))
    console.log('✅ PASS: Customer A CANNOT get Customer B order (Permission Denied).')

    console.log('\n[TEST 3] Customer A listing own orders (where userId == customerA)...')
    const ownQuery = query(collection(customerA, 'orders'), where('userId', '==', 'customerA'))
    await assertSucceeds(getDocs(ownQuery))
    console.log('✅ PASS: Customer A can list own orders with where constraint.')

    console.log('\n[TEST 4] Customer A attempting to list ALL orders (unfiltered collection list)...')
    const allQuery = collection(customerA, 'orders')
    await assertFails(getDocs(allQuery))
    console.log('✅ PASS: Customer A CANNOT list all orders (Permission Denied).')

    console.log('\n[TEST 5] Customer A attempting to list Customer B orders (where userId == customerB)...')
    const spoofQuery = query(collection(customerA, 'orders'), where('userId', '==', 'customerB'))
    await assertFails(getDocs(spoofQuery))
    console.log('✅ PASS: Customer A CANNOT list Customer B orders (Permission Denied).')

    console.log('\n[TEST 6] Staff user listing all orders...')
    const staff = testEnv.authenticatedContext('staffUid', { email: 'staff@example.com' }).firestore()
    await assertSucceeds(getDocs(collection(staff, 'orders')))
    await assertSucceeds(getDoc(doc(staff, 'orders', 'order-A')))
    await assertSucceeds(getDoc(doc(staff, 'orders', 'order-B')))
    console.log('✅ PASS: Staff user can list all orders and get individual orders.')

    console.log('\n[TEST 7] Super Admin listing all orders...')
    const superAdmin = testEnv.authenticatedContext('superAdminUid', { email: 'swastiksaha1204@gmail.com' }).firestore()
    await assertSucceeds(getDocs(collection(superAdmin, 'orders')))
    await assertSucceeds(getDoc(doc(superAdmin, 'orders', 'order-A')))
    await assertSucceeds(getDoc(doc(superAdmin, 'orders', 'order-B')))
    console.log('✅ PASS: Super admin can list all orders and get individual orders.')

    console.log('\n🎉 ALL 7 FIRESTORE RULE SECURITY TESTS PASSED PERFECTLY!')
  } finally {
    await testEnv.cleanup()
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err)
  process.exit(1)
})
