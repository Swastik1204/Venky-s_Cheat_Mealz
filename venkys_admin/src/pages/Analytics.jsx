// Analytics — Sales analytics dashboard
import { useEffect, useMemo, useState } from 'react'

import { MdTrendingUp, MdTrendingDown } from 'react-icons/md'

import AdminLayout from '../layouts/AdminLayout'
import { fetchAllOrders } from '../lib/data'

const fmtINR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`

function parseDateInput(value, end = false) {
  if (!value) return null
  const [y, m, d] = String(value).split('-').map(Number)
  if (!y || !m || !d) return null
  return end ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d)
}

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : new Date(parsed)
  }
  if (typeof value === 'number') return new Date(value)
  return null
}

function hourLabel(hour) {
  const h = Number(hour) || 0
  const suffix = h < 12 ? 'am' : 'pm'
  const twelve = h % 12 === 0 ? 12 : h % 12
  return `${twelve}${suffix}`
}

function normalizeOrdersResponse(res) {
  return Array.isArray(res?.orders) ? res.orders : (Array.isArray(res) ? res : [])
}

export default function Analytics() {
  const [preset, setPreset] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [orders, setOrders] = useState([])
  const [prevOrders, setPrevOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [R, setR] = useState(null)

  const range = useMemo(() => {
    const now = new Date()
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

    if (preset === 'overall') {
      return { start: null, end: null, hasBounds: false, valid: true, label: 'All time' }
    }
    if (preset === 'today') {
      return { start: startOfDay(now), end: endOfDay(now), hasBounds: true, valid: true, label: 'Today' }
    }
    if (preset === 'yesterday') {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { start: startOfDay(y), end: endOfDay(y), hasBounds: true, valid: true, label: 'Yesterday' }
    }
    if (preset === 'last7') {
      const s = new Date(now)
      s.setDate(s.getDate() - 6)
      return { start: startOfDay(s), end: endOfDay(now), hasBounds: true, valid: true, label: 'Last 7 days' }
    }
    if (preset === 'last30') {
      const s = new Date(now)
      s.setDate(s.getDate() - 29)
      return { start: startOfDay(s), end: endOfDay(now), hasBounds: true, valid: true, label: 'Last 30 days' }
    }
    if (preset === 'thisMonth') {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: endOfDay(now),
        hasBounds: true,
        valid: true,
        label: 'This month',
      }
    }

    const start = parseDateInput(customFrom)
    const end = parseDateInput(customTo, true)
    const valid = !!(start && end && start <= end)
    return {
      start,
      end,
      hasBounds: true,
      valid,
      label: valid ? `${customFrom} to ${customTo}` : 'Custom range',
    }
  }, [preset, customFrom, customTo])

  useEffect(() => {
    let active = true
    import('recharts').then((mod) => {
      if (active) setR(mod)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        if (range.hasBounds) {
          if (!range.valid) {
            if (!active) return
            setOrders([])
            setPrevOrders([])
            return
          }
          const currentRes = await fetchAllOrders({ maxResults: null, startDate: range.start, endDate: range.end })
          const periodMs = Math.max(1, range.end.getTime() - range.start.getTime())
          const prevEnd = new Date(range.start.getTime() - 1)
          const prevStart = new Date(prevEnd.getTime() - periodMs)
          const prevRes = await fetchAllOrders({ maxResults: null, startDate: prevStart, endDate: prevEnd })
          if (!active) return
          setOrders(normalizeOrdersResponse(currentRes))
          setPrevOrders(normalizeOrdersResponse(prevRes))
          return
        }

        const allRes = await fetchAllOrders({ maxResults: null })
        if (!active) return
        setOrders(normalizeOrdersResponse(allRes))
        setPrevOrders([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, 60_000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [range.hasBounds, range.valid, range.start, range.end])

  const totalOrders = orders.length
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (Number(o.totalAmount ?? o.subtotal) || 0), 0), [orders])
  const prevRevenue = useMemo(() => prevOrders.reduce((sum, o) => sum + (Number(o.totalAmount ?? o.subtotal) || 0), 0), [prevOrders])
  const avgOrderValue = totalOrders ? (totalRevenue / totalOrders) : 0
  const cancelledCount = useMemo(() => orders.filter((o) => {
    const s = String(o.status || '').toLowerCase()
    return s === 'rejected' || s === 'cancelled'
  }).length, [orders])
  const cancellationRate = totalOrders ? (cancelledCount / totalOrders) * 100 : 0

  const revenueChangePct = useMemo(() => {
    if (!prevOrders.length && prevRevenue === 0) return 0
    if (prevRevenue === 0) return totalRevenue > 0 ? 100 : 0
    return ((totalRevenue - prevRevenue) / prevRevenue) * 100
  }, [prevOrders.length, prevRevenue, totalRevenue])

  const peakHours = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: hourLabel(h), count: 0 }))
    orders.forEach((o) => {
      const dt = toDate(o.createdAt)
      if (!dt) return
      buckets[dt.getHours()].count += 1
    })
    return buckets
  }, [orders])

  const { mostOrdered, mostRevenue } = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : []
      items.forEach((it) => {
        const name = String(it?.name || it?.id || 'Unknown').trim() || 'Unknown'
        const qty = Number(it?.qty) || 0
        const rate = Number(it?.rate ?? it?.price) || 0
        const row = map.get(name) || { qty: 0, revenue: 0 }
        row.qty += qty
        row.revenue += qty * rate
        map.set(name, row)
      })
    })
    const rows = Array.from(map.entries()).map(([name, row]) => ({ name, qty: row.qty, revenue: row.revenue }))
    return {
      mostOrdered: [...rows].sort((a, b) => b.qty - a.qty).slice(0, 5),
      mostRevenue: [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    }
  }, [orders])

  const paymentBreakdown = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => {
      const method = String(o?.payment?.method || 'cod').trim().toLowerCase() || 'cod'
      map.set(method, (map.get(method) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [orders])

  const presets = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7', label: '7 Days' },
    { key: 'last30', label: '30 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
    { key: 'overall', label: 'All Time' },
  ]

  const trendUp = revenueChangePct >= 0
  const trendAbs = Math.abs(revenueChangePct)

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-base-content">Analytics</h2>
            <p className="text-sm opacity-70">{range.label}{loading ? ' • Loading…' : ''}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-base-100 rounded-xl border border-base-300 p-2">
            {presets.map((p) => (
              <button
                key={p.key}
                className={`btn btn-xs sm:btn-sm ${preset === p.key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-4 flex flex-wrap items-end gap-3">
              <label className="form-control">
                <span className="label-text text-xs opacity-70">From</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </label>
              <label className="form-control">
                <span className="label-text text-xs opacity-70">To</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <div className="stat bg-base-100 rounded-xl border border-base-300 shadow-sm">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value text-primary">{fmtINR(totalRevenue)}</div>
          <div className="stat-desc">{totalOrders} orders in selected period</div>
        </div>
        <div className="stat bg-base-100 rounded-xl border border-base-300 shadow-sm">
          <div className="stat-title">Avg Order Value</div>
          <div className="stat-value">{fmtINR(avgOrderValue)}</div>
          <div className="stat-desc">Revenue divided by total orders</div>
        </div>
        <div className="stat bg-base-100 rounded-xl border border-base-300 shadow-sm">
          <div className="stat-title">Cancellation Rate</div>
          <div className="stat-value text-warning">{cancellationRate.toFixed(1)}%</div>
          <div className="stat-desc">Rejected or cancelled as a share of all orders</div>
        </div>
        <div className="stat bg-base-100 rounded-xl border border-base-300 shadow-sm">
          <div className="stat-title">Revenue Trend</div>
          <div className="stat-value text-base-content text-2xl">{trendAbs.toFixed(1)}%</div>
          <div className={`stat-desc flex items-center gap-1 ${trendUp ? 'text-success' : 'text-error'}`}>
            {trendUp ? <MdTrendingUp className="w-4 h-4" /> : <MdTrendingDown className="w-4 h-4" />}
            Current {fmtINR(totalRevenue)} vs Previous {fmtINR(prevRevenue)}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm mb-6">
        <div className="card-body">
          <h3 className="card-title text-lg">Busiest hours</h3>
          {!R ? (
            <div className="h-[320px] flex items-center justify-center opacity-50">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <R.ResponsiveContainer width="100%" height="100%">
                <R.BarChart data={peakHours} margin={{ top: 10, right: 16, left: -10, bottom: 10 }}>
                  <R.CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
                  <R.XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={1} />
                  <R.YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <R.Tooltip formatter={(value) => [value, 'Orders']} />
                  <R.Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </R.BarChart>
              </R.ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">Top 5 items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold mb-2">Most ordered</div>
                <div className="overflow-x-auto">
                  <table className="table table-xs">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostOrdered.length ? mostOrdered.map((row) => (
                        <tr key={`qty-${row.name}`}>
                          <td>{row.name}</td>
                          <td className="text-right font-semibold">{row.qty}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={2} className="opacity-60">No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">Most revenue</div>
                <div className="overflow-x-auto">
                  <table className="table table-xs">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostRevenue.length ? mostRevenue.map((row) => (
                        <tr key={`rev-${row.name}`}>
                          <td>{row.name}</td>
                          <td className="text-right font-semibold">{fmtINR(row.revenue)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={2} className="opacity-60">No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">Payment breakdown</h3>
            {!R ? (
              <div className="h-[280px] flex items-center justify-center opacity-50">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <R.ResponsiveContainer width="100%" height="100%">
                  <R.PieChart>
                    <R.Pie data={paymentBreakdown} dataKey="value" nameKey="name" outerRadius={95} label>
                      {paymentBreakdown.map((entry, idx) => (
                        <R.Cell
                          key={`${entry.name}-${idx}`}
                          fill={['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'][idx % 5]}
                        />
                      ))}
                    </R.Pie>
                    <R.Tooltip formatter={(value) => [value, 'Orders']} />
                    <R.Legend />
                  </R.PieChart>
                </R.ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
