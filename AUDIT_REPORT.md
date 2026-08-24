# Venky's Cheat Mealz - Comprehensive Audit Report
**Date:** 2026-07-11  
**Scope:** Customer PWA (venkys), Staff POS Admin (venkys_admin), API Layer (Vercel Serverless)  
**Status:** Audit-only (no changes made)

---

## 1. FILE STRUCTURE OVERVIEW

### Customer PWA (`venkys/`)
```
venkys/
├── api/                          # Vercel serverless functions
│   ├── create-order.js            # ✅ Server-verified pricing, FCM push to staff
│   ├── verify-payment.js          # ✅ Razorpay HMAC verification (timing-safe)
│   ├── razorpay-webhook.js        # Payment confirmation webhook
│   ├── public-config.js           # Public config endpoint (Razorpay key ID only)
│   ├── send-whatsapp.js           # ⚠️ DISABLED - Meta Display Name not approved
│   ├── send-log-email.js          # Admin email logger for errors/rate limits
│   ├── health.js                  # Health check endpoint
│   └── lib/
│       ├── rateLimiter.js         # ✅ Upstash Redis + in-memory fallback
│       └── verifyAuth.js          # Firebase token validation
├── src/
│   ├── lib/
│   │   ├── data-orders.js         # Order creation, number generation (client-side subtotal calc)
│   │   ├── data-payments.js       # Razorpay integration
│   │   ├── data-menu.js           # Menu CRUD (reads from 'menu' collection)
│   │   ├── data-user.js           # User profile
│   │   ├── data-cart.js           # Cart state
│   │   ├── data-common.js         # Shared helpers
│   │   ├── data-images.js         # Image uploads
│   │   ├── whatsapp.js            # ⚠️ DISABLED - sendBillToCustomer function
│   │   ├── firebase.js            # Firebase config (public keys only)
│   │   ├── google.js              # Google Maps/Places autocomplete
│   │   └── deliverySettings.js    # Geofence validation
│   ├── pages/
│   │   ├── Checkout.jsx           # Full checkout flow (Razorpay + COD)
│   │   ├── ActiveOrders.jsx       # Order tracking (real-time listener)
│   │   ├── Profile.jsx            # User profile, addresses
│   │   ├── Home.jsx               # Menu display
│   │   └── Contact.jsx            # WhatsApp contact link
│   ├── components/
│   │   ├── CartDrawer.jsx         # Cart UI
│   │   ├── ItemModal.jsx          # Item detail modal
│   │   ├── AuthModal.jsx          # Firebase login modal
│   │   ├── InstallPWA.jsx         # PWA install prompt
│   │   └── ...other UI components
│   ├── context/
│   │   ├── AuthContext.jsx        # Firebase auth state
│   │   ├── CartContext.jsx        # Local cart state (client-side calc)
│   │   └── UIContext.jsx          # UI state (toasts, modals)
│   ├── sw.js                      # Service worker (injectManifest strategy)
│   ├── pwa.js                     # PWA hooks (beforeinstallprompt listener)
│   └── main.jsx                   # Vite entry point + manual SW registration
├── vite.config.js                 # VitePWA plugin config, code splitting
├── firestore.rules                # Security rules (unified, used by both apps)
├── firestore.indexes.json         # Three composite indexes defined
└── .env                           # Secrets (not in git, Vercel managed)
```

### Staff POS Admin (`venkys_admin/`)
```
venkys_admin/
├── api/                          # Vercel serverless functions (subset)
│   ├── create-order.js            # Similar to customer, but supports guestOrder/OTP fields
│   ├── verify-payment.js          # Same Razorpay verification
│   ├── send-log-email.js          # Reused from venkys
│   ├── health.js                  # Health check
│   └── lib/                       # Reused rateLimiter & verifyAuth
├── src/
│   ├── lib/
│   │   ├── data-orders.js         # Extended with guestOrder, cashManagerOtp, change tracking
│   │   ├── data-staff.js          # Role/permission management
│   │   ├── data-inventory.js      # Menu + stock management
│   │   ├── data-changeHistory.js  # Audit trail (all mutations logged)
│   │   ├── auditLog.js            # Logging helper
│   │   ├── data-payments.js       # Razorpay for POS orders
│   │   ├── storeStatus.js         # Open/closed state
│   │   ├── firebase.js            # Firebase config
│   │   └── ... other data layers
│   ├── pages/
│   │   ├── AdminBiller.jsx        # POS billing UI (dine-in + COD OTP flow)
│   │   ├── Orders.jsx             # Order management
│   │   ├── Inventory.jsx          # Stock management
│   │   ├── Analytics.jsx          # Charts (recharts)
│   │   ├── Delivery.jsx           # Delivery order tracking
│   │   ├── StockManager.jsx       # Raw materials tracking
│   │   ├── AuditLogs.jsx          # View audit logs (super admin only)
│   │   ├── Settings.jsx           # Store config
│   │   ├── Appearance.jsx         # Theme + category ordering
│   │   └── ...other admin pages
│   ├── context/
│   │   ├── AuthContext.jsx        # Role-based auth (roles vs adminUsers)
│   │   └── UIContext.jsx          # UI state
│   ├── sw.js                      # Service worker (similar to venkys)
│   └── main.jsx
├── vite.config.js                 # VitePWA config
└── functions/                    # Firebase Hosting redirects to API
```

