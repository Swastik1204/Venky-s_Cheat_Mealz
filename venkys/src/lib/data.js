// Data layer barrel — re-exports from domain modules.
// All existing `import { X } from '../lib/data'` continue to work.

// Common constants & helpers
export { BRAND_LONG, BRAND_SHORT, isCounterDocId, DEFAULT_SPOTLIGHT } from './data-common'

// Orders
export { generateDailyOrderNo, createOrder, updateOrder, fetchOrder, fetchAllOrders, fetchRecentOrders, nextOrderStatus, fetchLatestUserOrder, fetchUserOrders, sendWhatsAppInvoice } from './data-orders'

// Menu
export { fetchMenuCategories, upsertMenuCategory, appendMenuItems, addMenuItems, setMenuItems, removeMenuItem, renameMenuCategory } from './data-menu'

// User, profile & addresses
export { getUser, getUserTheme, setUserTheme, fetchUserProfile, updateUserProfile, addAddress, updateAddress, deleteAddress, fetchAddresses, setDefaultAddress } from './data-user'

// Images
export { saveBase64Image, fetchImagesByIds, fetchImagesByIdsCached, getImageDataUrl } from './data-images'

// Payments
export { fetchPublicConfig, getRazorpayKeyId, createRazorpayOrder, verifyRazorpayPayment } from './data-payments'

// Settings, appearance & business profile
export { fetchAppearanceSettings, saveCategoriesOrder, fetchStoreStatus, setStoreOpen, fetchAppSettings, saveAppSettings, fetchBusinessProfile, syncBusinessProfile } from './data-settings'

// Cart
export { loadCart, saveCart } from './data-cart'
