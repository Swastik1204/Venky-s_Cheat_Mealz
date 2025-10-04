import { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { fetchMenuCategories } from '../lib/data'
import { useEffect, useState } from 'react'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function SearchPage() {
  const q = useQuery().get('q') || ''
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const cats = await fetchMenuCategories()
        const all = []
        cats.forEach(cat => {
          if (Array.isArray(cat.items)) {
            cat.items.forEach(it => all.push({ ...it, cat: cat.id }))
          }
        })
        const lower = q.trim().toLowerCase()
        const filtered = lower ? all.filter(it => it.name.toLowerCase().includes(lower)) : []
        if (!cancelled) setResults(filtered)
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
        {results.map(r => (
          <div key={r.cat + ':' + r.name} className="border border-base-300/60 rounded-xl p-4 bg-base-100/70 backdrop-blur flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="truncate" title={r.name}>{r.name}</span>
              {r.veg !== false ? (
                <span className="w-4 h-4 rounded-sm border-2 border-green-600 relative" title="Veg" aria-label="Veg"><span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-green-600" style={{top:0,bottom:0,left:0,right:0}} /></span>
              ) : (
                <span className="w-4 h-4 rounded-sm border-2 border-rose-600 relative" title="Non-Veg" aria-label="Non-Veg"><span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-rose-600" style={{top:0,bottom:0,left:0,right:0}} /></span>
              )}
            </div>
            <div className="text-xs opacity-60">{r.cat}</div>
            {r.price !== undefined && r.price !== '' && <div className="font-semibold">₹{r.price}</div>}
            <Link to={`/#${r.cat}`} className="btn btn-xs btn-primary mt-auto">Go to category</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