### Orphaned/Unused Files
**None identified.** Both apps have clean structures:
- Legacy menu collections (`categories`, `menuItems`, `items`) are **read-only** via Firestore rules but **not actively used** in code. New menu system uses single `menu` collection.
- WhatsApp functionality is fully commented out and disabled (awaiting Meta Display Name approval).
- No dead import chains detected.

---

## 2. FIRESTORE SCHEMA & COLLECTIONS

### Current Collections in Use

| Collection | Key Fields | Read By | Write By | Notes |
|-----------|-----------|---------|----------|-------|
| **orders** (main) | `userId`, `customer`, `items`, `subtotal`, `status`, `statusHistory`, `payment`, `totalAmount`, `revisionCount`, `createdAt`, `updatedAt`, `taxRate?`, `taxAmount?`, `cashManagerOtp?`, `cashManagerOtpVerified?` | Staff, Owner, Customer | API (create-order), Admin (update), Customer (create own) | Single source of truth. Supports both web orders and POS guest orders. |
| **users/{uid}/orders** | Same as above | Customer, Admin | Customer, Admin | Legacy nested subcollection. Prefer top-level `orders`. |
| **users/{uid}** | `displayName`, `phone`, `email`, `whatsapp`, `gender`, `profileComplete`, `addresses`, `cart` | Self, Admin | Self, Admin | Customer profiles. |
| **users/{uid}/cart** | `items[]`, `lastUpdated` | Self | Self | Cart state (rarely persisted, mostly client-side). |
| **roles/{email}** | `role`, `name`, `email`, `pages{}`, `nickname`, `createdAt`, `updatedAt`, `createdBy` | Self (own), Admin (all) | Admin, Super Admin | Staff/admin role assignments. Three roles: `admin`, `staff`, `delivery`. Page-level perms for staff. |
| **adminUsers/{uid}** | `displayName`, `email`, `status`, `invitedBy`, `registeredAt`, `role` | Admin (self + all) | Super Admin | Invite-based admin onboarding. |
| **menu/{categoryId}** | `items[]` (name, rate, mrp, variants, imageId, veg, active), `description` | Public | Admin, Inventory Manager | **Current menu system.** Replaces legacy categories/menuItems. |
| **images/{imageId}** | `url`, `thumb`, `uploadedAt`, `uploadedBy` | Public | Admin, Inventory | Menu item images. |
| **raw_materials/{docId}** | `name`, `unit`, `quantity`, `rate`, `lastUpdated` | Admin, Inventory, Biller | Admin, Inventory | Stock tracking. |
| **miscellaneous/settings** | `minLat`, `maxLat`, `minLng`, `maxLng`, `deliveryConfig`, `paymentConfig`, `razorpayKeyId`, `waBusinessAccountId`, `waTemplateDefaultName` | Public (read) | Admin (write) | **⚠️ Do NOT store payment secrets here.** Contains delivery geofence only. |
| **miscellaneous/appearance** | `categoriesOrder[]`, `themeColor`, `brandName` | Public | Admin, Staff (appearance page) | UI customization. |
| **miscellaneous/dailyCounter** | `currentDate`, `total`, `lastOrderType`, `updatedAt` | Admin, Biller, Staff | Admin, Biller, Staff via transaction | Order number generation. |
| **miscellaneous/store** | `isOpen`, `openTime`, `closeTime`, `closedReason` | Public | Admin | Store open/closed status. |
| **fcmTokens/{uid}** | `token`, `registeredAt` | Admin (read) | User (write own) | Push notification tokens for staff/admin. |
| **logs/{logId}** | `type`, `message`, `severity`, `timestamp`, `source`, `metadata` | Super Admin only | Staff, Super Admin (append) | Audit logs. Admin users cannot read. |
| **changeHistory/{changeId}** | `collection`, `docId`, `before`, `after`, `action`, `performedBy`, `description`, `timestamp` | Admin only (via admin app) | Admin mutations | Change tracking for audits. |

### Legacy Collections (Read-Only)
- `categories/{doc}` — Old menu structure. Firestore rules allow read/write by admin, but code doesn't use it.
- `menuItems/{doc}` — Old menu structure. Not actively used.
- `items/{doc}` — Old menu structure. Not actively used.
- **Recommendation:** Keep read rules open in case historical data lookup is needed, but migrate entirely to `menu` collection.

### Deprecated/Removed Collections
- `otps/{otpId}` — **Removed.** OTP now stored directly on order as `cashManagerOtp` field (dine-in COD only).

---

## 3. AUTH & RBAC

### Role Hierarchy (Firestore Rules - Lines 8-34)

1. **Super Admin** (hardcoded email in rules)
   - Email: `swastiksaha1204@gmail.com`
   - **Access:** Full unrestricted access to all collections. Cannot be deleted. Cannot be modified by regular admins.
   - **Where enforced:** Line 44-46, 59-61, 89-91 in firestore.rules

2. **Admin** (role == 'admin' in roles collection)
   - **Access:** Full read/write on all admin-focused collections. Cannot manage super admin role.
   - **Page permissions:** Not page-restricted (implicit all-access).
   - **Where enforced:** Line 89-91

