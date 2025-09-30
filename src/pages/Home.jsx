import { useEffect, useMemo, useState } from 'react'
import { fetchMenuCategories } from '../lib/data'
import MenuItemCard from '../components/MenuItemCard'
import FilterBar from '../components/FilterBar'
import CategoriesBar from '../components/CategoriesBar'


// Demo category bubbles (can be swapped with dynamic categories if images stored)
const demoCategories = [
  { id: 'rolls', label: 'Rolls', image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=300' },
  { id: 'snacks', label: 'Snacks', image: 'https://images.unsplash.com/photo-1478144592103-25e218a04891?q=80&w=300' },
  { id: 'main-course', label: 'Main Course', image: 'https://images.unsplash.com/photo-1605478217831-949d7a04a1ab?q=80&w=300' },
  { id: 'desserts', label: 'Desserts', image: 'https://images.unsplash.com/photo-1541976076758-347942db1970?q=80&w=300' },
  { id: 'beverages', label: 'Beverages', image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=300' },
]

export default function Home() {
  const [categories, setCategories] = useState([]) // docs from 'menu'
  const [menu, setMenu] = useState([]) // flattened items with categoryId
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return menu
    return menu.filter((m) => (m.name || '').toLowerCase().includes(term))
  }, [menu, q])

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
        <CategoriesBar items={demoCategories} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 mb-3" id="menu">
        <h2 className="section-title">Menu</h2>
      </div>
  <FilterBar />

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
