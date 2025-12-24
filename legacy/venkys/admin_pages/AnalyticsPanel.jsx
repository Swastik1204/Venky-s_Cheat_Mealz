import { useEffect, useMemo, useState } from 'react'
import { fetchAllOrders, fetchMenuCategories } from '../../lib/data'

export default function AnalyticsPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [R, setR] = useState(null) // Recharts (lazy)
  // Date filtering
  const [preset, setPreset] = useState('overall') // overall | today | yesterday | last7 | custom
  const [customFrom, setCustomFrom] = useState('') // yyyy-mm-dd
  const [customTo, setCustomTo] = useState('') // yyyy-mm-dd
  // Categories for mapping item -> category
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let active = true
    // Lazy load charting lib only for analytics
    import('recharts').then((mod) => { if (active) setR(mod) }).catch(()=>{})
    async function load() {
      try {
        setLoading(true)
        const res = await fetchAllOrders()
        if (!active) return
        if (res && res.__error) {
          setError(res.__error)
          setOrders(res.list || [])
        } else if (Array.isArray(res)) {
          setOrders(res)
        } else if (res && Array.isArray(res.list)) {
          setOrders(res.list)
        } else {
          setOrders([])
        }
      } finally { if (active) setLoading(false) }
    }
    load()
    const id = setInterval(load, 15000)
    return () => { active = false; clearInterval(id) }
  }, [])

  // Load menu categories for category-wise grouping
  useEffect(() => {
    let ok = true
    fetchMenuCategories().then((cats) => { if (ok) setCategories(Array.isArray(cats) ? cats : []) }).catch(()=>{})
    return () => { ok = false }
  }, [])

  // Range helpers
  const range = useMemo(() => {
    const now = new Date()
    const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    if (preset === 'overall') {
      return { start: null, end: null, label: 'Overall' }
    }
    if (preset === 'today') {
      const start = atMidnight(now)
      return { start, end: endOfDay(now), label: 'Today' }
    }
    if (preset === 'yesterday') {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { start: atMidnight(y), end: endOfDay(y), label: 'Yesterday' }
    }
    if (preset === 'last7') {
      const end = endOfDay(now)
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      return { start: atMidnight(start), end, label: 'Last 7 days' }
    }
    // custom
    const parse = (s, end = false) => {
      if (!s) return null
      const [Y, M, D] = s.split('-').map((x) => Number(x))
      if (!Y || !M || !D) return null
      return end ? new Date(Y, M - 1, D, 23, 59, 59, 999) : new Date(Y, M - 1, D)
    }
    const start = parse(customFrom, false)
    const end = parse(customTo, true)
    if (start && end && start <= end) {
      return { start, end, label: `${customFrom} → ${customTo}` }
    }
    return { start: null, end: null, label: 'Custom' }
  }, [preset, customFrom, customTo])

  const rangedOrders = useMemo(() => {
    if (!range.start || !range.end) return orders
    return orders.filter((o) => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
      if (!ts) return false
      return ts >= range.start && ts <= range.end
    })
  }, [orders, range])

  const kpis = useMemo(() => {
    const totalOrders = rangedOrders.length
    let revenue = 0
    let itemsSold = 0
    let customers = new Set()
    rangedOrders.forEach(o => {
      revenue += Number(o.subtotal) || 0
      ;(o.items||[]).forEach(it => { itemsSold += Number(it.qty)||0 })
      if (o.customer?.phone) customers.add(o.customer.phone)
      else if (o.userId) customers.add(o.userId)
    })
    const aov = totalOrders ? revenue / totalOrders : 0
    return {
      totalOrders,
      revenue,
      itemsSold,
      uniqueCustomers: customers.size,
      aov,
    }
  }, [rangedOrders])

  const series = useMemo(() => {
    // Group by day (local time) for last 30 days
    const map = new Map()
    const startBase = range.start || (() => { const n = new Date(); n.setDate(n.getDate()-29); return new Date(n.getFullYear(), n.getMonth(), n.getDate()) })()
    const endBase = range.end || new Date()
    const from = new Date(startBase.getFullYear(), startBase.getMonth(), startBase.getDate())
    const now = new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate())
    for (let d = new Date(from); d <= now; d.setDate(d.getDate()+1)) {
      const key = d.toISOString().slice(0,10)
      map.set(key, { date: key, revenue: 0, orders: 0 })
    }
    rangedOrders.forEach(o => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000) : new Date()
      const key = ts.toISOString().slice(0,10)
      if (!map.has(key)) return
      const row = map.get(key)
      row.orders += 1
      row.revenue += Number(o.subtotal)||0
    })
    return Array.from(map.values())
  }, [rangedOrders, range])

  const pies = useMemo(() => {
    const byStatus = new Map()
    const byPayment = new Map()
    rangedOrders.forEach(o => {
      const st = o.status || 'unknown'
      byStatus.set(st, (byStatus.get(st)||0)+1)
      const pm = o.payment?.method || 'cod'
      byPayment.set(pm, (byPayment.get(pm)||0)+1)
    })
    const toArray = (m) => Array.from(m.entries()).map(([name, value]) => ({ name, value }))
    return { status: toArray(byStatus), payment: toArray(byPayment) }
  }, [rangedOrders])

  const topItems = useMemo(() => {
    const byItem = new Map()
    rangedOrders.forEach(o => (o.items||[]).forEach(it => byItem.set(it.name || it.id || 'Unknown', (byItem.get(it.name || it.id || 'Unknown')||0) + (Number(it.qty)||0))))
    const arr = Array.from(byItem.entries()).map(([name, qty]) => ({ name, qty }))
    arr.sort((a,b)=> b.qty - a.qty)
    return arr.slice(0, 10)
  }, [rangedOrders])

  const perHour = useMemo(() => {
    const arr = new Array(24).fill(0)
    rangedOrders.forEach(o => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000) : null
      if (!ts) return
      arr[ts.getHours()] += 1
    })
    return arr
  }, [rangedOrders])

  const palette = ['#fbbf24','#ef4444','#10b981','#3b82f6','#a855f7','#f59e0b','#22c55e','#06b6d4','#fb7185']
  const hash = (s) => {
    let h = 0
    const str = String(s || '')
    for (let i=0; i<str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
    return h
  }
  const colorFor = (name, offset = 0) => palette[(hash(name) + offset) % palette.length]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <span className="text-xs opacity-70">{range.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="join">
            <button className={`btn btn-xs join-item ${preset==='today'?'btn-primary':''}`} onClick={()=>setPreset(p=> p==='today' ? 'overall' : 'today')}>Today</button>
            <button className={`btn btn-xs join-item ${preset==='yesterday'?'btn-primary':''}`} onClick={()=>setPreset(p=> p==='yesterday' ? 'overall' : 'yesterday')}>Yesterday</button>
            <button className={`btn btn-xs join-item ${preset==='last7'?'btn-primary':''}`} onClick={()=>setPreset(p=> p==='last7' ? 'overall' : 'last7')}>Last 7d</button>
            <button className={`btn btn-xs join-item ${preset==='custom'?'btn-primary':''}`} onClick={()=>setPreset(p=> p==='custom' ? 'overall' : 'custom')}>Custom</button>
          </div>
          {preset==='custom' && (
            <div className="join">
              <input type="date" className="input input-bordered input-xs join-item" value={customFrom} onChange={(e)=> setCustomFrom(e.target.value)} />
              <span className="btn btn-ghost btn-xs join-item">→</span>
              <input type="date" className="input input-bordered input-xs join-item" value={customTo} onChange={(e)=> setCustomTo(e.target.value)} />
            </div>
          )}
          {loading && <span className="loading loading-spinner loading-sm" />}
        </div>
      </div>
      {error && <div className="alert alert-warning text-sm">Some analytics may be limited by permissions.</div>}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Revenue" value={`₹${Math.round(kpis.revenue)}`} sub={kpis.totalOrders?`AOV ₹${Math.round(kpis.aov)}`:'—'} />
        <KpiCard label="Orders" value={kpis.totalOrders} sub={`${kpis.itemsSold} items`} />
        <KpiCard label="Customers" value={kpis.uniqueCustomers} sub="unique" />
        <KpiCard label="Items Sold" value={kpis.itemsSold} sub="total" />
      </div>

      {/* Charts: only render when Recharts loaded */}
      {!R && (
        <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70 text-sm opacity-70">Loading charts…</div>
      )}
      {R && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
            <h3 className="font-semibold mb-2">Revenue over time</h3>
            <R.ResponsiveContainer width="100%" height={260}>
              <R.LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                <R.CartesianGrid strokeDasharray="3 3" />
                <R.XAxis dataKey="date" tick={{ fontSize: 11 }} hide />
                <R.YAxis tick={{ fontSize: 11 }} width={40} />
                <R.Tooltip formatter={(v)=>`₹${Math.round(v)}`} labelFormatter={(d)=>d} />
                <R.Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <R.Bar dataKey="orders" fill="#3b82f6" barSize={14} cursor="default" />
              </R.LineChart>
            </R.ResponsiveContainer>
          </div>
          <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
            <h3 className="font-semibold mb-2">Top Items (qty)</h3>
            <R.ResponsiveContainer width="100%" height={260}>
              <R.BarChart data={topItems} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                <R.CartesianGrid strokeDasharray="3 3" />
                <R.XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
                <R.YAxis width={32} />
                <R.Tooltip />
                <R.Bar dataKey="qty" fill="#10b981" cursor="default" />
              </R.BarChart>
            </R.ResponsiveContainer>
          </div>
          <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
            <h3 className="font-semibold mb-2">Payment Methods</h3>
            <R.ResponsiveContainer width="100%" height={240}>
              <R.PieChart>
                <R.Pie data={pies.payment} dataKey="value" nameKey="name" outerRadius={90} cursor="default">
                  {pies.payment.map((row, i) => <R.Cell key={i} fill={colorFor(row.name, 0)} />)}
                </R.Pie>
                <R.Tooltip formatter={(v, n)=>[`₹${Math.round(Number(v)||0)}`, n]} />
              </R.PieChart>
            </R.ResponsiveContainer>
            <PieLegend data={pies.payment} colorFor={(n)=>colorFor(n,0)} />
          </div>
          <CategorySalesPie orders={rangedOrders} categories={categories} colorFor={colorFor} R={R} />
        </div>
      )}

      {/* Hour-of-day heatmap (simple grid) */}
      <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
  <h3 className="font-semibold mb-3">Orders by Hour ({preset==='yesterday'?'yesterday': preset==='today'?'today': preset==='overall'?'overall':'by hour (range)'})</h3>
        <div className="grid grid-cols-12 gap-1">
          {perHour.map((v, i) => (
            <div key={i} className="h-8 rounded" title={`${i}:00 - ${v} orders`} style={{ background: `rgba(59,130,246, ${Math.min(0.1 + v/10, 0.95)})` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] opacity-70">
          <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub }) {
  return (
    <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold leading-tight">{value}</div>
      {sub && <div className="text-[11px] opacity-60">{sub}</div>}
    </div>
  )
}

function PieLegend({ data, colorFor }) {
  if (!Array.isArray(data) || data.length === 0) return null
  const total = data.reduce((n, r)=> n + (r.value || 0), 0) || 1
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {data.map((r) => (
        <span key={r.name} className="inline-flex items-center gap-2 px-2 py-1 rounded border border-base-300/60 bg-base-100/60">
          <span className="w-3 h-3 rounded" style={{ background: colorFor(r.name) }} />
          <span className="font-medium">{r.name}</span>
          <span className="opacity-60">{r.value} ({Math.round((r.value/total)*100)}%)</span>
        </span>
      ))}
    </div>
  )
}

function CategorySalesPie({ orders, categories, colorFor, R }) {
  // Build item -> category map from categories structure { id, items[] }
  const itemToCat = useMemo(() => {
    const map = new Map()
    ;(categories||[]).forEach(c => {
      const items = Array.isArray(c.items) ? c.items : []
      items.forEach(it => {
        const key = String(it.name || it.id || '').trim().toLowerCase()
        if (key) map.set(key, c.id)
      })
    })
    return map
  }, [categories])

  const data = useMemo(() => {
    const byCat = new Map()
    ;(orders||[]).forEach(o => {
      (o.items||[]).forEach(it => {
        const key = String(it.name || it.id || '').trim().toLowerCase()
        const cat = itemToCat.get(key) || 'Uncategorized'
        const amount = (Number(it.price)||0) * (Number(it.qty)||0)
        byCat.set(cat, (byCat.get(cat)||0) + amount)
      })
    })
    return Array.from(byCat.entries()).map(([name, value]) => ({ name, value }))
  }, [orders, itemToCat])

  if (!R) return null
  return (
    <div className="p-4 rounded-xl border border-base-300/60 bg-base-100/70">
      <h3 className="font-semibold mb-2">Category-wise Sales</h3>
      <R.ResponsiveContainer width="100%" height={240}>
        <R.PieChart>
          <R.Pie data={data} dataKey="value" nameKey="name" outerRadius={90} cursor="default">
            {data.map((row, i) => <R.Cell key={i} fill={colorFor(row.name, 2)} />)}
          </R.Pie>
          <R.Tooltip formatter={(v, n)=>[`₹${Math.round(Number(v)||0)}`, n]} />
        </R.PieChart>
      </R.ResponsiveContainer>
      <PieLegend data={data} colorFor={(n)=>colorFor(n,2)} />
    </div>
  )
}
