import { useState, useMemo, useRef, useEffect, memo } from 'react'
import { MdOutlineRestaurant, MdDelete, MdAdd, MdRemove } from 'react-icons/md'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'

const FIRST_ADD_STORAGE_KEY = 'venkys:first-add-shake'

function readFirstAddKeys() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FIRST_ADD_STORAGE_KEY)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function hasSeenFirstAdd(key) {
  if (!key) return false
  const list = readFirstAddKeys()
  return list.includes(key)
}

function markFirstAdd(key) {
  if (typeof window === 'undefined' || !key) return
  try {
    const list = readFirstAddKeys()
    if (list.includes(key)) return
    const recent = list.slice(-40)
    window.localStorage.setItem(FIRST_ADD_STORAGE_KEY, JSON.stringify([...recent, key]))
  } catch {
    /* noop */
  }
}

function MenuItemCardInner({ item }) {
  const { add, items, setQty, remove } = useCart()
  const { openItem } = useUI()
  const [imgError, setImgError] = useState(false)
  const [shakeActive, setShakeActive] = useState(false)
  const shakeTimerRef = useRef(null)
  const cardRef = useRef(null)
  const storageKey = item.id || `${item.categoryId || ''}:${item.name}`
  const qty = items[item.id]?.qty || 0
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) {
        clearTimeout(shakeTimerRef.current)
      }
    }
  }, [])
  const img = (!imgError && (item.imageUrl || item.image || item.img)) || null
  const rating = Number(item.rating)
  const components = useMemo(() => {
    if (!Array.isArray(item.components)) return []
    return item.components
      .filter(Boolean)
      .map((comp, idx) => {
        if (comp && typeof comp === 'object') {
          const text = String(comp.text || comp.label || comp.name || '') || ''
          const unit = comp.unit ? String(comp.unit) : ''
          const qty = comp.qty != null ? String(comp.qty) : ''
          const label = [text, qty && unit ? `${qty}${unit}` : qty || unit].filter(Boolean).join(' · ')
          return { key: comp.id || `${text}-${idx}`, label }
        }
        const label = String(comp)
        return { key: `${label}-${idx}`, label }
      })
      .filter(c => c.label)
      .slice(0, 2)
  }, [item.components])
  const formatMoney = (value) => {
    const num = Number(value)
    if (!Number.isFinite(num)) return '0'
    const rounded = Math.round(num * 100) / 100
    const str = rounded.toFixed(2)
    return str.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  }
  const discountPercent = Number(item.discountPercent)
  const hasDiscount = Number.isFinite(discountPercent) && discountPercent > 0
  const discountLabel = hasDiscount
    ? `-${(() => {
        const rounded = Math.round(discountPercent * 10) / 10
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '')
      })()}%`
    : null
  const mrp = Number(item.mrp)
  const showMrp = Number.isFinite(mrp) && mrp > Number(item.price)

  function handleAddClick(e) {
    if (item.storeClosed) return
    add(item)
    
    // Jump animation
    const btn = e.currentTarget
    btn.classList.add('animate-jump-cart')
    setTimeout(() => btn.classList.remove('animate-jump-cart'), 600)

    // Fly animation
    const card = cardRef.current
    const target = document.getElementById('cart-target-mobile') || document.querySelector('label[for="cart-drawer"]')
    
    if (card && target) {
      const cardRect = card.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      
      const clone = card.cloneNode(true)
      clone.style.position = 'fixed'
      clone.style.left = `${cardRect.left}px`
      clone.style.top = `${cardRect.top}px`
      clone.style.width = `${cardRect.width}px`
      clone.style.height = `${cardRect.height}px`
      clone.style.zIndex = '9999'
      clone.style.transition = 'all 1.5s cubic-bezier(0.2, 1, 0.3, 1)'
      clone.style.pointerEvents = 'none'
      clone.style.opacity = '0.8'
      clone.style.borderRadius = '1.5rem'
      
      document.body.appendChild(clone)
      
      // Force reflow
      void clone.offsetWidth
      
      const targetX = targetRect.left + targetRect.width / 2 - cardRect.width / 2
      const targetY = targetRect.top + targetRect.height / 2 - cardRect.height / 2
      
      clone.style.transform = `translate(${targetX - cardRect.left}px, ${targetY - cardRect.top}px) scale(0.1)`
      clone.style.opacity = '0'
      
      setTimeout(() => {
        clone.remove()
      }, 1500)
    }

    if (!hasSeenFirstAdd(storageKey)) {
      markFirstAdd(storageKey)
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current)
      setShakeActive(true)
      shakeTimerRef.current = setTimeout(() => setShakeActive(false), 700)
    }
  }

  const addCtaLabel = item.storeClosed ? 'Store closed' : 'Add to cart'

  return (
    <article ref={cardRef} className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-base-300/25 bg-base-100 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_26px_48px_-20px_rgba(239,68,68,0.35)] ${shakeActive ? 'animate-cart-shake' : ''}`}>
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
      <div className="relative m-4 overflow-hidden rounded-2xl border border-base-300/20 bg-gradient-to-br from-base-200 via-base-100/60 to-base-100 cursor-pointer" onClick={() => openItem(item)}>
        <div className="relative aspect-[5/4] cursor-pointer">
          {img ? (
            <img
              src={img}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-base-content/40">
              <MdOutlineRestaurant className="h-16 w-16" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-content/20 via-transparent to-transparent opacity-80 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <div title={item.veg !== false ? 'Vegetarian' : 'Non-Vegetarian'}>
              {item.veg !== false ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 border-green-600 bg-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                </span>
              ) : (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 border-rose-600 bg-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                </span>
              )}
            </div>
            {Number.isFinite(rating) && rating > 0 && (
              <span className="inline-flex items-center gap-[3px] rounded-full bg-green-600/90 px-2 py-1 text-[11px] font-semibold text-white shadow-md">
                {rating.toFixed(1)}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
          </div>
          {discountLabel && (
            <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-secondary/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-100 shadow">
              {discountLabel}
            </span>
          )}
          {item.storeClosed && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-base-content/80 text-sm font-semibold uppercase tracking-[0.22em] text-base-100">
              Closed
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
        <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => openItem(item)}>
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-1 text-lg font-semibold text-base-content">{item.name}</h3>
            {item.desc ? (
              <p className="text-sm leading-relaxed text-base-content/70 line-clamp-2">{item.desc}</p>
            ) : null}
          </div>
        </div>

        {components.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 cursor-pointer" onClick={() => openItem(item)}>
            {components.map((comp) => (
              <span key={comp.key} className="inline-flex items-center rounded-full bg-base-200/80 px-3 py-1 text-[11px] font-medium text-base-content/70">
                {comp.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold text-base-content">₹{formatMoney(item.price)}</span>
            {showMrp && <span className="text-sm line-through text-base-content/50">₹{formatMoney(mrp)}</span>}
            {discountLabel && (
              <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
                {discountLabel}
              </span>
            )}
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-base-content/50">for one</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm w-full px-1 text-xs"
              onClick={() => openItem(item)}
            >
              View details
            </button>
            {qty > 0 ? (
              <div className="flex items-center justify-between bg-base-200 rounded-lg p-1 h-8 w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                  type="button"
                  className={`btn btn-xs btn-ghost h-full aspect-square p-0 min-h-0 ${qty === 1 ? 'text-error hover:bg-error/10' : ''}`}
                  onClick={() => {
                    if (qty === 1) remove(item.id)
                    else setQty(item.id, qty - 1)
                  }}
                >
                  {qty === 1 ? <MdDelete className="w-4 h-4" /> : <MdRemove className="w-4 h-4" />}
                </button>
                <span className="text-sm font-bold tabular-nums">{qty}</span>
                <button 
                  type="button"
                  className="btn btn-xs btn-ghost h-full aspect-square p-0 min-h-0"
                  onClick={() => add(item)}
                >
                  <MdAdd className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm w-full shadow-md shadow-primary/20 px-1"
                disabled={item.storeClosed}
                title={addCtaLabel}
                onClick={handleAddClick}
              >
                {item.storeClosed ? 'Closed' : 'Add'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

// Memoize to prevent re-renders when parent state changes but item props don't
const MenuItemCard = memo(MenuItemCardInner, (prevProps, nextProps) => {
  const prev = prevProps.item
  const next = nextProps.item
  return (
    prev.id === next.id &&
    prev.price === next.price &&
    prev.imageUrl === next.imageUrl &&
    prev.storeClosed === next.storeClosed &&
    prev.active === next.active
  )
})

export default MenuItemCard
