# Venky’s — Single-Restaurant Food Ordering Web App

Fast, modern ordering for a single local restaurant. Built with React + Vite, Tailwind CSS v4, and DaisyUI. Includes PWA, Firebase Auth/Firestore, a POS-style admin, and serverless payment hooks.

Updated: 2025-10-17

## Highlights / Features

- Customer app
	- Category-first menu with image thumbnails and smooth scrolling to sections
	- Categories strip auto-centers the active category when navigating or selecting
	- Smart search with typo tolerance (fuzzy matching) for both categories and items
	- Live filters and sorting:
		- Veg / Non-Veg / All (active states: Veg = green, Non-Veg = red)
		- Sort by Price (Low→High, High→Low) and Name (A→Z, Z→A)
		- Compact Sort dropdown (closes on selection, outside click, or Escape)
	- Cart management with quantities and removal
	- Checkout with address details, optional Google geolocation reverse-fill, and delivery geofence validation
	- Address book with “Set as default”
	- PWA-ready (installable, offline app shell, asset caching)

- Admin / Operations
	- Unified admin at `/admin` with sections for Inventory, Orders, Analytics, Appearance, Settings, and a Biller POS
	- Appearance: custom category ordering and images
	- Store toggle (open/closed)
	- Delivery settings (center + radius) read in checkout validation
	- Messaging testers (WhatsApp/SMS) with a configurable endpoint

- Data & Architecture
	- Firestore-backed data with helpers in `src/lib/data.js` (categories, menu items, orders, user profiles, addresses, settings)
	- Branding constants centralized in the data layer
	- Image fetching optimized and staggered by category to reduce jank
	- Manual chunk splitting for React, Firebase, and vendor libs
	- PWA service worker (injectManifest) with navigation fallback and asset caching

## Current Status

- Production build: OK (Vite 7). You may see a “large chunk” warning for Firebase (~500KB). Manual chunks are configured.
- Filters/sorting: Live, local state. Resets to defaults on page change. “Home” in the bottom dock fully resets the Home page (clears search, filters, and scrolls to top).
- Categories bar: Centers the selected/active category; Home sections align below the sticky header for a dedicated look.
- Search: Fuzzy search (for small typos). Selecting a category result takes you directly to that section on Home.
- Messaging: If WhatsApp/SMS endpoints aren’t configured, send actions are skipped with a visible note.

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

# (Optional) Deploy to Firebase Hosting
npm run deploy
```

## Configuration (.env)

Copy `.env.example` to `.env` and fill in values. Common keys:

- Firebase (client SDK)
	- `VITE_FIREBASE_API_KEY`
	- `VITE_FIREBASE_AUTH_DOMAIN`
	- `VITE_FIREBASE_PROJECT_ID`
	- `VITE_FIREBASE_STORAGE_BUCKET`
	- `VITE_FIREBASE_MESSAGING_SENDER_ID`
	- `VITE_FIREBASE_APP_ID`

- Delivery defaults (optional fallback if Firestore delivery settings are missing)
	- `VITE_DELIVERY_CENTER_LAT`
	- `VITE_DELIVERY_CENTER_LNG`
	- `VITE_DELIVERY_RADIUS_KM`

- Integrations (optional)
	- `VITE_WHATSAPP_FUNCTION_URL` — a server endpoint that sends WhatsApp messages for invoices/notifications

## App Structure (selected)

- Components / UX
	- `src/components/NavBar.jsx` — search with fuzzy matching, theme, account, and location pick
	- `src/components/CategoriesBar.jsx` — horizontally scrollable categories; centers active on navigation
	- `src/components/FilterBar.jsx` — Veg/Non-Veg/All + Sort dropdown
	- `src/components/CartDrawer.jsx`, `src/components/ItemModal.jsx`, `src/components/MenuItemCard.jsx`

- Pages
	- `src/pages/Home.jsx` — menu by category with smooth anchors and live filters/sorts
	- `src/pages/Checkout.jsx` — delivery details, geolocation reverse-fill, geofence validation
	- `src/pages/Admin*.jsx` — inventory, orders, analytics, appearance, settings, and biller

- Data & State
	- `src/lib/firebase.js` — Firebase app/Auth/Firestore init
	- `src/lib/data.js` — Firestore helpers (categories/menu/orders/users/settings, image loading)
	- `src/context/AuthContext.jsx`, `src/context/CartContext.jsx`, `src/context/UIContext.jsx`

- PWA
	- `vite.config.js` (+ `vite-plugin-pwa`) — injectManifest mode
	- `src/sw.js` — custom service worker

## Usage Tips

- Filtering & Sorting
	- Use Veg/Non-Veg/All to narrow results. Active Veg shows green; active Non-Veg shows red.
	- Open the Sort dropdown to choose Price or Name sort; the dropdown closes on selection/outside/Escape.

- Categories
	- Click a category chip (or choose a category from search) to jump to that section on Home. The chip auto-centers in the strip and the section aligns below the sticky header.

- Dock
	- Tap “Home” to fully reset Home (clears search, resets filters/sort, and scrolls to top).
	- Tap “Menu” to scroll to the menu section.

## Vercel Serverless Payment API (Razorpay)

Serverless functions live under `api/`:

Endpoints:
- `POST /api/create-order` — creates a Razorpay order. Body: `{ amount: number, cartChecksum?: string }`.
- `POST /api/verify-payment` — verifies the Razorpay signature and can update Firestore. Body: `{ orderId, paymentId, signature, localOrderId }`.

Required (Vercel > Project Settings > Environment Variables):
- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Firebase: same values as above

Local testing (optional):
1. `npm i razorpay`
2. `npm i -g vercel` then `vercel dev` (or set a Vite proxy)

Security notes:
- Compute `amount` on the server from the authoritative cart (TODO in `create-order`).
- Consider adding Razorpay webhook (`/api/webhook-razorpay`) for redundancy.
- For privileged Firestore writes, prefer Admin SDK on the server (service account via env vars) rather than the client SDK.

## Theming & Styling

- Tailwind CSS v4 via `@tailwindcss/postcss` (already configured)
- DaisyUI themes: `venkys_light` (default) and `venkys_dark`
- If your editor flags `@tailwind`/`@plugin` at-rules, they are build-time handled

## Known Notes / Limitations

- Firebase bundle shows a large-chunk warning (~500 KB) — expected with the client SDK; manual chunks are configured.
- WhatsApp/SMS sending requires configuring `VITE_WHATSAPP_FUNCTION_URL`; otherwise, actions are skipped.
- Some admin operations assume Firestore rules or admin privileges; adjust security rules accordingly.

## Roadmap

- Price range filter (slider) next to Sort
- Code-split admin pages via React.lazy for faster first load
- Emulator-based tests for Firestore rules (orders, cart, addresses)
- Optional webhook for Razorpay `payment.captured`

---

If you hit issues or need a new environment setup, start with `.env.example`, check Firebase rules/indexes, and run `npm run dev` on http://localhost:5173.
