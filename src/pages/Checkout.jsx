import { useCart } from '../context/CartContext'
import { createOrder, fetchAddresses, addAddress, setDefaultAddress, fetchDeliverySettings } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { reverseGeocode, initAutocomplete } from '../lib/google'
import { MdPlace, MdLocalPhone, MdEmail, MdGpsFixed, MdLocationCity, MdPinDrop, MdPerson } from 'react-icons/md'

export default function Checkout() {
  const { entries, subtotal, setQty, remove, clear } = useCart()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState({ list: [], defaultId: null })
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    addressLine: '',
    city: '',
    pin: '',
    lat: null,
    lng: null,
    paymentMethod: 'cod',
    note: '',
  })
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const addrLineRef = useRef(null)
  const [setAsDefault, setSetAsDefault] = useState(false)

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  // Delivery geofence: defaults; will be overridden by Firestore settings if available
  const [deliveryCenter, setDeliveryCenter] = useState({
    lat: Number(import.meta.env.VITE_DELIVERY_CENTER_LAT ?? 23.5204),
    lng: Number(import.meta.env.VITE_DELIVERY_CENTER_LNG ?? 87.3119),
  })
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(Number(import.meta.env.VITE_DELIVERY_RADIUS_KM ?? 8))
  function haversineKm(a, b) {
    if (!a || !b || typeof a.lat !== 'number' || typeof a.lng !== 'number' || typeof b.lat !== 'number' || typeof b.lng !== 'number') return Infinity
    const R = 6371
    const toRad = (x) => (x * Math.PI) / 180
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
  }

  // Load delivery settings (center + radius) from Firestore
  useEffect(() => {
    let mounted = true
    fetchDeliverySettings()
      .then((d) => {
        if (!mounted || !d) return
        if (typeof d.centerLat === 'number' && typeof d.centerLng === 'number') {
          setDeliveryCenter({ lat: d.centerLat, lng: d.centerLng })
        }
        if (typeof d.radiusKm === 'number') setDeliveryRadiusKm(d.radiusKm)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  // Load user's saved addresses
  useEffect(() => {
    let mounted = true
    if (!user) return
    fetchAddresses(user.uid).then((a) => { if (mounted) setAddresses(a) })
    return () => { mounted = false }
  }, [user])

  // Pre-select default address into the form for speed (only if form empty)
  useEffect(() => {
    if (!user) return
    if (form.addressLine) return
    if (!addresses || !addresses.list?.length) return
    const def = addresses.list.find(a => a.id === addresses.defaultId) || addresses.list[0]
    if (!def) return
    update('addressLine', [def.line1, def.line2].filter(Boolean).join(', '))
    update('city', def.city || '')
    update('pin', def.zip || '')
    if (typeof def.lat === 'number') update('lat', def.lat)
    if (typeof def.lng === 'number') update('lng', def.lng)
    if (!form.phone) update('phone', def.phone || '')
  }, [addresses.defaultId, addresses.list, user])

  // Hook Google Places Autocomplete for the address line input
  useEffect(() => {
    if (!addrLineRef.current) return
    let ac = null
    initAutocomplete(addrLineRef.current, (parts) => {
      update('addressLine', parts.line1 || parts.formatted || '')
      if (parts.city) update('city', parts.city)
      if (parts.zip) update('pin', parts.zip)
      if (typeof parts.lat === 'number') update('lat', parts.lat)
      if (typeof parts.lng === 'number') update('lng', parts.lng)
    }).then(inst => { ac = inst }).catch(() => {})
    return () => {
      // No explicit dispose API for Places Autocomplete; GC will collect
      ac = null
    }
  }, [addrLineRef.current])

  const placeOrder = async () => {
    if (!entries.length || placing) return
    if (!isValid) return
    setPlacing(true)
    try {
      // Save or update a quick address entry for this checkout (best-effort)
      let savedAddrId = null
      if (user && form.addressLine) {
        // Store a compact address matching the final schema used in data.js
        const addr = {
          name: 'Checkout',
          line1: form.addressLine,
          city: form.city,
          zip: form.pin,
          phone: form.phone,
          tag: 'Other',
          ...(typeof form.lat === 'number' ? { lat: form.lat } : {}),
          ...(typeof form.lng === 'number' ? { lng: form.lng } : {}),
        }
        try { savedAddrId = await addAddress(user.uid, addr) } catch {}
        // Optionally set as default if user opted in
        if (savedAddrId && setAsDefault) {
          try { await setDefaultAddress(user.uid, savedAddrId) } catch {}
        }
      }
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
            ...(typeof form.lat === 'number' ? { lat: form.lat } : {}),
            ...(typeof form.lng === 'number' ? { lng: form.lng } : {}),
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
  const requiredFilled = form.name && form.addressLine && form.city && form.pin && (typeof form.lat === 'number') && (typeof form.lng === 'number')
  const withinRegion = (typeof form.lat === 'number') && (typeof form.lng === 'number') && (haversineKm({ lat: form.lat, lng: form.lng }, deliveryCenter) <= deliveryRadiusKm)
  const isValid = requiredFilled && phoneOk && pinOk && withinRegion

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
                {user && addresses.list.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm opacity-70">Choose a saved address</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[...addresses.list].sort((a,b)=> a.id===addresses.defaultId ? -1 : (b.id===addresses.defaultId ? 1 : 0)).map(a => (
                        <button key={a.id} type="button" className={`text-left rounded-lg border p-3 hover:shadow transition ${addresses.defaultId===a.id?'border-primary/60':'border-base-300/70'}`} onClick={()=>{
                          update('addressLine', [a.line1,a.line2].filter(Boolean).join(', '));
                          update('city', a.city || '');
                          update('pin', a.zip || '');
                          update('phone', form.phone || a.phone || '');
                          if (typeof a.lat === 'number') update('lat', a.lat); else update('lat', null);
                          if (typeof a.lng === 'number') update('lng', a.lng); else update('lng', null);
                        }}>
                          <div className="font-medium flex items-center gap-2">{a.name || a.tag || 'Address'} {addresses.defaultId===a.id && <span className="badge badge-xs badge-primary">Default</span>}</div>
                          <div className="text-xs opacity-80 whitespace-pre-line">{[a.line1,a.line2,a.city,a.state,a.zip].filter(Boolean).join(', ')}</div>
                        </button>
                      ))}
                    </div>
                    <div className="divider my-1"></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition">
                      <MdPerson className="w-4 h-4 opacity-70"/>
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-70" placeholder="Full name *" value={form.name} onChange={(e)=>update('name', e.target.value)} />
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="col-span-1 flex flex-col gap-1">
                    <div className={`flex items-center gap-2 px-2 border-b ${form.phone && !phoneOk ? 'border-error' : 'border-base-300'} focus-within:border-primary/60 transition`}>
                      <MdLocalPhone className="w-4 h-4 opacity-70"/>
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-70" placeholder="Phone" value={form.phone} onChange={(e)=>update('phone', e.target.value)} />
                    </div>
                    {form.phone && !phoneOk && <span className="text-error text-[10px]">Invalid phone</span>}
                  </div>
                  {/* Email */}
                  <div>
                    <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition">
                      <MdEmail className="w-4 h-4 opacity-70"/>
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-70" placeholder="Email" value={form.email} onChange={(e)=>update('email', e.target.value)} />
                    </div>
                  </div>
                  {/* Address line */
                  }
                  <div className="col-span-2 flex gap-2 items-center">
                    <div className="flex-1 flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition">
                      <MdPlace className="w-4 h-4 opacity-70"/>
                      <input ref={addrLineRef} className="w-full bg-transparent outline-none py-2 placeholder:opacity-70" placeholder="Address line *" value={form.addressLine} onChange={(e)=>update('addressLine', e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-sm btn-primary" onClick={()=>{
                      if (!('geolocation' in navigator)) return alert('Geolocation not supported')
                      navigator.geolocation.getCurrentPosition(async pos => {
                        const lat = pos.coords.latitude; const lng = pos.coords.longitude
                        update('lat', lat); update('lng', lng)
                        const parts = await reverseGeocode(lat, lng)
                        if (parts) {
                          update('addressLine', parts.line1 || form.addressLine)
                          update('city', parts.city || form.city)
                          update('pin', parts.zip || form.pin)
                        }
                      })
                    }}><span className="inline-flex items-center gap-1"><MdGpsFixed className="w-4 h-4"/> Share Precise Google Location</span></button>
                  </div>
                  {(typeof form.lat === 'number') && (typeof form.lng === 'number') && (haversineKm({ lat: form.lat, lng: form.lng }, deliveryCenter) > deliveryRadiusKm) && (
                    <div className="col-span-2 text-[11px] text-warning">This location looks outside our delivery area. Please pick a location within our service radius.</div>
                  )}
                  {/* City */}
                  <div>
                    <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition">
                      <MdLocationCity className="w-4 h-4 opacity-70"/>
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-70" placeholder="City *" value={form.city} onChange={(e)=>update('city', e.target.value)} />
                    </div>
                  </div>
                  {/* PIN */}
                  <div className="flex flex-col gap-1">
                    <div className={`flex items-center gap-2 px-2 border-b ${form.pin && !pinOk ? 'border-error' : 'border-base-300'} focus-within:border-primary/60 transition`}>
                      <MdPinDrop className="w-4 h-4 opacity-70"/>
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-70" placeholder="PIN *" value={form.pin} onChange={(e)=>update('pin', e.target.value)} />
                    </div>
                    {form.pin && !pinOk && <span className="text-error text-[10px]">Invalid PIN</span>}
                  </div>
                    {user && (
                    <label className="label cursor-pointer col-span-2 justify-start gap-2">
                      <input type="checkbox" className="checkbox checkbox-sm" checked={setAsDefault} onChange={(e)=> setSetAsDefault(e.target.checked)} />
                      <span className="label-text text-sm">Set as default</span>
                    </label>
                  )}
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
