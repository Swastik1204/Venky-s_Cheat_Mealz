// Centralized INR currency formatting utility for Venky's Admin

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const INR_FORMATTER_DECIMAL = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Format a number as Indian Rupees
 * @param {number} value - Amount to format
 * @param {boolean} withDecimals - Whether to show decimals (default: false)
 * @returns {string} Formatted currency string (e.g., "₹1,234" or "₹1,234.56")
 */
export function formatINR(value, withDecimals = false) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '₹0'
  return withDecimals ? INR_FORMATTER_DECIMAL.format(num) : INR_FORMATTER.format(num)
}

/**
 * Format a numeric value as a clean money string (no ₹ prefix).
 * Use when components prepend ₹ themselves, e.g. `₹{formatMoney(value)}`
 * @param {number} value
 * @returns {string} e.g. "120", "99.5", "0"
 */
export function formatMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return String(Math.round(num))
}

export { INR_FORMATTER, INR_FORMATTER_DECIMAL }
