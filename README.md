# Venky's — Single-Restaurant Food Ordering Web App

A lightweight Swiggy/Zomato-style ordering experience for a single local restaurant, built with React + Vite, Tailwind CSS v4, and DaisyUI.

## Tech
- React (JS only)
- Vite
- Tailwind CSS v4 + DaisyUI
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
- `src/index.css` — Tailwind layers (Tailwind v4 + DaisyUI plugin)
- `tailwind.config.js` — DaisyUI + custom theme (yellow/red)
- `postcss.config.js` — Tailwind v4 PostCSS plugin config

## Notes
- Tailwind v4 uses the `@tailwindcss/postcss` plugin. The config is already set.
- DaisyUI is included via the `@plugin` directive inside `index.css` and must remain for styling.
- If your editor flags `@tailwind` / `@plugin` as unknown at-rules, they are handled at build time (safe to ignore).

## Next Ideas
- Capture delivery / address details and store with orders
- Persist cart to localStorage (rehydrate on load)
- Add filters (veg-only, price range) + sorting
- Ratings & reviews per item
- Basic auth (Firebase Auth) and show past orders
- Payment integration & order status tracking
