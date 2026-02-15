import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import { fetchAllOrders, fetchMenuCategories } from '../lib/data'
import { MdArrowForward, MdTrendingUp, MdTrendingDown, MdAttachMoney, MdShoppingBag, MdPeople, MdInventory } from 'react-icons/md'

export default function Analytics() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [R, setR] = useState(null)
  const [preset, setPreset] = useState('today') // Default to Today for landing page feel
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let active = true
    import('recharts').then((mod) => { if (active) setR(mod) }).catch(()=>{})
    async function load() {
      try {
        setLoading(true)
        const res = await fetchAllOrders({ maxResults: null })
        if (!active) return
        const list = Array.isArray(res?.orders) ? res.orders : Array.isArray(res) ? res : []
        setOrders(list)
      } finally { if (active) setLoading(false) }
    }
    load()
    const id = setInterval(load, 30000) // Refresh every 30s
    return () => { active = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    let ok = true
    fetchMenuCategories().then((cats) => { if (ok) setCategories(Array.isArray(cats) ? cats : []) }).catch(()=>{})
    return () => { ok = false }
  }, [])

  const range = useMemo(() => {
    const now = new Date()
    const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    if (preset === 'overall') return { start: null, end: null, label: 'Overall' }
    if (preset === 'today') { const start = atMidnight(now); return { start, end: endOfDay(now), label: 'Today' } }
    if (preset === 'yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); return { start: atMidnight(y), end: endOfDay(y), label: 'Yesterday' } }
    if (preset === 'last7') { const end = endOfDay(now); const start = new Date(now); start.setDate(start.getDate() - 6); return { start: atMidnight(start), end, label: 'Last 7 days' } }
    const parse = (s, end = false) => {
      if (!s) return null
      const [Y, M, D] = s.split('-').map((x) => Number(x))
      if (!Y || !M || !D) return null
      return end ? new Date(Y, M - 1, D, 23, 59, 59, 999) : new Date(Y, M - 1, D)
    }
    const start = parse(customFrom, false)
    const end = parse(customTo, true)
    if (start && end && start <= end) return { start, end, label: `${customFrom} → ${customTo}` }
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
    return { totalOrders, revenue, itemsSold, uniqueCustomers: customers.size, aov }
  }, [rangedOrders])

  const series = useMemo(() => {
    const map = new Map()
    // If range is today, show hourly
    const isToday = preset === 'today'
    
    if (isToday) {
        for(let i=0; i<=23; i++) {
            map.set(i, { date: `${i}:00`, revenue: 0, orders: 0 })
        }
        rangedOrders.forEach(o => {
            const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000) : new Date()
            const h = ts.getHours()
            const row = map.get(h)
            row.orders += 1
            row.revenue += Number(o.subtotal)||0
        })
    } else {
        const startBase = range.start || (() => { const n = new Date(); n.setDate(n.getDate()-29); return new Date(n.getFullYear(), n.getMonth(), n.getDate()) })()
        const endBase = range.end || new Date()
        const from = new Date(startBase.getFullYear(), startBase.getMonth(), startBase.getDate())
        const now = new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate())
        for (let d = new Date(from); d <= now; d.setDate(d.getDate()+1)) {
            const key = d.toISOString().slice(0,10)
            map.set(key, { date: key.slice(5), revenue: 0, orders: 0 })
        }
        rangedOrders.forEach(o => {
            const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000) : new Date()
            const key = ts.toISOString().slice(0,10)
            const mapKey = key.slice(5) // MM-DD
            // Find by matching date part if map key is short
            // Actually let's just use the full date logic
             // Simplified for this snippet
             // ...
        })
        // Re-implementing simple daily logic
        map.clear()
        for (let d = new Date(from); d <= now; d.setDate(d.getDate()+1)) {
            const key = d.toISOString().slice(0,10)
            map.set(key, { date: key.slice(5), revenue: 0, orders: 0 })
        }
        rangedOrders.forEach(o => {
            const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000) : new Date()
            const key = ts.toISOString().slice(0,10)
            if (map.has(key)) {
                const row = map.get(key)
                row.orders += 1
                row.revenue += Number(o.subtotal)||0
            }
        })
    }
    return Array.from(map.values())
  }, [rangedOrders, range, preset])

  const pies = useMemo(() => {
    const byPayment = new Map()
    rangedOrders.forEach(o => {
      const pm = o.payment?.method || 'cod'
      byPayment.set(pm, (byPayment.get(pm)||0)+1)
    })
    const toArray = (m) => Array.from(m.entries()).map(([name, value]) => ({ name, value }))
    return { payment: toArray(byPayment) }
  }, [rangedOrders])

  const topItems = useMemo(() => {
    const byItem = new Map()
    rangedOrders.forEach(o => (o.items||[]).forEach(it => byItem.set(it.name || it.id || 'Unknown', (byItem.get(it.name || it.id || 'Unknown')||0) + (Number(it.qty)||0))))
    const arr = Array.from(byItem.entries()).map(([name, qty]) => ({ name, qty }))
    arr.sort((a,b)=> b.qty - a.qty)
    return arr.slice(0, 5)
  }, [rangedOrders])

  const recentOrders = useMemo(() => {
    return [...orders].sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)).slice(0, 5)
  }, [orders])

  const palette = ['#fbbf24','#ef4444','#10b981','#3b82f6','#a855f7','#f59e0b','#22c55e','#06b6d4','#fb7185']
  const hash = (s) => { let h = 0; const str = String(s || ''); for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) >>> 0; return h }
  const colorFor = (name, offset = 0) => palette[(hash(name) + offset) % palette.length]

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-base-content">
            Dashboard
          </h2>
          <p className="text-base-content/60 mt-1">Overview of your store's performance</p>
        </div>
        
        <div className="flex items-center gap-2 bg-base-100 p-1 rounded-lg border border-base-200 shadow-sm">
          <button className={`btn btn-sm border-0 ${preset==='today'?'btn-primary shadow-md':'btn-ghost'}`} onClick={()=>setPreset('today')}>Today</button>
          <button className={`btn btn-sm border-0 ${preset==='yesterday'?'btn-primary shadow-md':'btn-ghost'}`} onClick={()=>setPreset('yesterday')}>Yesterday</button>
          <button className={`btn btn-sm border-0 ${preset==='last7'?'btn-primary shadow-md':'btn-ghost'}`} onClick={()=>setPreset('last7')}>7 Days</button>
          <button className={`btn btn-sm border-0 ${preset==='overall'?'btn-primary shadow-md':'btn-ghost'}`} onClick={()=>setPreset('overall')}>All Time</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard 
            label="Total Revenue" 
            value={`₹${Math.round(kpis.revenue).toLocaleString()}`} 
            icon={<MdAttachMoney className="w-6 h-6 text-warning" />}
            trend={kpis.totalOrders > 0 ? `Avg ₹${Math.round(kpis.aov)} / order` : null}
        />
        <KpiCard 
            label="Total Orders" 
            value={kpis.totalOrders} 
            icon={<MdShoppingBag className="w-6 h-6 text-primary" />}
            trend={null}
        />
        <KpiCard 
            label="Items Sold" 
            value={kpis.itemsSold} 
            icon={<MdInventory className="w-6 h-6 text-secondary" />}
            trend={null}
        />
        <KpiCard 
            label="Customers" 
            value={kpis.uniqueCustomers} 
            icon={<MdPeople className="w-6 h-6 text-accent" />}
            trend="Unique"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-6">Revenue Trend</h3>
            {!R ? (
                <div className="h-[300px] flex items-center justify-center opacity-50">Loading chart...</div>
            ) : (
                <div className="h-[300px] w-full">
                    <R.ResponsiveContainer width="100%" height="100%">
                        <R.AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <R.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                            <R.XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'currentColor', opacity: 0.5}} dy={10} />
                            <R.YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'currentColor', opacity: 0.5}} tickFormatter={(v)=>`₹${v}`} />
                            <R.Tooltip 
                                contentStyle={{backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderRadius: '0.5rem', border: '1px solid var(--fallback-b3,oklch(var(--b3)))'}}
                                formatter={(v)=>[`₹${v}`, 'Revenue']}
                            />
                            <R.Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </R.AreaChart>
                    </R.ResponsiveContainer>
                </div>
            )}
          </div>
        </div>

        {/* Top Items */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4">Top Selling Items</h3>
            <div className="space-y-4">
                {topItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-xs font-bold opacity-70">
                                {i+1}
                            </div>
                            <span className="font-medium text-sm truncate max-w-[140px]">{item.name}</span>
                        </div>
                        <span className="badge badge-ghost">{item.qty} sold</span>
                    </div>
                ))}
                {topItems.length === 0 && <div className="text-center opacity-50 py-8">No data available</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
                <div className="p-6 border-b border-base-200 flex justify-between items-center">
                    <h3 className="card-title text-lg">Recent Orders</h3>
                    <Link to="/admin/orders" className="btn btn-xs btn-ghost gap-1">
                        View All <MdArrowForward />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(o => (
                                <tr key={o.id} className="hover">
                                    <td className="font-mono text-xs opacity-70">#{o.id.slice(-6)}</td>
                                    <td className="font-medium">{o.customer?.name || 'Guest'}</td>
                                    <td>₹{o.subtotal}</td>
                                    <td>
                                        <span className={`badge badge-xs ${
                                            o.status === 'delivered' ? 'badge-success' : 
                                            o.status === 'cancelled' ? 'badge-error' : 
                                            'badge-warning'
                                        }`}>
                                            {o.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Category Sales */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
                <h3 className="card-title text-lg mb-4">Sales by Category</h3>
                <CategorySalesPie orders={rangedOrders} categories={categories} colorFor={colorFor} R={R} />
            </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ label, value, icon, trend }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-5">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-base-content/60 mb-1">{label}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </div>
            <div className="p-2 bg-base-200 rounded-lg">
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-2 text-xs font-medium text-success flex items-center gap-1">
                {trend}
            </div>
        )}
      </div>
    </div>
  )
}

