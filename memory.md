# Project Memory: Venky's Cheat Mealz

## 1. Global Stack Standard Pointer
Authoritative cross-project development and infrastructure standards are documented in:
* `D:/My projects/memory/global/stack-standard.md`

All architectural patterns, hosting conventions, CI/CD designs, and security policies must align with this standard.

---

## 2. Standing Development Rules & Process
1. **Pre-Push Validation**: Always run clean lint and production builds across both workspaces before pushing:
   ```bash
   npm run check-rules
   npm run lint
   npm run build
   ```
2. **Git Workflow & Branch Model**:
   * Staging / Active development branch: `main`
   * Production release branch: `prod`
   * Branch Protection Ruleset targets `prod`: PR required, 0 required approvals (solo dev), linear history, blocking status checks (`rules-check`, `validate-venkys`, `validate-venkys-admin`, `verify-prod-checklist`).
   * Never push broken builds or untested security rules directly to production.
3. **Pre-Push Git Hook**: Installed via `.githooks/pre-push` (configured via `git config core.hooksPath .githooks`). Enforces blocking lint, build, and `firestore.rules` sync checks prior to git pushes.
4. **No Direct Secret Commit**: Never commit `.env` files or service account JSON files. Use `.env.example` templates with sanitized placeholders.

---

## 3. RBAC (Role-Based Access Control) Model
The system enforces a strict 6-tier authorization model synchronized between `firestore.rules` and backend API helpers (`api/lib/verifyAuth.js` and `api/lib/fcm.js`):

| Tier | Role / Entity | Identification | Permissions |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Super Admin** | `swastiksaha1204@gmail.com` | Full unrestricted bypass across all Firestore collections, user role management, system settings, and API routes. Cannot be deleted or modified by other admins. |
| **Tier 2** | **Admin** | `roles/{email}` with `role: 'admin'` | Full management across menu, inventory, orders, settings, and staff roles (except modifying the Super Admin). |
| **Tier 3** | **Staff** | `roles/{email}` with `role: 'staff'`, `pages: { ... }` | Granular per-page permissions: `orders`, `biller`, `inventory`, `stockManager`, `analytics`, `appearance`, `settings`. Restricted strictly to authorized sections. |
| **Tier 4** | **Delivery** | `roles/{email}` with `role: 'delivery'` | Read/update delivery orders (`orderType: 'delivery'`). Can update delivery statuses (`out_for_delivery`, `delivered`) and assign delivery personnel. |
| **Tier 5** | **Customer** | Authenticated Firebase UID (`users/{uid}`) | Read/write own user profile, cart, addresses. Can only read/list orders where `resource.data.userId == request.auth.uid`. Direct order creation/update in Firestore is denied (handled via `/api/place-order` Admin SDK). |
| **Tier 6** | **Guest / POS** | `users/guest` | Guest orders placed via admin POS biller. Biller can write POS transactions to `users/guest`. |

---

## 4. Hosting & Architecture Split (Live Architecture)
* **Customer SPA (`venkys`)**: Firebase Hosting target `venkys-customer` (site: `venkys-durgapur`). Serves static SPA bundle only (`dist/` with catch-all rewrite to `/index.html`).
* **Admin POS SPA (`venkys_admin`)**: Firebase Hosting target `venkys-admin` (site: `venkys-admin`). Serves static SPA bundle only (`dist/` with catch-all rewrite to `/index.html`).
* **Backend API (`api/`)**: Vercel Serverless Functions for API-only execution (`/api/*`). Leftover frontend SPA rewrites (`/(.*) -> index.html`) have been removed to prevent misrouted HTML responses.
* **Shared `apiClient` (`src/utils/apiClient.js`)**:
  * Resolves `VITE_API_BASE_URL` from env (never relative path fallback).
  * Automatically attaches Firebase ID token as `Authorization: Bearer <token>`.
  * Classifies errors into typed results: `{ ok, type: 'network'|'cors'|'auth'|'forbidden'|'server'|'html_response'|'error', status, body, message }`.
  * On HTTP 403, forces one `getIdToken(true)` refresh and retries once before surfacing `'forbidden'`.
  * Detects HTML response bodies where JSON was expected (`html_response` tell).
* **24-Hour CORS Preflight Caching**: All serverless endpoints send `Access-Control-Max-Age: 86400` on OPTIONS responses via `api/lib/cors.js`.

---

## 5. CI/CD Pipeline & Atomic Deployments
* **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
  * Runs on all pushes and PRs to `main` and `prod`.
  * `rules-check`: Asserts `venkys/firestore.rules` === `venkys_admin/firestore.rules`.
  * `validate-venkys` & `validate-venkys-admin`: Parallel lint + build validation.
  * `auto-inject-checklist` & `verify-prod-checklist`: Injects and verifies the incident-specific production release checklist on all PRs targeting `prod`.
  * `deploy-production`: On push to `prod`, executes atomic deployment:
    ```bash
    npx -y firebase-tools deploy --only hosting:venkys-customer,hosting:venkys-admin,firestore --project venky-s-chicken-xperience
    ```

