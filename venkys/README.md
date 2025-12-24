# Venky's (Customer App)

Customer-facing single-restaurant ordering web app built with React + Vite, Tailwind CSS, and DaisyUI.

It connects to Firebase (Auth + Firestore) for menu, orders, user profiles, addresses, settings, and cart persistence.

Updated: 2025-12-24

## What this app includes

- Menu browsing
  - Category-first menu and smooth scrolling
  - Category strip that tracks/centers the active section
  - Search + filters (Veg/Non-Veg/All) and sorting

- Cart & checkout
  - Quantity controls per item
  - When qty is 1, decrement becomes a bin (remove) action
  - Checkout with address details and delivery radius validation

- Account/profile
  - Firebase Auth
  - Avatar is initial-based (no profile picture dependency)
  - Profile completion banner prompting missing details

- UX infrastructure
  - Toast notifications stacked at bottom-right
  - PWA install support and service worker

## Prerequisites

- Node.js 18+ (recommended)
- A Firebase project with:
  - Authentication enabled
  - Firestore enabled

## Quick start

From the repository root:

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys";
npm install;
npm run dev
```

Vite will print the local dev URL (typically http://localhost:5173).

## Environment variables

Create `venkys/.env` (or copy from your existing environment). Do not commit real secrets.

### Firebase client SDK

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Optional integrations

- `VITE_WHATSAPP_FUNCTION_URL` (server endpoint for WhatsApp messaging)
- `VITE_SMS_FUNCTION_URL` (server endpoint for SMS)

### Delivery defaults (optional fallback)

If Firestore delivery settings are not available, these can act as defaults:

- `VITE_DELIVERY_CENTER_LAT`
- `VITE_DELIVERY_CENTER_LNG`
- `VITE_DELIVERY_RADIUS_KM`

## Scripts

```powershell
npm run dev       # local dev
npm run build     # production build
npm run preview   # preview build output
npm run deploy    # deploy to Firebase Hosting (if configured)
```

## Project structure (high level)

- UI
  - `src/components/MenuItemCard.jsx` item card UI and cart controls
  - `src/components/NavBar.jsx` search + account UI
  - `src/components/CartDrawer.jsx` cart panel
  - `src/components/FloatingCartBar.jsx` mobile cart CTA
  - `src/layouts/Layout.jsx` app shell, toast stack, auth modal

- Pages
  - `src/pages/Home.jsx` menu + search/filter/sort
  - `src/pages/Checkout.jsx` delivery + payment flow

- State & data
  - `src/context/AuthContext.jsx` authentication state
  - `src/context/CartContext.jsx` cart state and persistence
  - `src/context/UIContext.jsx` toasts, item modal state, auth modal state
  - `src/lib/data.js` Firestore helpers
  - `src/lib/firebase.js` Firebase initialization

## Payments (serverless)

If you use Razorpay, serverless endpoints live in `venkys/api/`.

- `POST /api/create-order`
- `POST /api/verify-payment`

Configure Razorpay keys as server-side environment variables in your hosting platform (never in the client).

## Notes

- Firebase client SDK can produce a larger vendor chunk; manual chunking is configured.
- If messaging endpoints are not configured, messaging features should be treated as optional/no-op.
