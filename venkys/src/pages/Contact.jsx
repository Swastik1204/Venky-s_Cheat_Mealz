// Contact — Contact information and inquiry form
import { useState, useEffect } from 'react'

import { FaGoogle } from 'react-icons/fa'
import { MdPhone, MdEmail, MdLocationOn, MdAccessTime, MdSend, MdStar, MdRefresh } from 'react-icons/md'

import { fetchBusinessProfile, fetchAppSettings } from '../lib/data'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [profile, setProfile] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([fetchBusinessProfile(), fetchAppSettings()])
      .then(([bp, app]) => {
        if (!active) return
        setProfile(bp)
        setSettings(app)
      })
      .catch(err => console.error('Error fetching contact data:', err))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  // Use Google Business Profile data if available, fallback to app settings
  const rawPhone = profile?.phone || settings?.shopPhone || ''
  const hasPhone = rawPhone && rawPhone.trim().length > 0
  const phoneLink = rawPhone.replace(/\D/g, '')
  const phoneFormatted = hasPhone ? rawPhone.replace(/(\d{5})(\d{5})/, '$1 $2') : '-'
  
  const rawAddress = profile?.address || settings?.shopAddress || ''
  const hasAddress = rawAddress && rawAddress.trim().length > 0
  const address = hasAddress ? rawAddress : '-'
  
  const mapsUrl = profile?.mapsUrl || settings?.locationLink || ''
  const hasMapsUrl = mapsUrl && mapsUrl.trim().length > 0
  
  const businessHours = profile?.hoursRaw || []
  const isOpen = profile?.isOpen
  const rating = profile?.rating
  const reviewCount = profile?.reviewCount
  const lastSynced = profile?.lastSynced ? new Date(profile.lastSynced) : null

  const CONTACT_EMAIL = 'venkysdgp@gmail.com'

  const handleSubmit = (e) => {
    e.preventDefault()
    // Open the visitor's mail client with a pre-filled message
    const subject = `Website enquiry from ${formData.name}`
    const body = `Hi! I'm ${formData.name}.\n\nEmail: ${formData.email}\n\nMessage: ${formData.message}`
    window.open(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self')
    setSent(true)
  }

  return (
    <div className="page-wrap py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Get in Touch</h1>
          <p className="text-base-content/70 max-w-lg mx-auto">Have questions, feedback, or just want to say hi? We'd love to hear from you!</p>
          {rating && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="badge badge-warning gap-1">
                <MdStar className="w-4 h-4" /> {rating.toFixed(1)}
              </div>
              <span className="text-sm opacity-60">{reviewCount} reviews on Google</span>
            </div>
          )}
        </div>
        
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-lg border border-base-200">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title text-lg">Contact Information</h2>
                  {isOpen !== null && (
                    <span className={`badge ${isOpen ? 'badge-success' : 'badge-error'} gap-1`}>
                      {isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                </div>
                
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-4 p-3">
                        <div className="skeleton w-12 h-12 rounded-full"></div>
                        <div className="flex-1">
                          <div className="skeleton h-3 w-16 mb-2"></div>
                          <div className="skeleton h-4 w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hasPhone ? (
                      <a href={`tel:+91${phoneLink}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200/50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <MdPhone className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm opacity-60">Phone</div>
                          <div className="font-semibold">+91 {phoneFormatted}</div>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 p-3 rounded-xl opacity-50">
                        <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center">
                          <MdPhone className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm opacity-60">Phone</div>
                          <div className="font-semibold">-</div>
                        </div>
                      </div>
                    )}
                    
                    <a href="mailto:venkysdgp@gmail.com" className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MdEmail className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm opacity-60">Email</div>
                        <div className="font-semibold">venkysdgp@gmail.com</div>
                      </div>
                    </a>
                    
                    {hasAddress ? (
                      hasMapsUrl ? (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200/50 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <MdLocationOn className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-sm opacity-60">Location</div>
                            <div className="font-semibold">{address}</div>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-4 p-3 rounded-xl">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <MdLocationOn className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-sm opacity-60">Location</div>
                            <div className="font-semibold">{address}</div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-4 p-3 rounded-xl opacity-50">
                        <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center">
                          <MdLocationOn className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm opacity-60">Location</div>
                          <div className="font-semibold">-</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Business Hours */}
            <div className="card bg-base-100 shadow-lg border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-2">
                  <MdAccessTime className="w-5 h-5" /> Business Hours
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3,4,5,6,7].map(i => (
                      <div key={i} className="skeleton h-4 w-full"></div>
                    ))}
                  </div>
                ) : businessHours.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {businessHours.map((hour, idx) => {
                      const parts = hour.split(': ')
                      const day = parts[0]
                      const time = parts.slice(1).join(': ')
                      const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day
                      return (
                        <div key={idx} className={`flex justify-between ${isToday ? 'font-bold text-primary' : ''}`}>
                          <span>{day}</span>
                          <span className={isToday ? '' : 'font-semibold'}>{time}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Monday - Saturday</span><span className="font-semibold">10:00 AM - 10:00 PM</span></div>
                    <div className="flex justify-between"><span>Sunday</span><span className="font-semibold">11:00 AM - 9:00 PM</span></div>
                  </div>
                )}
                {lastSynced && (
                  <div className="flex items-center gap-1 mt-3 text-xs opacity-50">
                    <FaGoogle className="w-3 h-3" />
                    <span>Synced from Google Business · {lastSynced.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Send us a Message</h2>
              
              {sent ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                  <p className="opacity-70">We'll get back to you soon by email — or give us a call for anything urgent.</p>
                  <button className="btn btn-primary mt-4" onClick={() => setSent(false)}>Send Another</button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Your Name</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered w-full" 
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Email Address</span></label>
                    <input 
                      type="email" 
                      className="input input-bordered w-full" 
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Message</span></label>
                    <textarea 
                      className="textarea textarea-bordered w-full" 
                      rows={4} 
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-full gap-2">
                    <MdSend className="w-5 h-5" /> Send by Email
                  </button>
                  <p className="text-xs text-center opacity-60">Opens your email app with the message pre-filled. For urgent matters, call us directly.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
