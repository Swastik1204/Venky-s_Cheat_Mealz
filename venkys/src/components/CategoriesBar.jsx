// CategoriesBar — Horizontal scrollable category navigation strip
import { useRef, useState, useEffect, memo, useCallback } from 'react'

import { useNavigate, useLocation } from 'react-router-dom'

function CategoriesBarInner({ items = [] }) {
  const scrollerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [pulse, setPulse] = useState(true)
  // Hooks must be called unconditionally; render check happens later

  function scrollBy(direction = 1) {
    const el = scrollerRef.current
    if (!el) return
    const children = Array.from(el.children)
    if (!children.length) return
    // Estimate one logical step = first item width + gap
    const first = children[0]
    const second = children[1]
    const baseWidth = first.getBoundingClientRect().width
    let gap = 32 // default gap (approx 8 * 4) fallback
    if (second) {
      gap = Math.abs(second.getBoundingClientRect().right - first.getBoundingClientRect().left - baseWidth)
    }
    const step = Math.max(40, Math.min(baseWidth + gap, el.clientWidth * 0.7))
    const target = el.scrollLeft + direction * step
    el.scrollTo({ left: target, behavior: 'smooth' })
    // update arrows after motion using requestAnimationFrame for smoother updates
    requestAnimationFrame(updateArrows)
  }

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const tolerance = 12
    const atStart = el.scrollLeft <= tolerance
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance
    const canScroll = el.scrollWidth > el.clientWidth + 4
    setShowLeft(canScroll && !atStart)
    setShowRight(canScroll && !atEnd)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => updateArrows()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const t = setTimeout(() => setPulse(false), 2600)
    return () => { el.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); clearTimeout(t) }
  }, [])

  // Center active category when the hash changes (from search or nav)
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const hash = location.hash || ''
    if (!hash.startsWith('#')) return
    const id = hash.slice(1)
    const btn = el.querySelector(`[data-cat-id="${CSS.escape(id)}"]`)
    if (!btn) return
    const target = btn.offsetLeft + (btn.offsetWidth / 2) - (el.clientWidth / 2)
    const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
    el.scrollTo({ left: clamped, behavior: 'smooth' })
  }, [location.hash])

  // Wheel vertical -> horizontal mapping for easier navigation
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    function onWheel(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // translate vertical wheel to horizontal scroll
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Click + drag (pointer) support
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    let dragging = false
    let startX = 0
    let startScroll = 0
    function down(e) {
      dragging = true
      startX = e.clientX
      startScroll = el.scrollLeft
      el.classList.add('cursor-grabbing')
    }
    function move(e) {
      if (!dragging) return
      const dx = e.clientX - startX
      el.scrollLeft = startScroll - dx
    }
    function up() {
      dragging = false
      el.classList.remove('cursor-grabbing')
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointerleave', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointerleave', up)
    }
  }, [])

  if (!items.length) return null

  return (
    <div className="blend-panel strip-accent p-5 sm:p-6 md:p-7 relative border border-transparent">
      <h2 className="section-title text-2xl font-bold leading-snug text-primary mb-4 select-none pl-1">What's on your mind?</h2>
      {/* Overlay arrows */}
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollBy(-1)}
        aria-disabled={!showLeft}
        className={`group absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center
        transition-opacity duration-300 border
        ${showLeft ? 'opacity-95 cursor-pointer' : 'opacity-0 pointer-events-none'}
        ${pulse && showLeft ? 'animate-pulse' : ''}
        bg-gradient-to-br from-neutral/80 via-neutral/60 to-neutral/40 border-base-100/40 shadow-lg hover:shadow-xl`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7 text-base-100 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollBy(1)}
        aria-disabled={!showRight}
        className={`group absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center
        transition-opacity duration-300 border
        ${showRight ? 'opacity-95 cursor-pointer' : 'opacity-0 pointer-events-none'}
        ${pulse && showRight ? 'animate-pulse' : ''}
        bg-gradient-to-br from-neutral/80 via-neutral/60 to-neutral/40 border-base-100/40 shadow-lg hover:shadow-xl`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7 text-base-100 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
      </button>
      <div
        ref={scrollerRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pt-4 pb-3 snap-x snap-mandatory -mx-2 px-2 [scrollbar-width:none] [-ms-overflow-style:none] no-scrollbar scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            data-cat-id={it.id}
            onClick={(e) => {
              e.preventDefault()
              // Center this item in view immediately for snappy UX
              const el = scrollerRef.current
              const btn = el?.querySelector(`[data-cat-id="${CSS.escape(it.id)}"]`)
              if (el && btn) {
                const target = btn.offsetLeft + (btn.offsetWidth / 2) - (el.clientWidth / 2)
                const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
                el.scrollTo({ left: clamped, behavior: 'smooth' })
              }
              
              // Fade-Jump-Fade transition to hide the scroll
              const section = document.getElementById(it.id)
              if (section) {
                const mainEl = document.querySelector('main')
                if (mainEl) {
                  // 1. Fade out
                  mainEl.style.transition = 'opacity 200ms ease-out'
                  mainEl.style.opacity = '0'
                  
                  setTimeout(() => {
                    // 2. Jump instantly
                    const headerOffset = 100 // Navbar height + buffer
                    const elementPosition = section.getBoundingClientRect().top + window.pageYOffset
                    window.scrollTo({ top: elementPosition - headerOffset, behavior: 'auto' })
                    
                    // 3. Fade in
                    requestAnimationFrame(() => {
                      mainEl.style.opacity = '1'
                      setTimeout(() => {
                        mainEl.style.transition = ''
                      }, 200)
                    })
                  }, 200)
                } else {
                  // Fallback if main not found
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                
                // Update URL silently without triggering hashchange jump
                window.history.pushState(null, '', `#${it.id}`)
              }
            }}
            className="flex flex-col items-center gap-2 min-w-24 sm:min-w-28 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          >
            <div className="avatar">
              <div className="w-20 sm:w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-200 flex items-center justify-center transition hover:scale-[1.03]">
                {it.image ? (
                  <img src={it.image} alt={it.label} loading="eager" decoding="sync" fetchPriority="high" />
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {(it.label || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs sm:text-sm font-medium text-center truncate w-24 sm:w-28">{it.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Keep active category centered when hash changes externally (e.g., from search or back/forward)
// Note: external hook removed to satisfy react-refresh/only-export-components rule,
// and because it was unused across the codebase.

// Memoize the component to prevent re-renders when parent state changes
const CategoriesBar = memo(CategoriesBarInner, (prev, next) => {
  if (prev.items.length !== next.items.length) return false
  return prev.items.every((item, i) => {
    const nextItem = next.items[i]
    return item.id === nextItem.id && item.label === nextItem.label && item.image === nextItem.image
  })
})

export default CategoriesBar
