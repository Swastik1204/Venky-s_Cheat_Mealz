import { useEffect, useRef, useState } from 'react'
import { MdSort } from 'react-icons/md'

const SORT_OPTIONS = [
  { key: 'default', label: 'Default' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name-asc', label: 'Name: A to Z' },
  { key: 'name-desc', label: 'Name: Z to A' },
]

export default function FilterBar({ vegFilter = 'all', onVegChange, sortBy = 'default', onSortChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const toggleRef = useRef(null)
  // Close when clicking outside
  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4" ref={wrapRef}>
      {/* Veg filter group */}
      <div className="join rounded-lg shadow-sm overflow-hidden border border-primary/60 bg-base-100/40 backdrop-blur-sm">
        <button
          className={`btn btn-sm join-item ${vegFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onVegChange && onVegChange('all')}
        >All</button>
        <button
          className={`btn btn-sm join-item ${vegFilter === 'veg' ? 'btn-success' : 'btn-ghost'}`}
          onClick={() => onVegChange && onVegChange('veg')}
        >Veg</button>
        <button
          className={`btn btn-sm join-item ${vegFilter === 'nonveg' ? 'btn-error' : 'btn-ghost'}`}
          onClick={() => onVegChange && onVegChange('nonveg')}
        >Non-Veg</button>
      </div>

      {/* Sort dropdown */}
      <div className={`dropdown dropdown-end ${open ? 'dropdown-open' : ''}`}>
        <button ref={toggleRef} className="btn btn-sm btn-ghost gap-2" aria-label="Sort items" title="Sort items" onClick={() => setOpen(o => !o)} onBlur={(e)=>{
          // If focus left the dropdown entirely, close it
          const next = e.relatedTarget
          if (!wrapRef.current?.contains(next)) setOpen(false)
        }}>
          <MdSort className="w-4 h-4" />
          <span className="hidden sm:inline">Sort</span>
          <span className="badge badge-ghost badge-sm ml-1 hidden md:inline">{SORT_OPTIONS.find(o => o.key === sortBy)?.label || 'Default'}</span>
        </button>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-56 border border-base-300/60">
          {SORT_OPTIONS.map(opt => (
            <li key={opt.key}>
              <button
                className={`justify-between ${sortBy === opt.key ? 'active font-semibold' : ''}`}
                onMouseDown={(e)=> e.preventDefault()}
                onClick={() => { onSortChange && onSortChange(opt.key); setOpen(false); try { toggleRef.current?.blur() } catch { /* noop */ } }}
              >
                {opt.label}
                {sortBy === opt.key && <span className="badge badge-primary badge-xs">Selected</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
