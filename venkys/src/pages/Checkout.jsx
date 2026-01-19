import { useCart } from '../context/CartContext'
import { createOrder, fetchAddresses, addAddress, setDefaultAddress, createRazorpayOrder, verifyRazorpayPayment, BRAND_LONG, fetchUserProfile, updateAddress, fetchOrder, getRazorpayKeyId } from '../lib/data'
import { sendBillToCustomer } from '../lib/whatsapp'
import { useAuth } from '../context/AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import { reverseGeocode, geocodeAddress } from '../lib/google'
import { MdPlace, MdLocalPhone, MdEmail, MdGpsFixed, MdLocationCity, MdPinDrop, MdPerson, MdApartment, MdMap, MdPayment, MdCreditCard, MdQrCode, MdBookmark, MdAdd, MdArrowForward, MdCheck, MdEdit } from 'react-icons/md'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete'
import { useUI } from '../context/UIContext'
import { db } from '../lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const CHECKOUT_PAYMENT_OPTIONS = [
  { key: 'cod', label: 'Cash on Delivery', helper: 'Pay when the order arrives.', icon: MdPayment },
  { key: 'upi', label: 'UPI (Razorpay)', helper: 'PhonePe, Google Pay, BHIM, etc.', icon: MdQrCode },
  { key: 'card', label: 'Card (Razorpay)', helper: 'Debit & credit cards via Razorpay.', icon: MdCreditCard }
]

function checkoutTimestampToDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : new Date(parsed)
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }
  return null
}

function buildOrderStatusTimeline(order) {
  if (!order) return []
  if (Array.isArray(order.statusHistory) && order.statusHistory.length) {
    return [...order.statusHistory]
      .map((entry) => ({
        status: entry?.status || order.status || 'placed',
        at: checkoutTimestampToDate(entry?.at) || checkoutTimestampToDate(order.updatedAt) || checkoutTimestampToDate(order.createdAt) || new Date(),
        actor: entry?.actor || 'system',
      }))
      .sort((a, b) => (a.at?.getTime() || 0) - (b.at?.getTime() || 0))
  }
  const fallbackAt = checkoutTimestampToDate(order.updatedAt) || checkoutTimestampToDate(order.createdAt) || new Date()
  return [{ status: order.status || 'placed', at: fallbackAt, actor: order.customer?.name || 'system' }]
}

function paymentStatusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'badge-success'
    case 'pending':
      return 'badge-warning'
    case 'failed':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

