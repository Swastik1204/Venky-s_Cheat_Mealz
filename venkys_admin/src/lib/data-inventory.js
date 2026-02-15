// Raw materials / inventory management (admin)
import { collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, serverTimestamp, increment, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { logInventoryChange } from './auditLog'
import { fetchMenuCategories } from './data-menu'

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
	const payload = { ...rest, updatedAt: serverTimestamp() }

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
					hasUpdates = true
				}
			}
		}
	}

	if (hasUpdates) await batch.commit()
}
