export default function FilterBar({ vegFilter = 'all', onVegChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="join">
        <button
          className={`btn btn-sm join-item ${vegFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onVegChange && onVegChange('all')}
        >All</button>
        <button
          className={`btn btn-sm join-item ${vegFilter === 'veg' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onVegChange && onVegChange('veg')}
        >Veg</button>
        <button
          className={`btn btn-sm join-item ${vegFilter === 'nonveg' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onVegChange && onVegChange('nonveg')}
        >Non-Veg</button>
      </div>
    </div>
  )
}
