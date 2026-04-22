# Full Deep-Dive Audit

Last updated from this local workspace on 2026-04-18 (Asia/Calcutta). Actual secret values from `.env` files are intentionally omitted.

This document is intentionally **source-based** (files under `src/`, `api/`, `*.rules`, `*.json`, and `package.json`). It does **not** treat build artifacts (`dist/`) or local installs (`node_modules/`, `npm ls`) as authoritative, because those become stale quickly.

---

## 1) Executive Summary (Current System)

This repository is a two-app system for a restaurant ordering + operations stack:

- **Customer PWA** (`venkys/`): menu browsing, cart, checkout, authentication, and order tracking.
- **Admin/POS PWA** (`venkys_admin/`): staff-only operations (POS biller, orders workflow, inventory + stock, delivery dashboard, analytics, appearance/settings, audit logs UI), plus Android RawBT thermal printing.
- **Shared backend**: Firebase Auth + Firestore as the system-of-record for menu, orders, users, roles, settings, logs.
- **Serverless APIs**: Vercel-style functions under each app’s `api/` folder for Razorpay + WhatsApp + operational utilities.

High-signal implemented flows:

- **Customer checkout + online payment** uses Razorpay order creation (`/api/create-order`) + signature verification (`/api/verify-payment`), and can include an optional server-side cart verification against Firestore menu prices (₹1 tolerance) with a server-side cap of ₹50,000.
- **Razorpay webhook** exists in the customer app (`/api/razorpay-webhook`) and updates Firestore payment state after verifying the webhook signature.
- **WhatsApp Cloud API**:
  - Generic sender (`/api/send-whatsapp`) supports text and template sends and includes a 24-hour-window fallback (open a template conversation then retry text).
  - Customer app has a WhatsApp webhook receiver (`/api/wa-webhook`) with signature verification (fail-closed if secret missing) and GET verification handshake.
  - Dedicated staff notification sender exists (`/api/send-order-messenger`).
  - Admin `send-whatsapp` enforces a strict OTP authentication template payload (`venkys_otp`).
- **Admin dine-in COD OTP**:
  - POS biller attaches OTP metadata (e.g., `cashManagerOtp*`) when creating dine-in COD orders.
  - Orders dashboard verifies OTP, marks payment as collected, and advances status.
- **Printing**:
  - Admin app supports Android-only RawBT deep-link printing using an ESC/POS receipt builder.

---

## 2) Repository Layout (Source of Truth)

Top-level:

- `FULL_DEEP_DIVE_AUDIT.md` (this file)
- `venkys/` (customer app)
- `venkys_admin/` (admin app)

Each app contains:

- `src/` React app sources
- `api/` serverless endpoints (Node)
- `firestore.rules`, `firestore.indexes.json` (rules + indexes for the shared Firebase project)
- `firebase.json` (Firebase Hosting config)
- `vercel.json` (Vercel config for SPA + serverless deployment)
- `vite.config.js`, `tailwind.config.js`, `postcss.config.js`

Non-authoritative / generated content:

- `dist/` (Vite build output)
- `.firebase/` (Firebase CLI cache)
- `.vercel/` (Vercel project metadata)

---

## 3) Tech Stack & Versions (From package.json)

### Customer app (`venkys/package.json`)

- React: `^19.1.1`
- React Router DOM: `^7.9.3`
- Vite: `^7.1.7`
- Tailwind CSS: `^4.1.13`
- DaisyUI: `^5.1.24`
- Firebase JS SDK: `^12.3.0`
- Serverless helpers: Upstash Redis + Ratelimit, Nodemailer, Razorpay

### Admin app (`venkys_admin/package.json`)

- Everything above, plus:
  - Recharts: `^2.15.4`
  - dotenv: `^17.4.1` (installed; no direct imports found in tracked sources)

---

## 4) Frontend Apps

### 4.1 Customer app (`venkys/src`)

**Routing** (in `venkys/src/App.jsx`):

- `/` → Home
- `/checkout` → Checkout
- `/profile` → Profile
- `/active-orders` → ActiveOrders
- `/about`, `/contact`, `/terms`, `/privacy`, `/shipping`, `/cancellation-refunds`
- `*` → NotFound

**Core state** (Context providers):

- `AuthContext`: Firebase Auth with Email/Password, Google sign-in, and Phone OTP helpers.
- `CartContext`: cart entries + persistence.
- `UIContext`: modal/toast UI state.

**Checkout** (high-level behavior observed in `venkys/src/pages/Checkout.jsx`):

- Multi-step form: contact → address → payment.
- Address capture supports:
  - manual entry
  - Google Places-based selection
  - GPS-based current location