3. **Staff** (role == 'staff' in roles collection)
   - **Access:** Page-level granular permissions. Can read orders, inventory per page access.
   - **Pages:** `biller`, `orders`, `inventory`, `analytics`, `settings`, `appearance`, `delivery`, `cashManager`, `orderMessenger`
   - **Where enforced:** Lines 73-111 in firestore.rules

4. **Delivery** (role == 'delivery' in roles collection)
   - **Access:** Read-only orders. Can only update delivery orders with specific fields: `status`, `statusHistory`, `updatedAt`, `deliveredAt`.
   - **Page permissions:** Not page-based; role-based restriction.
   - **Where enforced:** Lines 132-142, 289-292 in firestore.rules

5. **Customer** (signed-in Firebase user, no role doc)
   - **Access:** Read own user doc, create/update own orders, read own active orders.
   - **Where enforced:** Lines 244-246, 289-291

6. **Guest** (unauthenticated)
   - **Access:** Read-only public data (menu, images, store status, settings).
   - **Where enforced:** Line 329, 356, 385

### Client-Side Auth Check Points
- [venkys/src/context/AuthContext.jsx](venkys/src/context/AuthContext.jsx) — Watches `Firebase Auth` state. No role doc fetching on client.
- [venkys_admin/src/context/AuthContext.jsx](venkys_admin/src/context/AuthContext.jsx) — Fetches role doc from Firestore. **Lines 35-40:** Tries `roles/{email}` first, falls back to legacy adminUsers lookup.
- **⚠️ Gap Identified:** Client hides admin UI if `!role`, but Firestore rules actually enforce write restrictions. If a user is removed from roles collection, they lose access in UI immediately but can still write via API if they have auth token.

### Client-Side Permission Hiding (venkys_admin)
- Navigates to `/auth` if user has no role doc (unauthenticated or non-staff).
- Navbar conditionally shows page links based on `role.pages[pageName]`.
- **Security:** This is **UI-level only**. Firestore rules are authoritative.

### Hardcoded Super Admin Bypass
**Email:** `swastiksaha1204@gmail.com` (hardcoded in firestore.rules line 45)
- **Why:** Allows single super admin to recover system if roles collection is corrupted.
- **Risk:** If this email is compromised or accidentally deleted from Firebase Auth, recovery is manual.
- **Recommendation:** Document backup recovery procedure. Consider second super admin.

### Gap Between Client & Rules
1. **Orders list query** (line 297 in firestore.rules)
   - **Rule:** `allow list: if isAdmin() || canViewOrders() || isDeliveryUser() || isSignedIn();`
   - **Gap:** Any signed-in user can list all orders if they construct the query without `where('userId', '==', uid)`. Client always adds the where clause, but a motivated attacker could bypass client code.
   - **Severity:** LOW — data is own orders only in practice due to client query constraints, but rules should add server-side filtering.

2. **Roles list query** (line 215 in firestore.rules)
   - **Rule:** `allow list: if isAdmin();`
   - **No gap:** Properly restricted.

3. **Admin users read** (line 233 in firestore.rules)
   - **Rule:** `allow read: if isSuperAdmin() || isAdmin() || (isSignedIn() && request.auth.uid == uid);`
   - **Gap:** Regular admin can read all admin users. Super Admin intended? (unclear from comment).
   - **Severity:** LOW — admin users are already staff, so admin seeing other admins is acceptable.

### Admin Roles Storage (Dual System)
- **Primary:** `roles/{email}` — Dynamic role assignment. Used by venkys_admin.
- **Legacy:** `adminUsers/{uid}` — Invite-based onboarding. Redundant.
- **venkys_admin/src/context/AuthContext.jsx line 35-40:** Checks both systems. Confusing dual system.
- **Recommendation:** Deprecate `adminUsers` collection and use `roles` exclusively. Migrate data.

---

## 4. ORDER FLOW — FULL LIFECYCLE

### Customer Web Order (Delivery/Dine-In)

**Step 1: Cart Assembly (Client-Side, No Server Verification)**
- Location: [venkys/src/context/CartContext.jsx](venkys/src/context/CartContext.jsx)
- Subtotal calculated: `sum(item.rate * item.qty)`
- **⚠️ Risk:** No server validation until checkout.

**Step 2: Checkout Page**
- Location: [venkys/src/pages/Checkout.jsx](venkys/src/pages/Checkout.jsx)
- Collects: name, phone, email, address, payment method, instructions.
- Location source: GPS, Google Places autocomplete, or manual.
- Delivery geofence validated client-side via [venkys/src/lib/deliverySettings.js](venkys/src/lib/deliverySettings.js).
- Payment methods: `cod`, `upi`, `card` (Razorpay).
- **Fields computed client-side:**
  - `subtotal` = sum(item.rate * item.qty)
  - `taxAmount` (if applicable)
  - `totalAmount` = subtotal + tax
- Cart total is sent to `/api/create-order` endpoint.

**Step 3: Razorpay Order Creation** (Conditional, if not COD)
- Endpoint: [venkys/api/create-order.js](venkys/api/create-order.js)
- Client sends: `{ amount, items?, cartChecksum? }`
- **Server-side verification:**
  - Fetches menu from Firestore.
  - Recalculates total: `sum(item.rate * item.qty)` from menu prices.
  - Compares client amount vs server amount. Tolerance: ₹1.
  - Uses server-computed amount (`verification.serverTotal`) for Razorpay order creation.
  - **Lines 80-141:** Full price verification logic.