---

## 6. Critical Incident Lessons & Gotchas

### Lesson 1: Firestore Rules Duplication Risk
* `firestore.rules` exists in two workspace locations: `venkys/firestore.rules` and `venkys_admin/firestore.rules`.
* **Gotcha**: Firebase only maintains **one live ruleset** per project (`venky-s-chicken-xperience`). Deploying from either directory overwrites the live rules for both applications.
* **Rule**: Always keep both files 100% byte-for-byte synchronized (`npm run check-rules`).

### Lesson 2: Firebase CLI Multi-Account Scoping
* Firebase CLI maintains session logins per directory or globally across accounts (`familyshoppingworlddgp@gmail.com` vs `venkysdgp@gmail.com`).
* **Gotcha**: Running `firebase deploy` without verifying the active logged-in account can fail or attempt to deploy to the wrong account's project.
* **Rule**: Explicitly check and set active account before deploying:
  ```bash
  firebase login:use venkysdgp@gmail.com
  ```

### Lesson 3: Webhook vs Client Payment Race & Idempotency
* When a customer completes payment via Razorpay, two independent confirmation paths fire:
  1. Client callback (`/api/verify-payment` $\rightarrow$ `/api/notify-order`)
  2. Server-to-server webhook (`/api/razorpay-webhook`)
* **Gotcha**: If a user closes the browser before client verification completes, the order remains stuck in `pending-payment`. If both fire simultaneously, duplicate status histories or double FCM notifications to staff can occur.
* **Rule**:
  * `razorpay-webhook.js` must advance `status` to `placed` ONLY if `order.status === 'pending-payment'`.
  * FCM staff notification must check `!order.staffNotifiedAt` to deduplicate push alerts.
  * In-progress orders (`preparing`, `ready`, `delivered`) must never be reverted by late-arriving webhooks.

### Lesson 4: Customer Order Collection Isolation
* Firestore evaluates `list` queries at the query constraint level.
* **Gotcha**: An open `allow list: if isSignedIn();` rule exposes all customers' names, phone numbers, and addresses.
* **Rule**: Rules must enforce `(isSignedIn() && resource.data.userId == request.auth.uid)` on `list`, and all client queries must explicitly supply `where('userId', '==', user.uid)`.

---

## 7. Restaurant Configuration & Cloning Guide

All restaurant-specific values (branding, location defaults, contact info, receipt printing headers, PWA manifests) are centralized in `src/config/restaurant.config.js` within both `venkys/` and `venkys_admin/`.

### Config Shape (`src/config/restaurant.config.js`):
```javascript
export const RESTAURANT_CONFIG = {
  brand: {
    name: "Venky's Chicken Xperience Durgapur",
    shortName: "Venky's",
    tagline: "...",
    receiptTitle: "Venky's Cheat Mealz",
    receiptSubtitle: "Durgapur, West Bengal",
  },
  location: {
    city: "Durgapur",
    state: "West Bengal",
    country: "India",
    defaultCoordinates: { lat: 23.5204, lng: 87.3119 },
    defaultRadiusKm: 8,
  },
  contact: {
    email: "venkysdgp@gmail.com",
    supportEmail: "venkysdgp@gmail.com",
    phone: "+91 98765 43210",
    address: "City Centre, Durgapur, West Bengal 713216",
  },
  defaults: {
    currency: "₹",
    currencyCode: "INR",
  },
}
```

### Steps to Clone & Redeploy for a New Restaurant:
1. **Update Central Config**:
   * Edit `venkys/src/config/restaurant.config.js` and `venkys_admin/src/config/restaurant.config.js`.
2. **Configure Super Admin (Server-Side / Security Rules Only)**:
   * Edit `superAdminEmail()` in `venkys/firestore.rules` and `venkys_admin/firestore.rules`.
   * Set `SUPER_ADMIN_EMAIL` in Vercel backend environment variables and `VITE_SUPER_ADMIN_EMAIL` in frontend build envs.
   * *Security Reminder*: Vite client bundles are public; superadmin email is kept out of public client configs.
3. **Configure Firebase Infrastructure**:
   * Update `.firebaserc` (default project and hosting target aliases: `venkys-customer`, `venkys-admin`).
   * Update `firebase.json` target names if renamed.
   * Update `.env` / `VITE_FIREBASE_*` credentials.
4. **Configure Vercel API & CORS**:
   * Set `CORS_ORIGIN` env in Vercel with your frontend domain(s) if using custom domains outside standard hosting patterns.
5. **Verify Pre-Deploy**:
   * Run `npm run check-rules`, `npm run lint`, `npm run build`.

