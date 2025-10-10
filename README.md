# Venky's — Single-Restaurant Food Ordering Web App

A lightweight Swiggy/Zomato-style ordering experience for a single local restaurant, built with React + Vite, Tailwind CSS v4, and DaisyUI.

## Tech
- React (JS only)
- Vite
- Tailwind CSS v4 + DaisyUI (two custom themes: `venkys_light`, `venkys_dark`)
- React Router

## Quick Start

```powershell
# From the workspace root
cd "D:\My projects\Venky's_Cheat_Mealz\venkys"

# Start dev server
npm run dev
# Open http://localhost:5173

# Production build
npm run build

# Preview production build
npm run preview
```

## App Structure
- `src/context/CartContext.jsx` — Cart state (add/remove/update/clear, totals)
- `src/context/UIContext.jsx` — UI state for item detail modal
- `src/lib/firebase.js` / `src/lib/data.js` — Firebase init + Firestore helpers
- `src/components/NavBar.jsx` — Top bar + search + cart trigger
- `src/components/CartDrawer.jsx` — DaisyUI drawer for cart contents
- `src/components/ItemModal.jsx` — DaisyUI modal for dish details
- `src/components/MenuItemCard.jsx` — Menu card with View/Add actions
- `src/pages/Home.jsx` — Menu listing by category
- `src/pages/Checkout.jsx` — Cart management + order summary
- `src/index.css` — Tailwind layers + small custom component layer (DaisyUI plugin declared only in config)
- `tailwind.config.js` — DaisyUI plugin + dual custom themes (yellow = primary, red = secondary)
- `postcss.config.js` — Tailwind v4 PostCSS plugin config

## Notes
- Tailwind v4 uses the `@tailwindcss/postcss` plugin. The config is already set.
- DaisyUI is included via the Tailwind config `plugins: [daisyui]` (no `@plugin` directive needed in `index.css`). Do not remove the plugin configuration.
- If your editor flags `@tailwind` / `@plugin` as unknown at-rules, they are handled at build time (safe to ignore).

## Next Ideas
- Capture delivery / address details and store with orders
- Persist cart to localStorage (rehydrate on load)
- Add filters (veg-only, price range) + sorting
- Ratings & reviews per item
- Basic auth (Firebase Auth) and show past orders
- Payment integration & order status tracking

## Vercel Serverless Payment API (Razorpay)

This project now includes Vercel serverless functions in the `api/` folder:

Endpoints:
- `POST /api/create-order` – creates a Razorpay order. Body: `{ amount: number, cartChecksum?: string }`.
- `POST /api/verify-payment` – verifies the Razorpay signature and (optionally) updates Firestore. Body: `{ orderId, paymentId, signature, localOrderId }`.

### Required Environment Variables (Vercel Project Settings)
Set these in Vercel (Project > Settings > Environment Variables). Do NOT commit secrets.

Razorpay:
- `RAZORPAY_KEY_ID` (public key – also expose to client as needed)
- `RAZORPAY_KEY_SECRET` (secret key)

Firebase (matching your existing web config):
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

### Local Testing (Optional)
You can run these API routes locally using Vite dev proxy or `vercel dev`.
1. Install Razorpay dependency if not already: `npm i razorpay`.
2. (Optional) Install Vercel CLI: `npm i -g vercel` then run `vercel dev`.

### Frontend Usage Example
```ts
// Create order
const res = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: cartTotal }) })
const data = await res.json()
// data.orderId -> pass to Razorpay Checkout options
```
After successful payment (in Razorpay handler):
```ts
await fetch('/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature, localOrderId }) })
```

### Security Notes
- Always recompute `amount` server-side from the authoritative cart (TODO in `create-order`).
- Consider adding a webhook endpoint later for redundancy: `/api/webhook-razorpay`.
- If you need unrestricted Firestore admin writes, switch to Firebase Admin SDK using a service account (store credentials in Vercel encrypted env vars) instead of the client SDK.

### Next Steps
- Add webhook function for `payment.captured`.
- Add server-side cart validation & pricing rules.
- Persist `receipt` mapping to local order doc for reconciliation.
