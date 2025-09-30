import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'

export default function MenuItemCard({ item }) {
  const { add } = useCart()
  const { openItem } = useUI()
  const img = item.imageUrl || item.img
  return (
    <div className="card card-surface">
      {img && (
        <figure onClick={() => openItem(item)} className="cursor-pointer">
          <img src={img} alt={item.name} className="h-40 w-full object-cover" />
        </figure>
      )}
      <div className="card-body">
        <h3 className="card-title">
          {item.name}
          {item.veg ? (
            <span className="badge badge-success">Veg</span>
          ) : (
            <span className="badge badge-error">Non-Veg</span>
          )}
        </h3>
        {item.desc && <p className="text-sm opacity-80">{item.desc}</p>}
        <div className="card-actions justify-between items-center mt-2">
          <span className="font-semibold">₹{item.price}</span>
          <div className="join">
            <button className="btn btn-ghost btn-sm join-item" onClick={() => openItem(item)}>View</button>
            <button className="btn btn-primary btn-sm join-item" onClick={() => add(item)}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
