# Venky's (Customer App)

Customer-facing single-restaurant ordering web app built with React + Vite, Tailwind CSS, and DaisyUI.

Firebase is used for Auth + Firestore data (menu, images, orders, user profile, addresses, settings).

Updated: 2026-01-05

## Features

- Menu browsing
  - Category-based menu
  - Search + veg/non-veg filtering
- Cart & checkout
  - Address selection and validation
  - COD and Razorpay online payment (UPI / Card)
- Account/profile
  - Firebase Auth
  - Initial-based avatar (no profile picture dependency)
- PWA
  - Install prompt + service worker

## Prerequisites

- Node.js 18+ (recommended)
- A Firebase project with:
  - Authentication enabled
  - Firestore enabled

## Local development

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys";
npm install;
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`).

## Environment variables

Create `venkys/.env`. Do not commit real secrets.

### Required (Firebase client SDK)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Payments (Razorpay)

The frontend only needs the public key id.

- `VITE_RAZORPAY_KEY_ID` (optional if you expose it via `/api/public-config`)

Server-side (Vercel project env vars; never in the client):

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

### WhatsApp (optional)

WhatsApp messaging is driven via `/api/send-whatsapp` (Vercel). Configure these server-side in Vercel:

- `WA_TOKEN`
- `WA_PHONE_NUMBER_ID`
- `WA_BUSINESS_ACCOUNT_ID`
- `WA_VERIFY_TOKEN` (used for webhook verification)

### API base override (optional)

By default, API calls in local dev are routed to the production Vercel base for consistency.
You can override the API base:

- `VITE_API_BASE_URL`

## Scripts

```powershell
npm run dev       # local dev
npm run build     # production build
npm run preview   # preview build output
npm run deploy    # deploy Firebase Hosting (customer UI)
```

## Deployment model (important)

This repo uses two deployment targets:

1) **Firebase Hosting** for the UI
2) **Vercel** for serverless endpoints in `api/` (Razorpay + WhatsApp + public-config)

If you deploy only to Firebase, your UI will update but `/api/*` on Vercel will NOT.

### Firebase Hosting (UI)

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys";
npm run deploy
```

### Vercel (API)

Deploy the `venkys` Vercel project so changes in `venkys/api/*` take effect.

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys";
npx vercel --prod
```

## Troubleshooting

- **CORS error from localhost** calling `https://*.vercel.app/api/...`:
  - Your Vercel function must reply to the browser preflight `OPTIONS` with `Access-Control-Allow-Origin`.
  - Ensure `CORS_ORIGIN` includes your dev origin (e.g. `http://localhost:5173`).
- **Razorpay modal opens but verification fails**:
  - Confirm `RAZORPAY_KEY_SECRET` is set in Vercel and `verify-payment` is deployed.

## Project layout

- [src/lib/data.js](src/lib/data.js): Firestore + API helpers
- [src/pages/Checkout.jsx](src/pages/Checkout.jsx): customer payment flow
- [api/create-order.js](api/create-order.js): create Razorpay order
- [api/verify-payment.js](api/verify-payment.js): verify Razorpay signature
- [api/public-config.js](api/public-config.js): exposes public config (Razorpay key id)
