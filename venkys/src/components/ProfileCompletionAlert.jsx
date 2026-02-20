// ProfileCompletionAlert — Banner prompting users to complete their profile
import { useMemo } from 'react'
import { MdCheckCircle, MdEdit, MdPerson, MdPhone, MdHome } from 'react-icons/md'

// Computes a simple profile completion percentage based on name, phone, and any address
function computeCompletion(user, profileForm, addrState) {
  if (!user) return 0;
  // Lenient check: ensure not just whitespace
  const nameOk = !!(profileForm?.displayName || '').trim();
  // Phone check: allow some flexibility but checking for 10 digits is good
  const phoneOk = /\d{10}/.test((profileForm?.phone || '').replace(/\D/g, ''));
  // Address check: must have at least one address
  const hasAnyAddr = Array.isArray(addrState?.list) && addrState.list.length > 0;
  
  const checks = [nameOk, phoneOk, hasAnyAddr];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return Math.max(0, Math.min(100, pct));
}

function getMissing(user, profileForm, addrState) {
  if (!user) return []
  const missing = []
  const nameOk = !!(profileForm?.displayName || '').trim()
  const phoneOk = /\d{10}/.test((profileForm?.phone || '').replace(/\D/g, ''))
  const hasAnyAddr = Array.isArray(addrState?.list) && addrState.list.length > 0
  
  if (!nameOk) missing.push('Name')
  if (!phoneOk) missing.push('Phone')
  if (!hasAnyAddr) missing.push('Address')
  return missing
}

/**
 * ProfileCompletionAlert
 * Enhances user profile completion with a modern, clean UI
 */
export default function ProfileCompletionAlert({ user, profileForm, addrState, onEdit, className = '', showButton = true }) {
  const completion = useMemo(() => computeCompletion(user, profileForm, addrState), [user, profileForm, addrState]);
  const missing = useMemo(() => getMissing(user, profileForm, addrState), [user, profileForm, addrState])
  
  if (!user || completion === 100) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-primary/10 shadow-lg bg-base-100 ${className}`}>
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>
      
      <div className="relative p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
              <span className="text-primary">Complete Profile</span>
              <span className={`badge ${completion > 60 ? 'badge-success' : 'badge-warning'} badge-sm font-medium`}>
                {completion}% Done
              </span>
            </h3>
            <p className="text-sm text-base-content/70 mt-1 leading-relaxed">
              Finish setting up your {missing.length ? <span className="font-semibold text-base-content">{missing.join(', ')}</span> : 'details'} for a smoother checkout experience.
            </p>
          </div>
          {showButton && (
            <button
              onClick={onEdit}
              className="btn btn-primary btn-sm rounded-full gap-2 shadow-md hover:shadow-lg transition-all shrink-0"
            >
              <MdEdit className="w-4 h-4" />
              <span className="hidden sm:inline">Update</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-base-content/50 uppercase tracking-wide">
            <span>Progress</span>
            <span>{3 - missing.length}/3 steps</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-base-200 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                completion < 40 ? 'bg-error' : completion < 80 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-3 gap-2">
          {['Name', 'Phone', 'Address'].map((step) => {
            const isDone = !missing.includes(step)
            const icons = { Name: MdPerson, Phone: MdPhone, Address: MdHome }
            const Icon = icons[step]
            
            return (
              <div 
                key={step} 
                className={`
                  flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 
                  p-2 rounded-xl text-xs font-medium border text-center sm:text-left transition-colors
                  ${isDone 
                    ? 'border-success/20 bg-success/5 text-success' 
                    : 'border-base-300 bg-base-200/50 text-base-content/50 dashed-border'
                  }
                `}
              >
                <div className={`p-1 rounded-full ${isDone ? 'bg-success text-white' : 'bg-base-300 text-base-content/50'}`}>
                  {isDone ? <MdCheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                </div>
                <span>{step}</span>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Dashed border utility style */}
      <style>{`
        .dashed-border { border-style: dashed; }
      `}</style>
    </div>
  );
}
