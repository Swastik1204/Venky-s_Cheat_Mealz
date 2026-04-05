// ProfileCompletionAlert — Banner prompting users to complete their profile
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { MdEdit } from 'react-icons/md'

import { getProfileCompletion } from '../lib/data-user'

export default function ProfileCompletionAlert({ user, profileForm, addrState, onEdit, className = '', showButton = true }) {
  const location = useLocation()

  const profileInfo = useMemo(() => ({
    displayName: profileForm?.displayName || user?.displayName || '',
    phone: profileForm?.phone || user?.phoneNumber || '',
    email: profileForm?.email || user?.email || '',
    photoURL: user?.photoURL || '',
    addresses: Array.isArray(addrState?.list) ? addrState.list : [],
  }), [profileForm, user, addrState])

  const completion = useMemo(() => getProfileCompletion(profileInfo), [profileInfo])

  if (!user) return null
  if (location.pathname === '/profile') return null
  if (completion.percent >= 100) return null

  return (
    <div className={`rounded-2xl border border-primary/20 bg-base-100 shadow-sm ${className}`}>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Complete your profile</h3>
            <p className="text-sm opacity-70 mt-1">{completion.percent}% done</p>
          </div>
          {showButton && (
            <button onClick={onEdit} className="btn btn-primary btn-sm gap-1">
              <MdEdit className="w-4 h-4" />
              Update
            </button>
          )}
        </div>
        <progress className="progress progress-primary w-full" value={completion.percent} max="100" />
        <div className="flex flex-wrap gap-2">
          {completion.missing.map((item) => (
            <span key={item} className="badge badge-outline badge-sm">{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
