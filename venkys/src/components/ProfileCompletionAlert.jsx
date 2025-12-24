import { useMemo } from 'react'

// Computes a simple profile completion percentage based on name, phone, and any address
function computeCompletion(user, profileForm, addrState) {
  if (!user) return 0;
  const nameOk = !!(profileForm?.displayName || '').trim();
  const phoneOk = /\d{10}/.test((profileForm?.phone || '').replace(/\D/g, ''));
  const hasAnyAddr = Array.isArray(addrState?.list) && addrState.list.length > 0;
  const checks = [nameOk, phoneOk, hasAnyAddr];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * ProfileCompletionAlert
 * Props:
 *  - user: Firebase user
 *  - profileForm: { displayName, phone, ... }
 *  - addrState: { list, defaultId }
 *  - onEdit: () => void
 *  - className?: string
 *  - showButton?: boolean (default true)
 */
export default function ProfileCompletionAlert({ user, profileForm, addrState, onEdit, className = '', showButton = true }) {
  const completion = useMemo(() => computeCompletion(user, profileForm, addrState), [user, profileForm, addrState]);
  if (!user || completion === 100) return null;

  return (
    <div className={`alert alert-warning shadow-sm border border-base-300/30 ${className}`}>
      <div className="flex-1">
        <span className="font-medium">Complete your profile</span>
        <span className="ml-2 text-sm opacity-80">You're at {completion}% — finish your details for a smoother checkout.</span>
      </div>
      {showButton && (
        <button
          className="btn btn-sm bg-white text-base-content border border-base-300 hover:bg-white/90 animate-pulse"
          onClick={onEdit}
        >
          Complete now
        </button>
      )}
    </div>
  );
}
