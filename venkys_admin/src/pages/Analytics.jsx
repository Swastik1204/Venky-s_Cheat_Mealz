// Analytics — Sales and order analytics dashboard
import { useEffect, useMemo, useState } from 'react'

import { Link } from 'react-router-dom'
import {
  MdArrowForward, MdTrendingUp, MdTrendingDown, MdAttachMoney,
  MdShoppingBag, MdPeople, MdInventory,
  MdAccessTime, MdStar, MdCalendarToday
} from 'react-icons/md'

import AdminLayout from '../layouts/AdminLayout'
import { fetchAllOrders, fetchMenuCategories } from '../lib/data'

// ── Helpers ──
const fmtINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const hourLabel = (h) => {
  const ampm = h < 12 ? 'AM' : 'PM'
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hr}${ampm}`
}

const STATUS_COLORS = {
  delivered: 'badge-success',
  placed: 'badge-info',
  preparing: 'badge-warning',
  ready: 'badge-accent',
  cancelled: 'badge-error',
  rejected: 'badge-error',
}

const PALETTE = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7', '#06b6d4', '#ec4899', '#84cc16', '#f97316']
const hash = (s) => { let h = 0; const str = String(s || ''); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h }
const colorFor = (name, offset = 0) => PALETTE[(hash(name) + offset) % PALETTE.length]

export default function Analytics() {
  // ── State ──
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [R, setR] = useState(null)
  const [preset, setPreset] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [categories, setCategories] = useState([])

  // ── Side-effects ──
  useEffect(() => {
    let active = true
    import('recharts').then((mod) => { if (active) setR(mod) }).catch(() => {})
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
    const id = setInterval(load, 60_000)
    return () => { active = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    let ok = true
    fetchMenuCategories().then((cats) => { if (ok) setCategories(Array.isArray(cats) ? cats : []) }).catch(() => {})
    return () => { ok = false }
  }, [])

  /* ── date range ── */
  const range = useMemo(() => {
    const now = new Date()
    const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    if (preset === 'overall') return { start: null, end: null, label: 'All Time' }
    if (preset === 'today') return { start: atMidnight(now), end: endOfDay(now), label: 'Today' }
    if (preset === 'yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); return { start: atMidnight(y), end: endOfDay(y), label: 'Yesterday' } }
    if (preset === 'last7') { const s = new Date(now); s.setDate(s.getDate() - 6); return { start: atMidnight(s), end: endOfDay(now), label: 'Last 7 days' } }
    if (preset === 'last30') { const s = new Date(now); s.setDate(s.getDate() - 29); return { start: atMidnight(s), end: endOfDay(now), label: 'Last 30 days' } }
    if (preset === 'thisMonth') { return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now), label: 'This Month' } }
    const parse = (s, end = false) => {
      if (!s) return null
      const [Y, M, D] = s.split('-').map(Number)
      if (!Y || !M || !D) return null
      return end ? new Date(Y, M - 1, D, 23, 59, 59, 999) : new Date(Y, M - 1, D)
    }
    const start = parse(customFrom)
    const end = parse(customTo, true)
    if (start && end && start <= end) return { start, end, label: `${customFrom} → ${customTo}` }
    return { start: null, end: null, label: 'Custom' }
  }, [preset, customFrom, customTo])

  const rangedOrders = useMemo(() => {
    if (!range.start || !range.end) return orders
    return orders.filter((o) => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
      return ts && ts >= range.start && ts <= range.end
    })
  }, [orders, range])

  /* ── previous-period orders for comparison ── */
  const prevRangedOrders = useMemo(() => {
    if (!range.start || !range.end) return []
    const duration = range.end - range.start
    const prevEnd = new Date(range.start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - duration)
    return orders.filter((o) => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
      return ts && ts >= prevStart && ts <= prevEnd
    })
  }, [orders, range])

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const calc = (list) => {
      let revenue = 0, itemsSold = 0, delivered = 0, cancelled = 0
      const customers = new Set()
      list.forEach(o => {
        revenue += Number(o.totalAmount || o.subtotal) || 0
        ;(o.items || []).forEach(it => { itemsSold += Number(it.qty) || 0 })
        if (o.customer?.phone) customers.add(o.customer.phone)
        else if (o.userId) customers.add(o.userId)
        if (o.status === 'delivered') delivered++
        if (o.status === 'cancelled' || o.status === 'rejected') cancelled++
      })
      const total = list.length
      const aov = total ? revenue / total : 0
      return { total, revenue, itemsSold, customers: customers.size, aov, delivered, cancelled }
    }
    const curr = calc(rangedOrders)
    const prev = calc(prevRangedOrders)
    const change = (c, p) => p > 0 ? Math.round(((c - p) / p) * 100) : (c > 0 ? 100 : 0)
    return {
      ...curr,
      revChange: change(curr.revenue, prev.revenue),
      ordChange: change(curr.total, prev.total),
      itemChange: change(curr.itemsSold, prev.itemsSold),
      custChange: change(curr.customers, prev.customers),
      fulfillmentRate: curr.total ? pct(curr.delivered, curr.total) : 0,
    }
  }, [rangedOrders, prevRangedOrders])

  /* ── revenue + order trend ── */
  const series = useMemo(() => {
    const map = new Map()
    const isHourly = preset === 'today' || preset === 'yesterday'
    if (isHourly) {
      for (let i = 0; i <= 23; i++) map.set(i, { date: hourLabel(i), revenue: 0, orders: 0 })
      rangedOrders.forEach(o => {
        const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
        if (!ts) return
        const row = map.get(ts.getHours())
        if (row) { row.orders += 1; row.revenue += Number(o.totalAmount || o.subtotal) || 0 }
      })
    } else {
      const startD = range.start || (() => { const n = new Date(); n.setDate(n.getDate() - 29); return new Date(n.getFullYear(), n.getMonth(), n.getDate()) })()
      const endD = range.end || new Date()
      for (let d = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate()); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10)
        map.set(key, { date: key.slice(5), revenue: 0, orders: 0 })
      }
      rangedOrders.forEach(o => {
        const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
        if (!ts) return
        const key = ts.toISOString().slice(0, 10)
        const row = map.get(key)
        if (row) { row.orders += 1; row.revenue += Number(o.totalAmount || o.subtotal) || 0 }
      })
    }
    return Array.from(map.values())
  }, [rangedOrders, range, preset])

  /* ── top 10 items ── */
  const topItems = useMemo(() => {
    const byItem = new Map()
    rangedOrders.forEach(o => (o.items || []).forEach(it => {
      const name = it.name || it.id || 'Unknown'
      const prev = byItem.get(name) || { qty: 0, revenue: 0 }
      const qty = Number(it.qty) || 0
      const rate = Number(it.rate ?? it.price) || 0
      byItem.set(name, { qty: prev.qty + qty, revenue: prev.revenue + rate * qty })
    }))
    return Array.from(byItem.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
  }, [rangedOrders])

  /* ── order status breakdown ── */
  const statusBreakdown = useMemo(() => {
    const map = new Map()
    rangedOrders.forEach(o => { const s = o.status || 'unknown'; map.set(s, (map.get(s) || 0) + 1) })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [rangedOrders])

  /* ── payment methods ── */
  const paymentBreakdown = useMemo(() => {
    const map = new Map()
    rangedOrders.forEach(o => {
      const pm = o.payment?.method === 'razorpay' ? 'Online' : o.payment?.method === 'cod' ? 'Cash on Delivery' : (o.payment?.method || 'Cash on Delivery')
      map.set(pm, (map.get(pm) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [rangedOrders])

  /* ── order source ── */
  const sourceBreakdown = useMemo(() => {
    const map = new Map()
    rangedOrders.forEach(o => {
      const src = o.source === 'pos' ? 'POS / Dine-in' : o.source === 'online' ? 'Online' : (o.source || 'Online')
      map.set(src, (map.get(src) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [rangedOrders])

  /* ── peak hours ── */
  const peakHours = useMemo(() => {
    const hourMap = new Array(24).fill(0)
    rangedOrders.forEach(o => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
      if (ts) hourMap[ts.getHours()]++
    })
    return hourMap.map((count, h) => ({ hour: hourLabel(h), count }))
  }, [rangedOrders])

  /* ── busiest day of week ── */
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const map = new Array(7).fill(0)
    rangedOrders.forEach(o => {
      const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
      if (ts) map[ts.getDay()]++
    })
    return days.map((name, i) => ({ name, orders: map[i] }))
  }, [rangedOrders])

  /* ── category sales ── */
  const categorySales = useMemo(() => {
    const itemToCat = new Map()
    ;(categories || []).forEach(c => {
      ;(Array.isArray(c.items) ? c.items : []).forEach(it => {
        const key = String(it.name || '').trim().toLowerCase()
        if (key) itemToCat.set(key, c.id)
      })
    })
    const byCat = new Map()
    rangedOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const key = String(it.name || '').trim().toLowerCase()
        const cat = itemToCat.get(key) || 'Uncategorized'
        const amount = (Number(it.rate ?? it.price) || 0) * (Number(it.qty) || 0)
        const prev = byCat.get(cat) || { revenue: 0, qty: 0 }
        byCat.set(cat, { revenue: prev.revenue + amount, qty: prev.qty + (Number(it.qty) || 0) })
      })
    })
    return Array.from(byCat.entries())
      .map(([name, d]) => ({ name, value: d.revenue, qty: d.qty }))
      .sort((a, b) => b.value - a.value)
  }, [rangedOrders, categories])

  /* ── recent 5 orders ── */
  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5)
  , [orders])

  /* ── repeat customers ── */
  const repeatCustomerPct = useMemo(() => {
    const map = new Map()
    rangedOrders.forEach(o => {
      const id = o.customer?.phone || o.userId
      if (id) map.set(id, (map.get(id) || 0) + 1)
    })
    const total = map.size
    const repeats = [...map.values()].filter(c => c > 1).length
    return total ? pct(repeats, total) : 0
  }, [rangedOrders])

  /* ── avg order processing time ── */
  const avgProcessingMins = useMemo(() => {
    let sum = 0, count = 0
    rangedOrders.forEach(o => {
      if (o.status === 'delivered' && o.createdAt?.seconds && Array.isArray(o.statusHistory)) {
        const delivered = o.statusHistory.find(s => s.status === 'delivered')
        if (delivered?.timestamp?.seconds) {
          sum += (delivered.timestamp.seconds - o.createdAt.seconds) / 60
          count++
        }
      }
    })
    return count ? Math.round(sum / count) : null
  }, [rangedOrders])

  const presets = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7', label: '7 Days' },
    { key: 'last30', label: '30 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'overall', label: 'All Time' },
  ]

  // ── Render ──
  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-base-content">Dashboard</h2>
          <p className="text-base-content/60 mt-1">
            {range.label} {loading && <span className="loading loading-dots loading-xs ml-2" />}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 bg-base-100 p-1 rounded-lg border border-base-200 shadow-sm flex-wrap">
          {presets.map(p => (
            <button key={p.key} className={`btn btn-xs sm:btn-sm border-0 ${preset === p.key ? 'btn-primary shadow-md' : 'btn-ghost'}`} onClick={() => setPreset(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard label="Revenue" value={fmtINR(kpis.revenue)} icon={<MdAttachMoney className="w-6 h-6 text-warning" />} change={kpis.revChange} subtitle={`Avg ${fmtINR(kpis.aov)} / order`} />
        <KpiCard label="Orders" value={kpis.total} icon={<MdShoppingBag className="w-6 h-6 text-primary" />} change={kpis.ordChange} subtitle={`${kpis.delivered} delivered`} />
        <KpiCard label="Items Sold" value={kpis.itemsSold} icon={<MdInventory className="w-6 h-6 text-secondary" />} change={kpis.itemChange} />
        <KpiCard label="Customers" value={kpis.customers} icon={<MdPeople className="w-6 h-6 text-accent" />} change={kpis.custChange} subtitle={`${repeatCustomerPct}% repeat`} />
      </div>

      {/* KPI Cards — Row 2 (operational) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <MiniStat label="Fulfillment Rate" value={`${kpis.fulfillmentRate}%`} icon={<MdStar className="w-5 h-5 text-success" />} />
        <MiniStat label="Cancelled / Rejected" value={kpis.cancelled} icon={<MdTrendingDown className="w-5 h-5 text-error" />} />
        <MiniStat label="Avg Delivery Time" value={avgProcessingMins !== null ? `${avgProcessingMins} min` : '—'} icon={<MdAccessTime className="w-5 h-5 text-info" />} />
        <MiniStat label="Repeat Customers" value={`${repeatCustomerPct}%`} icon={<MdPeople className="w-5 h-5 text-warning" />} />
      </div>

      {/* Revenue Trend + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4">Revenue &amp; Orders Trend</h3>
            {!R ? <ChartPlaceholder /> : (
              <div className="h-[300px] w-full">
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.ComposedChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <R.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                    <R.XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} dy={10} />
                    <R.YAxis yAxisId="rev" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} tickFormatter={v => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                    <R.YAxis yAxisId="ord" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} allowDecimals={false} />
                    <R.Tooltip contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderRadius: '0.5rem', border: '1px solid var(--fallback-b3,oklch(var(--b3)))' }} formatter={(v, n) => [n === 'revenue' ? fmtINR(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                    <R.Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    <R.Bar yAxisId="ord" dataKey="orders" fill="#3b82f6" opacity={0.5} radius={[4, 4, 0, 0]} barSize={20} />
                  </R.ComposedChart>
                </R.ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4">Top Selling Items</h3>
            <div className="space-y-3 overflow-y-auto max-h-[300px]">
              {topItems.length === 0 && <Empty text="No sales data" />}
              {topItems.map((item, i) => {
                const maxQty = topItems[0]?.qty || 1
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'}`}>{i + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{item.qty}</span>
                        <span className="text-xs opacity-50 ml-1">· {fmtINR(item.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct(item.qty, maxQty)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Category Sales + Payment + Source + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-5">
            <h3 className="card-title text-sm mb-3">Sales by Category</h3>
            <MiniDonut data={categorySales} R={R} />
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-5">
            <h3 className="card-title text-sm mb-3">Payment Methods</h3>
            <MiniDonut data={paymentBreakdown} R={R} countMode />
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-5">
            <h3 className="card-title text-sm mb-3">Order Source</h3>
            <MiniDonut data={sourceBreakdown} R={R} countMode />
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-5">
            <h3 className="card-title text-sm mb-3">Order Status</h3>
            <div className="space-y-2 mt-2">
              {statusBreakdown.length === 0 && <Empty text="No orders" />}
              {statusBreakdown.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className={`badge ${STATUS_COLORS[s.name] || 'badge-ghost'} badge-sm capitalize`}>{s.name}</span>
                  <span className="font-bold text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Peak Hours + Busiest Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4"><MdAccessTime className="w-5 h-5" /> Peak Hours</h3>
            {!R ? <ChartPlaceholder h={200} /> : (
              <div className="h-[200px] w-full">
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.BarChart data={peakHours} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <R.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                    <R.XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} interval={2} />
                    <R.YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} allowDecimals={false} />
                    <R.Tooltip contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderRadius: '0.5rem', border: '1px solid var(--fallback-b3,oklch(var(--b3)))' }} formatter={v => [v, 'Orders']} />
                    <R.Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </R.BarChart>
                </R.ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4"><MdCalendarToday className="w-5 h-5" /> Busiest Days</h3>
            {!R ? <ChartPlaceholder h={200} /> : (
              <div className="h-[200px] w-full">
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.BarChart data={dayOfWeekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <R.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                    <R.XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} />
                    <R.YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} allowDecimals={false} />
                    <R.Tooltip contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderRadius: '0.5rem', border: '1px solid var(--fallback-b3,oklch(var(--b3)))' }} formatter={v => [v, 'Orders']} />
                    <R.Bar dataKey="orders" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </R.BarChart>
                </R.ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Orders */}
      <div className="card bg-base-100 shadow-sm border border-base-200 mb-8">
        <div className="card-body p-0">
          <div className="p-6 border-b border-base-200 flex justify-between items-center">
            <h3 className="card-title text-lg">Recent Orders</h3>
            <Link to="/admin/orders" className="btn btn-xs btn-ghost gap-1">View All <MdArrowForward /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => {
                  const ts = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
                  return (
                    <tr key={o.id} className="hover">
                      <td className="font-mono text-xs opacity-70">#{o.orderNo || o.id?.slice(-6)}</td>
                      <td className="font-medium">{o.customer?.name || 'Guest'}</td>
                      <td className="text-xs opacity-70">{(o.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0)} items</td>
                      <td className="font-semibold">{fmtINR(Number(o.totalAmount || o.subtotal) || 0)}</td>
                      <td><span className={`badge badge-xs ${o.source === 'pos' ? 'badge-secondary' : 'badge-info'}`}>{o.source === 'pos' ? 'POS' : 'Online'}</span></td>
                      <td><span className={`badge badge-xs ${STATUS_COLORS[o.status] || 'badge-ghost'} capitalize`}>{o.status}</span></td>
                      <td className="text-xs opacity-50">{ts ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

// ── Sub-components ──

function KpiCard({ label, value, icon, change, subtitle }) {
  const isUp = change > 0
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-base-content/60 mb-1 truncate">{label}</p>
            <h3 className="text-xl sm:text-2xl font-bold truncate">{value}</h3>
          </div>
          <div className="p-2 bg-base-200 rounded-lg shrink-0">{icon}</div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {change !== undefined && change !== 0 && (
            <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp ? 'text-success' : 'text-error'}`}>
              {isUp ? <MdTrendingUp className="w-3.5 h-3.5" /> : <MdTrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(change)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-base-content/50 truncate">{subtitle}</span>}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, icon }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-4 flex-row items-center gap-3">
        <div className="p-2 bg-base-200 rounded-lg">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-base-content/50 truncate">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

function MiniDonut({ data, R, countMode = false }) {
  if (!R) return <ChartPlaceholder h={160} />
  if (!data?.length) return <Empty text="No data" />
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1
  return (
    <div>
      <div className="h-[140px] w-full">
        <R.ResponsiveContainer width="100%" height="100%">
          <R.PieChart>
            <R.Pie data={data} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={3}>
              {data.map((row, i) => <R.Cell key={i} fill={colorFor(row.name, 2)} strokeWidth={0} />)}
            </R.Pie>
            <R.Tooltip formatter={(v, n) => [countMode ? v : fmtINR(v), n]} />
          </R.PieChart>
        </R.ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px] justify-center mt-1">
        {data.map(r => (
          <span key={r.name} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-base-200 bg-base-100">
            <span className="w-2 h-2 rounded-full" style={{ background: colorFor(r.name, 2) }} />
            <span className="font-medium truncate max-w-[80px]">{r.name}</span>
            <span className="opacity-50">{Math.round((r.value / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function ChartPlaceholder({ h = 300 }) {
  return <div style={{ height: h }} className="flex items-center justify-center opacity-30"><span className="loading loading-spinner loading-md" /></div>
}

function Empty({ text }) {
  return <div className="text-center opacity-40 py-6 text-sm">{text}</div>
}
