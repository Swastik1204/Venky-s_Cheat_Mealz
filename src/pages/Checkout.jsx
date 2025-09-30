import { useCart } from '../context/CartContext'
import { createOrder } from '../lib/data'

export default function Checkout() {
  const { entries, subtotal, setQty, remove, clear } = useCart()

  const placeOrder = async () => {
    if (!entries.length) return
    try {
      const orderId = await createOrder({
        userId: null, // plug your auth user id here when you add auth
        customer: {}, // optionally collect name/phone/address
        items: entries.map(({ item, qty }) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty,
        })),
      })
      alert(`Order placed! ID: ${orderId}`)
      clear()
    } catch (e) {
      console.error(e)
      alert('Failed to place order. Please try again.')
    }
  }

  return (
    <div className="page-wrap py-6">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      {entries.length === 0 ? (
        <div className="alert">Your cart is empty.</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
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
          <div className="card card-surface h-max">
            <div className="card-body">
              <h2 className="card-title">Order Summary</h2>
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-sm opacity-80"><span>Delivery</span><span>₹0</span></div>
              <div className="divider my-2"></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>₹{subtotal}</span></div>
              <button className="btn btn-primary mt-4" onClick={placeOrder}>Place Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
