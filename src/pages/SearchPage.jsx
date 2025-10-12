import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchMenuCategories, fetchImagesByIds, fetchStoreStatus } from '../lib/data'
import { useEffect, useState } from 'react'
import MenuItemCard from '../components/MenuItemCard'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function SearchPage() {
  const q = useQuery().get('q') || ''
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([]) // flattened items with cat id
  const [imageMap, setImageMap] = useState({}) // { imageId: { data, mime } }
  const [storeOpen, setStoreOpen] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const cats = await fetchMenuCategories()
        const all = []
        cats.forEach(cat => {
          if (Array.isArray(cat.items)) {
            cat.items.forEach((it, idx) => all.push({
              id: `${cat.id}-${idx}-${(it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
              name: it.name,
              price: it.price,
              veg: it.veg === false ? false : true,
              active: it.active === false ? false : true,
              categoryId: cat.id,
              cat: cat.id,
              imageId: it.imageId || null,
              components: Array.isArray(it.components) ? it.components : [],
              isCustom: !!it.isCustom,
              desc: it.desc || '',
            }))
          }
        })
        const lower = q.trim().toLowerCase()
        const filtered = lower ? all.filter(it => (it.name || '').toLowerCase().includes(lower)) : []
        if (!cancelled) setResults(filtered)
        // Resolve store open flag
        fetchStoreStatus().then(s => { if (!cancelled) setStoreOpen(s.open !== false) })
        // Resolve images for filtered results only
        const imageIds = Array.from(new Set(filtered.map(i => i.imageId).filter(Boolean)))
        if (imageIds.length) {
          const map = await fetchImagesByIds(imageIds)
          if (!cancelled) setImageMap(map)
        } else {
          if (!cancelled) setImageMap({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [q])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Search results{q ? ` for "${q}"` : ''}</h1>
      {loading && <div className="loading loading-spinner loading-lg" />}
      {!loading && results.length === 0 && (
        <div className="opacity-60">No matching items.</div>
      )}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map(item => {
          const imgObj = item.imageId && imageMap[item.imageId]
          const imageUrl = imgObj ? `data:${imgObj.mime || 'image/png'};base64,${imgObj.data}` : undefined
          return (
            <MenuItemCard key={item.id} item={{ ...item, imageUrl, storeClosed: !storeOpen }} />
          )
        })}
      </div>
    </div>
  )
}
