import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'

export default function ItemModal() {
  const { selectedItem, closeItem } = useUI()
  const { add } = useCart()

  const open = Boolean(selectedItem)
  const displayImage = selectedItem && (selectedItem.imageUrl || selectedItem.image || selectedItem.img)
  const description = selectedItem && (selectedItem.desc || selectedItem.description)
  const onAdd = () => {
    if (!selectedItem) return
    // Add the full item object so the cart has all fields
    add(selectedItem)
    // Mark this item's info as seen so future adds skip the modal
    try {
      const key = selectedItem.id || `${selectedItem.categoryId || ''}:${selectedItem.name}`
      const raw = localStorage.getItem('itemInfoSeen')
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) {
        if (!arr.includes(key)) arr.push(key)
        localStorage.setItem('itemInfoSeen', JSON.stringify(arr))
      } else {
        localStorage.setItem('itemInfoSeen', JSON.stringify([key]))
      }
    } catch {}
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
                <div className="mt-2 font-semibold">₹{selectedItem.price}</div>
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
