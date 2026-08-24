// Raw materials / inventory management (admin)
import { collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, serverTimestamp, increment, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { logInventoryChange, sendLogEmail } from './auditLog'
import { fetchMenuCategories } from './data-menu'

function normalizeMaterialName(name) {
  return String(name || '').trim()
}

function materialNameKey(name) {
  return normalizeMaterialName(name).toLowerCase().replace(/\s+/g, ' ')
}

async function assertUniqueMaterialName(name, ignoreId = null) {
  const key = materialNameKey(name)
  if (!key) throw new Error('Material name is required')
  const snap = await getDocs(collection(db, 'raw_materials'))
  const found = snap.docs.find(d => {
    if (ignoreId && d.id === ignoreId) return false
    const data = d.data() || {}
    const existingKey = data.nameKey || materialNameKey(data.name)
    return existingKey === key
  })
  if (found) throw new Error('Material with this name already exists')
}

export async function fetchRawMaterials() {
  try {
    const snap = await getDocs(collection(db, 'raw_materials'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('fetchRawMaterials failed', e)
    return []
  }
}

export async function saveRawMaterial(data, performedBy = 'admin') {
  const { id, ...rest } = data
  const normalizedName = normalizeMaterialName(rest?.name)
  if (!normalizedName) throw new Error('Material name is required')
  await assertUniqueMaterialName(normalizedName, id || null)
  const payload = { ...rest, name: normalizedName, nameKey: materialNameKey(normalizedName), updatedAt: serverTimestamp() }

  if (id) {
    const ref = doc(db, 'raw_materials', id)
    const beforeSnap = await getDoc(ref)
    const before = beforeSnap.exists() ? { id, ...beforeSnap.data() } : null

    await setDoc(ref, payload, { merge: true })

    const afterSnap = await getDoc(ref)
    const after = afterSnap.exists() ? { id, ...afterSnap.data() } : null

    await logInventoryChange('update', id, before, after, performedBy, {
      reason: 'Inventory item updated'
    }).catch(err => console.error('Failed to log inventory update:', err))

    return id
  } else {
    const ref = await addDoc(collection(db, 'raw_materials'), { ...payload, createdAt: serverTimestamp() })
    const newId = ref.id

    await logInventoryChange('create', newId, null, { id: newId, ...payload }, performedBy, {
      reason: 'New inventory item created'
    }).catch(err => console.error('Failed to log inventory creation:', err))

    return newId
  }
}

export async function deleteRawMaterial(id, performedBy = 'admin') {
  if (!id) return
  const ref = doc(db, 'raw_materials', id)
  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? { id, ...beforeSnap.data() } : null

  await deleteDoc(ref)

  await logInventoryChange('delete', id, before, null, performedBy, {
    reason: 'Inventory item deleted'
  }).catch(err => console.error('Failed to log inventory deletion:', err))
}

export async function updateRawMaterialStock(id, delta) {
  if (!id || !delta) return
  const ref = doc(db, 'raw_materials', id)
  await setDoc(ref, {
    stock: increment(Number(delta)),
    updatedAt: serverTimestamp()
  }, { merge: true })
}

// Deduct stock for accepted/confirmed orders using ingredient maps
export async function deductStockForOrder(orderItems) {
  if (!Array.isArray(orderItems) || !orderItems.length) return

  const categories = await fetchMenuCategories()
  const itemMap = new Map()
  categories.forEach(cat => {
    if (Array.isArray(cat.items)) {
      cat.items.forEach(item => {
        itemMap.set(item.name, item)
      })
    }
  })

  const batch = writeBatch(db)
  let hasUpdates = false
  const affectedMaterialIds = new Set()

  for (const orderItem of orderItems) {
    const menuName = orderItem.name || orderItem.itemName
    const qty = Number(orderItem.qty || orderItem.quantity || 1)
    const menuItem = itemMap.get(menuName)

    if (menuItem && Array.isArray(menuItem.ingredients)) {
      for (const ing of menuItem.ingredients) {
        if (ing.materialId && ing.quantity) {
          const deduction = Number(ing.quantity) * qty
          const ref = doc(db, 'raw_materials', ing.materialId)
          batch.update(ref, { stock: increment(-deduction) })
          affectedMaterialIds.add(ing.materialId)
          hasUpdates = true
        }
      }
    }
  }

  if (hasUpdates) {
    await batch.commit()
    // Check affected materials for low stock and send alerts
    checkLowStockAlerts([...affectedMaterialIds]).catch(err =>
      console.error('Low stock alert check failed:', err)
    )
  }
}

/**
 * Check materials against their alert thresholds and send an email alert
 * for any that have dropped below the threshold.
 * (WhatsApp alerts removed with the WhatsApp Cloud API integration.)
 */
async function checkLowStockAlerts(materialIds) {
  if (!materialIds.length) return

  const lowItems = []
  for (const id of materialIds) {
    const snap = await getDoc(doc(db, 'raw_materials', id))
    if (!snap.exists()) continue
    const data = snap.data()
    const stock = Number(data.stock || 0)
    const threshold = Number(data.lowStockThreshold || 0)
    if (threshold > 0 && stock <= threshold) {
      lowItems.push({ id, name: data.name || id, stock, threshold, unit: data.unit || '' })
    }
  }

  if (!lowItems.length) return

  // Build alert message
  const lines = lowItems.map(m => `• ${m.name}: ${m.stock} ${m.unit} remaining (alert at ${m.threshold} ${m.unit})`)
  const message = `🚨 Low Stock Alert\n\nThe following items are running low:\n${lines.join('\n')}\n\nPlease restock soon.`

  // Send email alert
  sendLogEmail('stock_low_alert', message, {
    items: lowItems.map(m => ({ name: m.name, stock: m.stock, threshold: m.threshold, unit: m.unit })),
  })
}
