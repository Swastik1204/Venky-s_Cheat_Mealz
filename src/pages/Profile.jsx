import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchUserOrders } from '../lib/data'

export default function Profile() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchUserOrders(user.uid)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="page-wrap py-6">
        <div className="alert">Please log in to view your profile.</div>
      </div>
    )
  }

  return (
    <div className="page-wrap py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-sm opacity-70">Signed in as {user.email}</p>
      </div>
      <section>
        <h2 className="text-xl font-semibold mb-3">Orders</h2>
        {loading && <div className="loading loading-spinner loading-md text-primary" />}
        {!loading && orders.length === 0 && <div className="opacity-70">No orders yet.</div>}
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="card card-surface">
              <div className="card-body gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Order #{o.id.slice(-6)}</h3>
                  <span className={`badge badge-sm ${o.status==='placed'?'badge-info':o.status==='delivered'?'badge-success':'badge-ghost'}`}>{o.status}</span>
                </div>
                <div className="text-sm flex flex-wrap gap-4">
                  <span>{o.items?.length || 0} items</span>
                  <span>Total: ₹{o.subtotal}</span>
                  {o.payment?.method && <span>Payment: {o.payment.method.toUpperCase()}</span>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs opacity-70">
                  {o.items?.slice(0,5).map(it => (
                    <span key={it.id}>{it.name} × {it.qty}</span>
                  ))}
                  {o.items?.length > 5 && <span>+{o.items.length - 5} more</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
