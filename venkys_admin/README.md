# Venky's Admin (Staff / Operations App)

Standalone admin console for Venky's Cheat Mealz. Built as a separate Vite + React + Tailwind + DaisyUI project so it can be hosted/deployed independently from the customer app, while sharing the same Firebase project (Auth + Firestore).

Updated: 2025-12-24

## What this app includes

- Role-based access
  - `admin`: full access
  - `staff`: operational access (Orders + POS/Biller, plus other configured pages)
  - `delivery`: delivery-only access

- Core operational pages
  - Inventory
  - Orders
  - Analytics
  - Appearance
  - Settings (including staff management)
  - POS / Biller

- POS / Biller UX
  - Category tiles are rounded-square cards
  - Split view on desktop: categories list on the left + items grid on the right
  - Stale-while-revalidate image loading: cached images load instantly; missing images fetch in the background

- UX infrastructure
  - Toast notifications are shown bottom-right
  - Staff Management modal renders via portal so it is fully independent of surrounding layout/z-index
  - Optional “View Mode” toggle for forcing mobile/desktop view in the admin nav

## Prerequisites

- Node.js 18+ (recommended)
- Same Firebase project used by the customer app
- Firestore rules that allow the intended admin operations (or an admin-only environment)

## Quick start

```powershell
cd "D:\My projects\Venky's_Cheat_Mealz\venkys_admin";
npm install;
npm run dev
```

Vite will print the local dev URL (typically http://localhost:5174 or 5173 depending on availability).

## Environment variables

Create `venkys_admin/.env` with the same Firebase client values as the customer app.

### Firebase client SDK

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Optional integrations

- `VITE_WHATSAPP_FUNCTION_URL` (server endpoint for WhatsApp)
- `VITE_SMS_FUNCTION_URL` (server endpoint for SMS)

## Scripts

```powershell
npm run dev       # local dev
npm run build     # production build
npm run preview   # preview build output
npm run deploy    # deploy to Firebase Hosting (if configured)
```

## Project structure (high level)

- Navigation/layout
  - `src/components/AdminNav.jsx` top nav and mobile drawer, view mode toggle
  - `src/layouts/AdminLayout.jsx` toast stack + page wrapper

- Pages
  - `src/pages/Orders.jsx` orders workflow
  - `src/pages/Inventory.jsx` menu/inventory management
  - `src/pages/AdminBiller.jsx` POS biller
  - `src/pages/Settings.jsx` settings + staff management

- Data & state
  - `src/lib/data.js` Firestore helpers
  - `src/lib/firebase.js` Firebase initialization
  - `src/context/AuthContext.jsx` auth + role loading
  - `src/context/UIContext.jsx` toast + confirm state

## Deployment

This project is set up for Firebase Hosting deployment.

- Ensure your Firebase project is configured in `firebase.json`
- Ensure build output matches hosting config
- Run:

```powershell
npm run build;
npm run deploy
```

## Notes

- This admin app reads/writes the same Firestore collections used by the customer app.
- Access control should primarily be enforced by Firestore security rules, not only the UI.