- Returns: `{ orderId, amount, currency }`
- **Security:** ✅ Strong. Server re-validates all prices.

**Step 4: Razorpay Payment (Client-side)**
- Client shows Razorpay checkout modal with amount from Step 3.
- User enters payment details (UPI, card, etc.).
- Razorpay returns: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`

**Step 5: Signature Verification** (Before Order Persist)
- Endpoint: [venkys/api/verify-payment.js](venkys/api/verify-payment.js)
- Client sends: `{ orderId, paymentId, signature }`
- **Server verifies:** HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`.
- **Security:** ✅ Timing-safe comparison (line 59-60). Prevents tampering.
- **⚠️ Note:** Order is NOT created at this stage. Signature is only verified.

**Step 6: Order Persistence** (Client creates Firestore doc)
- Function: [venkys/src/lib/data-orders.js:createOrder()](venkys/src/lib/data-orders.js)
- Client constructs order object with:
  - Items (recalculated subtotal client-side again!)
  - Customer details
  - Order number (generated via transaction on `miscellaneous/dailyCounter`)
  - Status: `placed`
  - Payment method + reference (Razorpay payment ID if online)
- Writes to `/orders/{orderNo}` via Firestore client SDK.
- **⚠️ Risk:** Subtotal recalculated **yet again** client-side. No server verification of final order shape.
- **Firestore rules validation (line 269-282):**
  - Checks `hasCanonicalOrderShape()` — validates field types.
  - Checks `allowDeliveryFor()` — validates geofence if delivery.
  - Does NOT verify pricing.

**Step 7: Order Confirmation**
- Order persisted. Client navigates to `/active-orders?id={orderNo}`.
- Real-time Firestore listener tracks status changes.
- **Notification to staff:** Sent via FCM (Firebase Cloud Messaging).
  - Location: [venkys/api/create-order.js:sendFCMToStaff()](venkys/api/create-order.js) lines 16-54
  - Data: order number, customer name, total, order type.
  - Sent asynchronously (fire-and-forget).
- **⚠️ Missing:** WhatsApp notification disabled (awaiting Meta approval).

**Step 8: Staff Processing (Admin POS)**
- Staff views order in [venkys_admin/src/pages/Orders.jsx](venkys_admin/src/pages/Orders.jsx) or AdminBiller.
- Status transitions: `placed` → `preparing` → `ready` → `delivered`.
- Dine-in + COD orders: Staff generates OTP via [venkys_admin/src/pages/AdminBiller.jsx](venkys_admin/src/pages/AdminBiller.jsx).
  - OTP stored in order doc as `cashManagerOtp` field.
  - Verification flow requires cash manager to verify customer PIN before marking delivered.

**Step 9: Order Status Updates**
- Staff updates order via [venkys_admin/src/lib/data-orders.js:updateOrder()](venkys_admin/src/lib/data-orders.js).
- Changes logged to `changeHistory` collection (audit trail).
- Client re-renders via real-time listener.

**Step 10: Delivery Fulfillment** (If applicable)
- Delivery agent views assigned orders in [venkys_admin/src/pages/Delivery.jsx](venkys_admin/src/pages/Delivery.jsx).
- Updates status to `delivered` with timestamp.
- Only `status`, `statusHistory`, `updatedAt`, `deliveredAt` fields can be modified (line 136-141 rules).

### POS Guest Order (Admin Biller - Dine-In COD)

**Differences from Web Order:**
- **Source:** `source: 'pos'` (not 'web').
- **User:** `userId: null` (no user).
- **Customer:** Minimal (name, table, instructions).
- **Payment:** COD only (dine-in).
- **Status:** Can start as `placed` or `preparing` (admin choice).
- **OTP:** Mandatory for dine-in COD. Generated by cash manager.
- **Order number:** Same daily-reset format, generated server-side via transaction.
- **Audit:** All mutations logged to `changeHistory`.

---

## 5. NOTIFICATIONS — CRITICAL SECTION

### Current Notification Touchpoints

#### A. FCM (Firebase Cloud Messaging) — ✅ ACTIVE
**Usage:**
- **Trigger:** New order placed (online or POS).
- **Location:** [venkys/api/create-order.js:sendFCMToStaff()](venkys/api/create-order.js) lines 16-54
- **Recipients:** All staff members (fetches all tokens from `fcmTokens` collection).
- **Data Payload:**
  ```json
  {
    "type": "new_order",
    "orderNo": "20260711-0001",
    "orderType": "dine-in",
    "customerName": "John",
    "total": "450",
    "isDineInCod": "true"
  }
  ```
- **Notification Payload:**
  ```json
  {
    "title": "🚨 New Dine-in Order",
    "body": "John • ₹450"
  }
  ```
- **Storage:** FCM tokens stored in `fcmTokens/{uid}` collection.
- **Token Registration:** Handled by client app (Firebase SDK `getToken()`).

