import { useEffect, useMemo, useState } from 'react'
import { fetchMenuCategories } from '../lib/data'
import MenuItemCard from '../components/MenuItemCard'
import FilterBar from '../components/FilterBar'
import CategoriesBar from '../components/CategoriesBar'


// CategoriesBar will be populated dynamically from Firestore categories

export default function Home() {
  const [categories, setCategories] = useState([]) // docs from 'menu'
  const [menu, setMenu] = useState([]) // flattened items with categoryId
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [vegFilter, setVegFilter] = useState('all') // all | veg | nonveg

  useEffect(() => {
    let mounted = true
    fetchMenuCategories()
      .then((docs) => {
        if (!mounted) return
        // Normalize categories: id = doc id, name field optional
        const cats = docs.map((d) => ({ id: d.id, name: d.name || d.id, items: Array.isArray(d.items) ? d.items : [] }))
        // Flatten items and attach categoryId
        const flat = cats.flatMap((c) =>
          c.items.map((it, idx) => ({
            id: `${c.id}-${idx}-${(it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: it.name,
            price: it.price,
            categoryId: c.id,
            category: c.id,
          }))
        )
        setCategories(cats)
        setMenu(flat)
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  // Map Firestore categories to CategoriesBar items (id, label, optional href)
  const categoryBarItems = useMemo(() =>
    categories.map((c) => ({ id: c.id, label: c.name, href: `#${c.id}` })),
    [categories]
  )

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return menu.filter((m) => {
      if (term && !(m.name || '').toLowerCase().includes(term)) return false
      if (vegFilter === 'veg') return m.veg !== false // treat undefined as veg
      if (vegFilter === 'nonveg') return m.veg === false
      return true
    })
  }, [menu, q, vegFilter])

  if (loading) {
    return (
      <div className="page-wrap py-10">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap py-6">
      <div className="mt-2">
        <CategoriesBar items={categoryBarItems} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 mb-3" id="menu">
        <h2 className="section-title">Menu</h2>
      </div>
  <FilterBar vegFilter={vegFilter} onVegChange={setVegFilter} />

      {categories.length > 0 ? (
        categories.map((cat) => (
          <section key={cat.id} className="mb-10" id={cat.id}>
            <h3 className="text-2xl font-bold mb-4">{cat.name}</h3>
            <div className="menu-grid">
              {filtered
                .filter((m) => m.categoryId === cat.id)
                .map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
            </div>
          </section>
        ))
      ) : (
        <section className="mb-10" id="all-items">
          <h3 className="text-2xl font-bold mb-4">All items</h3>
          <div className="menu-grid">
            {filtered.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
