// Data layer – barrel re-export
// Each domain module lives in its own file for maintainability.
// Import everything from './data' as before — the public API is unchanged.

// ── Common helpers & constants ──
export { BRAND_LONG, BRAND_SHORT, isCounterDocId, DEFAULT_SPOTLIGHT } from './data-common'

// ── Orders ──
export { createOrder, updateOrder, fetchOrder, fetchAllOrders, fetchRecentOrders, nextOrderStatus, fetchLatestUserOrder, fetchUserOrders, notifyStaffNewOrder } from './data-orders'

// ── Menu ──
export { fetchMenuCategories, upsertMenuCategory, appendMenuItems, addMenuItems, setMenuItems, removeMenuItem, renameMenuCategory } from './data-menu'

// ── Users ──
export { getUser, getUserTheme, setUserTheme, fetchUserProfile, updateUserProfile, addAddress, updateAddress, deleteAddress, fetchAddresses, setDefaultAddress } from './data-user'

// ── Images ──
export { saveBase64Image, fetchImagesByIds, fetchImagesByIdsCached, getImageDataUrl } from './data-images'

// ── Payments ──
export { fetchPublicConfig, getRazorpayKeyId, createRazorpayOrder, verifyRazorpayPayment } from './data-payments'

// ── Settings & appearance ──
export { fetchAppearanceSettings, saveCategoriesOrder, fetchStoreStatus, setStoreOpen, fetchAppSettings, saveAppSettings, fetchBusinessProfile, syncBusinessProfile } from './data-settings'

// ── Cart ──
export { loadCart, saveCart } from './data-cart'