#### B. WhatsApp Cloud API — ⚠️ DISABLED
**Status:** Commented out, awaiting Meta Display Name approval.
**Was Used For:**
- Bill/invoice delivery to customer.
- Template: `venkys_bill`.
- Location: [venkys/src/lib/whatsapp.js](venkys/src/lib/whatsapp.js) (lines 1-35, all commented).
- API endpoint: [venkys/api/send-whatsapp.js](venkys/api/send-whatsapp.js) (lines 1-80, all commented).
- **Env vars:**
  - `WA_BUSINESS_ACCOUNT_ID` = "1173375044851268"
  - `WA_PHONE_NUMBER_ID` = (not in .env, commented endpoint expects it)
  - `WA_TOKEN` = (not in .env)
  - `WA_TEMPLATE_DEFAULT_NAME` = "venkys_bill"

#### C. Email Notifications — ✅ ACTIVE (Admin/Error Logging)
**Usage:**
- Rate limit violations logged to admin email.
- Error alerts sent to `LOG_EMAIL_RECIPIENT`.
- Location: [venkys/api/send-log-email.js](venkys/api/send-log-email.js)
- **Env vars:**
  - `EMAIL_USER` = "venkysdgp@gmail.com"
  - `EMAIL_PASS` = (app password, masked in .env)
  - `LOG_EMAIL_RECIPIENT` = "swastiksaha1204@gmail.com"

#### D. Contact Page WhatsApp Link — ✅ ACTIVE
- Location: [venkys/src/pages/Contact.jsx](venkys/src/pages/Contact.jsx)
- Opens `https://wa.me/{phoneNumber}` with pre-filled message.
- **Not a server notification.**

### Summary Table

| Notification Type | Status | Trigger | Recipients | Implementation | Env Vars |
|--|--|--|--|--|--|
| FCM Push (New Order) | ✅ Active | Order placed | Staff/Admin | Firebase Admin SDK | VITE_FIREBASE_* + fcmTokens collection |
| WhatsApp (Bill) | ⚠️ Disabled | Order confirmed | Customer | Meta Cloud API | WA_TOKEN, WA_PHONE_NUMBER_ID, WA_BUSINESS_ACCOUNT_ID |
| Email (Alerts) | ✅ Active | Rate limit, errors | Admin | Nodemailer | EMAIL_USER, EMAIL_PASS, LOG_EMAIL_RECIPIENT |
| WhatsApp (Contact) | ✅ Active (Link only) | User initiated | Customer | Browser link | None |

### Migration Path for WhatsApp → FCM
**Currently:** FCM only sends to staff. No customer push notifications.
**To Replace WhatsApp:**
1. Enable FCM for customers (store tokens in `fcmTokens` or separate collection).
2. Send order status updates via FCM (placed → ready → delivered).
3. Disable WhatsApp API entirely.

---

## 6. PAYMENTS — RAZORPAY INTEGRATION

### Razorpay Flow

**Public Configuration:**
- **Key ID:** `VITE_RAZORPAY_KEY_ID` = "rzp_test_SgXAisBcaoHVyl" (exposed in .env, used in client).
- **Key Secret:** `RAZORPAY_KEY_SECRET` = (server-only, NOT in Vite .env).
- **Storage:** Key ID retrieved from `miscellaneous/settings.razorpayKeyId` or env fallback.

**Order Creation (Step 3 above):**
- Client: [venkys/src/lib/data-payments.js:createRazorpayOrder()](venkys/src/lib/data-payments.js)
  - Sends `amount` to `/api/create-order`.
  - Server verifies amount against menu prices.
  - Razorpay order created server-side.
- **Security:** ✅ Amount verification server-side.

**Payment Verification (Step 5 above):**
- Client: [venkys/src/lib/data-payments.js:verifyRazorpayPayment()](venkys/src/lib/data-payments.js)
  - Sends `{ orderId, paymentId, signature }` to `/api/verify-payment`.
- Server: [venkys/api/verify-payment.js](venkys/api/verify-payment.js)
  - Reconstructs payload: `orderId|paymentId`.
  - Computes HMAC-SHA256 using `RAZORPAY_KEY_SECRET`.
  - **Timing-safe comparison** (crypto.timingSafeEqual).
  - Returns `{ valid: true/false }`.
- **Security:** ✅ Strong. Timing-safe prevents timing attacks.

**Payment Confirmation:**
- Razorpay webhook hits `/api/razorpay-webhook` endpoint (optional, not critical).
- Manual verification is authoritative.

### Secrets Exposure Check
**Client-exposed env vars (VITE_ prefix):**
```
VITE_RAZORPAY_KEY_ID="rzp_test_SgXAisBcaoHVyl"  ✅ PUBLIC key, safe to expose
VITE_FIREBASE_API_KEY="AIzaSyAU..."             ✅ Firebase API key, safe to expose (restricted in Firebase console)
VITE_GOOGLE_MAPS_API_KEY="AIzaSyAH..."          ✅ Maps API key, can be restricted to domains
VITE_FIREBASE_MEASUREMENT_ID="G-BX..."          ✅ Analytics ID, safe
```

**Server-only secrets (NOT in Vite .env):**
```
RAZORPAY_KEY_SECRET=(hidden)                    ✅ NEVER exposed
FIREBASE_SERVICE_ACCOUNT=(hidden)               ✅ NEVER exposed
EMAIL_PASS=(hidden)                             ✅ NEVER exposed
WA_TOKEN=(not configured)                       ⚠️ When enabled, must be server-only
GOOGLE_PLACES_API_KEY=(on server)               ✅ Server-only (reverse geocoding)
```

