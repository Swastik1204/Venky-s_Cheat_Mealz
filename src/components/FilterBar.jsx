export default function FilterBar({ onFilter }) {
  return (
    <div className="join mb-4">
      <button className="btn join-item">Filters</button>
      <button className="btn join-item">Pure Veg</button>
      <div className="dropdown join-item">
        <div tabIndex={0} role="button" className="btn">Cuisines</div>
        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 p-2 shadow">
          <li><button>North Indian</button></li>
          <li><button>Chinese</button></li>
          <li><button>Biryanis</button></li>
        </ul>
      </div>
    </div>
  )
}
