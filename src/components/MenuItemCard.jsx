import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useState } from 'react'
import { FaLeaf } from 'react-icons/fa'
import { GiChickenLeg } from 'react-icons/gi'
import { MdOutlineRestaurant } from 'react-icons/md'

export default function MenuItemCard({ item }) {
  const { add } = useCart()
  const { openItem } = useUI()
  const [imgError, setImgError] = useState(false)
  const img = (!imgError && (item.imageUrl || item.img)) || null

  return (
    <div className="group relative rounded-lg overflow-hidden border bg-base-100/60 hover:shadow transition flex flex-col">
      {/* Veg / Non-Veg icon */}
      <div className="absolute top-2 right-2 z-10 text-xl" title={item.veg ? 'Vegetarian' : 'Non-Vegetarian'}>
        {item.veg ? (
          <FaLeaf className="text-green-600 drop-shadow" />
        ) : (
          <GiChickenLeg className="text-rose-600 drop-shadow" />
        )}
      </div>
      <div className="relative cursor-pointer" onClick={() => openItem(item)}>
        {img ? (
          <img
            src={img}
            alt={item.name}
            className="w-full h-64 object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-64 bg-base-200 grid place-items-center text-base-content/40">
            <MdOutlineRestaurant className="w-14 h-14" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-lg leading-snug line-clamp-2">{item.name}</h3>
        {item.desc && <p className="text-sm opacity-80 line-clamp-3">{item.desc}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-semibold">₹{item.price}</span>
          <div className="join">
            <button className="btn btn-ghost btn-sm join-item" onClick={() => openItem(item)}>View</button>
            <button className="btn btn-primary btn-sm join-item" onClick={() => add(item)}>Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}