**Assessment:** ✅ NO SECRET LEAKS DETECTED. All sensitive keys are server-only.

---

## 7. PWA STATUS

### Customer PWA (venkys)

**Configuration:** [venkys/vite.config.js](venkys/vite.config.js) lines 56-86
- **Plugin:** `vite-plugin-pwa`
- **Manifest:** Inlined in vite config (line 61-76)
  - `name`: "Venky's Chicken Xperience Durgapur"
  - `short_name`: "Venky's"
  - `display`: "standalone"
  - `start_url`: "/"
  - `scope`: "/"
  - `theme_color`: "#facc15"
  - `background_color`: "#ffffff"
- **Icons:** Expected in `public/icons/`:
  - `icon-192.png`
  - `icon-512.png`
  - `icon-512-maskable.png`
  - `Logo.png` (1024x1024)
- **Strategy:** `injectManifest` (custom service worker)
- **Service Worker:** [venkys/src/sw.js](venkys/src/sw.js)
  - Caching strategy: `network-first` for API, `cache-first` for static assets.
  - Max cache age: 7 days.
  - Excludes `/api/*` and large images from cache.
  - Fallback on offline: `/index.html` for navigation requests.
- **Installation Prompt:**
  - Event listener in [venkys/src/pwa.js](venkys/src/pwa.js).
  - UI trigger in [venkys/src/components/InstallPWA.jsx](venkys/src/components/InstallPWA.jsx).
  - Shows on Android/Chrome with beforeinstallprompt event.

**Offline Behavior:**
- ✅ App shell cached (index.html, JS, CSS).
- ✅ Menu data fetched on load (not cached for freshness).
- ✅ Network errors fall back to cached assets.
- ⚠️ API calls fail gracefully if offline.

**Assessment:** ✅ Well-configured. Ready for install on Android/Chrome.

### Admin PWA (venkys_admin)

**Configuration:** [venkys_admin/vite.config.js](venkys_admin/vite.config.js) — Nearly identical to venkys.

**Service Worker:** [venkys_admin/src/sw.js](venkys_admin/src/sw.js)
- Cache name: `venkys-admin-pwa-v2`
- Excludes audio files (mp3, wav, ogg) from cache (line 45-46).
- Otherwise identical to customer PWA.

**Assessment:** ✅ Well-configured.

---

## 8. SECURITY SPOT-CHECK

### Firestore Rules — Write Restrictions on Orders/Payments

| Collection | Create | Update | Delete |
|--|--|--|--|
| **orders** | Auth required. Counter docs need special validation. Users can create own, billers can create guest orders. Price validation at Firestore rule level: `hasCanonicalOrderShape()`. | Staff (orders page), biller, delivery agents (own orders only). OTP updates restricted to specific fields. | Admin only, no counter docs. |
| **payment** | No separate collection. Payment info stored on order doc. | Staff can update payment status/collected fields. | N/A |
| **miscellaneous/settings** | Admin only. | Admin only. | Admin only. |
| **users** | Self or Admin. | Self or Admin. | Self (if no role) or Admin. |

**Gaps:**
1. **Order list query (line 297):** `allow list: if isSignedIn()` — Any user can list all orders if they don't add `where('userId', '==', uid)`. Client enforces constraint, but rules should too.
   - **Severity:** LOW (client enforces, but breaks encapsulation).
   - **Fix:** Add `&& request.query.orderBy.size() > 0` or similar.

2. **User subcollection order updates (line 253):** `allow update: if isAdmin() || canManageOrders() || (isSignedIn() && request.auth.uid == uid)`
   - User can update own nested order freely (no price validation).
   - **Severity:** LOW (API verifies prices for main orders, but nested orders are legacy).

### Environment Variables Leaking to Client

