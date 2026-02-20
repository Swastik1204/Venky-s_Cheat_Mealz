// Centralized INR currency formatting utility

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
 * Calculate discount percentage label
 * @param {number} originalPrice - Original price (MRP)
 * @param {number} currentRate - Current/selling rate
 * @returns {string|null} Discount percentage string (e.g., "20% OFF") or null if no discount
 */
export function getDiscountLabel(originalPrice, currentRate) {
  const mrp = Number(originalPrice)
  const rate = Number(currentRate)
  if (!Number.isFinite(mrp) || !Number.isFinite(rate) || mrp <= rate || mrp <= 0) {
    return null
  }
  const percent = Math.round(((mrp - rate) / mrp) * 100)
  return percent > 0 ? `${percent}% OFF` : null
}

// Re-export formatters for components that need direct access
export { INR_FORMATTER, INR_FORMATTER_DECIMAL }

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
