// useClickOutside — Hook to detect clicks outside a ref element
import { useEffect, useRef } from 'react'

/**
 * Custom hook to detect clicks outside of a referenced element
 * Also handles Escape key to close
 * 
 * @param {function} onClickOutside - Callback when clicking outside or pressing Escape
 * @param {boolean} isActive - Whether the hook should be active (default: true)
 * @returns {React.RefObject} - Ref to attach to the container element
 * 
 * @example
 * const panelRef = useClickOutside(() => setIsOpen(false), isOpen)
 * return isOpen && <div ref={panelRef}>...</div>
 */
export function useClickOutside(onClickOutside, isActive = true) {
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClickOutside?.()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClickOutside?.()
      }
    }

    // Small delay to prevent immediate close on mount
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 10)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isActive, onClickOutside])

  return ref
}

export default useClickOutside
