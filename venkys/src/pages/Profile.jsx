// Profile — User profile, addresses, and order history
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'

import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Link, useLocation } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import { MdPlace, MdApartment, MdLocationCity, MdMap, MdPinDrop, MdLocalPhone, MdGpsFixed, MdPerson, MdMail, MdEdit, MdLocalShipping, MdPolicy, MdGavel, MdCancel, MdReplay, MdRefresh } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete'
import { fetchUserOrders, fetchUserProfile, updateUserProfile, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, isCounterDocId } from '../lib/data'
import { getProfileCompletion } from '../lib/data-user'
import { db } from '../lib/firebase'
import { reverseGeocode, geocodeAddress } from '../lib/google'

// ── Helpers ──

export default function Profile() {
  const { user, logout } = useAuth();
  const { pushToast, confirm } = useUI();
  const location = useLocation();
  const deliveryLocation = useDeliveryLocation();

  // ── State & refs ──
  // Profile and orders state
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Addresses state
  const [addrState, setAddrState] = useState({ list: [], defaultId: null });
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [orderModal, setOrderModal] = useState(null);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrEditing, setAddrEditing] = useState(null);
  const [addrForm, setAddrForm] = useState({ name: '', line1: '', line2: '', city: 'Durgapur', state: 'West Bengal', zip: '', landmark: '', phone: '', tag: 'Home', lat: null, lng: null, placeId: '', mapUrl: '' });
  const [addrSaving, setAddrSaving] = useState(false);
  const addrLine1Ref = useRef(null);
  const addrLine2Ref = useRef(null);
  const [setAsDefault, setSetAsDefault] = useState(false);

  // Edit details modal UI state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAlert, setEditAlert] = useState("");
  const [usePhoneForWhatsapp, setUsePhoneForWhatsapp] = useState(false);

  const closeEditModal = useCallback((evt) => {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    if (profileSaving) return;
    setEditModalOpen(false);
    setEditAlert('');
    setUsePhoneForWhatsapp(false);
  }, [profileSaving]);

  // ── Side-effects ──
  // Handle scrolling from navigation state
  useEffect(() => {
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Clear state to prevent re-scroll on re-render
      window.history.replaceState({}, document.title)
    } else if (location.state?.scrollTo === 'orders' || location.hash === '#orders') {
      const el = document.getElementById('orders-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Clear state
        window.history.replaceState({}, document.title)
      }
    }
  }, [location])

  // Load orders with real-time updates
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    
    // Set up real-time listener for user's orders (Query top-level collection by userId)
    const ordersRef = collection(db, 'orders');
    const qy = query(ordersRef, where('userId', '==', user.uid));
    
    const unsub = onSnapshot(qy, (snap) => {
      const toMillis = (v) => {
        if (!v) return 0
        if (typeof v.toMillis === 'function') return v.toMillis()
        if (typeof v.seconds === 'number') return v.seconds * 1000
        if (typeof v === 'number') return v
        const parsed = Date.parse(String(v))
        return Number.isNaN(parsed) ? 0 : parsed
      }
      const ordersList = snap.docs
        .filter(d => !isCounterDocId(d.id))
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = toMillis(a?.createdAt) || toMillis(a?.updatedAt)
          const tb = toMillis(b?.createdAt) || toMillis(b?.updatedAt)
          return tb - ta
        });
      setOrders(ordersList);
      setLoadingOrders(false);
    }, (err) => {
      console.error('[profile] Real-time orders error:', err);
      // Fallback to one-time fetch if listener fails
      fetchUserOrders(user.uid)
        .then((list) => setOrders(Array.isArray(list) ? list : []))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    });
    
    return () => unsub();
  }, [user]);

  const handleOrdersRefresh = useCallback(async () => {
    if (!user || loadingOrders) return;
    setLoadingOrders(true);
    try {
      const list = await fetchUserOrders(user.uid);
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('[profile] Failed to refresh orders', err);
      pushToast('Failed to refresh orders. Please try again.', 'error');
    } finally {
      setLoadingOrders(false);
    }
  }, [user, loadingOrders, pushToast]);

  // Load profile
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileForm({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
      setEditForm({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
      setUsePhoneForWhatsapp(false);
      setEditAlert('');
      setEditModalOpen(false);
      setAddrModalOpen(false);
      setAddrEditing(null);
      setAddrForm({ name: '', line1: '', line2: '', city: 'Durgapur', state: 'West Bengal', zip: '', landmark: '', phone: '', tag: 'Home', lat: null, lng: null, placeId: '', mapUrl: '' });
      setSetAsDefault(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const p = await fetchUserProfile(user.uid);
        if (!mounted) return;
        setProfile(p);
        setProfileForm(f => ({
          ...f,
          displayName: p?.displayName || '',
          phone: p?.phone || '',
          whatsapp: p?.whatsapp || '',
          gender: p?.gender || '',
          email: p?.email || user?.email || ''
        }));
        const phoneDigits = ((p?.phone || '').replace(/\D/g, '')).slice(0, 10);
        const whatsappDigits = ((p?.whatsapp || '').replace(/\D/g, '')).slice(0, 10);
        setUsePhoneForWhatsapp(Boolean(phoneDigits) && phoneDigits === whatsappDigits);
        if (editModalOpen) {
          setEditForm(f => ({
            ...f,
            displayName: p?.displayName || '',
            phone: p?.phone || '',
            whatsapp: p?.whatsapp || '',
            gender: p?.gender || '',
            email: p?.email || user?.email || ''
          }));
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[profile] Failed to load profile', err);
        pushToast('Failed to load profile details. Please refresh.', 'error');
      }
    })();
    return () => { mounted = false; };
  }, [user, editModalOpen, pushToast]);

  // Load addresses
  useEffect(() => {
    if (!user) {
      setAddrState({ list: [], defaultId: null });
      return;
    }
    let active = true;
    fetchAddresses(user.uid)
      .then((data) => {
        if (!active) return;
        setAddrState(data || { list: [], defaultId: null });
      })
      .catch((err) => {
        if (!active) return;
        console.error('[profile] Failed to load addresses', err);
        pushToast('Failed to load saved addresses.', 'error');
        setAddrState({ list: [], defaultId: null });
      });
    return () => { active = false; };
  }, [user, pushToast]);

  // Address add modal opener (memoized)
  const openAddAddress = useCallback(() => {
    setAddrEditing(null);
    setAddrForm({
      name: '',
      line1: '',
      line2: '',
      city: 'Durgapur',
      state: 'West Bengal',
      zip: '',
      landmark: '',
      phone: user?.phoneNumber || profile?.phone || '',
      tag: 'Home',
      lat: null,
      lng: null,
      placeId: '',
      mapUrl: ''
    });
    setSetAsDefault(addrState.list.length === 0);
    setAddrModalOpen(true);
  }, [user?.phoneNumber, profile?.phone, addrState.list.length]);

  // Guided completion flow
  const openEditModal = useCallback(() => {
    // Check details first (name, phone)
    const nameMissing = !(profileForm.displayName || '').trim();
    const phoneMissing = !/\d{10}/.test((profileForm.phone || '').replace(/\D/g, ''));
    const phoneDigits = (profileForm.phone || '').replace(/\D/g, '').slice(0, 10);
    const whatsappDigits = (profileForm.whatsapp || '').replace(/\D/g, '').slice(0, 10);
    const sameContact = Boolean(phoneDigits) && phoneDigits === whatsappDigits;
    if (nameMissing || phoneMissing) {
      setEditForm({
        displayName: profileForm.displayName || '',
        phone: profileForm.phone || '',
        whatsapp: profileForm.whatsapp || '',
        email: user?.email || '',
        gender: profileForm.gender || profile?.gender || ''
      });
      setEditAlert('');
      setUsePhoneForWhatsapp(sameContact);
      setEditModalOpen(true);
      return;
    }
    // If details are complete, check address
    if ((addrState.list || []).length === 0) {
      openAddAddress();
      return;
    }
    // If everything is complete, open details modal for review
    setEditForm({
      displayName: profileForm.displayName || '',
      phone: profileForm.phone || '',
      whatsapp: profileForm.whatsapp || '',
      email: user?.email || '',
      gender: profileForm.gender || profile?.gender || ''
    });
    setEditAlert('');
    setUsePhoneForWhatsapp(sameContact);
    setEditModalOpen(true);
  }, [addrState.list, profile, profileForm.displayName, profileForm.gender, profileForm.phone, profileForm.whatsapp, user?.email, openAddAddress]);
  async function saveEditModal() {
    if (!user) return;
    // Validation: Full name required
    if (!(editForm.displayName || '').trim()) {
      setEditAlert('Full name is required');
      return;
    }
    // Validation: Phone required and must be 10 digits
    const phoneDigits = (editForm.phone || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) {
      setEditAlert('Enter 10 digits');
      return;
    }
    // WhatsApp validation
    const whatsappDigits = (editForm.whatsapp || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(whatsappDigits)) {
      setEditAlert('Valid 10-digit WhatsApp number required');
      return;
    }
    setEditAlert("");
    setProfileSaving(true);
    try {
      await updateUserProfile(user.uid, {
        ...profileForm,
        displayName: editForm.displayName,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        gender: editForm.gender
      });
      setProfileForm(f => ({ ...f, displayName: editForm.displayName, phone: editForm.phone, whatsapp: editForm.whatsapp, gender: editForm.gender }));
      setProfile(p => ({ ...(p||{}), displayName: editForm.displayName, phone: editForm.phone, whatsapp: editForm.whatsapp, gender: editForm.gender }));
      setEditAlert('Profile updated successfully!');
      setTimeout(() => closeEditModal(), 1200);
    } catch (e) {
      const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Update failed';
      setEditAlert(msg);
    }
    finally { setProfileSaving(false); }
  }

  // Removed unused saveProfile function (edit modal handles updates)

  // If navigated with completeNow intent, trigger guided modal flow
  useEffect(() => {
    if (location.state && location.state.completeNow && user) {
      // Clear the state so it doesn't trigger again on re-render
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search + window.location.hash);
      }, 0);
      openEditModal();
    }
  }, [location.state, user, openEditModal]);

  // ── Handlers ──
  function openEditAddress(a) {
    setAddrEditing(a)
    setAddrForm({ name: a.name||'', line1: a.line1||'', line2: a.line2||'', city: a.city||'', state: a.state||'', zip: a.zip||'', landmark: a.landmark||'', phone: a.phone||'', tag: a.tag||'Other', lat: a.lat ?? null, lng: a.lng ?? null, placeId: a.placeId || '', mapUrl: a.mapUrl || '' })
    setSetAsDefault(addrState.defaultId === a.id)
    setAddrModalOpen(true)
  }
  const handleAddrAutocomplete = useCallback((parts) => {
    if (!parts) return
    setAddrForm((f) => ({
      ...f,
      // Keep line 1 for manual entry; put autofill into line 2
      line2: parts.formatted || [parts.line1, parts.line2].filter(Boolean).join(', ') || f.line2,
      city: 'Durgapur',
      state: parts.state || f.state,
      zip: parts.zip || f.zip,
      placeId: parts.placeId || f.placeId,
      mapUrl: parts.mapUrl || f.mapUrl,
      lat: typeof parts.lat === 'number' ? parts.lat : f.lat,
      lng: typeof parts.lng === 'number' ? parts.lng : f.lng,
    }))
  }, [])
  usePlacesAutocomplete(addrLine2Ref, handleAddrAutocomplete, { enabled: addrModalOpen })
  async function saveAddress() {
    if (!user) return
    setAddrSaving(true)
    try {
      const payload = { ...addrForm, name: (addrForm.name || '').trim() || addrForm.tag }
      if ((typeof payload.lat !== 'number' || typeof payload.lng !== 'number') && payload.line1) {
        const addressText = [payload.line1, payload.line2, payload.city, payload.zip].filter(Boolean).join(', ')
        try {
          const geo = await geocodeAddress(addressText)
          if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
            payload.lat = geo.lat
            payload.lng = geo.lng
            if (geo.placeId) payload.placeId = geo.placeId
            if (geo.mapUrl) payload.mapUrl = geo.mapUrl
            setAddrForm(f => ({ ...f, lat: geo.lat, lng: geo.lng, placeId: geo.placeId || f.placeId, mapUrl: geo.mapUrl || f.mapUrl }))
          }
        } catch (err) {
          console.warn('[profile] geocode fallback failed', err)
        }
      }
      // Geofencing check via centralized hook
      if (typeof payload.lat === 'number' && typeof payload.lng === 'number' && deliveryLocation.region) {
        const { ok, distance, radiusKm } = deliveryLocation.checkWithin(payload.lat, payload.lng)
        if (!ok) {
          pushToast(`Address is outside delivery region (${distance.toFixed(2)} km > ${radiusKm} km)`, 'error')
          setAddrSaving(false)
          return
        }
      }
      if (addrEditing) {
        await updateAddress(user.uid, addrEditing.id, payload)
        if (setAsDefault) { try { await setDefaultAddress(user.uid, addrEditing.id) } catch (e) { void e } }
        pushToast('Address updated', 'success')
      } else {
        const newId = await addAddress(user.uid, payload)
        if (setAsDefault && newId) { try { await setDefaultAddress(user.uid, newId) } catch (e) { void e } }
        pushToast('Address added', 'success')
      }
      const a = await fetchAddresses(user.uid)
      setAddrState(a)
      setAddrModalOpen(false)
    } catch (e) {
      const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Save failed';
      pushToast(msg, 'error');
    }
    finally { setAddrSaving(false) }
  }
  async function removeAddress(a) {
    if (!user) return
    confirm({
      message: `Delete address "${a.name || a.tag || ''}"?`,
      onConfirm: async () => {
        try {
          await deleteAddress(user.uid, a.id)
          const next = await fetchAddresses(user.uid)
          setAddrState(next)
          pushToast('Address deleted', 'info')
        } catch (e) {
          const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Delete failed';
          pushToast(msg, 'error');
        }
      }
    })
  }
  async function makeDefault(a) {
    if (!user) return
    try { await setDefaultAddress(user.uid, a.id); const next = await fetchAddresses(user.uid); setAddrState(next); pushToast('Default address set', 'success') }
    catch (e) {
      const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Operation failed';
      pushToast(msg, 'error');
    }
  }

  // Reorder functionality
  const { add: addToCart } = useCart()
  const handleReorder = useCallback((items) => {
    if (!items || items.length === 0) return
    items.forEach(it => {
      // Reconstruct item object for cart
      addToCart({
        id: it.id || `${it.name}`,
        name: it.name,
        rate: Number(it?.rate ?? it?.price ?? 0),
        imageUrl: it.imageUrl || it.img || null,
      }, it.qty || 1)
    })
    pushToast(`Added ${items.length} item${items.length > 1 ? 's' : ''} to cart`, 'success')
  }, [addToCart, pushToast])

  const profileInfo = useMemo(() => {
    if (!profile) return null
    return {
      ...profile,
      displayName: profileForm.displayName || profile.displayName || user?.displayName || '',
      phone: profileForm.phone || profile.phone || user?.phoneNumber || '',
      email: profileForm.email || profile.email || user?.email || '',
      photoURL: profile.photoURL || user?.photoURL || '',
      addresses: Array.isArray(addrState?.list) ? addrState.list : [],
    }
  }, [profile, profileForm, user, addrState])

  const profileCompletion = profileInfo ? getProfileCompletion(profileInfo) : null


  if (!user) {
    return (
      <div className="page-wrap py-6">
        <div className="alert">Please log in to view your profile.</div>
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="page-wrap py-8 space-y-8 max-w-7xl mx-auto">
      {/* Profile heading with logout button on the right */}
      <div className="flex items-center justify-between flex-wrap gap-4 px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm opacity-60 mt-1">Manage your account and preferences</p>
        </div>
        <button className="btn btn-outline btn-error btn-sm gap-2" onClick={logout}>
          <MdCancel className="w-4 h-4" /> Logout
        </button>
      </div>

    {profileCompletion && (
      <div className="card bg-base-100 shadow-sm border border-base-300/60">
        <div className="card-body p-5 gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Profile completion</h2>
            <span className="text-2xl font-bold">{profileCompletion.percent}%</span>
          </div>
          <progress className="progress progress-primary w-full" value={profileCompletion.percent} max="100" />
          {profileCompletion.percent < 100 ? (
            <div className="flex flex-wrap gap-2">
              {profileCompletion.missing.map((item) => (
                <span key={item} className="badge badge-outline badge-sm">{item}</span>
              ))}
            </div>
          ) : (
            <div className="badge badge-success">Profile complete ✓</div>
          )}
        </div>
      </div>
    )}


      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body p-6 text-center">
              
              <div className="mt-2">
                <h2 className="text-xl font-bold">{profileForm.displayName || user?.displayName || 'User'}</h2>
                <p className="text-sm opacity-60">Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2024'}</p>
              </div>

              <div className="divider my-1"></div>

              <div className="space-y-3 text-sm text-left w-full px-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
                    <MdLocalPhone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs opacity-60">Phone</div>
                    <div className="font-medium truncate">{profileForm.phone || 'Not set'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
                    <MdMail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs opacity-60">Email</div>
                    <div className="font-medium truncate">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full">
                <button className="btn btn-outline btn-sm w-full rounded-full" onClick={openEditModal}>Edit Profile</button>
              </div>
            </div>
          </div>

          {/* Support & Legal Menu - Removed from here */}
        </div>

        {/* Right Content (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Addresses Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MdPlace className="text-primary" /> Saved Addresses
              </h2>
              <button className="btn btn-sm btn-primary rounded-full px-4" onClick={openAddAddress}>
                + Add New
              </button>
            </div>
            
            {addrState.list.length === 0 ? (
              <div className="alert bg-base-100 border-base-200 shadow-sm">
                <MdPlace className="w-6 h-6 opacity-40" />
                <div>
                  <h3 className="font-bold">No addresses saved</h3>
                  <div className="text-xs">Add an address to speed up checkout.</div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {addrState.list.map(a => (
                  <div key={a.id} className={`card bg-base-100 shadow-sm border transition-all hover:shadow-md ${addrState.defaultId===a.id ? 'border-primary ring-1 ring-primary/20' : 'border-base-200'}`}>
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base">{a.name || a.tag || 'Address'}</span>
                          {a.tag && <span className="badge badge-ghost badge-xs uppercase tracking-wider text-[10px]">{a.tag}</span>}
                          {addrState.defaultId===a.id && <span className="badge badge-primary badge-xs">Default</span>}
                        </div>
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="btn btn-ghost btn-xs btn-circle">
                            <span className="text-lg">⋮</span>
                          </div>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-200">
                            <li><button onClick={()=>openEditAddress(a)} className="text-xs">Edit</button></li>
                            {addrState.defaultId!==a.id && <li><button onClick={()=>makeDefault(a)} className="text-xs">Set Default</button></li>}
                            <li><button onClick={()=>removeAddress(a)} className="text-xs text-error">Delete</button></li>
                          </ul>
                        </div>
                      </div>
                      
                      <p className="text-sm opacity-70 leading-relaxed min-h-[3rem]">
                        {[a.line1, a.line2, a.city, a.zip].filter(Boolean).join(', ')}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs opacity-60">
                        {a.phone && <span className="flex items-center gap-1"><MdLocalPhone className="w-3 h-3"/> {a.phone}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="divider"></div>

          {/* Orders Section */}
          <section id="orders-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MdLocalShipping className="text-primary" /> Order History
              </h2>
              <button className="btn btn-sm btn-ghost btn-circle" title="Refresh orders" onClick={handleOrdersRefresh} disabled={loadingOrders}>
                <MdRefresh className={`w-5 h-5 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingOrders && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            )}

            {!loadingOrders && orders.length === 0 && (
              <div className="text-center py-10 bg-base-100 rounded-xl border border-base-200 border-dashed">
                <div className="opacity-30 mb-2 text-4xl">📦</div>
                <p className="opacity-60">No orders placed yet.</p>
                <Link to="/" className="btn btn-link btn-sm mt-2">Browse Menu</Link>
              </div>
            )}

            <div className="space-y-4">
              {/* Active Orders */}
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider opacity-50 mb-3 ml-1">Active Orders</h3>
                  <div className="space-y-3">
                    {orders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').map(o => (
                      <OrderCard key={o.id} order={o} openModal={setOrderModal} onReorder={handleReorder} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Orders */}
              {orders.filter(o => o.status === 'delivered' || o.status === 'rejected').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider opacity-50 mb-3 ml-1">Past Orders</h3>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'delivered' || o.status === 'rejected').slice(0,showAllOrders?orders.length:5).map(o => (
                      <OrderCard key={o.id} order={o} openModal={setOrderModal} onReorder={handleReorder} />
                    ))}
                  </div>
                  {orders.filter(o => o.status === 'delivered' || o.status === 'rejected').length > 5 && !showAllOrders && (
                    <div className="text-center mt-4">
                      <button className="btn btn-sm btn-ghost" onClick={()=>setShowAllOrders(true)}>View all history</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Order details modal - rendered at root level */}
      {orderModal && (
        <OrderDetailsModal order={orderModal} onClose={()=>setOrderModal(null)} />
      )}

      {/* Support & Legal Links - Bottom */}
      <div className="pt-8 border-t border-base-200">
        <h3 className="font-semibold text-sm uppercase tracking-wider opacity-50 mb-4">Support & Legal</h3>
        <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm opacity-70">
          <Link to="/cancellation-refunds" className="hover:text-primary hover:underline transition-colors">Cancellation & Refunds</Link>
          <Link to="/shipping" className="hover:text-primary hover:underline transition-colors">Shipping Policy</Link>
          <Link to="/terms" className="hover:text-primary hover:underline transition-colors">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:text-primary hover:underline transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-primary hover:underline transition-colors">Contact Us</Link>
        </div>
      </div>

      {/* Edit personal details modal */}
      {editModalOpen && (
          <dialog open className="modal">
            <div className="modal-box max-w-sm sm:max-w-md rounded-2xl shadow-2xl p-0">
              <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeEditModal} aria-label="Close">✕</button>
              <h3 className="font-bold text-lg text-left pt-6 pb-2 px-6">Edit Personal Details</h3>
              {editAlert && <div className="alert alert-error text-xs px-6 py-2 mb-2 rounded-lg">{editAlert}</div>}
              <form className="px-6 pb-6 pt-2 space-y-6" onSubmit={e=>{e.preventDefault();saveEditModal();}}>
                {/* Display Name (required) */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <MdPerson className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-70"
                    value={editForm.displayName}
                    onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="Full Name (required)"
                    required
                  />
                </div>
                {/* Email (optional, grey label) */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 transition pb-2">
                  <MdMail className="w-4 h-4 opacity-70" />
                  <input
                    type="email"
                    className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-70 text-gray-400"
                    value={editForm.email}
                    disabled
                    placeholder="Email (optional)"
                  />
                </div>
                {/* Phone (required) with +91 prefix */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <MdLocalPhone className="w-4 h-4 opacity-70" />
                  <div className="flex items-center w-full">
                    <span className="inline-block px-2 py-1 bg-base-100 rounded text-xs font-semibold border border-base-200 mr-2 select-none" style={{minWidth:'44px',textAlign:'center'}}>+91</span>
                    <input
                      type="tel"
                      className="input validator tabular-nums w-full rounded-r bg-transparent border-none focus:ring-0 shadow-none text-base"
                      required
                      placeholder="Phone"
                      pattern="[0-9]*"
                      minLength={10}
                      maxLength={10}
                      title="Must be 10 digits"
                      value={editForm.phone}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setEditForm(f => {
                          const next = { ...f, phone: digits }
                          if (usePhoneForWhatsapp) next.whatsapp = digits
                          return next
                        })
                      }}
                    />
                  </div>
                  <p className="validator-hint text-xs ml-2">Must be 10 digits</p>
                </div>
                {/* WhatsApp number with checkbox and +91 prefix */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <FaWhatsapp className="w-6 h-6 text-green-500 opacity-90" />
                  <div className="flex items-center w-full">
                    <span className="inline-block px-2 py-1 bg-base-100 rounded text-xs font-semibold border border-base-200 mr-2 select-none" style={{minWidth:'44px',textAlign:'center'}}>+91</span>
                    <input
                      type="tel"
                      className="input validator tabular-nums w-full rounded-r bg-transparent border-none focus:ring-0 shadow-none text-base"
                      required
                      placeholder="WhatsApp number"
                      pattern="[0-9]*"
                      minLength={10}
                      maxLength={10}
                      title="Must be 10 digits"
                      value={editForm.whatsapp}
                      onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value.replace(/\D/g, '').slice(0,10) }))}
                      disabled={usePhoneForWhatsapp}
                    />
                  </div>
                  <label className="flex items-center gap-2 ml-3 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={usePhoneForWhatsapp}
                      onChange={e => {
                        setUsePhoneForWhatsapp(e.target.checked);
                        if (e.target.checked) {
                          setEditForm(f => ({ ...f, whatsapp: f.phone }));
                        }
                      }}
                      disabled={!editForm.phone || editForm.phone.replace(/\D/g, '').length !== 10}
                    />
                    <span>Same as phone</span>
                  </label>
                  <p className="validator-hint text-xs ml-2">Must be 10 digits</p>
                </div>
                {/* Gender */}
                <div className="flex items-center gap-4 pt-2 pl-1">
                  <span className="text-xl text-gray-500"><MdPerson className="w-4 h-4 opacity-70" /></span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      name="gender"
                      value="male"
                      checked={editForm.gender === 'male'}
                      onChange={() => setEditForm(f => ({ ...f, gender: 'male' }))}
                    />
                    <span className="text-sm">Male</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      name="gender"
                      value="female"
                      checked={editForm.gender === 'female'}
                      onChange={() => setEditForm(f => ({ ...f, gender: 'female' }))}
                    />
                    <span className="text-sm">Female</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      name="gender"
                      value="other"
                      checked={editForm.gender === 'other'}
                      onChange={() => setEditForm(f => ({ ...f, gender: 'other' }))}
                    />
                    <span className="text-sm">Other</span>
                  </label>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="btn btn-primary rounded-full px-8" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={closeEditModal}><button>close</button></form>
          </dialog>
        )}

        {/* Right Content (8 cols) */}
        {/* This section was already rendered in the previous replacement, but we need to remove the old "Right content" block to avoid duplication */}
        {/* The previous replacement replaced everything from "return (" down to "{editModalOpen && (" */}
        {/* So we need to remove the OLD right content block that comes AFTER the modal */}
        
        {/* Wait, I replaced the top part of the return statement. The modal code is still there. */}
        {/* The old code had:
            1. Left summary card
            2. Edit modal
            3. Right content
        */}
        {/* My new code has:
            1. Left Sidebar (Profile Card + Menu)
            2. Right Content (Addresses + Orders)
            3. Edit modal (start)
        */}
        
        {/* So I need to remove the OLD "Right content" block which is currently sitting AFTER the modal code in the file. */}


      {/* Address modal */}
      {addrModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-sm sm:max-w-md rounded-2xl shadow-2xl p-0">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={()=>setAddrModalOpen(false)} aria-label="Close">✕</button>
            <h3 className="font-bold text-lg text-left pt-6 pb-2 px-6">{addrEditing ? 'Edit address' : 'Add address'}</h3>
            <form className="px-6 pb-6 pt-2 space-y-4" onSubmit={e=>{e.preventDefault();saveAddress();}}>
              
              {/* Tags */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center">
                  {['Home', 'Work', 'Other'].map(tag => (
                      <label key={tag} className={`cursor-pointer px-5 py-2 rounded-full border text-xs font-bold transition-all ${addrForm.tag === tag ? 'bg-primary text-primary-content border-primary shadow-md shadow-primary/20' : 'bg-base-100 border-base-300 hover:border-base-400'}`}>
                          <input type="radio" className="hidden" name="addrTag" checked={addrForm.tag === tag} onChange={()=>setAddrForm(f=>({...f, tag}))} />
                          {tag}
                      </label>
                  ))}
              </div>

              {/* Auto-fill via GPS Button */}
              <button 
                  type="button" 
                  className="btn btn-sm btn-block rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 relative overflow-hidden group" 
                  onClick={()=>{ 
                    if (!('geolocation' in navigator)) { pushToast('Geolocation not supported','error'); return } 
                    navigator.geolocation.getCurrentPosition(async pos=>{ 
                      const lat = pos.coords.latitude; 
                      const lng = pos.coords.longitude; 
                      setAddrForm(f=>({...f,lat,lng})); 
                      
                      // Check delivery region
                      if (deliveryLocation.region) {
                         const check = deliveryLocation.checkWithin(lat, lng);
                         if (!check.ok) pushToast(`Location is outside delivery area (${check.distance.toFixed(1)}km)`, 'warning');
                      }

                      const parts = await reverseGeocode(lat, lng); 
                      if (parts) { 
                        setAddrForm(f=>({ 
                            ...f, 
                            // Auto-fill line 2
                            line2: parts.formatted || [parts.line1, parts.line2].filter(Boolean).join(', ') || f.line2, 
                            city: 'Durgapur', 
                            state: parts.state || f.state, 
                            zip: parts.zip || f.zip, 
                            placeId: parts.placeId || f.placeId, 
                            mapUrl: parts.mapUrl || f.mapUrl, 
                        })); 
                        pushToast('Address filled from location','success') 
                      } else { 
                        pushToast('Location captured','success') 
                      } 
                    }, (err) => {
                      if (err.code === 1) pushToast('Location access denied. Please enable permissions in browser settings.', 'error');
                      else pushToast('Location failed. Please try again.', 'error');
                    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) 
                  }}
              >
                  <div className="absolute inset-0 bg-primary/10 animate-pulse group-hover:animate-none"></div>
                  <span className="relative flex items-center gap-2 z-10">
                      <MdGpsFixed className="animate-bounce" /> Press to Auto-fill via GPS
                  </span>
              </button>

              {/* Landmark */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdPlace className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Nearby Landmark (Optional)" value={addrForm.landmark} onChange={(e)=>setAddrForm(f=>({...f,landmark:e.target.value}))} />
                  </div>
              </div>

              {/* Address Line 1 */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdApartment className="w-5 h-5 opacity-50" />
                      <input ref={addrLine1Ref} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="House / Flat No., Building" value={addrForm.line1} onChange={(e)=>setAddrForm(f=>({...f,line1:e.target.value}))} required />
                  </div>
              </div>

              {/* Address Line 2 (Auto) */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdMap className="w-5 h-5 opacity-50" />
                      <input ref={addrLine2Ref} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Area / Locality (Auto-filled)" value={addrForm.line2} onChange={(e)=>setAddrForm(f=>({...f,line2:e.target.value}))} />
                  </div>
                  <label className="label py-1"><span className="label-text-alt opacity-60">Select from suggestions for best accuracy</span></label>
              </div>

              {/* PIN & City */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdPinDrop className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="PIN Code" value={addrForm.zip} onChange={(e)=>setAddrForm(f=>({...f,zip:e.target.value}))} />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent opacity-70 cursor-not-allowed">
                      <MdLocationCity className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0" value="Durgapur" readOnly />
                  </div>
              </div>

              {/* Phone */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdLocalPhone className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Phone Number" value={addrForm.phone} onChange={(e)=>setAddrForm(f=>({...f,phone:e.target.value}))} />
                  </div>
              </div>

              {/* Confirm Location Only */}
              <button type="button" className="btn btn-sm btn-block rounded-xl btn-ghost bg-base-200/50" onClick={()=>{ 
                  if (!('geolocation' in navigator)) { pushToast('Geolocation not supported','error'); return } 
                  navigator.geolocation.getCurrentPosition(pos=>{ 
                    const lat = pos.coords.latitude; 
                    const lng = pos.coords.longitude; 
                    setAddrForm(f=>({...f,lat,lng})); 
                    pushToast('Location coordinates captured','success') 
                  }, (err) => {
                    if (err.code === 1) pushToast('Location access denied. Please enable permissions in browser settings.', 'error');
                    else pushToast('Location failed. Please try again.', 'error');
                  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) 
                }}><span className="inline-flex items-center gap-1"><MdGpsFixed className="w-3.5 h-3.5"/> Press to share location for faster delivery</span></button>
                <input type="hidden" value={addrForm.lat ?? ''} readOnly />
                <input type="hidden" value={addrForm.lng ?? ''} readOnly />

              {/* Set as default */}
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" className="checkbox checkbox-sm" checked={setAsDefault} onChange={(e)=> setSetAsDefault(e.target.checked)} />
                <span className="text-sm">Set as default</span>
              </div>
              <div className="flex justify-end pt-2 gap-2">
                <button type="submit" className="btn btn-primary rounded-full px-8" disabled={addrSaving}>{addrSaving ? 'Saving...' : 'Save'}</button>
                <button type="button" className="btn btn-ghost rounded-full px-8" onClick={()=>setAddrModalOpen(false)} disabled={addrSaving}>Cancel</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={()=>!addrSaving && setAddrModalOpen(false)}><button>close</button></form>
        </dialog>
      )}
    </div>
  )
}

// ── Order status utilities ──

const ORDER_STATUS_FLOW = ['placed', 'preparing', 'ready', 'delivered'];

const STATUS_BADGE_LOOKUP = {
  placed: 'badge-warning',
  preparing: 'badge-info',
  ready: 'badge-primary',
  delivered: 'badge-success',
  rejected: 'badge-error',
};

const INR_FORMATTER = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

function statusLabel(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusBadgeClass(status) {
  const badge = STATUS_BADGE_LOOKUP[status] || 'badge-ghost'
  return `badge badge-sm ${badge} capitalize`
}

function orderProgressPercent(status) {
  const idx = ORDER_STATUS_FLOW.indexOf(status)
  if (idx === -1) return 0
  if (ORDER_STATUS_FLOW.length === 1) return 100
  return Math.max(0, Math.min(100, Math.round((idx / (ORDER_STATUS_FLOW.length - 1)) * 100)))
}

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  if (typeof value.milliseconds === 'number') return new Date(value.milliseconds)
  if (typeof value === 'number') return new Date(value)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateTime(value) {
  const dt = toDate(value)
  if (!dt) return 'Unknown time'
  return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function safeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function formatCurrency(value) {
  const num = safeNumber(value)
  if (num === null) return '₹0.00'
  return INR_FORMATTER.format(num)
}

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : []
}

function calculateItemsSubtotal(items) {
  return items.reduce((sum, it) => sum + (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0), 0)
}

function getOrderSubtotal(order, items) {
  const explicit = safeNumber(order?.subtotal)
  if (explicit !== null) return explicit
  return calculateItemsSubtotal(items)
}

function getOrderTotal(order, items) {
  const explicit = safeNumber(order?.totalAmount) // schema: matches data-orders.js canonical write
  if (explicit !== null) return explicit
  const subtotal = getOrderSubtotal(order, items)
  const tax = safeNumber(order?.taxAmount) || 0
  return subtotal + tax
}

function getOrderIdentifier(order) {
  if (!order) return '#—'
  if (order.orderNo) return order.orderNo
  if (order.id) return `#${String(order.id).slice(-6)}`
  return '#—'
}

function getOrderAddressParts(order) {
  const addr = order?.customer?.address || {}
  const primary = addr.line || [addr.line1, addr.line2].filter(Boolean).join(', ')
  const secondaryParts = [addr.city || addr.district, addr.state, addr.pin || addr.zip].filter(Boolean)
  const secondary = secondaryParts.join(', ')
  return { primary, secondary }
}

// ── OrderCard component ──

function OrderCard({ order, openModal, onReorder }) {
  if (!order) return null
  const status = order.status || 'placed'
  const items = getOrderItems(order)
  const progress = orderProgressPercent(status)
  const isRejected = status === 'rejected'
  const isDelivered = status === 'delivered'
  const total = getOrderTotal(order, items)
  const placedAt = formatDateTime(order.createdAt)
  const { primary: addressLine, secondary: addressSecondary } = getOrderAddressParts(order)
  const identifier = getOrderIdentifier(order)
  const legacyId = order.orderNo && order.id && order.orderNo !== order.id ? `#${String(order.id).slice(-6)}` : null
  return (
    <div className={`card bg-base-100/70 backdrop-blur-sm border border-base-300/60 shadow-sm ${isRejected ? 'opacity-70' : ''}`}>
      <div className="card-body p-4 gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
              <span>{identifier}</span>
              {legacyId && <span className="badge badge-ghost badge-xs">{legacyId}</span>}
              <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
            </div>
            <div className="text-xs opacity-70 flex flex-wrap gap-2 mt-1">
              <span>{placedAt}</span>
              <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
              <span>Total {formatCurrency(total)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-right">
            {order.orderType && <span className="badge badge-ghost badge-xs capitalize">{order.orderType}</span>}
            {order.payment?.method && <span className="uppercase tracking-wide opacity-70">{order.payment.method}</span>}
            {order.payment?.status && <span className="opacity-40 capitalize">{order.payment.status}</span>}
          </div>
        </div>
        {!isRejected && (
          <div className="mt-2">
            <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[9px] uppercase tracking-wide opacity-60 mt-1">
              {ORDER_STATUS_FLOW.map((step) => (
                <span key={step} className={status === step ? 'text-primary font-semibold' : ''}>{step}</span>
              ))}
            </div>
          </div>
        )}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {items.slice(0, 4).map((it) => (
              <span key={`${order.id || 'order'}-${it.id || it.name}`} className="px-2 py-1 text-xs rounded-full bg-base-200/70 border border-base-300/60">
                {it.name} × {it.qty}
              </span>
            ))}
            {items.length > 4 && <span className="text-xs opacity-70">+{items.length - 4} more</span>}
          </div>
        )}
        {(addressLine || addressSecondary) && (
          <div className="text-xs opacity-70 mt-2 space-y-1">
            {addressLine && <div className="flex items-center gap-1"><MdPlace className="w-3.5 h-3.5 opacity-60" /><span>{addressLine}</span></div>}
            {addressSecondary && <div className="pl-5">{addressSecondary}</div>}
          </div>
        )}
        {order.customer?.note && <div className="text-xs opacity-60 mt-2">Note: {order.customer.note}</div>}
        <div className="flex justify-end gap-2 mt-3">
          {(isDelivered || isRejected) && items.length > 0 && (
            <button className="btn btn-xs btn-ghost gap-1" onClick={() => onReorder && onReorder(items)}>
              <MdReplay className="w-3.5 h-3.5" /> Reorder
            </button>
          )}
          <button className="btn btn-xs btn-outline" onClick={() => openModal(order)}>View details</button>
        </div>
      </div>
    </div>
  )
}

// ── OrderDetailsModal component ──

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null
  const status = order.status || 'placed'
  const statusIndex = ORDER_STATUS_FLOW.indexOf(status)
  const items = getOrderItems(order)
  const subtotal = getOrderSubtotal(order, items)
  const taxAmount = safeNumber(order?.taxAmount)
  const deliveryFee = safeNumber(order?.deliveryFee ?? order?.shippingFee)
  const discount = safeNumber(order?.discount)
  const total = getOrderTotal(order, items)
  const placedAt = formatDateTime(order.createdAt)
  const updatedAt = order.updatedAt ? formatDateTime(order.updatedAt) : null
  const { primary: addressLine, secondary: addressSecondary } = getOrderAddressParts(order)
  const identifier = getOrderIdentifier(order)
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleBackdropClick}>
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Order {identifier}</h3>
              <p className="text-xs opacity-70">Placed {placedAt}</p>
              {updatedAt && updatedAt !== placedAt && <p className="text-xs opacity-60">Updated {updatedAt}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
              {order.orderType && <span className="badge badge-ghost badge-xs capitalize">{order.orderType}</span>}
            </div>
          </div>
          {status !== 'rejected' && (
            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${orderProgressPercent(status)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-wide opacity-60">
                {ORDER_STATUS_FLOW.map((step, idx) => (
                  <span key={step} className={idx <= statusIndex && statusIndex !== -1 ? 'text-primary font-semibold' : ''}>{step}</span>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl border border-base-300/60 bg-base-100/80">
            {items.length > 0 ? (
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs uppercase opacity-60">
                    <th className="bg-transparent">Item</th>
                    <th className="bg-transparent text-right">Qty</th>
                    <th className="bg-transparent text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const lineTotal = (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0)
                    return (
                      <tr key={`${order.id || 'order'}-${it.id || it.name}`} className="text-sm">
                        <td>{it.name}</td>
                        <td className="text-right">{it.qty}</td>
                        <td className="text-right">{formatCurrency(lineTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-sm opacity-70">No items recorded for this order.</div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-base">Customer</div>
              <div>{order.customer?.name || '—'}</div>
              {order.customer?.phone && <div>{order.customer.phone}</div>}
              {order.customer?.email && <div>{order.customer.email}</div>}
              {(addressLine || addressSecondary) && <div className="divider my-2" />}
              {addressLine && <div>{addressLine}</div>}
              {addressSecondary && <div>{addressSecondary}</div>}
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-base">Payment</div>
              <div>Method: {order.payment?.method ? order.payment.method.toUpperCase() : '—'}</div>
              {order.payment?.status && <div className="text-xs opacity-70">Status: {order.payment.status}</div>}
              <div className="divider my-2" />
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {taxAmount !== null && <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>}
              {deliveryFee !== null && <div className="flex justify-between"><span>Delivery</span><span>{formatCurrency(deliveryFee)}</span></div>}
              {discount !== null && discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>
          {order.customer?.note && (
            <div className="rounded-lg border border-base-300/60 bg-base-200/70 p-3 text-sm">
              <div className="font-semibold text-xs uppercase opacity-60 mb-1">Customer note</div>
              <div>{order.customer.note}</div>
            </div>
          )}
          {order.id && (
            <div className="text-[11px] opacity-50">Internal ID: {order.id}</div>
          )}
        </div>
        <div className="modal-action p-4 pt-0">
          <button className="btn btn-error" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

