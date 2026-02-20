// Settings — Store settings, staff roles, and notifications
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { MdDelete, MdEdit, MdPersonAdd } from 'react-icons/md'

import AdminLayout from '../layouts/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchAppSettings, saveAppSettings, sendWhatsAppInvoice, fetchBusinessProfile, syncBusinessProfile, fetchStaff, addStaffMember, updateStaffMember, removeStaffMember } from '../lib/data'
import { fetchDeliverySettings, saveDeliverySettings } from '../lib/deliverySettings'
import { fetchStoreStatus, setStoreOpen } from '../lib/storeStatus'

export default function Settings() {
  const { pushToast } = useUI()
  const { user, isAdmin, refreshRole } = useAuth()

  // ── State ──
  const [appSettings, setAppSettings] = useState({ adminMobile: '', shopAddress: '', shopPhone: '', centerLat: '', centerLng: '', radiusKm: 8, locationLink: '', googlePlaceId: '' })
  const [cashManagerPhones, setCashManagerPhones] = useState([''])
  const [orderMessengerPhones, setOrderMessengerPhones] = useState([''])
  const [appSettingsLoading, setAppSettingsLoading] = useState(false)
  const [appSettingsSaving, setAppSettingsSaving] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [businessProfile, setBusinessProfile] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const addCashManagerPhoneField = () => setCashManagerPhones(prev => [...prev, ''])
  const removeCashManagerPhoneField = (index) => setCashManagerPhones(prev => prev.filter((_, i) => i !== index))
  const updateCashManagerPhoneField = (index, value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 10) {
      setCashManagerPhones(prev => prev.map((p, i) => i === index ? digits : p))
    }
  }

  const addPhoneField = () => {
    setOrderMessengerPhones(prev => [...prev, ''])
  }

  const removePhoneField = (index) => {
    setOrderMessengerPhones(prev => prev.filter((_, i) => i !== index))
  }

  const updatePhoneField = (index, value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 10) {
      setOrderMessengerPhones(prev => prev.map((p, i) => i === index ? digits : p))
    }
  }

  // ── Side-effects ──
  useEffect(() => {
    if (error) {
      pushToast(error, 'error')
      setError('')
    }
  }, [error, pushToast])

  useEffect(() => {
    if (info) {
      pushToast(info, 'success')
      setInfo('')
    }
  }, [info, pushToast])

  const STAFF_PAGE_DEFS = [
    { key: 'orders', label: 'Orders' },
    { key: 'biller', label: 'Biller (POS)' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'stock', label: 'Stock' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'settings', label: 'Settings' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'logs', label: 'Logs' },
  ]

  const defaultPagesForRole = (role) => {
    if (role === 'delivery') return { delivery: true }
    if (role === 'staff') return { orders: true, biller: true, inventory: true, stock: true, analytics: true }
    return null
  }

  // Staff management state
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffModal, setStaffModal] = useState({ open: false, mode: 'add', email: '', name: '', role: 'staff', pages: defaultPagesForRole('staff'), defaultPage: '', saving: false })

  // Messaging test state
  const [testPhone, setTestPhone] = useState('')
  const [testSending, setTestSending] = useState({ wa: false })
  const [tplName, setTplName] = useState('hello_world')
  const [tplLang, setTplLang] = useState('en_US')
  const [tplBodyText, setTplBodyText] = useState('')
  const [waDebug, setWaDebug] = useState(null)
  const [liveEnabled, setLiveEnabled] = useState(true)
  const [liveDefault, setLiveDefault] = useState(true)
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState(false)

  // Load staff
  useEffect(() => {
    let active = true
    setStaffLoading(true)
    fetchStaff().then((list) => {
      if (active) setStaff(list)
    }).finally(() => active && setStaffLoading(false))
    return () => { active = false }
  }, [])

  // Initial load
  useEffect(() => {
    let active = true
    setAppSettingsLoading(true)
    Promise.allSettled([
      fetchAppSettings(),
      fetchStoreStatus(),
      fetchDeliverySettings(),
      fetchBusinessProfile(),
    ]).then((results)=>{
      const [settingsRes, statusRes, deliveryRes, profileRes] = results
      if (!active) return
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        setAppSettings((prev) => ({ ...prev, ...settingsRes.value }))

        const cmList = Array.isArray(settingsRes.value.cashManagerPhones) ? settingsRes.value.cashManagerPhones : []
        const cmDisplay = cmList
          .map(p => {
            const digits = String(p || '').replace(/\D/g, '')
            return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
          })
          .filter(Boolean)
        if (cmDisplay.length > 0) {
          setCashManagerPhones(cmDisplay)
        } else {
          setCashManagerPhones([''])
        }

        const list = Array.isArray(settingsRes.value.orderMessengerPhones) ? settingsRes.value.orderMessengerPhones : []
        const display = list.map(p => {
          const digits = String(p || '').replace(/\D/g, '')
          return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
        }).filter(Boolean)
        setOrderMessengerPhones(display.length > 0 ? display : [''])
      }
      if (deliveryRes.status === 'fulfilled' && deliveryRes.value) {
        const d = deliveryRes.value
        setAppSettings((prev) => ({
          ...prev,
          centerLat: d.centerLat ?? prev.centerLat,
          centerLng: d.centerLng ?? prev.centerLng,
          radiusKm: d.radiusKm ?? prev.radiusKm,
        }))
      }
      if (statusRes.status === 'fulfilled' && statusRes.value) {
        const open = statusRes.value.open !== false
        setLiveEnabled(open)
        setLiveDefault(open)
      }
      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setBusinessProfile(profileRes.value)
      }
    }).finally(()=> active && setAppSettingsLoading(false))
    return () => { active = false }
  }, [])

  const liveStatusDirty = liveEnabled !== liveDefault

  // ── Render ──
  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-extrabold tracking-tight" style={{lineHeight:'1.1', color:'var(--color-base-content)'}}>
          Settings
        </h2>
      </div>


      <div className="rounded-2xl border border-base-300/60 bg-base-100/80 backdrop-blur p-5 shadow-sm max-w-3xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <p className="text-sm opacity-70">Live ordering status</p>
          <p className={`text-lg font-semibold ${liveEnabled ? 'text-success' : 'text-error'}`}>
            {liveEnabled ? 'Accepting orders' : 'Paused'}
          </p>
          {liveStatusDirty && <p className="text-xs opacity-70 mt-1">Click save to push the new status live.</p>}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-sm opacity-80 w-12 text-right">{liveEnabled ? 'Open' : 'Closed'}</span>
            <input type="checkbox" className="toggle toggle-primary" checked={liveEnabled} onChange={(e)=> setLiveEnabled(e.target.checked)} />
          </label>
          <button
            className="btn btn-primary btn-sm"
            disabled={updatingStoreStatus || (!liveStatusDirty && !updatingStoreStatus)}
            onClick={async ()=>{
              setUpdatingStoreStatus(true)
              try {
                await setStoreOpen(liveEnabled)
                setLiveDefault(liveEnabled)
                setInfo(liveEnabled ? 'Store marked open for live orders' : 'Store paused for new orders')
              } catch (e) {
                setError(e.message || 'Failed to update store status')
              } finally {
                setUpdatingStoreStatus(false)
              }
            }}
          >{updatingStoreStatus ? 'Saving…' : 'Save status'}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-base-300/60 bg-base-100/80 backdrop-blur p-5 shadow-sm max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">Store details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm border-0">
            <tbody>
              <tr>
                <td className="font-medium">Shop phone</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="btn btn-ghost opacity-70">☎</span>
                    <input type="tel" className="input input-bordered validator tabular-nums" required placeholder="10-digit mobile" 
                      pattern="[0-9]{10}" minLength={10} maxLength={10} title="Must be 10 digits" value={appSettings.shopPhone} onChange={(e)=> setAppSettings(s => ({ ...s, shopPhone: e.target.value.replace(/\D/g, '') }))} />
                    <p className="validator-hint">Must be 10 digits</p>
                    <span className="text-xs opacity-60 ml-2">Shown on WhatsApp e-bill.</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Cash Manager Phone</td>
                <td>
                  <div className="space-y-2">
                    {cashManagerPhones.map((phone, idx) => {
                      const isValid = phone.length === 10
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="tel"
                            className={`input input-bordered w-48 tabular-nums ${!isValid && phone.length > 0 ? 'input-error' : ''}`}
                            placeholder="10-digit number"
                            value={phone}
                            onChange={(e) => updateCashManagerPhoneField(idx, e.target.value)}
                            pattern="[0-9]{10}"
                            maxLength={10}
                            title="Must be exactly 10 digits"
                          />
                          {!isValid && phone.length > 0 && (
                            <span className="text-xs text-error">10 digits required</span>
                          )}
                          {cashManagerPhones.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              onClick={() => removeCashManagerPhoneField(idx)}
                              title="Remove this number"
                            >
                              −
                            </button>
                          )}
                          {idx === cashManagerPhones.length - 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-circle text-success"
                              onClick={addCashManagerPhoneField}
                              title="Add another number"
                            >
                              +
                            </button>
                          )}
                        </div>
                      )
                    })}
                    <div className="text-xs opacity-60">Receives dine-in COD OTP. The same OTP is sent to all numbers above.</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Order messenger (WhatsApp)</td>
                <td>
                  <div className="space-y-2">
                    {orderMessengerPhones.map((phone, idx) => {
                      const isValid = phone.length === 10
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="tel"
                            className={`input input-bordered w-48 tabular-nums ${!isValid && phone.length > 0 ? 'input-error' : ''}`}
                            placeholder="10-digit number"
                            value={phone}
                            onChange={(e) => updatePhoneField(idx, e.target.value)}
                            pattern="[0-9]{10}"
                            maxLength={10}
                            title="Must be exactly 10 digits"
                          />
                          {!isValid && phone.length > 0 && (
                            <span className="text-xs text-error">10 digits required</span>
                          )}
                          {orderMessengerPhones.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              onClick={() => removePhoneField(idx)}
                              title="Remove this number"
                            >
                              −
                            </button>
                          )}
                          {idx === orderMessengerPhones.length - 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-circle text-success"
                              onClick={addPhoneField}
                              title="Add another number"
                            >
                              +
                            </button>
                          )}
                        </div>
                      )
                    })}
                    <div className="text-xs opacity-60">
                      These numbers will be notified when a new <span className="font-medium">online</span> order is received.
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Shop address</td>
                <td>
                  <textarea className="textarea textarea-bordered min-h-24 w-full" value={appSettings.shopAddress} onChange={(e)=> setAppSettings(s => ({ ...s, shopAddress: e.target.value }))} placeholder="Street, Area, City - PIN"></textarea>
                </td>
              </tr>

              <tr>
                <td className="font-medium">Google Maps location link</td>
                <td>
                  <div className="flex items-center gap-2">
                    <input
                      className="input input-bordered w-full"
                      placeholder="Paste Google Maps location link here"
                      value={appSettings.locationLink || ''}
                      onChange={e => setAppSettings(s => ({ ...s, locationLink: e.target.value }))}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      type="button"
                      onClick={() => {
                        const link = appSettings.locationLink || ''
                        // Try to extract lat/lng from the link
                        const match = link.match(/@([\d.]+),([\d.]+)/)
                        if (match) {
                          setAppSettings(s => ({ ...s, centerLat: match[1], centerLng: match[2], locationLink: link }))
                          setInfo('Location coordinates updated from link')
                        } else {
                          setError('Could not extract coordinates from the link')
                        }
                      }}
                    >Update</button>
                  </div>
                  <div className="text-xs opacity-60 mt-1">Paste a Google Maps link (e.g. https://maps.google.com/...@lat,long...) and click Update.</div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Store location (Latitude)</td>
                <td>
                  <input
                    className="input input-bordered w-48"
                    inputMode="decimal"
                    placeholder="Latitude"
                    value={appSettings.centerLat}
                    readOnly
                  />
                </td>
              </tr>
              <tr>
                <td className="font-medium">Store location (Longitude)</td>
                <td>
                  <input
                    className="input input-bordered w-48"
                    inputMode="decimal"
                    placeholder="Longitude"
                    value={appSettings.centerLng}
                    readOnly
                  />
                </td>
              </tr>
              <tr>
                <td className="font-medium">Delivery radius (km)</td>
                <td>
                  <div className="flex items-center gap-2">
                    <input
                      className="input input-bordered input-sm w-24"
                      inputMode="decimal"
                      placeholder="8"
                      value={appSettings.radiusKm}
                      onChange={(e)=> setAppSettings(s => ({ ...s, radiusKm: e.target.value }))}
                      min="0"
                    />
                    <span className="btn btn-ghost btn-sm">km</span>
                    {(!appSettings.centerLat || !appSettings.centerLng) && (
                      <span className="text-xs text-warning ml-2">Paste a valid Google Maps link and click Update to set coordinates.</span>
                    )}
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">Note: An extra 2 km shadow range is automatically added.</div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Google Place ID</td>
                <td>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      className="input input-bordered w-64"
                      placeholder="ChIJ..."
                      value={appSettings.googlePlaceId || ''}
                      onChange={e => setAppSettings(s => ({ ...s, googlePlaceId: e.target.value }))}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      type="button"
                      disabled={syncing || !appSettings.googlePlaceId}
                      onClick={async () => {
                        setSyncing(true)
                        try {
                          const result = await syncBusinessProfile(appSettings.googlePlaceId)
                          setBusinessProfile(result.data)
                          setInfo('Business profile synced successfully from Google!')
                        } catch (e) {
                          setError(e.message || 'Failed to sync business profile')
                        } finally {
                          setSyncing(false)
                        }
                      }}
                    >{syncing ? 'Syncing…' : 'Sync Now'}</button>
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    Find your Place ID at{' '}
                    <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="link link-primary">
                      Google Place ID Finder
                    </a>. Used for auto-updating contact info and hours.
                  </div>
                  {businessProfile && (
                    <div className="mt-2 p-2 rounded bg-base-200/50 text-xs">
                      <div className="font-medium mb-1">Last synced: {businessProfile.lastSynced ? new Date(businessProfile.lastSynced).toLocaleString() : 'Never'}</div>
                      {businessProfile.name && <div>Name: {businessProfile.name}</div>}
                      {businessProfile.phone && <div>Phone: {businessProfile.phone}</div>}
                      {businessProfile.address && <div>Address: {businessProfile.address}</div>}
                      {businessProfile.rating && <div>Rating: {businessProfile.rating} ({businessProfile.reviewCount} reviews)</div>}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button className="btn btn-primary" disabled={appSettingsSaving} onClick={async ()=>{
            setAppSettingsSaving(true)
            try {
              const validatePhoneList = (list, label) => {
                const digitsOnly = (Array.isArray(list) ? list : [])
                  .map((p) => String(p || '').replace(/\D/g, ''))
                  .filter(Boolean)
                const invalid = digitsOnly.filter((d) => d.length !== 10)
                if (invalid.length) {
                  throw new Error(`${label} must be exactly 10 digits (do not include 91).`)
                }
                return digitsOnly
              }

              const validPhones = validatePhoneList(orderMessengerPhones, 'Order messenger numbers')
              const validCashManagers = validatePhoneList(cashManagerPhones, 'Cash manager numbers')
              await saveAppSettings({
                shopAddress: appSettings.shopAddress,
                shopPhone: appSettings.shopPhone,
                cashManagerPhones: validCashManagers,

                locationLink: appSettings.locationLink || '',
                googlePlaceId: appSettings.googlePlaceId || '',
                orderMessengerPhones: validPhones,
              })
              const lat = Number(appSettings.centerLat)
              const lng = Number(appSettings.centerLng)
              const radius = Number(appSettings.radiusKm)
              if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius)) {
                await saveDeliverySettings({ centerLat: lat, centerLng: lng, radiusKm: radius })
              }
              setInfo('Settings saved')
            } catch (e) {
              setError(e.message || 'Failed to save settings')
            } finally { setAppSettingsSaving(false) }
          }}>{appSettingsSaving ? 'Saving…' : 'Save changes'}</button>
          <button className="btn btn-ghost" disabled={appSettingsLoading} onClick={async ()=>{
            setAppSettingsLoading(true)
            try {
              const [settings, delivery] = await Promise.all([
                fetchAppSettings(),
                fetchDeliverySettings(),
              ])
              setAppSettings((prev) => ({
                ...prev,
                ...settings,
                ...(delivery ? {
                  centerLat: delivery.centerLat ?? prev.centerLat,
                  centerLng: delivery.centerLng ?? prev.centerLng,
                  radiusKm: delivery.radiusKm ?? prev.radiusKm,
                } : {}),
              }))

              const cmList = Array.isArray(settings?.cashManagerPhones) ? settings.cashManagerPhones : []
              const cmDisplay = cmList.map(p => {
                const digits = String(p || '').replace(/\D/g, '')
                return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
              }).filter(Boolean)
              if (cmDisplay.length > 0) {
                setCashManagerPhones(cmDisplay)
              } else {
                setCashManagerPhones([''])
              }

              const list = Array.isArray(settings?.orderMessengerPhones) ? settings.orderMessengerPhones : []
              const display = list.map(p => {
                const digits = String(p || '').replace(/\D/g, '')
                return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
              }).filter(Boolean)
              setOrderMessengerPhones(display.length > 0 ? display : [''])
            } catch { /* noop */ } finally { setAppSettingsLoading(false) }
          }}>{appSettingsLoading ? 'Loading…' : 'Reload'}</button>
        </div>

        {/* Messaging test panel */}
        <div className="mt-8 rounded-xl border border-base-300/60 bg-base-100/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Messaging test</h3>
            <div className="text-[10px] opacity-70">
              <span className="text-success">WA Service Active</span>
            </div>
          </div>
          <p className="text-xs opacity-70 mb-3">Send a template test message to verify your WhatsApp Business API is configured correctly.</p>
          <div className="overflow-x-auto">
            <table className="table table-sm border-0">
              <tbody>
                <tr>
                  <td className="font-medium">Recipient mobile (+91)</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="btn btn-ghost">+91</span>
                      <input type="tel" className="input input-bordered validator tabular-nums" required placeholder="10-digit number"
                        pattern="[0-9]{10}" minLength={10} maxLength={10} title="Must be 10 digits" value={testPhone} onChange={(e)=>setTestPhone(e.target.value.replace(/\D/g,''))} />
                      <p className="validator-hint">Must be 10 digits</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Template name</td>
                  <td>
                    <input className="input input-bordered w-48" value={tplName} onChange={(e)=>setTplName(e.target.value)} placeholder="hello_world or your template" />
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Language</td>
                  <td>
                    <input className="input input-bordered w-48" value={tplLang} onChange={(e)=>setTplLang(e.target.value)} placeholder="en_US" />
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Body text param</td>
                  <td>
                    <input className="input input-bordered w-48" value={tplBodyText} onChange={(e)=>setTplBodyText(e.target.value)} placeholder="Optional (depends on template)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              className="btn btn-primary btn-sm"
              disabled={testSending.wa}
              onClick={async ()=>{
                const phone = (testPhone||'').trim()
                if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit Indian mobile'); return }
                setTestSending(s => ({ ...s, wa: true }))
                try {
                  const components = (tplBodyText || '').trim() ? [ { type: 'body', parameters: [ { type: 'text', text: tplBodyText.trim() } ] } ] : []
                  const payload = {
                    templateName: (tplName || 'hello_world').trim(),
                    templateLanguage: (tplLang || 'en_US').trim(),
                    ...(components.length ? { components } : {})
                  }
                  const res = await sendWhatsAppInvoice(`91${phone}`, payload)
                  if (res && res.__error) {
                    const detail = res.data?.error?.message || res.message || ''
                    setWaDebug(res)
                    throw new Error(`WhatsApp error (${res.__error}${res.status? ':'+res.status:''}) ${detail ? '- '+detail : ''}`)
                  }
                  if (res && res.__skipped) pushToast('WA test skipped (endpoint not configured)', 'warning')
                  else {
                    const id = res?.data?.messages?.[0]?.id || res?.messages?.[0]?.id
                    pushToast(id ? `WhatsApp accepted (wamid: ${id})` : 'WhatsApp test sent', 'success')
                    setWaDebug(res)
                  }
                } catch (e) {
                  pushToast(e.message || 'WhatsApp test failed', 'error')
                  if (!waDebug) setWaDebug({ error: String(e && e.message || e) })
                } finally { setTestSending(s => ({ ...s, wa: false })) }
              }}
            >{testSending.wa ? 'Sending…' : 'Send WhatsApp test'}</button>
          </div>
          {waDebug && (
            <div className="mt-3">
              <details className="rounded border border-base-300/60 bg-base-100/70 p-3">
                <summary className="cursor-pointer text-xs opacity-70">Debug: last WhatsApp response</summary>
                <pre className="mt-2 text-xs overflow-x-auto">
                  {(() => {
                    try { return JSON.stringify(waDebug, null, 2) } catch { return String(waDebug) }
                  })()}
                </pre>
              </details>
            </div>
          )}
      </div>

      {/* Staff Management Section */}
      <div className="rounded-2xl border border-base-300/60 bg-base-100/80 backdrop-blur p-5 shadow-sm max-w-3xl mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">Staff Management</h3>
          <button 
            className="btn btn-primary btn-sm gap-1"
            onClick={() => setStaffModal({ open: true, mode: 'add', email: '', name: '', role: 'staff', pages: defaultPagesForRole('staff'), defaultPage: '', saving: false })}
            disabled={!isAdmin}
            title={!isAdmin ? 'Only admins can manage staff' : 'Add new staff member'}
          >
            <MdPersonAdd className="w-4 h-4" /> Add Staff
          </button>
        </div>
        
        {!isAdmin && (
          <div className="alert alert-warning mb-4 py-2">
            <span className="text-sm">Only admins can manage staff members. Contact an admin if you need changes.</span>
          </div>
        )}

        {staffLoading ? (
          <div className="flex justify-center py-6"><span className="loading loading-spinner loading-md" /></div>
        ) : staff.length === 0 ? (
          <div className="text-center py-6 opacity-60">
            <p>No staff members yet.</p>
            <p className="text-sm mt-1">Add your first staff member to enable role-based access.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.email}>
                    <td className="font-mono text-xs">{s.email}</td>
                    <td>{s.name || '-'}</td>
                    <td>
                      <span className={`badge badge-sm ${s.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setStaffModal({ open: true, mode: 'edit', email: s.email, name: s.name || '', role: s.role, pages: s.pages || defaultPagesForRole(s.role), defaultPage: s.defaultPage || '', saving: false })}
                          disabled={!isAdmin}
                          title="Edit"
                        >
                          <MdEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={async () => {
                            if (!confirm(`Remove ${s.email} from staff?`)) return
                            try {
                              await removeStaffMember(s.email, user?.email)
                              setStaff((prev) => prev.filter((x) => x.email !== s.email))
                              pushToast('Staff member removed', 'success')
                              if (s.email === user?.email) refreshRole()
                            } catch (e) {
                              pushToast(e.message || 'Failed to remove', 'error')
                            }
                          }}
                          disabled={!isAdmin || s.email === user?.email}
                          title={s.email === user?.email ? "Can't remove yourself" : 'Remove'}
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Modal */}
      {staffModal.open && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setStaffModal({ open: false, mode: 'add', email: '', name: '', role: 'staff', pages: defaultPagesForRole('staff'), defaultPage: '', saving: false })
            }
          }}
        >
          <div 
            className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold">
                  {staffModal.mode === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}
                </h3>
                <p className="text-xs opacity-70">
                  {staffModal.mode === 'add' ? 'Grant staff access to the admin panel' : 'Update staff member details'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label"><span className="label-text">Email</span></label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    placeholder="staff@example.com"
                    value={staffModal.email}
                    onChange={(e) => setStaffModal((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={staffModal.mode === 'edit'}
                    minLength={3}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="label"><span className="label-text">Name (optional)</span></label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="John Doe"
                    value={staffModal.name}
                    onChange={(e) => setStaffModal((prev) => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="label"><span className="label-text">Role</span></label>
                  <select
                    className="select select-bordered w-full"
                    value={staffModal.role}
                    onChange={(e) => {
                      const nextRole = e.target.value
                      setStaffModal((prev) => ({
                        ...prev,
                        role: nextRole,
                        pages: nextRole === 'admin' ? null : (defaultPagesForRole(nextRole) || {}),
                        defaultPage: '',
                      }))
                    }}
                  >
                    <option value="staff">Staff (Custom pages)</option>
                    <option value="admin">Admin (Full Access)</option>
                    <option value="delivery">Delivery (Delivery page only)</option>
                  </select>
                  <div className="text-xs opacity-60 mt-1">
                    {staffModal.role === 'admin'
                      ? 'Admins have full access to all pages including staff management and settings.'
                      : staffModal.role === 'delivery'
                        ? 'Delivery role can only access the Delivery page.'
                        : 'Staff access is controlled per page below.'}
                  </div>
                </div>

                {staffModal.role === 'staff' && (
                  <div>
                    <label className="label"><span className="label-text">Page access</span></label>
                    <div className="rounded-xl border border-base-300/60 bg-base-100/70 p-3">
                      <div className="text-xs opacity-70 mb-2">Choose Allow/Deny for each page.</div>
                      <div className="space-y-2">
                        {STAFF_PAGE_DEFS.map((p) => {
                          const allowed = !!(staffModal.pages && staffModal.pages[p.key])
                          return (
                            <div key={p.key} className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium">{p.label}</div>
                              <div className="join">
                                <input
                                  type="radio"
                                  name={`page-${p.key}`}
                                  className="btn btn-xs join-item"
                                  aria-label="Allow"
                                  checked={allowed}
                                  onChange={() => setStaffModal(prev => ({
                                    ...prev,
                                    pages: { ...(prev.pages || {}), [p.key]: true }
                                  }))}
                                />
                                <input
                                  type="radio"
                                  name={`page-${p.key}`}
                                  className="btn btn-xs join-item"
                                  aria-label="Deny"
                                  checked={!allowed}
                                  onChange={() => setStaffModal(prev => ({
                                    ...prev,
                                    pages: { ...(prev.pages || {}), [p.key]: false }
                                  }))}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Default Landing Page */}
                {staffModal.role !== 'admin' && (
                  <div>
                    <label className="label"><span className="label-text">Default Landing Page</span></label>
                    <select
                      className="select select-bordered w-full"
                      value={staffModal.defaultPage || ''}
                      onChange={(e) => setStaffModal(prev => ({ ...prev, defaultPage: e.target.value }))}
                    >
                      <option value="">Auto (first allowed page)</option>
                      {STAFF_PAGE_DEFS.filter(p => staffModal.role === 'delivery' ? p.key === 'delivery' : (staffModal.pages && staffModal.pages[p.key])).map(p => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                    <div className="text-xs opacity-60 mt-1">
                      Page shown when this user opens the admin app
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action p-4 pt-0">
              <button
                className="btn btn-ghost"
                onClick={() => setStaffModal({ open: false, mode: 'add', email: '', name: '', role: 'staff', pages: defaultPagesForRole('staff'), defaultPage: '', saving: false })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={staffModal.saving || !staffModal.email.trim()}
                onClick={async () => {
                  setStaffModal((prev) => ({ ...prev, saving: true }))
                  try {
                    const defaultPageVal = staffModal.role === 'admin' ? null : (staffModal.defaultPage || null)
                    if (staffModal.mode === 'add') {
                      await addStaffMember(staffModal.email, staffModal.role, staffModal.name, user?.email, staffModal.role === 'admin' ? null : (staffModal.pages || defaultPagesForRole(staffModal.role) || {}), defaultPageVal)
                      setStaff((prev) => [...prev, { email: staffModal.email.toLowerCase().trim(), role: staffModal.role, name: staffModal.name, pages: staffModal.role === 'admin' ? null : (staffModal.pages || defaultPagesForRole(staffModal.role) || {}), defaultPage: defaultPageVal }])
                      pushToast('Staff member added', 'success')
                    } else {
                      const updates = {
                        role: staffModal.role,
                        name: staffModal.name,
                        ...(staffModal.role === 'admin' ? {} : { pages: staffModal.pages || defaultPagesForRole(staffModal.role) || {}, defaultPage: defaultPageVal })
                      }
                      await updateStaffMember(staffModal.email, updates, user?.email)
                      setStaff((prev) => prev.map((s) => s.email === staffModal.email ? { ...s, ...updates } : s))
                      pushToast('Staff member updated', 'success')
                    }
                    if (staffModal.email.toLowerCase().trim() === user?.email?.toLowerCase()) refreshRole()
                    setStaffModal({ open: false, mode: 'add', email: '', name: '', role: 'staff', pages: defaultPagesForRole('staff'), defaultPage: '', saving: false })
                  } catch (e) {
                    pushToast(e.message || 'Failed to save', 'error')
                    setStaffModal((prev) => ({ ...prev, saving: false }))
                  }
                }}
              >
                {staffModal.saving ? 'Saving…' : staffModal.mode === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  </AdminLayout>
)
}
