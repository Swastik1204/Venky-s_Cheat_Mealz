import { useCart } from '../context/CartContext'
import { createOrder, fetchAddresses, addAddress, setDefaultAddress, createRazorpayOrder, verifyRazorpayPayment, BRAND_LONG, fetchUserProfile, updateAddress } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import { reverseGeocode, geocodeAddress } from '../lib/google'
import { MdPlace, MdLocalPhone, MdEmail, MdGpsFixed, MdLocationCity, MdPinDrop, MdPerson, MdApartment, MdMap, MdPayment, MdCreditCard, MdQrCode, MdBookmark } from 'react-icons/md'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete'

export default function Checkout() {
  const { entries, subtotal, setQty, remove, clear } = useCart()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState({ list: [], defaultId: null })
  const [profileInfo, setProfileInfo] = useState(null)
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Durgapur',
    state: 'West Bengal',
    pin: '',
    landmark: '',
    addressTag: 'Home',
    addressPhone: user?.phoneNumber || '',
    lat: null,
    lng: null,
    placeId: '',
    mapUrl: '',
    paymentMethod: 'cod',
    note: '',
  })
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const addrLineRef = useRef(null)
  const [setAsDefault, setSetAsDefault] = useState(false)
  const update = useCallback((k, v) => {
    setForm((s) => ({ ...s, [k]: v }))
  }, [])
  const handleAutocompleteSelect = useCallback((parts) => {
    if (!parts) return
    update('addressLine1', parts.line1 || parts.formatted || '')
    if (parts.line2) update('addressLine2', parts.line2)
    if (parts.city) update('city', parts.city)
    if (parts.state) update('state', parts.state)
    if (parts.zip) update('pin', parts.zip)
    if (typeof parts.lat === 'number') update('lat', parts.lat)
    if (typeof parts.lng === 'number') update('lng', parts.lng)
    if (parts.placeId) update('placeId', parts.placeId)
    if (parts.mapUrl) update('mapUrl', parts.mapUrl)
  }, [update])
  usePlacesAutocomplete(addrLineRef, handleAutocompleteSelect)
  const ensureRazorpay = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window object not available'))
    }
    if (window.Razorpay) {
      return Promise.resolve(window.Razorpay)
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => {
          if (window.Razorpay) {
            resolve(window.Razorpay)
          } else {
            reject(new Error('Razorpay SDK unavailable after load'))
          }
        }, { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')), { once: true })
      })
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        if (window.Razorpay) {
          resolve(window.Razorpay)
        } else {
          reject(new Error('Razorpay SDK unavailable after load'))
        }
      }
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })
  }, [])

  // Delivery geofencing via centralized hook
  const deliveryLocation = useDeliveryLocation()

  // Delivery settings are loaded by the hook

  useEffect(() => {
    if (!user) {
      setProfileInfo(null)
      return
    }
    let active = true
    fetchUserProfile(user.uid).then((profile) => {
      if (!active) return
      setProfileInfo(profile || null)
      setForm(prev => ({
        ...prev,
        name: profile?.displayName || prev.name || user.displayName || '',
        phone: profile?.phone || prev.phone || user.phoneNumber || '',
        email: profile?.email || prev.email || user.email || '',
        addressPhone: profile?.phone || prev.addressPhone || prev.phone || user.phoneNumber || '',
      }))
    }).catch(() => {
      if (!active) return
      setProfileInfo(null)
    })
    return () => { active = false }
  }, [user])

  // Load user's saved addresses
  useEffect(() => {
    let mounted = true
    if (!user) {
      setAddresses({ list: [], defaultId: null })
      return () => { mounted = false }
    }
    fetchAddresses(user.uid).then((a) => { if (mounted) setAddresses(a) }).catch(() => { if (mounted) setAddresses({ list: [], defaultId: null }) })
    return () => { mounted = false }
  }, [user])

  // Pre-select default address into the form for speed (only if form empty)
  useEffect(() => {
    if (!user) return
    if (form.addressLine1) return
    if (!addresses || !addresses.list?.length) return
    const def = addresses.list.find(a => a.id === addresses.defaultId) || addresses.list[0]
    if (!def) return
    setForm(prev => {
      if (prev.addressLine1) return prev
      return {
        ...prev,
        addressLine1: def.line1 || '',
        addressLine2: def.line2 || '',
        city: def.city || prev.city || 'Durgapur',
        state: def.state || prev.state || 'West Bengal',
        pin: def.zip || prev.pin || '',
        landmark: def.landmark || prev.landmark || '',
        addressTag: def.tag || prev.addressTag || 'Home',
        addressPhone: prev.addressPhone || def.phone || prev.phone || '',
        lat: typeof def.lat === 'number' ? def.lat : prev.lat,
        lng: typeof def.lng === 'number' ? def.lng : prev.lng,
        placeId: def.placeId || prev.placeId || '',
        mapUrl: def.mapUrl || prev.mapUrl || '',
      }
    })
    if (typeof def.lat !== 'number' || typeof def.lng !== 'number') {
      const query = [def.line1, def.line2, def.city, def.state, def.zip].filter(Boolean).join(', ')
      if (query) {
        geocodeAddress(query).then((geo) => {
          if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') return
          setForm(prev => ({
            ...prev,
            lat: geo.lat,
            lng: geo.lng,
            placeId: geo.placeId || prev.placeId || '',
            mapUrl: geo.mapUrl || prev.mapUrl || '',
          }))
        }).catch(() => {})
      }
    }
  }, [addresses, user, form.addressLine1])


  const [geoError, setGeoError] = useState('')
  const prevUserRef = useRef(user?.uid || null)

  useEffect(() => {
    const currentUid = user?.uid || null
    if (prevUserRef.current === currentUid) return
    prevUserRef.current = currentUid
    setForm({
      name: profileInfo?.displayName || user?.displayName || '',
      phone: profileInfo?.phone || user?.phoneNumber || '',
      email: profileInfo?.email || user?.email || '',
      addressLine1: '',
      addressLine2: '',
      city: 'Durgapur',
      state: 'West Bengal',
      pin: '',
      landmark: '',
      addressTag: 'Home',
      addressPhone: profileInfo?.phone || user?.phoneNumber || '',
      lat: null,
      lng: null,
      placeId: '',
      mapUrl: '',
      paymentMethod: 'cod',
      note: '',
    })
    setOrderId(null)
    setGeoError('')
    setSetAsDefault(false)
  }, [user, profileInfo])

  useEffect(() => {
    if (!profileInfo) return
    setForm(prev => ({
      ...prev,
      name: prev.name || profileInfo.displayName || user?.displayName || '',
      phone: prev.phone || profileInfo.phone || user?.phoneNumber || '',
      email: prev.email || profileInfo.email || user?.email || '',
      addressPhone: prev.addressPhone || profileInfo.phone || prev.phone || '',
    }))
  }, [profileInfo, user])

  useEffect(() => {
    if (!form.phone) return
    setForm(prev => {
      if (prev.addressPhone) return prev
      return { ...prev, addressPhone: prev.phone }
    })
  }, [form.phone])

  const handleUseCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Location access is not supported in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords
      update('lat', latitude)
      update('lng', longitude)
      setGeoError('')
      try {
        const parts = await reverseGeocode(latitude, longitude)
        if (parts) {
          if (parts.line1) update('addressLine1', parts.line1)
          if (parts.line2) update('addressLine2', parts.line2)
          if (parts.city) update('city', parts.city)
          if (parts.state) update('state', parts.state)
          if (parts.zip) update('pin', parts.zip)
          if (parts.placeId) update('placeId', parts.placeId)
          if (parts.mapUrl) update('mapUrl', parts.mapUrl)
        }
      } catch (err) {
        console.warn('[checkout] reverseGeocode failed', err)
      }
    }, () => {
      setGeoError('Unable to fetch your precise location. Please allow location access or fill the address manually.')
    })
  }, [update])

  const placeOrder = async () => {
    setGeoError('')
    if (!entries.length || placing) return

    let lat = typeof form.lat === 'number' ? form.lat : null
    let lng = typeof form.lng === 'number' ? form.lng : null
    let geoParts = null

  const addressLineCombined = [form.addressLine1, form.addressLine2].filter(Boolean).join(', ')
  const addressQuery = [addressLineCombined, form.city, form.state, form.pin].filter(Boolean).join(', ')
  const addressTagValue = (form.addressTag || '').trim() || 'Other'

    if ((lat == null || lng == null) && addressQuery) {
      try {
        const geo = await geocodeAddress(addressQuery)
        if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
          lat = geo.lat
          lng = geo.lng
          geoParts = geo
          update('lat', geo.lat)
          update('lng', geo.lng)
          if (!form.addressLine1 && geo.line1) update('addressLine1', geo.line1)
          if (geo.line2) update('addressLine2', geo.line2)
          if (geo.city) update('city', geo.city)
          if (geo.state) update('state', geo.state)
          if (geo.zip) update('pin', geo.zip)
          if (geo.placeId) update('placeId', geo.placeId)
          if (geo.mapUrl) update('mapUrl', geo.mapUrl)
        }
      } catch (err) {
        console.warn('[checkout] geocode fallback failed', err)
      }
    }

    const phoneRegex = /^\+?[0-9]{7,15}$/
    const pinRegex = /^[0-9]{4,8}$/
    const phoneOkNow = !form.phone || phoneRegex.test(form.phone)
    const addressPhoneOkNow = !form.addressPhone || phoneRegex.test(form.addressPhone)
    const pinOkNow = !form.pin || pinRegex.test(form.pin)
    const requiredFilledNow = Boolean(form.name && form.addressLine1 && form.city && form.pin && typeof lat === 'number' && typeof lng === 'number')
    const withinResult = (typeof lat === 'number' && typeof lng === 'number') ? deliveryLocation.checkWithin(lat, lng) : { ok: false, radiusKm: deliveryLocation.region?.radiusKm || 0, distance: 0 }
    if (!requiredFilledNow || !phoneOkNow || !pinOkNow || !withinResult.ok || !addressPhoneOkNow) {
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        setGeoError('Please select a valid address with location.')
      } else if (!withinResult.ok) {
        setGeoError(`Address is outside delivery region. Please select an address within ${withinResult.radiusKm} km.`)
      } else if (!phoneOkNow) {
        setGeoError('Please enter a valid contact phone number.')
      } else if (!addressPhoneOkNow) {
        setGeoError('Please enter a valid phone number for the address.')
      } else if (!pinOkNow) {
        setGeoError('Please enter a valid PIN code.')
      } else {
        setGeoError('Please fill all required fields correctly.')
      }
      return
    }

    setPlacing(true)
    try {
      let savedAddrId = null
      if (user && form.addressLine1) {
        const addr = {
          name: addressTagValue,
          line1: form.addressLine1,
          line2: form.addressLine2,
          city: form.city,
          state: form.state,
          zip: form.pin,
          landmark: form.landmark,
          phone: form.addressPhone || form.phone,
          tag: addressTagValue,
          lat,
          lng,
        }
        const placeIdSource = geoParts?.placeId || form.placeId
        const mapUrlSource = geoParts?.mapUrl || form.mapUrl
        const normalized = (value) => (value || '').replace(/\s+/g, ' ').trim().toLowerCase()
        const match = (addresses?.list || []).find(a => {
          if (placeIdSource && a.placeId && a.placeId === placeIdSource) return true
          const lineKeyExisting = [a.line1, a.line2, a.city, a.zip].map(normalized).join('|')
          const lineKeyCurrent = [addr.line1, addr.line2, addr.city, addr.zip].map(normalized).join('|')
          return lineKeyExisting === lineKeyCurrent
        })

        const resolvedPlaceId = placeIdSource || match?.placeId || form.placeId || undefined
        const resolvedMapUrl = mapUrlSource || match?.mapUrl || form.mapUrl || undefined
        if (resolvedPlaceId) addr.placeId = resolvedPlaceId
        if (resolvedMapUrl) addr.mapUrl = resolvedMapUrl

        if (match) {
          savedAddrId = match.id
          const patch = {
            name: addr.name,
            tag: addr.tag,
            line1: addr.line1,
            ...(addr.line2 ? { line2: addr.line2 } : {}),
            city: addr.city,
            zip: addr.zip,
            ...(addr.phone ? { phone: addr.phone } : {}),
            ...(typeof addr.lat === 'number' ? { lat: addr.lat } : {}),
            ...(typeof addr.lng === 'number' ? { lng: addr.lng } : {}),
            ...(addr.placeId ? { placeId: addr.placeId } : {}),
            ...(addr.mapUrl ? { mapUrl: addr.mapUrl } : {}),
          }
          try { await updateAddress(user.uid, match.id, patch) } catch (e) { void e }
        } else {
          try { savedAddrId = await addAddress(user.uid, addr) } catch (e) { void e }
        }

        if (savedAddrId && setAsDefault) {
          try { await setDefaultAddress(user.uid, savedAddrId) } catch (e) { void e }
        }
        if (user) {
          fetchAddresses(user.uid).then(setAddresses).catch(() => {})
        }
      }

      const isOnlinePayment = form.paymentMethod !== 'cod'
      const paymentInfo = isOnlinePayment
        ? { method: form.paymentMethod, gateway: 'razorpay', status: 'initiated' }
        : { method: 'cod', status: 'pending' }

      let razorpayOrderId = null
      if (isOnlinePayment) {
        const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
        if (!keyId) {
          throw new Error('Online payments are not configured yet. Please contact support.')
        }
        const amountRupees = Number(subtotal)
        if (!amountRupees || amountRupees <= 0) {
          throw new Error('Cart total must be greater than zero for online payment.')
        }
        const razorpayOrder = await createRazorpayOrder(amountRupees)
        razorpayOrderId = razorpayOrder.orderId
        const RazorpayConstructor = await ensureRazorpay()
        let settled = false
        const paymentResponse = await new Promise((resolve, reject) => {
          const instance = new RazorpayConstructor({
            key: keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: BRAND_LONG,
            description: 'Order payment',
            order_id: razorpayOrder.orderId,
            prefill: {
              name: form.name || '',
              email: form.email || '',
              contact: form.phone || ''
            },
            notes: {
              cartSize: String(entries.length)
            },
            theme: {
              color: '#F97316'
            },
            handler: (response) => {
              if (settled) return
              settled = true
              resolve({
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                orderId: response.razorpay_order_id
              })
            },
            modal: {
              ondismiss: () => {
                if (!settled) {
                  settled = true
                  reject(new Error('Payment cancelled'))
                }
              }
            }
          })
          instance.on('payment.failed', (event) => {
            if (settled) return
            settled = true
            const description = event?.error?.description || 'Payment failed'
            reject(new Error(description))
          })
          instance.open()
        })

        const verification = await verifyRazorpayPayment({
          orderId: razorpayOrderId,
          paymentId: paymentResponse.paymentId,
          signature: paymentResponse.signature
        })
        if (!verification?.valid) {
          throw new Error('Payment verification failed. Please contact support.')
        }
        paymentInfo.status = 'paid'
        paymentInfo.paymentId = paymentResponse.paymentId
        paymentInfo.orderId = razorpayOrderId
        paymentInfo.signature = paymentResponse.signature
        paymentInfo.amount = Number(subtotal)
        paymentInfo.currency = razorpayOrder.currency
        paymentInfo.verified = true
      }

      const orderIdValue = await createOrder({
        userId: user?.uid || null,
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: {
            tag: addressTagValue,
            name: addressTagValue,
            line: addressLineCombined,
            line1: form.addressLine1,
            line2: form.addressLine2,
            city: form.city,
            state: form.state,
            pin: form.pin,
            landmark: form.landmark,
            phone: form.addressPhone || form.phone,
            lat,
            lng,
            ...(geoParts?.placeId || form.placeId ? { placeId: geoParts?.placeId || form.placeId } : {}),
            ...(geoParts?.mapUrl || form.mapUrl ? { mapUrl: geoParts?.mapUrl || form.mapUrl } : {}),
          },
          note: form.note,
          payment: paymentInfo,
        },
        items: entries.map(({ item, qty }) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty,
        })),
        totalAmount: Number(subtotal)
      })
      setOrderId(orderIdValue)
      clear()
    } catch (e) {
      console.error(e)
      setGeoError(e.message || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const phoneOk = !form.phone || /^\+?[0-9]{7,15}$/.test(form.phone)
  const addressPhoneOk = !form.addressPhone || /^\+?[0-9]{7,15}$/.test(form.addressPhone)
  const pinOk = !form.pin || /^[0-9]{4,8}$/.test(form.pin)
  const requiredFilled = form.name && form.addressLine1 && form.city && form.pin && (typeof form.lat === 'number') && (typeof form.lng === 'number')
  const withinRegion = (typeof form.lat === 'number') && (typeof form.lng === 'number') && deliveryLocation.checkWithin(form.lat, form.lng).ok
  const isValid = requiredFilled && phoneOk && pinOk && withinRegion && addressPhoneOk
  const paymentOptions = [
    { key: 'cod', label: 'Cash on Delivery', helper: 'Pay when the order arrives.', Icon: MdPayment },
    { key: 'upi', label: 'UPI (Razorpay)', helper: 'PhonePe, Google Pay, BHIM, etc.', Icon: MdQrCode },
    { key: 'card', label: 'Card (Razorpay)', helper: 'Debit & credit cards via Razorpay.', Icon: MdCreditCard }
  ]
  const paymentIsOnline = form.paymentMethod !== 'cod'
  const locationOutsideRegion = (typeof form.lat === 'number') && (typeof form.lng === 'number') && !deliveryLocation.checkWithin(form.lat, form.lng).ok
  const addressSummary = [form.addressLine1, form.addressLine2, form.city, form.state, form.pin].filter(Boolean).join(', ')
  const sortedAddresses = [...(addresses?.list || [])].sort((a, b) => {
    if (a.id === addresses.defaultId) return -1
    if (b.id === addresses.defaultId) return 1
    return 0
  })

  return (
    <div className="page-wrap py-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      {geoError && <div className="alert alert-error mb-4"><span>{geoError}</span></div>}
      {orderId && (
        <div className="alert alert-success mb-6">
          <span>Order placed successfully. ID: <strong>{orderId}</strong></span>
        </div>
      )}
      {entries.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="bg-base-100 rounded-xl shadow-md p-8 flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="text-2xl font-semibold text-center">Your cart is empty!</div>
            <div className="text-center text-base opacity-80">Looks like you haven't added anything yet.<br/>Browse our menu and add your favorite items to the cart.</div>
            <button
              className="btn btn-primary btn-wide mt-2"
              onClick={() => window.location.href = '/'}
            >Go to Home &amp; Add Items</button>
          </div>
        </div>
      ) : (
        <div className="grid xl:grid-cols-[1.65fr_1fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="card card-surface">
              <div className="card-body gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="card-title text-lg">Your Order</h2>
                    <p className="text-xs opacity-70">Review items before placing the order.</p>
                  </div>
                  <span className="badge badge-ghost badge-sm">{entries.length} item{entries.length === 1 ? '' : 's'}</span>
                </div>
                <div className="space-y-4">
                  {entries.map(({ item, qty }) => (
                    <div key={item.id} className="rounded-xl border border-base-300/70 bg-base-100/70 p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold leading-tight">{item.name}</h3>
                          <div className="text-xs opacity-70">₹{item.price} each</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">₹{item.price * qty}</div>
                          <div className="text-[11px] opacity-60">Qty × price</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button className="btn btn-sm" onClick={() => setQty(item.id, Math.max(1, qty - 1))}>-</button>
                          <input
                            type="number"
                            min={1}
                            className="input input-sm input-bordered w-20 text-center"
                            value={qty}
                            onChange={(e) => setQty(item.id, Math.max(1, Number(e.target.value) || 1))}
                          />
                          <button className="btn btn-sm" onClick={() => setQty(item.id, qty + 1)}>+</button>
                        </div>
                        <button className="btn btn-ghost btn-sm text-error" onClick={() => remove(item.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card card-surface">
              <div className="card-body gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="card-title text-lg">Contact Details</h2>
                    <p className="text-xs opacity-70">We will send timely updates to these details.</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide opacity-60">Full name *</label>
                    <div className="flex items-center gap-2 px-3 border border-base-300 focus-within:border-primary/60 transition rounded-lg bg-base-100/70">
                      <MdPerson className="w-4 h-4 opacity-70" />
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="Enter full name" autoComplete="name" value={form.name} onChange={(e)=>update('name', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide opacity-60">Phone *</label>
                    <div className={`flex items-center gap-2 px-3 border ${form.phone && !phoneOk ? 'border-error' : 'border-base-300'} focus-within:border-primary/60 transition rounded-lg bg-base-100/70`}>
                      <MdLocalPhone className="w-4 h-4 opacity-70" />
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="Contact number" autoComplete="tel" value={form.phone} onChange={(e)=>update('phone', e.target.value)} />
                    </div>
                    {form.phone && !phoneOk && <span className="text-[11px] text-error">Enter a valid phone number.</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide opacity-60">Email</label>
                    <div className="flex items-center gap-2 px-3 border border-base-300 focus-within:border-primary/60 transition rounded-lg bg-base-100/70">
                      <MdEmail className="w-4 h-4 opacity-70" />
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" type="email" placeholder="Email for receipt (optional)" autoComplete="email" value={form.email} onChange={(e)=>update('email', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label justify-start gap-2 text-xs font-medium uppercase tracking-wide opacity-60">Order instructions</label>
                  <textarea className="textarea textarea-bordered min-h-[100px]" placeholder="Add delivery instructions or notes (optional)" autoComplete="off" value={form.note} onChange={(e) => update('note', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card card-surface">
              <div className="card-body gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="card-title text-lg">Delivery Address</h2>
                    <p className="text-xs opacity-70">This behaves exactly like the profile address modal.</p>
                  </div>
                  {form.addressTag && <span className="badge badge-primary badge-sm flex items-center gap-1"><MdBookmark className="w-3.5 h-3.5" />{form.addressTag}</span>}
                </div>
                {user && sortedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide opacity-60">
                      <span>Saved addresses</span>
                      <span className="badge badge-ghost badge-xs">{sortedAddresses.length}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {sortedAddresses.map(a => (
                        <button key={a.id} type="button" className={`rounded-xl border p-3 text-left transition hover:shadow ${addresses.defaultId===a.id || form.placeId === a.placeId ? 'border-primary/60 bg-primary/5' : 'border-base-300/70'}`} onClick={()=>{
                          setForm(prev => ({
                            ...prev,
                            addressLine1: a.line1 || '',
                            addressLine2: a.line2 || '',
                            city: a.city || prev.city || 'Durgapur',
                            state: a.state || prev.state || 'West Bengal',
                            pin: a.zip || '',
                            landmark: a.landmark || '',
                            addressTag: a.tag || prev.addressTag || 'Other',
                            addressPhone: a.phone || prev.addressPhone || prev.phone || '',
                            lat: typeof a.lat === 'number' ? a.lat : null,
                            lng: typeof a.lng === 'number' ? a.lng : null,
                            placeId: a.placeId || '',
                            mapUrl: a.mapUrl || '',
                          }))
                          setGeoError('')
                          if (typeof a.lat !== 'number' || typeof a.lng !== 'number') {
                            const query = [a.line1, a.line2, a.city, a.state, a.zip].filter(Boolean).join(', ')
                            if (query) {
                              geocodeAddress(query).then((geo) => {
                                if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') return
                                setForm(prev => ({
                                  ...prev,
                                  lat: geo.lat,
                                  lng: geo.lng,
                                  placeId: geo.placeId || prev.placeId || '',
                                  mapUrl: geo.mapUrl || prev.mapUrl || '',
                                }))
                              }).catch(() => {})
                            }
                          }
                        }}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm">{a.name || a.tag || 'Address'}</span>
                            {addresses.defaultId===a.id && <span className="badge badge-primary badge-xs">Default</span>}
                          </div>
                          <p className="text-xs opacity-70 leading-relaxed mt-1">{[a.line1,a.line2,a.city,a.state,a.zip].filter(Boolean).join(', ')}</p>
                        </button>
                      ))}
                    </div>
                    <div className="divider my-1"></div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap text-sm">
                    <span className="text-xs uppercase tracking-wide opacity-60">Address type</span>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" className="radio radio-sm" name="checkoutAddrTag" checked={form.addressTag === 'Home'} onChange={()=>update('addressTag', 'Home')} />
                      <span>Home</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" className="radio radio-sm" name="checkoutAddrTag" checked={form.addressTag === 'Work'} onChange={()=>update('addressTag', 'Work')} />
                      <span>Work</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" className="radio radio-sm" name="checkoutAddrTag" checked={form.addressTag !== 'Home' && form.addressTag !== 'Work'} onChange={()=>update('addressTag', form.addressTag !== 'Home' && form.addressTag !== 'Work' ? form.addressTag : 'Other')} />
                      <span>Other</span>
                    </label>
                    {form.addressTag !== 'Home' && form.addressTag !== 'Work' && (
                      <input className="input input-sm input-bordered w-32" placeholder="Label" value={form.addressTag} onChange={(e)=>update('addressTag', e.target.value)} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide opacity-60">Address line 1 *</label>
                    <div className="flex items-center gap-2 px-3 border border-base-300 focus-within:border-primary/60 transition rounded-lg bg-base-100/70">
                      <MdPlace className="w-4 h-4 opacity-70" />
                      <input ref={addrLineRef} className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="Flat / House no., Street" autoComplete="address-line1" value={form.addressLine1} onChange={(e)=>update('addressLine1', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide opacity-60">Address line 2</label>
                    <div className="flex items-center gap-2 px-3 border border-base-300 focus-within:border-primary/60 transition rounded-lg bg-base-100/70">
                      <MdApartment className="w-4 h-4 opacity-70" />
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="Area / Locality" autoComplete="address-line2" value={form.addressLine2} onChange={(e)=>update('addressLine2', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide opacity-60">City *</label>
                      <div className="flex items-center gap-2 px-3 border border-base-300 focus-within:border-primary/60 transition rounded-lg bg-base-100/70">
                        <MdLocationCity className="w-4 h-4 opacity-70" />
                        <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="City" autoComplete="address-level2" value={form.city} onChange={(e)=>update('city', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide opacity-60">State</label>
                      <div className="flex items-center gap-2 px-3 border border-base-300 focus-within:border-primary/60 transition rounded-lg bg-base-100/70">
                        <MdMap className="w-4 h-4 opacity-70" />
                        <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="State" autoComplete="address-level1" value={form.state} onChange={(e)=>update('state', e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide opacity-60">PIN *</label>
                      <div className={`flex items-center gap-2 px-3 border ${form.pin && !pinOk ? 'border-error' : 'border-base-300'} focus-within:border-primary/60 transition rounded-lg bg-base-100/70`}>
                        <MdPinDrop className="w-4 h-4 opacity-70" />
                        <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="PIN code" autoComplete="postal-code" value={form.pin} onChange={(e)=>update('pin', e.target.value)} />
                      </div>
                      {form.pin && !pinOk && <span className="text-[11px] text-error">Enter a valid PIN.</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide opacity-60">Address phone</label>
                      <div className={`flex items-center gap-2 px-3 border ${form.addressPhone && !addressPhoneOk ? 'border-error' : 'border-base-300'} focus-within:border-primary/60 transition rounded-lg bg-base-100/70`}>
                        <MdLocalPhone className="w-4 h-4 opacity-70" />
                        <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="Alternate number (optional)" autoComplete="tel" value={form.addressPhone} onChange={(e)=>update('addressPhone', e.target.value)} />
                      </div>
                      {form.addressPhone && !addressPhoneOk && <span className="text-[11px] text-error">Enter a valid phone number.</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide opacity-60">Landmark</label>
                    <div className="flex items-center gap-2 px-3 border border-base-300 focus-within:border-primary/60 transition rounded-lg bg-base-100/70">
                      <MdPlace className="w-4 h-4 opacity-70" />
                      <input className="w-full bg-transparent outline-none py-2 placeholder:opacity-60" placeholder="Nearby landmark (optional)" autoComplete="off" value={form.landmark} onChange={(e)=>update('landmark', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button type="button" className="btn btn-sm btn-primary" onClick={handleUseCurrentLocation}>
                      <span className="inline-flex items-center gap-2"><MdGpsFixed className="w-4 h-4" /> Use current location</span>
                    </button>
                    {user && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" className="checkbox checkbox-sm" checked={setAsDefault} onChange={(e)=> setSetAsDefault(e.target.checked)} />
                        <span>Set as default for next time</span>
                      </label>
                    )}
                  </div>
                  {locationOutsideRegion && (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-[12px] leading-relaxed text-warning-content">
                      This location looks outside our delivery area. Please choose an address within {deliveryLocation.region?.radiusKm ?? '?'} km of our kitchen.
                    </div>
                  )}
                  {addressSummary && (
                    <div className="rounded-lg border border-base-300/60 bg-base-200/60 p-3 text-xs leading-relaxed">
                      <span className="font-medium">Deliver to:</span> {addressSummary}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card card-surface">
              <div className="card-body gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="card-title text-lg">Payment</h2>
                    <p className="text-xs opacity-70">Secure checkout powered by Razorpay.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {paymentOptions.map(({ key, label, helper, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      className={`rounded-xl border p-4 text-left transition ${form.paymentMethod === key ? 'border-primary/70 bg-primary/10 shadow-sm' : 'border-base-300/70 hover:border-primary/40'}`}
                      onClick={() => update('paymentMethod', key)}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className={`${form.paymentMethod === key ? 'text-primary' : 'opacity-80'} w-5 h-5`} />
                        <span>{label}</span>
                      </div>
                      <p className="text-xs opacity-70 mt-1 leading-relaxed">{helper}</p>
                    </button>
                  ))}
                </div>
                {paymentIsOnline ? (
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <span className="uppercase tracking-wide text-xs">Razorpay</span>
                      <span className="badge badge-primary badge-xs">Secure</span>
                    </div>
                    <p className="opacity-80 leading-relaxed">You will be redirected to Razorpay's encrypted checkout to complete the payment instantly.</p>
                    <ul className="text-xs opacity-70 space-y-1 list-disc pl-5">
                      <li>Supports UPI apps, debit/credit cards, and net banking.</li>
                      <li>No additional charges; confirmation happens in real-time.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-base-300/70 bg-base-200/60 p-4 text-sm opacity-80">Hand over cash to our rider when your order arrives.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card card-surface sticky top-24">
              <div className="card-body gap-4">
                <div>
                  <h2 className="card-title text-lg">Order Summary</h2>
                  {addressSummary && <p className="text-xs opacity-60 mt-1 leading-relaxed">{addressSummary}</p>}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Items subtotal</span><span>₹{subtotal}</span></div>
                  <div className="flex justify-between opacity-80"><span>Delivery</span><span>₹0</span></div>
                </div>
                <div className="divider my-2"></div>
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide opacity-60">
                  <span>Payment method</span>
                  <span className="font-semibold text-base-content">{form.paymentMethod.toUpperCase()}</span>
                </div>
                <button className="btn btn-primary btn-block mt-2" disabled={placing || !isValid} onClick={placeOrder}>{placing ? 'Placing order...' : `Place Order (${form.paymentMethod === 'cod' ? 'COD' : 'Razorpay'})`}</button>
                {!isValid && (
                  <p className="text-xs text-error/80 leading-relaxed">Complete the highlighted details and ensure the address is within our delivery radius to continue.</p>
                )}
                {paymentIsOnline && (
                  <p className="text-[11px] opacity-60">Razorpay may open in a new window. Allow pop-ups for a smooth experience.</p>
                )}
              </div>
            </div>
            <div className="card card-surface">
              <div className="card-body gap-3 text-sm opacity-70">
                <span className="font-semibold text-base-content">Need help?</span>
                <p>Questions about delivery or payments? Start a conversation with us from the Contact page.</p>
                <a className="btn btn-ghost btn-sm w-full" href="/contact">Contact Support</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
