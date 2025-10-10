import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchUserOrders, fetchUserProfile, updateUserProfile, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../lib/data'
import { useUI } from '../context/UIContext'

export default function Profile() {
  const { user } = useAuth()
  const { pushToast, confirm } = useUI()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ displayName: '', phone: '', bio: '', defaultPayment: 'cod', upiId: '', cardHolder: '', cardLast4: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [addrState, setAddrState] = useState({ list: [], defaultId: null })
  const [addrModalOpen, setAddrModalOpen] = useState(false)
  const [addrEditing, setAddrEditing] = useState(null) // existing address object or null
  const [addrForm, setAddrForm] = useState({ name: '', line1: '', line2: '', city: '', state: '', zip: '', landmark: '', phone: '', tag: 'Home', lat: null, lng: null, placeId: '', mapUrl: '' })
  const [addrSaving, setAddrSaving] = useState(false)

  // Load orders
  useEffect(() => {
    if (!user) return
    setLoadingOrders(true)
    fetchUserOrders(user.uid)
      .then(setOrders)
      .finally(() => setLoadingOrders(false))
  }, [user])

  // Load profile & addresses
  useEffect(() => {
    if (!user) return
    let mounted = true
    ;(async () => {
      const p = await fetchUserProfile(user.uid)
      if (mounted && p) {
        setProfile(p)
        setProfileForm({
          displayName: p.displayName || '',
          phone: p.phone || '',
          bio: p.bio || '',
          defaultPayment: p.defaultPayment || 'cod',
          upiId: p.upiId || '',
          cardHolder: p.cardHolder || '',
          cardLast4: p.cardLast4 || ''
        })
      }
      const a = await fetchAddresses(user.uid)
      if (mounted) setAddrState(a)
    })()
    return () => { mounted = false }
  }, [user])

  function resetProfileForm() {
    if (!profile) return
    setProfileForm({
      displayName: profile.displayName || '',
      phone: profile.phone || '',
      bio: profile.bio || '',
      defaultPayment: profile.defaultPayment || 'cod',
      upiId: profile.upiId || '',
      cardHolder: profile.cardHolder || '',
      cardLast4: profile.cardLast4 || ''
    })
  }

  async function saveProfile() {
    if (!user) return
    setProfileSaving(true)
    try {
      await updateUserProfile(user.uid, profileForm)
      setProfile(p => ({ ...(p||{}), ...profileForm }))
      pushToast('Profile updated', 'success')
    } catch (e) {
      pushToast(e.message || 'Update failed', 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  function openAddAddress() {
    setAddrEditing(null)
  setAddrForm({ name: '', line1: '', line2: '', city: '', state: '', zip: '', landmark: '', phone: '', tag: 'Home', lat: null, lng: null, placeId: '', mapUrl: '' })
    setAddrModalOpen(true)
  }
  function openEditAddress(a) {
    setAddrEditing(a)
  setAddrForm({ name: a.name||'', line1: a.line1||'', line2: a.line2||'', city: a.city||'', state: a.state||'', zip: a.zip||'', landmark: a.landmark||'', phone: a.phone||'', tag: a.tag||'Other', lat: a.lat ?? null, lng: a.lng ?? null, placeId: a.placeId || '', mapUrl: a.mapUrl || '' })
    setAddrModalOpen(true)
  }
  async function saveAddress() {
    if (!user) return
    setAddrSaving(true)
    try {
      if (addrEditing) {
        await updateAddress(user.uid, addrEditing.id, addrForm)
        pushToast('Address updated', 'success')
      } else {
        await addAddress(user.uid, addrForm)
        pushToast('Address added', 'success')
      }
      const a = await fetchAddresses(user.uid)
      setAddrState(a)
      setAddrModalOpen(false)
    } catch (e) {
      pushToast(e.message || 'Save failed', 'error')
    } finally {
      setAddrSaving(false)
    }
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
          pushToast(e.message || 'Delete failed', 'error')
        }
      }
    })
  }
  async function makeDefault(a) {
    if (!user) return
    try {
      await setDefaultAddress(user.uid, a.id)
      const next = await fetchAddresses(user.uid)
      setAddrState(next)
      pushToast('Default address set', 'success')
    } catch (e) {
      pushToast(e.message || 'Operation failed', 'error')
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
    <div className="page-wrap py-6 space-y-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-sm opacity-70">Signed in as {user.email}</p>
      </div>

      {/* Profile details */}
  <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Personal details</h2>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm" onClick={saveProfile} disabled={profileSaving}>Save</button>
            <button className="btn btn-sm btn-ghost" onClick={resetProfileForm} disabled={profileSaving}>Reset</button>
          </div>
        </div>
  <div className="grid md:grid-cols-4 gap-4">
          <label className="form-control w-full">
            <div className="label"><span className="label-text text-xs">Display name</span></div>
            <input className="input input-bordered input-sm" value={profileForm.displayName} onChange={e=>setProfileForm(f=>({...f,displayName:e.target.value}))} placeholder="Your name" />
          </label>
          <label className="form-control w-full">
            <div className="label"><span className="label-text text-xs">Phone</span></div>
            <input className="input input-bordered input-sm" value={profileForm.phone} onChange={e=>setProfileForm(f=>({...f,phone:e.target.value}))} placeholder="Phone number" />
          </label>
          <label className="form-control w-full">
            <div className="label"><span className="label-text text-xs">Email</span></div>
            <input className="input input-bordered input-sm" value={user.email} disabled />
          </label>
          <label className="form-control md:col-span-4">
            <div className="label"><span className="label-text text-xs">Bio</span></div>
            <textarea className="textarea textarea-bordered textarea-sm" rows={3} value={profileForm.bio} onChange={e=>setProfileForm(f=>({...f,bio:e.target.value}))} placeholder="Short bio (optional)" />
          </label>
        </div>
        <div className="rounded-xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold tracking-tight">Payment preferences</h3>
            <span className="text-[11px] opacity-60">Non-sensitive only</span>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <div className="label p-0"><span className="label-text text-xs">Default payment method</span></div>
              <div className="flex flex-wrap gap-2">
                {['cod','upi','card'].map(m => (
                  <label key={m} className={`cursor-pointer inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] uppercase tracking-wide ${profileForm.defaultPayment===m?'bg-primary/10 border-primary text-primary':'border-base-300/70 hover:border-primary/40'}`}>
                    <input type="radio" className="radio radio-xs" name="pay" checked={profileForm.defaultPayment===m} onChange={()=>setProfileForm(f=>({...f,defaultPayment:m}))} />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </div>
            {profileForm.defaultPayment==='upi' && (
              <label className="form-control md:col-span-2">
                <div className="label"><span className="label-text text-xs">UPI ID</span></div>
                <input className="input input-bordered input-sm" value={profileForm.upiId} onChange={e=>setProfileForm(f=>({...f,upiId:e.target.value.trim()}))} placeholder="name@bank" />
              </label>
            )}
            {profileForm.defaultPayment==='card' && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <label className="form-control col-span-2">
                  <div className="label"><span className="label-text text-xs">Card holder</span></div>
                  <input className="input input-bordered input-sm" value={profileForm.cardHolder} onChange={e=>setProfileForm(f=>({...f,cardHolder:e.target.value}))} placeholder="Name on card" />
                </label>
                <label className="form-control">
                  <div className="label"><span className="label-text text-xs">Last 4 digits</span></div>
                  <input className="input input-bordered input-sm" maxLength={4} value={profileForm.cardLast4} onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,'').slice(0,4); setProfileForm(f=>({...f,cardLast4:v}))}} placeholder="1234" />
                </label>
                <div className="text-[11px] opacity-60 flex items-end">Only stored for reference.</div>
              </div>
            )}
          </div>
          <div className="text-[11px] opacity-60">COD = pay at delivery, UPI = quick collect, Card = label only.</div>
        </div>
      </section>

      {/* Addresses */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Addresses</h2>
          <button className="btn btn-sm btn-outline" onClick={openAddAddress}>Add address</button>
        </div>
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
                    {(typeof a.lat==='number' && typeof a.lng==='number') && (
                      <div>Location: <a className="link" href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noopener noreferrer">{a.lat.toFixed(4)},{a.lng.toFixed(4)}</a></div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button className="btn btn-ghost btn-xs" onClick={()=>openEditAddress(a)} title="Edit">✎</button>
                  <button className="btn btn-ghost btn-xs text-error" onClick={()=>removeAddress(a)} title="Delete">🗑</button>
                </div>
              </div>
              {addrState.defaultId!==a.id && (
                <div className="flex justify-end">
                  <button className="btn btn-xs btn-outline" onClick={()=>makeDefault(a)}>Set default</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Orders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Orders</h2>
          <button className="btn btn-sm btn-outline" onClick={()=>{
            if(!user) return; setLoadingOrders(true); fetchUserOrders(user.uid).then(setOrders).finally(()=>setLoadingOrders(false))
          }}>Refresh</button>
        </div>
        {loadingOrders && <div className="loading loading-spinner loading-md text-primary" />}
        {!loadingOrders && orders.length === 0 && <div className="opacity-70">No orders yet.</div>}
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="rounded-xl border border-base-300/60 bg-base-100/70 backdrop-blur-sm p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Order #{o.id.slice(-6)}</h3>
                <span className={`badge badge-sm ${o.status==='placed'?'badge-info':o.status==='delivered'?'badge-success':'badge-ghost'}`}>{o.status}</span>
              </div>
              <div className="text-xs flex flex-wrap gap-4 opacity-80 mb-1">
                <span>{o.items?.length || 0} items</span>
                <span>Total: ₹{o.subtotal}</span>
                {o.payment?.method && <span>Payment: {o.payment.method.toUpperCase()}</span>}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] opacity-70">
                {o.items?.slice(0,5).map(it => (
                  <span key={it.id}>{it.name} × {it.qty}</span>
                ))}
                {o.items?.length > 5 && <span>+{o.items.length - 5} more</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Address modal */}
      {addrModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-semibold mb-2">{addrEditing?'Edit address':'Add address'}</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input className="input input-bordered input-sm col-span-2" placeholder="Label / Name (e.g. Home)" value={addrForm.name} onChange={e=>setAddrForm(f=>({...f,name:e.target.value}))} />
              <input className="input input-bordered input-sm col-span-2" placeholder="Address line 1" value={addrForm.line1} onChange={e=>setAddrForm(f=>({...f,line1:e.target.value}))} />
              <input className="input input-bordered input-sm col-span-2" placeholder="Address line 2" value={addrForm.line2} onChange={e=>setAddrForm(f=>({...f,line2:e.target.value}))} />
              <input className="input input-bordered input-sm" placeholder="City" value={addrForm.city} onChange={e=>setAddrForm(f=>({...f,city:e.target.value}))} />
              <input className="input input-bordered input-sm" placeholder="State" value={addrForm.state} onChange={e=>setAddrForm(f=>({...f,state:e.target.value}))} />
              <input className="input input-bordered input-sm" placeholder="ZIP" value={addrForm.zip} onChange={e=>setAddrForm(f=>({...f,zip:e.target.value}))} />
              <input className="input input-bordered input-sm" placeholder="Phone" value={addrForm.phone} onChange={e=>setAddrForm(f=>({...f,phone:e.target.value}))} />
              <input className="input input-bordered input-sm col-span-2" placeholder="Landmark (optional)" value={addrForm.landmark} onChange={e=>setAddrForm(f=>({...f,landmark:e.target.value}))} />
              <select className="select select-bordered select-sm col-span-2" value={addrForm.tag} onChange={e=>setAddrForm(f=>({...f,tag:e.target.value}))}>
                {['Home','Work','Other'].map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-[11px] opacity-70">Google location (optional)</span>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-xs btn-outline" onClick={()=>{
                      if (!('geolocation' in navigator)) { pushToast('Geolocation not supported','error'); return }
                      navigator.geolocation.getCurrentPosition(pos=>{
                        setAddrForm(f=>({...f,lat:pos.coords.latitude,lng:pos.coords.longitude}))
                        pushToast('Location captured','success')
                      },()=>pushToast('Location failed','error'))
                    }}>Use current</button>
                    <button type="button" className="btn btn-xs" onClick={()=>{
                      if (!addrForm.mapUrl) { pushToast('Paste a Google Maps URL first','info'); return }
                      const r=/@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(addrForm.mapUrl)
                      if(r){ setAddrForm(f=>({...f,lat:parseFloat(r[1]),lng:parseFloat(r[2])})); pushToast('Parsed coordinates','success') } else { pushToast('Could not parse URL','error') }
                    }}>Parse link</button>
                  </div>
                </div>
                <input className="input input-bordered input-sm col-span-2" placeholder="Google Maps URL" value={addrForm.mapUrl} onChange={e=>setAddrForm(f=>({...f,mapUrl:e.target.value}))} />
                <input className="input input-bordered input-sm" placeholder="Latitude" value={addrForm.lat ?? ''} onChange={e=>setAddrForm(f=>({...f,lat:e.target.value?Number(e.target.value):null}))} />
                <input className="input input-bordered input-sm" placeholder="Longitude" value={addrForm.lng ?? ''} onChange={e=>setAddrForm(f=>({...f,lng:e.target.value?Number(e.target.value):null}))} />
                {(addrForm.lat!==null && addrForm.lng!==null) && <div className="col-span-2 text-[11px] opacity-70">Preview: <a className="link" href={`https://www.google.com/maps?q=${addrForm.lat},${addrForm.lng}`} target="_blank" rel="noopener noreferrer">Open in Maps</a></div>}
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-sm" onClick={saveAddress} disabled={addrSaving}>{addrSaving?'Saving...':'Save'}</button>
              <button className="btn btn-sm btn-ghost" onClick={()=>setAddrModalOpen(false)} disabled={addrSaving}>Cancel</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={()=>!addrSaving && setAddrModalOpen(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  )
}
