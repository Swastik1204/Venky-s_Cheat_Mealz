export default function CategoriesBar({ items = [] }) {
  if (!items.length) return null
  return (
    <div className="strip">
      <h2 className="text-2xl font-bold mb-4 leading-snug">What's on your mind?</h2>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory -mx-2 px-2 [scrollbar-width:none] [-ms-overflow-style:none]" style={{ WebkitOverflowScrolling: 'touch' }}>
        {items.map((it) => (
          <a key={it.id} href={it.href || '#'} className="flex flex-col items-center gap-2 min-w-24 sm:min-w-28 snap-start">
            <div className="avatar">
              <div className="w-20 sm:w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-200 flex items-center justify-center">
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
