# Venky's Admin (Staff / Operations App)

Standalone admin console for Venky's Cheat Mealz. Built as a separate React + Vite project so it can be deployed independently while sharing the same Firebase project (Auth + Firestore) with the customer app.

Updated: 2026-01-05

## Features

- Role-based access
  - `admin`: full access
  - `staff`: configurable page access + optional default landing page
  - `delivery`: delivery-focused access
- Operational pages
  - Orders
  - Inventory
  - Analytics
  - Appearance
  - Settings (staff management)
- POS / Biller
  - Category tiles + item grid
  - COD and Razorpay online payment
  - Category + item images from Firestore `images` collection
- Orders modal
  - Address display supports both `order.address` and `order.customer.address`
  - 72mm thermal receipt printing (no overflow)

## Prerequisites

- Node.js 18+ (recommended)
- Same Firebase project used by the customer app

## Local development

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys_admin";
npm install;
npm run dev
```

Vite will print the local URL (port may vary if 5173/5174 are already in use).

## Environment variables

Create `venkys_admin/.env` with the same Firebase client values as the customer app.

### Required (Firebase client SDK)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Payments (Razorpay)

Frontend:

- `VITE_RAZORPAY_KEY_ID` (optional if served via `/api/public-config`)

Server-side (Vercel project env vars):

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

### CORS (important for local dev)

Admin calls the Vercel API from your local origin (e.g. `http://localhost:5174`).
If your browser blocks preflight, ensure one of these is true:

- `CORS_ORIGIN` includes your local dev origin, OR
- the deployed Vercel functions allow localhost origins.

### WhatsApp (optional)

Configure these server-side in Vercel for WhatsApp messaging:

- `WA_TOKEN`
- `WA_PHONE_NUMBER_ID`
- `WA_BUSINESS_ACCOUNT_ID`
- `WA_VERIFY_TOKEN`

## Scripts

```powershell
npm run dev       # local dev
npm run build     # production build
npm run preview   # preview build output
npm run deploy    # deploy Firebase Hosting (admin UI)
```

## Deployment model (important)

This repo uses two deployment targets:

1) **Firebase Hosting** for the admin UI
2) **Vercel** for serverless endpoints in `api/` (Razorpay + WhatsApp + public-config)

If you deploy only to Firebase, the UI updates but `/api/*` does not.

### Firebase Hosting (UI)

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys_admin";
npm run deploy
```

### Vercel (API)

Deploy the `venkys_admin` Vercel project so changes in `venkys_admin/api/*` take effect.

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys_admin";
npx vercel --prod
```

## Notes

- Image caching is in-memory only (no localStorage/sessionStorage image blobs).
- Access control must be enforced by Firestore rules; UI gating is not sufficient.

## Project layout

- [src/lib/data.js](src/lib/data.js): Firestore + API helpers
- [src/pages/AdminBiller.jsx](src/pages/AdminBiller.jsx): POS biller + Razorpay flow
- [src/pages/Orders.jsx](src/pages/Orders.jsx): orders workflow + print receipt
- [api/create-order.js](api/create-order.js): create Razorpay order
- [api/verify-payment.js](api/verify-payment.js): verify Razorpay signature
- [api/public-config.js](api/public-config.js): exposes public config (Razorpay key id)