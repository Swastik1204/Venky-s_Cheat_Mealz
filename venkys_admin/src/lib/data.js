// Data layer – barrel re-export (admin)
// Each domain module lives in its own file for maintainability.
// Import everything from './data' as before — the public API is unchanged.

// ── Common helpers & constants ──
export { BRAND_LONG, BRAND_SHORT, isCounterDocId, apiUrl, getAuthHeaders, DEFAULT_SPOTLIGHT } from './data-common'

// ── Orders ──
export { generateDailyOrderNo, createOrder, updateOrder, fetchOrder, fetchAllOrders, fetchRecentOrders, nextOrderStatus, fetchLatestUserOrder, fetchUserOrders } from './data-orders'

// ── WhatsApp messaging ──
export { sendWhatsAppInvoice, sendOrderMessengerViaWhatsApp, sendOtpViaWhatsApp } from './data-whatsapp'

// ── Menu ──
export { fetchMenuCategories, upsertMenuCategory, appendMenuItems, addMenuItems, setMenuItems, removeMenuItem, renameMenuCategory, fetchMenuItems, fetchItems, addItem, upsertCategory, upsertMenuItem, migrateRemoveCategoryNameFields } from './data-menu'
// Legacy alias — the original export name for deleting from the old menuItems collection
export { deleteMenuItem_legacy as deleteMenuItem } from './data-menu'

// ── Users ──
export { GUEST_USER_ID, ensureGuestUser, getUser, updateUser, getUserTheme, setUserTheme, fetchUserProfile, updateUserProfile, addAddress, updateAddress, deleteAddress, fetchAddresses, setDefaultAddress, getAvatarUrl, getRandomOtp } from './data-user'

// ── Images ──
export { saveBase64Image, fetchImagesByIds, fetchImagesByIdsCached, getImageDataUrl, deleteImageById, removeCategoryImage } from './data-images'

// ── Payments ──
export { fetchPublicConfig, getRazorpayKeyId, createRazorpayOrder, verifyRazorpayPayment } from './data-payments'

// ── Settings & appearance ──
export { fetchAppearanceSettings, saveCategoriesOrder, saveAppearanceSpotlight, fetchAppSettings, saveAppSettings, fetchBusinessProfile, syncBusinessProfile } from './data-settings'

// ── Inventory ──
export { fetchRawMaterials, saveRawMaterial, deleteRawMaterial, updateRawMaterialStock, deductStockForOrder } from './data-inventory'

// ── Audit / Logging ──
export { sendLogEmail } from './auditLog'

// ── Staff ──
export { fetchStaff, getStaffMember, addStaffMember, updateStaffMember, removeStaffMember, normalizeRolePages, assertValidStaffRole } from './data-staff'

// ── Cart ──
export { saveCart } from './data-cart'