- Payment methods: COD, UPI (Razorpay), Card (Razorpay).
- Uses `getRazorpayKeyId()` and the `/api/public-config` endpoint as a fallback when `VITE_RAZORPAY_KEY_ID` is not set.

### 4.2 Admin app (`venkys_admin/src`)

**Routing + access gating** (in `venkys_admin/src/App.jsx` and `venkys_admin/src/context/AuthContext.jsx`):

- Requires Firebase-authenticated user.
- Requires a staff role determined from either:
  - `roles/{email}` (normalized email doc), and/or
  - `adminUsers/{uid}` (when present and `status === 'active'`, it takes precedence).
- `SUPER_ADMIN_EMAIL` is hardcoded for privileged operations.

Routes under `/admin/*` include:

- `/admin/orders` (orders workflow)
- `/admin/biller` (POS biller)
- `/admin/inventory` (menu + images + variants + ingredients)
- `/admin/stock` (raw materials)
- `/admin/delivery` (delivery dashboard)
- `/admin/analytics` (charts)
- `/admin/appearance`, `/admin/settings`
- `/admin/logs` (audit logs UI)
- `/invite` (invite accept flow)

Important nuance:

- The admin UI restricts Logs access to **super admin** (even though admin Firestore rules allow admin reads in the admin rules file). This is a UI-level policy choice.

---

## 5) Admin Operational Flows (Observed)

### 5.1 POS biller: dine-in COD OTP + invoices

In `venkys_admin/src/pages/AdminBiller.jsx`:

- `submitBill()` creates dine-in orders (`orderType: 'dine-in'`, `source: 'pos'`).
- For dine-in COD, it attaches OTP metadata:
  - `cashManagerOtp`, `cashManagerOtpFor: 'dine-in-cod'`
  - verification fields: `cashManagerOtpVerified*`
  - regeneration fields on OTP regenerate.
- Initial order status is:
  - `'preparing'` if OTP verified or payment already paid
  - otherwise `'placed'`
- Sends WhatsApp messages:
  - OTP to configured cash manager phone(s).
  - Customer invoice via template `venkys_bill` when customer phone is provided.

### 5.2 Orders dashboard: OTP verification + printing

In `venkys_admin/src/pages/Orders.jsx`:

- Dine-in COD orders can require OTP verification before accept.
- OTP accept marks payment paid with collection metadata and advances status to `preparing`.
- Stock deduction is triggered on accept for applicable flows.
- Printing:
  - Android/mobile/PWA heuristics choose RawBT deep-link printing.
  - Non-RawBT path opens a browser popup window with printable HTML.

### 5.3 Delivery dashboard: live query with fallback

In `venkys_admin/src/pages/Delivery.jsx`:

- Primary query uses Firestore `where('status', 'not-in', [...])` to exclude terminal statuses.
- If the primary query errors, it falls back to a broader query and filters client-side.

### 5.4 Inventory: categories/items/images/variants/ingredients

In `venkys_admin/src/pages/Inventory.jsx`:

- Category and item CRUD.
- Image handling stores base64 payloads via `saveBase64Image(...)` and rehydrates images as `data:<mime>;base64,...`.
- Items support pricing fields (MRP, rate, discount%) with derived recalculation.
- Items can include variant/ingredient structures (details depend on the saved menu schema).

---

## 6) Serverless API Surface

### 6.1 Customer APIs (`venkys/api`)

- `health.js`: health check.
- `public-config.js`: returns public config (Razorpay key id).
- `create-order.js`: creates a Razorpay order; can verify cart total against Firestore menu prices when items are provided.
- `verify-payment.js`: verifies Razorpay signature (timing-safe compare).
- `razorpay-webhook.js`: verifies webhook signature (`RAZORPAY_WEBHOOK_SECRET`) and updates Firestore order payment status.
- `send-whatsapp.js`: WhatsApp sender with text/template support and conversation-window fallback.
- `send-order-messenger.js`: template-only staff notification sender.
- `wa-webhook.js`: WhatsApp webhook with signature verification (`WA_APP_SECRET`) and GET verification (`WA_VERIFY_TOKEN`).
- `sync-business-profile.js`: Google Places sync into Firestore; scheduled by Vercel cron.
- `send-log-email.js`: operational email endpoint (used by rate limiter alerts).

Behavioral notes:

- Most customer API routes are Firebase-auth guarded using `verifyAuth(...)`.
- `send-order-messenger` currently returns a **200 + __skipped** response when WhatsApp env vars are missing (non-fail-fast). The generic sender fails fast with 500 if missing.

### 6.2 Admin APIs (`venkys_admin/api`)

- `health.js`, `public-config.js`, `create-order.js`, `verify-payment.js`, `send-whatsapp.js`, `send-order-messenger.js`, `send-log-email.js`.