function PieLegend({ data, colorFor }) {
  if (!Array.isArray(data) || data.length === 0) return null
  const total = data.reduce((n, r)=> n + (r.value || 0), 0) || 1
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs justify-center">
      {data.map((r) => (
        <span key={r.name} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-base-200 bg-base-100">
          <span className="w-2 h-2 rounded-full" style={{ background: colorFor(r.name) }} />
          <span className="font-medium">{r.name}</span>
          <span className="opacity-60">{Math.round((r.value/total)*100)}%</span>
        </span>
      ))}
    </div>
  )
}

function CategorySalesPie({ orders, categories, colorFor, R }) {
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
        const amount = (Number(it.rate ?? it.price) || 0) * (Number(it.qty) || 0)
        byCat.set(cat, (byCat.get(cat)||0) + amount)
      })
    })
    return Array.from(byCat.entries()).map(([name, value]) => ({ name, value }))
  }, [orders, itemToCat])

  if (!R) return <div className="h-[240px] flex items-center justify-center opacity-50">Loading chart...</div>
  
  if (data.length === 0) return <div className="h-[240px] flex items-center justify-center opacity-50">No sales data</div>

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="h-[240px] w-full">
        <R.ResponsiveContainer width="100%" height="100%">
            <R.PieChart>
            <R.Pie 
                data={data} 
                dataKey="value" 
                nameKey="name" 
                innerRadius={60} 
                outerRadius={80} 
                paddingAngle={5}
            >
                {data.map((row, i) => <R.Cell key={i} fill={colorFor(row.name, 2)} strokeWidth={0} />)}
            </R.Pie>
            <R.Tooltip formatter={(v, n)=>[`₹${Math.round(Number(v)||0)}`, n]} />
            </R.PieChart>
        </R.ResponsiveContainer>
      </div>
      <PieLegend data={data} colorFor={(n)=>colorFor(n,2)} />
    </div>
  )
}