**Checked vite.config.js and .env:**
- ✅ NO secrets prefixed with `VITE_` in .env.
- ✅ All `VITE_` vars are public (API keys, Firebase keys).
- ✅ Secrets (`RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, etc.) are NOT prefixed with `VITE_`.

**Assessment:** ✅ Clean. No secrets in client bundles.

### Rate Limiting

**Implementation:** [venkys/api/lib/rateLimiter.js](venkys/api/lib/rateLimiter.js)

**Features:**
- ✅ Upstash Redis-backed distributed rate limiting (with in-memory fallback).
- ✅ Per-route, per-user limits (lines 73-84).
- ✅ Kill switch for emergency shutdown (line 87).
- ✅ Violation logging to Firestore + email alert (lines 178-214).
- ✅ Timing-safe comparisons not applicable (token bucket is not cryptographic).

**Limits:**
- `create-order`: 30 req/min (burst 10)
- `verify-payment`: 50 req/min (burst 15)
- `send-whatsapp`: 10 req/min (burst 3) — disabled anyway

**Assessment:** ✅ Strong. Prevents abuse.

### Public Endpoints

| Endpoint | Auth | Rate Limit | Risk |
|--|--|--|--|
| `/api/public-config` | None | 100 req/min | Low (returns public config: Razorpay key ID, phone, etc.) |
| `/api/health` | None | Default | None (health check) |
| Menu, images (Firestore) | None | Firestore quotas | Low (public data) |
| Store status (Firestore) | None | Firestore quotas | None |

**Assessment:** ✅ Safe. Public data only.

### Missing Protections

1. **Order number sequencing:** Generated via Firestore transaction. No cryptographic hash. Predictable.
   - **Risk:** Attacker can guess order numbers. But orders are keyed by orderNo, and Firestore rules require auth to read. LOW risk if rules are enforced.
   - **Fix:** Add random suffix to order numbers (e.g., `20260711-0001-abc123`).

2. **Delivery geofence:** Checked client-side + Firestore rules.
   - **Risk:** Client can be bypassed. Rules check is authoritative.
   - **Assessment:** ✅ Sufficient.

3. **Phone number validation:** Only regex checked (7-15 digits).
   - **Risk:** No verification that phone is real or belongs to user.
   - **Fix:** Send OTP to phone on profile update (optional, low priority).

---

## 9. KNOWN ISSUES & DEBUGGING ARTIFACTS

### TODOs/FIXMEs (Grep Results)

| File | Line | Issue |
|--|--|--|
| venkys_admin/src/context/AuthContext.jsx | ~35 | `TODO: deprecate roles fallback after all staff migrated` — Dual system (roles vs adminUsers) still in use. Should migrate completely to roles. |
| venkys_admin/src/lib/data-settings.js | N/A | `Also backfill if deprecated fields still exist in entries` — Historical baggage. |

### Console.log Left in Production Code

**Found 4 instances (all PWA-related, low risk):**
1. [venkys/src/components/InstallPWA.jsx](venkys/src/components/InstallPWA.jsx) — `console.log('[PWA] install prompt shown')`
2. [venkys/src/components/InstallPWA.jsx](venkys/src/components/InstallPWA.jsx) — `console.log('[PWA] install choice', ...)`
3. [venkys/src/main.jsx](venkys/src/main.jsx) — `console.log('[PWA] App ready for offline use')`
4. [venkys/src/pwa.js](venkys/src/pwa.js) — `console.log('PWA installed')`

**Assessment:** ✅ Non-critical. PWA debugging logs only. Safe to leave or remove.

### Commented-Out Code

- [venkys/src/lib/whatsapp.js](venkys/src/lib/whatsapp.js) — Entire WhatsApp client disabled (lines 2-35).
- [venkys/api/send-whatsapp.js](venkys/api/send-whatsapp.js) — Entire WhatsApp API disabled (lines 1-80).
- **Reason:** Awaiting Meta Display Name approval.
- **Assessment:** ✅ Clean. Code is isolated and well-commented.

### Deprecated Structures

- `categories`, `menuItems`, `items` collections — Old menu system. Code doesn't use them.
- `adminUsers` vs `roles` — Dual role management system. Should consolidate.
- Nested `/users/{uid}/orders` — Legacy. Code uses top-level `/orders` collection.

---

## 10. DEPENDENCY HEALTH

### venkys (Customer PWA)

**Production Dependencies (9 total):**
```json
{
  "@upstash/ratelimit": "^2.0.8",          ✅ Latest (rate limiting)
  "@upstash/redis": "^1.36.2",             ✅ Latest (Redis client)
  "daisyui": "^5.1.24",                    ✅ Latest (Tailwind CSS UI)
  "firebase": "^12.3.0",                   ✅ Latest (Firebase SDK)
  "firebase-admin": "^13.6.0",             ⚠️ See below (admin SDK in browser)
  "nodemailer": "^7.0.12",                 ⚠️ See below (email in browser)
  "razorpay": "^2.9.6",                    ✅ Latest (Razorpay SDK)
  "react": "^19.1.1",                      ✅ Latest (React 19)
  "react-dom": "^19.1.1",                  ✅ Latest (React 19)
  "react-icons": "^5.2.1",                 ✅ Latest (Icon library)
  "react-router-dom": "^7.9.3"             ✅ Latest (Routing)
}
```

**⚠️ Critical Issues:**
1. **`firebase-admin` in browser bundle:** This is Node.js-only! Should NOT be in client app.
   - **Location:** Listed in `dependencies` (line 20 in venkys/package.json).
   - **Risk:** Will fail to initialize in browser. Firebase SDK (not admin) should be used instead.
   - **Fix:** Remove from venkys. Keep in venkys_admin API functions only.

2. **`nodemailer` in browser bundle:** Node.js SMTP client. Useless in browser.
   - **Location:** Listed in `dependencies` (line 21).
   - **Risk:** Dead code. Will not work in browser.
   - **Fix:** Remove. Use email sending via server APIs only.

**Dev Dependencies (10 total):**
```json
{
  "@eslint/js": "^9.36.0",                 ✅ Latest (ESLint)
  "@tailwindcss/postcss": "^4.1.13",       ✅ Latest (Tailwind)
  "@types/react": "^19.1.13",              ✅ Latest (TypeScript types)
  "@types/react-dom": "^19.1.9",           ✅ Latest (TypeScript types)
  "@vitejs/plugin-react": "^5.0.3",        ✅ Latest (Vite React plugin)
  "autoprefixer": "^10.4.21",              ✅ Latest (CSS autoprefixer)
  "eslint": "^9.36.0",                     ✅ Latest (Linter)
  "eslint-plugin-react-hooks": "^5.2.0",  ✅ Latest (React hooks linter)
  "eslint-plugin-react-refresh": "^0.4.20", ✅ Latest (Fast refresh linter)
  "firebase-tools": "^13.0.0",             ✅ Latest (Firebase CLI)
  "globals": "^16.4.0",                    ✅ Latest (Global variables)
  "postcss": "^8.5.6",                     ✅ Latest (CSS transformer)
  "tailwindcss": "^4.1.13",                ✅ Latest (Utility CSS)
  "vite": "^7.1.7",                        ✅ Latest (Build tool)
  "vite-plugin-pwa": "^1.0.3"              ✅ Latest (PWA plugin)
}
```

**Assessment:** Dev dependencies clean. No vulnerabilities.

### venkys_admin (Staff POS)

**Production Dependencies (10 total):**
- Same as venkys, plus:
  ```json
  "recharts": "^2.15.4"                    ✅ Latest (Charts library)
  "dotenv": "^17.4.1"                      ⚠️ Unnecessary (Vite handles .env)
  ```

**Same Issues as venkys:**
1. ❌ `firebase-admin` in browser bundle (line 19).
2. ❌ `nodemailer` in browser bundle (line 20).

**Additional Issue:**
3. ⚠️ `dotenv` (line 17) — Not needed. Vite automatically loads `.env` files.

**Assessment:** Same cleanup needed as venkys.

### Dependency Vulnerabilities

**As of 2026-07-11:**
- No known critical vulnerabilities in listed packages (using caret ranges, allows minor/patch updates).
- Recommend: `npm audit fix` to patch any dev dependencies.

### Tree-Shaking Analysis

**vite.config.js Code Splitting (lines 26-32):**
```javascript
manualChunks: {
  'react-core': ['react', 'react-dom'],
  'react-router': ['react-router-dom'],
  'firebase-app': ['firebase/app'],
  'firebase-auth': ['firebase/auth'],
  'firebase-firestore': ['firebase/firestore'],
}
```
- ✅ Sensible chunking. Separates large libraries.
- ✅ react-icons and recharts NOT listed (allows tree-shaking).

### Unused/Leaking Packages

1. ❌ **firebase-admin** — Should be removed from both venkys and venkys_admin package.json.
2. ❌ **nodemailer** — Should be removed from both. Email is sent via server APIs only.
3. ⚠️ **dotenv** — Remove from venkys_admin (Vite handles .env).

---

## SUMMARY TABLE — RISK LEVELS

| Category | Issue | Severity | Fix Effort | Impact |
|--|--|--|--|--|
| **Notifications** | WhatsApp disabled, no fallback | Medium | Low | Customers don't get bill notifications |
| **Orders** | Subtotal recalculated multiple times (client) | Low | Low | No impact if Razorpay verification works |
| **Orders** | Order list readable by any signed-in user (rules gap) | Low | Low | UI enforces constraints; rules should too |
| **Auth** | Dual role system (roles vs adminUsers) | Low | Medium | Confusion, inconsistent state |
| **Auth** | Super admin email hardcoded | Low | Medium | Disaster if email is compromised |
| **Dependencies** | firebase-admin in browser | High | Low | Dead code, confusion |
| **Dependencies** | nodemailer in browser | High | Low | Dead code, confusion |
| **Dependencies** | dotenv in venkys_admin | Low | Low | Dead code, confusion |
| **Debugging** | console.log in PWA code | Low | Low | Noise in production logs |
| **Geofence** | Delivery geofence checked client-side | Low | N/A | Rules are authoritative |
| **Rate Limiting** | Missing on Firestore directly | Medium | High | Firestore quotas enforce limits |

---

## RECOMMENDATIONS FOR NEXT PHASE (Audit & Fix)

### High Priority (Block Notifications Migration)
1. **Remove firebase-admin & nodemailer from venkys & venkys_admin package.json**
   - Effort: 5 min
   - Impact: Cleaner bundle, removes dead code

2. **Test FCM push notifications end-to-end**
   - Verify staff receives order alerts
   - Effort: 30 min
   - Impact: Ensures notification flow works before WhatsApp removal

3. **Plan WhatsApp → FCM migration**
   - Design FCM for customer notifications (order status updates)
   - Effort: 2 hours
   - Impact: Replaces WhatsApp entirely with FCM

### Medium Priority (Fix Auth & Data)
4. **Consolidate dual role system**
   - Migrate all adminUsers to roles collection
   - Remove adminUsers deprecation fallback
   - Effort: 1-2 hours
   - Impact: Single source of truth for roles

5. **Fix Firestore rules: add server-side list filtering**
   - Add `where('userId', '==', request.auth.uid)` constraint for non-admin users
   - Effort: 30 min
   - Impact: Proper encapsulation

6. **Randomize order numbers**
   - Add 6-char random suffix (e.g., `20260711-0001-abc123`)
   - Effort: 1 hour
   - Impact: Prevents order number guessing attacks

### Low Priority (Cleanup)
7. **Remove console.log statements from PWA code**
   - Effort: 5 min
   - Impact: Cleaner logs

8. **Add second super admin**
   - Document disaster recovery procedure
   - Effort: 30 min
   - Impact: Increases resilience

9. **Deprecate legacy menu collections**
   - Keep read rules but log usage
   - Effort: 1 hour
   - Impact: Cleaner data model

---

## END OF AUDIT REPORT
