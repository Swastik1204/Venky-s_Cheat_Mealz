import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useState } from 'react'
import { MdOutlineRestaurant } from 'react-icons/md'

export default function MenuItemCard({ item }) {
  const { add } = useCart()
  const { openItem } = useUI()
  const [imgError, setImgError] = useState(false)
  const img = (!imgError && (item.imageUrl || item.img)) || null
  const rating = item.rating
  const discount = item.discount || item.offer // optional fields
  const etaMin = item.eta || item.time || item.duration || 25 // fallback ETA

  return (
    <div className="group relative rounded-2xl border border-base-300/40 bg-base-100 p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      <div className="relative cursor-pointer overflow-hidden rounded-xl aspect-[4/3] bg-base-200" onClick={() => openItem(item)}>
        {img ? (
          <img
            src={img}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-base-content/40">
            <MdOutlineRestaurant className="w-14 h-14" />
          </div>
        )}
        {/* Veg / Non-Veg marker */}
        <div className="absolute top-2 right-2" title={item.veg !== false ? 'Vegetarian' : 'Non-Vegetarian'}>
          {item.veg !== false ? (
            <span className="w-5 h-5 rounded-sm border-2 border-green-600 bg-white/70 dark:bg-base-100/70 backdrop-blur relative inline-block shadow-sm">
              <span className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-green-600" />
            </span>
          ) : (
            <span className="w-5 h-5 rounded-sm border-2 border-rose-600 bg-white/70 dark:bg-base-100/70 backdrop-blur relative inline-block shadow-sm">
              <span className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-rose-600" />
            </span>
          )}
        </div>
        {discount && (
          <span className="absolute left-2 bottom-2 bg-blue-600/95 text-white text-[11px] font-semibold tracking-wide px-2 py-1 rounded shadow-md">
            {String(discount).toUpperCase()}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg leading-snug line-clamp-1">{item.name}</h3>
        {rating && (
          <span className="inline-flex items-center gap-[2px] bg-green-700 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
            {Number(rating).toFixed(1)}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
          </span>
        )}
      </div>

      {item.desc && (
        <p className="text-sm text-base-content/70 line-clamp-1">{item.desc}</p>
      )}
      <div className="flex items-center justify-between text-sm text-base-content/70">
        <span>₹{item.price} <span className="opacity-70">for one</span></span>
        <span>{etaMin} min</span>
      </div>
      <div className="flex gap-2 pt-1">
        <button className="btn btn-outline btn-primary btn-sm" onClick={() => openItem(item)}>View</button>
        <button className="btn btn-secondary btn-sm" onClick={() => add(item)}>Add</button>
      </div>
    </div>
  )
}