export default function Checkout() {
  const { entries, subtotal, setQty, remove, clear } = useCart()
  const { user } = useAuth()
  const { pushToast } = useUI()
  const navigate = useNavigate()
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
  const [latestOrderSummary, setLatestOrderSummary] = useState(null)
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [activeAddressId, setActiveAddressId] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [fieldError, setFieldError] = useState(null) // 'name' | 'phone' | 'addressLine1' | 'addressLine2' | 'pin' | 'location' | null
  const [gettingLocation, setGettingLocation] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1=contact, 2=address, 3=payment
  const [confirmedSteps, setConfirmedSteps] = useState({ contact: false, address: false })
  const [highlightGPSButton, setHighlightGPSButton] = useState(false)

  useEffect(() => {
    if (!orderId) return
    navigate(`/active-orders?id=${encodeURIComponent(orderId)}`, { replace: true })
  }, [navigate, orderId])
  // Refs for auto-scrolling to form sections
  const nameRef = useRef(null)
  const phoneRef = useRef(null)
  const addressSectionRef = useRef(null)
  const addressLine1Ref = useRef(null)
  const addressLine2Ref = useRef(null)
  const landmarkRef = useRef(null)
  const pinRef = useRef(null)
  const paymentRef = useRef(null)

  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return
    try {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (typeof ref.current.focus === 'function') ref.current.focus()
      else {
        const el = ref.current.querySelector?.('input, textarea, select, button')
        if (el && typeof el.focus === 'function') el.focus()
      }
    } catch {
      // best-effort
    }
  }, [])

  // Guided form-filling: detect next incomplete field
  const phoneRegex = /^\+?[0-9]{7,15}$/
  const pinRegex = /^[0-9]{4,8}$/
  const getNextIncompleteField = useCallback(() => {
    const usingSavedAddress = !!activeAddressId && !showAddressForm
    // Step 1: Contact details
    if (!form.name) return { step: 1, field: 'name', ref: nameRef, label: 'Full Name', hint: 'Enter your full name' }
    if (!form.phone) return { step: 1, field: 'phone', ref: phoneRef, label: 'Phone Number', hint: 'Enter your phone number' }
    if (form.phone && !phoneRegex.test(form.phone)) return { step: 1, field: 'phone', ref: phoneRef, label: 'Phone Number', hint: 'Enter a valid phone number' }
    // Step 2: Address details (required fields first)
    if (!usingSavedAddress && !form.addressLine1) return { step: 2, field: 'addressLine1', ref: addressLine1Ref, label: 'House/Flat + Street', hint: 'Enter your house number and street' }
    if (!form.addressLine2) return { step: 2, field: 'addressLine2', ref: addressLine2Ref, label: 'Area/Locality', hint: 'Type your area and pick a Google suggestion' }
    if (!form.pin) return { step: 2, field: 'pin', ref: pinRef, label: 'PIN Code', hint: 'Enter your PIN code' }
    if (form.pin && !pinRegex.test(form.pin)) return { step: 2, field: 'pin', ref: pinRef, label: 'PIN Code', hint: 'Enter a valid PIN code' }
    if (typeof form.lat !== 'number' || typeof form.lng !== 'number') return { step: 2, field: 'location', ref: addressSectionRef, label: 'Location', hint: 'Use "Current location" or pick from Google suggestions' }
    // Landmark is optional - suggest it after required fields if still empty
    if (!form.landmark) return { step: 2, field: 'landmark', ref: landmarkRef, label: 'Landmark (optional)', hint: 'Add a nearby landmark for faster delivery', optional: true }
    // Step 3: Payment
    if (!form.paymentMethod) return { step: 3, field: 'paymentMethod', ref: paymentRef, label: 'Payment Method', hint: 'Select a payment method' }
    return null // All complete
  }, [form, activeAddressId, showAddressForm])

  // Auto-guide to next incomplete field
  const guideToNextField = useCallback(() => {
    const next = getNextIncompleteField()
    if (!next) {
      pushToast('All details filled! You can place your order.', 'success', 3000)
      return
    }
    setCurrentStep(next.step)
    if (next.step === 2) setShowAddressForm(true)
    // Don't highlight optional fields as errors
    if (!next.optional) setFieldError(next.field)
    pushToast(`${next.optional ? '💡 Tip' : 'Next'}: ${next.hint}`, next.optional ? 'info' : 'info', 4000)
    setTimeout(() => scrollToRef(next.ref), 100)
  }, [getNextIncompleteField, scrollToRef, pushToast])

  const setErrorAndScroll = useCallback((target, message, ref) => {
    setFieldError(target)
    setGeoError(message)
    if (message) pushToast(message, 'error', 5000)
    if (ref) scrollToRef(ref)
  }, [scrollToRef, pushToast])

  // Auto-track current step based on field being edited
  const contactFields = ['name', 'phone', 'email', 'note']
  const addressFields = ['addressLine1', 'addressLine2', 'city', 'state', 'pin', 'landmark', 'addressTag', 'addressPhone', 'lat', 'lng', 'placeId', 'mapUrl']
  const paymentFields = ['paymentMethod']

  const update = useCallback((k, v) => {
    setForm((s) => ({ ...s, [k]: v }))
    // Clear targeted error as user edits that field
    setFieldError((prev) => (prev === k ? null : prev))
    // Auto-update current step indicator
    if (contactFields.includes(k)) {
      setCurrentStep(1)
      setConfirmedSteps((prev) => (prev.contact ? { ...prev, contact: false } : prev))
    }
    else if (addressFields.includes(k)) {
      setCurrentStep(2)
      setConfirmedSteps((prev) => (prev.address ? { ...prev, address: false } : prev))
    }
    else if (paymentFields.includes(k)) setCurrentStep(3)
  }, [])
  const handleAutocompleteSelect = useCallback((parts, place) => {
    if (!parts) return
    // Address line 1 is for house/flat/building; line 2 is for Area/Locality.
    const placeName = typeof place?.name === 'string' ? place.name.trim() : ''
    const partsCity = typeof parts.city === 'string' ? parts.city.trim() : ''
    const partsCityOk = partsCity && partsCity.toLowerCase() !== 'durgapur' ? partsCity : ''
    const locality = (parts.line2 || '').trim() || placeName || partsCityOk
    update('addressLine2', locality || '')
    // City is fixed to Durgapur; do not override from Google
    update('city', 'Durgapur')
    if (parts.state) update('state', parts.state)
    if (parts.zip) update('pin', parts.zip)
    if (typeof parts.lat === 'number') update('lat', parts.lat)
    if (typeof parts.lng === 'number') update('lng', parts.lng)
    if (parts.placeId) update('placeId', parts.placeId)
    if (parts.mapUrl) update('mapUrl', parts.mapUrl)
    // Clear GPS button highlight since location is now set
    setHighlightGPSButton(false)
  }, [update])
  // Attach autocomplete to Address line 2 (auto-filled), not line 1
  usePlacesAutocomplete(addressLine2Ref, handleAutocompleteSelect)

  const handleAddressLine2Change = useCallback((value) => {
    const next = String(value ?? '')
    setForm((s) => ({
      ...s,
      addressLine2: next,
      // If user edits locality manually, require re-confirming location
      lat: null,
      lng: null,
      placeId: '',
      mapUrl: '',
    }))
    setFieldError((prev) => (prev === 'addressLine2' ? null : prev))
    setCurrentStep(2)
  }, [])
  const fillFromAddress = useCallback((a) => {
    if (!a) return
    setConfirmedSteps((prev) => ({ ...prev, address: false }))
    setForm(prev => ({
      ...prev,
      addressLine1: a.line1 || '',
      addressLine2: a.line2 || '',
      city: 'Durgapur',
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
    setActiveAddressId(a.id || null)
    setShowAddressForm(false)
    setSetAsDefault(false)
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
  }, [setGeoError, setForm, setActiveAddressId, setShowAddressForm, setSetAsDefault])
  const handleStartNewAddress = useCallback(() => {
    setActiveAddressId(null)
    setShowAddressForm(true)
    setConfirmedSteps((prev) => ({ ...prev, address: false }))
    setGeoError('')
    setSetAsDefault(!(addresses?.list?.length))
    setForm(prev => ({
      ...prev,
      addressLine1: '',
      addressLine2: '',
      city: 'Durgapur',
      state: 'West Bengal',
      pin: '',
      landmark: '',
      addressTag: 'Home',
      addressPhone: prev.addressPhone || prev.phone || '',
      lat: null,
      lng: null,
      placeId: '',
      mapUrl: '',
    }))
  }, [addresses, setGeoError, setForm, setActiveAddressId, setShowAddressForm, setSetAsDefault])
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

  // Real-time order status updates after order is placed
  useEffect(() => {
    if (!orderId) return;
    
    // Orders are stored in the top-level `orders/{orderId}` collection.
    const orderDocRef = doc(db, 'orders', orderId)
    
    const unsub = onSnapshot(orderDocRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setLatestOrderSummary(prev => ({
        ...prev,
        id: data.orderNo || orderId,
        payment: data.payment || prev?.payment,
        status: data.status,
        statusHistory: buildOrderStatusTimeline(data),
      }));
    }, (err) => {
      console.warn('[checkout] Order snapshot error:', err);
    });
    
    return () => unsub();
  }, [orderId, user?.uid]);

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
    if (!user) {
      setActiveAddressId(null)
      setShowAddressForm(true)
      return
    }
    if (showAddressForm) return
    if (form.addressLine1) return
    if (!addresses || !addresses.list?.length) {
      setShowAddressForm(false)
      setActiveAddressId(null)
      return
    }
    const def = addresses.list.find(a => a.id === addresses.defaultId) || addresses.list[0]
    if (!def) return
    fillFromAddress(def)
  }, [addresses, user, form.addressLine1, showAddressForm, fillFromAddress, setActiveAddressId, setShowAddressForm])
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
  setLatestOrderSummary(null)
    setGeoError('')
    setSetAsDefault(false)
    setActiveAddressId(null)
    setShowAddressForm(!currentUid)
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

  const handleAutoFillLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setShowAddressForm(true)
      setFieldError('location')
      const msg = 'Location is not available in this browser. Please type your address manually.'
      setGeoError(msg)
      pushToast(msg, 'error', 5000)
      return
    }
    
    setGettingLocation(true)
    setGeoError('')
    setFieldError(null)
    
    // Check current permission state
    let permissionState = 'prompt'
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        permissionState = result.state
      }
    } catch {
      // Some browsers don't support permission query
    }
    
    // If denied, show helpful message with instructions
    if (permissionState === 'denied') {
      setGettingLocation(false)
      setShowAddressForm(true)
      setFieldError('location')
      const msg = 'Location permission is OFF. Turn it ON in browser settings, then tap “Use current location” again.'
      setGeoError(msg)
      pushToast(msg, 'error', 5000)
      if (addressSectionRef.current) {
        try { addressSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch { void 0 }
      }
      return
    }
    
    // Request location with high accuracy
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        update('lat', latitude)
        update('lng', longitude)
        setGeoError('')
        setHighlightGPSButton(false)
        
        // Check if within delivery region
        const withinCheck = deliveryLocation.checkWithin(latitude, longitude)
        if (!withinCheck.ok) {
          setFieldError('location')
          const msg = `We deliver within ${withinCheck.radiusKm} km of Durgapur. This location is ~${withinCheck.distance.toFixed(1)} km away. Please choose a closer address.`
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        }
        
        try {
          const parts = await reverseGeocode(latitude, longitude)
          if (parts) {
            // Auto-fill all address fields from reverse geocode
            // Keep line 1 for manual entry; put autofill into line 2
            const autoAddress = parts.formatted || [parts.line1, parts.line2].filter(Boolean).join(', ')
            update('addressLine2', autoAddress || '')
            // City fixed to Durgapur
            update('city', 'Durgapur')
            if (parts.state) update('state', parts.state)
            if (parts.zip) update('pin', parts.zip)
            if (parts.placeId) update('placeId', parts.placeId)
            if (parts.mapUrl) update('mapUrl', parts.mapUrl)
            
            // Scroll to address line so user can verify/edit
            if (addressLine1Ref.current) {
              addressLine1Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
              addressLine1Ref.current.focus()
            }
          }
        } catch (err) {
          console.warn('[checkout] reverseGeocode failed', err)
          setFieldError('addressLine2')
          const msg = 'Got your location, but couldn’t fetch the address. Please type your area in Address line 2.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        }
        setGettingLocation(false)
      },
      (error) => {
        setGettingLocation(false)
        if (error.code === error.PERMISSION_DENIED) {
          setFieldError('location')
          const msg = 'Location permission was denied. Please allow location access or type your address manually.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setFieldError('location')
          const msg = 'Could not get your location. Please check GPS/location settings or type your address manually.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else if (error.code === error.TIMEOUT) {
          setFieldError('location')
          const msg = 'Location request timed out. Please try again.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else {
          setFieldError('location')
          const msg = 'Could not fetch your location. Please type your address manually.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [update, deliveryLocation, pushToast])

  const handleGPSOnly = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      pushToast('Location is not available in this browser.', 'error', 5000)
      return
    }
    
    setGettingLocation(true)
    setGeoError('')
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        update('lat', latitude)
        update('lng', longitude)
        setHighlightGPSButton(false)
        
        // Check if within delivery region
        const withinCheck = deliveryLocation.checkWithin(latitude, longitude)
        if (!withinCheck.ok) {
          const msg = `We deliver within ${withinCheck.radiusKm} km of Durgapur. This location is ~${withinCheck.distance.toFixed(1)} km away.`
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else {
          pushToast('GPS location confirmed for delivery!', 'success', 3000)
        }
        setGettingLocation(false)
      },
      (error) => {
        setGettingLocation(false)
        pushToast('Could not get GPS location. Please ensure location is enabled.', 'error', 5000)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [update, deliveryLocation, pushToast])

  const placeOrder = async () => {
    setGeoError('')
    setFieldError(null)
    if (!entries.length || placing) return

    if (!user?.uid) {
      pushToast('Please sign in to place an order.', 'error', 5000)
      return
    }

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
          // Keep line 1 manual; put geocoded address into line 2
          const autoAddress = geo.formatted || [geo.line1, geo.line2].filter(Boolean).join(', ')
          if (autoAddress) update('addressLine2', autoAddress)
          // City fixed to Durgapur
          update('city', 'Durgapur')
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
    
    // Auto-scroll to the first field that needs attention
    if (!requiredFilledNow || !phoneOkNow || !pinOkNow || !withinResult.ok || !addressPhoneOkNow) {
      if (!form.name && nameRef.current) {
        setErrorAndScroll('name', 'Please enter your full name.', nameRef)
        return
      }
      if (!form.phone && phoneRef.current) {
        setErrorAndScroll('phone', 'Please enter your phone number.', phoneRef)
        return
      }
      if (!phoneOkNow && phoneRef.current) {
        setErrorAndScroll('phone', 'Please enter a valid phone number.', phoneRef)
        return
      }
      if (!form.addressLine1 && addressLine1Ref.current) {
        setShowAddressForm(true)
        setErrorAndScroll('addressLine1', 'Please fill Address line 1 (House/Flat + Street).', addressLine1Ref)
        return
      }
      if (!form.addressLine2 && addressLine2Ref.current) {
        setShowAddressForm(true)
        setErrorAndScroll('addressLine2', 'Please type your Area/Locality in Address line 2 and select a suggestion (or use current location).', addressLine2Ref)
        return
      }
      if (!form.pin && pinRef.current) {
        setShowAddressForm(true)
        setErrorAndScroll('pin', 'Please enter your PIN code.', pinRef)
        return
      }
      if (!pinOkNow && pinRef.current) {
        setShowAddressForm(true)
        setErrorAndScroll('pin', 'Please enter a valid PIN code.', pinRef)
        return
      }
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        setShowAddressForm(true)
        setErrorAndScroll('location', 'Please select your delivery location: use “Use current location” or pick a suggestion in Address line 2.', addressSectionRef)
        return
      }
      if (!withinResult.ok) {
        setShowAddressForm(true)
        setErrorAndScroll('location', `We deliver within ${withinResult.radiusKm} km of Durgapur. Your address is ~${withinResult.distance.toFixed(1)} km away. Please choose a closer address.`, addressSectionRef)
        return
      }
      if (!addressPhoneOkNow) {
        setFieldError('phone')
        setGeoError('Please enter a valid phone number.')
        return
      }
      setGeoError('Please check the highlighted fields.')
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
          const hasDiff = Object.entries(patch).some(([key, value]) => {
            const current = match[key]
            if (typeof value === 'number' || typeof current === 'number') {
              return Number(value ?? 0) !== Number(current ?? 0)
            }
            return (value || '') !== (current || '')
          })
          if (hasDiff) {
            try { await updateAddress(user.uid, match.id, patch) } catch (e) { void e }
          }
          setActiveAddressId(match.id)
        } else {
          try {
            savedAddrId = await addAddress(user.uid, addr)
            if (savedAddrId) setActiveAddressId(savedAddrId)
          } catch (e) { void e }
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
        // Use Vite-exposed public key (VITE_RAZORPAY_KEY_ID). Server-side secret remains in RAZORPAY_KEY_SECRET.
        const keyId = await getRazorpayKeyId()
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
          // Workaround: Some Razorpay SVGs set height="auto" which is invalid on SVG attributes.
          // Strip invalid attributes to silence console errors in some browsers.
          const fixInvalidSvg = () => {
            try {
              const svgs = document.querySelectorAll('svg[height="auto"]')
              svgs.forEach((el) => {
                el.removeAttribute('height')
                // allow CSS to control height; width usually set via viewBox
              })
            } catch { /* noop */ }
          }
          // Attempt a few times while modal builds
          fixInvalidSvg()
          let tries = 0
          const t = setInterval(() => {
            fixInvalidSvg()
            tries += 1
            if (tries > 10) clearInterval(t)
          }, 150)
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

      // Send WhatsApp Bill
      try {
        const billOrder = {
          orderNo: orderIdValue,
          customer: {
            name: form.name,
            phone: form.phone,
            address: [form.addressLine1, form.addressLine2, form.city, form.pin].filter(Boolean).join(', '),
          },
          items: entries.map(({ item, qty }) => ({ ...item, qty, total: item.price * qty })),
          subtotal: Number(subtotal),
          taxAmount: 0,
          totalAmount: Number(subtotal),
          orderType: 'delivery'
        }
        sendBillToCustomer(billOrder)
          .then(res => {
             if (res?.__error) pushToast('WhatsApp confirmation failed: ' + (res.message || res.__error), 'warning')
          })
          .catch(err => {
             console.warn('Failed to send WhatsApp bill', err)
             pushToast('WhatsApp confirmation failed', 'warning')
          })
      } catch (e) {
        console.warn('Error preparing WhatsApp bill', e)
      }

      try {
        let summary = null
        try {
          summary = await fetchOrder(user?.uid || null, orderIdValue)
        } catch (err) {
          if (!user) {
            try { summary = await fetchOrder(null, orderIdValue) } catch { /* noop */ }
          } else {
            throw err
          }
        }
        if (summary) {
          setLatestOrderSummary({
            id: summary.orderNo || orderIdValue,
            payment: summary.payment || paymentInfo,
            statusHistory: buildOrderStatusTimeline(summary),
          })
        } else {
          setLatestOrderSummary({
            id: orderIdValue,
            payment: paymentInfo,
            statusHistory: [{ status: 'placed', at: new Date(), actor: user?.uid ? `user:${user.uid}` : 'guest' }],
          })
        }
      } catch {
        setLatestOrderSummary({
          id: orderIdValue,
          payment: paymentInfo,
          statusHistory: [{ status: 'placed', at: new Date(), actor: user?.uid ? `user:${user.uid}` : 'guest' }],
        })
      }
      pushToast('Order placed successfully.', 'success', 5000)
      clear()
    } catch (e) {
      // Don't show error for user-cancelled payments
      if (e.message === 'Payment cancelled') {
        setPlacing(false)
        return
      }
      console.error(e)
      pushToast(e?.message || 'Failed to place order. Please try again.', 'error', 5000)
    } finally {
      setPlacing(false)
    }
  }

  const phoneOk = !form.phone || /^\+?[0-9]{7,15}$/.test(form.phone)
  const addressPhoneOk = !form.addressPhone || /^\+?[0-9]{7,15}$/.test(form.addressPhone)
  const pinOk = !form.pin || /^[0-9]{4,8}$/.test(form.pin)
  const requiredFilled = form.name && form.phone && form.addressLine1 && form.addressLine2 && form.city && form.pin && (typeof form.lat === 'number') && (typeof form.lng === 'number')
  const withinCheck = (typeof form.lat === 'number') && (typeof form.lng === 'number')
    ? deliveryLocation.checkWithin(form.lat, form.lng)
    : { ok: false, radiusKm: deliveryLocation.region?.radiusKm || 0, distance: 0 }
  const withinRegion = withinCheck.ok
  const isValid = requiredFilled && phoneOk && pinOk && withinRegion && addressPhoneOk

  // Step completion tracking for step indicator
  const step1Complete = form.name && form.phone && phoneOk
  const step2Complete = (
    (activeAddressId && !showAddressForm) || !!form.addressLine1
  ) && form.addressLine2 && form.pin && pinOk && (typeof form.lat === 'number') && (typeof form.lng === 'number') && withinRegion && addressPhoneOk
  const step3Complete = !!orderId

  const step1Done = confirmedSteps.contact
  const step2Done = confirmedSteps.address

  const paymentOptions = CHECKOUT_PAYMENT_OPTIONS
  const describePaymentMethod = (method) => {
    const found = paymentOptions.find((opt) => opt.key === method)
    return found ? found.label : (method ? method.toUpperCase() : 'Not set')
  }
  const paymentIsOnline = form.paymentMethod !== 'cod'
  const locationOutsideRegion = (typeof form.lat === 'number') && (typeof form.lng === 'number') && !withinCheck.ok
  const addressSummary = [form.addressLine1, form.addressLine2, form.city, form.state, form.pin].filter(Boolean).join(', ')

  const invalidHint = (() => {
    if (isValid) return null
    if (!form.name) return 'Add your full name to continue.'
    if (!form.phone) return 'Add your phone number to continue.'
    if (!phoneOk) return 'Phone number looks invalid. Please re-check it.'
    if (!form.addressLine1) return 'Fill Address line 1 (House/Flat + Street).'
    if (!form.addressLine2) return 'Fill Address line 2 (Area/Locality) and pick a suggestion.'
    if (!form.pin) return 'Enter your PIN code to continue.'
    if (!pinOk) return 'PIN code looks invalid. Please re-check it.'
    if (typeof form.lat !== 'number' || typeof form.lng !== 'number') return 'Select your location: use “Use current location” or pick a suggestion in Address line 2.'
    if (!withinRegion) return `Outside delivery area: we deliver within ${withinCheck.radiusKm} km of Durgapur. Please choose a closer address.`
    if (!addressPhoneOk) return 'Address phone number looks invalid. Please re-check it.'
    return 'Please check the highlighted fields.'
  })()

  const handleNext = async () => {
    if (currentStep === 1) {
      if (step1Complete) {
        setConfirmedSteps((prev) => ({ ...prev, contact: true }))
        setCurrentStep(2)
      }
      else guideToNextField()
    } else if (currentStep === 2) {
      if (step2Complete) {
        // Save/Update address if form is open
        if (user && showAddressForm) {
          try {
            const addr = {
              name: form.addressTag || 'Other',
              line1: form.addressLine1,
              line2: form.addressLine2,
              city: form.city,
              state: form.state,
              zip: form.pin,
              landmark: form.landmark,
              phone: form.addressPhone || form.phone,
              tag: form.addressTag || 'Other',
              lat: form.lat,
              lng: form.lng,
              placeId: form.placeId,
              mapUrl: form.mapUrl
            }
            
            if (activeAddressId) {
              await updateAddress(user.uid, activeAddressId, addr)
              pushToast('Address updated', 'success')
            } else {
              const newId = await addAddress(user.uid, addr)
              if (newId) setActiveAddressId(newId)
              pushToast('Address saved', 'success')
            }
            fetchAddresses(user.uid).then(setAddresses).catch(()=>{})
          } catch (e) {
            console.error('Failed to save address', e)
          }
        }
        setConfirmedSteps((prev) => ({ ...prev, address: true }))
        setCurrentStep(3)
      }
      else guideToNextField()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const sortedAddresses = [...(addresses?.list || [])].sort((a, b) => {
    if (a.id === addresses.defaultId) return -1
    if (b.id === addresses.defaultId) return 1
    return 0
  })
  const hasSavedAddresses = user && sortedAddresses.length > 0

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-8 px-4 bg-base-200/30">
      {orderId ? (
        <div className="w-full max-w-md text-center space-y-4 animate-in zoom-in duration-300">
          <div className="rounded-2xl border border-base-300/60 bg-base-100/90 p-8 shadow-lg">
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
            <h3 className="font-bold text-lg mt-4">Taking you to your active order…</h3>
            <div className="text-sm opacity-80 mt-1">Order ID: <span className="font-mono font-bold">{orderId}</span></div>
          </div>
          <button className="btn btn-primary btn-wide rounded-xl" onClick={() => navigate(`/active-orders?id=${encodeURIComponent(orderId)}`, { replace: true })}>
            View order status
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-base-100 rounded-2xl shadow-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center text-4xl">🛒</div>
            <div>
              <div className="text-2xl font-bold">Your cart is empty!</div>
              <div className="text-sm opacity-60 mt-2 leading-relaxed">Looks like you haven't added anything yet.<br/>Browse our menu and add your favorite items.</div>
            </div>
            <button
              className="btn btn-primary btn-wide rounded-xl"
              onClick={() => window.location.href = '/'}
            >Browse Menu</button>
        </div>
      ) : (
        <div className="w-full max-w-lg card card-surface shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className="bg-base-100 p-5 border-b border-base-200 shrink-0 z-10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold">Checkout</h1>
                    <div className="text-sm font-medium bg-base-200 px-3 py-1 rounded-full">Total: ₹{subtotal}</div>
                </div>
                {/* Step Indicator */}
                <div className="flex items-center justify-between relative px-4">
                  <div className={`flex flex-col items-center gap-1 z-10 ${currentStep >= 1 ? 'text-primary' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step1Done ? 'bg-success text-success-content' : currentStep === 1 ? 'bg-primary text-primary-content ring-4 ring-primary/20' : 'bg-base-300'}`}>
                        {step1Done ? <MdCheck className="w-5 h-5" /> : '1'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Contact</span>
                  </div>
                  <div className={`absolute top-4 left-0 w-full h-0.5 -z-0 bg-base-200`}>
                    <div className="h-full bg-success transition-all duration-500 ease-out" style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}></div>
                  </div>
                  <div className={`flex flex-col items-center gap-1 z-10 ${currentStep >= 2 ? 'text-primary' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step2Done ? 'bg-success text-success-content' : currentStep === 2 ? 'bg-primary text-primary-content ring-4 ring-primary/20' : 'bg-base-300'}`}>
                        {step2Done ? <MdCheck className="w-5 h-5" /> : '2'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Address</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1 z-10 ${currentStep >= 3 ? 'text-primary' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step3Complete ? 'bg-success text-success-content' : currentStep === 3 ? 'bg-primary text-primary-content ring-4 ring-primary/20' : 'bg-base-300'}`}>
                        {step3Complete ? <MdCheck className="w-5 h-5" /> : '3'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Payment</span>
                  </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative bg-base-100/50">
                {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold">Contact Details</h2>
                            <p className="text-xs opacity-60">We'll use this to contact you about your order.</p>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Full Name</span></label>
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'name' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                <MdPerson className="w-5 h-5 opacity-50" />
                                <input ref={nameRef} className="bg-transparent w-full outline-none placeholder:opacity-50" placeholder="Enter your name" value={form.name} onChange={(e)=>update('name', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Phone Number</span></label>
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'phone' || (form.phone && !phoneOk) ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                <MdLocalPhone className="w-5 h-5 opacity-50" />
                                <input ref={phoneRef} className="bg-transparent w-full outline-none placeholder:opacity-50" placeholder="10-digit mobile number" type="tel" value={form.phone} onChange={(e)=>update('phone', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Email (Optional)</span></label>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                                <MdEmail className="w-5 h-5 opacity-50" />
                                <input className="bg-transparent w-full outline-none placeholder:opacity-50" placeholder="For order receipt" type="email" value={form.email} onChange={(e)=>update('email', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Instructions (Optional)</span></label>
                            <textarea className="textarea textarea-bordered h-24 rounded-xl bg-base-200/50 focus:bg-base-100 border-transparent focus:border-primary/50" placeholder="Any special cooking or delivery instructions?" value={form.note} onChange={(e)=>update('note', e.target.value)}></textarea>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold">Delivery Address</h2>
                            <p className="text-xs opacity-60">Where should we deliver your meal?</p>
                        </div>
                        
                        {/* Saved Addresses List */}
                        {!showAddressForm && hasSavedAddresses && (
                            <div className="space-y-3">
                                {sortedAddresses.map(a => (
                                    <div key={a.id} className={`p-4 rounded-xl border transition-all hover:shadow-md group ${activeAddressId === a.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-base-200 hover:border-primary/50'}`}>
                                        <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => { fillFromAddress(a); setShowAddressForm(true); }}>
                                            <span className="font-bold flex items-center gap-2 text-sm"><MdPlace className={`w-4 h-4 ${activeAddressId === a.id ? 'text-primary' : 'opacity-50'}`} /> {a.tag || 'Address'}</span>
                                            {activeAddressId === a.id ? <MdCheck className="text-primary w-5 h-5" /> : <MdEdit className="w-4 h-4 opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />}
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs opacity-70 leading-relaxed pl-6 flex-1 cursor-pointer" onClick={() => { fillFromAddress(a); setShowAddressForm(true); }}>{[a.line1, a.line2, a.city, a.pin].filter(Boolean).join(', ')}</p>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleStartNewAddress} className="btn btn-outline btn-block border-dashed border-base-300 hover:border-primary hover:bg-primary/5 normal-case gap-2 rounded-xl mt-2">
                                    <MdAdd className="w-5 h-5" /> Add New Address
                                </button>
                            </div>
                        )}

                        {/* New Address Form */}
                        {(showAddressForm || !hasSavedAddresses) && (
                            <div className="space-y-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center">
                                    {['Home', 'Work', 'Other'].map(tag => (
                                        <label key={tag} className={`cursor-pointer px-5 py-2 rounded-full border text-xs font-bold transition-all ${form.addressTag === tag ? 'bg-primary text-primary-content border-primary shadow-md shadow-primary/20' : 'bg-base-100 border-base-300 hover:border-base-400'}`}>
                                            <input type="radio" className="hidden" name="addrTag" checked={form.addressTag === tag} onChange={()=>update('addressTag', tag)} />
                                            {tag}
                                        </label>
                                    ))}
                                </div>

                                {/* Auto-fill via GPS Button */}
                                <button 
                                    type="button" 
                                  className={`btn btn-block rounded-xl min-h-[3.25rem] text-base font-semibold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 relative overflow-hidden group transition-opacity duration-300 ease-in-out ${gettingLocation ? 'loading opacity-70' : 'opacity-100'}`} 
                                    onClick={handleAutoFillLocation}
                                >
                                    <div className="absolute inset-0 bg-primary/10 animate-pulse group-hover:animate-none"></div>
                                  <span className="relative flex items-center justify-center gap-2 z-10">
                                        <MdGpsFixed className="animate-bounce" /> Press to Auto-fill via GPS
                                    </span>
                                </button>
                                
                                <div className="form-control w-full">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'landmark' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdPlace className="w-5 h-5 opacity-50" />
                                        <input ref={landmarkRef} className="bg-transparent w-full outline-none placeholder:opacity-50" placeholder="Nearby Landmark (Optional)" value={form.landmark} onChange={(e)=>update('landmark', e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-control w-full">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'addressLine1' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdApartment className="w-5 h-5 opacity-50" />
                                        <input ref={addressLine1Ref} className="bg-transparent w-full outline-none placeholder:opacity-50" placeholder="House / Flat No., Building" value={form.addressLine1} onChange={(e)=>update('addressLine1', e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-control w-full">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'addressLine2' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdMap className="w-5 h-5 opacity-50" />
                                    <input ref={addressLine2Ref} className="bg-transparent w-full outline-none placeholder:opacity-50" placeholder="Search Area / Locality (pick a suggestion)" value={form.addressLine2} onChange={(e)=>handleAddressLine2Change(e.target.value)} />
                                    </div>
                                    <label className="label py-1"><span className="label-text-alt opacity-60">Select from suggestions for best accuracy</span></label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'pin' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdPinDrop className="w-5 h-5 opacity-50" />
                                        <input ref={pinRef} className="bg-transparent w-full outline-none placeholder:opacity-50" placeholder="PIN Code" value={form.pin} onChange={(e)=>update('pin', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent opacity-70 cursor-not-allowed">
                                        <MdLocationCity className="w-5 h-5 opacity-50" />
                                        <input className="bg-transparent w-full outline-none" value="Durgapur" readOnly />
                                    </div>
                                </div>

                                {/* Confirm Location Only Button */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    className={`btn btn-block rounded-xl min-h-[3.25rem] text-base font-semibold border-error/20 bg-error/10 text-error hover:bg-error/15 transition-all duration-300 ease-in-out ${gettingLocation ? 'loading opacity-70' : 'opacity-100'} ${highlightGPSButton ? 'ring-4 ring-error/50 animate-pulse' : ''}`}
                                    onClick={handleGPSOnly}
                                  >
                                    <MdGpsFixed /> Press to share location for faster delivery
                                  </button>
                                  {highlightGPSButton && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-error text-error-content px-4 py-2 rounded-xl text-xs font-bold shadow-xl z-50 whitespace-nowrap animate-in fade-in slide-in-from-bottom-4 duration-300 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-error">
                                      👆 Click here to share your location!
                                    </div>
                                  )}
                                </div>
                                
                                {hasSavedAddresses && (
                                    <button type="button" className="btn btn-xs btn-link text-base-content no-underline opacity-60 hover:opacity-100 mx-auto block" onClick={() => setShowAddressForm(false)}>
                                        Cancel & Select Saved Address
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold">Review & Pay</h2>
                            <p className="text-xs opacity-60">One last check before you eat!</p>
                        </div>

                        {/* Order Summary Accordion */}
                        <div className="collapse collapse-arrow bg-base-200/30 rounded-xl border border-base-200">
                            <input type="checkbox" /> 
                            <div className="collapse-title font-medium text-sm flex justify-between pr-10 items-center">
                                <span className="opacity-80">Order Summary ({entries.length} items)</span>
                                <span className="font-bold">₹{subtotal}</span>
                            </div>
                            <div className="collapse-content text-xs space-y-3">
                                {entries.map(({ item, qty }) => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold bg-base-200 px-1.5 py-0.5 rounded">{qty}x</span>
                                            <span>{item.name}</span>
                                        </div>
                                        <span>₹{item.price * qty}</span>
                                    </div>
                                ))}
                                <div className="divider my-1"></div>
                                <div className="flex justify-between font-bold text-sm">
                                    <span>To Pay</span>
                                    <span>₹{subtotal}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address Preview */}
                        <div className="rounded-xl border border-base-200 p-4 flex items-start gap-3 bg-base-100/50">
                            <MdPlace className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <div className="text-xs font-bold uppercase opacity-60 mb-1">Delivering To</div>
                                <p className="text-sm leading-relaxed">{addressSummary}</p>
                            </div>
                            <button className="btn btn-xs btn-ghost" onClick={() => setCurrentStep(2)}>Edit</button>
                        </div>

                        {/* Payment Options */}
                        <div className="space-y-3">
                            <div className="text-xs font-bold uppercase opacity-60 ml-1">Payment Method</div>
                            <div className="grid grid-cols-1 gap-3">
                                {paymentOptions.map((option) => {
                                    const { key, label, icon: Icon } = option
                                    return (
                                        <label key={key} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === key ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' : 'border-base-200 hover:border-primary/50'}`}>
                                            <input type="radio" className="radio radio-primary radio-sm" checked={form.paymentMethod === key} onChange={() => update('paymentMethod', key)} />
                                            <Icon className={`w-6 h-6 ${form.paymentMethod === key ? 'text-primary' : 'opacity-50'}`} />
                                            <div className="flex-1 font-medium text-sm">{label}</div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-base-100 border-t border-base-200 shrink-0 z-10 flex items-center justify-between gap-4">
                <button 
                    className={`btn btn-ghost hover:bg-base-200 ${currentStep === 1 ? 'invisible' : ''}`}
                    onClick={handleBack}
                >
                    Back
                </button>
                
                {currentStep < 3 ? (
                    <button 
                        className="btn btn-primary px-8 rounded-xl shadow-lg shadow-primary/20"
                        onClick={handleNext}
                    >
                        Next Step
                    </button>
                ) : (
                    <button 
                        className="btn btn-primary px-8 rounded-xl shadow-lg shadow-primary/20 flex-1 max-w-xs ml-auto"
                        disabled={placing || !isValid}
                        onClick={placeOrder}
                    >
                        {placing ? <span className="loading loading-spinner"></span> : `Place Order • ₹${subtotal}`}
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  )
}