Key differences:

- Admin API does **not** include `razorpay-webhook` or `wa-webhook`.
- Admin `send-whatsapp` enforces OTP template `venkys_otp` component structure when selected.

### 6.3 Cross-cutting controls

Rate limiting + ops kill switch (`api/lib/rateLimiter.js`):

- Per-route rate limits.
- Global kill switch (`API_KILL_SWITCH`, `API_KILL_SWITCH_REASON`).
- Optional Upstash Redis support (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), in-memory fallback when missing.
- Logs violations to Firestore (in production or when explicitly enabled) and can email alerts via `/api/send-log-email`.

Auth guard (`api/lib/verifyAuth.js`):

- Firebase ID token verification from `Authorization: Bearer <token>`.
- Can be disabled via `AUTH_REQUIRED=0` (not recommended).
- Optional internal secret path for server-to-server calls (`API_INTERNAL_SECRET`).

---

## 7) Firestore Data & Rules

### 7.1 Core collections (observed usage)

- `menu`: customer-facing catalog (public readable in rules).
- `orders`: both delivery and dine-in flows (customer + POS).
- `users/{uid}`: user profile info and saved addresses.
- `roles/{email}`: role + per-page permission matrix (admin app uses it).
- `adminUsers/{uid}`: admin-user access doc (takes precedence in admin app when present).
- `miscellaneous/settings`: operational settings (intentionally public readable in rules; must not contain secrets).
- `logs`: operational logs / rate-limit logs.

### 7.2 Rules deployment drift risk

There are two separate copies of Firestore rules:

- `venkys/firestore.rules`
- `venkys_admin/firestore.rules`

Both can be deployed (each app has its own `firebase.json`). This creates a **drift risk**: whichever app deploys last can overwrite Firestore rules for the shared Firebase project.

Notable observed difference:

- Logs read policy differs between the two rules files (customer rules are stricter; admin rules allow admin reads).

Recommendation:

- Treat Firestore rules/indexes as a single shared artifact to avoid accidental policy changes.

---

## 8) PWA & Offline Behavior

Both apps:

- Use `vite-plugin-pwa` with `injectManifest`.
- Provide a custom service worker in `src/sw.js` that precaches build assets and provides basic offline navigation behavior.

Customer app:

- Includes `src/pwa.js` for install prompt/update handling.
- Also has an `InstallPWA` component.

Admin app:

- Uses `InstallPWA` component.

---

## 9) Printing (Admin)

In `venkys_admin/src/lib/rawbtPrint.js`:

- `shouldUseRawBT()` heuristically chooses RawBT on Android mobile/tablet/PWA.
- `buildEscPosReceiptForOrder(...)` generates ESC/POS text.
- `printOrderReceiptViaRawBT(...)` deep-links to `rawbt:base64,` with a base64-encoded payload.

---

## 10) Deployment Topology & Config

This repo contains configs for **both** Firebase Hosting and Vercel.

### 10.1 Firebase Hosting

- `firebase.json` in each app deploys `dist/` to a Firebase Hosting site.
- The rewrites in Firebase hosting configs route all paths to `/index.html` (SPA). There are **no** Firebase Functions rewrites here, so `/api/*` on Firebase Hosting will not execute the Node handlers.

### 10.2 Vercel

- `vercel.json` in each app configures headers, SPA rewrites, and `/api/*` routes.
- Customer `vercel.json` includes a cron to call `/api/sync-business-profile` every 2 days at 06:00.

Practical implication:

- If you deploy frontends to Firebase Hosting, you must point `VITE_API_BASE_URL` (or equivalent) to wherever the serverless APIs are hosted (commonly Vercel).

---

## 11) Risks, Mismatches, and Fix-List

High-impact items observed from current source:

1. **Two copies of Firestore rules** can drift and be overwritten by whichever deploy runs last.
2. **Hardcoded super-admin email** exists in rules and admin UI; rotation and ownership changes are painful.
3. **UI vs rules mismatch** for logs:
   - Admin UI restricts logs to super-admin; admin rules allow admin reads.
4. **WhatsApp config behavior inconsistency**:
   - Some endpoints fail fast when missing env vars; others return 200 + `__skipped`.
5. **API deployment confusion risk**:
   - Firebase Hosting configs do not deploy APIs; Vercel configs do.

---

## Appendix A) How to Re-Audit Quickly (Repeatable)

These commands are optional and meant to regenerate facts in a consistent way.

- Dependency versions: trust `package.json` and `package-lock.json`, not `npm ls`.
- API surface: list files under each app’s `api/` folder.
- Routes: inspect each app’s `src/App.jsx`.
- Firestore access: inspect the active deployed rules (ensure a single source).
