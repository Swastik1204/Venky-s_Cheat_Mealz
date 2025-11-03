import { useEffect, useRef, useState, useCallback } from 'react'
import { MdPlace, MdApartment, MdLocationCity, MdMap, MdPinDrop, MdLocalPhone, MdGpsFixed, MdPerson, MdMail, MdEdit, MdLocalShipping, MdPolicy, MdGavel, MdCancel } from 'react-icons/md'
import { Link, useLocation } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import { MdRefresh } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { fetchUserOrders, fetchUserProfile, updateUserProfile, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../lib/data'
import { reverseGeocode, geocodeAddress } from '../lib/google'
import { useUI } from '../context/UIContext'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import ProfileCompletionAlert from '../components/ProfileCompletionAlert'
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete'

// Helper to compute profile completion (shared by components)
function getProfileCompletion(user, profileForm, addrState) {
  if (!user) return 0;
  const checks = [];
  const nameOk = !!(profileForm.displayName || '').trim();
  const phoneOk = /\d{10}/.test((profileForm.phone || '').replace(/\D/g, ''));
  const hasAnyAddr = (addrState.list || []).length > 0;
  checks.push(nameOk, phoneOk, hasAnyAddr);
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return Math.max(0, Math.min(100, pct));
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { pushToast, confirm } = useUI();
  const location = useLocation();
  const deliveryLocation = useDeliveryLocation();

  // Profile and orders state
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ displayName: '', phone: '', whatsapp: '', gender: '', photoURL: '', email: '' });
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', whatsapp: '', gender: '', photoURL: '', email: '' });
  const [editPicFile, setEditPicFile] = useState(null);
  const [editPicPreview, setEditPicPreview] = useState('');
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
    setEditPicFile(null);
    setEditPicPreview('');
    setUsePhoneForWhatsapp(false);
  }, [profileSaving]);

  // Load orders
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    let active = true;
    setLoadingOrders(true);
    fetchUserOrders(user.uid)
      .then((list) => {
        if (!active) return;
        setOrders(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!active) return;
        console.error('[profile] Failed to load orders', err);
        setOrders([]);
        pushToast('Failed to load orders. Please try again.', 'error');
      })
      .finally(() => {
        if (!active) return;
        setLoadingOrders(false);
      });
    return () => { active = false; };
  }, [user, pushToast]);

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
      setProfileForm({ displayName: '', phone: '', whatsapp: '', gender: '', photoURL: '', email: '' });
      setEditForm({ displayName: '', phone: '', whatsapp: '', gender: '', photoURL: '', email: '' });
      setUsePhoneForWhatsapp(false);
      setEditPicFile(null);
      setEditPicPreview('');
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
          photoURL: p?.photoURL || '',
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
            photoURL: p?.photoURL || '',
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
        gender: profileForm.gender || profile?.gender || '',
        photoURL: user?.photoURL || profileForm.photoURL || ''
      });
      setEditPicFile(null);
      setEditPicPreview('');
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
      gender: profileForm.gender || profile?.gender || '',
      photoURL: user?.photoURL || profileForm.photoURL || ''
    });
    setEditPicFile(null);
    setEditPicPreview('');
    setEditAlert('');
    setUsePhoneForWhatsapp(sameContact);
    setEditModalOpen(true);
  }, [addrState.list, profile, profileForm.displayName, profileForm.gender, profileForm.phone, profileForm.photoURL, profileForm.whatsapp, user?.email, user?.photoURL, openAddAddress]);

  const handleProfilePicInput = (event) => {
    const file = event.target?.files?.[0]
    if (!file) {
      setEditPicFile(null)
      setEditPicPreview('')
      return
    }
    if (!file.type.startsWith('image/')) {
      pushToast('Please choose a valid image file.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditPicPreview(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
    setEditPicFile(file)
    pushToast('Profile photo uploads are coming soon. We will keep your current picture for now.', 'info')
    event.target.value = ''
  }

  // TODO: Implement real upload via storage; temporary no-op to keep flow intact
  async function uploadProfilePic() {
    return editForm.photoURL || user?.photoURL || ''
  }
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
      let photoURL = editForm.photoURL;
      if (editPicFile) {
        // Assume uploadProfilePic returns the URL
        photoURL = await uploadProfilePic(user.uid, editPicFile);
      }
      await updateUserProfile(user.uid, {
        ...profileForm,
        displayName: editForm.displayName,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        gender: editForm.gender,
        photoURL
      });
      setProfileForm(f => ({ ...f, displayName: editForm.displayName, phone: editForm.phone, whatsapp: editForm.whatsapp, gender: editForm.gender, photoURL }));
      setProfile(p => ({ ...(p||{}), displayName: editForm.displayName, phone: editForm.phone, whatsapp: editForm.whatsapp, gender: editForm.gender, photoURL }));
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
      line1: parts.line1 || parts.formatted || f.line1,
      line2: parts.line2 || f.line2,
      city: parts.city || f.city,
      state: parts.state || f.state,
      zip: parts.zip || f.zip,
      placeId: parts.placeId || f.placeId,
      mapUrl: parts.mapUrl || f.mapUrl,
      lat: typeof parts.lat === 'number' ? parts.lat : f.lat,
      lng: typeof parts.lng === 'number' ? parts.lng : f.lng,
    }))
  }, [])
  usePlacesAutocomplete(addrLine1Ref, handleAddrAutocomplete, { enabled: addrModalOpen })
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


  if (!user) {
    return (
      <div className="page-wrap py-6">
        <div className="alert">Please log in to view your profile.</div>
      </div>
    )
  }
  return (
    <div className="page-wrap py-6 space-y-6">
      {/* Profile heading with logout button on the right */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Profile</h1>
        <button className="btn btn-outline btn-error btn-sm" style={{marginLeft:'auto'}} onClick={logout}>Logout</button>
      </div>

    {/* Profile completion alert (inline) */}
    <ProfileCompletionAlert user={user} profileForm={profileForm} addrState={addrState} onEdit={openEditModal} />


      <div className="grid lg:grid-cols-4 gap-4">
        {/* Left summary card with personal details and edit button */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100/70 backdrop-blur border border-base-300/60 shadow-sm">
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-5">
                  <div className="relative flex items-center justify-center">
                    {(() => {
                      const completion = getProfileCompletion(user, profileForm, addrState);
                      return (
                        <div className="radial-progress absolute z-0" style={{
                          '--value': completion,
                          '--size': '6rem',
                          '--thickness': '8px',
                          color: completion === 100 ? '#22c55e' : completion >= 76 ? '#fb923c' : completion >= 40 ? '#facc15' : '#ef4444',
                          transition: 'color 0.5s',
                        }} role="progressbar">{completion}%</div>
                      );
                    })()}
                    <div className="avatar z-10"><div className="w-20 rounded-full ring ring-base-300/60"><img alt="avatar" src={profileForm.photoURL || user?.photoURL || '/icons/logo.png'} /></div></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-semibold text-lg">{profileForm.displayName || user?.displayName || 'User'}</div>
                      <div className="text-xs opacity-70">Member</div>
                    </div>
                    <button className="btn btn-xs btn-ghost p-1 ml-1" title="Edit personal details" onClick={() => {
                      const phoneDigits = (profileForm.phone || '').replace(/\D/g, '').slice(0, 10);
                      const whatsappDigits = (profileForm.whatsapp || '').replace(/\D/g, '').slice(0, 10);
                      setEditForm({
                        displayName: profileForm.displayName || '',
                        phone: profileForm.phone || '',
                        whatsapp: profileForm.whatsapp || '',
                        email: user?.email || '',
                        gender: profileForm.gender || profile?.gender || '',
                        photoURL: user?.photoURL || profileForm.photoURL || ''
                      });
                      setEditPicFile(null);
                      setEditPicPreview('');
                      setEditAlert('');
                      setUsePhoneForWhatsapp(Boolean(phoneDigits) && phoneDigits === whatsappDigits);
                      setEditModalOpen(true);
                    }}><MdEdit className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 text-base-content/80"><MdLocalPhone className="w-4 h-4" /><span className="text-sm font-medium">{profileForm.phone || 'Add phone'}</span></div>
                <div className="flex items-center gap-2 text-base-content/80"><MdMail className="w-4 h-4" /><span className="text-sm font-medium">{user?.email}</span></div>
              </div>
              <div className="divider my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="stat p-3 bg-base-100 rounded-xl border border-base-300/60"><div className="stat-title text-[10px]">Orders</div><div className="stat-value text-lg">{orders.length}</div></div>
              </div>
              <div className="mt-4">
                <div className="divider my-3" />
                <div className="space-y-1 text-left">
                  <Link to="/cancellation-refunds" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-200/60 transition">
                    <MdCancel className="w-4 h-4 opacity-70" />
                    <span className="text-sm">Cancellation & Refunds</span>
                  </Link>
                  <Link to="/terms" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-200/60 transition">
                    <MdGavel className="w-4 h-4 opacity-70" />
                    <span className="text-sm">Terms and Conditions</span>
                  </Link>
                  <Link to="/shipping" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-200/60 transition">
                    <MdLocalShipping className="w-4 h-4 opacity-70" />
                    <span className="text-sm">Shipping</span>
                  </Link>
                  <Link to="/privacy" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-200/60 transition">
                    <MdPolicy className="w-4 h-4 opacity-70" />
                    <span className="text-sm">Privacy</span>
                  </Link>
                  <Link to="/contact" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-200/60 transition">
                    <MdMail className="w-4 h-4 opacity-70" />
                    <span className="text-sm">Contact Us</span>
                  </Link>
                </div>
              </div>
            </div>
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
                <div className="flex items-center gap-4 px-2">
                  <div className="avatar"><div className="w-16 rounded-full ring ring-base-300/60"><img alt="Profile preview" src={editPicPreview || editForm.photoURL || user?.photoURL || '/icons/logo.png'} /></div></div>
                  <div className="flex flex-col gap-2 text-xs">
                    <label className="btn btn-xs btn-outline w-fit">
                      <span>Select photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicInput} />
                    </label>
                    {editPicFile && (
                      <button type="button" className="btn btn-xs btn-ghost w-fit" onClick={() => { setEditPicFile(null); setEditPicPreview(''); }}>Remove selection</button>
                    )}
                    <p className="text-[11px] opacity-70 max-w-[220px]">Profile photo uploads will be enabled soon. Your current picture remains visible.</p>
                  </div>
                </div>
                {/* Display Name (required) */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <MdPerson className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none py-2 placeholder:opacity-70"
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
                    className="w-full bg-transparent outline-none py-2 placeholder:opacity-70 text-gray-400"
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

        {/* Right content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Addresses as cards */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2"><h2 className="text-lg font-semibold">Addresses</h2><button className="btn btn-sm btn-outline" onClick={openAddAddress}>Add address</button></div>
            {addrState.list.length === 0 && <div className="opacity-60 text-sm">No addresses yet.</div>}
            <div className="grid md:grid-cols-2 gap-4">
              {addrState.list.map(a => (
                <div key={a.id} className={`relative rounded-xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm p-4 space-y-2 shadow-sm ${addrState.defaultId===a.id?'ring-1 ring-primary/40':''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium tracking-tight">{a.name || a.tag || 'Address'}</span>
                        {addrState.defaultId===a.id && <span className="badge badge-primary badge-xs">Default</span>}
                        {a.tag && <span className="badge badge-ghost badge-xs capitalize">{a.tag}</span>}
                      </div>
                      <div className="text-xs leading-relaxed opacity-80 whitespace-pre-line">
                        {[a.line1,a.line2,a.city,a.state,a.zip].filter(Boolean).join(', ')}
                        {a.landmark && <div>Landmark: {a.landmark}</div>}
                        {a.phone && <div>Phone: {a.phone}</div>}
                        {(typeof a.lat==='number' && typeof a.lng==='number') && (<div>Location: <a className="link" href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noopener noreferrer">{a.lat.toFixed(4)},{a.lng.toFixed(4)}</a></div>)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button className="btn btn-ghost btn-xs" onClick={()=>openEditAddress(a)} title="Edit">✎</button>
                      <button className="btn btn-ghost btn-xs text-error" onClick={()=>removeAddress(a)} title="Delete">🗑</button>
                    </div>
                  </div>
                  {addrState.defaultId!==a.id && (<div className="flex justify-end"><button className="btn btn-xs btn-outline" onClick={()=>makeDefault(a)}>Set default</button></div>)}
                </div>
              ))}
            </div>
          </div>

          {/* Orders as cards, most recent open, rest closed, modal for details, see more for >5 */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <h2 className="text-lg font-semibold">Orders</h2>
              <button className="btn btn-sm btn-outline btn-circle" title="Refresh orders" onClick={handleOrdersRefresh} disabled={loadingOrders}>
                <MdRefresh className="w-5 h-5" />
              </button>
            </div>
            {loadingOrders && <div className="loading loading-spinner loading-md text-primary" />}
            {!loadingOrders && orders.length === 0 && <div className="opacity-70">No orders yet.</div>}
            <div className="space-y-4">
              {/* Most recent open order */}
              {orders.filter(o => o.status !== 'delivered').slice(0,1).map(o => (
                <OrderCard key={o.id} order={o} openModal={setOrderModal} />
              ))}
              {/* Past orders, up to 5, with see more */}
              {orders.filter(o => o.status === 'delivered').slice(0,showAllOrders?orders.length:5).map(o => (
                <OrderCard key={o.id} order={o} openModal={setOrderModal} />
              ))}
              {orders.filter(o => o.status === 'delivered').length > 5 && !showAllOrders && (
                <button className="btn btn-sm btn-outline" onClick={()=>setShowAllOrders(true)}>See more</button>
              )}
            </div>
            {/* Order details modal */}
            {orderModal && (
              <OrderDetailsModal order={orderModal} onClose={()=>setOrderModal(null)} />
            )}
          </div>
        </div>
      </div>

      {/* Address modal */}
      {addrModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-sm sm:max-w-md rounded-2xl shadow-2xl p-0">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={()=>setAddrModalOpen(false)} aria-label="Close">✕</button>
            <h3 className="font-bold text-lg text-left pt-6 pb-2 px-6">{addrEditing ? 'Edit address' : 'Add address'}</h3>
            <form className="px-6 pb-6 pt-2 space-y-6" onSubmit={e=>{e.preventDefault();saveAddress();}}>
              {/* Address type */}
              <div className="flex items-center gap-4 pt-2 pl-1">
                <span className="text-xl text-gray-500"><MdPlace className="w-4 h-4 opacity-70" /></span>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input type="radio" className="radio radio-sm" name="addrTag" checked={addrForm.tag==='Home'} onChange={()=> setAddrForm(f=>({...f, tag: 'Home'}))} />
                  <span className="text-sm">Home</span>
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input type="radio" className="radio radio-sm" name="addrTag" checked={addrForm.tag==='Work'} onChange={()=> setAddrForm(f=>({...f, tag: 'Work'}))} />
                  <span className="text-sm">Work</span>
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input type="radio" className="radio radio-sm" name="addrTag" checked={addrForm.tag!=='Home' && addrForm.tag!=='Work'} onChange={()=> setAddrForm(f=>({...f, tag: ''}))} />
                  <span className="text-sm">Other</span>
                </label>
                {(addrForm.tag!=='Home' && addrForm.tag!=='Work') && (
                  <input className="input input-sm bg-transparent border-b border-base-300 focus:border-primary/60 outline-none w-24 ml-2" value={addrForm.tag} onChange={(e)=> setAddrForm(f=>({...f, tag: e.target.value}))} placeholder="Tag" />
                )}
              </div>
              {/* Address line 1 */}
              <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                <MdPlace className="w-4 h-4 opacity-70" />
                <input
                  ref={addrLine1Ref}
                  type="text"
                  className="w-full bg-transparent outline-none py-2 placeholder:opacity-70"
                  placeholder="Flat No. / House No., Street"
                  value={addrForm.line1}
                  onChange={e=>setAddrForm(f=>({...f,line1:e.target.value}))}
                  required
                />
              </div>
              {/* Address line 2 */}
              <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                <MdApartment className="w-4 h-4 opacity-70" />
                <input
                  type="text"
                  className="w-full bg-transparent outline-none py-2 placeholder:opacity-70"
                  placeholder="Area / Locality"
                  value={addrForm.line2}
                  onChange={e=>setAddrForm(f=>({...f,line2:e.target.value}))}
                />
              </div>
              {/* City and State (fixed) */}
              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-2 px-2 border-b border-base-300 transition pb-2">
                  <MdLocationCity className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none py-2 placeholder:opacity-70"
                    value="Durgapur"
                    disabled
                    readOnly
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 px-2 border-b border-base-300 transition pb-2">
                  <MdMap className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none py-2 placeholder:opacity-70"
                    value="West Bengal"
                    disabled
                    readOnly
                  />
                </div>
              </div>
              {/* PIN/ZIP and Phone */}
              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <MdPinDrop className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none py-2 placeholder:opacity-70"
                    placeholder="PIN / ZIP"
                    value={addrForm.zip}
                    onChange={e=>setAddrForm(f=>({...f,zip:e.target.value}))}
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <MdLocalPhone className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none py-2 placeholder:opacity-70"
                    placeholder="Phone"
                    value={addrForm.phone}
                    onChange={e=>setAddrForm(f=>({...f,phone:e.target.value}))}
                  />
                </div>
              </div>
              {/* Share Google Location */}
              <div className="flex justify-end pt-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={()=>{ if (!('geolocation' in navigator)) { pushToast('Geolocation not supported','error'); return } navigator.geolocation.getCurrentPosition(async pos=>{ const lat = pos.coords.latitude; const lng = pos.coords.longitude; setAddrForm(f=>({...f,lat,lng})); const parts = await reverseGeocode(lat, lng); if (parts) { setAddrForm(f=>({ ...f, line1: parts.line1 || f.line1, line2: f.line2, city: parts.city || f.city, state: parts.state || f.state, zip: parts.zip || f.zip, placeId: parts.placeId || f.placeId, mapUrl: parts.mapUrl || f.mapUrl, })); pushToast('Address filled from location','success') } else { pushToast('Location captured','success') } },()=>pushToast('Location failed','error')) }}><span className="inline-flex items-center gap-1"><MdGpsFixed className="w-3.5 h-3.5"/> Share Google Location</span></button>
                <input type="hidden" value={addrForm.lat ?? ''} readOnly />
                <input type="hidden" value={addrForm.lng ?? ''} readOnly />
              </div>
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
  return items.reduce((sum, it) => sum + (Number(it?.price) || 0) * (Number(it?.qty) || 0), 0)
}

function getOrderSubtotal(order, items) {
  const explicit = safeNumber(order?.subtotal)
  if (explicit !== null) return explicit
  return calculateItemsSubtotal(items)
}

function getOrderTotal(order, items) {
  const explicit = safeNumber(order?.totalAmount ?? order?.grandTotal ?? order?.total)
  if (explicit !== null) return explicit
  const subtotal = getOrderSubtotal(order, items)
  const tax = safeNumber(order?.taxAmount) || 0
  const delivery = safeNumber(order?.deliveryFee ?? order?.shippingFee) || 0
  const discount = safeNumber(order?.discount) || 0
  return subtotal + tax + delivery - discount
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

function OrderCard({ order, openModal }) {
  if (!order) return null
  const status = order.status || 'placed'
  const items = getOrderItems(order)
  const progress = orderProgressPercent(status)
  const isRejected = status === 'rejected'
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
        <div className="flex justify-end mt-3">
          <button className="btn btn-xs btn-outline" onClick={() => openModal(order)}>View details</button>
        </div>
      </div>
    </div>
  )
}

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
  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-2xl p-0">
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
                    const lineTotal = (Number(it?.price) || 0) * (Number(it?.qty) || 0)
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
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}><button>close</button></form>
    </dialog>
  )
}

