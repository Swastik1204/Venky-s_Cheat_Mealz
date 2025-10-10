import { useRef, useState, useEffect } from 'react'

export default function CategoriesBar({ items = [] }) {
  const scrollerRef = useRef(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [pulse, setPulse] = useState(true)
  if (!items.length) return null

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
      gap = Math.abs(second.getBoundingClientRect().left - first.getBoundingClientRect().right)
    }
    const step = Math.max(40, Math.min(baseWidth + gap, el.clientWidth * 0.7))
    const target = el.scrollLeft + direction * step
    el.scrollTo({ left: target, behavior: 'smooth' })
    // update arrows after motion
    requestAnimationFrame(() => setTimeout(updateArrows, 350))
  }

  function updateArrows() {
    const el = scrollerRef.current
    if (!el) return
    const tolerance = 12
    const atStart = el.scrollLeft <= tolerance
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance
    const canScroll = el.scrollWidth > el.clientWidth + 4
    setShowLeft(canScroll && !atStart)
    setShowRight(canScroll && !atEnd)
  }

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

  return (
    <div className="strip strip-accent rounded-xl p-4 md:p-6 relative">
      <h2 className="section-title text-2xl font-bold leading-snug text-primary mb-4 select-none pl-1">What's on your mind?</h2>
      {/* Overlay arrows */}
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollBy(-1)}
        aria-disabled={!showLeft}
        className={`group absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center
        transition-all duration-300 border backdrop-blur-md
        ${showLeft ? 'opacity-95 cursor-pointer' : 'opacity-0 pointer-events-none'}
        ${pulse && showLeft ? 'animate-pulse' : ''}
        bg-gradient-to-br from-neutral/70 via-neutral/50 to-neutral/30 border-base-100/40 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7 text-base-100 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollBy(1)}
        aria-disabled={!showRight}
        className={`group absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center
        transition-all duration-300 border backdrop-blur-md
        ${showRight ? 'opacity-95 cursor-pointer' : 'opacity-0 pointer-events-none'}
        ${pulse && showRight ? 'animate-pulse' : ''}
        bg-gradient-to-br from-neutral/70 via-neutral/50 to-neutral/30 border-base-100/40 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7 text-base-100 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
      </button>
  {/* gradient edge fades (only appear when there is hidden overflow on that side) */}
  <div className={`pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-base-100 via-base-100/60 to-transparent rounded-l-xl transition-opacity duration-300 ${showLeft ? 'opacity-100' : 'opacity-0'}`} />
  <div className={`pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-base-100 via-base-100/60 to-transparent rounded-r-xl transition-opacity duration-300 ${showRight ? 'opacity-100' : 'opacity-0'}`} />
      <div
        ref={scrollerRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-3 snap-x snap-mandatory -mx-2 px-2 [scrollbar-width:none] [-ms-overflow-style:none] no-scrollbar scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((it, i) => (
          <a
            key={it.id}
            href={it.href || '#'}
            className="flex flex-col items-center gap-2 min-w-24 sm:min-w-28 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          >
            <div className="avatar">
              <div className="w-20 sm:w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-200 flex items-center justify-center transition hover:scale-[1.03]">
                {it.image ? (
                  <img src={it.image} alt={it.label} />
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {(it.label || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs sm:text-sm font-medium text-center truncate w-24 sm:w-28">{it.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
