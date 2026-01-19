import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'

export default function ItemModal() {
  const { selectedItem, closeItem } = useUI()
  const { add } = useCart()

  const formatMoney = (value) => {
    const num = Number(value)
    if (!Number.isFinite(num)) return '0'
    const rounded = Math.round(num * 100) / 100
    const str = rounded.toFixed(2)
    return str.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  }

  const open = Boolean(selectedItem)
  const displayImage = selectedItem && (selectedItem.imageUrl || selectedItem.image || selectedItem.img)
  const description = selectedItem && (selectedItem.desc || selectedItem.description)
  const components = selectedItem && Array.isArray(selectedItem.components) ? selectedItem.components : []
  const priceValue = selectedItem ? Number(selectedItem.price) : null
  const mrpValue = selectedItem ? Number(selectedItem.mrp) : null
  const discountPercent = selectedItem ? Number(selectedItem.discountPercent) : null
  const hasDiscount = Number.isFinite(discountPercent) && discountPercent > 0
  const discountLabel = hasDiscount
    ? `${(() => {
        const rounded = Math.round(discountPercent * 10) / 10
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '')
      })()}% off`
    : null
  const onAdd = () => {
    if (!selectedItem) {
      console.warn('ItemModal: Cannot add - no item selected')
      return
    }
    
    // Ensure we always have a stable id key (some callers may pass items without `id`).
    const resolvedId =
      selectedItem.id ||
      selectedItem.itemId ||
      selectedItem._id ||
      selectedItem.docId ||
      selectedItem.sku ||
      `${selectedItem.categoryId || ''}:${selectedItem.name || ''}`
    
    const itemToAdd = resolvedId && selectedItem.id !== resolvedId
      ? { ...selectedItem, id: resolvedId }
      : selectedItem
    
    console.log('ItemModal: Adding item to cart', { itemId: itemToAdd.id, itemName: itemToAdd.name })
    
    // Add the full item object so the cart has all fields
    add(itemToAdd)
    
    // Mark this item's info as seen so future adds skip the modal
    try {
      const key = itemToAdd.id || `${itemToAdd.categoryId || ''}:${itemToAdd.name}`
      const raw = localStorage.getItem('itemInfoSeen')
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) {
        if (!arr.includes(key)) arr.push(key)
        localStorage.setItem('itemInfoSeen', JSON.stringify(arr))
      } else {
        localStorage.setItem('itemInfoSeen', JSON.stringify([key]))
      }
    } catch (err) {
      console.error('ItemModal: Failed to mark item as seen', err)
    }
    
    closeItem()
  }

  return (
    <dialog id="item-detail-modal" className="modal" open={open}>
      <div className="modal-box">
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {displayImage ? (
                <img src={displayImage} alt={selectedItem.name} className="img-thumb" />
              ) : (
                <div className="img-thumb bg-base-200 grid place-items-center">🍽️</div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{selectedItem.name}</h3>
                <p className="opacity-70 text-sm mt-1">{description || 'Delicious and freshly prepared.'}</p>
                {components.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold mb-1">Includes</div>
                    <ul className="text-xs space-y-1">
                      {components.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 opacity-80">
                          <span className="min-w-[2.5rem] text-right tabular-nums">{(r.qty||'').toString()}</span>
                          <span className="min-w-[2.5rem] text-left opacity-70">{(r.unit||'').toString()}</span>
                          <span className="flex-1">{(r.text||'').toString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 flex items-baseline gap-2 font-semibold">
                  <span>₹{formatMoney(priceValue)}</span>
                  {Number.isFinite(mrpValue) && mrpValue > priceValue && (
                    <span className="text-sm line-through opacity-70">₹{formatMoney(mrpValue)}</span>
                  )}
                  {discountLabel && (
                    <span className="badge badge-success badge-sm">{discountLabel}</span>
                  )}
                </div>
                {selectedItem.veg !== undefined && (
                  <div className={`badge mt-2 ${selectedItem.veg ? 'badge-success' : 'badge-error'}`}>
                    {selectedItem.veg ? 'Veg' : 'Non-Veg'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={closeItem}>Close</button>
          <button className="btn btn-primary" onClick={onAdd}>Add to Cart</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={closeItem}>
        <button>close</button>
      </form>
    </dialog>
  )
}
