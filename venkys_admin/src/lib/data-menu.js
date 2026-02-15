// Menu-related data functions (admin) — includes legacy menuItems/categories
import { collection, doc, getDocs, getDoc, query, where, setDoc, serverTimestamp, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { toMoney, toDiscount } from './data-common'

export async function fetchMenuCategories() {
	try {
		const snap = await getDocs(collection(db, 'menu'))
		let cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
		try {
			const appearanceRef = doc(db, 'miscellaneous', 'appearance')
			const appSnap = await getDoc(appearanceRef)
			if (appSnap.exists()) {
				const data = appSnap.data()
				if (Array.isArray(data.categoriesOrder) && data.categoriesOrder.length) {
					const orderMap = new Map(data.categoriesOrder.map((id, idx) => [id, idx]))
					cats.sort((a,b) => {
						const ai = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER
						const bi = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER
						if (ai === bi) return a.id.localeCompare(b.id)
						return ai - bi
					})
				}
			}
		} catch { /* ignore categories appearance ordering */ }
		return cats
	} catch (err) {
		console.error('[firestore] fetchMenuCategories failed:', err)
		return []
	}
}

export async function upsertMenuCategory(name) {
	const ref = doc(db, 'menu', name)
	await setDoc(ref, {}, { merge: true })
	return name
}

export async function appendMenuItems(categoryName, items) {
	const ref = doc(db, 'menu', categoryName)
	await setDoc(ref, {}, { merge: true })
	for (const it of items) {
		const rate = toMoney(it.rate ?? it.price)
		const mrp = toMoney(it.mrp ?? it.MRP)
		const discountSource = it.discountPercent ?? it.discount
		const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
		const discount = toDiscount(discountSource ?? derivedDiscount)
		const item = { name: it.name, veg: it.veg === false ? false : true }
		if (rate !== null) item.rate = rate
		if (mrp !== null) item.mrp = mrp
		if (discount !== null) item.discountPercent = discount
		if (it.active === false) item.active = false
		if (it.imageId) item.imageId = it.imageId
		if (it.needsReview) item.needsReview = true
		await setDoc(ref, { items: arrayUnion(item) }, { merge: true })
	}
	return true
}

export async function addMenuItems(categoryName, rawItems) {
	if (!Array.isArray(rawItems) || rawItems.length === 0) return { added: 0, skipped: 0 }
	const ref = doc(db, 'menu', categoryName)
	const snap = await getDoc(ref)
	const existing = snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : []
	const existingNames = new Set(existing.map(i => (i.name || '').trim().toLowerCase()))
	const toAdd = []
	let skipped = 0
	for (const r of rawItems) {
		const name = (r.name || '').trim()
		if (!name) { skipped++; continue }
		const key = name.toLowerCase()
		if (existingNames.has(key)) { skipped++; continue }
		existingNames.add(key)
		const rate = toMoney(r.rate ?? r.price)
		const mrp = toMoney(r.mrp ?? r.MRP)
		const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
		const discount = toDiscount(r.discountPercent ?? derivedDiscount)
		const item = { name, veg: r.veg === false ? false : true }
		if (rate !== null) item.rate = rate
		if (mrp !== null) item.mrp = mrp
		if (r.needsReview) item.needsReview = true
		if (discount !== null) item.discountPercent = discount
		toAdd.push(item)
	}
	if (toAdd.length) {
		await appendMenuItems(categoryName, toAdd)
	} else {
		if (!snap.exists()) await setDoc(ref, {}, { merge: true })
	}
	return { added: toAdd.length, skipped }
}

export async function setMenuItems(categoryName, items) {
	const ref = doc(db, 'menu', categoryName)
	await setDoc(
		ref,
		{
			items: items.map((it) => ({
				name: it.name,
				...(() => {
					const rate = toMoney(it.rate ?? it.price)
					const mrp = toMoney(it.mrp ?? it.MRP)
					const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
					const discount = toDiscount(it.discountPercent ?? derivedDiscount)
					const base = {}
					if (rate !== null) base.rate = rate
					if (mrp !== null) base.mrp = mrp
					if (discount !== null) base.discountPercent = discount
					return base
				})(),
				veg: it.veg === false ? false : true,
				...(it.active === false ? { active: false } : {}),
				...(it.imageId ? { imageId: it.imageId } : {}),
				...(it.needsReview ? { needsReview: true } : {}),
				...(Array.isArray(it.components) && it.components.length
					? {
							components: it.components
								.filter((r) => r && (String(r.text || '').trim() || String(r.qty || '').trim() || String(r.unit || '').trim()))
								.map((r) => ({ qty: String(r.qty || '').trim(), unit: String(r.unit || '').trim(), text: String(r.text || '').trim() })),
						}
					: {}),
				...(it.isCustom ? { isCustom: true } : {}),
				...(Array.isArray(it.variants) && it.variants.length
					? {
							variants: it.variants.map(v => ({
								name: String(v.name || '').trim(),
								...(Array.isArray(v.sizes)
									? {
										sizes: v.sizes.map(s => ({
											name: String(s.name || '').trim(),
											rate: Number(s.rate) || Number(s.price) || 0,
											mrp: Number(s.mrp) || null,
											discountPercent: Number(s.discountPercent) || null,
										})),
									}
									: {}),
							}))
						}
					: {}),
			})),
		},
		{ merge: true },
	)
	return true
}

export async function removeMenuItem(categoryName, itemName) {
	if (!categoryName || !itemName) return false
	const ref = doc(db, 'menu', categoryName)
	const snap = await getDoc(ref)
	if (!snap.exists()) return false
	const data = snap.data()
	const items = Array.isArray(data.items) ? data.items : []
	const idx = items.findIndex(it => (it.name || '').trim().toLowerCase() === itemName.trim().toLowerCase())
	if (idx === -1) return false
	const next = items.filter((_, i) => i !== idx)
	await setDoc(ref, { items: next }, { merge: true })
	return true
}

export async function renameMenuCategory(oldName, newName) {
	const from = String(oldName || '').trim()
	const to = String(newName || '').trim()
	if (!from || !to || from === to) return from
	const oldRef = doc(db, 'menu', from)
	const oldSnap = await getDoc(oldRef)
	const data = oldSnap.exists() ? oldSnap.data() : { items: [] }
	const items = Array.isArray(data.items) ? data.items : []
	const newRef = doc(db, 'menu', to)
	await setDoc(newRef, { items }, { merge: true })
	await deleteDoc(oldRef)
	return to
}

export async function migrateRemoveCategoryNameFields() {
	try {
		const snap = await getDocs(collection(db, 'menu'))
		const batch = writeBatch(db)
		let count = 0
		snap.forEach(d => {
			const data = d.data()
			const needsStrip = Object.prototype.hasOwnProperty.call(data, 'name') || Object.prototype.hasOwnProperty.call(data, 'merge')
			if (needsStrip) {
				const items = Array.isArray(data.items) ? data.items : []
				batch.set(doc(db, 'menu', d.id), { items }, { merge: false })
				count++
			}
		})
		if (count > 0) await batch.commit()
		return count
	} catch (err) {
		console.error('[firestore] migrateRemoveCategoryNameFields failed', err)
		return 0
	}
}

// ── Legacy menu item / category CRUD (menuItems & categories collections) ──
export async function fetchMenuItems(activeOnly = true) {
	try {
		const col = collection(db, 'menuItems')
		const q = activeOnly ? query(col, where('active', '==', true)) : col
		let snap = await getDocs(q)
		if (activeOnly && snap.empty) {
			snap = await getDocs(col)
		}
		return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
	} catch (err) {
		console.error('[firestore] fetchMenuItems failed:', err)
		return []
	}
}

export async function fetchItems() {
	try {
		const snap = await getDocs(collection(db, 'items'))
		return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
	} catch (err) {
		console.error('[firestore] fetchItems failed:', err)
		return []
	}
}

export async function addItem(item) {
	const { addDoc } = await import('firebase/firestore')
	return addDoc(collection(db, 'items'), {
		item_name: item.item_name,
		MRP: Number(item.MRP) || 0,
		GST: Number(item.GST) || 0,
		Discount: Number(item.Discount) || 0,
		createdAt: serverTimestamp(),
	})
}

export async function upsertCategory(id, data) {
	const ref = doc(db, 'categories', id)
	await setDoc(ref, { name: data.name, updatedAt: serverTimestamp() }, { merge: true })
	return id
}

export async function upsertMenuItem(id, data) {
	const ref = doc(db, 'menuItems', id)
	await setDoc(
		ref,
		{
			name: data.name,
			rate: Number(data.rate ?? data.price) || 0,
			categoryId: data.categoryId,
			active: data.active ?? true,
			desc: data.desc ?? '',
			image: data.image ?? '',
			updatedAt: serverTimestamp(),
			createdAt: data.createdAt || serverTimestamp(),
		},
		{ merge: true }
	)
	return id
}

export async function deleteMenuItem_legacy(id) {
	await deleteDoc(doc(db, 'menuItems', id))
}
