# Project Memory: Venky's Cheat Mealz

## 1. Global Stack Standard Pointer
Authoritative cross-project development and infrastructure standards are documented in:
* `D:/My projects/memory/global/stack-standard.md`

All architectural patterns, hosting conventions, CI/CD designs, and security policies must align with this standard.

---

## 2. Standing Development Rules & Process
1. **Pre-Push Validation**: Always run clean lint and production builds across both workspaces before pushing:
   ```bash
   cd venkys; npm run lint; npm run build
   cd ../venkys_admin; npm run lint; npm run build
   ```
2. **Git Workflow**:
   * All development happens on feature branches or staging branch (`main`).
   * Production deployment occurs exclusively from `prod` branch via CI/CD.
   * Never push broken builds or untested security rules directly to production.
3. **No Direct Secret Commit**: Never commit `.env` files or service account JSON files. Use `.env.example` templates with sanitized placeholders.

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

## 4. Hosting & Architecture Split (Target Standard)
* **Customer SPA (`venkys`)**: Firebase Hosting for static SPA bundle.
* **Admin POS SPA (`venkys_admin`)**: Firebase Hosting for static SPA bundle.
* **Backend API (`api/`)**: Vercel Serverless Functions for API-only execution (Razorpay integration, FCM push, order creation, rate limiting).
* *Note: Separation of frontend hosting from Vercel is queued for execution.*

---

## 5. Critical Incident Lessons & Gotchas

### Lesson 1: Firestore Rules Duplication Risk
* `firestore.rules` exists in two workspace locations: `venkys/firestore.rules` and `venkys_admin/firestore.rules`.
* **Gotcha**: Firebase only maintains **one live ruleset** per project (`venky-s-chicken-xperience`). Deploying from either directory overwrites the live rules for both applications.
* **Rule**: Always keep both files 100% byte-for-byte synchronized (verify via `fc.exe`).

### Lesson 2: Firebase CLI Multi-Account Scoping
* Firebase CLI maintains session logins per directory or globally across accounts (`familyshoppingworlddgp@gmail.com` vs `venkysdgp@gmail.com`).
* **Gotcha**: Running `firebase deploy` without verifying the active logged-in account can fail or attempt to deploy to the wrong account's project.
* **Rule**: Explicitly check and set active account before deploying:
  ```bash
  firebase login:use venkysdgp@gmail.com
  firebase deploy --only firestore:rules --project venky-s-chicken-xperience
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
