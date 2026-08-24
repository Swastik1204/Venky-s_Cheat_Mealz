// FcmNotifications — headless: silent token refresh on login + foreground toasts
// Foreground FCM messages don't display as OS notifications, so they are
// surfaced through the app's toast system instead.
import { useEffect } from 'react'

import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { registerFcmToken, listenForegroundMessages, getNotificationPermission } from '../lib/fcm'

export default function FcmNotifications() {
  const { user } = useAuth()
  const { pushToast } = useUI()
  const navigate = useNavigate()

  // Silently refresh the token when a signed-in user already granted permission.
  // The initial permission prompt happens at order placement (user gesture).
  useEffect(() => {
    if (!user?.uid) return
    if (getNotificationPermission() !== 'granted') return
    registerFcmToken(user.uid)
  }, [user?.uid])

  // Foreground messages → in-app toast
  useEffect(() => {
    let unsub = () => {}
    let cancelled = false
    listenForegroundMessages((payload) => {
      const notification = payload?.notification || {}
      const data = payload?.data || {}
      const title = notification.title || 'Order update'
      const body = notification.body || ''
      pushToast(body ? `${title} — ${body}` : title, 'info', 8000)
      // Keep the active-orders view fresh if a deep link is present
      const orderNo = data.orderNo
      if (orderNo && window.location.pathname === '/active-orders') {
        navigate(`/active-orders?id=${encodeURIComponent(orderNo)}`, { replace: true })
      }
    }).then((fn) => {
      if (cancelled) fn()
      else unsub = fn
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [pushToast, navigate])

  return null
}
