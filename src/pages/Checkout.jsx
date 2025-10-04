import { useCart } from '../context/CartContext'
import { createOrder } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Checkout() {
  const { entries, subtotal, setQty, remove, clear } = useCart()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    addressLine: '',
    city: '',
    pin: '',
    paymentMethod: 'cod',
    note: '',
  })
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const placeOrder = async () => {
    if (!entries.length || placing) return
    if (!isValid) return
    setPlacing(true)
    try {
      const orderId = await createOrder({
        userId: user?.uid || null,
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: {
            line: form.addressLine,
            city: form.city,
            pin: form.pin,
          },
          note: form.note,
          payment: { method: form.paymentMethod, status: form.paymentMethod === 'cod' ? 'pending' : 'initiated' },
        },
        items: entries.map(({ item, qty }) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty,
        })),
      })
      setOrderId(orderId)
      clear()
    } catch (e) {
      console.error(e)
      alert('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const phoneOk = !form.phone || /^\+?[0-9]{7,15}$/.test(form.phone)
  const pinOk = !form.pin || /^[0-9]{4,8}$/.test(form.pin)
  const requiredFilled = form.name && form.addressLine && form.city && form.pin
  const isValid = requiredFilled && phoneOk && pinOk

  return (
    <div className="page-wrap py-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      {orderId && (
        <div className="alert alert-success mb-6">
          <span>Order placed successfully. ID: <strong>{orderId}</strong></span>
        </div>
      )}
      {entries.length === 0 ? (
        <div className="alert">Your cart is empty.</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {entries.map(({ item, qty }) => (
              <div key={item.id} className="card card-surface">
                <div className="card-body">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="card-title">{item.name}</h3>
                      <p className="text-sm opacity-80">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="btn btn-sm" onClick={() => setQty(item.id, qty - 1)}>-</button>
                      <input
                        type="number"
                        min={1}
                        className="input input-sm input-bordered w-20 text-center"
                        value={qty}
                        onChange={(e) => setQty(item.id, Number(e.target.value) || 1)}
                      />
                      <button className="btn btn-sm" onClick={() => setQty(item.id, qty + 1)}>+</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(item.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="card card-surface">
              <div className="card-body gap-3">
                <h2 className="card-title">Delivery Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input input-bordered input-sm col-span-2" placeholder="Full name *" value={form.name} onChange={(e) => update('name', e.target.value)} />
                  <div className="col-span-1 flex flex-col gap-1">
                    <input className={`input input-bordered input-sm ${form.phone && !phoneOk ? 'input-error' : ''}`} placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                    {form.phone && !phoneOk && <span className="text-error text-[10px]">Invalid phone</span>}
                  </div>
                  <input className="input input-bordered input-sm" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                  <input className="input input-bordered input-sm col-span-2" placeholder="Address line *" value={form.addressLine} onChange={(e) => update('addressLine', e.target.value)} />
                  <input className="input input-bordered input-sm" placeholder="City *" value={form.city} onChange={(e) => update('city', e.target.value)} />
                  <div className="flex flex-col gap-1">
                    <input className={`input input-bordered input-sm ${form.pin && !pinOk ? 'input-error' : ''}`} placeholder="PIN *" value={form.pin} onChange={(e) => update('pin', e.target.value)} />
                    {form.pin && !pinOk && <span className="text-error text-[10px]">Invalid PIN</span>}
                  </div>
                  <textarea className="textarea textarea-bordered textarea-sm col-span-2" placeholder="Note / instructions" value={form.note} onChange={(e) => update('note', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="card card-surface">
              <div className="card-body gap-3">
                <h2 className="card-title">Payment</h2>
                <div className="join">
                  {['cod','upi','card'].map(m => (
                    <button key={m} type="button" className={`btn btn-xs join-item ${form.paymentMethod===m?'btn-primary':'btn-ghost'}`} onClick={()=>update('paymentMethod', m)}>{m.toUpperCase()}</button>
                  ))}
                </div>
                <p className="text-xs opacity-70">Online options are mock – treat as successful after placing order.</p>
              </div>
            </div>
            <div className="card card-surface h-max">
              <div className="card-body">
                <h2 className="card-title">Order Summary</h2>
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between text-sm opacity-80"><span>Delivery</span><span>₹0</span></div>
                <div className="divider my-2"></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>₹{subtotal}</span></div>
                <button className="btn btn-primary mt-4" disabled={placing || !isValid} onClick={placeOrder}>{placing? 'Placing...' : 'Place Order'}</button>
                {!isValid && <p className="mt-2 text-xs text-error/80">Fill required fields ( * ) and fix validation errors to continue.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
