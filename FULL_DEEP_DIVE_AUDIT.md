# Full Deep-Dive Audit

Generated from the local workspace on 2026-03-21 (Asia/Calcutta). Actual secret values from `.env` files are intentionally omitted.

## 1. PROJECT STRUCTURE

### Full file tree excluding node_modules/.git/.next
`$lang
FULL_DEEP_DIVE_AUDIT.md
venkys\.env
venkys\.env.example
venkys\.firebase\hosting.ZGlzdA.cache
venkys\.firebaserc
venkys\.gitignore
venkys\.vercel\project.json
venkys\.vercel\README.txt
venkys\.vscode\settings.json
venkys\.vscode\tasks.json
venkys\api\create-order.js
venkys\api\health.js
venkys\api\lib\rateLimiter.js
venkys\api\lib\verifyAuth.js
venkys\api\public-config.js
venkys\api\send-log-email.js
venkys\api\send-order-messenger.js
venkys\api\send-whatsapp.js
venkys\api\sync-business-profile.js
venkys\api\verify-payment.js
venkys\api\wa-webhook.js
venkys\dist\assets\About-fCOkCCQy.js
venkys\dist\assets\ActiveOrders-BA_f7tmn.js
venkys\dist\assets\CancellationRefunds-CbwFOsmY.js
venkys\dist\assets\Checkout-D9oPgRVP.js
venkys\dist\assets\Contact-DaAbar-d.js
venkys\dist\assets\data-orders-Cdv6JRND.js
venkys\dist\assets\data-settings-1EWaOW1U.js
venkys\dist\assets\deliverySettings-eReOoX9L.js
venkys\dist\assets\firebase-app-DrSJUfkI.js
venkys\dist\assets\firebase-auth-5KHXqHHE.js
venkys\dist\assets\firebase-firestore-r7sBu1DL.js
venkys\dist\assets\Home-BSuAGpyR.js
venkys\dist\assets\index-ByOu_70t.js
venkys\dist\assets\index-DfhPldLW.js
venkys\dist\assets\index-Elxm-YIi.css
venkys\dist\assets\NotFound-CCEUhj0F.js
venkys\dist\assets\Privacy-9ZOtFT2W.js
venkys\dist\assets\Profile-C_9RnM-3.js
venkys\dist\assets\ProfileCompletionAlert-BiB5Eb6E.js
venkys\dist\assets\react-core-Bzgz95E1.js
venkys\dist\assets\react-router-Dx5x3M8N.js
venkys\dist\assets\Shipping-4FdrT46i.js
venkys\dist\assets\Terms-DTOAp3C5.js
venkys\dist\assets\usePlacesAutocomplete-CWBw5VO-.js
venkys\dist\assets\workbox-window.prod.es5-CwtvwXb3.js
venkys\dist\icons\Logo.png
venkys\dist\index.html
venkys\dist\manifest.webmanifest
venkys\dist\sw.js
venkys\eslint.config.js
venkys\firebase.json
venkys\firebase-debug.1.log
venkys\firestore.indexes.json
venkys\firestore.rules
venkys\index.html
venkys\package.json
venkys\package-lock.json
venkys\postcss.config.js
venkys\PRICING_PAYMENT_DETAILS.txt
venkys\public\icons\Logo.png
venkys\README.md
venkys\src\App.jsx
venkys\src\assets\menu.json
venkys\src\assets\Venkys_Menu.xlsx
venkys\src\components\AuthModal.jsx
venkys\src\components\CartDrawer.jsx
venkys\src\components\CategoriesBar.jsx
venkys\src\components\ErrorBoundary.jsx
venkys\src\components\FilterBar.jsx
venkys\src\components\FloatingCartBar.jsx
venkys\src\components\InstallPWA.jsx
venkys\src\components\ItemModal.jsx
venkys\src\components\MenuItemCard.jsx
venkys\src\components\NavBar.jsx
venkys\src\components\PolicyPage.jsx
venkys\src\components\ProfileCompletionAlert.jsx
venkys\src\components\QuickDock.jsx
venkys\src\context\AuthContext.jsx
venkys\src\context\CartContext.jsx
venkys\src\context\UIContext.jsx
venkys\src\hooks\useClickOutside.js
venkys\src\hooks\useDeliveryLocation.js
venkys\src\hooks\usePlacesAutocomplete.js
venkys\src\index.css
venkys\src\layouts\Layout.jsx
venkys\src\lib\data.js
venkys\src\lib\data-cart.js
venkys\src\lib\data-common.js
venkys\src\lib\data-images.js
venkys\src\lib\data-menu.js
venkys\src\lib\data-orders.js
venkys\src\lib\data-payments.js
venkys\src\lib\data-settings.js
venkys\src\lib\data-user.js
venkys\src\lib\deliverySettings.js
venkys\src\lib\firebase.js
venkys\src\lib\formatCurrency.js
venkys\src\lib\google.js
venkys\src\lib\userData.js
venkys\src\lib\whatsapp.js
venkys\src\main.jsx
venkys\src\pages\About.jsx
venkys\src\pages\ActiveOrders.jsx
venkys\src\pages\CancellationRefunds.jsx
venkys\src\pages\Checkout.jsx
venkys\src\pages\Contact.jsx
venkys\src\pages\Home.jsx
venkys\src\pages\NotFound.jsx
venkys\src\pages\Privacy.jsx
venkys\src\pages\Profile.jsx
venkys\src\pages\Shipping.jsx
venkys\src\pages\Terms.jsx
venkys\src\pwa.js
venkys\src\services\location.js
venkys\src\sw.js
venkys\tailwind.config.js
venkys\vercel.json
venkys\vite.config.js
venkys_admin\.env
venkys_admin\.env.example
venkys_admin\.firebase\hosting.ZGlzdA.cache
venkys_admin\.firebaserc
venkys_admin\.gitignore
venkys_admin\.vercel\project.json
venkys_admin\.vercel\README.txt
venkys_admin\api\create-order.js
venkys_admin\api\health.js
venkys_admin\api\lib\rateLimiter.js
venkys_admin\api\lib\verifyAuth.js
venkys_admin\api\public-config.js
venkys_admin\api\send-log-email.js
venkys_admin\api\send-order-messenger.js
venkys_admin\api\send-whatsapp.js
venkys_admin\api\verify-payment.js
venkys_admin\CHANGES_DEC_30_2025.md
venkys_admin\dist\assets\AdminBiller-B-L9sa1B.js
venkys_admin\dist\assets\AdminLayout-DL6dLE33.js
venkys_admin\dist\assets\Analytics-B4eYmupC.js
venkys_admin\dist\assets\Appearance-CdURdu8s.js
venkys_admin\dist\assets\auditLog-cqmfWUkn.js
venkys_admin\dist\assets\AuditLogs-BnzytJUe.js
venkys_admin\dist\assets\data-inventory-DL1hNJ67.js
venkys_admin\dist\assets\data-menu-BBG3VawS.js
venkys_admin\dist\assets\data-orders-e7-RpOoo.js
venkys_admin\dist\assets\data-settings-Qu2eHSCX.js
venkys_admin\dist\assets\data-whatsapp-Ah3jnZ_-.js
venkys_admin\dist\assets\Delivery-DSxGKFZd.js
venkys_admin\dist\assets\firebase-eLxaD6m5.js
venkys_admin\dist\assets\index-BgSwJRkF.css
venkys_admin\dist\assets\index-D1cxtdwt.js
venkys_admin\dist\assets\index-DLQPVccr.js
venkys_admin\dist\assets\Inventory-DzpkmXmS.js
venkys_admin\dist\assets\Orders-7tZkhtpo.js
venkys_admin\dist\assets\react-c5ypKtDW.js
venkys_admin\dist\assets\Settings-CYNlHWc0.js
venkys_admin\dist\assets\StockManager-D1QscjCW.js
venkys_admin\dist\assets\vendor-Df34bj55.js
venkys_admin\dist\assets\workbox-window.prod.es5-CwtvwXb3.js
venkys_admin\dist\favicon.ico
venkys_admin\dist\icons\Logo.png
venkys_admin\dist\index.html
venkys_admin\dist\manifest.webmanifest
venkys_admin\dist\sw.js
venkys_admin\eslint.config.js
venkys_admin\firebase.json
venkys_admin\firestore.indexes.json
venkys_admin\firestore.rules
venkys_admin\index.html
venkys_admin\package.json
venkys_admin\package-lock.json
venkys_admin\postcss.config.js
venkys_admin\PRICING_PAYMENT_DETAILS.txt
venkys_admin\public\favicon.ico
venkys_admin\public\icons\Logo.png
venkys_admin\README.md
venkys_admin\src\App.jsx
venkys_admin\src\components\AdminNav.jsx
venkys_admin\src\components\AuthModal.jsx
venkys_admin\src\components\AuthSkeleton.jsx
venkys_admin\src\components\ErrorBoundary.jsx
venkys_admin\src\components\InstallPWA.jsx
venkys_admin\src\context\AuthContext.jsx
venkys_admin\src\context\UIContext.jsx
venkys_admin\src\index.css
venkys_admin\src\layouts\AdminLayout.jsx
venkys_admin\src\lib\auditLog.js
venkys_admin\src\lib\data.js
venkys_admin\src\lib\data-cart.js
venkys_admin\src\lib\data-common.js
venkys_admin\src\lib\data-images.js
venkys_admin\src\lib\data-inventory.js
venkys_admin\src\lib\data-menu.js
venkys_admin\src\lib\data-orders.js
venkys_admin\src\lib\data-payments.js
venkys_admin\src\lib\data-settings.js
venkys_admin\src\lib\data-staff.js
venkys_admin\src\lib\data-user.js
venkys_admin\src\lib\data-whatsapp.js
venkys_admin\src\lib\deliverySettings.js
venkys_admin\src\lib\firebase.js
venkys_admin\src\lib\rawbtPrint.js
venkys_admin\src\lib\storeStatus.js
venkys_admin\src\lib\userData.js
venkys_admin\src\main.jsx
venkys_admin\src\pages\AdminBiller.jsx
venkys_admin\src\pages\Analytics.jsx
venkys_admin\src\pages\Appearance.jsx
venkys_admin\src\pages\AuditLogs.jsx
venkys_admin\src\pages\Delivery.jsx
venkys_admin\src\pages\Inventory.jsx
venkys_admin\src\pages\Orders.jsx
venkys_admin\src\pages\Settings.jsx
venkys_admin\src\pages\StockManager.jsx
venkys_admin\src\sw.js
venkys_admin\tailwind.config.js
venkys_admin\vercel.json
venkys_admin\vite.config.js
```

### Framework / language / package manager / build tool detection
`$lang
- Repo shape: monorepo-like folder with two sibling apps: `venkys` (customer app) and `venkys_admin` (admin/POS app).
- Framework: React 19 with React Router 7 in both apps.
- Language: JavaScript / JSX (ES modules, `type: module`).
- Package manager: npm (`package-lock.json` present in both apps).
- Build tool: Vite 7.
- CSS/tooling: Tailwind CSS 4 + DaisyUI 5 + PostCSS.
- PWA tooling: `vite-plugin-pwa` with `injectManifest` and custom `src/sw.js` in both apps.
- Backend/runtime: Vercel-style serverless functions under each app’s `api/` folder; Firebase client SDK + Firebase Admin SDK; Firestore rules and indexes checked into repo.
```

## 2. PACKAGE ANALYSIS

### venkys package.json (venkys/package.json)
`$lang
{
  "name": "venkys",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "npm run build && npx firebase deploy --only hosting:venkys-durgapur"
  },
  "dependencies": {
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.36.2",
    "daisyui": "^5.1.24",
    "firebase": "^12.3.0",
    "firebase-admin": "^13.6.0",
    "nodemailer": "^7.0.12",
    "razorpay": "^2.9.6",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-icons": "^5.2.1",
    "react-router-dom": "^7.9.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@tailwindcss/postcss": "^4.1.13",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.3",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.36.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "firebase-tools": "^13.0.0",
    "globals": "^16.4.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.13",
    "vite": "^7.1.7",
    "vite-plugin-pwa": "^1.0.3"
  }
}

```

### venkys_admin package.json (venkys_admin/package.json)
`$lang
{
  "name": "venkys_admin",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "npm run build && npx firebase deploy --only hosting:venkys-admin"
  },
  "dependencies": {
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.36.2",
    "daisyui": "^5.1.24",
    "firebase": "^12.3.0",
    "firebase-admin": "^13.6.1",
    "nodemailer": "^7.0.12",
    "razorpay": "^2.9.6",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-icons": "^5.2.1",
    "react-router-dom": "^7.9.3",
    "recharts": "^2.15.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@tailwindcss/postcss": "^4.1.13",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.3",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.36.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "firebase-tools": "^13.0.0",
    "globals": "^16.4.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.13",
    "vite": "^7.1.7",
    "vite-plugin-pwa": "^1.0.3"
  }
}

```

### venkys npm ls --depth=0
`$lang
venkys@0.0.0 D:\My projects\Venky's_Cheat_Mealz\venkys
+-- @eslint/js@9.38.0
+-- @tailwindcss/postcss@4.1.14
+-- @types/d3-array@3.2.2 extraneous
+-- @types/d3-color@3.1.3 extraneous
+-- @types/d3-ease@3.0.2 extraneous
+-- @types/d3-interpolate@3.0.4 extraneous
+-- @types/d3-path@3.1.1 extraneous
+-- @types/d3-scale@4.0.9 extraneous
+-- @types/d3-shape@3.1.7 extraneous
+-- @types/d3-time@3.0.4 extraneous
+-- @types/d3-timer@3.0.2 extraneous
+-- @types/react-dom@19.2.2
+-- @types/react@19.2.2
+-- @upstash/ratelimit@2.0.8
+-- @upstash/redis@1.36.2
+-- @vitejs/plugin-react@5.0.4
+-- autoprefixer@10.4.21
+-- clsx@2.1.1 extraneous
+-- d3-array@3.2.4 extraneous
+-- d3-color@3.1.0 extraneous
+-- d3-ease@3.0.1 extraneous
+-- d3-format@3.1.0 extraneous
+-- d3-interpolate@3.0.1 extraneous
+-- d3-path@3.1.0 extraneous
+-- d3-scale@4.0.2 extraneous
+-- d3-shape@3.2.0 extraneous
+-- d3-time-format@4.1.0 extraneous
+-- d3-time@3.1.0 extraneous
+-- d3-timer@3.0.1 extraneous
+-- daisyui@5.3.7
+-- decimal.js-light@2.5.1 extraneous
+-- dom-helpers@5.2.1 extraneous
+-- eslint-plugin-react-hooks@5.2.0
+-- eslint-plugin-react-refresh@0.4.24
+-- eslint@9.38.0
+-- eventemitter3@4.0.7 extraneous
+-- fast-equals@5.3.2 extraneous
+-- firebase-admin@13.6.0
+-- firebase-tools@13.35.1
+-- firebase@12.4.0
+-- globals@16.4.0
+-- internmap@2.0.3 extraneous
+-- loose-envify@1.4.0 extraneous
+-- nodemailer@7.0.12
+-- postcss@8.5.6
+-- prop-types@15.8.1 extraneous
+-- razorpay@2.9.6
+-- react-dom@19.2.0
+-- react-icons@5.5.0
+-- react-is@18.3.1 extraneous
+-- react-router-dom@7.9.4
+-- react-smooth@4.0.4 extraneous
+-- react-transition-group@4.4.5 extraneous
+-- react@19.2.0
+-- recharts-scale@0.4.5 extraneous
+-- recharts@2.15.4 extraneous
+-- tailwindcss@4.1.14
+-- tiny-invariant@1.3.3 extraneous
+-- victory-vendor@36.9.2 extraneous
+-- vite-plugin-pwa@1.1.0
`-- vite@7.1.10
```

### venkys_admin npm ls --depth=0
`$lang
venkys_admin@0.0.1 D:\My projects\Venky's_Cheat_Mealz\venkys_admin
+-- @eslint/js@9.36.0
+-- @tailwindcss/postcss@4.1.13
+-- @types/react-dom@19.1.9
+-- @types/react@19.1.14
+-- @upstash/ratelimit@2.0.8
+-- @upstash/redis@1.36.2
+-- @vitejs/plugin-react@5.0.4
+-- autoprefixer@10.4.21
+-- daisyui@5.1.24
+-- eslint-plugin-react-hooks@5.2.0
+-- eslint-plugin-react-refresh@0.4.22
+-- eslint@9.36.0
+-- firebase-admin@13.6.1
+-- firebase-tools@13.35.1
+-- firebase@12.3.0
+-- globals@16.4.0
+-- nodemailer@7.0.12
+-- postcss@8.5.6
+-- razorpay@2.9.6
+-- react-dom@19.1.1
+-- react-icons@5.5.0
+-- react-router-dom@7.9.3
+-- react@19.1.1
+-- recharts@2.15.4
+-- tailwindcss@4.1.13
+-- vite-plugin-pwa@1.0.3
`-- vite@7.1.7
```

### venkys package-lock.json root section
`$lang
{
  "name": "venkys",
  "version": "0.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "venkys",
      "version": "0.0.0",
      "dependencies": {
        "daisyui": "^5.1.24",
        "firebase": "^12.3.0",
        "nodemailer": "^7.0.12",
        "razorpay": "^2.9.6",
        "react": "^19.1.1",
        "react-dom": "^19.1.1",
        "react-icons": "^5.2.1",
        "react-router-dom": "^7.9.3",
        "recharts": "^2.15.4"
      },
      "devDependencies": {
        "@eslint/js": "^9.36.0",
        "@tailwindcss/postcss": "^4.1.13",
        "@types/react": "^19.1.13",
        "@types/react-dom": "^19.1.9",
        "@upstash/ratelimit": "^2.0.8",
        "@upstash/redis": "^1.36.2",
        "@vitejs/plugin-react": "^5.0.3",
        "autoprefixer": "^10.4.21",
        "eslint": "^9.36.0",
        "eslint-plugin-react-hooks": "^5.2.0",
        "eslint-plugin-react-refresh": "^0.4.20",
        "firebase-admin": "^13.6.0",
        "firebase-tools": "^13.0.0",
        "globals": "^16.4.0",
        "postcss": "^8.5.6",
        "tailwindcss": "^4.1.13",
        "vite": "^7.1.7",
        "vite-plugin-pwa": "^1.0.3"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz",
      "integrity": "sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@apidevtools/json-schema-ref-parser": {
      "version": "9.1.2",
      "resolved": "https://registry.npmjs.org/@apidevtools/json-schema-ref-parser/-/json-schema-ref-parser-9.1.2.tgz",
      "integrity": "sha512-r1w81DpR+KyRWd3f+rk6TNqMgedmAxZP5v5KWlXQWlgMUUtyEJch0DKEci1SorPMiSeM8XPl7MZ3miJ60JIpQg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jsdevtools/ono": "^7.1.3",
        "@types/json-schema": "^7.0.6",
        "call-me-maybe": "^1.0.1",
        "js-yaml": "^4.1.0"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.27.1.tgz",
      "integrity": "sha512-cjQ7ZlQ0Mv3b47hABuTevyTuYN4i+loJKGeV9flcCgIK37cCXRh+L1bd3iBHlynerhQ7BhCkn2BPbQUL+rGqFg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.27.1",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.28.4.tgz",
      "integrity": "sha512-YsmSKC29MJwf0gF8Rjjrg5LQCmyh+j/nD8/eP7f+BeoQTKYqs9RoWbjGOdy0+1Ekr68RJZMUOPVQaQisnIo4Rw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.28.4.tgz",
      "integrity": "sha512-2BCOP7TN8M+gVDj7/ht3hsaO/B/n5oDbiAyyvnRlNOs+u1o+JWNYTQrmpuNp1/Wq2gcFrI01JAW+paEKDMx/CA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/generator": "^7.28.3",
        "@babel/helper-compilation-targets": "^7.27.2",
        "@babel/helper-module-transforms": "^7.28.3",
        "@babel/helpers": "^7.28.4",
        "@babel/parser": "^7.28.4",
        "@babel/template": "^7.27.2",
        "@babel/traverse": "^7.28.4",
        "@babel/types": "^7.28.4",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.28.3",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.28.3.tgz",
      "integrity": "sha512-3lSpxGgvnmZznmBkCRnVREPUFJv2wrv9iAoFDvADJc0ypmdOxdUtcLeBgBJ6zE0PMeTKnxeQzyk0xTBq4Ep7zw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.28.3",
        "@babel/types": "^7.28.2",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
```

### venkys_admin package-lock.json root section
`$lang
{
  "name": "venkys_admin",
  "version": "0.0.1",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "venkys_admin",
      "version": "0.0.1",
      "dependencies": {
        "daisyui": "^5.1.24",
        "firebase": "^12.3.0",
        "nodemailer": "^7.0.12",
        "razorpay": "^2.9.6",
        "react": "^19.1.1",
        "react-dom": "^19.1.1",
        "react-icons": "^5.2.1",
        "react-router-dom": "^7.9.3",
        "recharts": "^2.15.4"
      },
      "devDependencies": {
        "@eslint/js": "^9.36.0",
        "@tailwindcss/postcss": "^4.1.13",
        "@types/react": "^19.1.13",
        "@types/react-dom": "^19.1.9",
        "@upstash/ratelimit": "^2.0.8",
        "@upstash/redis": "^1.36.2",
        "@vitejs/plugin-react": "^5.0.3",
        "autoprefixer": "^10.4.21",
        "eslint": "^9.36.0",
        "eslint-plugin-react-hooks": "^5.2.0",
        "eslint-plugin-react-refresh": "^0.4.20",
        "firebase-admin": "^13.6.1",
        "firebase-tools": "^13.0.0",
        "globals": "^16.4.0",
        "postcss": "^8.5.6",
        "tailwindcss": "^4.1.13",
        "vite": "^7.1.7",
        "vite-plugin-pwa": "^1.0.3"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz",
      "integrity": "sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@apidevtools/json-schema-ref-parser": {
      "version": "9.1.2",
      "resolved": "https://registry.npmjs.org/@apidevtools/json-schema-ref-parser/-/json-schema-ref-parser-9.1.2.tgz",
      "integrity": "sha512-r1w81DpR+KyRWd3f+rk6TNqMgedmAxZP5v5KWlXQWlgMUUtyEJch0DKEci1SorPMiSeM8XPl7MZ3miJ60JIpQg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jsdevtools/ono": "^7.1.3",
        "@types/json-schema": "^7.0.6",
        "call-me-maybe": "^1.0.1",
        "js-yaml": "^4.1.0"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.27.1.tgz",
      "integrity": "sha512-cjQ7ZlQ0Mv3b47hABuTevyTuYN4i+loJKGeV9flcCgIK37cCXRh+L1bd3iBHlynerhQ7BhCkn2BPbQUL+rGqFg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.27.1",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.28.4.tgz",
      "integrity": "sha512-YsmSKC29MJwf0gF8Rjjrg5LQCmyh+j/nD8/eP7f+BeoQTKYqs9RoWbjGOdy0+1Ekr68RJZMUOPVQaQisnIo4Rw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.28.4.tgz",
      "integrity": "sha512-2BCOP7TN8M+gVDj7/ht3hsaO/B/n5oDbiAyyvnRlNOs+u1o+JWNYTQrmpuNp1/Wq2gcFrI01JAW+paEKDMx/CA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/generator": "^7.28.3",
        "@babel/helper-compilation-targets": "^7.27.2",
        "@babel/helper-module-transforms": "^7.28.3",
        "@babel/helpers": "^7.28.4",
        "@babel/parser": "^7.28.4",
        "@babel/template": "^7.27.2",
        "@babel/traverse": "^7.28.4",
        "@babel/types": "^7.28.4",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.28.3",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.28.3.tgz",
      "integrity": "sha512-3lSpxGgvnmZznmBkCRnVREPUFJv2wrv9iAoFDvADJc0ypmdOxdUtcLeBgBJ6zE0PMeTKnxeQzyk0xTBq4Ep7zw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.28.3",
        "@babel/types": "^7.28.2",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
```

### Package analysis notes
`$lang
- `venkys/package-lock.json` root metadata does not match `venkys/package.json`:
  - lock root includes `recharts`, but `venkys/package.json` does not declare it.
  - lock root places `@upstash/ratelimit`, `@upstash/redis`, and `firebase-admin` under `devDependencies`, while `venkys/package.json` places them under `dependencies`.
  - This strongly suggests the customer lockfile is stale or copied/merged from the admin app at some point.
- `npm ls --depth=0` for `venkys` shows many `extraneous` packages (`recharts`, d3 packages, clsx, react-smooth, etc.). That is a concrete signal that `venkys/node_modules` is out of sync with `venkys/package.json`.
- Cross-app version drift exists:
  - `firebase-admin`: customer `^13.6.0`, admin `^13.6.1`.
  - `vite-plugin-pwa`: customer currently resolves to `1.1.0`, admin is still `1.0.3`.
  - several caret-ranged packages resolve to different installed patch/minor levels across apps.
- No explicit deprecation warnings were emitted by `npm ls`, but dependency hygiene is inconsistent.
```

## 3. PWA CONFIGURATION

### Built customer manifest.webmanifest (venkys/dist/manifest.webmanifest)
`$lang
{"name":"Venky’s Chicken Xperience Durgapur","short_name":"Venky’s","description":"Local food ordering with a fast POS for billers.","start_url":"/","display":"standalone","background_color":"#ffffff","theme_color":"#facc15","lang":"en","scope":"/","icons":[{"src":"icons/Logo.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icons/Logo.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}

```

### Built admin manifest.webmanifest (venkys_admin/dist/manifest.webmanifest)
`$lang
{"name":"Venky's Admin","short_name":"VenkyAdmin","description":"Admin dashboard and POS for Venky's","start_url":"/","display":"standalone","background_color":"#ffffff","theme_color":"#facc15","lang":"en","scope":"/","icons":[{"src":"icons/Logo.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icons/Logo.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}

```

### Customer vite.config.js (PWA config included) (venkys/vite.config.js)
`$lang
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// __dirname replacement in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_DEV_API_BASE_URL || env.VITE_API_BASE_URL || 'http://localhost:3000'
  return {
    build: {
      // Enable minification and tree-shaking
      minify: 'esbuild',
      cssMinify: 'esbuild',
      target: 'es2020',
      // Increase chunk size warning limit (Firebase is large)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Better code splitting for faster initial load
          // NOTE: react-icons and recharts are NOT listed here so Vite can tree-shake them
          manualChunks: {
            'react-core': ['react', 'react-dom'],
            'react-router': ['react-router-dom'],
            'firebase-app': ['firebase/app'],
            'firebase-auth': ['firebase/auth'],
            'firebase-firestore': ['firebase/firestore'],
          }
        }
      },
      // Disable source maps in production
      sourcemap: false,
    },
    resolve: {
      // Ensure a single React instance across the app to avoid "Invalid hook call"
      alias: {
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/Logo.png', 'favicon.ico'],
        manifest: {
          name: 'Venky’s Chicken Xperience Durgapur',
          short_name: 'Venky’s',
          description: 'Local food ordering with a fast POS for billers.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#facc15',
          icons: [
            { src: 'icons/Logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/Logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        // We register the SW manually via virtual:pwa-register in src/main.jsx
        injectRegister: null,
        devOptions: {
          enabled: true,
        },
      }),
    ],
  }
})

```

### Admin vite.config.js (PWA config included) (venkys_admin/vite.config.js)
`$lang
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  server: {
    proxy: {
      // Vite doesn't serve Vercel-style /api routes. In dev, run `vercel dev` (default :3000)
      // and proxy these calls so buttons like "Sync Now" work locally.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  css: {
    // Disable Lightning CSS to avoid optimizer warnings like
    // "Unknown at rule: @property" coming from some UI libs (e.g., radial-progress)
    lightningcss: false,
    // Use the PostCSS pipeline
    transformer: 'postcss',
  },
  build: {
    // Use esbuild for CSS minification to avoid warnings from Lightning CSS
    // like "Unknown at rule: @property" coming from certain UI libraries.
    cssMinify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
  // The Analytics/Recharts chunk is lazily loaded and consistently sits just above
  // Vite's default 500 kB warning threshold. Raising the limit keeps the build
    // output noise-free while the bulk of the app still ships much smaller chunks.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // NOTE: react-icons is NOT listed here so Vite can tree-shake unused icons
        manualChunks: {
          react: ['react','react-dom'],
          firebase: ['firebase/app','firebase/auth','firebase/firestore'],
          vendor: ['react-router-dom']
        }
      }
    }
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/Logo.png', 'favicon.ico'],
      manifest: {
        name: "Venky's Admin",
        short_name: 'VenkyAdmin',
        description: 'Admin dashboard and POS for Venky\'s',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#facc15',
        icons: [
          { src: 'icons/Logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/Logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: null,
      devOptions: { enabled: true },
    }),
  ],
})

```

### Customer service worker (venkys/src/sw.js)
`$lang
// sw — Custom service worker for offline caching (injectManifest)
// Caches app shell, precaches build assets via injected manifest, with navigation fallback.

const CACHE = 'venkys-pwa-v2'
const APP_SHELL = ['/', '/index.html']
// This array is replaced at build time by vite-plugin-pwa (workbox-inject-manifest)
const WB_MANIFEST = self.__WB_MANIFEST || []
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // Precache build assets from injected manifest
      const urls = WB_MANIFEST.map((e) => e.url)
  try { await cache.addAll([...APP_SHELL, ...urls]) } catch { /* noop */ }
    })()
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete old cache buckets
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => (k === CACHE ? undefined : caches.delete(k))))
      // Evict stale entries from current cache
      const cache = await caches.open(CACHE)
      const requests = await cache.keys()
      const now = Date.now()
      await Promise.all(
        requests.map(async (req) => {
          const res = await cache.match(req)
          if (!res) return
          const dateHeader = res.headers.get('date')
          if (dateHeader && now - new Date(dateHeader).getTime() > MAX_CACHE_AGE) {
            await cache.delete(req)
          }
        })
      )
    })()
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Skip caching for API calls and external resources
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req).catch(() => new Response('Network error', { status: 503 })))
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Only cache essential static assets (CSS, JS, icons, fonts)
  // Exclude large images from menu items to save storage
  if (url.pathname.match(/\.(?:css|js|woff2?|ttf|eot)$/) || url.pathname.includes('/icons/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
      })
    )
    return
  }

  // For everything else, network-first
  event.respondWith(fetch(req).catch(() => caches.match(req)))
})

```

### Admin service worker (venkys_admin/src/sw.js)
`$lang
// sw — Admin service worker for offline caching
const CACHE = 'venkys-admin-pwa-v2'
const APP_SHELL = ['/', '/index.html']
const WB_MANIFEST = self.__WB_MANIFEST || []
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const urls = WB_MANIFEST.map((e) => e.url)
  try { await cache.addAll([...APP_SHELL, ...urls]) } catch { /* noop */ }
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => (k === CACHE ? undefined : caches.delete(k))))
      // Evict stale entries from current cache
      const cache = await caches.open(CACHE)
      const requests = await cache.keys()
      const now = Date.now()
      await Promise.all(
        requests.map(async (req) => {
          const res = await cache.match(req)
          if (!res) return
          const dateHeader = res.headers.get('date')
          if (dateHeader && now - new Date(dateHeader).getTime() > MAX_CACHE_AGE) {
            await cache.delete(req)
          }
        })
      )
    })()
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Skip caching for API calls, cross-origin audio/media, and external resources
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || 
      (req.destination === 'audio' || /\.(?:mp3|wav|ogg)(?:\?|$)/i.test(url.pathname))) {
    event.respondWith(fetch(req).catch(() => new Response('Network error', { status: 503 })))
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/index.html')))
    return
  }
  
  // Only cache essential static assets (CSS, JS, icons, fonts)
  // Exclude menu item images to save storage
  if (url.pathname.match(/\.(?:css|js|woff2?|ttf|eot)$/) || url.pathname.includes('/icons/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
      })
    )
    return
  }
  
  // For everything else, network-first
  event.respondWith(fetch(req).catch(() => caches.match(req)))
})

```

### Customer PWA hooks (venkys/src/pwa.js)
`$lang
// pwa — PWA install prompt hooks and update handlers
export function setupPWAHooks() {
  // Listen for the beforeinstallprompt event (Android/Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent mini-infobar
    e.preventDefault()
    // You can store this event and show your own Install UI
    window.__pwaInstallPrompt = e
  })

  // Notify when app is ready offline
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed')
  })
}

```

### Customer InstallPWA component (venkys/src/components/InstallPWA.jsx)
`$lang
// InstallPWA — PWA install banner prompt
import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [offset, setOffset] = useState(72)

  useEffect(() => {
    function onBip(e) {
      e.preventDefault()
      setPromptEvent(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    // If already installed (standalone), hide
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false)
    }
    // measure dock height
    const measure = () => {
      const el = document.getElementById('quick-dock-bar')
      if (el) {
        const h = el.getBoundingClientRect().height
        setOffset(Math.max(56, h + 12))
      } else {
        setOffset(72)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    const ro = (window.ResizeObserver ? new ResizeObserver(measure) : null)
    if (ro) {
      const el = document.getElementById('quick-dock-bar')
      if (el) ro.observe(el)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('resize', measure)
      if (ro) ro.disconnect()
    }
  }, [])

  if (!canInstall || !promptEvent) return null

  return (
    <div className="fixed right-3 z-[95]" style={{ bottom: offset }}>
      <button
        className="btn btn-primary shadow-lg strobe"
        onClick={async () => {
          try {
            await promptEvent.prompt()
            await promptEvent.userChoice
            setCanInstall(false)
            setPromptEvent(null)
          } catch { /* noop */ }
        }}
      >Install app</button>
    </div>
  )
}

```

### Admin InstallPWA component (venkys_admin/src/components/InstallPWA.jsx)
`$lang
// InstallPWA — PWA install banner prompt
import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    function onBip(e) {
      e.preventDefault()
      setPromptEvent(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    
    // If already installed (standalone), hide
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
    }
  }, [])

  if (!canInstall || !promptEvent) return null

  return (
    <div className="fixed right-4 bottom-4 z-[95]">
      <button
        className="btn btn-primary shadow-lg strobe"
        onClick={async () => {
          try {
            await promptEvent.prompt()
            await promptEvent.userChoice
            setCanInstall(false)
            setPromptEvent(null)
          } catch { /* noop */ }
        }}
      >Install app</button>
    </div>
  )
}

```

### PWA findings
`$lang
- No standalone source `manifest.json` / `manifest.webmanifest` exists in `src` or `public`; manifests are generated by `vite-plugin-pwa` and visible in `dist/manifest.webmanifest`.
- Offline strategy in both apps is a custom cache-first/static-assets + network-first/navigation worker implemented in `src/sw.js`.
- API calls (`/api/*`) are intentionally excluded from cache in both service workers.
- Customer app manually wires `beforeinstallprompt` via both `src/pwa.js` and `src/components/InstallPWA.jsx`.
- Admin app handles install prompt only through `src/components/InstallPWA.jsx`.
- Push notifications are not implemented: no `PushManager`, no `Notification.requestPermission()`, no `showNotification()`, and no Firebase Messaging runtime usage outside dependency presence in the lockfile.
```

## 4. ENVIRONMENT & CONFIG

### venkys .env.example (venkys/.env.example)
`$lang
# Example environment variables (copy to Vercel project settings, not committed with secrets)

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Firebase (public config)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef123456

# WhatsApp Cloud API (server)
# Configure these in your hosting provider (e.g., Vercel) project settings
WA_TOKEN=__SET_IN_VERCEL_PROJECT_SETTINGS__
WA_PHONE_NUMBER_ID=1462117938401455
WA_VERIFY_TOKEN=__SET_IN_VERCEL__

# Frontend env vars (Vite) - point these to your deployed serverless endpoints
VITE_WHATSAPP_FUNCTION_URL=https://venkys.vercel.app/api/send-whatsapp
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Optional: Delivery geofence (frontend hints only; enforce on server for security)
# Center coordinates for service area (defaults point near Durgapur if unset)
VITE_DELIVERY_CENTER_LAT=23.5204
VITE_DELIVERY_CENTER_LNG=87.3119
# Service radius in kilometers
VITE_DELIVERY_RADIUS_KM=8

# Optional: Server CORS allowlist (set in Vercel Project Settings → Env)
# CORS_ORIGIN=https://your-site.web.app, https://your-site.firebaseapp.com

```

### venkys_admin .env.example (venkys_admin/.env.example)
`$lang
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Optional messaging endpoints
VITE_WHATSAPP_FUNCTION_URL=

```

### All process.env / import.meta.env references
`$lang
venkys\api\create-order.js:18:  key_id: process.env.RAZORPAY_KEY_ID,
venkys\api\create-order.js:19:  key_secret: process.env.RAZORPAY_KEY_SECRET
venkys\api\create-order.js:24:  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
venkys\api\create-order.js:107:  const allow = process.env.CORS_ORIGIN || ''
venkys\api\health.js:7:  const allow = process.env.CORS_ORIGIN || '*'
venkys\api\public-config.js:30:  const razorpayKeyId = (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim()
venkys\api\send-log-email.js:19:  const allow = process.env.CORS_ORIGIN || ''
venkys\api\send-log-email.js:46:    const emailUser = process.env.EMAIL_USER
venkys\api\send-log-email.js:47:    const emailPass = process.env.EMAIL_PASS
venkys\api\send-log-email.js:48:    const emailRecipient = process.env.LOG_EMAIL_RECIPIENT
venkys\api\send-order-messenger.js:13:  const allow = process.env.CORS_ORIGIN || ''
venkys\api\send-order-messenger.js:47:    const token = (process.env.WA_TOKEN || '').trim()
venkys\api\send-order-messenger.js:48:    const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim()
venkys\api\send-order-messenger.js:74:    const templateName = (process.env.WA_TEMPLATE_ORDER_MESSENGER_NAME || 'venkys_order_messenger').trim()
venkys\api\send-order-messenger.js:75:    const templateLang = (process.env.WA_TEMPLATE_ORDER_MESSENGER_LANG || 'en').trim()
venkys_admin\api\create-order.js:19:  const allow = process.env.CORS_ORIGIN || ''
venkys_admin\api\create-order.js:45:    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
venkys_admin\api\create-order.js:46:    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
venkys_admin\vite.config.js:16:        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
venkys\api\sync-business-profile.js:13:  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
venkys\api\sync-business-profile.js:107:  const allow = process.env.CORS_ORIGIN || ''
venkys\api\sync-business-profile.js:138:    const apiKey = process.env.GOOGLE_PLACES_API_KEY
venkys\api\wa-webhook.js:16:  const appSecret = process.env.WA_APP_SECRET
venkys\api\wa-webhook.js:43:    const verify = process.env.WA_VERIFY_TOKEN || ''
venkys_admin\api\public-config.js:30:  const razorpayKeyId = (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim()
venkys\api\send-whatsapp.js:13:  const allow = process.env.CORS_ORIGIN || ''
venkys\api\send-whatsapp.js:43:  const token = (process.env.WA_TOKEN || '').trim()
venkys\api\send-whatsapp.js:44:  const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim()
venkys\api\send-whatsapp.js:97:      const fallbackName = process.env.WA_TEMPLATE_DEFAULT_NAME || 'hello_world'
venkys\api\send-whatsapp.js:98:      const fallbackLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
venkys\api\send-whatsapp.js:120:      const defaultLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
venkys_admin\api\send-log-email.js:19:  const allow = process.env.CORS_ORIGIN || ''
venkys_admin\api\send-log-email.js:46:    const emailUser = process.env.EMAIL_USER
venkys_admin\api\send-log-email.js:47:    const emailPass = process.env.EMAIL_PASS
venkys_admin\api\send-log-email.js:48:    const emailRecipient = process.env.LOG_EMAIL_RECIPIENT
venkys\api\verify-payment.js:19:  const allow = process.env.CORS_ORIGIN || ''
venkys\api\verify-payment.js:48:    const secret = process.env.RAZORPAY_KEY_SECRET
venkys\api\lib\rateLimiter.js:31:  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim()
venkys\api\lib\rateLimiter.js:32:  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
venkys\api\lib\rateLimiter.js:87:const KILL_SWITCH_ENABLED = process.env.API_KILL_SWITCH === '1' || process.env.API_KILL_SWITCH === 'true'
venkys\api\lib\rateLimiter.js:88:const KILL_SWITCH_REASON = process.env.API_KILL_SWITCH_REASON || 'API temporarily disabled for maintenance'
venkys\api\lib\rateLimiter.js:91:const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === '1' || process.env.RATE_LIMIT_DISABLED === 'true'
venkys\api\lib\rateLimiter.js:153:    const baseUrl = process.env.VERCEL_URL 
venkys\api\lib\rateLimiter.js:154:      ? `https://${process.env.VERCEL_URL}` 
venkys\api\lib\rateLimiter.js:161:        ...(process.env.API_INTERNAL_SECRET ? { 'X-Internal-Secret': process.env.API_INTERNAL_SECRET } : {})
venkys\api\lib\rateLimiter.js:180:  if (process.env.NODE_ENV !== 'production' && !process.env.LOG_RATE_LIMITS) {
venkys_admin\api\send-order-messenger.js:13:  const allow = process.env.CORS_ORIGIN || '*'
venkys_admin\api\send-order-messenger.js:46:    const token = (process.env.WA_TOKEN || '').trim()
venkys_admin\api\send-order-messenger.js:47:    const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim()
venkys_admin\api\send-order-messenger.js:68:    const templateName = process.env.WA_TEMPLATE_ORDER_MESSENGER_NAME || 'venkys_order_messenger'
venkys_admin\api\send-order-messenger.js:69:    const templateLang = process.env.WA_TEMPLATE_ORDER_MESSENGER_LANG || 'en'
venkys_admin\api\send-whatsapp.js:13:  const allow = process.env.CORS_ORIGIN || '*'
venkys_admin\api\send-whatsapp.js:45:  const token = (process.env.WA_TOKEN || '').trim()
venkys_admin\api\send-whatsapp.js:46:  const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim()
venkys_admin\api\send-whatsapp.js:99:      const fallbackName = process.env.WA_TEMPLATE_DEFAULT_NAME || 'hello_world'
venkys_admin\api\send-whatsapp.js:100:      const fallbackLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
venkys_admin\api\send-whatsapp.js:122:      const defaultLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
venkys\api\lib\verifyAuth.js:29:  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
venkys\api\lib\verifyAuth.js:49:  const isDisabled = process.env.AUTH_REQUIRED === '0' || process.env.AUTH_REQUIRED === 'false'
venkys\api\lib\verifyAuth.js:85:  const secret = (process.env.API_INTERNAL_SECRET || '').trim()
venkys_admin\api\verify-payment.js:19:  const allow = process.env.CORS_ORIGIN || ''
venkys_admin\api\verify-payment.js:45:    const secret = process.env.RAZORPAY_KEY_SECRET
venkys_admin\api\lib\rateLimiter.js:31:  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim()
venkys_admin\api\lib\rateLimiter.js:32:  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
venkys_admin\api\lib\rateLimiter.js:84:const KILL_SWITCH_ENABLED = process.env.API_KILL_SWITCH === '1' || process.env.API_KILL_SWITCH === 'true'
venkys_admin\api\lib\rateLimiter.js:85:const KILL_SWITCH_REASON = process.env.API_KILL_SWITCH_REASON || 'API temporarily disabled for maintenance'
venkys_admin\api\lib\rateLimiter.js:88:const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === '1' || process.env.RATE_LIMIT_DISABLED === 'true'
venkys_admin\api\lib\rateLimiter.js:150:    const baseUrl = process.env.VERCEL_URL 
venkys_admin\api\lib\rateLimiter.js:151:      ? `https://${process.env.VERCEL_URL}` 
venkys_admin\api\lib\rateLimiter.js:158:        ...(process.env.API_INTERNAL_SECRET ? { 'X-Internal-Secret': process.env.API_INTERNAL_SECRET } : {})
venkys_admin\api\lib\rateLimiter.js:177:  if (process.env.NODE_ENV !== 'production' && !process.env.LOG_RATE_LIMITS) {
venkys_admin\api\lib\verifyAuth.js:29:  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
venkys_admin\api\lib\verifyAuth.js:49:  const isDisabled = process.env.AUTH_REQUIRED === '0' || process.env.AUTH_REQUIRED === 'false'
venkys_admin\api\lib\verifyAuth.js:85:  const secret = (process.env.API_INTERNAL_SECRET || '').trim()
venkys_admin\src\main.jsx:35:if (import.meta.env.DEV && 'serviceWorker' in navigator) {
venkys_admin\src\main.jsx:45:if (import.meta.env.PROD) {
venkys_admin\src\components\AdminNav.jsx:217:                <img src={`${import.meta.env.BASE_URL}icons/Logo.png`} alt="Venky's" className="brand-logo drop-shadow-sm" />
venkys_admin\src\components\AdminNav.jsx:321:                <img src={`${import.meta.env.BASE_URL}icons/Logo.png`} alt="Venky's" className="h-8 w-auto" />
venkys_admin\src\components\ErrorBoundary.jsx:16:    if (import.meta.env.DEV) {
venkys\src\components\ErrorBoundary.jsx:16:    if (import.meta.env.DEV) {
venkys\src\hooks\useDeliveryLocation.js:16:  const [region, setRegion] = useState({ center: { lat: Number(import.meta.env.VITE_DELIVERY_CENTER_LAT ?? 23.5204), lng: Number(import.meta.env.VITE_DELIVERY_CENTER_LNG ?? 87.3119) }, radiusKm: Number(import.meta.env.VITE_DELIVERY_RADIUS_KM ?? 8) })
venkys\src\components\NavBar.jsx:14:  const logoUrl = `${import.meta.env.BASE_URL}icons/Logo.png`
venkys_admin\src\lib\data-settings.js:228:  const url = import.meta.env.VITE_SYNC_BUSINESS_PROFILE_URL || '/api/sync-business-profile'
venkys_admin\src\lib\data-payments.js:34:  const fromVite = import.meta.env.VITE_RAZORPAY_KEY_ID
venkys\src\lib\data-settings.js:133:  const url = import.meta.env.VITE_SYNC_BUSINESS_PROFILE_URL || '/api/sync-business-profile'
venkys\src\lib\data-payments.js:20:  const fromVite = import.meta.env.VITE_RAZORPAY_KEY_ID
venkys\src\main.jsx:39:if (import.meta.env.DEV && 'serviceWorker' in navigator) {
venkys\src\main.jsx:50:if (import.meta.env.PROD) {
venkys\src\pages\About.jsx:3:  const logoUrl = `${import.meta.env.BASE_URL}icons/Logo.png`
venkys_admin\src\lib\firebase.js:7:  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
venkys_admin\src\lib\firebase.js:8:  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
venkys_admin\src\lib\firebase.js:9:  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
venkys_admin\src\lib\firebase.js:10:  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
venkys_admin\src\lib\firebase.js:11:  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
venkys_admin\src\lib\firebase.js:12:  appId: import.meta.env.VITE_FIREBASE_APP_ID,
venkys_admin\src\lib\firebase.js:15:if (import.meta.env.DEV) {
venkys\src\lib\firebase.js:7:  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
venkys\src\lib\firebase.js:8:  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
venkys\src\lib\firebase.js:9:  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
venkys\src\lib\firebase.js:10:  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
venkys\src\lib\firebase.js:11:  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
venkys\src\lib\firebase.js:12:  appId: import.meta.env.VITE_FIREBASE_APP_ID,
venkys\src\lib\firebase.js:16:if (import.meta.env.DEV) {
venkys\src\lib\google.js:7:    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
```

### Hardcoded URLs / environment-specific strings
`$lang
venkys_admin/src/lib/data-common.js:129:  const productionBase = 'https://venkys-admin.vercel.app'
venkys_admin/src/lib/data-common.js:131:    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
venkys/vite.config.js:10:// https://vite.dev/config/
venkys/vite.config.js:13:  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_DEV_API_BASE_URL || env.VITE_API_BASE_URL || 'http://localhost:3000'
venkys/src/lib/data-common.js:146:  const productionBase = 'https://venkys.vercel.app'
venkys/src/lib/data-common.js:148:    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
venkys_admin/vite.config.js:16:        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
venkys/index.html:6:    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TP0M45QL81"></script>
venkys/index.html:22:    <meta property="og:url" content="https://venkys.vercel.app/" />
venkys_admin/api\send-order-messenger.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys_admin/api\send-order-messenger.js:91:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys_admin/api\send-whatsapp.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys_admin/api\send-whatsapp.js:57:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys_admin/src\components\AdminNav.jsx:255:                <svg className="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys_admin/src\components\AdminNav.jsx:258:                <svg className="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys_admin/src\components\AdminNav.jsx:284:                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 24 20" fill="currentColor">
venkys_admin/api\lib\rateLimiter.js:151:      ? `https://${process.env.VERCEL_URL}` 
venkys_admin/api\lib\rateLimiter.js:152:      : 'http://localhost:3000'
venkys_admin/src\pages\AdminBiller.jsx:127:    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
venkys_admin/src\pages\AdminBiller.jsx:138:      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
venkys_admin/src\lib\data-common.js:129:  const productionBase = 'https://venkys-admin.vercel.app'
venkys_admin/src\lib\data-common.js:131:    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
venkys/api\lib\rateLimiter.js:154:      ? `https://${process.env.VERCEL_URL}` 
venkys/api\lib\rateLimiter.js:155:      : 'http://localhost:3000'
venkys_admin/src\pages\Inventory.jsx:492:      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
venkys_admin/src\pages\Orders.jsx:480:            const reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
venkys_admin/src\pages\Orders.jsx:774:                          <a href={`https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline btn-primary gap-1 w-full">
venkys_admin/src\pages\Orders.jsx:801:                       src={`https://maps.google.com/maps?q=${addr.lat},${addr.lng}&z=15&output=embed`}
venkys/api\send-order-messenger.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys/api\send-order-messenger.js:77:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys/api\send-whatsapp.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys/api\send-whatsapp.js:55:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys_admin/src\pages\Settings.jsx:362:                  <div className="text-xs opacity-60 mt-1">Paste a Google Maps link (e.g. https://maps.google.com/...@lat,long...) and click Update.</div>
venkys_admin/src\pages\Settings.jsx:439:                    <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="link link-primary">
venkys/api\sync-business-profile.js:24:const PLACES_API_URL = 'https://places.googleapis.com/v1/places'
venkys_admin/src\lib\data-settings.js:239:      `In dev, Vite doesn't serve /api routes. Run \`vercel dev\` (default http://localhost:3000) ` +
venkys/src\services\location.js:41:    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1&accept-language=en`
venkys_admin/src\lib\data-user.js:211:  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
venkys/src\lib\data-common.js:146:  const productionBase = 'https://venkys.vercel.app'
venkys/src\lib\data-common.js:148:    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
venkys/src\components\MenuItemCard.jsx:216:                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
venkys/src\components\NavBar.jsx:324:              <svg className="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys/src\components\NavBar.jsx:327:              <svg className="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys/src\pages\Checkout.jsx:311:    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
venkys/src\pages\Checkout.jsx:326:      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
venkys/src\pages\Contact.jsx:55:    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank')
venkys/src\pages\Contact.jsx:126:                      <a href={`https://wa.me/91${phoneLink}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-green-500/10 transition-colors">
venkys/src\lib\google.js:23:    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
venkys/src\lib\google.js:58:    out.mapUrl = `https://www.google.com/maps?q=${out.lat},${out.lng}`
venkys/src\lib\google.js:106:    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
venkys/src\lib\google.js:126:    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`
```

### Environment notes
`$lang
- Actual `.env` files exist in both apps but are intentionally not printed.
- Customer `.env.example` still uses non-Vite Firebase names (`FIREBASE_API_KEY`, etc.) even though the code reads `VITE_FIREBASE_*`; this example file is partially misleading/stale.
- Frontend envs used in code:
  - customer: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_DELIVERY_CENTER_LAT`, `VITE_DELIVERY_CENTER_LNG`, `VITE_DELIVERY_RADIUS_KM`, `VITE_RAZORPAY_KEY_ID`, `VITE_SYNC_BUSINESS_PROFILE_URL`, `VITE_API_BASE_URL`, `VITE_VERCEL_URL`, `VITE_SITE_URL`, `VITE_PUBLIC_BASE_URL`, `VITE_API_PROXY_TARGET`, `VITE_DEV_API_BASE_URL`.
  - admin: `VITE_FIREBASE_*`, `VITE_RAZORPAY_KEY_ID`, `VITE_SYNC_BUSINESS_PROFILE_URL`, `VITE_API_BASE_URL`, `VITE_VERCEL_URL`, `VITE_API_PROXY_TARGET`.
- Backend envs used in code: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, `CORS_ORIGIN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `API_KILL_SWITCH`, `API_KILL_SWITCH_REASON`, `RATE_LIMIT_DISABLED`, `VERCEL_URL`, `API_INTERNAL_SECRET`, `LOG_RATE_LIMITS`, `NODE_ENV`, `EMAIL_USER`, `EMAIL_PASS`, `LOG_EMAIL_RECIPIENT`, `AUTH_REQUIRED`, `WA_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_TEMPLATE_ORDER_MESSENGER_NAME`, `WA_TEMPLATE_ORDER_MESSENGER_LANG`, `WA_TEMPLATE_DEFAULT_NAME`, `WA_TEMPLATE_DEFAULT_LANG`, `GOOGLE_PLACES_API_KEY`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`.
```

## 5. ROUTING & PAGES

### Customer routes/pages/layout tree
`$lang
venkys/src/App.jsx
venkys/src/main.jsx
venkys/src/layouts/Layout.jsx
venkys/src/components/ErrorBoundary.jsx
venkys/src/pages/About.jsx
venkys/src/pages/ActiveOrders.jsx
venkys/src/pages/CancellationRefunds.jsx
venkys/src/pages/Checkout.jsx
venkys/src/pages/Contact.jsx
venkys/src/pages/Home.jsx
venkys/src/pages/NotFound.jsx
venkys/src/pages/Privacy.jsx
venkys/src/pages/Profile.jsx
venkys/src/pages/Shipping.jsx
venkys/src/pages/Terms.jsx
```

### Admin routes/pages/layout tree
`$lang
venkys_admin/src/App.jsx
venkys_admin/src/main.jsx
venkys_admin/src/layouts/AdminLayout.jsx
venkys_admin/src/components/ErrorBoundary.jsx
venkys_admin/src/pages/AdminBiller.jsx
venkys_admin/src/pages/Analytics.jsx
venkys_admin/src/pages/Appearance.jsx
venkys_admin/src/pages/AuditLogs.jsx
venkys_admin/src/pages/Delivery.jsx
venkys_admin/src/pages/Inventory.jsx
venkys_admin/src/pages/Orders.jsx
venkys_admin/src/pages/Settings.jsx
venkys_admin/src/pages/StockManager.jsx
```

### Customer App.jsx router (venkys/src/App.jsx)
`$lang
// App — Root component with routing and layout
import { Suspense, lazy } from 'react'

import { Routes, Route } from 'react-router-dom'

import Layout from './layouts/Layout'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load all pages for faster initial load
const Home = lazy(() => import('./pages/Home'))
const Checkout = lazy(() => import('./pages/Checkout'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Profile = lazy(() => import('./pages/Profile'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Shipping = lazy(() => import('./pages/Shipping'))
const CancellationRefunds = lazy(() => import('./pages/CancellationRefunds'))
const ActiveOrders = lazy(() => import('./pages/ActiveOrders'))

// Minimal loading skeleton
function PageLoader() {
  return (
    <div className="page-wrap py-10 flex justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
            <Route path="/active-orders" element={<ActiveOrders />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App

```

### Customer main.jsx (venkys/src/main.jsx)
`$lang
// main — React DOM entry point with providers
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { UIProvider } from './context/UIContext'
import App from './App.jsx'
import { setupPWAHooks } from './pwa'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </UIProvider>
    </BrowserRouter>
  </StrictMode>
)

// PWA hooks (beforeinstallprompt etc.)
setupPWAHooks()

// Catch unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  event.preventDefault()
})

// In development, do NOT keep a service worker: unregister any existing one and clear caches
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Best-effort cleanup of existing SWs/caches that may hold stale prebundles
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
  }).catch(() => {})
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {})
  }
}

// Only register the service worker in production
if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

```

### Customer layout (venkys/src/layouts/Layout.jsx)
`$lang
// Layout — Main page layout wrapper with nav, footer, and outlet
import { useEffect } from 'react'

import { Outlet } from 'react-router-dom'

import { useUI } from '../context/UIContext'
import AuthModal from '../components/AuthModal'
import CartDrawer from '../components/CartDrawer'
import FloatingCartBar from '../components/FloatingCartBar'
import InstallPWA from '../components/InstallPWA'
import ItemModal from '../components/ItemModal'
import NavBar from '../components/NavBar'
import Dock from '../components/QuickDock'
// Removed custom hook to avoid invalid hook call caused by duplicate React resolution in some setups.

export default function Layout() {
  const { authMode, toasts, dismissToast, confirmState, resolveConfirm } = useUI()
  // Inline adaptive scale effect
  useEffect(() => {
    const opts = { minWidth: 360, maxWidth: 1800, minRem: 14, maxRem: 19, varName: '--app-scale' }
    function apply() {
      const w = window.innerWidth
      const clamped = Math.min(Math.max(w, opts.minWidth), opts.maxWidth)
      const t = (clamped - opts.minWidth) / (opts.maxWidth - opts.minWidth)
      const size = (opts.minRem + (opts.maxRem - opts.minRem) * t)
      document.documentElement.style.fontSize = size + 'px'
      document.documentElement.style.setProperty(opts.varName, (size / 16).toFixed(4))
    }
    apply()
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    return () => {
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [])

  return (
    <CartDrawer>
      <div className={`app-shell ${authMode ? 'blur-when-auth-open' : ''}`}>
        <NavBar />
        <main className="flex-1 pb-24">
          <Outlet />
        </main>
  <FloatingCartBar />
    <Dock />
        <ItemModal />
      </div>
      {/* Keep modal outside blurred container */}
      <AuthModal />
  <InstallPWA />
      {/* Toast stack */}
      <div className="fixed z-[60] bottom-20 right-4 flex flex-col gap-2 w-72">
        {toasts.map(t => (
          <div key={t.id} className={`alert shadow-sm border border-base-300/60 backdrop-blur bg-base-100/90 p-3 flex items-start gap-2 text-sm ${t.type === 'error' ? 'alert-error' : t.type === 'success' ? 'alert-success' : ''}`}>
            <div className="flex-1 leading-snug">{t.msg}</div>
            <button className="btn btn-ghost btn-xs" onClick={() => dismissToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => resolveConfirm(false)} />
          <div className="relative w-full max-w-sm mx-auto p-5 rounded-2xl bg-base-100/90 border border-base-300/60 shadow-xl flex flex-col gap-4 animate-scale-in">
            <div className="text-base font-semibold">Confirm action</div>
            <div className="text-sm opacity-80 whitespace-pre-wrap">{confirmState.message}</div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={() => resolveConfirm(false)}>Cancel</button>
              <button className="btn btn-sm btn-error" onClick={() => resolveConfirm(true)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </CartDrawer>
  )
}

```

### Customer error boundary (venkys/src/components/ErrorBoundary.jsx)
`$lang
// ErrorBoundary — React error boundary with fallback UI
import { Component } from 'react'

// Catches JS errors in the child tree and shows a recovery screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm opacity-60 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

```

### Admin App.jsx router (venkys_admin/src/App.jsx)
`$lang
// App — Admin root component with role-based routing
import { Suspense, lazy } from 'react'

import { Routes, Route, Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import { useUI } from './context/UIContext'
import AdminTopNav from './components/AdminNav'
import AuthModal from './components/AuthModal'
import AuthSkeleton from './components/AuthSkeleton'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPWA from './components/InstallPWA'

const Inventory = lazy(() => import('./pages/Inventory'))
const StockManager = lazy(() => import('./pages/StockManager'))
const Orders = lazy(() => import('./pages/Orders'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Appearance = lazy(() => import('./pages/Appearance'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminBiller = lazy(() => import('./pages/AdminBiller'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const Delivery = lazy(() => import('./pages/Delivery'))

// Access denied component for guests/unregistered users
function AccessDenied() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 shadow-xl max-w-md mx-4">
        <div className="card-body text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="card-title justify-center text-2xl">Access Denied</h2>
          <p className="opacity-70 mt-2">
            You don't have permission to access the admin panel.
          </p>
          {user?.email && (
            <p className="text-sm opacity-60 mt-1">
              Signed in as: {user.email}
            </p>
          )}
          <p className="text-sm opacity-60 mt-4">
            Contact an administrator to get access.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { authMode } = useUI()
  const { user, loading, roleLoading, isStaffMember, canAccess, role } = useAuth()

  // Show skeleton while loading auth or role
  if (loading || roleLoading) {
    return (
      <>
        <InstallPWA />
        <AuthSkeleton />
        <AuthModal />
      </>
    )
  }

  // No user = show login
  if (!user) {
    return (
      <>
        <InstallPWA />
        <AuthSkeleton />
        <AuthModal />
      </>
    )
  }

  // User logged in but no staff role = access denied
  if (!isStaffMember) {
    return (
      <>
        <InstallPWA />
        <AccessDenied />
      </>
    )
  }

  const pageDefs = [
    { key: 'analytics', path: '/admin/analytics', element: <Analytics /> },
    { key: 'inventory', path: '/admin/inventory', element: <Inventory /> },
    { key: 'stock', path: '/admin/stock', element: <StockManager /> },
    { key: 'orders', path: '/admin/orders', element: <Orders /> },
    { key: 'appearance', path: '/admin/appearance', element: <Appearance /> },
    { key: 'settings', path: '/admin/settings', element: <Settings /> },
    { key: 'logs', path: '/admin/logs', element: <AuditLogs /> },
    { key: 'biller', path: '/admin/biller', element: <AdminBiller /> },
    { key: 'delivery', path: '/admin/delivery', element: <Delivery /> },
  ]

  const allowedPages = pageDefs.filter((p) => canAccess(p.key))
  
  // Use user's defaultPage if set and allowed, otherwise first allowed page
  const defaultPageKey = role?.defaultPage
  const defaultPageDef = defaultPageKey ? allowedPages.find(p => p.key === defaultPageKey) : null
  const firstAllowedPath = defaultPageDef?.path || allowedPages[0]?.path || '/admin'

  // If a staff role exists but has no allowed pages, treat as denied.
  if (isStaffMember && allowedPages.length === 0) {
    return (
      <>
        <InstallPWA />
        <AccessDenied />
      </>
    )
  }

  return (
    <>
      <InstallPWA />
      <ErrorBoundary>
        <div className="admin-shell">
          <AdminTopNav />
          <main className={`page-wrap pb-16 pt-6 transition-all duration-200 ${authMode ? 'blur-when-auth-open' : ''}`}>
            <Suspense fallback={<div className="py-20 text-center text-sm opacity-70">Loading module…</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/admin" replace />} />

                <Route path="/admin" element={<Navigate to={firstAllowedPath} replace />} />
                {allowedPages.map((p) => (
                  <Route key={p.key} path={p.path} element={p.element} />
                ))}

                <Route path="*" element={<Navigate to={firstAllowedPath} replace />} />
              </Routes>
            </Suspense>
          </main>
          <AuthModal />
        </div>
      </ErrorBoundary>
    </>
  )
}

```

### Admin main.jsx (venkys_admin/src/main.jsx)
`$lang
// main — Admin React DOM entry point with providers
import React from 'react'
import ReactDOM from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import { AuthProvider } from './context/AuthContext'
import { UIProvider } from './context/UIContext'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing root element')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Catch unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  event.preventDefault()
})

// In development, unregister any existing SW and clear caches
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
  }).catch(() => {})
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {})
  }
}

// Only register the service worker in production
if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

```

### Admin layout (venkys_admin/src/layouts/AdminLayout.jsx)
`$lang
// AdminLayout — Admin page layout wrapper with toasts
import { useUI } from '../context/UIContext'

const toastClassMap = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
}

export default function AdminLayout({ children, title, description, actions }) {
  const { toasts, dismissToast, confirmState, resolveConfirm } = useUI()

  return (
    <section className="admin-layout space-y-4">
      <div className="page-wrap space-y-6">
        {(title || description || actions) && (
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {title && <h1 className="text-3xl font-semibold tracking-tight text-base-content">{title}</h1>}
              {description && <p className="text-sm opacity-70">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </header>
        )}
        <div className="space-y-6">
          {children}
        </div>
      </div>

      {toasts && toasts.length > 0 && (
        <div className="toast toast-bottom toast-end z-[9999]">
          {toasts.map((toast) => (
            <div key={toast.id} className={`alert shadow-lg ${toastClassMap[toast.type] || 'alert-info'}`}>
              <span className="text-sm flex-1 whitespace-pre-wrap">{toast.msg}</span>
              {toast.action && toast.action.label && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    dismissToast(toast.id)
                    try { toast.action.onClick?.() } catch (err) { console.warn('[toast action] failed', err) }
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => dismissToast(toast.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {confirmState && (
        <dialog open className="modal modal-open">
          <div className="modal-box space-y-4">
            {confirmState.title && <h3 className="text-lg font-semibold">{confirmState.title}</h3>}
            {confirmState.message && <p className="text-sm whitespace-pre-wrap">{confirmState.message}</p>}
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => resolveConfirm(false)}>
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${confirmState.confirmTone === 'danger' ? 'btn-error' : 'btn-primary'}`}
                onClick={() => resolveConfirm(true)}
              >
                {confirmState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => resolveConfirm(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </section>
  )
}

```

### Admin error boundary (venkys_admin/src/components/ErrorBoundary.jsx)
`$lang
// ErrorBoundary — React error boundary with fallback UI
import { Component } from 'react'

// Catches JS errors in the child tree and shows a recovery screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm opacity-60 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

```

### Routing findings
`$lang
- This is not Next.js; it is plain React Router via `BrowserRouter` in both apps.
- Customer routes:
  - `/`
  - `/checkout`
  - `/profile`
  - `/about`
  - `/contact`
  - `/terms`
  - `/privacy`
  - `/shipping`
  - `/cancellation-refunds`
  - `/active-orders`
  - `*` -> NotFound
- Admin routes are role-filtered from page definitions in `venkys_admin/src/App.jsx` and ultimately route to:
  - `/admin/analytics`
  - `/admin/inventory`
  - `/admin/stock`
  - `/admin/orders`
  - `/admin/appearance`
  - `/admin/settings`
  - `/admin/logs`
  - `/admin/biller`
  - `/admin/delivery`
- Loading states are handled via `Suspense` fallbacks, not route-level `loading.tsx`-style files.
- Error handling is a React class `ErrorBoundary`, not route-level `errorElement` definitions.
```

## 6. API & BACKEND CALLS

### All fetch / axios / HTTP call sites
`$lang
venkys_admin/api\create-order.js:3:// Endpoint: /api/create-order
venkys_admin/api\create-order.js:62:    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
venkys_admin/api\health.js:3:// GET /api/health
venkys_admin/api\send-order-messenger.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys_admin/api\send-order-messenger.js:91:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys_admin/api\send-order-messenger.js:92:    const r = await fetch(url, {
venkys_admin/api\send-whatsapp.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys_admin/api\send-whatsapp.js:57:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys_admin/api\send-whatsapp.js:60:      const r = await fetch(url, {
venkys_admin/api\verify-payment.js:3:// Endpoint: /api/verify-payment
venkys_admin/api\lib\rateLimiter.js:151:      ? `https://${process.env.VERCEL_URL}` 
venkys_admin/api\lib\rateLimiter.js:152:      : 'http://localhost:3000'
venkys_admin/api\lib\rateLimiter.js:154:    const response = await fetch(`${baseUrl}/api/send-log-email`, {
venkys/api\create-order.js:3:// Endpoint: /api/create-order
venkys/api\create-order.js:17:const razorpay = new Razorpay({
venkys/api\health.js:3:// GET /api/health
venkys_admin/src\sw.js:45:  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || 
venkys_admin/src\sw.js:47:    event.respondWith(fetch(req).catch(() => new Response('Network error', { status: 503 })))
venkys_admin/src\sw.js:52:    event.respondWith(fetch(req).catch(() => caches.match('/index.html')))
venkys_admin/src\sw.js:62:        return fetch(req).then((res) => {
venkys_admin/src\sw.js:75:  event.respondWith(fetch(req).catch(() => caches.match(req)))
venkys_admin/src\components\AdminNav.jsx:255:                <svg className="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys_admin/src\components\AdminNav.jsx:258:                <svg className="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys_admin/src\components\AdminNav.jsx:284:                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 24 20" fill="currentColor">
venkys_admin/src\lib\auditLog.js:22:    const res = await fetch(apiUrl('/api/send-log-email'), {
venkys_admin/src\pages\AdminBiller.jsx:127:    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
venkys_admin/src\pages\AdminBiller.jsx:138:      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
venkys_admin/src\pages\AdminBiller.jsx:488:             const instance = new RazorpayCtor({
venkys/api\send-order-messenger.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys/api\send-order-messenger.js:77:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys/api\send-order-messenger.js:98:    const r = await fetch(url, {
venkys/api\verify-payment.js:3:// Endpoint: /api/verify-payment
venkys/api\sync-business-profile.js:24:const PLACES_API_URL = 'https://places.googleapis.com/v1/places'
venkys/api\sync-business-profile.js:44:  const response = await fetch(url, {
venkys/api\send-whatsapp.js:18:  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
venkys/api\send-whatsapp.js:55:    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
venkys/api\send-whatsapp.js:58:      const r = await fetch(url, {
venkys/api\lib\rateLimiter.js:154:      ? `https://${process.env.VERCEL_URL}` 
venkys/api\lib\rateLimiter.js:155:      : 'http://localhost:3000'
venkys/api\lib\rateLimiter.js:157:    const response = await fetch(`${baseUrl}/api/send-log-email`, {
venkys_admin/src\lib\data-inventory.js:181:        fetch(apiUrl('/api/send-whatsapp'), {
venkys/src\sw.js:52:  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
venkys/src\sw.js:53:    event.respondWith(fetch(req).catch(() => new Response('Network error', { status: 503 })))
venkys/src\sw.js:59:      fetch(req).catch(() => caches.match('/index.html'))
venkys/src\sw.js:70:        return fetch(req).then((res) => {
venkys/src\sw.js:83:  event.respondWith(fetch(req).catch(() => caches.match(req)))
venkys_admin/src\lib\data-payments.js:14:    const url = apiUrl('/api/public-config')
venkys_admin/src\lib\data-payments.js:15:    const res = await fetch(url, { method: 'GET' })
venkys_admin/src\lib\data-payments.js:50:  const res = await fetch(apiUrl('/api/create-order'), {
venkys_admin/src\lib\data-payments.js:65:  const res = await fetch(apiUrl('/api/verify-payment'), {
venkys_admin/src\lib\data-settings.js:228:  const url = import.meta.env.VITE_SYNC_BUSINESS_PROFILE_URL || '/api/sync-business-profile'
venkys_admin/src\lib\data-settings.js:231:    res = await fetch(url, {
venkys_admin/src\lib\data-settings.js:239:      `In dev, Vite doesn't serve /api routes. Run \`vercel dev\` (default http://localhost:3000) ` +
venkys_admin/src\lib\data-settings.js:240:      `or set VITE_SYNC_BUSINESS_PROFILE_URL to your deployed /api/sync-business-profile URL.`
venkys_admin/src\lib\data-settings.js:247:        `Sync failed: /api/sync-business-profile not found (404). ` +
venkys_admin/src\pages\Orders.jsx:480:            const reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
venkys_admin/src\pages\Orders.jsx:774:                          <a href={`https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline btn-primary gap-1 w-full">
venkys_admin/src\pages\Orders.jsx:801:                       src={`https://maps.google.com/maps?q=${addr.lat},${addr.lng}&z=15&output=embed`}
venkys_admin/src\lib\data-common.js:129:  const productionBase = 'https://venkys-admin.vercel.app'
venkys_admin/src\lib\data-common.js:131:    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
venkys_admin/src\pages\Settings.jsx:362:                  <div className="text-xs opacity-60 mt-1">Paste a Google Maps link (e.g. https://maps.google.com/...@lat,long...) and click Update.</div>
venkys_admin/src\pages\Settings.jsx:439:                    <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="link link-primary">
venkys_admin/src\lib\data-user.js:211:  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
venkys_admin/src\lib\data-whatsapp.js:10:    const url = apiUrl('/api/send-whatsapp')
venkys_admin/src\lib\data-whatsapp.js:12:    const res = await fetch(url, {
venkys_admin/src\lib\data-whatsapp.js:32:// Template-based order notification via /api/send-order-messenger
venkys_admin/src\lib\data-whatsapp.js:37:    const url = apiUrl('/api/send-order-messenger')
venkys_admin/src\lib\data-whatsapp.js:39:    const res = await fetch(url, {
venkys/src\services\location.js:41:    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1&accept-language=en`
venkys/src\services\location.js:42:    const res = await fetch(url, { headers: { Accept: 'application/json' } })
venkys_admin/src\pages\Inventory.jsx:492:      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
venkys/src\lib\data-common.js:146:  const productionBase = 'https://venkys.vercel.app'
venkys/src\lib\data-common.js:148:    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
venkys/src\lib\data-orders.js:179:        const url = apiUrl('/api/send-order-messenger')
venkys/src\lib\data-orders.js:181:        const res = await fetch(url, {
venkys/src\lib\data-orders.js:218:    const url = apiUrl('/api/send-whatsapp')
venkys/src\lib\data-orders.js:220:    const res = await fetch(url, {
venkys/src\components\MenuItemCard.jsx:216:                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
venkys/src\pages\Checkout.jsx:311:    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
venkys/src\pages\Checkout.jsx:326:      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
venkys/src\pages\Checkout.jsx:858:          const instance = new RazorpayConstructor({
venkys/src\lib\data-payments.js:8:  const url = apiUrl('/api/public-config')
venkys/src\lib\data-payments.js:9:  const res = await fetch(url, { method: 'GET' })
venkys/src\lib\data-payments.js:45:  const res = await fetch(apiUrl('/api/create-order'), {
venkys/src\lib\data-payments.js:61:  const res = await fetch(apiUrl('/api/verify-payment'), {
venkys/src\lib\data-settings.js:133:  const url = import.meta.env.VITE_SYNC_BUSINESS_PROFILE_URL || '/api/sync-business-profile'
venkys/src\lib\data-settings.js:134:  const res = await fetch(url, {
venkys/src\pages\Contact.jsx:55:    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank')
venkys/src\pages\Contact.jsx:126:                      <a href={`https://wa.me/91${phoneLink}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-green-500/10 transition-colors">
venkys/src\components\NavBar.jsx:324:              <svg className="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys/src\components\NavBar.jsx:327:              <svg className="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
venkys/src\lib\google.js:23:    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
venkys/src\lib\google.js:58:    out.mapUrl = `https://www.google.com/maps?q=${out.lat},${out.lng}`
venkys/src\lib\google.js:106:    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
venkys/src\lib\google.js:107:    const res = await fetch(url)
venkys/src\lib\google.js:126:    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`
venkys/src\lib\google.js:127:    const res = await fetch(url)
```

### API/backend call map
`$lang
Customer frontend:
- `venkys/src/lib/data-payments.js`
  - `GET /api/public-config` -> response `{ razorpayKeyId }`
  - `POST /api/create-order` -> request `{ amount, cartChecksum?, items?: [{ name, rate, qty, categoryId? }] }`; response `{ orderId, amount, currency }`
  - `POST /api/verify-payment` -> request `{ orderId, paymentId, signature }`; response `{ valid: boolean }`
- `venkys/src/lib/data-orders.js`
  - `POST /api/send-order-messenger` -> request `{ phone, customerName, totalAmount, address, orderId? }`; response `ok/msgId` or error object
  - `POST /api/send-whatsapp` -> request `{ phone, payload }`; response WhatsApp API wrapper object
- `venkys/src/lib/data-settings.js`
  - `POST /api/sync-business-profile` -> request `{ placeId }`; response `{ success, message, data }`
- `venkys/src/services/location.js`
  - `GET https://nominatim.openstreetmap.org/reverse?...` -> reverse-geocode label/full address
- `venkys/src/lib/google.js`
  - loads `https://maps.googleapis.com/maps/api/js?...&libraries=places`
  - `GET https://maps.googleapis.com/maps/api/geocode/json?latlng=...`
  - `GET https://maps.googleapis.com/maps/api/geocode/json?address=...`
- `venkys/src/pages/Contact.jsx`
  - opens `https://wa.me/...`

Admin frontend:
- `venkys_admin/src/lib/data-payments.js`
  - same `/api/public-config`, `/api/create-order`, `/api/verify-payment` endpoints, POS-oriented payloads
- `venkys_admin/src/lib/data-whatsapp.js`
  - `POST /api/send-whatsapp`
  - `POST /api/send-order-messenger`
- `venkys_admin/src/lib/auditLog.js`
  - `POST /api/send-log-email`
- `venkys_admin/src/lib/data-settings.js`
  - `POST /api/sync-business-profile`
- `venkys_admin/src/lib/data-inventory.js`
  - best-effort `POST /api/send-whatsapp` for stock alerts
- `venkys_admin/src/pages/Orders.jsx`
  - WhatsApp review message via `sendWhatsAppInvoice`

Server-side outgoing calls:
- Razorpay orders API via SDK in both `api/create-order.js` files.
- Meta WhatsApp Cloud API in `api/send-whatsapp.js` and `api/send-order-messenger.js`.
- Google Places API in `venkys/api/sync-business-profile.js`.
- Internal `POST /api/send-log-email` from both `api/lib/rateLimiter.js` files.
- Gmail SMTP via `nodemailer` in both `api/send-log-email.js` files.

Axios:
- No axios client usage found; everything is `fetch` or SDK-based.
```

## 7. DATABASE & AUTH

### Customer firestore.rules (venkys/firestore.rules)
`$lang
rules_version = '2';

// =====================================================================
// UNIFIED FIRESTORE RULES - Venky's Chicken Xperience
// =====================================================================
// This single rules file is used by BOTH customer app and admin app.
// 
// ROLE HIERARCHY:
//   1. Super Admin (hardcoded) - swastiksaha1204@gmail.com - ALWAYS has full access
//   2. Admin (dynamic) - role: 'admin' in roles collection - Full access
//   3. Staff (dynamic) - role: 'staff' with page-specific permissions
//   4. Delivery (dynamic) - role: 'delivery' - Can view/update assigned deliveries
//   5. Customer - Regular signed-in users - Can manage own profile & orders
//   6. Guest - Unauthenticated - Can read public data only
//
// ROLE DOCUMENT STRUCTURE (roles/{email}):
//   {
//     role: 'admin' | 'staff' | 'delivery',
//     name: 'Display Name',
//     email: 'user@example.com',
//     pages: {
//       biller: true/false,      // POS billing
//       orders: true/false,      // Order management
//       inventory: true/false,   // Menu & stock management
//       analytics: true/false,   // Sales analytics
//       settings: true/false,    // App settings (admin only typically)
//       appearance: true/false,  // Theme customization
//       delivery: true/false,    // Delivery management
//     },
//     createdAt: timestamp,
//     updatedAt: timestamp,
//     createdBy: 'admin@email.com'
//   }
// =====================================================================

service cloud.firestore {
  match /databases/{database}/documents {

    // =========================================
    // HELPER FUNCTIONS
    // =========================================

    // Super admin email - HARDCODED, always has full access
    function superAdminEmail() {
      return 'swastiksaha1204@gmail.com';
    }

    // Check if user is signed in
    function isSignedIn() {
      return request.auth != null;
    }

    // Email is required for role-based access (roles are keyed by email)
    function hasEmail() {
      return isSignedIn() && request.auth.token.email is string && request.auth.token.email.size() > 0;
    }

    // Check if current user is the super admin
    function isSuperAdmin() {
      return hasEmail() && request.auth.token.email == superAdminEmail();
    }

    // Get role document for current user
    function getRoleDoc() {
      return get(/databases/$(database)/documents/roles/$(request.auth.token.email)).data;
    }

    // Check if user has a role document
    function hasRoleDoc() {
      return hasEmail() && exists(/databases/$(database)/documents/roles/$(request.auth.token.email));
    }

    // Role helpers
    function isStaffUser() {
      return hasRoleDoc() && getRoleDoc().role == 'staff';
    }

    function isDeliveryUser() {
      return hasRoleDoc() && getRoleDoc().role == 'delivery';
    }

    // Check if user is an admin (super admin OR role == 'admin')
    function isAdmin() {
      return isSuperAdmin() || (hasRoleDoc() && getRoleDoc().role == 'admin');
    }

    // Check if user has a specific page permission
    function hasPageAccess(pageName) {
      // IMPORTANT: Only 'staff' role uses page-level permissions.
      // Delivery users are restricted by role (delivery-only), not by pages.
      return isAdmin() || (
        isStaffUser() &&
        getRoleDoc().pages != null &&
        getRoleDoc().pages[pageName] == true
      );
    }

    // Check if user can manage orders (includes biller page access)
    function canManageOrders() {
      return hasPageAccess('orders') || hasPageAccess('biller');
    }

    // Check if user can manage inventory
    function canManageInventory() {
      return hasPageAccess('inventory');
    }

    // Check if user is any type of staff member
    function isStaff() {
      return hasRoleDoc();
    }

    function isDeliveryOrder(data) {
      return data != null && data.orderType == 'delivery';
    }

    function deliveryCanUpdateOrder() {
      // Delivery user can only update delivery orders, and only specific fields.
      return isDeliveryUser()
        && isDeliveryOrder(resource.data)
        && request.resource.data.diff(resource.data).changedKeys().hasOnly([
          'status',
          'statusHistory',
          'updatedAt',
          'deliveredAt'
        ]);
    }

    // =========================================
    // DELIVERY GEOFENCE HELPERS
    // =========================================

    function deliveryConfig() {
      return get(/databases/$(database)/documents/miscellaneous/settings).data;
    }

    function hasGeo(addr) {
      return addr.lat is number && addr.lng is number;
    }

    function withinBounds(lat, lng) {
      let cfg = deliveryConfig();
      return !(cfg.minLat is number && cfg.maxLat is number && cfg.minLng is number && cfg.maxLng is number)
        || (lat >= cfg.minLat && lat <= cfg.maxLat && lng >= cfg.minLng && lng <= cfg.maxLng);
    }

    function allowDeliveryFor(data) {
      return (data.orderType != 'delivery') || (
        data.customer is map && data.customer.address is map && hasGeo(data.customer.address)
        && withinBounds(data.customer.address.lat, data.customer.address.lng)
      );
    }

    // =========================================
    // ORDER COUNTER HELPERS
    // =========================================

    function isOrderCounterDoc(orderId) {
      return orderId.matches('^__counter__\\d{8}$');
    }

    function allowCounterWrite(data) {
      return data.__meta == 'orderCounter'
        && data.dateKey.matches('^\\d{8}$')
        && data.total is number
        && data.updatedAt is timestamp;
    }

    // =========================================
    // COLLECTION RULES
    // =========================================

    // -----------------------------------------
    // ROLES COLLECTION (Staff Management)
    // -----------------------------------------
    match /roles/{email} {
      // Users can read their own role (needed for frontend to check permissions)
      // Admins can read all roles
      allow read: if isAdmin() || (isSignedIn() && request.auth.token.email == email);
      
      // Only super admin and admins can create/update/delete roles
      // Super admin can manage all roles, admins cannot modify super admin's role
      allow create: if isAdmin();
      allow update: if isAdmin() && (isSuperAdmin() || email != superAdminEmail());
      allow delete: if isAdmin() && email != superAdminEmail(); // Cannot delete super admin
    }

    // -----------------------------------------
    // USERS COLLECTION (Customer Profiles)
    // -----------------------------------------
    match /users/{uid} {
      // Users can read/write their own document
      // Admins can read/write all user documents
      // Billers can write to 'guest' user for POS orders
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      allow write: if isAdmin() || (isSignedIn() && request.auth.uid == uid) || (hasPageAccess('biller') && uid == 'guest');

      // User's nested orders (legacy - prefer top-level orders collection)
      match /orders/{orderId} {
        allow create: if isAdmin() || ((isSignedIn() && request.auth.uid == uid) && allowDeliveryFor(request.resource.data));
        allow read: if isAdmin() || canManageOrders() || (isSignedIn() && request.auth.uid == uid);
        allow update: if isAdmin() || canManageOrders() || (isSignedIn() && request.auth.uid == uid);
        allow delete: if false; // Never delete orders
      }

      // All other user subcollections (cart, addresses, meta, etc.)
      match /{subcollection}/{docId} {
        allow read, write: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      }
    }

    // -----------------------------------------
    // ORDERS COLLECTION (Main Orders)
    // -----------------------------------------
    match /orders/{orderId} {
      // CREATE: Counter docs need special validation, regular orders need auth check
      allow create: if (
        isOrderCounterDoc(orderId)
          ? (allowCounterWrite(request.resource.data) && (isAdmin() || hasPageAccess('biller')))
          : (
            isAdmin() || hasPageAccess('biller') ||
            (
              (
                (isSignedIn() && request.auth.uid == request.resource.data.userId) ||
                (!isSignedIn() && request.resource.data.userId == null)
              ) && allowDeliveryFor(request.resource.data)
            )
          )
      );

      // READ: Staff can read all orders, users can read their own
      allow read: if (
        isOrderCounterDoc(orderId)
          ? (isAdmin() || hasPageAccess('biller'))
          : (
            isAdmin() || canManageOrders() || (isDeliveryUser() && isDeliveryOrder(resource.data)) ||
            (isSignedIn() && resource.data.userId == request.auth.uid)
          )
      );

      // UPDATE: Staff can update orders, users cannot update their own orders
      allow update: if (
        isOrderCounterDoc(orderId)
          ? (allowCounterWrite(request.resource.data) && (isAdmin() || hasPageAccess('biller')))
          : (isAdmin() || canManageOrders() || deliveryCanUpdateOrder())
      );

      // DELETE: Only admins can delete non-counter orders
      allow delete: if !isOrderCounterDoc(orderId) && isAdmin();
    }

    // -----------------------------------------
    // MENU COLLECTION (Categories with Items)
    // -----------------------------------------
    match /menu/{categoryId} {
      allow read: if true; // Public - anyone can view menu
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // LEGACY MENU COLLECTIONS
    // -----------------------------------------
    match /categories/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /menuItems/{doc} {
      allow read: if true;
      allow write: if isAdmin() || canManageInventory();
    }
    match /items/{doc} {
      allow read: if true;
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // IMAGES COLLECTION (Menu Item Images)
    // -----------------------------------------
    match /images/{imageId} {
      allow read: if true; // Public - needed to display menu
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // RAW MATERIALS / STOCK
    // -----------------------------------------
    match /raw_materials/{doc} {
      allow read: if isAdmin() || canManageInventory() || hasPageAccess('biller');
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // OTPs (Cash Manager Verification)
    // -----------------------------------------
    match /otps/{otpId} {
      allow read: if isAdmin() || hasPageAccess('biller') || canManageOrders();
      allow write: if isAdmin();
    }

    // -----------------------------------------
    // MISCELLANEOUS CONFIG
    // -----------------------------------------
    match /miscellaneous/{docId} {
      // Public read - needed for app settings, appearance, store status
      allow read: if true;
      
      // Write permissions vary by document
      allow write: if (
        // Settings - admin only (includes delivery geofence, payment config)
        (docId == 'settings' && isAdmin()) ||
        // Store status - admin only
        (docId == 'store' && isAdmin()) ||
        // Appearance - admin or staff with appearance access
        (docId == 'appearance' && (isAdmin() || hasPageAccess('appearance'))) ||
        // Daily counter - staff/admin can write (for order number generation)
        (docId == 'dailyCounter' && (isAdmin() || isStaff()))
      );
    }

    // -----------------------------------------
    // AUDIT LOGS
    // -----------------------------------------
    match /logs/{logId} {
      // Any staff member can create audit logs
      allow create: if isStaff();
      // Only admins can read/update/delete logs
      allow read, update, delete: if isAdmin();
    }

    // -----------------------------------------
    // HEALTH CHECK (Testing) - Read-only public
    // -----------------------------------------
    match /_health/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}

```

### Admin firestore.rules (venkys_admin/firestore.rules)
`$lang
rules_version = '2';

// =====================================================================
// UNIFIED FIRESTORE RULES - Venky's Chicken Xperience
// =====================================================================
// This single rules file is used by BOTH customer app and admin app.
// 
// ROLE HIERARCHY:
//   1. Super Admin (hardcoded) - swastiksaha1204@gmail.com - ALWAYS has full access
//   2. Admin (dynamic) - role: 'admin' in roles collection - Full access
//   3. Staff (dynamic) - role: 'staff' with page-specific permissions
//   4. Delivery (dynamic) - role: 'delivery' - Can view/update assigned deliveries
//   5. Customer - Regular signed-in users - Can manage own profile & orders
//   6. Guest - Unauthenticated - Can read public data only
//
// ROLE DOCUMENT STRUCTURE (roles/{email}):
//   {
//     role: 'admin' | 'staff' | 'delivery',
//     name: 'Display Name',
//     email: 'user@example.com',
//     pages: {
//       biller: true/false,      // POS billing
//       orders: true/false,      // Order management
//       inventory: true/false,   // Menu & stock management
//       analytics: true/false,   // Sales analytics
//       settings: true/false,    // App settings (admin only typically)
//       appearance: true/false,  // Theme customization
//       delivery: true/false,    // Delivery management
//     },
//     createdAt: timestamp,
//     updatedAt: timestamp,
//     createdBy: 'admin@email.com'
//   }
// =====================================================================

service cloud.firestore {
  match /databases/{database}/documents {

    // =========================================
    // HELPER FUNCTIONS
    // =========================================

    // Super admin email - HARDCODED, always has full access
    function superAdminEmail() {
      return 'swastiksaha1204@gmail.com';
    }

    // Check if user is signed in
    function isSignedIn() {
      return request.auth != null;
    }

    // Email is required for role-based access (roles are keyed by email)
    function hasEmail() {
      return isSignedIn() && request.auth.token.email is string && request.auth.token.email.size() > 0;
    }

    // Check if current user is the super admin
    function isSuperAdmin() {
      return hasEmail() && request.auth.token.email == superAdminEmail();
    }

    // Get role document for current user
    function getRoleDoc() {
      return get(/databases/$(database)/documents/roles/$(request.auth.token.email)).data;
    }

    // Check if user has a role document
    function hasRoleDoc() {
      return hasEmail() && exists(/databases/$(database)/documents/roles/$(request.auth.token.email));
    }

    // Role helpers
    function isStaffUser() {
      return hasRoleDoc() && getRoleDoc().role == 'staff';
    }

    function isDeliveryUser() {
      return hasRoleDoc() && getRoleDoc().role == 'delivery';
    }

    // Check if user is an admin (super admin OR role == 'admin')
    function isAdmin() {
      return isSuperAdmin() || (hasRoleDoc() && getRoleDoc().role == 'admin');
    }

    // Check if user has a specific page permission
    function hasPageAccess(pageName) {
      // IMPORTANT: Only 'staff' role uses page-level permissions.
      // Delivery users are restricted by role (delivery-only), not by pages.
      return isAdmin() || (
        isStaffUser() &&
        getRoleDoc().pages != null &&
        getRoleDoc().pages[pageName] == true
      );
    }

    // Check if user can manage orders (includes biller page access)
    function canManageOrders() {
      return hasPageAccess('orders') || hasPageAccess('biller');
    }

    // Check if user can manage inventory
    function canManageInventory() {
      return hasPageAccess('inventory');
    }

    // Check if user is any type of staff member
    function isStaff() {
      return hasRoleDoc();
    }

    function isDeliveryOrder(data) {
      return data != null && data.orderType == 'delivery';
    }

    function deliveryCanUpdateOrder() {
      // Delivery user can only update delivery orders, and only specific fields.
      return isDeliveryUser()
        && isDeliveryOrder(resource.data)
        && request.resource.data.diff(resource.data).changedKeys().hasOnly([
          'status',
          'statusHistory',
          'updatedAt',
          'deliveredAt'
        ]);
    }

    // =========================================
    // DELIVERY GEOFENCE HELPERS
    // =========================================

    function deliveryConfig() {
      return get(/databases/$(database)/documents/miscellaneous/settings).data;
    }

    function hasGeo(addr) {
      return addr.lat is number && addr.lng is number;
    }

    function withinBounds(lat, lng) {
      let cfg = deliveryConfig();
      return !(cfg.minLat is number && cfg.maxLat is number && cfg.minLng is number && cfg.maxLng is number)
        || (lat >= cfg.minLat && lat <= cfg.maxLat && lng >= cfg.minLng && lng <= cfg.maxLng);
    }

    function allowDeliveryFor(data) {
      return (data.orderType != 'delivery') || (
        data.customer is map && data.customer.address is map && hasGeo(data.customer.address)
        && withinBounds(data.customer.address.lat, data.customer.address.lng)
      );
    }

    // =========================================
    // ORDER COUNTER HELPERS
    // =========================================

    function isOrderCounterDoc(orderId) {
      return orderId.matches('^__counter__\\d{8}$');
    }

    function allowCounterWrite(data) {
      return data.__meta == 'orderCounter'
        && data.dateKey.matches('^\\d{8}$')
        && data.total is number
        && data.updatedAt is timestamp;
    }

    // =========================================
    // COLLECTION RULES
    // =========================================

    // -----------------------------------------
    // ROLES COLLECTION (Staff Management)
    // -----------------------------------------
    match /roles/{email} {
      // Users can read their own role (needed for frontend to check permissions)
      // Admins can read all roles
      allow read: if isAdmin() || (isSignedIn() && request.auth.token.email == email);
      
      // Only super admin and admins can create/update/delete roles
      // Super admin can manage all roles, admins cannot modify super admin's role
      allow create: if isAdmin();
      allow update: if isAdmin() && (isSuperAdmin() || email != superAdminEmail());
      allow delete: if isAdmin() && email != superAdminEmail(); // Cannot delete super admin
    }

    // -----------------------------------------
    // USERS COLLECTION (Customer Profiles)
    // -----------------------------------------
    match /users/{uid} {
      // Users can read/write their own document
      // Admins can read/write all user documents
      // Billers can write to 'guest' user for POS orders
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      allow write: if isAdmin() || (isSignedIn() && request.auth.uid == uid) || (hasPageAccess('biller') && uid == 'guest');

      // User's nested orders (legacy - prefer top-level orders collection)
      match /orders/{orderId} {
        allow create: if isAdmin() || ((isSignedIn() && request.auth.uid == uid) && allowDeliveryFor(request.resource.data));
        allow read: if isAdmin() || canManageOrders() || (isSignedIn() && request.auth.uid == uid);
        allow update: if isAdmin() || canManageOrders() || (isSignedIn() && request.auth.uid == uid);
        allow delete: if false; // Never delete orders
      }

      // All other user subcollections (cart, addresses, meta, etc.)
      match /{subcollection}/{docId} {
        allow read, write: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      }
    }

    // -----------------------------------------
    // ORDERS COLLECTION (Main Orders)
    // -----------------------------------------
    match /orders/{orderId} {
      // CREATE: Counter docs need special validation, regular orders need auth check
      allow create: if (
        isOrderCounterDoc(orderId)
          ? (allowCounterWrite(request.resource.data) && (isAdmin() || hasPageAccess('biller')))
          : (
            isAdmin() || hasPageAccess('biller') ||
            (
              (
                (isSignedIn() && request.auth.uid == request.resource.data.userId) ||
                (!isSignedIn() && request.resource.data.userId == null)
              ) && allowDeliveryFor(request.resource.data)
            )
          )
      );

      // READ: Allow staff members to list/query all orders (needed for admin dashboard)
      // Individual document reads still check specific permissions
      allow list: if isStaff();
      allow get: if (
        isOrderCounterDoc(orderId)
          ? (isAdmin() || hasPageAccess('biller'))
          : (
            isAdmin() || canManageOrders() || (isDeliveryUser() && isDeliveryOrder(resource.data)) ||
            (isSignedIn() && resource.data.userId == request.auth.uid)
          )
      );

      // UPDATE: Staff can update orders, users cannot update their own orders
      allow update: if (
        isOrderCounterDoc(orderId)
          ? (allowCounterWrite(request.resource.data) && (isAdmin() || hasPageAccess('biller')))
          : (isAdmin() || canManageOrders() || deliveryCanUpdateOrder())
      );

      // DELETE: Only admins can delete non-counter orders
      allow delete: if !isOrderCounterDoc(orderId) && isAdmin();
    }

    // -----------------------------------------
    // MENU COLLECTION (Categories with Items)
    // -----------------------------------------
    match /menu/{categoryId} {
      allow read: if true; // Public - anyone can view menu
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // LEGACY MENU COLLECTIONS
    // -----------------------------------------
    match /categories/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /menuItems/{doc} {
      allow read: if true;
      allow write: if isAdmin() || canManageInventory();
    }
    match /items/{doc} {
      allow read: if true;
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // IMAGES COLLECTION (Menu Item Images)
    // -----------------------------------------
    match /images/{imageId} {
      allow read: if true; // Public - needed to display menu
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // RAW MATERIALS / STOCK
    // -----------------------------------------
    match /raw_materials/{doc} {
      allow read: if isAdmin() || canManageInventory() || hasPageAccess('biller');
      allow write: if isAdmin() || canManageInventory();
    }

    // -----------------------------------------
    // OTPs (Cash Manager Verification)
    // -----------------------------------------
    match /otps/{otpId} {
      allow read: if isAdmin() || hasPageAccess('biller') || canManageOrders();
      allow write: if isAdmin();
    }

    // -----------------------------------------
    // MISCELLANEOUS CONFIG
    // -----------------------------------------
    match /miscellaneous/{docId} {
      // Public read - needed for app settings, appearance, store status
      allow read: if true;
      
      // Write permissions vary by document
      allow write: if (
        // Settings - admin only (includes delivery geofence, payment config)
        (docId == 'settings' && isAdmin()) ||
        // Store status - admin only
        (docId == 'store' && isAdmin()) ||
        // Appearance - admin or staff with appearance access
        (docId == 'appearance' && (isAdmin() || hasPageAccess('appearance'))) ||
        // Daily counter - staff/admin can write (for order number generation)
        (docId == 'dailyCounter' && (isAdmin() || isStaff()))
      );
    }

    // -----------------------------------------
    // AUDIT LOGS
    // -----------------------------------------
    match /logs/{logId} {
      // Any staff member can create audit logs
      allow create: if isStaff();
      // Only admins can read/update/delete logs
      allow read, update, delete: if isAdmin();
    }

    // -----------------------------------------
    // HEALTH CHECK (Testing) - Read-only public
    // -----------------------------------------
    match /_health/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}

```

### Customer firestore.indexes.json (venkys/firestore.indexes.json)
`$lang
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}

```

### Admin firestore.indexes.json (venkys_admin/firestore.indexes.json)
`$lang
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}

```

### Customer Firebase init (venkys/src/lib/firebase.js)
`$lang
// Firebase app initialization and exports for Firestore
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Fail fast if required envs are missing in development
if (import.meta.env.DEV) {
  for (const [key, val] of Object.entries(firebaseConfig)) {
    if (!val) console.warn(`[firebase] Missing env for ${key}`)
  }
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

```

### Admin Firebase init (venkys_admin/src/lib/firebase.js)
`$lang
// Firebase app initialization for admin portal
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (import.meta.env.DEV) {
  for (const [key, val] of Object.entries(firebaseConfig)) {
    if (!val) console.warn(`[firebase] Missing env for ${key}`)
  }
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

```

### Customer AuthContext (venkys/src/context/AuthContext.jsx)
`$lang
// AuthContext — Firebase authentication state and helpers
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'

import { auth } from '../lib/firebase'
import { ensureUserDocument } from '../lib/userData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null)
      setUser(firebaseUser)
      setLoading(false)
      if (firebaseUser) {
        // Ensure a users/{uid} document exists
        try {
          await ensureUserDocument(firebaseUser)
        } catch (e) {
          console.warn('Failed to ensure user doc:', e)
        }
      }
    })
    return () => unsub()
  }, [])

  const signup = useCallback(async (email, password, displayName) => {
    setError(null)
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    await ensureUserDocument(cred.user)
    return cred.user
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  // Google sign-in
  const loginWithGoogle = useCallback(async () => {
    setError(null)
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return cred.user
  }, [])

  // Phone OTP helpers
  const getRecaptchaVerifier = useCallback((containerId = 'recaptcha-container') => {
    // Reuse if exists
    const anyWin = window
    if (anyWin.recaptchaVerifier) return anyWin.recaptchaVerifier
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    })
    anyWin.recaptchaVerifier = verifier
    return verifier
  }, [])

  const sendOtp = useCallback(async (e164Phone, containerId = 'recaptcha-container') => {
    setError(null)
    const verifier = getRecaptchaVerifier(containerId)
    return signInWithPhoneNumber(auth, e164Phone, verifier)
  }, [getRecaptchaVerifier])

  const verifyOtp = useCallback(async (confirmationResult, code) => {
    setError(null)
    const cred = await confirmationResult.confirm(code)
    return cred.user
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    error,
    signup,
    login,
    logout,
    loginWithGoogle,
    sendOtp,
    verifyOtp,
  }), [user, loading, error, signup, login, logout, loginWithGoogle, sendOtp, verifyOtp])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

```

### Admin AuthContext (venkys_admin/src/context/AuthContext.jsx)
`$lang
// AuthContext — Firebase auth with role-based access control
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { auth, db } from '../lib/firebase'
import { ensureUserDocument } from '../lib/userData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null) // null | { isStaffMember, role, isAdmin }
  const [roleLoading, setRoleLoading] = useState(true)

  const canAccess = useCallback((pageKey) => {
    const roleName = role?.role
    if (!role?.isStaffMember || !roleName) return false
    if (roleName === 'admin') return true
    if (roleName === 'delivery') return pageKey === 'delivery'
    // Staff: prefer explicit pages permissions if present
    if (role?.pages && typeof role.pages === 'object') {
      return !!role.pages[pageKey]
    }
    // Back-compat defaults (existing installs)
    if (roleName === 'staff') {
      return ['orders', 'biller', 'inventory', 'stock', 'analytics'].includes(pageKey)
    }
    return false
  }, [role])

  // Check user role from /roles/{email} collection
  const refreshRole = useCallback(async (email) => {
    if (!email) {
      setRole(null)
      setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    try {
      const roleRef = doc(db, 'roles', email.toLowerCase().trim())
      const roleSnap = await getDoc(roleRef)
      if (roleSnap.exists()) {
        const data = roleSnap.data()
        const userRole = data.role || 'staff'
        setRole({
          isStaffMember: true,
          role: userRole,
          name: data.name || '',
          pages: data.pages && typeof data.pages === 'object' ? data.pages : null,
          defaultPage: data.defaultPage || null,
          isAdmin: userRole === 'admin',
          isStaff: userRole === 'staff',
        isDelivery: userRole === 'delivery'
        })
      } else {
        // No role document = no access
      setRole({ isStaffMember: false, role: null, isAdmin: false, isStaff: false, isDelivery: false, pages: null, defaultPage: null, name: '' })
      }
    } catch (err) {
      console.error('[AuthContext] Role check failed:', err)
    setRole({ isStaffMember: false, role: null, isAdmin: false, isStaff: false, isDelivery: false, pages: null, defaultPage: null, name: '' })
    } finally {
      setRoleLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await refreshRole(firebaseUser.email)
      } else {
        setRole(null)
        setRoleLoading(false)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [refreshRole])

  const signup = useCallback(async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    await ensureUserDocument(cred.user)
    return cred.user
  }, [])

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return cred.user
  }, [])

  const getRecaptchaVerifier = useCallback((containerId = 'recaptcha-container') => {
    if (window.recaptchaVerifier) return window.recaptchaVerifier
    const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
    window.recaptchaVerifier = verifier
    return verifier
  }, [])

  const sendOtp = useCallback(async (e164Phone, containerId = 'recaptcha-container') => {
    const verifier = getRecaptchaVerifier(containerId)
    return signInWithPhoneNumber(auth, e164Phone, verifier)
  }, [getRecaptchaVerifier])

  const verifyOtp = useCallback(async (confirmationResult, code) => {
    const cred = await confirmationResult.confirm(code)
    return cred.user
  }, [])

  const value = useMemo(() => ({ 
    user, 
    loading, 
    role, 
    roleLoading, 
    // Helper booleans for easy access
    isStaffMember: role?.isStaffMember || false, // Has any role (admin or staff)
    isAdmin: role?.isAdmin || false,             // Is admin (full access)
    isStaff: role?.isStaff || false,             // Is staff (limited access)
    isDelivery: role?.isDelivery || false,
    canAccess,
    refreshRole: () => refreshRole(user?.email),
    signup, 
    login, 
    logout, 
    loginWithGoogle, 
    sendOtp, 
    verifyOtp 
  }), [user, loading, role, roleLoading, canAccess, refreshRole, signup, login, logout, loginWithGoogle, sendOtp, verifyOtp])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

```

### Customer userData helper (venkys/src/lib/userData.js)
`$lang
// Firestore helpers for users collection
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function ensureUserDocument(user) {
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    // Optionally update last seen
    // await updateDoc(ref, { updatedAt: serverTimestamp() })
  }
}

```

### Admin userData helper (venkys_admin/src/lib/userData.js)
`$lang
// Firestore helpers for ensuring admin user document exists
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function ensureUserDocument(user) {
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  const email = (typeof user.email === 'string' && user.email.trim()) ? user.email.trim() : null
  const emailLower = email ? email.toLowerCase() : null
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || '',
      email,
      emailLower,
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    try {
      await setDoc(ref, { updatedAt: serverTimestamp(), ...(emailLower ? { emailLower } : {}) }, { merge: true })
    } catch {
      // non-fatal bookkeeping failure
    }
  }
}

```

### Admin user/domain data file (venkys_admin/src/lib/data-user.js)
`$lang
// User profile, addresses, theme, guest user, and avatar (admin)
import { collection, doc, getDocs, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { safeRandomId, normalizeTextKey } from './data-common'

function addressSignature(address = {}) {
  return [
    normalizeTextKey(address?.line1),
    normalizeTextKey(address?.line2),
    normalizeTextKey(address?.city),
    normalizeTextKey(address?.zip),
    normalizeTextKey(address?.placeId),
  ].join('|')
}

export const GUEST_USER_ID = 'guest'

// ── Guest user ──
export async function ensureGuestUser() {
  const ref = doc(db, 'users', GUEST_USER_ID)
  let exists = false
  try {
    const snap = await getDoc(ref)
    exists = snap.exists()
  } catch {
    // ignore existence check errors
  }
  const payload = {
    isGuest: true,
    name: 'Guest',
    role: 'guest',
    updatedAt: serverTimestamp(),
  }
  if (!exists) payload.createdAt = serverTimestamp()
  await setDoc(ref, payload, { merge: true })
  return GUEST_USER_ID
}

// ── Users ──
export async function getUser(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUser(uid, data) {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

// ── User preferences (theme) ──
export async function getUserTheme(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    const t = snap.data().theme
    return t === 'venkys_dark' || t === 'venkys_light' ? t : null
  } catch {
    return null
  }
}

export async function setUserTheme(uid, theme) {
  if (!uid) return
  const normalized = theme === 'venkys_dark' ? 'venkys_dark' : 'venkys_light'
  await setDoc(doc(db, 'users', uid), { theme: normalized, updatedAt: serverTimestamp() }, { merge: true })
}

// ── User Profile ──
export async function fetchUserProfile(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.warn('fetchUserProfile failed', e)
    return null
  }
}

export async function updateUserProfile(uid, data) {
  if (!uid) return
  const allowed = ['displayName', 'phone']
  const out = {}
  for (const k of allowed) {
    if (data[k] === undefined) continue
    let v = data[k]
    if (typeof v === 'string') v = v.trim()
    out[k] = v
  }
  await setDoc(doc(db, 'users', uid), { ...out, updatedAt: serverTimestamp() }, { merge: true })
}

// ── Addresses ──
export async function addAddress(uid, address) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  const list = snap.exists() && Array.isArray(snap.data().list) ? snap.data().list : []
  const id = address.id || safeRandomId('addr')
  const normalized = (() => {
    const nm = (v) => (typeof v === 'string' ? v.trim() : v)
    const obj = {
      id,
      name: nm(address.name) || nm(address.tag) || 'Address',
      tag: nm(address.tag) || 'Other',
      line1: nm(address.line1) || '',
      ...(nm(address.line2) ? { line2: nm(address.line2) } : {}),
      city: nm(address.city) || '',
      zip: nm(address.zip) || '',
      ...(nm(address.phone) ? { phone: nm(address.phone) } : {}),
      ...(typeof address.lat === 'number' ? { lat: address.lat } : {}),
      ...(typeof address.lng === 'number' ? { lng: address.lng } : {}),
      ...(nm(address.placeId) ? { placeId: nm(address.placeId) } : {}),
      ...(nm(address.mapUrl) ? { mapUrl: nm(address.mapUrl) } : {}),
    }
    return obj
  })()
  const signature = addressSignature(normalized)
  const existing = list.find(a => addressSignature(a) === signature)
  if (existing) return existing.id
  const next = [...list, normalized]
  const payload = { list: next, updatedAt: serverTimestamp() }
  if (list.length === 0) payload.defaultId = id
  await setDoc(ref, payload, { merge: true })
  return id
}

export async function updateAddress(uid, id, patch) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const list = Array.isArray(data.list) ? data.list : []
  const nm = (v) => (typeof v === 'string' ? v.trim() : v)
  const allowedKeys = new Set(['name','tag','line1','line2','city','zip','phone','lat','lng','placeId','mapUrl'])
  const cleaned = {}
  Object.entries(patch || {}).forEach(([k,v]) => {
    if (!allowedKeys.has(k)) return
    const val = nm(v)
    if (val === '' || val === undefined) {
      cleaned[k] = ''
    } else {
      cleaned[k] = val
    }
  })
  const next = list.map(a => {
    if (a.id !== id) return a
    const base = {
      id: a.id,
      name: nm(cleaned.name ?? a.name) || nm(cleaned.tag ?? a.tag) || 'Address',
      tag: nm(cleaned.tag ?? a.tag) || 'Other',
      line1: nm(cleaned.line1 ?? a.line1) || '',
      ...(nm(cleaned.line2 ?? a.line2) ? { line2: nm(cleaned.line2 ?? a.line2) } : {}),
      city: nm(cleaned.city ?? a.city) || '',
      zip: nm(cleaned.zip ?? a.zip) || '',
      ...(nm(cleaned.phone ?? a.phone) ? { phone: nm(cleaned.phone ?? a.phone) } : {}),
      ...(typeof (cleaned.lat ?? a.lat) === 'number' ? { lat: Number(cleaned.lat ?? a.lat) } : {}),
      ...(typeof (cleaned.lng ?? a.lng) === 'number' ? { lng: Number(cleaned.lng ?? a.lng) } : {}),
      ...(nm(cleaned.placeId ?? a.placeId) ? { placeId: nm(cleaned.placeId ?? a.placeId) } : {}),
      ...(nm(cleaned.mapUrl ?? a.mapUrl) ? { mapUrl: nm(cleaned.mapUrl ?? a.mapUrl) } : {}),
    }
    return base
  })
  const updated = next.find(a => a.id === id)
  if (updated) {
    const sig = addressSignature(updated)
    const duplicate = next.find(a => a.id !== id && addressSignature(a) === sig)
    if (duplicate) throw new Error('Duplicate address entry is not allowed')
  }
  await setDoc(ref, { list: next, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteAddress(uid, id) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const list = Array.isArray(data.list) ? data.list : []
  const next = list.filter(a => a.id !== id)
  const payload = { list: next, updatedAt: serverTimestamp() }
  if (data.defaultId === id) {
    payload.defaultId = next.length ? next[0].id : null
  }
  await setDoc(ref, payload, { merge: true })
}

export async function fetchAddresses(uid) {
  if (!uid) return []
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return { list: [], defaultId: null }
  const data = snap.data()
  return { list: Array.isArray(data.list) ? data.list : [], defaultId: data.defaultId || null }
}

export async function setDefaultAddress(uid, id) {
  if (!uid || !id) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  await setDoc(ref, { defaultId: id, updatedAt: serverTimestamp() }, { merge: true })
}

// ── Avatar ──
export function getAvatarUrl(userOrProfile) {
  if (userOrProfile?.photoURL) return userOrProfile.photoURL
  const seed = userOrProfile?.displayName || userOrProfile?.name || userOrProfile?.email || 'User'
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
  if (userOrProfile?.gender) {
    const g = userOrProfile.gender.toLowerCase()
    if (g === 'male') {
      url += `&top[]=shortHair&top[]=shortHairDreads&top[]=shortHairFrizzle&top[]=shortHairShaggy&top[]=shortHairSides&top[]=shortHairTheCaesar&facialHairProbability=50`
    } else if (g === 'female') {
      url += `&top[]=longHair&top[]=longHairBob&top[]=longHairBun&top[]=longHairCurly&top[]=longHairCurvy&top[]=longHairDreads&top[]=longHairFrida&top[]=longHairFro&top[]=longHairMiaWallace&top[]=longHairNotTooLong&top[]=longHairShavedSides&top[]=longHairStraight&top[]=longHairStraight2&top[]=longHairStraightStrand&facialHairProbability=0`
    }
  }
  return url
}

// ── OTP ──
export async function getRandomOtp() {
  const snap = await getDocs(collection(db, 'otps'))
  if (snap.empty) return null
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const random = list[Math.floor(Math.random() * list.length)]
  return random
}

```

### Database/auth findings
`$lang
Database:
- Firestore is the primary database.
- Shared collections/subcollections inferred from rules and data access:
  - `roles/{email}`
  - `users/{uid}`
  - `users/{uid}/orders/{orderId}` (legacy)
  - `users/{uid}/meta/cart`
  - `users/{uid}/meta/addresses`
  - `orders/{orderId}`
  - `menu/{categoryId}`
  - `categories/{id}` (legacy)
  - `menuItems/{id}` (legacy)
  - `items/{id}` (legacy)
  - `images/{imageId}`
  - `raw_materials/{id}`
  - `otps/{otpId}`
  - `miscellaneous/appearance`
  - `miscellaneous/settings`
  - `miscellaneous/businessProfile`
  - `miscellaneous/store` (legacy)
  - `miscellaneous/dailyCounter` / order counter doc pattern
  - `logs/{logId}`
  - `_health/{doc}`
Auth:
- Firebase Authentication.
- Customer app supports:
  - email/password signup + login
  - Google popup login
  - phone OTP login via Firebase Auth + invisible reCAPTCHA
- Admin app supports the same Firebase auth methods, then adds Firestore role gating via `roles/{email}`.
- Firestore rules hardcode a super-admin email: `swastiksaha1204@gmail.com`.
```

## 8. STATE MANAGEMENT

### State management summary
`$lang
Customer app:
- `AuthContext` for auth state and login helpers.
- `CartContext` for cart reducer + persistence + guest/local merge behavior.
- `UIContext` for auth modal state, item modal state, toasts, and confirm dialog.
- Component-local state in major pages (`Home`, `Checkout`, `Profile`, etc.).

Admin app:
- `AuthContext` for auth + role/permission state.
- `UIContext` for auth modal, toasts, and confirms.
- Heavy page-local state in admin pages (`Orders`, `AdminBiller`, `Inventory`, `Settings`, etc.).
- No Redux/Zustand/Pinia/MobX found.
```

### Customer CartContext (venkys/src/context/CartContext.jsx)
`$lang
// CartContext — Shopping cart state management with persistence
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

import { useAuth } from './AuthContext'
import { useUI } from './UIContext'
import { loadCart, saveCart } from '../lib/data'

const CartContext = createContext(null)
const GUEST_CART_KEY = 'venkys_guest_cart_v1'

function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const items = action.items && typeof action.items === 'object' ? action.items : {}
      return { items }
    }
    case 'ADD': {
      const { item } = action
      const existing = state.items[item.id]
      const qty = (existing?.qty || 0) + (action.qty || 1)
      return {
        ...state,
        items: {
          ...state.items,
          [item.id]: { item, qty },
        },
      }
    }
    case 'REMOVE': {
      const { id } = action
      const { [id]: _, ...rest } = state.items
      return { ...state, items: rest }
    }
    case 'SET_QTY': {
      const { id, qty } = action
      if (qty <= 0) {
        const { [id]: _, ...rest } = state.items
        return { ...state, items: rest }
      }
      return {
        ...state,
        items: {
          ...state.items,
          [id]: { item: state.items[id].item, qty },
        },
      }
    }
    case 'CLEAR':
      return { items: {} }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: {} })
  const { user } = useAuth()
  const { pushToast, openAuth } = useUI()
  const saveTimer = useRef(null)
  const lastSerialized = useRef('')
  const saveDeniedRef = useRef(false)
  const loadedOnceRef = useRef(false)
  const guestLoadedRef = useRef(false)

  function readGuestCart() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_CART_KEY) : null
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  function writeGuestCart(items) {
    try {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items || {}))
    } catch { /* no-op */ }
  }
  function clearGuestCart() {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(GUEST_CART_KEY) } catch { /* no-op */ }
  }

  // Load cart when user logs in; merge guest cart if present
  useEffect(() => {
    if (!user) {
      // Hydrate guest cart from localStorage when not logged in
      if (!guestLoadedRef.current) {
        const guestItems = readGuestCart()
        dispatch({ type: 'HYDRATE', items: guestItems })
        guestLoadedRef.current = true
      }
      return
    }
    let mounted = true
    loadCart(user.uid).then(items => {
      if (!mounted) return
      if (items && items.__error === 'permission-denied') {
        pushToast('Cart access denied. Please re-login or check permissions.', 'error', 6000)
        loadedOnceRef.current = true
        return
      }
      if (items && typeof items === 'object') {
        const backendItems = items.__error ? {} : items
        const guestItems = readGuestCart()
        // Merge guest into backend (sum quantities)
        const merged = { ...backendItems }
        Object.entries(guestItems || {}).forEach(([id, entry]) => {
          const current = merged[id]
          const qty = (current?.qty || 0) + (entry?.qty || 0)
          if (qty > 0) merged[id] = { item: entry.item || current?.item, qty }
        })
        dispatch({ type: 'HYDRATE', items: merged })
        // Save merged to backend and clear guest storage
        saveCart(user.uid, merged).catch(() => {})
        clearGuestCart()
      }
      loadedOnceRef.current = true
    })
    return () => { mounted = false }
  }, [user, pushToast])

  // Persist (debounced) when items change
  useEffect(() => {
    const serialized = JSON.stringify(state.items)
    if (serialized === lastSerialized.current) return
    lastSerialized.current = serialized
    // Guest persistence
    if (!user) {
      writeGuestCart(state.items)
      return
    }
    if (!loadedOnceRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await saveCart(user.uid, state.items)
      if (res && res.__error === 'permission-denied' && !saveDeniedRef.current) {
        saveDeniedRef.current = true
        pushToast('Cannot save cart (permission denied).', 'error', 5000)
      }
    }, 600) // debounce 600ms
    return () => saveTimer.current && clearTimeout(saveTimer.current)
  }, [state.items, user, pushToast])

  const value = useMemo(() => {
    const entries = Object.values(state.items)
    const subtotal = entries.reduce((sum, { item, qty }) => {
      const unit = Number(item?.rate ?? item?.price ?? 0)
      return sum + unit * qty
    }, 0)
    const totalQty = entries.reduce((sum, { qty }) => sum + qty, 0)

    return {
      items: state.items,
      entries,
      subtotal,
      totalQty,
      add: (item, qty = 1) => {
        dispatch({ type: 'ADD', item, qty })
        // Optional: Notify user item added
        // pushToast(`Added ${item.name} to cart`, 'success')
      },
      remove: (id) => dispatch({ type: 'REMOVE', id }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      clear: () => {
        dispatch({ type: 'CLEAR' })
        try { if (typeof localStorage !== 'undefined') localStorage.removeItem(GUEST_CART_KEY) } catch {}
        if (user) {
          saveCart(user.uid, {}).catch(() => {})
        }
      },
    }
  }, [state, user])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

```

### Customer UIContext (venkys/src/context/UIContext.jsx)
`$lang
// UIContext — Global UI state (modals, auth mode, theme)
import { createContext, useContext, useMemo, useState, useCallback } from 'react'

const UIContext = createContext(null)

const genId = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`)

export function UIProvider({ children }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [authMode, setAuthMode] = useState(null) // 'login' | 'signup' | null
  const [toasts, setToasts] = useState([]) // {id, type, msg}
  const [confirmState, setConfirmState] = useState(null) // { message, onConfirm, onCancel }

  const pushToast = useCallback((msg, type = 'info', ttl = 5000) => {
    const id = genId()
    setToasts(t => [...t, { id, msg, type }])
    if (ttl > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl)
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const confirm = useCallback((options) => {
    setConfirmState({ ...options })
  }, [])

  const resolveConfirm = useCallback((accepted) => {
    setConfirmState(prev => {
      if (!prev) return null
      const { onConfirm, onCancel } = prev
      if (accepted) onConfirm && onConfirm()
      else onCancel && onCancel()
      return null
    })
  }, [])

  const openItem = useCallback((item) => setSelectedItem(item), [])
  const closeItem = useCallback(() => setSelectedItem(null), [])
  const openAuth = useCallback((mode) => setAuthMode(mode), [])
  const closeAuth = useCallback(() => setAuthMode(null), [])

  const value = useMemo(() => ({
    selectedItem,
    openItem,
    closeItem,
    authMode,
    openAuth,
    closeAuth,
    // Toasts
    toasts,
    pushToast,
    dismissToast,
    // Confirm modal
    confirm,
    confirmState,
    resolveConfirm,
  }), [selectedItem, authMode, toasts, confirmState, openItem, closeItem, openAuth, closeAuth, pushToast, dismissToast, confirm, resolveConfirm])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

let _uiWarned = false
export function useUI() {
  const ctx = useContext(UIContext)
  if (ctx) return ctx
  // Fallback (prevents hard crash if provider ordering issue). Warn once.
  if (!_uiWarned) {
    console.warn('[UIContext] useUI called outside of provider – returning no-op fallback. Wrap app with <UIProvider/> to enable full functionality.')
    _uiWarned = true
  }
  return {
    selectedItem: null,
    openItem: () => {},
    closeItem: () => {},
    authMode: null,
    openAuth: () => {},
    closeAuth: () => {},
    toasts: [],
  pushToast: () => genId(),
    dismissToast: () => {},
    confirm: () => {},
    confirmState: null,
    resolveConfirm: () => {},
  }
}

```

### Admin UIContext (venkys_admin/src/context/UIContext.jsx)
`$lang
// UIContext — Global UI state (auth mode, toasts)
import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const UIContext = createContext(null)

const genId = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`)

export function UIProvider({ children }) {
  const [authMode, setAuthMode] = useState(null) // 'login' | 'signup' | null
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  const dismissToast = useCallback((id) => { setToasts(t => t.filter(x => x.id !== id)) }, [])

  const pushToast = useCallback((msg, type = 'info', ttl = 8000, action = null) => {
    const id = genId()
    setToasts(t => [...t, { id, msg, type, action }])
    if (ttl > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl)
    return id
  }, [])

  const confirm = useCallback((options) => { setConfirmState({ ...options }) }, [])

  const resolveConfirm = useCallback((accepted) => {
    setConfirmState(prev => {
      if (!prev) return null
      const { onConfirm, onCancel } = prev
      if (accepted) onConfirm && onConfirm(); else onCancel && onCancel()
      return null
    })
  }, [])

  const openAuth = useCallback((mode) => setAuthMode(mode), [])
  const closeAuth = useCallback(() => setAuthMode(null), [])

  const value = useMemo(() => ({
    authMode,
    openAuth,
    closeAuth,
    toasts,
    pushToast,
    dismissToast,
    confirm,
    confirmState,
    resolveConfirm,
  }), [authMode, toasts, confirmState, openAuth, closeAuth, pushToast, dismissToast, confirm, resolveConfirm])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}

```

## 9. PAYMENT INTEGRATION

### Payment gateway summary
`$lang
- Gateway: Razorpay.
- No Stripe / PayU / PayPal / webhook handler files were found.
- Customer flow verifies cart amount server-side against Firestore menu data before Razorpay order creation.
- Admin POS flow trusts staff-entered total and creates a POS-specific Razorpay order.
- Payment verification is signature-based HMAC verification on the server; no webhook persistence flow is present.
```

### Customer payment client helpers (venkys/src/lib/data-payments.js)
`$lang
// Razorpay payment functions
import { apiUrl, getAuthHeaders } from './data-common'

let __publicConfigCache = null

export async function fetchPublicConfig() {
  if (__publicConfigCache) return __publicConfigCache
  const url = apiUrl('/api/public-config')
  const res = await fetch(url, { method: 'GET' })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    throw new Error(body?.error || `Failed to load public config (${res.status})`)
  }
  __publicConfigCache = body || {}
  return __publicConfigCache
}

export async function getRazorpayKeyId() {
  const fromVite = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (fromVite) return String(fromVite)
  try {
    const cfg = await fetchPublicConfig()
    if (cfg?.razorpayKeyId) return String(cfg.razorpayKeyId)
  } catch { /* noop */ }
  return ''
}

// items: [{ name, rate, qty, categoryId? }] - sent for server-side price verification
export async function createRazorpayOrder(amount, items = null, cartChecksum = null) {
  const value = Number(amount)
  if (!value || value <= 0) {
    throw new Error('Invalid amount for Razorpay order')
  }
  const authHeaders = await getAuthHeaders()
  const payload = { amount: value, cartChecksum: cartChecksum || undefined }
  if (Array.isArray(items) && items.length) {
    payload.items = items.map(it => ({
      name: it.name,
      rate: Number(it.rate ?? it.price ?? 0),
      qty: Number(it.qty || 1),
      categoryId: it.categoryId || undefined,
    }))
  }
  const res = await fetch(apiUrl('/api/create-order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    const message = body?.error || `Failed to create Razorpay order (${res.status})`
    throw new Error(message)
  }
  return body
}

export async function verifyRazorpayPayment(payload) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(apiUrl('/api/verify-payment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    const message = body?.error || `Payment verification failed (${res.status})`
    throw new Error(message)
  }
  return body
}

```

### Admin payment client helpers (venkys_admin/src/lib/data-payments.js)
`$lang
// Razorpay payment helpers & public-config (admin POS)
import { apiUrl, getAuthHeaders } from './data-common'

let __publicConfigCache = null
let __publicConfigFailed = false

export async function fetchPublicConfig() {
  if (__publicConfigCache) return __publicConfigCache
  // Don't retry after a failure (until page refresh)
  if (__publicConfigFailed) {
    throw new Error('Public config fetch previously failed - page refresh required')
  }
  try {
    const url = apiUrl('/api/public-config')
    const res = await fetch(url, { method: 'GET' })
    let body = null
    try { body = await res.json() } catch {}
    if (!res.ok) {
      __publicConfigFailed = true
      const errorMsg = body?.error || `Failed to load public config (${res.status})`
      console.error('[fetchPublicConfig] Failed:', errorMsg)
      throw new Error(errorMsg)
    }
    __publicConfigCache = body || {}
    return __publicConfigCache
  } catch (e) {
    __publicConfigFailed = true
    console.error('[fetchPublicConfig] Exception:', e)
    throw e
  }
}

export async function getRazorpayKeyId() {
  const fromVite = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (fromVite) return String(fromVite)
  try {
    const cfg = await fetchPublicConfig()
    if (cfg?.razorpayKeyId) return String(cfg.razorpayKeyId)
  } catch (e) {
    console.error('[getRazorpayKeyId] Failed to fetch config:', e)
  }
  return ''
}

// Admin POS: trusted caller — no cart-item verification needed
export async function createRazorpayOrder(amount) {
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Invalid amount for Razorpay order')
  const authHeaders = await getAuthHeaders()
  const res = await fetch(apiUrl('/api/create-order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ amount: value })
  })
  let body = null
  try { body = await res.json() } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(body?.error || `Failed to create Razorpay order (${res.status})`)
  }
  return body
}

export async function verifyRazorpayPayment(payload) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(apiUrl('/api/verify-payment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  })
  let body = null
  try { body = await res.json() } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(body?.error || `Payment verification failed (${res.status})`)
  }
  return body
}

```

### Customer payment server create-order (venkys/api/create-order.js)
`$lang
/* eslint-env node */
// Vercel Serverless Function: Create Razorpay Order
// Endpoint: /api/create-order
// Method: POST
// Body: { amount: number, items?: [...], cartChecksum?: string }
// Returns: { orderId, amount, currency }
// Server verifies amount against menu prices when items are provided.

import Razorpay from 'razorpay'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const rateLimiter = createRateLimiter({ routeName: 'create-order' })

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (sa) {
    try { initializeApp({ credential: cert(JSON.parse(sa)) }) } catch { initializeApp() }
  } else {
    initializeApp()
  }
}

// Max allowed difference between client amount and server-computed total (₹)
const PRICE_TOLERANCE = 1

/**
 * Verify client-sent cart total against Firestore menu prices.
 * Returns { valid, serverTotal, message? }
 */
async function verifyCartAmount(items, clientAmount) {
  if (!Array.isArray(items) || !items.length) {
    // No items sent — skip verification (backward compat)
    return { valid: true, serverTotal: clientAmount }
  }
  try {
    const db = getFirestore()
    const menuSnap = await db.collection('menu').get()
    // Build price lookup: lowercase item name → rate
    const priceLookup = new Map()
    menuSnap.docs.forEach(catDoc => {
      const data = catDoc.data()
      const catItems = Array.isArray(data.items) ? data.items : []
      catItems.forEach(item => {
        const name = String(item.name || '').trim().toLowerCase()
        if (!name) return
        // Store base rate
        const rate = Number(item.rate ?? item.price ?? 0)
        priceLookup.set(name, rate)
        // Also index variants
        if (Array.isArray(item.variants)) {
          item.variants.forEach(v => {
            const vLabel = String(v.label || v.name || '').trim().toLowerCase()
            if (vLabel) {
              priceLookup.set(`${name}::${vLabel}`, Number(v.rate ?? v.price ?? rate))
            }
          })
        }
      })
    })

    let serverTotal = 0
    for (const item of items) {
      const name = String(item.name || '').trim().toLowerCase()
      const qty = Number(item.qty || 1)
      const variantLabel = String(item.variantLabel || '').trim().toLowerCase()
      // Look up price: try variant-specific first, then base item
      let serverRate = variantLabel ? priceLookup.get(`${name}::${variantLabel}`) : undefined
      if (serverRate === undefined) serverRate = priceLookup.get(name)
      if (serverRate === undefined) {
        // Item not found in menu — allow the client rate (could be add-on or custom)
        serverRate = Number(item.rate || 0)
      }
      serverTotal += serverRate * qty
    }
    serverTotal = Math.round(serverTotal * 100) / 100

    const diff = Math.abs(clientAmount - serverTotal)
    if (diff > PRICE_TOLERANCE) {
      return {
        valid: false,
        serverTotal,
        message: `Price mismatch: client sent ₹${clientAmount}, server computed ₹${serverTotal}`
      }
    }
    return { valid: true, serverTotal }
  } catch (err) {
    // If menu lookup fails, don't block the order — log and allow
    console.warn('[create-order] Price verification failed, allowing order:', err.message)
    return { valid: true, serverTotal: clientAmount }
  }
}

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: Allow origins from CORS_ORIGIN env (comma-separated), or reflect the request origin if not set
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    allowOrigin = list.includes(origin) ? origin : list[0] || '*'
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  try {
    const { amount, items, cartChecksum } = req.body || {}
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Server-side amount ceiling to prevent abuse (max ₹50,000 per order)
    const MAX_ORDER_AMOUNT = 50000
    if (Number(amount) > MAX_ORDER_AMOUNT) {
      return res.status(400).json({ error: 'Amount exceeds maximum order limit', maxAmount: MAX_ORDER_AMOUNT })
    }

    // Verify cart total against menu prices
    const verification = await verifyCartAmount(items, Number(amount))
    if (!verification.valid) {
      return res.status(400).json({ error: verification.message })
    }
    // Use server-verified amount when items were provided
    const finalAmount = verification.serverTotal

    const options = {
      amount: Math.round(finalAmount * 100), // in paise
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
      notes: { checksum: cartChecksum || 'na' }
    }

    const order = await razorpay.orders.create(options)
    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (e) {
    console.error('create-order error', e)
    return res.status(500).json({ error: 'Failed to create order' })
  }
}

```

### Customer payment server verify-payment (venkys/api/verify-payment.js)
`$lang
/* eslint-env node */
// Vercel Serverless Function: Verify Razorpay Payment Signature
// Endpoint: /api/verify-payment
// Method: POST
// Body: { orderId: string, paymentId: string, signature: string }
// Returns: { valid: boolean }

import crypto from 'crypto'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'

const rateLimiter = createRateLimiter({ routeName: 'verify-payment' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: Allow origins from CORS_ORIGIN env (comma-separated), or reflect the request origin if not set
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    allowOrigin = list.includes(origin) ? origin : list[0] || '*'
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  try {
    const { orderId, paymentId, signature } = req.body || {}
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification payload' })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret not configured' })
    }

    const payload = `${orderId}|${paymentId}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    
    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    const valid = expectedBuffer.length === signatureBuffer.length && 
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer)

    if (!valid) {
      return res.status(400).json({ error: 'Invalid payment signature', valid: false })
    }

    return res.status(200).json({ valid: true })
  } catch (err) {
    console.error('verify-payment error', err)
    return res.status(500).json({ error: 'Failed to verify payment' })
  }
}

```

### Customer payment public-config (venkys/api/public-config.js)
`$lang
/* eslint-env node */

// Public (non-secret) runtime config for the frontend.
// Safe to expose: Razorpay Key ID is public.

import { createRateLimiter } from './lib/rateLimiter.js'

const rateLimiter = createRateLimiter({ routeName: 'public-config' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: allow all origins (public config)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const razorpayKeyId = (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim()

  res.status(200).json({
    razorpayKeyId,
  })
}

```

### Admin payment server create-order (venkys_admin/api/create-order.js)
`$lang
/* eslint-env node */
// Vercel Serverless Function: Create Razorpay Order
// Endpoint: /api/create-order
// Method: POST
// Body: { amount: number }
// Returns: { orderId, amount, currency }

import Razorpay from 'razorpay'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'

const rateLimiter = createRateLimiter({ routeName: 'create-order' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: Allow origins from CORS_ORIGIN env (comma-separated), or reflect the request origin if not set
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
    if (list.includes(origin)) allowOrigin = origin
    else if (isLocalhost) allowOrigin = origin
    else if (list.length) allowOrigin = list[0]
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  try {
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Payment gateway not configured' })
    }

    const { amount } = req.body || {}
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Server-side amount ceiling to prevent abuse (max ₹50,000 per order)
    const MAX_ORDER_AMOUNT = 50000
    if (Number(amount) > MAX_ORDER_AMOUNT) {
      return res.status(400).json({ error: 'Amount exceeds maximum order limit', maxAmount: MAX_ORDER_AMOUNT })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const options = {
      amount: Math.round(Number(amount) * 100), // in paise
      currency: 'INR',
      receipt: 'pos_rcpt_' + Date.now(),
      notes: { source: 'admin_pos' }
    }

    const order = await razorpay.orders.create(options)
    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (e) {
    console.error('create-order error', e)
    return res.status(500).json({ error: 'Failed to create order' })
  }
}

```

### Admin payment server verify-payment (venkys_admin/api/verify-payment.js)
`$lang
/* eslint-env node */
// Vercel Serverless Function: Verify Razorpay Payment Signature
// Endpoint: /api/verify-payment
// Method: POST
// Body: { orderId: string, paymentId: string, signature: string }
// Returns: { valid: boolean }

import crypto from 'crypto'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'

const rateLimiter = createRateLimiter({ routeName: 'verify-payment' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: Allow origins from CORS_ORIGIN env (comma-separated), or reflect the request origin if not set
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
    if (list.includes(origin)) allowOrigin = origin
    else if (isLocalhost) allowOrigin = origin
    else if (list.length) allowOrigin = list[0]
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfigured (missing secret)' })
    }
    const { orderId, paymentId, signature } = req.body || {}
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expected, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    const valid = expectedBuffer.length === signatureBuffer.length && 
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    return res.status(200).json({ valid })
  } catch (e) {
    console.error('verify-payment error', e)
    return res.status(500).json({ error: 'Verification failed' })
  }
}

```

### Admin payment public-config (venkys_admin/api/public-config.js)
`$lang
/* eslint-env node */

// Public (non-secret) runtime config for the frontend.
// Safe to expose: Razorpay Key ID is public.

import { createRateLimiter } from './lib/rateLimiter.js'

const rateLimiter = createRateLimiter({ routeName: 'public-config' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: allow all origins (public config)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const razorpayKeyId = (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim()

  res.status(200).json({
    razorpayKeyId,
  })
}

```

### Customer Checkout payment/order snippet
`$lang
        const amountRupees = Number(subtotal)
        if (!amountRupees || amountRupees <= 0) {
          throw new Error('Cart total must be greater than zero for online payment.')
        }
        // Send cart items for server-side price verification
        const cartItems = entries.map(({ item, qty }) => ({
          name: item.name,
          rate: item?.rate ?? item?.price ?? 0,
          qty,
          categoryId: item.categoryId || undefined,
          variantLabel: item.variantLabel || undefined,
        }))
        const razorpayOrder = await createRazorpayOrder(amountRupees, cartItems)
        razorpayOrderId = razorpayOrder.orderId
        const RazorpayConstructor = await ensureRazorpay()
        let settled = false
        const paymentResponse = await new Promise((resolve, reject) => {
          const instance = new RazorpayConstructor({
            key: keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: BRAND_LONG,
            description: 'Order payment',
            order_id: razorpayOrder.orderId,
            prefill: {
              name: form.name || '',
              email: form.email || '',
              contact: form.phone || ''
            },
            notes: {
              cartSize: String(entries.length)
            },
            theme: {
              color: '#F97316'
            },
            handler: (response) => {
              if (settled) return
              settled = true
              resolve({
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                orderId: response.razorpay_order_id
              })
            },
            modal: {
              ondismiss: () => {
                if (!settled) {
                  settled = true
                  reject(new Error('Payment cancelled'))
                }
              }
            }
          })
          instance.on('payment.failed', (event) => {
            if (settled) return
            settled = true
            const description = event?.error?.description || 'Payment failed'
            reject(new Error(description))
          })
          instance.open()
          // Workaround: Some Razorpay SVGs set height="auto" which is invalid on SVG attributes.
          // Strip invalid attributes to silence console errors in some browsers.
          const fixInvalidSvg = () => {
            try {
              const svgs = document.querySelectorAll('svg[height="auto"]')
              svgs.forEach((el) => {
                el.removeAttribute('height')
                // allow CSS to control height; width usually set via viewBox
              })
            } catch { /* noop */ }
          }
          // Attempt a few times while modal builds
          fixInvalidSvg()
          let tries = 0
          const t = setInterval(() => {
            fixInvalidSvg()
            tries += 1
            if (tries > 10) clearInterval(t)
          }, 150)
        })

        const verification = await verifyRazorpayPayment({
          orderId: razorpayOrderId,
          paymentId: paymentResponse.paymentId,
          signature: paymentResponse.signature
        })
        if (!verification?.valid) {
          throw new Error('Payment verification failed. Please contact support.')
        }
        paymentInfo.status = 'paid'
        paymentInfo.paymentId = paymentResponse.paymentId
        paymentInfo.orderId = razorpayOrderId
        paymentInfo.signature = paymentResponse.signature
        paymentInfo.amount = Number(subtotal)
        paymentInfo.currency = razorpayOrder.currency
        paymentInfo.verified = true
      }

      const orderIdValue = await createOrder({
        userId: user?.uid || null,
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: {
            tag: addressTagValue,
            name: addressTagValue,
            line: addressLineCombined,
            line1: form.addressLine1,
            line2: form.addressLine2,
            city: form.city,
            state: form.state,
            pin: form.pin,
            landmark: form.landmark,
            phone: form.addressPhone || form.phone,
            lat,
```

### Admin POS payment/order snippet
`$lang
             pushToast('OTP Error: ' + e.message, 'error')
          } finally {
             setOtpSending(false)
          }
       } else if (payMethod === 'online') {
         try {
           // Get Razorpay key from environment
           const keyId = await getRazorpayKeyId()
           if (!keyId) {
             throw new Error('Online payments are not configured. Please check browser console for details, or contact admin to add RAZORPAY_KEY_ID to Vercel environment variables.')
           }
           if (!grandTotal || grandTotal <= 0) throw new Error('Amount must be greater than zero.')

           const razorpayOrder = await createRazorpayOrder(Number(grandTotal))
           const RazorpayCtor = await ensureRazorpay()
           let settled = false
           const paymentResponse = await new Promise((resolve, reject) => {
             const instance = new RazorpayCtor({
               key: keyId,
               amount: razorpayOrder.amount,
               currency: razorpayOrder.currency,
               name: BRAND_LONG,
               description: 'POS dine-in payment',
               order_id: razorpayOrder.orderId,
               prefill: {
                 name: customerDetails.name || 'Dine-in Guest',
                 contact: customerDetails.phone || '',
               },
               notes: { source: 'admin_pos' },
               handler: (response) => {
                 if (settled) return
                 settled = true
                 resolve(response)
               },
               modal: {
                 ondismiss: () => { if (!settled) { settled = true; reject(new Error('Payment cancelled')) } }
               }
             })
             instance.on('payment.failed', (event) => {
               if (settled) return
               settled = true
               const description = event?.error?.description || 'Payment failed'
               reject(new Error(description))
             })
             instance.open()
           })

           const verification = await verifyRazorpayPayment({
             orderId: razorpayOrder.orderId,
             paymentId: paymentResponse.razorpay_payment_id,
             signature: paymentResponse.razorpay_signature,
           })
           if (!verification?.valid) {
             throw new Error('Payment verification failed.')
           }

           const paymentOverride = {
             method: 'online',
             status: 'paid',
             reference: paymentResponse.razorpay_payment_id,
             gateway: 'razorpay',
             orderId: razorpayOrder.orderId,
           }

           await submitBill({ otpVerified: true, navigateToOrders: true, paymentOverride })
         } catch (e) {
           console.error('Online payment failed', e)
           pushToast(e.message || 'Online payment failed', 'error')
         }
       } else {
         await submitBill()
       }
    }
  }

    async function submitBill({ otpVerified = false, navigateToOrders = false, otpValue = null, paymentOverride = null } = {}) {
    if (!lines.length) { pushToast('Add items to bill', 'error'); return }
    try {
      setSubmitting(true)

      const userIdForOrder = guestMode ? await ensureGuestUser() : null
      const orderItems = lines.map(({ item, qty }) => ({ name: item.name, rate: Number(item.rate ?? item.price) || 0, qty }))
      const payment = paymentOverride || buildPaymentPayload(payMethod)
      const customer = { 
        dineIn: true, 
        servedBy: user?.email || user?.uid || 'biller', 
        payment,
        name: guestMode ? 'Guest' : (customerDetails.name || 'Guest'),
        phone: guestMode ? '' : (customerDetails.phone || '')
      }
      
      let createdOrderNo = null
      if (editOrder && editOrder.id) {
        const targetUserId = editOrder.userId || (guestMode ? GUEST_USER_ID : null)
        await updateOrder(targetUserId, editOrder.id, { items: orderItems, subtotal, customer, orderType: 'dine-in', source: 'pos', totalAmount: grandTotal }, user?.uid || user?.email || 'pos')
        pushToast(`Order updated #${editOrder.orderNo || editOrder.id}`, 'success')
        setEditOrder(null)
        await refreshRecent()
      } else {
        createdOrderNo = await generateDailyOrderNo('dine-in', user?.uid || user?.email || 'POS')
        const now = new Date()
        const guestMeta = guestMode ? {
          guestOrder: true,
          guestOrderDate: now.toISOString().slice(0, 10),
          guestOrderAt: now.toISOString(),
        } : {}

        const effectiveOtp = otpValue || expectedOtp
        const shouldAttachOtp = payMethod === 'cod' && !!effectiveOtp
        const otpMeta = shouldAttachOtp ? {
          cashManagerOtp: effectiveOtp,
          cashManagerOtpFor: 'dine-in-cod',
          cashManagerOtpVerified: !!otpVerified,
          cashManagerOtpVerifiedAt: otpVerified ? new Date().toISOString() : null,
          cashManagerOtpVerifiedBy: otpVerified ? (user?.email || user?.uid || 'pos') : null,
        } : {}

        const initialStatus = otpVerified || payment?.status === 'paid' ? 'preparing' : 'placed'

        const id = await createOrder({
          userId: userIdForOrder,
          customer,
          items: orderItems,
          orderType: 'dine-in',
          source: 'pos',
          orderNo: createdOrderNo,
          totalAmount: grandTotal,
          status: initialStatus,
          ...guestMeta,
          ...otpMeta,
        })
        setSuccess({ id, orderNo: createdOrderNo, items: orderItems, subtotal, total: grandTotal, payment })
        pushToast(`Bill created #${createdOrderNo}`, 'success')
        await refreshRecent()

        if (navigateToOrders || (shouldAttachOtp && !otpVerified)) {
          navigate('/admin/orders', { state: { highlightOrderId: createdOrderNo, autoOpen: true } })
        }
      }
      
      // Send Invoice automatically if phone provided
      if (customerDetails.phone) {
          const phoneRaw = customerDetails.phone
          const finalOrderNo = (editOrder?.orderNo) || createdOrderNo || ''
          const itemsSummary = Array.isArray(orderItems)
            ? orderItems
              .map(it => `${Number(it.qty || 1)}x ${String(it.name || '').trim()}`.trim())
              .filter(Boolean)
              .join(', ')
              .slice(0, 1000)
            : ''
```

## 10. CART & ORDER FLOW

### Flow trace summary
`$lang
Customer web flow:
1. Menu browsing starts on `Home.jsx`, which loads categories/items from Firestore and renders `MenuItemCard`.
2. Add-to-cart can happen from `MenuItemCard` or `ItemModal`, both writing into `CartContext`.
3. Cart surface appears in `CartDrawer`, `FloatingCartBar`, and `QuickDock`.
4. Checkout happens in `Checkout.jsx`, which uses addresses/profile data, optional Google geocoding, optional Razorpay, then `createOrder()`.
5. Order confirmation/updates continue through `ActiveOrders.jsx` and `Profile.jsx` using Firestore reads/listeners.
6. WhatsApp confirmations go through `lib/whatsapp.js` -> `data-orders.js` -> `/api/send-whatsapp`.

Admin/POS order flow:
1. `AdminBiller.jsx` builds dine-in bills from menu data.
2. It can take COD or Razorpay payment, optionally attach OTP metadata, then create/update Firestore orders.
3. `Orders.jsx` manages acceptance, OTP verification, status advancement, stock deduction, and review-message sending.
4. Inventory side effects come from `data-inventory.js` when accepted orders deduct stock.
```

### Customer Home.jsx (venkys/src/pages/Home.jsx)
`$lang
// Home — Menu browsing page with search, filters, and categories
import { useCallback, useEffect, useMemo, useState, startTransition } from 'react'

import { doc, onSnapshot } from 'firebase/firestore'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdLocalOffer, MdOutlineAutoAwesome, MdOutlineBolt, MdTrackChanges } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import CategoriesBar from '../components/CategoriesBar'
import FilterBar from '../components/FilterBar'
import MenuItemCard from '../components/MenuItemCard'
import ProfileCompletionAlert from '../components/ProfileCompletionAlert'
import { DEFAULT_SPOTLIGHT, fetchAppearanceSettings, fetchImagesByIdsCached, fetchLatestUserOrder, fetchMenuCategories, fetchUserProfile, getImageDataUrl, fetchAddresses } from '../lib/data'
import { db } from '../lib/firebase'

// ── Helpers ──

// Debounce helper for search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function Home() {
  // ── State & refs ──
  const [categories, setCategories] = useState([]) // docs from 'menu'
  const [menu, setMenu] = useState([]) // flattened items with categoryId
  const [imageMap, setImageMap] = useState({}) // { imageId: { data, mime } }
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const debouncedQ = useDebounce(q, 300)
  const [vegFilter, setVegFilter] = useState('all') // all | veg | nonveg
  const [sortBy, setSortBy] = useState('default') // default | price-asc | price-desc | name-asc | name-desc
  const [searchVisibleCount, setSearchVisibleCount] = useState(24)
  const [activeOrder, setActiveOrder] = useState(null)
  const [storeOpen, setStoreOpen] = useState(true)
  const [spotlight, setSpotlight] = useState(() => ({
    hotDeals: Array.isArray(DEFAULT_SPOTLIGHT.hotDeals) ? [...DEFAULT_SPOTLIGHT.hotDeals] : [],
    chefSpecials: Array.isArray(DEFAULT_SPOTLIGHT.chefSpecials) ? [...DEFAULT_SPOTLIGHT.chefSpecials] : [],
    hiddenHotDeals: !!DEFAULT_SPOTLIGHT.hiddenHotDeals,
    hiddenChefSpecials: !!DEFAULT_SPOTLIGHT.hiddenChefSpecials,
    hiddenSpotlight: !!DEFAULT_SPOTLIGHT.hiddenSpotlight,
  }))
  const [spotlightLoaded, setSpotlightLoaded] = useState(false)
  const { user } = useAuth()
  // Removed unused profile state
  const [profileForm, setProfileForm] = useState({ displayName: '', phone: '', gender: '' })
  const [addrState, setAddrState] = useState({ list: [], defaultId: null })
  // Keep prompt flag without exposing unused setter
  const [showProfilePrompt] = useState(true)
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [])
  const formatCurrency = useCallback((value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null
    return currencyFormatter.format(value)
  }, [currencyFormatter])

  // ── Side-effects ──
  // Load profile and addresses for completion calculation - with fallback to auth user data
  useEffect(() => {
    if (!user) { setProfileForm({ displayName: '', phone: '', gender: '' }); setAddrState({ list: [], defaultId: null }); return }
    fetchUserProfile(user.uid).then(p => {
      setProfileForm({
        displayName: p?.displayName || user.displayName || '',
        phone: p?.phone || user.phoneNumber || '',
        gender: p?.gender || ''
      })
    })
    // Fetch addresses
    fetchAddresses(user.uid).then(a => setAddrState(a)).catch(() => setAddrState({ list: [], defaultId: null }))
  }, [user])

  const location = useLocation()
  const navigate = useNavigate()
  // Completion UI handled by ProfileCompletionAlert component

  useEffect(() => {
    let mounted = true
    fetchMenuCategories()
      .then((docs) => {
        if (!mounted) return
        const cats = docs.map((d) => ({
          id: d.id,
          name: d.name || d.id,
          imageId: d.imageId || null,
          items: Array.isArray(d.items) ? d.items : []
        }))
        const flat = cats.flatMap((c) =>
          (c.items || []).flatMap((it, idx) => {
            const processItem = (sourceItem, idSuffixOverride = null) => {
              const sourceRate = (typeof sourceItem.rate === 'number' ? sourceItem.rate : Number(sourceItem.rate))
              const sourceMrp = (typeof sourceItem.mrp === 'number' ? sourceItem.mrp : Number(sourceItem.mrp))
              const sourceDiscount = (typeof sourceItem.discountPercent === 'number' ? sourceItem.discountPercent : Number(sourceItem.discountPercent))

              const rateNumber = typeof sourceRate === 'number' ? sourceRate : Number(sourceRate)
              const effectiveRate = Number.isFinite(rateNumber) && rateNumber >= 0 
                ? Math.round(rateNumber) 
                : Math.round(Number(sourceItem.price) || 0)

              const mrpNumberRaw = typeof sourceMrp === 'number' ? sourceMrp : Number(sourceMrp)
              
              const discountRaw = typeof sourceDiscount === 'number' ? sourceDiscount : Number(sourceDiscount)
              
              // If we have a fixed discount in DB, use it directly (user preference)
              // Otherwise derive it from MRP/Rate if possible
              let discountNumber = Number.isFinite(discountRaw) && discountRaw > 0 ? discountRaw : null

              // Recalculate MRP if discount is fixed (Rate / (1 - Disc%))
              // The user requested only MRP needs recalculation in this case
              let mrpNumber = Number.isFinite(mrpNumberRaw) && mrpNumberRaw > 0 ? Math.round(mrpNumberRaw) : null
              
              if (discountNumber !== null && effectiveRate > 0) {
                 const calculatedMrp = (effectiveRate * 100) / (100 - discountNumber)
                 mrpNumber = Math.round(calculatedMrp)
              } else if (mrpNumber && mrpNumber > effectiveRate) {
                 // Fallback: derive discount if not explicit
                 const derived = ((mrpNumber - effectiveRate) / mrpNumber) * 100
                 if (discountNumber === null) {
                    discountNumber = Math.round(derived)
                 }
              }

              const baseName = sourceItem.name || ''
              
              const uniqueIdSuffix = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

              const finalIdx = idSuffixOverride !== null ? idSuffixOverride : idx

              return {
                id: `${c.id}-${finalIdx}-${uniqueIdSuffix}`,
                name: baseName,
                desc: sourceItem.desc || sourceItem.description || '',
                rate: effectiveRate,
                mrp: mrpNumber,
                discountPercent: discountNumber,
                rating: typeof sourceItem.rating === 'number' ? sourceItem.rating : Number(sourceItem.rating),
                veg: sourceItem.veg === false ? false : true,
                active: sourceItem.active === false ? false : true,
                categoryId: c.id,
                category: c.id,
                categoryName: c.name || c.id,
                imageId: sourceItem.imageId || null,
                components: Array.isArray(sourceItem.components) ? sourceItem.components : [],
                isCustom: !!sourceItem.isCustom,
                variants: Array.isArray(sourceItem.variants) ? sourceItem.variants : []
              }
            }

            // Handle nested variants: Item -> Variant -> Sizes
            // We split items with nested variants into separate cards (e.g. "Grilled Chicken (Tandoori)")
            // each containing their respective sizes.
            if (Array.isArray(it.variants) && it.variants.some(v => Array.isArray(v.sizes) && v.sizes.length > 0)) {
               return it.variants.map((v, vIdx) => {
                  const cloned = { ...it, ...v }
                  // Use a descriptive name: "Variant Name Item Name" (Admin style)
                  cloned.name = `${v.name} ${it.name}`
                  // The new item's variants are now the sizes from the nested structure
                  cloned.variants = v.sizes
                  // Use image from variant if available
                  if (v.imageId) cloned.imageId = v.imageId
                  if (v.image) cloned.image = v.image

                  // Find the costlier option (max price) to display on the card
                  // This is purely for display; actual selection happens in modal/dropdown
                  if (Array.isArray(v.sizes) && v.sizes.length > 0) {
                     const maxPriceSize = v.sizes.reduce((prev, curr) => {
                        const prevRate = Number(prev.rate ?? prev.price ?? 0)
                        const currRate = Number(curr.rate ?? curr.price ?? 0)
                        return currRate > prevRate ? curr : prev
                     }, v.sizes[0])
                     
                     if (maxPriceSize) {
                        cloned.rate = Math.round(Number(maxPriceSize.rate ?? maxPriceSize.price ?? 0))
                        // If discount logic needs to apply to the displayed max price
                        if (cloned.discountPercent) {
                           // Recalc MRP based on this new rate + fixed discount
                           const calcMrp = (cloned.rate * 100) / (100 - cloned.discountPercent)
                           cloned.mrp = Math.round(calcMrp)
                        } else {
                           cloned.mrp = Math.round(Number(maxPriceSize.mrp ?? 0))
                        }
                     }
                  }

                  return processItem(cloned, `${idx}-v${vIdx}`) 
               })
            }

            return processItem(it)
          })
        )
        setCategories(cats)
        setMenu(flat)
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  // Live store status
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'miscellaneous', 'settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (Object.prototype.hasOwnProperty.call(data, 'open')) {
          setStoreOpen(data.open !== false)
        }
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let active = true
    fetchAppearanceSettings()
      .then((res) => {
        if (!active) return
        const incoming = res?.spotlight && typeof res.spotlight === 'object' ? res.spotlight : DEFAULT_SPOTLIGHT
        const normalized = {
          hotDeals: Array.isArray(incoming.hotDeals) ? [...incoming.hotDeals] : [],
          chefSpecials: Array.isArray(incoming.chefSpecials) ? [...incoming.chefSpecials] : [],
          hiddenHotDeals: !!incoming.hiddenHotDeals,
          hiddenChefSpecials: !!incoming.hiddenChefSpecials,
          hiddenSpotlight: !!incoming.hiddenSpotlight,
        }
        setSpotlight(normalized)
      })
      .catch(() => {
        if (!active) return
        setSpotlight({ hotDeals: [], chefSpecials: [], hiddenHotDeals: false, hiddenChefSpecials: false })
      })
      .finally(() => {
        if (active) setSpotlightLoaded(true)
      })
    return () => { active = false }
  }, [])

  // Load latest order for banner - reduced polling frequency
  useEffect(() => {
    if (!user) { setActiveOrder(null); return }
    let active = true
    fetchLatestUserOrder(user.uid).then(o => {
      if (!active) return
      const status = String(o?.status || '').toLowerCase()
      setActiveOrder(o && status && status !== 'delivered' && status !== 'rejected' ? o : null)
    })
    const id = setInterval(() => {
      fetchLatestUserOrder(user.uid).then(o => {
        if (!active) return
        const status = String(o?.status || '').toLowerCase()
        setActiveOrder(o && status && status !== 'delivered' && status !== 'rejected' ? o : null)
      })
    }, 30000) // poll every 30s (was 15s) to reduce network load
    return () => { active = false; clearInterval(id) }
  }, [user])

  // Respond to navigation state and custom events for scrolling/resetting
  useEffect(() => {
    // Custom event listener for "soft" resets when already on page
    const handleReset = () => {
      setQ('')
      setVegFilter('all')
      setSortBy('default')
      setSearchVisibleCount(24)
    }
    window.addEventListener('reset-home-view', handleReset)

    if (location.state?.reset) {
      setQ('')
      setVegFilter('all')
      setSortBy('default')
      setSearchVisibleCount(24)
      // If we only wanted to reset filters without scrolling to top:
      // if (!location.state?.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      navigate(location.pathname, { replace: true, state: {} })
    } else if (location.state?.scrollTo === 'menu') {
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      navigate(location.pathname, { replace: true, state: {} })
    } else if (location.hash === '#menu') {
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1))
      const el = document.getElementById(id)
      if (el) {
        el.style.scrollMarginTop = '84px'
        // Use smooth scrolling for a subtle transition
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    
    return () => window.removeEventListener('reset-home-view', handleReset)
  }, [location, navigate])

  // Map Firestore categories to CategoriesBar items (id, label, optional href)
  // Resolve category-level images (imageId stored on category doc)
  const [categoryImageMap, setCategoryImageMap] = useState({}) // { imageId: dataUrl }
  useEffect(() => {
    const ids = categories.map(c => c.imageId).filter(Boolean)
    if (!ids.length) { setCategoryImageMap({}); return }
    let active = true
    fetchImagesByIdsCached(ids).then(map => {
      if (!active) return
      const out = {}
      Object.entries(map).forEach(([id, d]) => {
        out[id] = getImageDataUrl(d)
      })
      setCategoryImageMap(out)
    }).catch(()=>{})
    return () => { active = false }
  }, [categories])

  // ── Image helpers ──
  // Clean resolver: just compute imageUrl, no debug logging
  function resolveImageUrlFor(item) {
    const imgObj = item.imageId && imageMap[item.imageId]
    return imgObj ? getImageDataUrl(imgObj) : undefined
  }

  const categoryBarItems = useMemo(() =>
    categories.map((c) => ({ id: c.id, label: c.name, href: `#${encodeURIComponent(c.id)}`, image: c.imageId && categoryImageMap[c.imageId] })),
    [categories, categoryImageMap]
  )

  const filtered = useMemo(() => {
    const term = debouncedQ.trim().toLowerCase()
    const base = menu.filter((m) => {
      if (term && !(m.name || '').toLowerCase().includes(term)) return false
      if (vegFilter === 'veg') return m.veg !== false // treat undefined as veg
      if (vegFilter === 'nonveg') return m.veg === false
      if (m.active === false) return false
      return true
    })
    // Sorting
    const sorted = [...base]
    if (sortBy === 'price-asc') sorted.sort((a,b) => (a.rate||0) - (b.rate||0))
    else if (sortBy === 'price-desc') sorted.sort((a,b) => (b.rate||0) - (a.rate||0))
    else if (sortBy === 'name-asc') sorted.sort((a,b) => (a.name||'').localeCompare(b.name||''))
    else if (sortBy === 'name-desc') sorted.sort((a,b) => (b.name||'').localeCompare(a.name||''))
    return sorted
  }, [menu, debouncedQ, vegFilter, sortBy])

  const categoryNameMap = useMemo(() => {
    const map = {}
    categories.forEach(c => { map[c.id] = c.name || c.id })
    return map
  }, [categories])

  const makeMatchKey = useCallback((categoryId, itemName) => {
    const cat = String(categoryId || '').trim().toLowerCase()
    const label = String(itemName || '').trim().toLowerCase()
    return cat && label ? `${cat}::${label}` : ''
  }, [])

  const menuMatchMap = useMemo(() => {
    const map = new Map()
    menu.forEach((item) => {
      const key = makeMatchKey(item.categoryId, item.name)
      if (key) map.set(key, item)
    })
    return map
  }, [menu, makeMatchKey])

  const resolvedSpotlight = useMemo(() => {
    const classify = (entries) => {
      const safe = Array.isArray(entries) ? entries : []
      const active = []
      const inactive = []
      const missing = []
      safe.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return
        const keyCandidate = typeof entry.matchKey === 'string' && entry.matchKey.trim() ? entry.matchKey.trim().toLowerCase() : null
        const fallbackKey = makeMatchKey(entry.categoryId, entry.itemName)
        const key = keyCandidate || fallbackKey
        if (!key) {
          missing.push(entry)
          return
        }
        const matched = menuMatchMap.get(key)
        if (!matched) {
          missing.push(entry)
          return
        }
        if (matched.active === false) {
          inactive.push({ entry, item: matched })
          return
        }
        active.push({ entry, item: matched })
      })
      return { active, inactive, missing }
    }
    return {
      hotDeals: classify(spotlight?.hotDeals),
      chefSpecials: classify(spotlight?.chefSpecials),
    }
  }, [makeMatchKey, menuMatchMap, spotlight])

  const showSpotlightParent = !spotlight.hiddenSpotlight
  const showHotDealsCard = !spotlight.hiddenHotDeals
  const showChefSpecialsCard = !spotlight.hiddenChefSpecials
  const showSpotlightSection = showSpotlightParent && (showHotDealsCard || showChefSpecialsCard)

  const totalActiveItems = useMemo(() => menu.filter((m) => m.active !== false).length, [menu])

  const activeOrderSummary = useMemo(() => {
    if (!activeOrder) return null
    const itemCount = Array.isArray(activeOrder.items)
      ? activeOrder.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0)
      : null
    const total = typeof activeOrder.total === 'number'
      ? activeOrder.total
      : (typeof activeOrder.amount === 'number' ? activeOrder.amount : null)
    const billLabel = total != null ? formatCurrency(total) : null
    return { itemCount, total, billLabel }
  }, [activeOrder, formatCurrency])

  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }, [])

  const userFirstName = useMemo(() => {
    const raw = (profileForm.displayName || user?.displayName || '').trim()
    if (!raw) return 'there'
    return raw.split(/\s+/)[0]
  }, [profileForm.displayName, user])

  const handleSpotlightSelect = useCallback((itemName) => {
    const label = typeof itemName === 'string' ? itemName.trim() : ''
    if (!label) return
    const params = new URLSearchParams(location.search)
    params.set('q', label)
    navigate({ pathname: location.pathname, search: params.toString() })
  }, [location.pathname, location.search, navigate])

  // ── Spotlight cards ──
  function renderSpotlightCard({ key, title, icon, bucket, accentClass = 'text-primary', iconWrapperClass = 'bg-primary/10 text-primary', badgeClass = 'badge-warning' }) {
    const activeItems = bucket?.active || []
    const inactiveCount = bucket?.inactive?.length || 0
    const missingCount = bucket?.missing?.length || 0
    const hasIssues = inactiveCount + missingCount > 0
    const items = activeItems.slice(0, 3)
    const emptyMessage = !spotlightLoaded
      ? 'Loading spotlight picks...'
      : hasIssues
        ? 'Some specials are temporarily unavailable. New picks are on the way.'
        : 'Our spotlight dishes will appear here soon.'

    return (
      <article key={key} className="rounded-2xl border border-primary/30 bg-base-100/95 shadow-sm p-4 flex flex-col gap-3">
        <div className={`flex items-center gap-2 ${accentClass}`}>
          <span className={`w-9 h-9 rounded-xl grid place-items-center ${iconWrapperClass}`}>
            {icon}
          </span>
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <ul className="space-y-3">
          {items.length ? items.map(({ entry, item }) => {
            const imageUrl = item ? resolveImageUrlFor(item) : undefined
            const priceLabel = item ? formatCurrency(item?.rate ?? item?.price ?? 0) : null
            const discountLabel = item && typeof item.discountPercent === 'number'
              ? Math.round(item.discountPercent)
              : null
            const badgeText = entry?.badge || (discountLabel ? `-${discountLabel}%` : null)
            const titleLabel = entry?.label || item?.name || entry?.itemName || 'Spotlight dish'
            const captionLabel = entry?.caption
              || (item ? `${categoryNameMap[item.categoryId] || item.categoryId}${priceLabel ? ` • ${priceLabel}` : ''}` : null)
            const searchName = item?.name || entry?.itemName
            return (
              <li key={entry?.id || makeMatchKey(entry?.categoryId, entry?.itemName)}>
                <button
                  type="button"
                  onClick={() => handleSpotlightSelect(searchName)}
                  disabled={!searchName}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 text-left transition hover:border-primary/60 hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${searchName ? '' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <span className="w-12 h-12 rounded-lg overflow-hidden bg-primary/10 text-primary grid place-items-center font-semibold">
                    {imageUrl ? (
                      <img src={imageUrl} alt={titleLabel} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      (titleLabel || '?').charAt(0)
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-sm truncate">{titleLabel}</span>
                    {captionLabel ? <span className="text-xs opacity-70 block mt-0.5 truncate">{captionLabel}</span> : null}
                  </span>
                  {badgeText ? (
                    <span className={`badge ${badgeClass} badge-sm whitespace-nowrap`}>{badgeText}</span>
                  ) : null}
                </button>
              </li>
            )
          }) : (
            <li className="text-sm opacity-60">{emptyMessage}</li>
          )}
        </ul>
        {spotlightLoaded && items.length > 0 && hasIssues ? (
          <p className="text-xs opacity-60 border-t border-primary/20 pt-3">
            Some spotlight dishes are currently unavailable. We will refresh this list soon.
          </p>
        ) : null}
      </article>
    )
  }

  // Strict image loading chronology:
  // 1) Categories bar images (handled above)
  // 2) Then one category at a time in the current appearance order
  useEffect(() => {
    if (categories.length === 0) return
    let cancelled = false
    // Build sequential batches per category
    const perCategoryIds = categories.map(c => ({
      id: c.id,
      imageIds: Array.from(new Set((Array.isArray(c.items) ? c.items : []).map(i => i.imageId).filter(Boolean)))
    })).filter(x => x.imageIds.length)
    if (perCategoryIds.length === 0) return
    // Run sequentially to focus network on one category at a time
    async function run() {
      // Let the categories bar paint first
      await new Promise(r => requestAnimationFrame(r))
      for (const batch of perCategoryIds) {
        if (cancelled) return
        const ids = [...batch.imageIds]
        // Even within the category, fetch in small chunks to keep UI responsive
        const CHUNK = 12
        while (ids.length && !cancelled) {
          const slice = ids.splice(0, CHUNK)
          try {
            const res = await fetchImagesByIdsCached(slice)
            if (cancelled) return
            setImageMap(prev => ({ ...prev, ...res }))
          } catch { /* ignore network hiccups for individual slices */ }
          // Yield to main thread briefly between slices
          await new Promise(r => setTimeout(r, 0))
        }
        // Optional small gap between categories to smoothen LCP
        await new Promise(r => setTimeout(r, 20))
      }
    }
    run()
    return () => { cancelled = true }
  }, [categories])

  // Wire Home to URL query for integrated search only (filters remain live/local)
  // Use startTransition to keep UI responsive during search updates
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const term = params.get('q') || ''
    startTransition(() => {
      setQ(term)
      setSearchVisibleCount(24)
    })
  }, [location.search])

  // Reset filters on page change (route) – defaults every time
  useEffect(() => {
    setVegFilter('all')
    setSortBy('default')
  }, [location.pathname])

  // If searching, prefetch only the images needed for currently filtered items, in chunks.
  useEffect(() => {
    const term = q.trim().toLowerCase()
    if (!term) return
    const ids = Array.from(new Set(menu
      .filter(m => (m.name || '').toLowerCase().includes(term))
      .map(m => m.imageId)
      .filter(Boolean)))
    if (!ids.length) return
    let cancelled = false
    async function run() {
      const queue = [...ids]
      const CHUNK = 16
      while (queue.length && !cancelled) {
        const slice = queue.splice(0, CHUNK)
          try {
            const res = await fetchImagesByIdsCached(slice)
            if (cancelled) return
            setImageMap(prev => ({ ...prev, ...res }))
          } catch { /* noop */ }
        await new Promise(r => setTimeout(r, 0))
      }
    }
    run()
    return () => { cancelled = true }
  }, [q, menu])

  const searchTerm = q.trim()
  const isSearching = searchTerm.length > 0

  // ── Render ──
  if (loading) {
    return (
      <div className="page-wrap py-10">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap py-6 space-y-8 overflow-x-hidden">
      {isSearching ? (
        <>
          <section className="space-y-4" aria-labelledby="search-results-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="search-results-heading" className="text-3xl font-semibold">Search results</h2>
                <p className="text-sm opacity-70 mt-1">
                  {filtered.length
                    ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'} for “${searchTerm}”`
                    : `No dishes matched “${searchTerm}” yet.`}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setQ('')
                  setSearchVisibleCount(24)
                  const params = new URLSearchParams(location.search)
                  params.delete('q')
                  navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
                }}
              >Clear search</button>
            </div>
            <div className="px-1 sm:px-2">
              <FilterBar
                vegFilter={vegFilter}
                sortBy={sortBy}
                onVegChange={(v) => setVegFilter(v)}
                onSortChange={(s) => setSortBy(s)}
              />
            </div>
            <section className="space-y-4" id="search-results">
              <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.slice(0, searchVisibleCount).map((item) => {
                  const imageUrl = resolveImageUrlFor(item)
                  const categoryName = categoryNameMap[item.categoryId] || item.categoryName || item.categoryId
                  return <MenuItemCard key={item.id} item={{ ...item, categoryName, imageUrl, storeClosed: !storeOpen }} />
                })}
              </div>
              {filtered.length > searchVisibleCount && (
                <div className="flex justify-center">
                  <button className="btn btn-primary btn-outline" onClick={() => setSearchVisibleCount((c) => c + 24)}>Load more</button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs opacity-70">
                <span>Showing {Math.min(searchVisibleCount, filtered.length)} of {filtered.length}</span>
              </div>
              {filtered.length === 0 && (
                <div className="opacity-60">No matching items.</div>
              )}
            </section>
          </section>
        </>
      ) : (
        <>
          {activeOrder && (
            <section className="space-y-3">
              <div className="alert w-full rounded-3xl bg-secondary/10 border border-secondary/40 text-secondary shadow-lg animate-heartbeat flex flex-row flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                    <MdTrackChanges className="w-6 h-6" />
                  </span>
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-[0.12em]">Active order #{(activeOrder.id || '').slice(-6)}</p>
                    <p className="text-sm mt-1">
                      <span className="font-medium capitalize">{activeOrder.status}</span>
                      {activeOrderSummary?.itemCount ? ` • ${activeOrderSummary.itemCount} item${activeOrderSummary.itemCount === 1 ? '' : 's'}` : ''}
                    </p>
                    {activeOrderSummary?.billLabel ? (
                      <p className="text-sm opacity-80 mt-1">Bill total {activeOrderSummary.billLabel}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button" className="btn btn-sm btn-ghost text-secondary" onClick={() => navigate('/active-orders')}>
                    View order status
                  </button>
                </div>
              </div>
            </section>
          )}
          <section className="space-y-6">
            {!storeOpen && (
              <div className="rounded-2xl border border-red-600/40 bg-red-600 text-white shadow-lg p-4 flex flex-col gap-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-[0.12em]">Temporarily closed</span>
                  <span className="badge badge-xs badge-white text-red-600 font-bold">Offline</span>
                </div>
                <p className="text-sm leading-relaxed font-medium">
                  We are currently closed. You can still browse and add items to your cart. We'll be back soon!
                </p>
              </div>
            )}
            <div className="blend-panel hero-panel px-5 py-6 sm:px-10 sm:py-10 border border-transparent">
              <div className="flex flex-col gap-4 max-w-3xl">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.3em]">
                  <MdOutlineBolt className="w-4 h-4" />
                  Serving joy all day
                </span>
                <h1 className="text-3xl sm:text-5xl font-semibold leading-tight text-base-content/90">Good {timeOfDay}, {userFirstName}!</h1>
                <p className="text-sm sm:text-lg text-base-content/70 max-w-2xl">
                  {storeOpen
                    ? 'Your favourites are standing by. Browse, customise, and order whenever the craving hits.'
                    : 'We are prepping the kitchen right now. Plan your meal and add dishes to the cart—we will nudge you the moment we reopen.'}
                </p>
              </div>
            </div>
            {user && showProfilePrompt ? (
              <ProfileCompletionAlert
                user={user}
                profileForm={profileForm}
                addrState={addrState}
                onEdit={() => navigate('/profile', { state: { completeNow: true } })}
                className="bg-base-100/95 border-primary/30 rounded-2xl"
              />
            ) : null}
          </section>

          <section aria-label="Browse categories" className="space-y-4">
            <CategoriesBar items={categoryBarItems} />
          </section>

          {showSpotlightSection && (
            <section id="spotlight-deals" className="space-y-4">
              <div className="rounded-3xl border border-primary/25 bg-base-100/95 shadow-sm p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MdOutlineBolt className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-semibold">Spotlight picks</h2>
                  </div>
                  <p className="text-sm opacity-70">
                    {spotlightLoaded
                      ? 'Handpicked highlights to help you decide faster.'
                      : 'Fetching spotlight selections from the kitchen...'}
                  </p>
                </div>
                <div className={`grid gap-4 ${showHotDealsCard && showChefSpecialsCard ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
                  {showHotDealsCard ? renderSpotlightCard({
                    key: 'hot-deals',
                    title: 'Hot deals',
                    icon: <MdLocalOffer className="w-5 h-5" />,
                    bucket: resolvedSpotlight.hotDeals,
                    accentClass: 'text-primary'
                  }) : null}
                  {showChefSpecialsCard ? renderSpotlightCard({
                    key: 'chef-specials',
                    title: 'Chef specials',
                    icon: <MdOutlineAutoAwesome className="w-5 h-5" />,
                    bucket: resolvedSpotlight.chefSpecials,
                    accentClass: 'text-secondary',
                    iconWrapperClass: 'bg-secondary/10 text-secondary',
                    badgeClass: 'badge-secondary'
                  }) : null}
                </div>
              </div>
            </section>
          )}

          <section className="space-y-5" aria-labelledby="menu-heading">
            <div className="flex flex-wrap items-end justify-between gap-3" id="menu">
              <div>
                <h2 id="menu-heading" className="text-3xl font-semibold">Menu</h2>
                <p className="text-sm opacity-70 mt-1">
                  {`${filtered.length} dishes ${vegFilter === 'veg' ? '• vegetarian only' : vegFilter === 'nonveg' ? '• non-veg only' : 'ready to order'}`}
                </p>
              </div>
            </div>
            <div className="px-1 sm:px-2">
              <FilterBar
                vegFilter={vegFilter}
                sortBy={sortBy}
                onVegChange={(v) => setVegFilter(v)}
                onSortChange={(s) => setSortBy(s)}
              />
            </div>

            {categories.length > 0 ? (
              categories.map((cat) => {
                const catItems = filtered.filter((m) => m.categoryId === cat.id)
                if (catItems.length === 0) return null
                return (
                  <section key={cat.id} className="mb-10 scroll-mt-24" id={cat.id}>
                    <h3 className="text-2xl font-semibold mb-4">{cat.name}</h3>
                    <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {catItems.map((item) => {
                        const imageUrl = resolveImageUrlFor(item)
                        const categoryName = categoryNameMap[item.categoryId] || item.categoryName || item.categoryId
                        return <MenuItemCard key={item.id} item={{ ...item, categoryName, imageUrl, storeClosed: !storeOpen }} />
                      })}
                    </div>
                  </section>
                )
              })
            ) : (
              <section className="mb-10" id="all-items">
                <h3 className="text-2xl font-semibold mb-4">All items</h3>
                <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((item) => {
                    const imageUrl = resolveImageUrlFor(item)
                    const categoryName = categoryNameMap[item.categoryId] || item.categoryName || item.categoryId
                    return <MenuItemCard key={item.id} item={{ ...item, categoryName, imageUrl, storeClosed: !storeOpen }} />
                  })}
                </div>
              </section>
            )}
          </section>
        </>
      )}
    </div>
  )
}

```

### Customer MenuItemCard.jsx (venkys/src/components/MenuItemCard.jsx)
`$lang
// MenuItemCard — Individual menu item card with quantity controls
import { useState, useMemo, useRef, useEffect, memo } from 'react'

import { MdOutlineRestaurant, MdDelete, MdAdd, MdRemove } from 'react-icons/md'

import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { formatMoney } from '../lib/formatCurrency'

const FIRST_ADD_STORAGE_KEY = 'venkys:first-add-shake'

function readFirstAddKeys() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(FIRST_ADD_STORAGE_KEY)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function hasSeenFirstAdd(key) {
  if (!key) return false
  const list = readFirstAddKeys()
  return list.includes(key)
}

function markFirstAdd(key) {
  if (typeof window === 'undefined' || !key) return
  try {
    const list = readFirstAddKeys()
    if (list.includes(key)) return
    const recent = list.slice(-40)
    window.localStorage.setItem(FIRST_ADD_STORAGE_KEY, JSON.stringify([...recent, key]))
  } catch {
    /* noop */
  }
}

function MenuItemCardInner({ item }) {
  const { add, items, setQty, remove } = useCart()
  const { openItem } = useUI()
  const [imgError, setImgError] = useState(false)
  const [shakeActive, setShakeActive] = useState(false)
  const shakeTimerRef = useRef(null)
  const cardRef = useRef(null)
  const storageKey = item.id || `${item.categoryId || ''}:${item.name}`
  const qty = items[item.id]?.qty || 0
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) {
        clearTimeout(shakeTimerRef.current)
      }
    }
  }, [])
  const img = (!imgError && (item.imageUrl || item.image || item.img)) || null
  const rating = Number(item.rating)
  const components = useMemo(() => {
    if (!Array.isArray(item.components)) return []
    return item.components
      .filter(Boolean)
      .map((comp, idx) => {
        if (comp && typeof comp === 'object') {
          const text = String(comp.text || comp.label || comp.name || '') || ''
          const unit = comp.unit ? String(comp.unit) : ''
          const qty = comp.qty != null ? String(comp.qty) : ''
          const label = [text, qty && unit ? `${qty}${unit}` : qty || unit].filter(Boolean).join(' · ')
          return { key: comp.id || `${text}-${idx}`, label }
        }
        const label = String(comp)
        return { key: `${label}-${idx}`, label }
      })
      .filter(c => c.label)
      .slice(0, 2)
  }, [item.components])

  const discountPercent = Number(item.discountPercent)
  const hasDiscount = Number.isFinite(discountPercent) && discountPercent > 0
  const discountLabel = hasDiscount
    ? `-${Math.round(discountPercent)}%`
    : null
  const mrp = Number(item.mrp)
  const unitRateForDisplay = Number(item?.rate ?? item?.price ?? 0)
  const showMrp = Number.isFinite(mrp) && mrp > unitRateForDisplay

  function handleAddClick(e, variantToUse = null) {
    if (item.storeClosed) return

    // If item has variants but no specific variant selected (and we are not in modal flow),
    // open the variant/details modal.
    if ((!variantToUse) && Array.isArray(item.variants) && item.variants.length > 0) {
      openItem(item)
      return
    }

    const currentItem = variantToUse 
      ? {
          ...item,
          id: `${item.id}_${variantToUse.name}`.replace(/\s+/g, '_'),
          name: `${variantToUse.name} ${item.name}`,
          rate: variantToUse.rate || variantToUse.price || 0,
          mrp: variantToUse.mrp || 0,
          discountPercent: variantToUse.discountPercent || 0,
          // Remove variant list from cart item to avoid nesting issues
          variants: undefined
        }
      : item

    // Ensure we always have a stable id key (some callers may pass items without `id`).
    const resolvedId =
      currentItem.id ||
      currentItem.itemId ||
      currentItem._id ||
      currentItem.docId ||
      currentItem.sku ||
      `${currentItem.categoryId || ''}:${currentItem.name || ''}`
    
    const itemToAdd = resolvedId && currentItem.id !== resolvedId
      ? { ...currentItem, id: resolvedId }
      : currentItem

    add(itemToAdd)
    
    // Jump animation
    const btn = e.currentTarget
    btn.classList.add('animate-jump-cart')
    setTimeout(() => btn.classList.remove('animate-jump-cart'), 600)

    // Fly animation
    const card = cardRef.current
    const target = document.getElementById('cart-target-mobile') || document.querySelector('label[for="cart-drawer"]')
    
    if (card && target) {
      const cardRect = card.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      
      const clone = card.cloneNode(true)
      clone.style.position = 'fixed'
      clone.style.left = `${cardRect.left}px`
      clone.style.top = `${cardRect.top}px`
      clone.style.width = `${cardRect.width}px`
      clone.style.height = `${cardRect.height}px`
      clone.style.zIndex = '9999'
      clone.style.transition = 'all 1.5s cubic-bezier(0.2, 1, 0.3, 1)'
      // Remove pointer events and potential ID conflicts
      clone.style.pointerEvents = 'none'
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
      clone.style.opacity = '0.8'
      clone.style.borderRadius = '1.5rem'
      
      document.body.appendChild(clone)
      
      // Force reflow
      void clone.offsetWidth
      
      const targetX = targetRect.left + targetRect.width / 2 - cardRect.width / 2
      const targetY = targetRect.top + targetRect.height / 2 - cardRect.height / 2
      
      clone.style.transform = `translate(${targetX - cardRect.left}px, ${targetY - cardRect.top}px) scale(0.1)`
      clone.style.opacity = '0'
      
      setTimeout(() => {
        clone.remove()
      }, 1500)
    }

    if (!hasSeenFirstAdd(storageKey)) {
      markFirstAdd(storageKey)
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current)
      setShakeActive(true)
      shakeTimerRef.current = setTimeout(() => setShakeActive(false), 700)
    }
  }

  const hasVariants = Array.isArray(item.variants) && item.variants.length > 0
  const addCtaLabel = item.storeClosed ? 'Store closed' : (hasVariants ? 'Select size' : 'Add to cart')
  const addBtnText = item.storeClosed ? 'Closed' : (hasVariants ? 'Add' : 'Add')

  return (
    <article ref={cardRef} className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-base-300/25 bg-base-100 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_26px_48px_-20px_rgba(239,68,68,0.35)] cursor-pointer ${shakeActive ? 'animate-cart-shake' : ''}`} onClick={() => openItem(item)}>
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
      <div className="relative m-4 overflow-hidden rounded-2xl border border-base-300/20 bg-gradient-to-br from-base-200 via-base-100/60 to-base-100 cursor-pointer">
        <div className="relative aspect-[5/4] cursor-pointer">
          {img ? (
            <img
              src={img}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-base-content/40">
              <MdOutlineRestaurant className="h-16 w-16" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-content/20 via-transparent to-transparent opacity-80 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <div title={item.veg !== false ? 'Vegetarian' : 'Non-Vegetarian'}>
              {item.veg !== false ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 border-green-600 bg-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                </span>
              ) : (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 border-rose-600 bg-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                </span>
              )}
            </div>
            {Number.isFinite(rating) && rating > 0 && (
              <span className="inline-flex items-center gap-[3px] rounded-full bg-green-600/90 px-2 py-1 text-[11px] font-semibold text-white shadow-md">
                {rating.toFixed(1)}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
          </div>
          {discountLabel && (
            <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-secondary/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-100 shadow">
              {discountLabel}
            </span>
          )}
          {item.storeClosed && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-base-content/80 text-sm font-semibold uppercase tracking-[0.22em] text-base-100">
              Closed
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0 px-5 pb-5">
        <div className="flex items-start justify-between gap-3 cursor-pointer">
          <div className="min-w-0 space-y-1">
            <h3 className="text-lg font-semibold text-base-content">{item.name}</h3>
            {item.desc ? (
              <p className="text-sm leading-relaxed text-base-content/70">{item.desc}</p>
            ) : null}
          </div>
        </div>

        {components.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 cursor-pointer">
            {components.map((comp) => (
              <span key={comp.key} className="inline-flex items-center rounded-full bg-base-200/80 px-3 py-1 text-[11px] font-medium text-base-content/70">
                {comp.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-[0.25rem]" />

        <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold text-base-content">₹{formatMoney(item?.rate ?? item?.price ?? 0)}</span>
            {showMrp && <span className="text-sm line-through text-base-content/50">₹{formatMoney(mrp)}</span>}
            {discountLabel && (
              <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
                {discountLabel}
              </span>
            )}
        </div>

        <div className="flex-1 min-h-[0.25rem]" />
          
        <div>
          {qty > 0 ? (
            <div className="flex items-center justify-between bg-red-600 text-white rounded-lg p-1 h-9 w-full shadow-md" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button"
                className="btn btn-xs btn-ghost h-full aspect-square p-0 min-h-0 text-white hover:bg-white/20"
                onClick={() => {
                  if (qty === 1) remove(item.id)
                  else setQty(item.id, qty - 1)
                }}
              >
                {qty === 1 ? <MdDelete className="w-4 h-4" /> : <MdRemove className="w-4 h-4" />}
              </button>
              <span className="text-sm font-bold tabular-nums">{qty}</span>
              <button 
                type="button"
                className="btn btn-xs btn-ghost h-full aspect-square p-0 min-h-0 text-white hover:bg-white/20"
                onClick={() => add(item)}
              >
                <MdAdd className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm w-full px-1 text-xs"
                onClick={(e) => { e.stopPropagation(); openItem(item) }}
              >
                View details
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm w-full shadow-md shadow-primary/20 px-1"
                disabled={item.storeClosed}
                title={addCtaLabel}
                onClick={(e) => { e.stopPropagation(); handleAddClick(e) }}
              >
                {item.storeClosed ? 'Closed' : 'Add'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// Memoize to prevent re-renders when parent state changes but item props don't
const MenuItemCard = memo(MenuItemCardInner, (prevProps, nextProps) => {
  const prev = prevProps.item
  const next = nextProps.item
  const prevRate = Number(prev?.rate ?? prev?.price ?? 0)
  const nextRate = Number(next?.rate ?? next?.price ?? 0)
  return (
    prev.id === next.id &&
    prevRate === nextRate &&
    prev.imageUrl === next.imageUrl &&
    prev.storeClosed === next.storeClosed &&
    prev.active === next.active
  )
})

export default MenuItemCard

```

### Customer ItemModal.jsx (venkys/src/components/ItemModal.jsx)
`$lang
// ItemModal — Full-screen menu item detail with add-to-cart
import { useState, useEffect } from 'react'

import { MdClose } from 'react-icons/md'

import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { formatMoney } from '../lib/formatCurrency'

export default function ItemModal() {
  const { selectedItem, closeItem } = useUI()
  const { add } = useCart()
  
  // State for nested variants
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

  // Initialize selection when item opens
  useEffect(() => {
    if (selectedItem?.variants?.length > 0) {
      // Check if it's nested (Item -> Groups -> Sizes) or flat (Item -> Sizes)
      const firstVariant = selectedItem.variants[0]
      const isNested = Array.isArray(firstVariant.sizes) && firstVariant.sizes.length > 0

      if (isNested) {
        setSelectedGroup(firstVariant)
        const validSizes = firstVariant.sizes.filter(s => (s.rate || s.price) > 0)
        setSelectedSize(validSizes[0] || null)
      } else {
        // Fallback for flat structure if any
        setSelectedGroup(null) // No grouping
        setSelectedSize(firstVariant)
      }
    } else {
      setSelectedGroup(null)
      setSelectedSize(null)
    }
  }, [selectedItem])


  const open = Boolean(selectedItem)
  if (!open) return null

  // Helper to detect structure
  const isNestedStructure = selectedItem.variants?.some(v => Array.isArray(v.sizes))

  // Determine effective values
    const currentVariant = selectedSize || selectedGroup // fallback if flat
    const effectivePrice = currentVariant 
        ? (currentVariant.rate || currentVariant.price || selectedItem.rate || selectedItem.price || 0)
        : (selectedItem.rate || selectedItem.price || 0)
    
  const effectiveMrp = currentVariant
    ? (currentVariant.mrp || selectedItem.mrp)
    : selectedItem.mrp
    
  const effectiveDiscount = currentVariant
    ? (currentVariant.discountPercent || selectedItem.discountPercent)
    : selectedItem.discountPercent

  const hasDiscount = Number.isFinite(Number(effectiveDiscount)) && Number(effectiveDiscount) > 0
  
  const discountLabel = hasDiscount
    ? `${Math.round(Number(effectiveDiscount))}% off`
    : null

  const displayImage = selectedItem.imageUrl || selectedItem.image || selectedItem.img
  const description = selectedItem.desc || selectedItem.description
  const components = Array.isArray(selectedItem.components) ? selectedItem.components : []
  const hasVariants = Array.isArray(selectedItem.variants) && selectedItem.variants.length > 0

  const onAdd = () => {
    if (!selectedItem) return

    if (hasVariants && !selectedSize && isNestedStructure) return
    if (hasVariants && !currentVariant && !isNestedStructure) return

    const baseItem = selectedItem
    let itemToAdd = { ...baseItem }

    if (hasVariants && (selectedSize || currentVariant)) {
        // Nested Structure: Group Name + Item Name -> Size
        // e.g. "Tandoori Chicken" (Variant: Half)
        
        let newName = baseItem.name
        let variantLabel = ''
        let uniqueSuffix = ''

        if (isNestedStructure && selectedGroup) {
            newName = `${selectedGroup.name} ${baseItem.name} (${selectedSize.name})`
            variantLabel = selectedSize.name
            uniqueSuffix = `${selectedGroup.name}_${selectedSize.name}`
        } else if (currentVariant) {
            // Flat: Item Name -> Variant
            // e.g. "Chicken Biryani (Half)"
            newName = `${baseItem.name} (${currentVariant.name})`
            variantLabel = currentVariant.name
            uniqueSuffix = currentVariant.name
        }

        const rate = currentVariant.rate || currentVariant.price || 0
        const mrp = currentVariant.mrp || 0
        const discount = currentVariant.discountPercent || 0

        // Sanitize ID
        const newId = `${baseItem.id}_${uniqueSuffix}`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')

        itemToAdd = {
            ...baseItem,
            id: newId,
            name: newName, // "Tandoori Chicken"
            rate: rate,
            mrp: mrp,
            discountPercent: discount,
            variants: undefined,
            variantLabel: variantLabel // "Half"
        }
    } else {
         // Standard item add
         const resolvedId =
          baseItem.id ||
          baseItem.itemId ||
          baseItem._id ||
          baseItem.docId ||
          baseItem.sku ||
          `${baseItem.categoryId || ''}:${baseItem.name || ''}`
        
        if (resolvedId && baseItem.id !== resolvedId) {
            itemToAdd.id = resolvedId
        }
    }
    
    add(itemToAdd)
    closeItem()
  }

  return (
    <div className={`modal ${open ? 'modal-open' : ''} theme-vars`}>
      <div className="modal-box relative p-0 max-w-md overflow-hidden bg-base-100 rounded-3xl shadow-2xl no-scrollbar">
         {/* Close Button */}
         <button onClick={closeItem} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10 bg-base-100/50 backdrop-blur-sm text-base-content hover:bg-base-100">
            <MdClose className="h-5 w-5" />
         </button>

         {/* Image Header */}
         <div className="relative aspect-[16/9] w-full bg-base-200">
             {displayImage ? (
                 <img src={displayImage} alt={selectedItem.name} className="h-full w-full object-cover" />
             ) : (
                <div className="grid h-full w-full place-items-center text-4xl">🍽️</div>
             )}
              {/* Badges Overlay */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                 {selectedItem.veg !== undefined && (
                   <div className={`badge border-0 font-bold shadow-sm ${selectedItem.veg ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                     {selectedItem.veg ? 'VEG' : 'NON-VEG'}
                   </div>
                 )}
                 {hasDiscount && (
                   <div className="badge badge-secondary border-0 font-bold shadow-sm">{discountLabel}</div>
                 )}
              </div>
         </div>

         <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
             {/* Header */}
             <div>
                 <h3 className="text-xl font-bold text-base-content">{selectedItem.name}</h3>
                 <p className="mt-1 text-sm leading-relaxed text-base-content/70">{description}</p>
             </div>

             {/* Components/Ingredients */}
             {components.length > 0 && (
                <div className="rounded-xl bg-base-200/50 p-3">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-base-content/50">Includes</h4>
                    <ul className="grid gap-2 text-sm">
                        {components.map((comp, i) => {
                             const text = typeof comp === 'object' ? (comp.text || comp.label) : comp
                             const qty = typeof comp === 'object' ? comp.qty : null
                             const unit = typeof comp === 'object' ? comp.unit : null
                             const displayLabel = [text, qty && unit ? `${qty}${unit}` : qty || unit].filter(Boolean).join(' · ')
                             
                             return (
                                 <li key={i} className="flex items-start gap-2 opacity-80">
                                     <span className="font-medium text-base-content/80">{displayLabel}</span>
                                 </li>
                             )
                        })}
                    </ul>
                </div>
             )}

             {/* Variant Groups (e.g. Flavor) */}
             {isNestedStructure && selectedItem.variants.length > 0 && (
                 <div className="space-y-3">
                     <h4 className="text-sm font-bold text-base-content">Select Variant</h4>
                     <div className="flex flex-wrap gap-2">
                         {selectedItem.variants.map((group, i) => {
                             const isSelected = selectedGroup && selectedGroup.name === group.name
                             return (
                                 <button 
                                     key={i}
                                     className={`btn btn-sm ${isSelected ? 'btn-neutral' : 'btn-outline border-base-300'}`}
                                     onClick={() => {
                                         setSelectedGroup(group)
                                         // Auto-select first size of new group to avoid invalid state
                                         const validSizes = group.sizes.filter(s => (s.rate || s.price) > 0)
                                         if (validSizes.length > 0) setSelectedSize(validSizes[0])
                                     }}
                                 >
                                     {group.name}
                                 </button>
                             )
                         })}
                     </div>
                 </div>
             )}

             {/* Sizes (e.g. Half/Full) */}
             {hasVariants && (
                 <div className="space-y-3">
                     <h4 className="text-sm font-bold text-base-content">Select Size</h4>
                     <div className="space-y-2">
                         {(() => {
                            // Decide which list to map: nested (group's sizes) or flat (item variants)
                            const listToMap = isNestedStructure 
                                ? (selectedGroup?.sizes || [])
                                : selectedItem.variants
                            
                            return listToMap.map((v, i) => {
                                 // Determine if selected
                                 const isSelected = isNestedStructure 
                                    ? (selectedSize && selectedSize.name === v.name)
                                    : (selectedSize && selectedSize.name === v.name) // reused selectedSize state for flat too

                                 const updateSelection = () => {
                                     setSelectedSize(v)
                                 }

                                 return (
                                     <label 
                                        key={i} 
                                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all
                                            ${isSelected 
                                                ? 'border-primary bg-primary/5 shadow-md' 
                                                : 'border-base-300 bg-base-100 hover:border-base-content/20'
                                            }
                                        `}
                                     >
                                         <div className="flex items-center gap-3">
                                             <input 
                                                type="radio" 
                                                name="size-select"
                                                className="radio radio-primary radio-sm"
                                                checked={isSelected}
                                                onChange={updateSelection}
                                             />
                                             <span className={`font-medium ${isSelected ? 'text-primary' : 'text-base-content'}`}>
                                                 {v.name}
                                             </span>
                                         </div>
                                         <div className="text-right">
                                             <span className="block font-bold text-base-content">₹{formatMoney(v.rate || v.price)}</span>
                                             {(v.mrp > (v.rate || v.price)) && (
                                                 <span className="block text-xs text-base-content/40 line-through">₹{formatMoney(v.mrp)}</span>
                                             )}
                                         </div>
                                     </label>
                                 )
                             })
                         })()}
                     </div>
                 </div>
             )}

             {/* Footer Actions */}
             <div className="pt-2 sticky bottom-0 bg-base-100 pb-2">
                 <div className="flex items-center justify-between mb-4">
                     <div>
                        <div className="text-xs text-base-content/50 uppercase tracking-wider">Rate</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-base-content">₹{formatMoney(effectivePrice)}</span>
                            {(Number(effectiveMrp) > Number(effectivePrice)) && (
                                <span className="text-sm text-base-content/40 line-through">₹{formatMoney(effectiveMrp)}</span>
                            )}
                        </div>
                     </div>
                 </div>
                 <button 
                    onClick={onAdd}
                    className="btn btn-primary btn-block shadow-lg shadow-primary/20 text-white"
                 >
                    Add to Cart {hasVariants ? `(${isNestedStructure && selectedGroup ? selectedGroup.name + ' ' : ''}${selectedSize ? selectedSize.name : ''})` : ''}
                 </button>
             </div>
         </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={closeItem}>
        <button>close</button>
      </form>
    </div>
  )
}

```

### Customer CartDrawer.jsx (venkys/src/components/CartDrawer.jsx)
`$lang
// CartDrawer — Slide-out cart panel with item list and totals
import { Link } from 'react-router-dom'
import { MdDelete, MdShoppingCart, MdClose, MdAdd, MdRemove } from 'react-icons/md'

import { useCart } from '../context/CartContext'
import { formatINR } from '../lib/formatCurrency'

export default function CartDrawer({ children }) {
  const { entries, subtotal, remove, setQty, clear } = useCart()

  return (
    <div className="drawer drawer-end" id="cartDrawerRoot">
      <input id="cart-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {children}
      </div>
      <div className="drawer-side z-50">
        <label htmlFor="cart-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="w-80 sm:w-96 min-h-full flex flex-col bg-base-100">
          {/* Header */}
          <div className="p-4 border-b border-base-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MdShoppingCart className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Your Cart</h2>
              {entries.length > 0 && (
                <span className="badge badge-primary badge-sm">{entries.length}</span>
              )}
            </div>
            <label htmlFor="cart-drawer" className="btn btn-ghost btn-sm btn-circle">
              <MdClose className="w-5 h-5" />
            </label>
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center mb-4">
                  <MdShoppingCart className="w-12 h-12 opacity-30" />
                </div>
                <h3 className="font-bold text-lg mb-1">Your cart is empty</h3>
                <p className="text-sm opacity-60 mb-6">Looks like you haven't added anything yet</p>
                <Link 
                  to="/" 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const checkbox = document.getElementById('cart-drawer')
                    if (checkbox) checkbox.checked = false
                  }}
                >
                  Browse Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(({ item: it, qty }) => (
                  <div key={it.id} className="card bg-base-200/50 border border-base-200">
                    <div className="card-body p-3">
                      <div className="flex gap-3">
                        {it.imageUrl || it.img ? (
                          <img src={it.imageUrl || it.img} alt={it.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-base-300 rounded-lg flex items-center justify-center text-2xl">🍽️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-sm leading-tight truncate">{it.name}</h4>
                            <button className="btn btn-ghost btn-xs btn-circle flex-shrink-0 opacity-50 hover:opacity-100 hover:text-error" onClick={() => remove(it.id)}>
                              <MdClose className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm font-bold text-primary mt-1">{formatINR(Number(it?.rate ?? it?.price ?? 0) * qty)}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-60">{formatINR(Number(it?.rate ?? it?.price ?? 0))} each</span>
                            <div className="join join-horizontal">
                              <button 
                                className="btn btn-xs join-item" 
                                onClick={() => qty > 1 ? setQty(it.id, qty - 1) : remove(it.id)}
                              >
                                {qty > 1 ? <MdRemove className="w-3 h-3" /> : <MdDelete className="w-3 h-3" />}
                              </button>
                              <span className="btn btn-xs join-item no-animation pointer-events-none min-w-[2rem]">{qty}</span>
                              <button className="btn btn-xs join-item" onClick={() => setQty(it.id, qty + 1)}>
                                <MdAdd className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {entries.length > 0 && (
            <div className="p-4 border-t border-base-200 bg-base-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70">Subtotal ({entries.reduce((s, e) => s + e.qty, 0)} items)</span>
                <span className="font-bold text-lg">{formatINR(subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={clear} className="btn btn-ghost btn-sm flex-1">Clear</button>
                <Link to="/checkout" className="btn btn-primary btn-sm flex-1" onClick={() => {
                  const checkbox = document.getElementById('cart-drawer')
                  if (checkbox) checkbox.checked = false
                }}>Checkout</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

```

### Customer FloatingCartBar.jsx (venkys/src/components/FloatingCartBar.jsx)
`$lang
// FloatingCartBar — Sticky bottom bar showing cart summary
import { useMemo } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'
import { MdShoppingCart } from 'react-icons/md'

import { useCart } from '../context/CartContext'

export default function FloatingCartBar() {
  const { subtotal, totalQty } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [])

  if (!totalQty || location.pathname === '/checkout') {
    return null
  }

  const subtotalLabel = currencyFormatter.format(subtotal || 0)

  const handleBarClick = () => {
    const drawer = document.getElementById('cart-drawer')
    if (drawer) drawer.checked = true
  }

  return (
    <div className="fixed inset-x-0 bottom-16 sm:bottom-20 lg:bottom-6 z-40 pointer-events-none">
      <div className="px-4 pointer-events-auto">
        <div 
          onClick={handleBarClick}
          className="mx-auto max-w-4xl rounded-2xl bg-secondary text-secondary-content shadow-[0_8px_30px_rgba(239,68,68,0.5)] px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-transform active:scale-95 border border-secondary-content/10"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-content/20 text-secondary-content shadow-sm backdrop-blur-sm">
              <MdShoppingCart className="w-5 h-5" />
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] rounded-full bg-white text-secondary text-[10px] font-bold grid place-items-center px-1 shadow-sm">
                  {totalQty > 99 ? '99+' : totalQty}
                </span>
              )}
            </span>
            <div className="space-y-0.5">
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">Cart</div>
              <div className="text-sm font-bold leading-tight flex items-center gap-1.5">
                <span>{totalQty} item{totalQty === 1 ? '' : 's'}</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                <span>{subtotalLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-warning btn-sm h-10 min-h-0 rounded-xl shadow-md border-none animate-none hover:brightness-110 px-6 font-extrabold tracking-wide text-warning-content"
              onClick={(e) => {
                e.stopPropagation()
                navigate('/checkout')
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

```

### Customer QuickDock.jsx (venkys/src/components/QuickDock.jsx)
`$lang
// QuickDock — Bottom navigation dock for mobile
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MdHome, MdRestaurantMenu, MdShoppingCart, MdPerson, MdReceiptLong, MdLogin } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'

/* DaisyUI dock: appears fixed bottom on mobile, side-floating on desktop */
export default function QuickDock() {
  const { totalQty } = useCart()
  const { user } = useAuth()
  const { openAuth } = useUI()
  const navigate = useNavigate()
  const location = useLocation()

  function goHome() {
    // Always navigate to root with no search/hash and a reset flag
    const to = { pathname: '/', search: '', hash: '' }
    if (location.pathname === '/') {
      navigate(to, { replace: true, state: { reset: true } })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate(to, { state: { reset: true } })
    }
  }

  function goMenu() {
    if (location.pathname === '/') {
      // If already on home, check if we have active filters/search
      // If so, trigger a reset via navigation state hack
      const event = new CustomEvent('reset-home-view')
      window.dispatchEvent(event)
      
      const el = document.getElementById('menu')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/', { state: { scrollTo: 'menu', reset: true } })
    }
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 pointer-events-none">
      <div id="quick-dock-bar" className="pointer-events-auto flex w-full bg-base-100/85 backdrop-blur border-t border-base-300/60 shadow-lg">
        <button onClick={goHome} className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
          <MdHome className="icon-mobile" />
          <span className="label-mobile">Home</span>
        </button>
        <button onClick={goMenu} className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
          <MdRestaurantMenu className="icon-mobile" />
          <span className="label-mobile">Menu</span>
        </button>
        <label htmlFor="cart-drawer" className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition cursor-pointer">
          <span className="relative inline-block" id="cart-target-mobile">
            <MdShoppingCart className="icon-mobile" />
            {totalQty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-h-0 w-4 rounded-full bg-error text-white text-[10px] leading-4 text-center shadow">
                {totalQty > 9 ? '9+' : totalQty}
              </span>
            )}
          </span>
          <span className="label-mobile">Cart</span>
        </label>
        {user ? (
          <button onClick={() => {
            if (location.pathname === '/profile') {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              navigate('/profile', { state: { scrollToTop: true } })
            }
          }} className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
            <MdPerson className="icon-mobile" />
            <span className="label-mobile">Profile</span>
          </button>
        ) : (
          <button className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition" onClick={() => openAuth('login')}>
            <MdLogin className="icon-mobile" />
            <span className="label-mobile">Login</span>
          </button>
        )}
        <button onClick={() => {
          if (location.pathname === '/profile') {
            const el = document.getElementById('orders-section')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } else {
            navigate('/profile', { state: { scrollTo: 'orders' } })
          }
        }} className="dock-btn flex-1 flex flex-col items-center justify-center gap-0 py-2 text-xs font-medium hover:bg-base-200/50 transition">
          <MdReceiptLong className="icon-mobile" />
          <span className="label-mobile">Orders</span>
        </button>
      </div>
      {/* Utility styles for icons (could move to global CSS if desired) */}
      <style>{`
        .icon-mobile { width:1.75rem; height:1.75rem; }
        .label-mobile { font-size:0.65rem; line-height:0.9rem; }
        @media (min-width: 640px) { /* sm and up shrink icons */
          .icon-mobile { width:1.25rem; height:1.25rem; }
          .label-mobile { font-size:0.6rem; }
        }
        @media (orientation: landscape) and (max-height: 500px) {
          .icon-mobile { width:1.2rem; height:1.2rem; }
        }
      `}</style>
    </div>
  )
}

```

### Customer Checkout.jsx (venkys/src/pages/Checkout.jsx)
`$lang
// Checkout — Order checkout flow with address, payment, and confirmation
import { useCallback, useEffect, useRef, useState } from 'react'

import { doc, onSnapshot } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { MdPlace, MdLocalPhone, MdEmail, MdGpsFixed, MdLocationCity, MdPinDrop, MdPerson, MdApartment, MdMap, MdPayment, MdCreditCard, MdQrCode, MdBookmark, MdAdd, MdArrowForward, MdCheck, MdEdit } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete'
import { createOrder, fetchAddresses, addAddress, setDefaultAddress, createRazorpayOrder, verifyRazorpayPayment, BRAND_LONG, fetchUserProfile, updateAddress, fetchOrder, getRazorpayKeyId } from '../lib/data'
import { db } from '../lib/firebase'
import { reverseGeocode, geocodeAddress } from '../lib/google'
import { sendBillToCustomer } from '../lib/whatsapp'

const CHECKOUT_PAYMENT_OPTIONS = [
  { key: 'cod', label: 'Cash on Delivery', helper: 'Pay when the order arrives.', icon: MdPayment },
  { key: 'upi', label: 'UPI (Razorpay)', helper: 'PhonePe, Google Pay, BHIM, etc.', icon: MdQrCode },
  { key: 'card', label: 'Card (Razorpay)', helper: 'Debit & credit cards via Razorpay.', icon: MdCreditCard }
]

// ── Helpers ──

function checkoutTimestampToDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : new Date(parsed)
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }
  return null
}

function buildOrderStatusTimeline(order) {
  if (!order) return []
  if (Array.isArray(order.statusHistory) && order.statusHistory.length) {
    return [...order.statusHistory]
      .map((entry) => ({
        status: entry?.status || order.status || 'placed',
        at: checkoutTimestampToDate(entry?.at) || checkoutTimestampToDate(order.updatedAt) || checkoutTimestampToDate(order.createdAt) || new Date(),
        actor: entry?.actor || 'system',
      }))
      .sort((a, b) => (a.at?.getTime() || 0) - (b.at?.getTime() || 0))
  }
  const fallbackAt = checkoutTimestampToDate(order.updatedAt) || checkoutTimestampToDate(order.createdAt) || new Date()
  return [{ status: order.status || 'placed', at: fallbackAt, actor: order.customer?.name || 'system' }]
}

function paymentStatusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'badge-success'
    case 'pending':
      return 'badge-warning'
    case 'failed':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

export default function Checkout() {
  const { entries, subtotal, setQty, remove, clear } = useCart()
  const { user } = useAuth()
  const { pushToast, openAuth } = useUI()
  const navigate = useNavigate()

  // ── State & refs ──
  const [addresses, setAddresses] = useState({ list: [], defaultId: null })
  const [profileInfo, setProfileInfo] = useState(null)
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Durgapur',
    state: 'West Bengal',
    pin: '',
    landmark: '',
    addressTag: 'Home',
    addressPhone: user?.phoneNumber || '',
    lat: null,
    lng: null,
    placeId: '',
    mapUrl: '',
    paymentMethod: 'cod',
    note: '',
  })
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [latestOrderSummary, setLatestOrderSummary] = useState(null)
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [activeAddressId, setActiveAddressId] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [fieldError, setFieldError] = useState(null) // 'name' | 'phone' | 'addressLine1' | 'addressLine2' | 'pin' | 'location' | null
  const [gettingLocation, setGettingLocation] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1=contact, 2=address, 3=payment
  const [confirmedSteps, setConfirmedSteps] = useState({ contact: false, address: false })
  const [highlightGPSButton, setHighlightGPSButton] = useState(false)

  // Location share enforcement
  const [locationVerifiedByButton, setLocationVerifiedByButton] = useState(false)
  const [locationWarningShown, setLocationWarningShown] = useState(false)
  const [showLocationAnimation, setShowLocationAnimation] = useState(false)
  const gpsButtonRef = useRef(null)

  // ── Side-effects ──
  useEffect(() => {
    if (!orderId) return
    navigate(`/active-orders?id=${encodeURIComponent(orderId)}`, { replace: true })
  }, [navigate, orderId])
  // Refs for auto-scrolling to form sections
  const nameRef = useRef(null)
  const phoneRef = useRef(null)
  const addressSectionRef = useRef(null)
  const addressLine1Ref = useRef(null)
  const addressLine2Ref = useRef(null)
  const landmarkRef = useRef(null)
  const pinRef = useRef(null)
  const paymentRef = useRef(null)

  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return
    try {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (typeof ref.current.focus === 'function') ref.current.focus()
      else {
        const el = ref.current.querySelector?.('input, textarea, select, button')
        if (el && typeof el.focus === 'function') el.focus()
      }
    } catch {
      // best-effort
    }
  }, [])

  // Guided form-filling: detect next incomplete field
  const phoneRegex = /^\+?[0-9]{7,15}$/
  const pinRegex = /^[0-9]{4,8}$/
  const getNextIncompleteField = useCallback(() => {
    const usingSavedAddress = !!activeAddressId && !showAddressForm
    // Step 1: Contact details
    if (!form.name) return { step: 1, field: 'name', ref: nameRef, label: 'Full Name', hint: 'Enter your full name' }
    if (!form.phone) return { step: 1, field: 'phone', ref: phoneRef, label: 'Phone Number', hint: 'Enter your phone number' }
    if (form.phone && !phoneRegex.test(form.phone)) return { step: 1, field: 'phone', ref: phoneRef, label: 'Phone Number', hint: 'Enter a valid phone number' }
    // Step 2: Address details (required fields first)
    if (!usingSavedAddress && !form.addressLine1) return { step: 2, field: 'addressLine1', ref: addressLine1Ref, label: 'House/Flat + Street', hint: 'Enter your house number and street' }
    if (!form.addressLine2) return { step: 2, field: 'addressLine2', ref: addressLine2Ref, label: 'Area/Locality', hint: 'Type your area and pick a Google suggestion' }
    if (!form.pin) return { step: 2, field: 'pin', ref: pinRef, label: 'PIN Code', hint: 'Enter your PIN code' }
    if (form.pin && !pinRegex.test(form.pin)) return { step: 2, field: 'pin', ref: pinRef, label: 'PIN Code', hint: 'Enter a valid PIN code' }
    if (typeof form.lat !== 'number' || typeof form.lng !== 'number') return { step: 2, field: 'location', ref: addressSectionRef, label: 'Location', hint: 'Use "Current location" or pick from Google suggestions' }
    // Landmark is optional - suggest it after required fields if still empty
    if (!form.landmark) return { step: 2, field: 'landmark', ref: landmarkRef, label: 'Landmark (optional)', hint: 'Add a nearby landmark for faster delivery', optional: true }
    // Step 3: Payment
    if (!form.paymentMethod) return { step: 3, field: 'paymentMethod', ref: paymentRef, label: 'Payment Method', hint: 'Select a payment method' }
    return null // All complete
  }, [form, activeAddressId, showAddressForm])

  // Auto-guide to next incomplete field
  const guideToNextField = useCallback(() => {
    const next = getNextIncompleteField()
    if (!next) {
      pushToast('All details filled! You can place your order.', 'success', 3000)
      return
    }
    setCurrentStep(next.step)
    if (next.step === 2) setShowAddressForm(true)
    // Don't highlight optional fields as errors
    if (!next.optional) setFieldError(next.field)
    pushToast(`${next.optional ? '💡 Tip' : 'Next'}: ${next.hint}`, next.optional ? 'info' : 'info', 4000)
    setTimeout(() => scrollToRef(next.ref), 100)
  }, [getNextIncompleteField, scrollToRef, pushToast])

  const setErrorAndScroll = useCallback((target, message, ref) => {
    setFieldError(target)
    setGeoError(message)
    if (message) pushToast(message, 'error', 5000)
    if (ref) scrollToRef(ref)
  }, [scrollToRef, pushToast])

  // Auto-track current step based on field being edited
  const contactFields = ['name', 'phone', 'email', 'note']
  const addressFields = ['addressLine1', 'addressLine2', 'city', 'state', 'pin', 'landmark', 'addressTag', 'addressPhone', 'lat', 'lng', 'placeId', 'mapUrl']
  const paymentFields = ['paymentMethod']

  const update = useCallback((k, v) => {
    setForm((s) => ({ ...s, [k]: v }))
    // Clear targeted error as user edits that field
    setFieldError((prev) => (prev === k ? null : prev))
    // Auto-update current step indicator
    if (contactFields.includes(k)) {
      setCurrentStep(1)
      setConfirmedSteps((prev) => (prev.contact ? { ...prev, contact: false } : prev))
    }
    else if (addressFields.includes(k)) {
      setCurrentStep(2)
      setConfirmedSteps((prev) => (prev.address ? { ...prev, address: false } : prev))
    }
    else if (paymentFields.includes(k)) setCurrentStep(3)
  }, [])
  const handleAutocompleteSelect = useCallback((parts, place) => {
    if (!parts) return
    // Address line 1 is for house/flat/building; line 2 is for Area/Locality.
    const placeName = typeof place?.name === 'string' ? place.name.trim() : ''
    const partsCity = typeof parts.city === 'string' ? parts.city.trim() : ''
    const partsCityOk = partsCity && partsCity.toLowerCase() !== 'durgapur' ? partsCity : ''
    const locality = (parts.line2 || '').trim() || placeName || partsCityOk
    update('addressLine2', locality || '')
    // City is fixed to Durgapur; do not override from Google
    update('city', 'Durgapur')
    if (parts.state) update('state', parts.state)
    if (parts.zip) update('pin', parts.zip)
    if (typeof parts.lat === 'number') update('lat', parts.lat)
    if (typeof parts.lng === 'number') update('lng', parts.lng)
    if (parts.placeId) update('placeId', parts.placeId)
    if (parts.mapUrl) update('mapUrl', parts.mapUrl)
    // Clear GPS button highlight since location is now set
    setHighlightGPSButton(false)
  }, [update])
  // Attach autocomplete to Address line 2 (auto-filled), not line 1
  usePlacesAutocomplete(addressLine2Ref, handleAutocompleteSelect)

  const handleAddressLine2Change = useCallback((value) => {
    const next = String(value ?? '')
    setForm((s) => ({
      ...s,
      addressLine2: next,
      // If user edits locality manually, require re-confirming location
      lat: null,
      lng: null,
      placeId: '',
      mapUrl: '',
    }))
    setFieldError((prev) => (prev === 'addressLine2' ? null : prev))
    setCurrentStep(2)
  }, [])
  const fillFromAddress = useCallback((a) => {
    if (!a) return
    setConfirmedSteps((prev) => ({ ...prev, address: false }))
    setForm(prev => ({
      ...prev,
      addressLine1: a.line1 || '',
      addressLine2: a.line2 || '',
      city: 'Durgapur',
      state: a.state || prev.state || 'West Bengal',
      pin: a.zip || '',
      landmark: a.landmark || '',
      addressTag: a.tag || prev.addressTag || 'Other',
      addressPhone: a.phone || prev.addressPhone || prev.phone || '',
      lat: typeof a.lat === 'number' ? a.lat : null,
      lng: typeof a.lng === 'number' ? a.lng : null,
      placeId: a.placeId || '',
      mapUrl: a.mapUrl || '',
    }))
    setActiveAddressId(a.id || null)
    setShowAddressForm(false)
    setSetAsDefault(false)
    setGeoError('')
    if (typeof a.lat !== 'number' || typeof a.lng !== 'number') {
      const query = [a.line1, a.line2, a.city, a.state, a.zip].filter(Boolean).join(', ')
      if (query) {
        geocodeAddress(query).then((geo) => {
          if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') return
          setForm(prev => ({
            ...prev,
            lat: geo.lat,
            lng: geo.lng,
            placeId: geo.placeId || prev.placeId || '',
            mapUrl: geo.mapUrl || prev.mapUrl || '',
          }))
        }).catch(() => {})
      }
    }
  }, [setGeoError, setForm, setActiveAddressId, setShowAddressForm, setSetAsDefault])
  const handleStartNewAddress = useCallback(() => {
    setActiveAddressId(null)
    setShowAddressForm(true)
    setConfirmedSteps((prev) => ({ ...prev, address: false }))
    setGeoError('')
    setSetAsDefault(!(addresses?.list?.length))
    setForm(prev => ({
      ...prev,
      addressLine1: '',
      addressLine2: '',
      city: 'Durgapur',
      state: 'West Bengal',
      pin: '',
      landmark: '',
      addressTag: 'Home',
      addressPhone: prev.addressPhone || prev.phone || '',
      lat: null,
      lng: null,
      placeId: '',
      mapUrl: '',
    }))
  }, [addresses, setGeoError, setForm, setActiveAddressId, setShowAddressForm, setSetAsDefault])
  const ensureRazorpay = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window object not available'))
    }
    if (window.Razorpay) {
      return Promise.resolve(window.Razorpay)
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => {
          if (window.Razorpay) {
            resolve(window.Razorpay)
          } else {
            reject(new Error('Razorpay SDK unavailable after load'))
          }
        }, { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')), { once: true })
      })
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        if (window.Razorpay) {
          resolve(window.Razorpay)
        } else {
          reject(new Error('Razorpay SDK unavailable after load'))
        }
      }
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })
  }, [])

  // Delivery geofencing via centralized hook
  const deliveryLocation = useDeliveryLocation()

  // Delivery settings are loaded by the hook

  // Real-time order status updates after order is placed
  useEffect(() => {
    if (!orderId) return;
    
    // Orders are stored in the top-level `orders/{orderId}` collection.
    const orderDocRef = doc(db, 'orders', orderId)
    
    const unsub = onSnapshot(orderDocRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setLatestOrderSummary(prev => ({
        ...prev,
        id: data.orderNo || orderId,
        payment: data.payment || prev?.payment,
        status: data.status,
        statusHistory: buildOrderStatusTimeline(data),
      }));
    }, (err) => {
      console.warn('[checkout] Order snapshot error:', err);
    });
    
    return () => unsub();
  }, [orderId, user?.uid]);

  useEffect(() => {
    if (!user) {
      setProfileInfo(null)
      return
    }
    let active = true
    fetchUserProfile(user.uid).then((profile) => {
      if (!active) return
      setProfileInfo(profile || null)
      setForm(prev => ({
        ...prev,
        name: profile?.displayName || prev.name || user.displayName || '',
        phone: profile?.phone || prev.phone || user.phoneNumber || '',
        email: profile?.email || prev.email || user.email || '',
        addressPhone: profile?.phone || prev.addressPhone || prev.phone || user.phoneNumber || '',
      }))
    }).catch(() => {
      if (!active) return
      setProfileInfo(null)
    })
    return () => { active = false }
  }, [user])

  // Load user's saved addresses
  useEffect(() => {
    let mounted = true
    if (!user) {
      setAddresses({ list: [], defaultId: null })
      return () => { mounted = false }
    }
    fetchAddresses(user.uid).then((a) => { if (mounted) setAddresses(a) }).catch(() => { if (mounted) setAddresses({ list: [], defaultId: null }) })
    return () => { mounted = false }
  }, [user])

  // Pre-select default address into the form for speed (only if form empty)
  useEffect(() => {
    if (!user) {
      setActiveAddressId(null)
      setShowAddressForm(true)
      return
    }
    if (showAddressForm) return
    if (form.addressLine1) return
    if (!addresses || !addresses.list?.length) {
      setShowAddressForm(false)
      setActiveAddressId(null)
      return
    }
    const def = addresses.list.find(a => a.id === addresses.defaultId) || addresses.list[0]
    if (!def) return
    fillFromAddress(def)
  }, [addresses, user, form.addressLine1, showAddressForm, fillFromAddress, setActiveAddressId, setShowAddressForm])
  const prevUserRef = useRef(user?.uid || null)

  // Handle auth transitions (login / logout / account-switch) without
  // wiping address data the user already entered before signing in.
  useEffect(() => {
    const currentUid = user?.uid || null
    if (prevUserRef.current === currentUid) return
    const wasLoggedIn = !!prevUserRef.current
    prevUserRef.current = currentUid
    const isNowLoggedIn = !!currentUid
    const isLogin = !wasLoggedIn && isNowLoggedIn   // guest → user
    const isLogout = wasLoggedIn && !isNowLoggedIn   // user → guest

    // Snapshot whether the guest had already typed an address
    const hadAddress = !!(form.addressLine1 || form.addressLine2 || form.pin || form.landmark)

    setForm(prev => ({
      // Contact: prefer profile / auth data, fall back to what was typed
      name: profileInfo?.displayName || user?.displayName || (isLogin ? prev.name : '') || '',
      phone: profileInfo?.phone || user?.phoneNumber || (isLogin ? prev.phone : '') || '',
      email: profileInfo?.email || user?.email || (isLogin ? prev.email : '') || '',
      // Address: preserve on login, clear on logout / account-switch
      addressLine1: isLogin ? prev.addressLine1 : '',
      addressLine2: isLogin ? prev.addressLine2 : '',
      city: prev.city || 'Durgapur',
      state: prev.state || 'West Bengal',
      pin: isLogin ? prev.pin : '',
      landmark: isLogin ? prev.landmark : '',
      addressTag: isLogin ? (prev.addressTag || 'Home') : 'Home',
      addressPhone: profileInfo?.phone || user?.phoneNumber || (isLogin ? (prev.addressPhone || prev.phone) : '') || '',
      lat: isLogin ? prev.lat : null,
      lng: isLogin ? prev.lng : null,
      placeId: isLogin ? prev.placeId : '',
      mapUrl: isLogin ? prev.mapUrl : '',
      paymentMethod: prev.paymentMethod || 'cod',
      note: isLogin ? prev.note : '',
    }))

    setOrderId(null)
    setLatestOrderSummary(null)
    setGeoError('')

    if (isLogout) {
      // Full reset — guest needs a blank slate
      setSetAsDefault(false)
      setActiveAddressId(null)
      setShowAddressForm(true)
    } else if (isLogin && hadAddress) {
      // User entered address before signing in — keep form visible
      setShowAddressForm(true)
    } else if (!isLogin) {
      // Account switch — show saved-addresses list for the new account
      setSetAsDefault(false)
      setActiveAddressId(null)
      setShowAddressForm(false)
    }
    // Login without pre-entered address: leave showAddressForm unchanged
    // so the pre-select-default-address effect can populate from saved addresses.
  }, [user, profileInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profileInfo) return
    setForm(prev => ({
      ...prev,
      name: prev.name || profileInfo.displayName || user?.displayName || '',
      phone: prev.phone || profileInfo.phone || user?.phoneNumber || '',
      email: prev.email || profileInfo.email || user?.email || '',
      addressPhone: prev.addressPhone || profileInfo.phone || prev.phone || '',
    }))
  }, [profileInfo, user])

  useEffect(() => {
    if (!form.phone) return
    setForm(prev => {
      if (prev.addressPhone) return prev
      return { ...prev, addressPhone: prev.phone }
    })
  }, [form.phone])

  // ── Handlers ──
  const handleAutoFillLocation = useCallback(async () => {
    setLocationVerifiedByButton(true)
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setShowAddressForm(true)
      setFieldError('location')
      const msg = 'Location is not available in this browser. Please type your address manually.'
      setGeoError(msg)
      pushToast(msg, 'error', 5000)
      return
    }
    
    setGettingLocation(true)
    setGeoError('')
    setFieldError(null)
    
    // Check current permission state
    let permissionState = 'prompt'
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        permissionState = result.state
      }
    } catch {
      // Some browsers don't support permission query
    }
    
    // If denied, show helpful message with instructions
    if (permissionState === 'denied') {
      setGettingLocation(false)
      setShowAddressForm(true)
      setFieldError('location')
      const msg = 'Location permission is OFF. Turn it ON in browser settings, then tap “Use current location” again.'
      setGeoError(msg)
      pushToast(msg, 'error', 5000)
      if (addressSectionRef.current) {
        try { addressSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch { void 0 }
      }
      return
    }
    
    // Request location with high accuracy
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        update('lat', latitude)
        update('lng', longitude)
        setGeoError('')
        setHighlightGPSButton(false)
        
        // Check if within delivery region
        const withinCheck = deliveryLocation.checkWithin(latitude, longitude)
        if (!withinCheck.ok) {
          setFieldError('location')
          const msg = `We deliver within ${withinCheck.radiusKm} km of Durgapur. This location is ~${withinCheck.distance.toFixed(1)} km away. Please choose a closer address.`
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        }
        
        try {
          const parts = await reverseGeocode(latitude, longitude)
          if (parts) {
            // Auto-fill all address fields from reverse geocode
            // Keep line 1 for manual entry; put autofill into line 2
            const autoAddress = parts.formatted || [parts.line1, parts.line2].filter(Boolean).join(', ')
            update('addressLine2', autoAddress || '')
            // City fixed to Durgapur
            update('city', 'Durgapur')
            if (parts.state) update('state', parts.state)
            if (parts.zip) update('pin', parts.zip)
            if (parts.placeId) update('placeId', parts.placeId)
            if (parts.mapUrl) update('mapUrl', parts.mapUrl)
            
            // Scroll to address line so user can verify/edit
            if (addressLine1Ref.current) {
              addressLine1Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
              addressLine1Ref.current.focus()
            }
          }
        } catch (err) {
          console.warn('[checkout] reverseGeocode failed', err)
          setFieldError('addressLine2')
          const msg = 'Got your location, but couldn’t fetch the address. Please type your area in Address line 2.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        }
        setGettingLocation(false)
      },
      (error) => {
        setGettingLocation(false)
        if (error.code === error.PERMISSION_DENIED) {
          setFieldError('location')
          const msg = 'Location permission was denied. Please allow location access or type your address manually.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setFieldError('location')
          const msg = 'Could not get your location. Please check GPS/location settings or type your address manually.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else if (error.code === error.TIMEOUT) {
          setFieldError('location')
          const msg = 'Location request timed out. Please try again.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else {
          setFieldError('location')
          const msg = 'Could not fetch your location. Please type your address manually.'
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [update, deliveryLocation, pushToast])

  const handleGPSOnly = useCallback(async () => {
    setLocationVerifiedByButton(true)
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      pushToast('Location is not available in this browser.', 'error', 5000)
      return
    }
    
    setGettingLocation(true)
    setGeoError('')
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        update('lat', latitude)
        update('lng', longitude)
        setHighlightGPSButton(false)
        
        // Check if within delivery region
        const withinCheck = deliveryLocation.checkWithin(latitude, longitude)
        if (!withinCheck.ok) {
          const msg = `We deliver within ${withinCheck.radiusKm} km of Durgapur. This location is ~${withinCheck.distance.toFixed(1)} km away.`
          setGeoError(msg)
          pushToast(msg, 'error', 5000)
        } else {
          pushToast('GPS location confirmed for delivery!', 'success', 3000)
        }
        setGettingLocation(false)
      },
      (error) => {
        setGettingLocation(false)
        pushToast('Could not get GPS location. Please ensure location is enabled.', 'error', 5000)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [update, deliveryLocation, pushToast])

  const placeOrder = async () => {
    setGeoError('')
    setFieldError(null)
    if (!entries.length || placing) return

    if (!user?.uid) {
      pushToast('Please sign in to place an order.', 'error', 5000)
      openAuth('login')
      return
    }

    let lat = typeof form.lat === 'number' ? form.lat : null
    let lng = typeof form.lng === 'number' ? form.lng : null
    let geoParts = null

    const addressLineCombined = [form.addressLine1, form.addressLine2].filter(Boolean).join(', ')
    const addressQuery = [addressLineCombined, form.city, form.state, form.pin].filter(Boolean).join(', ')
    const addressTagValue = (form.addressTag || '').trim() || 'Other'

    if ((lat == null || lng == null) && addressQuery) {
      try {
        const geo = await geocodeAddress(addressQuery)
        if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
          lat = geo.lat
          lng = geo.lng
          geoParts = geo
          update('lat', geo.lat)
          update('lng', geo.lng)
          // Keep line 1 manual; put geocoded address into line 2
          const autoAddress = geo.formatted || [geo.line1, geo.line2].filter(Boolean).join(', ')
          if (autoAddress) update('addressLine2', autoAddress)
          // City fixed to Durgapur
          update('city', 'Durgapur')
          if (geo.state) update('state', geo.state)
          if (geo.zip) update('pin', geo.zip)
          if (geo.placeId) update('placeId', geo.placeId)
          if (geo.mapUrl) update('mapUrl', geo.mapUrl)
        }
      } catch (err) {
        console.warn('[checkout] geocode fallback failed', err)
      }
    }

    const phoneRegex = /^\+?[0-9]{7,15}$/
    const pinRegex = /^[0-9]{4,8}$/
    const phoneOkNow = !form.phone || phoneRegex.test(form.phone)
    const addressPhoneOkNow = !form.addressPhone || phoneRegex.test(form.addressPhone)
    const pinOkNow = !form.pin || pinRegex.test(form.pin)
    const requiredFilledNow = Boolean(form.name && form.addressLine1 && form.city && form.pin && typeof lat === 'number' && typeof lng === 'number')
    const withinResult = (typeof lat === 'number' && typeof lng === 'number') ? deliveryLocation.checkWithin(lat, lng) : { ok: false, radiusKm: deliveryLocation.region?.radiusKm || 0, distance: 0 }
    
    // Auto-scroll to the first field that needs attention
    if (!requiredFilledNow || !phoneOkNow || !pinOkNow || !withinResult.ok || !addressPhoneOkNow) {
      if (!form.name && nameRef.current) {
        setErrorAndScroll('name', 'Please enter your full name.', nameRef)
        return
      }
      if (!form.phone && phoneRef.current) {
        setErrorAndScroll('phone', 'Please enter your phone number.', phoneRef)
        return
      }
      if (!phoneOkNow && phoneRef.current) {
        setErrorAndScroll('phone', 'Please enter a valid phone number.', phoneRef)
        return
      }
      if (!form.addressLine1 && addressLine1Ref.current) {
        setShowAddressForm(true)
        setErrorAndScroll('addressLine1', 'Please fill Address line 1 (House/Flat + Street).', addressLine1Ref)
        return
      }
      if (!form.addressLine2 && addressLine2Ref.current) {
        setShowAddressForm(true)
        setErrorAndScroll('addressLine2', 'Please type your Area/Locality in Address line 2 and select a suggestion (or use current location).', addressLine2Ref)
        return
      }
      if (!form.pin && pinRef.current) {
        setShowAddressForm(true)
        setErrorAndScroll('pin', 'Please enter your PIN code.', pinRef)
        return
      }
      if (!pinOkNow && pinRef.current) {
        setShowAddressForm(true)
        setErrorAndScroll('pin', 'Please enter a valid PIN code.', pinRef)
        return
      }
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        setShowAddressForm(true)
        setErrorAndScroll('location', 'Please select your delivery location: use “Use current location” or pick a suggestion in Address line 2.', addressSectionRef)
        return
      }
      if (!withinResult.ok) {
        setShowAddressForm(true)
        setErrorAndScroll('location', `We deliver within ${withinResult.radiusKm} km of Durgapur. Your address is ~${withinResult.distance.toFixed(1)} km away. Please choose a closer address.`, addressSectionRef)
        return
      }
      if (!addressPhoneOkNow) {
        setFieldError('phone')
        setGeoError('Please enter a valid phone number.')
        return
      }
      setGeoError('Please check the highlighted fields.')
      return
    }

    setPlacing(true)
    try {
      let savedAddrId = null
      if (user && form.addressLine1) {
        const addr = {
          name: addressTagValue,
          line1: form.addressLine1,
          line2: form.addressLine2,
          city: form.city,
          state: form.state,
          zip: form.pin,
          landmark: form.landmark,
          phone: form.addressPhone || form.phone,
          tag: addressTagValue,
          lat,
          lng,
        }
        const placeIdSource = geoParts?.placeId || form.placeId
        const mapUrlSource = geoParts?.mapUrl || form.mapUrl
        const normalized = (value) => (value || '').replace(/\s+/g, ' ').trim().toLowerCase()
        const match = (addresses?.list || []).find(a => {
          if (placeIdSource && a.placeId && a.placeId === placeIdSource) return true
          const lineKeyExisting = [a.line1, a.line2, a.city, a.zip].map(normalized).join('|')
          const lineKeyCurrent = [addr.line1, addr.line2, addr.city, addr.zip].map(normalized).join('|')
          return lineKeyExisting === lineKeyCurrent
        })

        const resolvedPlaceId = placeIdSource || match?.placeId || form.placeId || undefined
        const resolvedMapUrl = mapUrlSource || match?.mapUrl || form.mapUrl || undefined
        if (resolvedPlaceId) addr.placeId = resolvedPlaceId
        if (resolvedMapUrl) addr.mapUrl = resolvedMapUrl

        if (match) {
          savedAddrId = match.id
          const patch = {
            name: addr.name,
            tag: addr.tag,
            line1: addr.line1,
            ...(addr.line2 ? { line2: addr.line2 } : {}),
            city: addr.city,
            zip: addr.zip,
            ...(addr.phone ? { phone: addr.phone } : {}),
            ...(typeof addr.lat === 'number' ? { lat: addr.lat } : {}),
            ...(typeof addr.lng === 'number' ? { lng: addr.lng } : {}),
            ...(addr.placeId ? { placeId: addr.placeId } : {}),
            ...(addr.mapUrl ? { mapUrl: addr.mapUrl } : {}),
          }
          const hasDiff = Object.entries(patch).some(([key, value]) => {
            const current = match[key]
            if (typeof value === 'number' || typeof current === 'number') {
              return Number(value ?? 0) !== Number(current ?? 0)
            }
            return (value || '') !== (current || '')
          })
          if (hasDiff) {
            try { await updateAddress(user.uid, match.id, patch) } catch (e) { void e }
          }
          setActiveAddressId(match.id)
        } else {
          try {
            savedAddrId = await addAddress(user.uid, addr)
            if (savedAddrId) setActiveAddressId(savedAddrId)
          } catch (e) { void e }
        }

        if (savedAddrId && setAsDefault) {
          try { await setDefaultAddress(user.uid, savedAddrId) } catch (e) { void e }
        }
        if (user) {
          fetchAddresses(user.uid).then(setAddresses).catch(() => {})
        }
      }

      const isOnlinePayment = form.paymentMethod !== 'cod'
      const paymentInfo = isOnlinePayment
        ? { method: form.paymentMethod, gateway: 'razorpay', status: 'initiated' }
        : { method: 'cod', status: 'pending' }

      let razorpayOrderId = null
      if (isOnlinePayment) {
        // Use Vite-exposed public key (VITE_RAZORPAY_KEY_ID). Server-side secret remains in RAZORPAY_KEY_SECRET.
        const keyId = await getRazorpayKeyId()
        if (!keyId) {
          throw new Error('Online payments are not configured yet. Please contact support.')
        }
        const amountRupees = Number(subtotal)
        if (!amountRupees || amountRupees <= 0) {
          throw new Error('Cart total must be greater than zero for online payment.')
        }
        // Send cart items for server-side price verification
        const cartItems = entries.map(({ item, qty }) => ({
          name: item.name,
          rate: item?.rate ?? item?.price ?? 0,
          qty,
          categoryId: item.categoryId || undefined,
          variantLabel: item.variantLabel || undefined,
        }))
        const razorpayOrder = await createRazorpayOrder(amountRupees, cartItems)
        razorpayOrderId = razorpayOrder.orderId
        const RazorpayConstructor = await ensureRazorpay()
        let settled = false
        const paymentResponse = await new Promise((resolve, reject) => {
          const instance = new RazorpayConstructor({
            key: keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: BRAND_LONG,
            description: 'Order payment',
            order_id: razorpayOrder.orderId,
            prefill: {
              name: form.name || '',
              email: form.email || '',
              contact: form.phone || ''
            },
            notes: {
              cartSize: String(entries.length)
            },
            theme: {
              color: '#F97316'
            },
            handler: (response) => {
              if (settled) return
              settled = true
              resolve({
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                orderId: response.razorpay_order_id
              })
            },
            modal: {
              ondismiss: () => {
                if (!settled) {
                  settled = true
                  reject(new Error('Payment cancelled'))
                }
              }
            }
          })
          instance.on('payment.failed', (event) => {
            if (settled) return
            settled = true
            const description = event?.error?.description || 'Payment failed'
            reject(new Error(description))
          })
          instance.open()
          // Workaround: Some Razorpay SVGs set height="auto" which is invalid on SVG attributes.
          // Strip invalid attributes to silence console errors in some browsers.
          const fixInvalidSvg = () => {
            try {
              const svgs = document.querySelectorAll('svg[height="auto"]')
              svgs.forEach((el) => {
                el.removeAttribute('height')
                // allow CSS to control height; width usually set via viewBox
              })
            } catch { /* noop */ }
          }
          // Attempt a few times while modal builds
          fixInvalidSvg()
          let tries = 0
          const t = setInterval(() => {
            fixInvalidSvg()
            tries += 1
            if (tries > 10) clearInterval(t)
          }, 150)
        })

        const verification = await verifyRazorpayPayment({
          orderId: razorpayOrderId,
          paymentId: paymentResponse.paymentId,
          signature: paymentResponse.signature
        })
        if (!verification?.valid) {
          throw new Error('Payment verification failed. Please contact support.')
        }
        paymentInfo.status = 'paid'
        paymentInfo.paymentId = paymentResponse.paymentId
        paymentInfo.orderId = razorpayOrderId
        paymentInfo.signature = paymentResponse.signature
        paymentInfo.amount = Number(subtotal)
        paymentInfo.currency = razorpayOrder.currency
        paymentInfo.verified = true
      }

      const orderIdValue = await createOrder({
        userId: user?.uid || null,
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: {
            tag: addressTagValue,
            name: addressTagValue,
            line: addressLineCombined,
            line1: form.addressLine1,
            line2: form.addressLine2,
            city: form.city,
            state: form.state,
            pin: form.pin,
            landmark: form.landmark,
            phone: form.addressPhone || form.phone,
            lat,
            lng,
            ...(geoParts?.placeId || form.placeId ? { placeId: geoParts?.placeId || form.placeId } : {}),
            ...(geoParts?.mapUrl || form.mapUrl ? { mapUrl: geoParts?.mapUrl || form.mapUrl } : {}),
          },
          note: form.note,
          payment: paymentInfo,
        },
        items: entries.map(({ item, qty }) => ({
          id: item.id,
          name: item.name,
          rate: item?.rate ?? item?.price ?? 0,
          qty,
        })),
        totalAmount: Number(subtotal)
      })
      setOrderId(orderIdValue)

      // Send WhatsApp Bill
      try {
        const billOrder = {
          orderNo: orderIdValue,
          customer: {
            name: form.name,
            phone: form.phone,
            address: [form.addressLine1, form.addressLine2, form.city, form.pin].filter(Boolean).join(', '),
          },
          items: entries.map(({ item, qty }) => ({ ...item, qty, total: (Number(item?.rate ?? item?.price ?? 0) * qty) })),
          subtotal: Number(subtotal),
          taxAmount: 0,
          totalAmount: Number(subtotal),
          orderType: 'delivery'
        }
        sendBillToCustomer(billOrder)
          .then(res => {
             if (res?.__error) pushToast('WhatsApp confirmation failed: ' + (res.message || res.__error), 'warning')
          })
          .catch(err => {
             console.warn('Failed to send WhatsApp bill', err)
             pushToast('WhatsApp confirmation failed', 'warning')
          })
      } catch (e) {
        console.warn('Error preparing WhatsApp bill', e)
      }

      try {
        let summary = null
        try {
          summary = await fetchOrder(user?.uid || null, orderIdValue)
        } catch (err) {
          if (!user) {
            try { summary = await fetchOrder(null, orderIdValue) } catch { /* noop */ }
          } else {
            throw err
          }
        }
        if (summary) {
          setLatestOrderSummary({
            id: summary.orderNo || orderIdValue,
            payment: summary.payment || paymentInfo,
            statusHistory: buildOrderStatusTimeline(summary),
          })
        } else {
          setLatestOrderSummary({
            id: orderIdValue,
            payment: paymentInfo,
            statusHistory: [{ status: 'placed', at: new Date(), actor: user?.uid ? `user:${user.uid}` : 'guest' }],
          })
        }
      } catch {
        setLatestOrderSummary({
          id: orderIdValue,
          payment: paymentInfo,
          statusHistory: [{ status: 'placed', at: new Date(), actor: user?.uid ? `user:${user.uid}` : 'guest' }],
        })
      }
      pushToast('Order placed successfully.', 'success', 5000)
      clear()
    } catch (e) {
      // Don't show error for user-cancelled payments
      if (e.message === 'Payment cancelled') {
        setPlacing(false)
        return
      }
      console.error(e)
      pushToast(e?.message || 'Failed to place order. Please try again.', 'error', 5000)
    } finally {
      setPlacing(false)
    }
  }

  const phoneOk = !form.phone || /^\+?[0-9]{7,15}$/.test(form.phone)
  const addressPhoneOk = !form.addressPhone || /^\+?[0-9]{7,15}$/.test(form.addressPhone)
  const pinOk = !form.pin || /^[0-9]{4,8}$/.test(form.pin)
  const requiredFilled = form.name && form.phone && form.addressLine1 && form.addressLine2 && form.city && form.pin && (typeof form.lat === 'number') && (typeof form.lng === 'number')
  const withinCheck = (typeof form.lat === 'number') && (typeof form.lng === 'number')
    ? deliveryLocation.checkWithin(form.lat, form.lng)
    : { ok: false, radiusKm: deliveryLocation.region?.radiusKm || 0, distance: 0 }
  const withinRegion = withinCheck.ok
  const isValid = requiredFilled && phoneOk && pinOk && withinRegion && addressPhoneOk

  // Step completion tracking for step indicator
  const step1Complete = form.name && form.phone && phoneOk
  const step2Complete = (
    (activeAddressId && !showAddressForm) || !!form.addressLine1
  ) && form.addressLine2 && form.pin && pinOk && (typeof form.lat === 'number') && (typeof form.lng === 'number') && withinRegion && addressPhoneOk
  const step3Complete = !!orderId

  const step1Done = confirmedSteps.contact
  const step2Done = confirmedSteps.address

  const paymentOptions = CHECKOUT_PAYMENT_OPTIONS
  const describePaymentMethod = (method) => {
    const found = paymentOptions.find((opt) => opt.key === method)
    return found ? found.label : (method ? method.toUpperCase() : 'Not set')
  }
  const paymentIsOnline = form.paymentMethod !== 'cod'
  const locationOutsideRegion = (typeof form.lat === 'number') && (typeof form.lng === 'number') && !withinCheck.ok
  const addressSummary = [form.addressLine1, form.addressLine2, form.city, form.state, form.pin].filter(Boolean).join(', ')

  const invalidHint = (() => {
    if (isValid) return null
    if (!form.name) return 'Add your full name to continue.'
    if (!form.phone) return 'Add your phone number to continue.'
    if (!phoneOk) return 'Phone number looks invalid. Please re-check it.'
    if (!form.addressLine1) return 'Fill Address line 1 (House/Flat + Street).'
    if (!form.addressLine2) return 'Fill Address line 2 (Area/Locality) and pick a suggestion.'
    if (!form.pin) return 'Enter your PIN code to continue.'
    if (!pinOk) return 'PIN code looks invalid. Please re-check it.'
    if (typeof form.lat !== 'number' || typeof form.lng !== 'number') return 'Select your location: use “Use current location” or pick a suggestion in Address line 2.'
    if (!withinRegion) return `Outside delivery area: we deliver within ${withinCheck.radiusKm} km of Durgapur. Please choose a closer address.`
    if (!addressPhoneOk) return 'Address phone number looks invalid. Please re-check it.'
    return 'Please check the highlighted fields.'
  })()

  const handleNext = async () => {
    if (currentStep === 1) {
      if (step1Complete) {
        setConfirmedSteps((prev) => ({ ...prev, contact: true }))
        setCurrentStep(2)
      }
      else guideToNextField()
    } else if (currentStep === 2) {
        // Enforce location button click once
        if (!locationVerifiedByButton && !locationWarningShown) {
            setLocationWarningShown(true)
            setShowLocationAnimation(true)
            // Auto hide animation after 3s
            setTimeout(() => setShowLocationAnimation(false), 3000)
            
            // Scroll to the lower button
            try {
                gpsButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } catch(e){/*ignore*/}
            
            // Humble message
            pushToast('Please help us locate you better for hassle-free delivery!', 'info', 4000)
            return
        }

      if (step2Complete) {
        // Save/Update address if form is open
        if (user && showAddressForm) {
          try {
            const addr = {
              name: form.addressTag || 'Other',
              line1: form.addressLine1,
              line2: form.addressLine2,
              city: form.city,
              state: form.state,
              zip: form.pin,
              landmark: form.landmark,
              phone: form.addressPhone || form.phone,
              tag: form.addressTag || 'Other',
              lat: form.lat,
              lng: form.lng,
              placeId: form.placeId,
              mapUrl: form.mapUrl
            }
            
            if (activeAddressId) {
              await updateAddress(user.uid, activeAddressId, addr)
              pushToast('Address updated', 'success')
            } else {
              const newId = await addAddress(user.uid, addr)
              if (newId) setActiveAddressId(newId)
              pushToast('Address saved', 'success')
            }
            fetchAddresses(user.uid).then(setAddresses).catch(()=>{})
          } catch (e) {
            console.error('Failed to save address', e)
          }
        }
        setConfirmedSteps((prev) => ({ ...prev, address: true }))
        setCurrentStep(3)
      }
      else guideToNextField()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const sortedAddresses = [...(addresses?.list || [])].sort((a, b) => {
    if (a.id === addresses.defaultId) return -1
    if (b.id === addresses.defaultId) return 1
    return 0
  })
  const hasSavedAddresses = user && sortedAddresses.length > 0

  // ── Render ──
  return (
    <div className="min-h-[90vh] flex items-center justify-center py-8 px-4 bg-base-200/30">
      {orderId ? (
        <div className="w-full max-w-md text-center space-y-4 animate-in zoom-in duration-300">
          <div className="rounded-2xl border border-base-300/60 bg-base-100/90 p-8 shadow-lg">
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
            <h3 className="font-bold text-lg mt-4">Taking you to your active order…</h3>
            <div className="text-sm opacity-80 mt-1">Order ID: <span className="font-mono font-bold">{orderId}</span></div>
          </div>
          <button className="btn btn-primary btn-wide rounded-xl" onClick={() => navigate(`/active-orders?id=${encodeURIComponent(orderId)}`, { replace: true })}>
            View order status
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-base-100 rounded-2xl shadow-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center text-4xl">🛒</div>
            <div>
              <div className="text-2xl font-bold">Your cart is empty!</div>
              <div className="text-sm opacity-60 mt-2 leading-relaxed">Looks like you haven't added anything yet.<br/>Browse our menu and add your favorite items.</div>
            </div>
            <button
              className="btn btn-primary btn-wide rounded-xl"
              onClick={() => window.location.href = '/'}
            >Browse Menu</button>
        </div>
      ) : (
        <div className="w-full max-w-lg card card-surface shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className="bg-base-100 p-5 border-b border-base-200 shrink-0 z-10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold">Checkout</h1>
                    <div className="text-sm font-medium bg-base-200 px-3 py-1 rounded-full">Total: ₹{subtotal}</div>
                </div>
                {/* Step Indicator */}
                <div className="flex items-center justify-between relative px-4">
                  <div className={`flex flex-col items-center gap-1 z-10 ${currentStep >= 1 ? 'text-primary' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step1Done ? 'bg-success text-success-content' : currentStep === 1 ? 'bg-primary text-primary-content ring-4 ring-primary/20' : 'bg-base-300'}`}>
                        {step1Done ? <MdCheck className="w-5 h-5" /> : '1'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Contact</span>
                  </div>
                  <div className={`absolute top-4 left-0 w-full h-0.5 -z-0 bg-base-200`}>
                    <div className="h-full bg-success transition-all duration-500 ease-out" style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}></div>
                  </div>
                  <div className={`flex flex-col items-center gap-1 z-10 ${currentStep >= 2 ? 'text-primary' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step2Done ? 'bg-success text-success-content' : currentStep === 2 ? 'bg-primary text-primary-content ring-4 ring-primary/20' : 'bg-base-300'}`}>
                        {step2Done ? <MdCheck className="w-5 h-5" /> : '2'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Address</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1 z-10 ${currentStep >= 3 ? 'text-primary' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step3Complete ? 'bg-success text-success-content' : currentStep === 3 ? 'bg-primary text-primary-content ring-4 ring-primary/20' : 'bg-base-300'}`}>
                        {step3Complete ? <MdCheck className="w-5 h-5" /> : '3'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Payment</span>
                  </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative bg-base-100/50">
                {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold">Contact Details</h2>
                            <p className="text-xs opacity-60">We'll use this to contact you about your order.</p>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Full Name</span></label>
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'name' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                <MdPerson className="w-5 h-5 opacity-50" />
                                <input ref={nameRef} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Enter your name" value={form.name} onChange={(e)=>update('name', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Phone Number</span></label>
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'phone' || (form.phone && !phoneOk) ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                <MdLocalPhone className="w-5 h-5 opacity-50" />
                                <input ref={phoneRef} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="10-digit mobile number" type="tel" value={form.phone} onChange={(e)=>update('phone', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Email (Optional)</span></label>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                                <MdEmail className="w-5 h-5 opacity-50" />
                                <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="For order receipt" type="email" value={form.email} onChange={(e)=>update('email', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label py-1"><span className="label-text text-xs uppercase font-bold opacity-60">Instructions (Optional)</span></label>
                            <textarea className="textarea textarea-bordered h-24 rounded-xl bg-base-200/50 focus:bg-base-100 border-transparent focus:border-primary/50" placeholder="Any special cooking or delivery instructions?" value={form.note} onChange={(e)=>update('note', e.target.value)}></textarea>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold">Delivery Address</h2>
                            <p className="text-xs opacity-60">Where should we deliver your meal?</p>
                        </div>
                        
                        {/* Saved Addresses List */}
                        {!showAddressForm && hasSavedAddresses && (
                            <div className="space-y-3">
                                {sortedAddresses.map(a => (
                                    <div key={a.id} className={`p-4 rounded-xl border transition-all hover:shadow-md group ${activeAddressId === a.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-base-200 hover:border-primary/50'}`}>
                                        <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => { fillFromAddress(a); setShowAddressForm(true); }}>
                                            <span className="font-bold flex items-center gap-2 text-sm"><MdPlace className={`w-4 h-4 ${activeAddressId === a.id ? 'text-primary' : 'opacity-50'}`} /> {a.tag || 'Address'}</span>
                                            {activeAddressId === a.id ? <MdCheck className="text-primary w-5 h-5" /> : <MdEdit className="w-4 h-4 opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />}
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs opacity-70 leading-relaxed pl-6 flex-1 cursor-pointer" onClick={() => { fillFromAddress(a); setShowAddressForm(true); }}>{[a.line1, a.line2, a.city, a.pin].filter(Boolean).join(', ')}</p>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleStartNewAddress} className="btn btn-outline btn-block border-dashed border-base-300 hover:border-primary hover:bg-primary/5 normal-case gap-2 rounded-xl mt-2">
                                    <MdAdd className="w-5 h-5" /> Add New Address
                                </button>
                            </div>
                        )}

                        {/* New Address Form */}
                        {(showAddressForm || !hasSavedAddresses) && (
                            <div className="space-y-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center">
                                    {['Home', 'Work', 'Other'].map(tag => (
                                        <label key={tag} className={`cursor-pointer px-5 py-2 rounded-full border text-xs font-bold transition-all ${form.addressTag === tag ? 'bg-primary text-primary-content border-primary shadow-md shadow-primary/20' : 'bg-base-100 border-base-300 hover:border-base-400'}`}>
                                            <input type="radio" className="hidden" name="addrTag" checked={form.addressTag === tag} onChange={()=>update('addressTag', tag)} />
                                            {tag}
                                        </label>
                                    ))}
                                </div>

                                {/* Auto-fill via GPS Button */}
                                <button 
                                    type="button" 
                                  className={`btn btn-block rounded-xl min-h-[3.25rem] text-base font-semibold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 relative overflow-hidden group transition-opacity duration-300 ease-in-out ${gettingLocation ? 'loading opacity-70' : 'opacity-100'}`} 
                                    onClick={handleAutoFillLocation}
                                >
                                    <div className="absolute inset-0 bg-primary/10 animate-pulse group-hover:animate-none"></div>
                                  <span className="relative flex items-center justify-center gap-2 z-10">
                                        <MdGpsFixed className="animate-bounce" /> Press to Auto-fill via GPS
                                    </span>
                                </button>
                                
                                <div className="form-control w-full">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'landmark' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdPlace className="w-5 h-5 opacity-50" />
                                        <input ref={landmarkRef} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Nearby Landmark (Optional)" value={form.landmark} onChange={(e)=>update('landmark', e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-control w-full">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'addressLine1' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdApartment className="w-5 h-5 opacity-50" />
                                        <input ref={addressLine1Ref} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="House / Flat No., Building" value={form.addressLine1} onChange={(e)=>update('addressLine1', e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-control w-full">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'addressLine2' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdMap className="w-5 h-5 opacity-50" />
                                    <input ref={addressLine2Ref} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Search Area / Locality (pick a suggestion)" value={form.addressLine2} onChange={(e)=>handleAddressLine2Change(e.target.value)} />
                                    </div>
                                    <label className="label py-1"><span className="label-text-alt opacity-60">Select from suggestions for best accuracy</span></label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border ${fieldError === 'pin' ? 'border-error' : 'border-transparent'} focus-within:border-primary/50 focus-within:bg-base-100 transition-all`}>
                                        <MdPinDrop className="w-5 h-5 opacity-50" />
                                        <input ref={pinRef} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="PIN Code" value={form.pin} onChange={(e)=>update('pin', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent opacity-70 cursor-not-allowed">
                                        <MdLocationCity className="w-5 h-5 opacity-50" />
                                        <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0" value="Durgapur" readOnly />
                                    </div>
                                </div>

                                {/* Confirm Location Only Button */}
                                <div className="relative">
                                  {showLocationAnimation && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 flex flex-col items-center animate-in zoom-in slide-in-from-bottom-5 duration-500 pointer-events-none">
                                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl shadow-xl border border-red-100 text-center mb-1">
                                            <p className="text-sm font-bold">Small request! 🙏</p>
                                            <p className="text-xs mt-0.5 leading-tight">Please share location for easy, hassle-free delivery.</p>
                                        </div>
                                        <div className="text-5xl animate-bounce drop-shadow-lg filter pt-2">👇</div>
                                    </div>
                                  )}

                                  <button
                                    ref={gpsButtonRef}
                                    type="button"
                                    className={`btn btn-block rounded-xl min-h-[3.25rem] text-base font-semibold border-none bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 ease-in-out ${gettingLocation ? 'loading opacity-70' : 'opacity-100'} ${highlightGPSButton || showLocationAnimation ? 'ring-4 ring-offset-2 ring-red-500/50 scale-[1.02]' : ''}`}
                                    onClick={handleGPSOnly}
                                  >
                                    <MdGpsFixed className={showLocationAnimation ? "animate-pulse" : ""} /> Press to share location for faster delivery
                                  </button>
                                  {highlightGPSButton && !showLocationAnimation && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-error text-error-content px-4 py-2 rounded-xl text-xs font-bold shadow-xl z-50 whitespace-nowrap animate-in fade-in slide-in-from-bottom-4 duration-300 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-error">
                                      👆 Click here to share your location!
                                    </div>
                                  )}
                                </div>
                                
                                {hasSavedAddresses && (
                                    <button type="button" className="btn btn-xs btn-link text-base-content no-underline opacity-60 hover:opacity-100 mx-auto block" onClick={() => setShowAddressForm(false)}>
                                        Cancel & Select Saved Address
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold">Review & Pay</h2>
                            <p className="text-xs opacity-60">One last check before you eat!</p>
                        </div>

                        {/* Order Summary Accordion */}
                        <div className="collapse collapse-arrow bg-base-200/30 rounded-xl border border-base-200">
                            <input type="checkbox" /> 
                            <div className="collapse-title font-medium text-sm flex justify-between pr-10 items-center">
                                <span className="opacity-80">Order Summary ({entries.length} items)</span>
                                <span className="font-bold">₹{subtotal}</span>
                            </div>
                            <div className="collapse-content text-xs space-y-3">
                                {entries.map(({ item, qty }) => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold bg-base-200 px-1.5 py-0.5 rounded">{qty}x</span>
                                            <span>{item.name}</span>
                                        </div>
                                    <span>₹{Number(item?.rate ?? item?.price ?? 0) * qty}</span>
                                    </div>
                                ))}
                                <div className="divider my-1"></div>
                                <div className="flex justify-between font-bold text-sm">
                                    <span>To Pay</span>
                                    <span>₹{subtotal}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address Preview */}
                        <div className="rounded-xl border border-base-200 p-4 flex items-start gap-3 bg-base-100/50">
                            <MdPlace className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <div className="text-xs font-bold uppercase opacity-60 mb-1">Delivering To</div>
                                <p className="text-sm leading-relaxed">{addressSummary}</p>
                            </div>
                            <button className="btn btn-xs btn-ghost" onClick={() => setCurrentStep(2)}>Edit</button>
                        </div>

                        {/* Payment Options */}
                        <div className="space-y-3">
                            <div className="text-xs font-bold uppercase opacity-60 ml-1">Payment Method</div>
                            <div className="grid grid-cols-1 gap-3">
                                {paymentOptions.map((option) => {
                                    const { key, label, icon: Icon } = option
                                    return (
                                        <label key={key} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === key ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' : 'border-base-200 hover:border-primary/50'}`}>
                                            <input type="radio" className="radio radio-primary radio-sm" checked={form.paymentMethod === key} onChange={() => update('paymentMethod', key)} />
                                            <Icon className={`w-6 h-6 ${form.paymentMethod === key ? 'text-primary' : 'opacity-50'}`} />
                                            <div className="flex-1 font-medium text-sm">{label}</div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-base-100 border-t border-base-200 shrink-0 z-10 flex items-center justify-between gap-4">
                <button 
                    className={`btn btn-ghost hover:bg-base-200 ${currentStep === 1 ? 'invisible' : ''}`}
                    onClick={handleBack}
                >
                    Back
                </button>
                
                {currentStep < 3 ? (
                    <button 
                        className="btn btn-primary px-8 rounded-xl shadow-lg shadow-primary/20"
                        onClick={handleNext}
                    >
                        Next Step
                    </button>
                ) : (
                    <button 
                        className="btn btn-primary px-8 rounded-xl shadow-lg shadow-primary/20 flex-1 max-w-xs ml-auto"
                        disabled={placing || !isValid}
                        onClick={placeOrder}
                    >
                        {placing ? <span className="loading loading-spinner"></span> : `Place Order • ₹${subtotal}`}
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  )
}

```

### Customer Profile.jsx (venkys/src/pages/Profile.jsx)
`$lang
// Profile — User profile, addresses, and order history
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Link, useLocation } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import { MdPlace, MdApartment, MdLocationCity, MdMap, MdPinDrop, MdLocalPhone, MdGpsFixed, MdPerson, MdMail, MdEdit, MdLocalShipping, MdPolicy, MdGavel, MdCancel, MdReplay, MdRefresh } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import useDeliveryLocation from '../hooks/useDeliveryLocation'
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete'
import ProfileCompletionAlert from '../components/ProfileCompletionAlert'
import { fetchUserOrders, fetchUserProfile, updateUserProfile, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, isCounterDocId } from '../lib/data'
import { db } from '../lib/firebase'
import { reverseGeocode, geocodeAddress } from '../lib/google'

// ── Helpers ──

// Helper to compute profile completion (shared by components)
function getProfileCompletion(user, profileForm, addrState) {
  if (!user) return 0;
  const checks = [];
  const nameOk = !!(profileForm.displayName || '').trim();
  const phoneOk = /\d{10}/.test((profileForm.phone || '').replace(/\D/g, ''));
  const hasAnyAddr = (addrState.list || []).length > 0;
  checks.push(nameOk, phoneOk, hasAnyAddr);
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return Math.max(0, Math.min(100, pct));
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { pushToast, confirm } = useUI();
  const location = useLocation();
  const deliveryLocation = useDeliveryLocation();

  // ── State & refs ──
  // Profile and orders state
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Addresses state
  const [addrState, setAddrState] = useState({ list: [], defaultId: null });
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [orderModal, setOrderModal] = useState(null);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrEditing, setAddrEditing] = useState(null);
  const [addrForm, setAddrForm] = useState({ name: '', line1: '', line2: '', city: 'Durgapur', state: 'West Bengal', zip: '', landmark: '', phone: '', tag: 'Home', lat: null, lng: null, placeId: '', mapUrl: '' });
  const [addrSaving, setAddrSaving] = useState(false);
  const addrLine1Ref = useRef(null);
  const addrLine2Ref = useRef(null);
  const [setAsDefault, setSetAsDefault] = useState(false);

  // Edit details modal UI state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAlert, setEditAlert] = useState("");
  const [usePhoneForWhatsapp, setUsePhoneForWhatsapp] = useState(false);

  const closeEditModal = useCallback((evt) => {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    if (profileSaving) return;
    setEditModalOpen(false);
    setEditAlert('');
    setUsePhoneForWhatsapp(false);
  }, [profileSaving]);

  // ── Side-effects ──
  // Handle scrolling from navigation state
  useEffect(() => {
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Clear state to prevent re-scroll on re-render
      window.history.replaceState({}, document.title)
    } else if (location.state?.scrollTo === 'orders' || location.hash === '#orders') {
      const el = document.getElementById('orders-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Clear state
        window.history.replaceState({}, document.title)
      }
    }
  }, [location])

  // Load orders with real-time updates
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    
    // Set up real-time listener for user's orders (Query top-level collection by userId)
    const ordersRef = collection(db, 'orders');
    const qy = query(ordersRef, where('userId', '==', user.uid));
    
    const unsub = onSnapshot(qy, (snap) => {
      const toMillis = (v) => {
        if (!v) return 0
        if (typeof v.toMillis === 'function') return v.toMillis()
        if (typeof v.seconds === 'number') return v.seconds * 1000
        if (typeof v === 'number') return v
        const parsed = Date.parse(String(v))
        return Number.isNaN(parsed) ? 0 : parsed
      }
      const ordersList = snap.docs
        .filter(d => !isCounterDocId(d.id))
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = toMillis(a?.createdAt) || toMillis(a?.updatedAt)
          const tb = toMillis(b?.createdAt) || toMillis(b?.updatedAt)
          return tb - ta
        });
      setOrders(ordersList);
      setLoadingOrders(false);
    }, (err) => {
      console.error('[profile] Real-time orders error:', err);
      // Fallback to one-time fetch if listener fails
      fetchUserOrders(user.uid)
        .then((list) => setOrders(Array.isArray(list) ? list : []))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    });
    
    return () => unsub();
  }, [user]);

  const handleOrdersRefresh = useCallback(async () => {
    if (!user || loadingOrders) return;
    setLoadingOrders(true);
    try {
      const list = await fetchUserOrders(user.uid);
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('[profile] Failed to refresh orders', err);
      pushToast('Failed to refresh orders. Please try again.', 'error');
    } finally {
      setLoadingOrders(false);
    }
  }, [user, loadingOrders, pushToast]);

  // Load profile
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileForm({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
      setEditForm({ displayName: '', phone: '', whatsapp: '', gender: '', email: '' });
      setUsePhoneForWhatsapp(false);
      setEditAlert('');
      setEditModalOpen(false);
      setAddrModalOpen(false);
      setAddrEditing(null);
      setAddrForm({ name: '', line1: '', line2: '', city: 'Durgapur', state: 'West Bengal', zip: '', landmark: '', phone: '', tag: 'Home', lat: null, lng: null, placeId: '', mapUrl: '' });
      setSetAsDefault(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const p = await fetchUserProfile(user.uid);
        if (!mounted) return;
        setProfile(p);
        setProfileForm(f => ({
          ...f,
          displayName: p?.displayName || '',
          phone: p?.phone || '',
          whatsapp: p?.whatsapp || '',
          gender: p?.gender || '',
          email: p?.email || user?.email || ''
        }));
        const phoneDigits = ((p?.phone || '').replace(/\D/g, '')).slice(0, 10);
        const whatsappDigits = ((p?.whatsapp || '').replace(/\D/g, '')).slice(0, 10);
        setUsePhoneForWhatsapp(Boolean(phoneDigits) && phoneDigits === whatsappDigits);
        if (editModalOpen) {
          setEditForm(f => ({
            ...f,
            displayName: p?.displayName || '',
            phone: p?.phone || '',
            whatsapp: p?.whatsapp || '',
            gender: p?.gender || '',
            email: p?.email || user?.email || ''
          }));
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[profile] Failed to load profile', err);
        pushToast('Failed to load profile details. Please refresh.', 'error');
      }
    })();
    return () => { mounted = false; };
  }, [user, editModalOpen, pushToast]);

  // Load addresses
  useEffect(() => {
    if (!user) {
      setAddrState({ list: [], defaultId: null });
      return;
    }
    let active = true;
    fetchAddresses(user.uid)
      .then((data) => {
        if (!active) return;
        setAddrState(data || { list: [], defaultId: null });
      })
      .catch((err) => {
        if (!active) return;
        console.error('[profile] Failed to load addresses', err);
        pushToast('Failed to load saved addresses.', 'error');
        setAddrState({ list: [], defaultId: null });
      });
    return () => { active = false; };
  }, [user, pushToast]);

  // Address add modal opener (memoized)
  const openAddAddress = useCallback(() => {
    setAddrEditing(null);
    setAddrForm({
      name: '',
      line1: '',
      line2: '',
      city: 'Durgapur',
      state: 'West Bengal',
      zip: '',
      landmark: '',
      phone: user?.phoneNumber || profile?.phone || '',
      tag: 'Home',
      lat: null,
      lng: null,
      placeId: '',
      mapUrl: ''
    });
    setSetAsDefault(addrState.list.length === 0);
    setAddrModalOpen(true);
  }, [user?.phoneNumber, profile?.phone, addrState.list.length]);

  // Guided completion flow
  const openEditModal = useCallback(() => {
    // Check details first (name, phone)
    const nameMissing = !(profileForm.displayName || '').trim();
    const phoneMissing = !/\d{10}/.test((profileForm.phone || '').replace(/\D/g, ''));
    const phoneDigits = (profileForm.phone || '').replace(/\D/g, '').slice(0, 10);
    const whatsappDigits = (profileForm.whatsapp || '').replace(/\D/g, '').slice(0, 10);
    const sameContact = Boolean(phoneDigits) && phoneDigits === whatsappDigits;
    if (nameMissing || phoneMissing) {
      setEditForm({
        displayName: profileForm.displayName || '',
        phone: profileForm.phone || '',
        whatsapp: profileForm.whatsapp || '',
        email: user?.email || '',
        gender: profileForm.gender || profile?.gender || ''
      });
      setEditAlert('');
      setUsePhoneForWhatsapp(sameContact);
      setEditModalOpen(true);
      return;
    }
    // If details are complete, check address
    if ((addrState.list || []).length === 0) {
      openAddAddress();
      return;
    }
    // If everything is complete, open details modal for review
    setEditForm({
      displayName: profileForm.displayName || '',
      phone: profileForm.phone || '',
      whatsapp: profileForm.whatsapp || '',
      email: user?.email || '',
      gender: profileForm.gender || profile?.gender || ''
    });
    setEditAlert('');
    setUsePhoneForWhatsapp(sameContact);
    setEditModalOpen(true);
  }, [addrState.list, profile, profileForm.displayName, profileForm.gender, profileForm.phone, profileForm.whatsapp, user?.email, openAddAddress]);
  async function saveEditModal() {
    if (!user) return;
    // Validation: Full name required
    if (!(editForm.displayName || '').trim()) {
      setEditAlert('Full name is required');
      return;
    }
    // Validation: Phone required and must be 10 digits
    const phoneDigits = (editForm.phone || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) {
      setEditAlert('Enter 10 digits');
      return;
    }
    // WhatsApp validation
    const whatsappDigits = (editForm.whatsapp || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(whatsappDigits)) {
      setEditAlert('Valid 10-digit WhatsApp number required');
      return;
    }
    setEditAlert("");
    setProfileSaving(true);
    try {
      await updateUserProfile(user.uid, {
        ...profileForm,
        displayName: editForm.displayName,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        gender: editForm.gender
      });
      setProfileForm(f => ({ ...f, displayName: editForm.displayName, phone: editForm.phone, whatsapp: editForm.whatsapp, gender: editForm.gender }));
      setProfile(p => ({ ...(p||{}), displayName: editForm.displayName, phone: editForm.phone, whatsapp: editForm.whatsapp, gender: editForm.gender }));
      setEditAlert('Profile updated successfully!');
      setTimeout(() => closeEditModal(), 1200);
    } catch (e) {
      const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Update failed';
      setEditAlert(msg);
    }
    finally { setProfileSaving(false); }
  }

  // Removed unused saveProfile function (edit modal handles updates)

  // If navigated with completeNow intent, trigger guided modal flow
  useEffect(() => {
    if (location.state && location.state.completeNow && user) {
      // Clear the state so it doesn't trigger again on re-render
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search + window.location.hash);
      }, 0);
      openEditModal();
    }
  }, [location.state, user, openEditModal]);

  // ── Handlers ──
  function openEditAddress(a) {
    setAddrEditing(a)
    setAddrForm({ name: a.name||'', line1: a.line1||'', line2: a.line2||'', city: a.city||'', state: a.state||'', zip: a.zip||'', landmark: a.landmark||'', phone: a.phone||'', tag: a.tag||'Other', lat: a.lat ?? null, lng: a.lng ?? null, placeId: a.placeId || '', mapUrl: a.mapUrl || '' })
    setSetAsDefault(addrState.defaultId === a.id)
    setAddrModalOpen(true)
  }
  const handleAddrAutocomplete = useCallback((parts) => {
    if (!parts) return
    setAddrForm((f) => ({
      ...f,
      // Keep line 1 for manual entry; put autofill into line 2
      line2: parts.formatted || [parts.line1, parts.line2].filter(Boolean).join(', ') || f.line2,
      city: 'Durgapur',
      state: parts.state || f.state,
      zip: parts.zip || f.zip,
      placeId: parts.placeId || f.placeId,
      mapUrl: parts.mapUrl || f.mapUrl,
      lat: typeof parts.lat === 'number' ? parts.lat : f.lat,
      lng: typeof parts.lng === 'number' ? parts.lng : f.lng,
    }))
  }, [])
  usePlacesAutocomplete(addrLine2Ref, handleAddrAutocomplete, { enabled: addrModalOpen })
  async function saveAddress() {
    if (!user) return
    setAddrSaving(true)
    try {
      const payload = { ...addrForm, name: (addrForm.name || '').trim() || addrForm.tag }
      if ((typeof payload.lat !== 'number' || typeof payload.lng !== 'number') && payload.line1) {
        const addressText = [payload.line1, payload.line2, payload.city, payload.zip].filter(Boolean).join(', ')
        try {
          const geo = await geocodeAddress(addressText)
          if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
            payload.lat = geo.lat
            payload.lng = geo.lng
            if (geo.placeId) payload.placeId = geo.placeId
            if (geo.mapUrl) payload.mapUrl = geo.mapUrl
            setAddrForm(f => ({ ...f, lat: geo.lat, lng: geo.lng, placeId: geo.placeId || f.placeId, mapUrl: geo.mapUrl || f.mapUrl }))
          }
        } catch (err) {
          console.warn('[profile] geocode fallback failed', err)
        }
      }
      // Geofencing check via centralized hook
      if (typeof payload.lat === 'number' && typeof payload.lng === 'number' && deliveryLocation.region) {
        const { ok, distance, radiusKm } = deliveryLocation.checkWithin(payload.lat, payload.lng)
        if (!ok) {
          pushToast(`Address is outside delivery region (${distance.toFixed(2)} km > ${radiusKm} km)`, 'error')
          setAddrSaving(false)
          return
        }
      }
      if (addrEditing) {
        await updateAddress(user.uid, addrEditing.id, payload)
        if (setAsDefault) { try { await setDefaultAddress(user.uid, addrEditing.id) } catch (e) { void e } }
        pushToast('Address updated', 'success')
      } else {
        const newId = await addAddress(user.uid, payload)
        if (setAsDefault && newId) { try { await setDefaultAddress(user.uid, newId) } catch (e) { void e } }
        pushToast('Address added', 'success')
      }
      const a = await fetchAddresses(user.uid)
      setAddrState(a)
      setAddrModalOpen(false)
    } catch (e) {
      const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Save failed';
      pushToast(msg, 'error');
    }
    finally { setAddrSaving(false) }
  }
  async function removeAddress(a) {
    if (!user) return
    confirm({
      message: `Delete address "${a.name || a.tag || ''}"?`,
      onConfirm: async () => {
        try {
          await deleteAddress(user.uid, a.id)
          const next = await fetchAddresses(user.uid)
          setAddrState(next)
          pushToast('Address deleted', 'info')
        } catch (e) {
          const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Delete failed';
          pushToast(msg, 'error');
        }
      }
    })
  }
  async function makeDefault(a) {
    if (!user) return
    try { await setDefaultAddress(user.uid, a.id); const next = await fetchAddresses(user.uid); setAddrState(next); pushToast('Default address set', 'success') }
    catch (e) {
      const msg = (e && typeof e.message === 'string' && e.message.trim()) ? e.message : 'Operation failed';
      pushToast(msg, 'error');
    }
  }

  // Reorder functionality
  const { add: addToCart } = useCart()
  const handleReorder = useCallback((items) => {
    if (!items || items.length === 0) return
    items.forEach(it => {
      // Reconstruct item object for cart
      addToCart({
        id: it.id || `${it.name}`,
        name: it.name,
        rate: Number(it?.rate ?? it?.price ?? 0),
        imageUrl: it.imageUrl || it.img || null,
      }, it.qty || 1)
    })
    pushToast(`Added ${items.length} item${items.length > 1 ? 's' : ''} to cart`, 'success')
  }, [addToCart, pushToast])


  if (!user) {
    return (
      <div className="page-wrap py-6">
        <div className="alert">Please log in to view your profile.</div>
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="page-wrap py-8 space-y-8 max-w-7xl mx-auto">
      {/* Profile heading with logout button on the right */}
      <div className="flex items-center justify-between flex-wrap gap-4 px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm opacity-60 mt-1">Manage your account and preferences</p>
        </div>
        <button className="btn btn-outline btn-error btn-sm gap-2" onClick={logout}>
          <MdCancel className="w-4 h-4" /> Logout
        </button>
      </div>

    {/* Profile completion alert (inline) */}
    <ProfileCompletionAlert user={user} profileForm={profileForm} addrState={addrState} onEdit={openEditModal} />


      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body p-6 text-center">
              
              <div className="mt-2">
                <h2 className="text-xl font-bold">{profileForm.displayName || user?.displayName || 'User'}</h2>
                <p className="text-sm opacity-60">Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2024'}</p>
              </div>

              <div className="divider my-1"></div>

              <div className="space-y-3 text-sm text-left w-full px-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
                    <MdLocalPhone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs opacity-60">Phone</div>
                    <div className="font-medium truncate">{profileForm.phone || 'Not set'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-primary">
                    <MdMail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs opacity-60">Email</div>
                    <div className="font-medium truncate">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full">
                <button className="btn btn-outline btn-sm w-full rounded-full" onClick={openEditModal}>Edit Profile</button>
              </div>
            </div>
          </div>

          {/* Support & Legal Menu - Removed from here */}
        </div>

        {/* Right Content (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Addresses Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MdPlace className="text-primary" /> Saved Addresses
              </h2>
              <button className="btn btn-sm btn-primary rounded-full px-4" onClick={openAddAddress}>
                + Add New
              </button>
            </div>
            
            {addrState.list.length === 0 ? (
              <div className="alert bg-base-100 border-base-200 shadow-sm">
                <MdPlace className="w-6 h-6 opacity-40" />
                <div>
                  <h3 className="font-bold">No addresses saved</h3>
                  <div className="text-xs">Add an address to speed up checkout.</div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {addrState.list.map(a => (
                  <div key={a.id} className={`card bg-base-100 shadow-sm border transition-all hover:shadow-md ${addrState.defaultId===a.id ? 'border-primary ring-1 ring-primary/20' : 'border-base-200'}`}>
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base">{a.name || a.tag || 'Address'}</span>
                          {a.tag && <span className="badge badge-ghost badge-xs uppercase tracking-wider text-[10px]">{a.tag}</span>}
                          {addrState.defaultId===a.id && <span className="badge badge-primary badge-xs">Default</span>}
                        </div>
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="btn btn-ghost btn-xs btn-circle">
                            <span className="text-lg">⋮</span>
                          </div>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-200">
                            <li><button onClick={()=>openEditAddress(a)} className="text-xs">Edit</button></li>
                            {addrState.defaultId!==a.id && <li><button onClick={()=>makeDefault(a)} className="text-xs">Set Default</button></li>}
                            <li><button onClick={()=>removeAddress(a)} className="text-xs text-error">Delete</button></li>
                          </ul>
                        </div>
                      </div>
                      
                      <p className="text-sm opacity-70 leading-relaxed min-h-[3rem]">
                        {[a.line1, a.line2, a.city, a.zip].filter(Boolean).join(', ')}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs opacity-60">
                        {a.phone && <span className="flex items-center gap-1"><MdLocalPhone className="w-3 h-3"/> {a.phone}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="divider"></div>

          {/* Orders Section */}
          <section id="orders-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MdLocalShipping className="text-primary" /> Order History
              </h2>
              <button className="btn btn-sm btn-ghost btn-circle" title="Refresh orders" onClick={handleOrdersRefresh} disabled={loadingOrders}>
                <MdRefresh className={`w-5 h-5 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingOrders && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            )}

            {!loadingOrders && orders.length === 0 && (
              <div className="text-center py-10 bg-base-100 rounded-xl border border-base-200 border-dashed">
                <div className="opacity-30 mb-2 text-4xl">📦</div>
                <p className="opacity-60">No orders placed yet.</p>
                <Link to="/" className="btn btn-link btn-sm mt-2">Browse Menu</Link>
              </div>
            )}

            <div className="space-y-4">
              {/* Active Orders */}
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider opacity-50 mb-3 ml-1">Active Orders</h3>
                  <div className="space-y-3">
                    {orders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').map(o => (
                      <OrderCard key={o.id} order={o} openModal={setOrderModal} onReorder={handleReorder} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Orders */}
              {orders.filter(o => o.status === 'delivered' || o.status === 'rejected').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider opacity-50 mb-3 ml-1">Past Orders</h3>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'delivered' || o.status === 'rejected').slice(0,showAllOrders?orders.length:5).map(o => (
                      <OrderCard key={o.id} order={o} openModal={setOrderModal} onReorder={handleReorder} />
                    ))}
                  </div>
                  {orders.filter(o => o.status === 'delivered' || o.status === 'rejected').length > 5 && !showAllOrders && (
                    <div className="text-center mt-4">
                      <button className="btn btn-sm btn-ghost" onClick={()=>setShowAllOrders(true)}>View all history</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Order details modal - rendered at root level */}
      {orderModal && (
        <OrderDetailsModal order={orderModal} onClose={()=>setOrderModal(null)} />
      )}

      {/* Support & Legal Links - Bottom */}
      <div className="pt-8 border-t border-base-200">
        <h3 className="font-semibold text-sm uppercase tracking-wider opacity-50 mb-4">Support & Legal</h3>
        <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm opacity-70">
          <Link to="/cancellation-refunds" className="hover:text-primary hover:underline transition-colors">Cancellation & Refunds</Link>
          <Link to="/shipping" className="hover:text-primary hover:underline transition-colors">Shipping Policy</Link>
          <Link to="/terms" className="hover:text-primary hover:underline transition-colors">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:text-primary hover:underline transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-primary hover:underline transition-colors">Contact Us</Link>
        </div>
      </div>

      {/* Edit personal details modal */}
      {editModalOpen && (
          <dialog open className="modal">
            <div className="modal-box max-w-sm sm:max-w-md rounded-2xl shadow-2xl p-0">
              <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeEditModal} aria-label="Close">✕</button>
              <h3 className="font-bold text-lg text-left pt-6 pb-2 px-6">Edit Personal Details</h3>
              {editAlert && <div className="alert alert-error text-xs px-6 py-2 mb-2 rounded-lg">{editAlert}</div>}
              <form className="px-6 pb-6 pt-2 space-y-6" onSubmit={e=>{e.preventDefault();saveEditModal();}}>
                {/* Display Name (required) */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <MdPerson className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-70"
                    value={editForm.displayName}
                    onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="Full Name (required)"
                    required
                  />
                </div>
                {/* Email (optional, grey label) */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 transition pb-2">
                  <MdMail className="w-4 h-4 opacity-70" />
                  <input
                    type="email"
                    className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-70 text-gray-400"
                    value={editForm.email}
                    disabled
                    placeholder="Email (optional)"
                  />
                </div>
                {/* Phone (required) with +91 prefix */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <MdLocalPhone className="w-4 h-4 opacity-70" />
                  <div className="flex items-center w-full">
                    <span className="inline-block px-2 py-1 bg-base-100 rounded text-xs font-semibold border border-base-200 mr-2 select-none" style={{minWidth:'44px',textAlign:'center'}}>+91</span>
                    <input
                      type="tel"
                      className="input validator tabular-nums w-full rounded-r bg-transparent border-none focus:ring-0 shadow-none text-base"
                      required
                      placeholder="Phone"
                      pattern="[0-9]*"
                      minLength={10}
                      maxLength={10}
                      title="Must be 10 digits"
                      value={editForm.phone}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setEditForm(f => {
                          const next = { ...f, phone: digits }
                          if (usePhoneForWhatsapp) next.whatsapp = digits
                          return next
                        })
                      }}
                    />
                  </div>
                  <p className="validator-hint text-xs ml-2">Must be 10 digits</p>
                </div>
                {/* WhatsApp number with checkbox and +91 prefix */}
                <div className="flex items-center gap-2 px-2 border-b border-base-300 focus-within:border-primary/60 transition pb-2">
                  <FaWhatsapp className="w-6 h-6 text-green-500 opacity-90" />
                  <div className="flex items-center w-full">
                    <span className="inline-block px-2 py-1 bg-base-100 rounded text-xs font-semibold border border-base-200 mr-2 select-none" style={{minWidth:'44px',textAlign:'center'}}>+91</span>
                    <input
                      type="tel"
                      className="input validator tabular-nums w-full rounded-r bg-transparent border-none focus:ring-0 shadow-none text-base"
                      required
                      placeholder="WhatsApp number"
                      pattern="[0-9]*"
                      minLength={10}
                      maxLength={10}
                      title="Must be 10 digits"
                      value={editForm.whatsapp}
                      onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value.replace(/\D/g, '').slice(0,10) }))}
                      disabled={usePhoneForWhatsapp}
                    />
                  </div>
                  <label className="flex items-center gap-2 ml-3 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={usePhoneForWhatsapp}
                      onChange={e => {
                        setUsePhoneForWhatsapp(e.target.checked);
                        if (e.target.checked) {
                          setEditForm(f => ({ ...f, whatsapp: f.phone }));
                        }
                      }}
                      disabled={!editForm.phone || editForm.phone.replace(/\D/g, '').length !== 10}
                    />
                    <span>Same as phone</span>
                  </label>
                  <p className="validator-hint text-xs ml-2">Must be 10 digits</p>
                </div>
                {/* Gender */}
                <div className="flex items-center gap-4 pt-2 pl-1">
                  <span className="text-xl text-gray-500"><MdPerson className="w-4 h-4 opacity-70" /></span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      name="gender"
                      value="male"
                      checked={editForm.gender === 'male'}
                      onChange={() => setEditForm(f => ({ ...f, gender: 'male' }))}
                    />
                    <span className="text-sm">Male</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      name="gender"
                      value="female"
                      checked={editForm.gender === 'female'}
                      onChange={() => setEditForm(f => ({ ...f, gender: 'female' }))}
                    />
                    <span className="text-sm">Female</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      name="gender"
                      value="other"
                      checked={editForm.gender === 'other'}
                      onChange={() => setEditForm(f => ({ ...f, gender: 'other' }))}
                    />
                    <span className="text-sm">Other</span>
                  </label>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="btn btn-primary rounded-full px-8" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={closeEditModal}><button>close</button></form>
          </dialog>
        )}

        {/* Right Content (8 cols) */}
        {/* This section was already rendered in the previous replacement, but we need to remove the old "Right content" block to avoid duplication */}
        {/* The previous replacement replaced everything from "return (" down to "{editModalOpen && (" */}
        {/* So we need to remove the OLD right content block that comes AFTER the modal */}
        
        {/* Wait, I replaced the top part of the return statement. The modal code is still there. */}
        {/* The old code had:
            1. Left summary card
            2. Edit modal
            3. Right content
        */}
        {/* My new code has:
            1. Left Sidebar (Profile Card + Menu)
            2. Right Content (Addresses + Orders)
            3. Edit modal (start)
        */}
        
        {/* So I need to remove the OLD "Right content" block which is currently sitting AFTER the modal code in the file. */}


      {/* Address modal */}
      {addrModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-sm sm:max-w-md rounded-2xl shadow-2xl p-0">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={()=>setAddrModalOpen(false)} aria-label="Close">✕</button>
            <h3 className="font-bold text-lg text-left pt-6 pb-2 px-6">{addrEditing ? 'Edit address' : 'Add address'}</h3>
            <form className="px-6 pb-6 pt-2 space-y-4" onSubmit={e=>{e.preventDefault();saveAddress();}}>
              
              {/* Tags */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center">
                  {['Home', 'Work', 'Other'].map(tag => (
                      <label key={tag} className={`cursor-pointer px-5 py-2 rounded-full border text-xs font-bold transition-all ${addrForm.tag === tag ? 'bg-primary text-primary-content border-primary shadow-md shadow-primary/20' : 'bg-base-100 border-base-300 hover:border-base-400'}`}>
                          <input type="radio" className="hidden" name="addrTag" checked={addrForm.tag === tag} onChange={()=>setAddrForm(f=>({...f, tag}))} />
                          {tag}
                      </label>
                  ))}
              </div>

              {/* Auto-fill via GPS Button */}
              <button 
                  type="button" 
                  className="btn btn-sm btn-block rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 relative overflow-hidden group" 
                  onClick={()=>{ 
                    if (!('geolocation' in navigator)) { pushToast('Geolocation not supported','error'); return } 
                    navigator.geolocation.getCurrentPosition(async pos=>{ 
                      const lat = pos.coords.latitude; 
                      const lng = pos.coords.longitude; 
                      setAddrForm(f=>({...f,lat,lng})); 
                      
                      // Check delivery region
                      if (deliveryLocation.region) {
                         const check = deliveryLocation.checkWithin(lat, lng);
                         if (!check.ok) pushToast(`Location is outside delivery area (${check.distance.toFixed(1)}km)`, 'warning');
                      }

                      const parts = await reverseGeocode(lat, lng); 
                      if (parts) { 
                        setAddrForm(f=>({ 
                            ...f, 
                            // Auto-fill line 2
                            line2: parts.formatted || [parts.line1, parts.line2].filter(Boolean).join(', ') || f.line2, 
                            city: 'Durgapur', 
                            state: parts.state || f.state, 
                            zip: parts.zip || f.zip, 
                            placeId: parts.placeId || f.placeId, 
                            mapUrl: parts.mapUrl || f.mapUrl, 
                        })); 
                        pushToast('Address filled from location','success') 
                      } else { 
                        pushToast('Location captured','success') 
                      } 
                    }, (err) => {
                      if (err.code === 1) pushToast('Location access denied. Please enable permissions in browser settings.', 'error');
                      else pushToast('Location failed. Please try again.', 'error');
                    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) 
                  }}
              >
                  <div className="absolute inset-0 bg-primary/10 animate-pulse group-hover:animate-none"></div>
                  <span className="relative flex items-center gap-2 z-10">
                      <MdGpsFixed className="animate-bounce" /> Press to Auto-fill via GPS
                  </span>
              </button>

              {/* Landmark */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdPlace className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Nearby Landmark (Optional)" value={addrForm.landmark} onChange={(e)=>setAddrForm(f=>({...f,landmark:e.target.value}))} />
                  </div>
              </div>

              {/* Address Line 1 */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdApartment className="w-5 h-5 opacity-50" />
                      <input ref={addrLine1Ref} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="House / Flat No., Building" value={addrForm.line1} onChange={(e)=>setAddrForm(f=>({...f,line1:e.target.value}))} required />
                  </div>
              </div>

              {/* Address Line 2 (Auto) */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdMap className="w-5 h-5 opacity-50" />
                      <input ref={addrLine2Ref} className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Area / Locality (Auto-filled)" value={addrForm.line2} onChange={(e)=>setAddrForm(f=>({...f,line2:e.target.value}))} />
                  </div>
                  <label className="label py-1"><span className="label-text-alt opacity-60">Select from suggestions for best accuracy</span></label>
              </div>

              {/* PIN & City */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdPinDrop className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="PIN Code" value={addrForm.zip} onChange={(e)=>setAddrForm(f=>({...f,zip:e.target.value}))} />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent opacity-70 cursor-not-allowed">
                      <MdLocationCity className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0" value="Durgapur" readOnly />
                  </div>
              </div>

              {/* Phone */}
              <div className="form-control w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-base-200/50 border border-transparent focus-within:border-primary/50 focus-within:bg-base-100 transition-all">
                      <MdLocalPhone className="w-5 h-5 opacity-50" />
                      <input className="input input-ghost w-full border-none shadow-none focus:outline-none px-0 placeholder:opacity-50" placeholder="Phone Number" value={addrForm.phone} onChange={(e)=>setAddrForm(f=>({...f,phone:e.target.value}))} />
                  </div>
              </div>

              {/* Confirm Location Only */}
              <button type="button" className="btn btn-sm btn-block rounded-xl btn-ghost bg-base-200/50" onClick={()=>{ 
                  if (!('geolocation' in navigator)) { pushToast('Geolocation not supported','error'); return } 
                  navigator.geolocation.getCurrentPosition(pos=>{ 
                    const lat = pos.coords.latitude; 
                    const lng = pos.coords.longitude; 
                    setAddrForm(f=>({...f,lat,lng})); 
                    pushToast('Location coordinates captured','success') 
                  }, (err) => {
                    if (err.code === 1) pushToast('Location access denied. Please enable permissions in browser settings.', 'error');
                    else pushToast('Location failed. Please try again.', 'error');
                  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) 
                }}><span className="inline-flex items-center gap-1"><MdGpsFixed className="w-3.5 h-3.5"/> Press to share location for faster delivery</span></button>
                <input type="hidden" value={addrForm.lat ?? ''} readOnly />
                <input type="hidden" value={addrForm.lng ?? ''} readOnly />

              {/* Set as default */}
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" className="checkbox checkbox-sm" checked={setAsDefault} onChange={(e)=> setSetAsDefault(e.target.checked)} />
                <span className="text-sm">Set as default</span>
              </div>
              <div className="flex justify-end pt-2 gap-2">
                <button type="submit" className="btn btn-primary rounded-full px-8" disabled={addrSaving}>{addrSaving ? 'Saving...' : 'Save'}</button>
                <button type="button" className="btn btn-ghost rounded-full px-8" onClick={()=>setAddrModalOpen(false)} disabled={addrSaving}>Cancel</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={()=>!addrSaving && setAddrModalOpen(false)}><button>close</button></form>
        </dialog>
      )}
    </div>
  )
}

// ── Order status utilities ──

const ORDER_STATUS_FLOW = ['placed', 'preparing', 'ready', 'delivered'];

const STATUS_BADGE_LOOKUP = {
  placed: 'badge-warning',
  preparing: 'badge-info',
  ready: 'badge-primary',
  delivered: 'badge-success',
  rejected: 'badge-error',
};

const INR_FORMATTER = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

function statusLabel(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusBadgeClass(status) {
  const badge = STATUS_BADGE_LOOKUP[status] || 'badge-ghost'
  return `badge badge-sm ${badge} capitalize`
}

function orderProgressPercent(status) {
  const idx = ORDER_STATUS_FLOW.indexOf(status)
  if (idx === -1) return 0
  if (ORDER_STATUS_FLOW.length === 1) return 100
  return Math.max(0, Math.min(100, Math.round((idx / (ORDER_STATUS_FLOW.length - 1)) * 100)))
}

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  if (typeof value.milliseconds === 'number') return new Date(value.milliseconds)
  if (typeof value === 'number') return new Date(value)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateTime(value) {
  const dt = toDate(value)
  if (!dt) return 'Unknown time'
  return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function safeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function formatCurrency(value) {
  const num = safeNumber(value)
  if (num === null) return '₹0.00'
  return INR_FORMATTER.format(num)
}

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : []
}

function calculateItemsSubtotal(items) {
  return items.reduce((sum, it) => sum + (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0), 0)
}

function getOrderSubtotal(order, items) {
  const explicit = safeNumber(order?.subtotal)
  if (explicit !== null) return explicit
  return calculateItemsSubtotal(items)
}

function getOrderTotal(order, items) {
  const explicit = safeNumber(order?.totalAmount ?? order?.grandTotal ?? order?.total)
  if (explicit !== null) return explicit
  const subtotal = getOrderSubtotal(order, items)
  const tax = safeNumber(order?.taxAmount) || 0
  const delivery = safeNumber(order?.deliveryFee ?? order?.shippingFee) || 0
  const discount = safeNumber(order?.discount) || 0
  return subtotal + tax + delivery - discount
}

function getOrderIdentifier(order) {
  if (!order) return '#—'
  if (order.orderNo) return order.orderNo
  if (order.id) return `#${String(order.id).slice(-6)}`
  return '#—'
}

function getOrderAddressParts(order) {
  const addr = order?.customer?.address || {}
  const primary = addr.line || [addr.line1, addr.line2].filter(Boolean).join(', ')
  const secondaryParts = [addr.city || addr.district, addr.state, addr.pin || addr.zip].filter(Boolean)
  const secondary = secondaryParts.join(', ')
  return { primary, secondary }
}

// ── OrderCard component ──

function OrderCard({ order, openModal, onReorder }) {
  if (!order) return null
  const status = order.status || 'placed'
  const items = getOrderItems(order)
  const progress = orderProgressPercent(status)
  const isRejected = status === 'rejected'
  const isDelivered = status === 'delivered'
  const total = getOrderTotal(order, items)
  const placedAt = formatDateTime(order.createdAt)
  const { primary: addressLine, secondary: addressSecondary } = getOrderAddressParts(order)
  const identifier = getOrderIdentifier(order)
  const legacyId = order.orderNo && order.id && order.orderNo !== order.id ? `#${String(order.id).slice(-6)}` : null
  return (
    <div className={`card bg-base-100/70 backdrop-blur-sm border border-base-300/60 shadow-sm ${isRejected ? 'opacity-70' : ''}`}>
      <div className="card-body p-4 gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
              <span>{identifier}</span>
              {legacyId && <span className="badge badge-ghost badge-xs">{legacyId}</span>}
              <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
            </div>
            <div className="text-xs opacity-70 flex flex-wrap gap-2 mt-1">
              <span>{placedAt}</span>
              <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
              <span>Total {formatCurrency(total)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-right">
            {order.orderType && <span className="badge badge-ghost badge-xs capitalize">{order.orderType}</span>}
            {order.payment?.method && <span className="uppercase tracking-wide opacity-70">{order.payment.method}</span>}
            {order.payment?.status && <span className="opacity-40 capitalize">{order.payment.status}</span>}
          </div>
        </div>
        {!isRejected && (
          <div className="mt-2">
            <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[9px] uppercase tracking-wide opacity-60 mt-1">
              {ORDER_STATUS_FLOW.map((step) => (
                <span key={step} className={status === step ? 'text-primary font-semibold' : ''}>{step}</span>
              ))}
            </div>
          </div>
        )}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {items.slice(0, 4).map((it) => (
              <span key={`${order.id || 'order'}-${it.id || it.name}`} className="px-2 py-1 text-xs rounded-full bg-base-200/70 border border-base-300/60">
                {it.name} × {it.qty}
              </span>
            ))}
            {items.length > 4 && <span className="text-xs opacity-70">+{items.length - 4} more</span>}
          </div>
        )}
        {(addressLine || addressSecondary) && (
          <div className="text-xs opacity-70 mt-2 space-y-1">
            {addressLine && <div className="flex items-center gap-1"><MdPlace className="w-3.5 h-3.5 opacity-60" /><span>{addressLine}</span></div>}
            {addressSecondary && <div className="pl-5">{addressSecondary}</div>}
          </div>
        )}
        {order.customer?.note && <div className="text-xs opacity-60 mt-2">Note: {order.customer.note}</div>}
        <div className="flex justify-end gap-2 mt-3">
          {(isDelivered || isRejected) && items.length > 0 && (
            <button className="btn btn-xs btn-ghost gap-1" onClick={() => onReorder && onReorder(items)}>
              <MdReplay className="w-3.5 h-3.5" /> Reorder
            </button>
          )}
          <button className="btn btn-xs btn-outline" onClick={() => openModal(order)}>View details</button>
        </div>
      </div>
    </div>
  )
}

// ── OrderDetailsModal component ──

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null
  const status = order.status || 'placed'
  const statusIndex = ORDER_STATUS_FLOW.indexOf(status)
  const items = getOrderItems(order)
  const subtotal = getOrderSubtotal(order, items)
  const taxAmount = safeNumber(order?.taxAmount)
  const deliveryFee = safeNumber(order?.deliveryFee ?? order?.shippingFee)
  const discount = safeNumber(order?.discount)
  const total = getOrderTotal(order, items)
  const placedAt = formatDateTime(order.createdAt)
  const updatedAt = order.updatedAt ? formatDateTime(order.updatedAt) : null
  const { primary: addressLine, secondary: addressSecondary } = getOrderAddressParts(order)
  const identifier = getOrderIdentifier(order)
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleBackdropClick}>
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Order {identifier}</h3>
              <p className="text-xs opacity-70">Placed {placedAt}</p>
              {updatedAt && updatedAt !== placedAt && <p className="text-xs opacity-60">Updated {updatedAt}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
              {order.orderType && <span className="badge badge-ghost badge-xs capitalize">{order.orderType}</span>}
            </div>
          </div>
          {status !== 'rejected' && (
            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${orderProgressPercent(status)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-wide opacity-60">
                {ORDER_STATUS_FLOW.map((step, idx) => (
                  <span key={step} className={idx <= statusIndex && statusIndex !== -1 ? 'text-primary font-semibold' : ''}>{step}</span>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl border border-base-300/60 bg-base-100/80">
            {items.length > 0 ? (
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs uppercase opacity-60">
                    <th className="bg-transparent">Item</th>
                    <th className="bg-transparent text-right">Qty</th>
                    <th className="bg-transparent text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const lineTotal = (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0)
                    return (
                      <tr key={`${order.id || 'order'}-${it.id || it.name}`} className="text-sm">
                        <td>{it.name}</td>
                        <td className="text-right">{it.qty}</td>
                        <td className="text-right">{formatCurrency(lineTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-sm opacity-70">No items recorded for this order.</div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-base">Customer</div>
              <div>{order.customer?.name || '—'}</div>
              {order.customer?.phone && <div>{order.customer.phone}</div>}
              {order.customer?.email && <div>{order.customer.email}</div>}
              {(addressLine || addressSecondary) && <div className="divider my-2" />}
              {addressLine && <div>{addressLine}</div>}
              {addressSecondary && <div>{addressSecondary}</div>}
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-base">Payment</div>
              <div>Method: {order.payment?.method ? order.payment.method.toUpperCase() : '—'}</div>
              {order.payment?.status && <div className="text-xs opacity-70">Status: {order.payment.status}</div>}
              <div className="divider my-2" />
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {taxAmount !== null && <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>}
              {deliveryFee !== null && <div className="flex justify-between"><span>Delivery</span><span>{formatCurrency(deliveryFee)}</span></div>}
              {discount !== null && discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>
          {order.customer?.note && (
            <div className="rounded-lg border border-base-300/60 bg-base-200/70 p-3 text-sm">
              <div className="font-semibold text-xs uppercase opacity-60 mb-1">Customer note</div>
              <div>{order.customer.note}</div>
            </div>
          )}
          {order.id && (
            <div className="text-[11px] opacity-50">Internal ID: {order.id}</div>
          )}
        </div>
        <div className="modal-action p-4 pt-0">
          <button className="btn btn-error" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  )
}


```

### Customer ActiveOrders.jsx (venkys/src/pages/ActiveOrders.jsx)
`$lang
// ActiveOrders — Live order tracking dashboard
import { useEffect, useMemo, useState } from 'react'

import { doc, onSnapshot } from 'firebase/firestore'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MdArrowBack, MdLocalShipping, MdPlace, MdReceiptLong, MdRefresh } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchOrder, fetchUserOrders } from '../lib/data'
import { db } from '../lib/firebase'

// ── Constants & helpers ──

const ORDER_STATUS_FLOW = ['placed', 'preparing', 'ready', 'delivered']

function normalizeStatus(status) {
  return String(status || 'placed').toLowerCase()
}

function isCompletedStatus(status) {
  const s = normalizeStatus(status)
  return s === 'delivered' || s === 'rejected' || s === 'cancelled'
}

function isActiveStatus(status) {
  return !isCompletedStatus(status)
}

function statusBadgeClass(status) {
  switch (normalizeStatus(status)) {
    case 'placed':
      return 'badge badge-warning'
    case 'preparing':
      return 'badge badge-info'
    case 'ready':
      return 'badge badge-primary'
    case 'delivered':
      return 'badge badge-success'
    case 'rejected':
      return 'badge badge-error'
    default:
      return 'badge badge-ghost'
  }
}

function statusLabel(status) {
  const s = normalizeStatus(status)
  return s.replace(/_/g, ' ')
}

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  if (typeof value.milliseconds === 'number') return new Date(value.milliseconds)
  if (typeof value === 'number') return new Date(value)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateTime(value) {
  const dt = toDate(value)
  if (!dt) return ''
  return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function safeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatCurrency(value) {
  const num = safeNumber(value)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num)
}

function orderIdentifier(order) {
  if (!order) return '#—'
  if (order.orderNo) return String(order.orderNo)
  if (order.id) return `#${String(order.id).slice(-6)}`
  return '#—'
}

function orderProgressPercent(status) {
  const s = normalizeStatus(status)
  const idx = ORDER_STATUS_FLOW.indexOf(s)
  if (idx === -1) return 0
  if (ORDER_STATUS_FLOW.length === 1) return 100
  return Math.max(0, Math.min(100, Math.round((idx / (ORDER_STATUS_FLOW.length - 1)) * 100)))
}

export default function ActiveOrders() {
  const { user } = useAuth()
  const { pushToast, openAuth } = useUI()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // ── State ──
  const selectedIdFromUrl = params.get('id') || ''
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeOrders, setActiveOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)

  const resolvedSelectedId = selectedOrder?.id || selectedIdFromUrl || ''

  const activeOrdersSorted = useMemo(() => {
    const list = Array.isArray(activeOrders) ? [...activeOrders] : []
    list.sort((a, b) => {
      const ta = toDate(a?.createdAt)?.getTime() ?? 0
      const tb = toDate(b?.createdAt)?.getTime() ?? 0
      return tb - ta
    })
    return list
  }, [activeOrders])

  const itemCountFor = (order) => {
    const items = Array.isArray(order?.items) ? order.items : []
    return items.reduce((sum, it) => sum + (Number(it?.qty) || 0), 0)
  }

  const totalFor = (order) => {
    const explicit = order?.totalAmount ?? order?.total ?? order?.grandTotal
    if (explicit != null && Number.isFinite(Number(explicit))) return Number(explicit)
    const items = Array.isArray(order?.items) ? order.items : []
    return items.reduce((sum, it) => sum + (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0), 0)
  }

  const refreshActiveOrders = async () => {
    if (!user?.uid) {
      setActiveOrders([])
      setLoading(false)
      return
    }
    setRefreshing(true)
    try {
      const list = await fetchUserOrders(user.uid)
      const filtered = (list || []).filter((o) => isActiveStatus(o?.status))
      setActiveOrders(filtered)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  // ── Side-effects ──
  useEffect(() => {
    refreshActiveOrders().catch(() => {
      setLoading(false)
    })
    // small polling to keep list fresh without heavy listeners
    const id = setInterval(() => refreshActiveOrders().catch(() => {}), 20000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  // Resolve initial selection
  useEffect(() => {
    if (loading) return

    if (!user?.uid) return

    if (selectedIdFromUrl) {
      const match = activeOrdersSorted.find((o) => String(o.id) === String(selectedIdFromUrl) || String(o.orderNo) === String(selectedIdFromUrl))
      if (match) {
        setSelectedOrder(match)
        return
      }
      // If user deep-linked to an order id but it's not active anymore, exit the page.
      ;(async () => {
        try {
          const fetched = await fetchOrder(user.uid, selectedIdFromUrl)
          if (fetched && isActiveStatus(fetched.status)) {
            setSelectedOrder(fetched)
            setActiveOrders((prev) => {
              const list = Array.isArray(prev) ? [...prev] : []
              const idx = list.findIndex((o) => String(o.id) === String(fetched.id))
              if (idx === -1) list.unshift(fetched)
              return list
            })
            return
          }
          if (fetched && isCompletedStatus(fetched.status)) {
            pushToast('That order is completed and is no longer active.', 'info', 3500)
            navigate('/profile#orders', { replace: true })
          }
        } catch {
          // ignore
        }
      })()
      return
    }

    if (activeOrdersSorted.length === 1) {
      const only = activeOrdersSorted[0]
      setSelectedOrder(only)
      setParams({ id: only.id })
      return
    }

    if (activeOrdersSorted.length === 0) {
      pushToast('No active orders right now.', 'info', 2500)
      const t = setTimeout(() => navigate('/', { replace: true }), 900)
      return () => clearTimeout(t)
    }

    setSelectedOrder(null)
  }, [activeOrdersSorted, loading, navigate, params, pushToast, selectedIdFromUrl, setParams, user?.uid])

  // Real-time updates for the selected order (auto-exit on completion)
  useEffect(() => {
    if (!resolvedSelectedId) return
    if (!user?.uid) return
	// Orders are stored at top-level `orders/{orderId}`.
	const ref = doc(db, 'orders', resolvedSelectedId)

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return
      const data = snap.data() || {}
      const next = { id: snap.id, ...data }
      if (isCompletedStatus(next.status)) {
        pushToast('Order completed. Thanks for ordering!', 'success', 3500)
        navigate('/', { replace: true })
        return
      }
      setSelectedOrder(next)
      setActiveOrders((prev) => {
        const list = Array.isArray(prev) ? [...prev] : []
        const idx = list.findIndex((o) => String(o.id) === String(next.id))
		if (idx === -1) {
			// If this order isn't in the list yet, add it.
			if (isActiveStatus(next.status)) list.unshift(next)
			return list
		}
		list[idx] = { ...list[idx], ...next }
        return list
      })
    }, () => {})

    return () => unsub()
  }, [navigate, pushToast, resolvedSelectedId, user?.uid])

  const handleSelect = (order) => {
    if (!order) return
    setSelectedOrder(order)
    setParams({ id: order.id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Render ──
  return (
    <div className="page-wrap py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-sm btn-ghost gap-2" onClick={() => navigate(-1)}>
            <MdArrowBack className="w-5 h-5" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <MdLocalShipping className="text-primary" /> Active Orders
            </h1>
            <p className="text-xs opacity-60">Only ongoing orders show up here.</p>
          </div>
        </div>
        <button type="button" className="btn btn-sm btn-ghost btn-circle" title="Refresh" onClick={refreshActiveOrders} disabled={refreshing}>
          <MdRefresh className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!user ? (
        <div className="rounded-3xl border border-base-300/60 bg-base-100/80 p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Sign in to view order status</h2>
            <p className="text-sm opacity-70">Log in to see your active orders and live updates.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn btn-primary" onClick={() => openAuth('login')}>Login</button>
            <Link to="/" className="btn btn-ghost">Go home</Link>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <div className="space-y-3">
            <div className="rounded-3xl border border-base-300/60 bg-base-100/70 backdrop-blur p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] opacity-60">Active now</div>
                  <div className="text-xl font-semibold mt-1">{activeOrdersSorted.length}</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-success/10 border border-success/30 px-3 py-2">
                  <MdReceiptLong className="w-5 h-5 text-success" />
                  <span className="text-sm font-semibold text-success">Live tracking</span>
                </div>
              </div>
            </div>

            {activeOrdersSorted.length === 0 ? (
              <div className="text-center py-10 bg-base-100 rounded-3xl border border-base-200 border-dashed">
                <p className="opacity-70">No active orders right now.</p>
                <Link to="/" className="btn btn-link btn-sm mt-2">Browse Menu</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrdersSorted.map((o) => {
                  const selected = resolvedSelectedId && String(o.id) === String(resolvedSelectedId)
                  const status = o.status || 'placed'
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => handleSelect(o)}
                      className={`w-full text-left rounded-3xl border p-4 shadow-sm transition ${selected ? 'border-primary bg-primary/5' : 'border-base-300/60 bg-base-100/70 hover:shadow-md'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{orderIdentifier(o)}</div>
                            <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
                          </div>
                          <div className="text-xs opacity-70 mt-1 flex flex-wrap gap-2">
                            <span>{formatDateTime(o.createdAt) || '—'}</span>
                            <span>{itemCountFor(o)} item{itemCountFor(o) === 1 ? '' : 's'}</span>
                            <span>Total {formatCurrency(totalFor(o))}</span>
                          </div>
                        </div>
                        <div className="text-right text-xs opacity-60">Tap to view</div>
                      </div>
                      <div className="mt-3">
                        <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${orderProgressPercent(status)}%` }} />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-base-300/60 bg-base-100/80 backdrop-blur p-5 shadow-sm">
            {selectedOrder ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-success/10 border border-success/30 px-3 py-2">
                      <span className="text-xs uppercase tracking-[0.22em] font-bold text-success">Order</span>
                      <span className="font-mono font-bold text-success">{orderIdentifier(selectedOrder)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={statusBadgeClass(selectedOrder.status)}>{statusLabel(selectedOrder.status)}</span>
                      <span className="text-xs opacity-60">Placed {formatDateTime(selectedOrder.createdAt) || '—'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setSelectedOrder(null)
                      const next = new URLSearchParams(params)
                      next.delete('id')
                      setParams(next)
                    }}
                  >
                    Back to list
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-base-300/50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${orderProgressPercent(selectedOrder.status)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] opacity-60">
                    {ORDER_STATUS_FLOW.map((step) => (
                      <span key={step} className={normalizeStatus(selectedOrder.status) === step ? 'text-primary font-semibold' : ''}>{step}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-base-300/60 overflow-hidden">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length ? (
                    <table className="table table-sm">
                      <thead>
                        <tr className="text-xs uppercase opacity-60">
                          <th className="bg-transparent">Item</th>
                          <th className="bg-transparent text-right">Qty</th>
                          <th className="bg-transparent text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((it) => {
                          const lineTotal = (Number(it?.rate ?? it?.price) || 0) * (Number(it?.qty) || 0)
                          return (
                            <tr key={`${selectedOrder.id}-${it.id || it.name}`} className="text-sm">
                              <td>{it.name}</td>
                              <td className="text-right">{it.qty}</td>
                              <td className="text-right">{formatCurrency(lineTotal)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-sm opacity-70">No items recorded for this order.</div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-base-300/60 bg-base-100 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] opacity-60 font-bold">Delivery</div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="font-semibold">{selectedOrder.customer?.name || '—'}</div>
                      {selectedOrder.customer?.phone ? <div className="opacity-80">{selectedOrder.customer.phone}</div> : null}
                      {(selectedOrder.customer?.address?.line || selectedOrder.customer?.address?.line1) ? (
                        <div className="mt-2 text-sm opacity-80">
                          <div className="flex items-start gap-2">
                            <MdPlace className="w-4 h-4 mt-0.5 opacity-60" />
                            <div>
                              <div>{selectedOrder.customer?.address?.line || [selectedOrder.customer?.address?.line1, selectedOrder.customer?.address?.line2].filter(Boolean).join(', ')}</div>
                              <div className="text-xs opacity-60">{[selectedOrder.customer?.address?.city, selectedOrder.customer?.address?.pin].filter(Boolean).join(' • ')}</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-base-300/60 bg-base-100 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] opacity-60 font-bold">Payment</div>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span>Method</span><span className="uppercase tracking-wide">{selectedOrder.payment?.method ? String(selectedOrder.payment.method) : '—'}</span></div>
                      <div className="flex items-center justify-between"><span>Status</span><span className="capitalize opacity-80">{selectedOrder.payment?.status ? String(selectedOrder.payment.status) : '—'}</span></div>
                      <div className="divider my-2" />
                      <div className="flex items-center justify-between font-semibold"><span>Total</span><span>{formatCurrency(totalFor(selectedOrder))}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-14">
                <h2 className="text-lg font-semibold">Select an order to track</h2>
                <p className="text-sm opacity-70 mt-1">Tap an order from the left panel to see full details and live status.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

```

### Customer cart persistence (venkys/src/lib/data-cart.js)
`$lang
// Cart persistence functions
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { isPermissionDenied, sanitizeFirestoreData } from './data-common'

export async function loadCart(uid) {
  if (!uid) return {}
  try {
    const ref = doc(db, 'users', uid, 'meta', 'cart')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data()
      return data.items || {}
    }
    // Fallback: try compact snapshot on users/{uid}
    const userSnap = await getDoc(doc(db, 'users', uid))
    if (userSnap.exists()) {
      const live = userSnap.data().cartLive
      if (live && live.items && typeof live.items === 'object') {
        const restored = {}
        Object.entries(live.items).forEach(([id, v]) => {
          restored[id] = { item: { id, name: v.name, rate: Number(v.rate ?? v.price) || 0 }, qty: Number(v.qty) || 0 }
        })
        return restored
      }
    }
    return {}
  } catch (e) {
    if (isPermissionDenied(e)) {
      return { __error: 'permission-denied' }
    }
    console.warn('loadCart failed', e)
    return { __error: 'other' }
  }
}

export async function saveCart(uid, cartItems) {
  if (!uid) return
  try {
    const ref = doc(db, 'users', uid, 'meta', 'cart')
    const minimalItems = {}
    Object.entries(cartItems || {}).forEach(([id, entry]) => {
      if (entry && entry.item && entry.qty > 0) {
        minimalItems[id] = {
          item: {
            id: entry.item.id,
            name: entry.item.name,
            rate:
              typeof entry.item.rate === 'number'
                ? entry.item.rate
                : Number(entry.item.rate ?? entry.item.price) || 0,
          },
          qty: entry.qty,
        }
      }
    })
    const sanitizedItems = sanitizeFirestoreData(minimalItems) || {}
    await setDoc(ref, { items: sanitizedItems, updatedAt: serverTimestamp() }, { merge: true })
  } catch (e) {
    if (isPermissionDenied(e)) {
      return { __error: 'permission-denied' }
    }
    console.warn('saveCart failed', e)
    return { __error: 'other' }
  }
}

```

### Customer order data layer (venkys/src/lib/data-orders.js)
`$lang
// Order-related data functions
import { collection, doc, getDocs, getDoc, query, where, setDoc, serverTimestamp, orderBy, runTransaction, increment, limit as fsLimit, startAfter, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from './firebase'
import { isCounterDocId, DAILY_COUNTER_DOC, formatUserSegment, isPermissionDenied, apiUrl, getAuthHeaders } from './data-common'
import { fetchAppSettings } from './data-settings'

// ── Order number generation ──

// Generate a daily-reset order number like YYYYMMDD-SEQ-USERSEGMENT
export async function generateDailyOrderNo(orderType = 'dine-in', userId = null) {
  const type = String(orderType || 'dine-in').toLowerCase()
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateKey = `${y}${m}${d}`
  const counterRef = doc(db, 'miscellaneous', DAILY_COUNTER_DOC)
  let next = null
  try {
    next = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef)
      const data = snap.exists() ? snap.data() : {}
      const currentDateKey = data.currentDate || ''
      const currentTotal = currentDateKey === dateKey ? (Number(data.total) || 0) : 0
      const newTotal = currentTotal + 1
      tx.set(counterRef, {
        currentDate: dateKey,
        total: newTotal,
        lastOrderType: type,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      return newTotal
    })
  } catch (err) {
    if (!isPermissionDenied(err)) throw err
    next = null
  }
  const seq = next != null
    ? String(next).padStart(4, '0')
    : String((Date.now() % 10000)).padStart(4, '0')
  const segment = formatUserSegment(userId)
  return `${dateKey}-${seq}-${segment}`
}

export async function createOrder({ userId = null, customer = {}, items, orderType = 'delivery', source = 'web', orderNo = null, taxRate = null, taxAmount = null, totalAmount = null }) {
  if (String(source || '').toLowerCase() === 'web' && !userId) {
    throw new Error('Please sign in before placing an order.')
  }
  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    throw new Error('Order must include at least one item')
  }

  const normalizedItems = safeItems.map((item, idx) => {
    const rate = Number(item?.rate ?? item?.price) || 0
    const qty = Number(item?.qty) || 0
    const total = Math.round(rate * qty)
    const normalized = {
      id: item?.id || `item-${idx + 1}`,
      name: String(item?.name || `Item ${idx + 1}`).trim(),
      rate,
      qty,
      total,
    }
    if (item?.mrp != null) normalized.mrp = Number(item.mrp) || null
    if (item?.discountPercent != null) normalized.discountPercent = Number(item.discountPercent) || null
    if (item?.variantLabel) normalized.variantLabel = String(item.variantLabel)
    if (item?.note) normalized.note = String(item.note)
    if (item?.modifiers) normalized.modifiers = item.modifiers
    return normalized
  })
  const subtotal = Math.round(normalizedItems.reduce((sum, it) => sum + (Number(it.total) || ((it.rate || 0) * it.qty)), 0))
  const normalizedTaxRate = typeof taxRate === 'number' ? taxRate : (taxRate != null ? Number(taxRate) : null)
  const normalizedTaxAmount = taxAmount != null ? Math.round(Number(taxAmount)) : (normalizedTaxRate != null ? Math.round(subtotal * normalizedTaxRate) : null)
  const resolvedTotalAmount = totalAmount != null ? Math.round(Number(totalAmount)) : Math.round(subtotal + (normalizedTaxAmount || 0))
  const resolvedOrderNo = orderNo || await generateDailyOrderNo(orderType, userId || customer?.servedBy || customer?.phone || null)

  const payment = (() => {
    const raw = customer?.payment && typeof customer.payment === 'object' ? customer.payment : {}
    return {
      method: raw.method || 'cod',
      status: raw.status || 'pending',
      reference: raw.reference || null,
      collectedBy: raw.collectedBy || null,
      collectedAt: raw.collectedAt || null,
      metadata: raw.metadata || null,
    }
  })()

  const customerPayload = {
    name: customer?.name ? String(customer.name).trim() : '',
    phone: customer?.phone ? String(customer.phone).trim() : '',
    address: customer?.address || '',
    instructions: customer?.instructions || '',
    landmark: customer?.landmark || '',
    servedBy: customer?.servedBy || '',
    table: customer?.table || '',
    payment,
  }
  if (customer?.email) customerPayload.email = String(customer.email).trim()
  if (customer?.geoHash) customerPayload.geoHash = customer.geoHash
  if (customer?.location) customerPayload.location = customer.location

  const statusActor = source === 'pos' ? 'pos' : (userId ? `user:${userId}` : 'guest')
  const nowTs = Timestamp.now()

  const base = {
    userId: userId || null,
    customer: customerPayload,
    items: normalizedItems,
    subtotal,
    orderType,
    source,
    orderNo: resolvedOrderNo,
    status: 'placed',
    statusHistory: [{ status: 'placed', at: nowTs, actor: statusActor }],
    payment,
    totalAmount: resolvedTotalAmount,
    revisionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (normalizedTaxRate != null) base.taxRate = normalizedTaxRate
  if (normalizedTaxAmount != null) base.taxAmount = normalizedTaxAmount

  const topRef = doc(db, 'orders', resolvedOrderNo)
  let topLevelPersisted = false
  try {
    await setDoc(topRef, base)
    topLevelPersisted = true
    if (String(base?.source || '').toLowerCase() !== 'pos') {
      try { void notifyOrderMessengers(base) } catch { /* noop */ }
    }
  } catch (err) {
    if (err?.code !== 'permission-denied') {
      throw err
    }
    if (import.meta.env?.DEV) {
      console.warn('[orders] Skipping top-level order write due to permission-denied rule.')
    }
  }

  if (topLevelPersisted) return resolvedOrderNo
  throw new Error('You need to sign in before placing an order.')
}

// ── Notifications ──

// Send order notification to all order messenger phone numbers
async function notifyOrderMessengers(orderPayload) {
  try {
    const settings = await fetchAppSettings()
    const phones = Array.isArray(settings?.orderMessengerPhones) ? settings.orderMessengerPhones : []
    const validPhones = phones
      .map((p) => String(p || '').replace(/\D/g, ''))
      .filter((digits) => digits.length === 10)

    if (!validPhones.length) {
      return { __skipped: 'no_order_messenger_phones' }
    }

    const customerName = String(orderPayload?.customer?.name || 'Customer').trim() || 'Customer'
    const totalAmount = Number(orderPayload?.totalAmount ?? orderPayload?.subtotal ?? 0)
    const rawAddr = orderPayload?.customer?.address || ''
    let address = '-'
    if (typeof rawAddr === 'string' && rawAddr.trim()) {
      address = rawAddr.trim()
    } else if (typeof rawAddr === 'object') {
      const parts = [rawAddr.line1, rawAddr.line2, rawAddr.landmark, rawAddr.city, rawAddr.state, rawAddr.pin]
        .map(v => (v == null ? '' : String(v).trim()))
        .filter(Boolean)
      address = parts.length ? parts.join(', ') : '-'
    }
    const orderId = String(orderPayload?.orderNo || orderPayload?.id || '').trim()

    const sendPromises = validPhones.map(async (phone) => {
      try {
        const url = apiUrl('/api/send-order-messenger')
        const authHeaders = await getAuthHeaders()
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ phone, customerName, totalAmount, address, orderId: orderId || undefined }),
        })
        let body = null
        try { body = await res.json() } catch { /* ignore */ }
        const msgId = body?.msgId || body?.data?.messages?.[0]?.id || ''
        if (res.ok && msgId) {
          return { phone, success: true, msgId, result: body }
        }
        return { phone, success: false, error: body }
      } catch (e) {
        console.error('[notifyOrderMessengers] Error sending to', phone, e)
        return { phone, success: false, error: String(e) }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    return { results, successful, failed }
  } catch (e) {
    console.error('[notifyOrderMessengers] Error:', e)
    return { __error: 'notify_failed', message: String(e) }
  }
}

// ── WhatsApp messaging ──

// Optional WhatsApp sender
export async function sendWhatsAppInvoice(phone, payload) {
  try {
    const digits = String(phone || '').replace(/\D/g, '')
    const normalizedPhone = digits.length === 10 ? `91${digits}` : digits
    if (!normalizedPhone) return { __skipped: 'missing_phone' }

    const url = apiUrl('/api/send-whatsapp')
    const authHeaders = await getAuthHeaders()
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ phone: normalizedPhone, payload })
    })
    let body = null
    try { body = await res.json() } catch {}
    if (!res.ok) {
      const errObj = { __error: 'http_error', status: res.status, ...(body || {}) }
      try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
      return errObj
    }
    return body || {}
  } catch (e) {
    const errObj = { __error: 'network', message: String(e) }
    try { console.warn('[wa] send failed', errObj) } catch {}
    return errObj
  }
}

// ── Order mutations ──

// Update order status/payment
export async function updateOrder(userId, orderId, data = {}, actor = null) {
  if (!orderId) throw new Error('Missing orderId')
  const patch = (data && typeof data === 'object') ? { ...data } : {}

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId)
    let orderSnap = await tx.get(orderRef)
    let resolvedUserId = userId || null
    let legacyNestedRef = null

    if (!orderSnap.exists() && resolvedUserId) {
      const nestedRef = doc(db, 'users', resolvedUserId, 'orders', orderId)
      const nestedSnap = await tx.get(nestedRef)
      if (nestedSnap.exists()) {
        orderSnap = nestedSnap
        legacyNestedRef = nestedRef
      }
    }

    if (!orderSnap.exists()) {
      throw new Error('Order not found')
    }

    const prev = orderSnap.data() || {}
    resolvedUserId = resolvedUserId || prev.userId || null
    const actorId = actor || (resolvedUserId ? `user:${resolvedUserId}` : 'system')

    const updatePayload = { ...patch, updatedAt: serverTimestamp(), revisionCount: increment(1) }
    if (Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status !== prev.status) {
      updatePayload.statusHistory = arrayUnion({
        status: patch.status,
        note: patch.statusNote || null,
        actor: actorId,
        at: Timestamp.now(),
      })
    }
    delete updatePayload.statusNote

    if (legacyNestedRef) {
      tx.set(orderRef, { ...prev, ...updatePayload, userId: resolvedUserId || null }, { merge: true })
      try { tx.delete(legacyNestedRef) } catch { /* noop */ }
    } else {
      tx.set(orderRef, updatePayload, { merge: true })
    }
  })
}

// ── Order queries ──

// Fetch single order
export async function fetchOrder(userId, orderId) {
  const ref = doc(db, 'orders', orderId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Fetch all top-level orders with optional pagination
export async function fetchAllOrders({ maxResults = 500, startDate = null, afterDoc = null } = {}) {
  try {
    const constraints = []
    if (startDate) {
      const ts = startDate instanceof Date ? Timestamp.fromDate(startDate) : startDate
      constraints.push(where('createdAt', '>=', ts))
    }
    constraints.push(orderBy('createdAt', 'desc'))
    if (afterDoc) constraints.push(startAfter(afterDoc))
    if (maxResults) constraints.push(fsLimit(maxResults))
    const snap = await getDocs(query(collection(db, 'orders'), ...constraints))
    const list = snap.docs
      .filter((d) => !isCounterDocId(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
    return {
      orders: list,
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: maxResults ? snap.docs.length >= maxResults : false,
    }
  } catch (err) {
    if (isPermissionDenied(err)) {
      return { orders: [], lastDoc: null, hasMore: false, __error: 'permission-denied' }
    }
    console.error('[firestore] fetchAllOrders failed', err)
    return { orders: [], lastDoc: null, hasMore: false, __error: 'other' }
  }
}

// Fetch recent orders
export async function fetchRecentOrders(limitCount = 10, sourceFilter = null) {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), fsLimit(Math.max(10, limitCount))))
    let list = snap.docs
      .filter((d) => !isCounterDocId(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
    if (sourceFilter) list = list.filter(o => (o.source || null) === sourceFilter)
    if (list.length > limitCount) list = list.slice(0, limitCount)
    return list
  } catch (err) {
    if (isPermissionDenied(err)) return []
    console.error('[firestore] fetchRecentOrders failed', err)
    return []
  }
}

export function nextOrderStatus(current) {
  const flow = ['placed', 'preparing', 'ready', 'delivered']
  const idx = flow.indexOf(current)
  return idx === -1 ? flow[0] : (idx < flow.length - 1 ? flow[idx + 1] : flow[idx])
}

export async function fetchLatestUserOrder(userId) {
  if (!userId) return null
  const orders = await fetchUserOrders(userId)
  return orders.length ? orders[0] : null
}

export async function fetchUserOrders(userId) {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId), fsLimit(100)))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => {
      const ta = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0)
      const tb = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0)
      return tb - ta
    })
    return list
  } catch (err) {
    if (isPermissionDenied(err)) {
      try {
        const nested = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc')))
        return nested.docs.map((d) => ({ id: d.id, ...d.data() }))
      } catch {
        console.warn('[firestore] Orders read denied by rules for current user.', err)
        return []
      }
    }
    console.error('[firestore] fetchUserOrders failed:', err)
    return []
  }
}

```

### Customer WhatsApp helper (venkys/src/lib/whatsapp.js)
`$lang
// whatsapp — WhatsApp message formatting and delivery
import { sendWhatsAppInvoice } from './data'

// Internal helper for formatting bill messages
function formatBillMessage(order) {
  if (!order) return ''

  const { orderNo, customer, items, subtotal, taxAmount, totalAmount, orderType } = order
  const name = customer?.name || 'Customer'
  
  let message = `🧾 *Order Confirmation*\n`
  message += `Order #${orderNo}\n\n`
  message += `Hi ${name},\n`
  message += `Thanks for ordering from Venky's Chicken Xperience! 🍗\n\n`

  message += `*Order Details:*\n`
  if (Array.isArray(items)) {
    items.forEach(item => {
      const qty = item.qty || 0
      const rate = Number(item?.rate ?? item?.price ?? 0)
      const total = item.total || (qty * rate)
      message += `${qty} x ${item.name} (₹${total})\n`
      if (item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0) {
         message += `   _(${item.modifiers.map(m => m.name).join(', ')})_\n`
      }
    })
  }
  
  message += `\n`
  message += `*Subtotal:* ₹${subtotal}\n`
  if (taxAmount > 0) {
    message += `*Tax:* ₹${taxAmount}\n`
  }
  message += `*Total:* ₹${totalAmount}\n\n`
  
  if (orderType === 'delivery') {
    message += `Your order will be delivered to:\n${customer?.address || 'Address provided'}\n\n`
  } else if (orderType === 'takeaway') {
    message += `Your order will be ready for pickup shortly.\n\n`
  } else {
    message += `Your order is being prepared.\n\n`
  }

  message += `Thank you for choosing us! 🙏`
  
  return message
}

function formatItemsList(items) {
  if (!Array.isArray(items)) return 'No items'
  // WhatsApp templates don't allow newlines in parameters, use comma separation
  const lines = items.map(item => {
    const qty = item.qty || 0
    const total = item.total || (qty * Number(item?.rate ?? item?.price ?? 0))
    let line = `${qty} x ${item.name} (₹${total})`
    if (item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0) {
       line += ` + ${item.modifiers.map(m => m.name).join(', ')}`
    }
    return line
  })
  
  const joined = lines.join(', ')
  if (joined.length > 1000) {
    return joined.slice(0, 997) + '...'
  }
  return joined
}

export async function sendBillToCustomer(order) {
  if (!order || !order.customer || !order.customer.phone) {
    console.warn('Cannot send WhatsApp bill: Missing order or customer phone')
    return { ok: false, error: 'missing_phone' }
  }

  const phone = order.customer.phone

  // Use Template Message (Recommended for 24h window compliance)
  // Template Name: venkys_bill
  // Variables: {{1}}=Name, {{2}}=OrderNo, {{3}}=Total, {{4}}=Items

  const itemsList = formatItemsList(order.items)
  
  const payload = {
    templateName: 'venkys_bill',
    templateLanguage: 'en', 
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: order.customer.name || 'Customer' },
          { type: 'text', text: String(order.orderNo) },
          { type: 'text', text: String(order.totalAmount) },
          { type: 'text', text: itemsList },
        ]
      }
    ]
  }

  // Use the existing data layer function which calls the API
  const templateRes = await sendWhatsAppInvoice(phone, payload)
  if (!templateRes?.__error && !templateRes?.__skipped) {
    return templateRes
  }

  // Fallback to plain text (may work inside the 24h window; serverless also tries to open a session template when needed)
  const text = formatBillMessage(order)
  const textRes = await sendWhatsAppInvoice(phone, { text })
  if (!textRes?.__error && !textRes?.__skipped) {
    return { ...textRes, __fallback: 'text' }
  }

  // Surface details so callers' .catch() logs the real reason
  const details =
    templateRes?.data?.error?.message ||
    textRes?.data?.error?.message ||
    templateRes?.error ||
    textRes?.error ||
    templateRes?.message ||
    textRes?.message ||
    templateRes?.__skipped ||
    textRes?.__skipped ||
    templateRes?.__error ||
    textRes?.__error ||
    'unknown'
  throw new Error(`WhatsApp failed: ${details}`)
}

```

### Admin AdminBiller.jsx (venkys_admin/src/pages/AdminBiller.jsx)
`$lang
// AdminBiller — POS billing interface for walk-in orders
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'

import { useNavigate } from 'react-router-dom'
import { MdPayment, MdQrCode, MdCreditCard, MdHistory, MdSearch, MdKeyboardReturn, MdRestaurantMenu } from 'react-icons/md'

import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchMenuCategories, createOrder, fetchImagesByIdsCached, getImageDataUrl, fetchRecentOrders, generateDailyOrderNo, fetchAllOrders, updateOrder, sendWhatsAppInvoice, fetchAppSettings, getRandomOtp, BRAND_LONG, BRAND_SHORT, ensureGuestUser, GUEST_USER_ID, createRazorpayOrder, verifyRazorpayPayment, getRazorpayKeyId } from '../lib/data'

const PAYMENT_OPTIONS = [
  { key: 'cod', label: 'Cash', helper: 'Collect cash at counter', icon: MdPayment },
  { key: 'online', label: 'Online Payment', helper: 'Razorpay (UPI / Card)', icon: MdQrCode },
]

const PAYMENT_LABELS = PAYMENT_OPTIONS.reduce((map, opt) => ({ ...map, [opt.key]: opt.label }), {})

// ── Helpers ──

function normalizePaymentMethod(method) {
  return PAYMENT_OPTIONS.some((opt) => opt.key === method) ? method : 'cod'
}

function formatPaymentMethod(method) {
  return PAYMENT_LABELS[method] || (method ? method.toUpperCase() : 'Unknown')
}

function timestampToDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : new Date(parsed)
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }
  return null
}

function getStatusHistory(order) {
  if (!order || !Array.isArray(order.statusHistory)) return []
  const sorted = [...order.statusHistory].sort((a, b) => {
    const da = timestampToDate(a?.at)?.getTime() ?? 0
    const db = timestampToDate(b?.at)?.getTime() ?? 0
    return da - db
  })
  return sorted.map((entry) => ({
    status: entry?.status || order.status || 'placed',
    at: timestampToDate(entry?.at) || timestampToDate(order.updatedAt) || timestampToDate(order.createdAt) || new Date(),
    actor: entry?.actor || 'system',
  }))
}

function getLatestStatus(order) {
  const history = getStatusHistory(order)
  if (history.length) return history[history.length - 1]
  return {
    status: order?.status || 'placed',
    at: timestampToDate(order?.updatedAt) || timestampToDate(order?.createdAt) || null,
    actor: order?.customer?.servedBy || 'system',
  }
}

function statusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'ready':
      return 'badge-success'
    case 'preparing':
      return 'badge-warning'
    case 'delivered':
      return 'badge-primary'
    case 'rejected':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

function paymentStatusBadge(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'badge-success'
    case 'pending':
      return 'badge-warning'
    case 'failed':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

export default function AdminBiller() {
  const { user } = useAuth()
  const { pushToast } = useUI()
  const navigate = useNavigate()

  // ── State & refs ──
  const [items, setItems] = useState([])
  const [catsMeta, setCatsMeta] = useState([])
  const [q, setQ] = useState('')
  const [bill, setBill] = useState({})
  const [payMethod, setPayMethod] = useState('cod')
  const [loading, setLoading] = useState(true)
  const [openCats, setOpenCats] = useState(() => new Set())
  const [guestMode, setGuestMode] = useState(false)
  const [activeContactField, setActiveContactField] = useState(null) // 'name' | 'phone' | null
  const [contactSuggestions, setContactSuggestions] = useState([])
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [brokenCatImages, setBrokenCatImages] = useState({})
  const [brokenItemImages, setBrokenItemImages] = useState({})
  
  // OTP State

  const [expectedOtp, setExpectedOtp] = useState(null)
  const [otpSending, setOtpSending] = useState(false)
  const searchInputRef = useRef(null)

  const ensureRazorpay = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window object not available'))
    }
    if (window.Razorpay) {
      return Promise.resolve(window.Razorpay)
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => {
          if (window.Razorpay) resolve(window.Razorpay); else reject(new Error('Razorpay SDK unavailable after load'))
        }, { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')), { once: true })
      })
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => { if (window.Razorpay) resolve(window.Razorpay); else reject(new Error('Razorpay SDK unavailable after load')) }
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })
  }, [])

  // New State for Redesign
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [checkoutStep, setCheckoutStep] = useState(0) // 0: closed, 1: details, 2: payment
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' })
  
  const [imageMap, setImageMap] = useState({})
  const [recent, setRecent] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [successPhone, setSuccessPhone] = useState('')
  const [editOrder, setEditOrder] = useState(null)
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [allOrders, setAllOrders] = useState([])
  const [viewOrder, setViewOrder] = useState(null)
  const [confettiActive, setConfettiActive] = useState(false)
  const [appSettings, setAppSettings] = useState({ adminMobile: '' })

  const [showCalc, setShowCalc] = useState(false)
  const [calcExpr, setCalcExpr] = useState('')

  useEffect(() => {
    if (!showCalc) return
    const onKey = (e) => { if (e.key === 'Escape') setShowCalc(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCalc])

  // ── Data loading ──
  useEffect(() => {
    let mounted = true
    fetchAppSettings().then((s) => { if (mounted) setAppSettings(s) }).catch(()=>{})
    fetchMenuCategories().then((cats) => {
      if (!mounted) return
      const flat = cats.flatMap((c) => (Array.isArray(c.items) ? c.items : []).map((it, idx) => ({
        id: `${c.id}-${idx}-${(it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: it.name,
        rate: Number(it.rate ?? it.price) || 0,
        veg: it.veg === false ? false : true,
        categoryId: c.id,
        imageId: it.imageId || null,
        image: (() => {
          const v = it.image || it.imageUrl || it.image_url || it.img || it.url
          return typeof v === 'string' ? v : ''
        })(),
      })))
      setItems(flat)
      
      // Build category metadata once
      const catMeta = cats.map((c) => {
        const asTrimmedString = (v) => (typeof v === 'string' ? v.trim() : '')
        const asImageObject = (v) => {
          if (!v || typeof v !== 'object') return null
          const data = asTrimmedString(v.data)
          const url = asTrimmedString(v.url)
          const mime = asTrimmedString(v.mime)
          if (url) return { url }
          if (data) return { data, mime: mime || null }
          return null
        }
        const pickId = (...vals) => {
          for (const v of vals) {
            if (!v) continue
            if (typeof v === 'string' && v.trim()) return v.trim()
            if (typeof v === 'object') {
              const fromObj = asTrimmedString(v.id) || asTrimmedString(v.imageId) || asTrimmedString(v.image_id) || asTrimmedString(v.value)
              if (fromObj) return fromObj
            }
          }
          return ''
        }

        // Match customer app behavior: category imageId lives on the category doc.
        // We allow a minimal fallback to first item's imageId so the POS still shows something.
        const explicitId = pickId(
          c.imageId,
          c.categoryImageId,
          c.category_image_id,
          c.categoryImageID,
          c.image_id,
          c.imgId,
        )
        const firstItemImageId = pickId((c.items || []).find((it) => it?.imageId)?.imageId)
        const imageId = (explicitId || firstItemImageId) ? (explicitId || firstItemImageId) : null

        const imageRaw = c.image || c.imageUrl || c.image_url || c.img || c.url || c.categoryImage || c.categoryImageUrl
        const image = typeof imageRaw === 'string' ? imageRaw : ''
        const imageObj = image ? null : asImageObject(imageRaw)
        return { id: c.id, name: c.name || c.id, imageId, image, imageObj }
      })
      setCatsMeta(catMeta)

      // Collect all unique image IDs (items + categories) and load once.
      const ids = Array.from(new Set([
        ...flat.map(i => i.imageId).filter(Boolean),
        ...catMeta.map(c => c.imageId).filter(Boolean),
      ]))

      if (ids.length) {
        fetchImagesByIdsCached(ids).then((map) => {
          if (!mounted) return
          setImageMap(map || {})
        }).catch(err => console.warn('Failed to fetch images', err))
      }
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  // If the image map refreshes, allow previously broken images to re-attempt.
  useEffect(() => {
    setBrokenCatImages({})
    setBrokenItemImages({})
  }, [imageMap])

  async function refreshRecent() {
    const list = await fetchRecentOrders(10, 'pos')
    setRecent(list)
  }
  useEffect(() => { refreshRecent() }, [])

  // Contact suggestions (from recent POS orders) driven by the active input
  useEffect(() => {
    if (!activeContactField) {
      setContactSuggestions([])
      setShowContactDropdown(false)
      return
    }

    const rawTerm = activeContactField === 'name'
      ? (customerDetails.name || '')
      : (customerDetails.phone || '')

    const term = String(rawTerm).trim().toLowerCase()
    const minLen = activeContactField === 'phone' ? 3 : 2
    if (!term || term.length < minLen) {
      setContactSuggestions([])
      setShowContactDropdown(false)
      return
    }

    const matches = recent
      .map(o => {
        const name = String(o.customer?.name || '').trim()
        const phone = String(o.customer?.phone || o.phone || '').replace(/\D/g, '').slice(-10)
        return { name, phone }
      })
      .filter(c => c.phone && c.name)
      .filter(c => {
        const nameHit = c.name.toLowerCase().includes(term)
        const phoneHit = c.phone.includes(term.replace(/\D/g, ''))
        return activeContactField === 'name' ? nameHit : phoneHit
      })
      .filter((v, i, a) => a.findIndex(t => t.phone === v.phone) === i)
      .slice(0, 6)

    setContactSuggestions(matches)
    setShowContactDropdown(matches.length > 0)
  }, [activeContactField, customerDetails.name, customerDetails.phone, recent])

  useEffect(() => {
    if (success) {
      setConfettiActive(true)
      const t = setTimeout(() => setConfettiActive(false), 3000)
      return () => clearTimeout(t)
    } else {
      setConfettiActive(false)
    }
  }, [success])

  const toDataUrl = (str) => {
    const clean = String(str || '').trim()
    if (!clean) return ''
    if (/^https?:\/\//i.test(clean)) return clean
    if (clean.startsWith('data:')) return clean
    return `data:image/*;base64,${clean}`
  }

  // Memoize item image URLs to prevent flicker
  const itemImageUrls = useMemo(() => {
    const urls = {}
    for (const it of items) {
      if (it.imageId && imageMap[it.imageId]) {
        const url = getImageDataUrl(imageMap[it.imageId])
        if (url) urls[it.id] = url
      } else if (it.image) {
        urls[it.id] = toDataUrl(it.image)
      }
    }
    return urls
  }, [items, imageMap])

  // Memoize category image URLs to prevent flicker on re-renders
  const catImageUrls = useMemo(() => {
    const urls = {}
    for (const cat of catsMeta) {
      if (cat.imageId && imageMap[cat.imageId]) {
        const url = getImageDataUrl(imageMap[cat.imageId])
        if (url) {
          urls[cat.id] = url
          continue
        }
        continue
      }
      if (cat.imageObj) {
        const url = getImageDataUrl(cat.imageObj)
        if (url) {
          urls[cat.id] = url
          continue
        }
      }
      if (cat.image) {
        urls[cat.id] = toDataUrl(cat.image)
        continue
      }
      const fallbackItem = items.find((it) => it.categoryId === cat.id && (itemImageUrls[it.id] || it.image))
      if (fallbackItem) {
        urls[cat.id] = itemImageUrls[fallbackItem.id] || toDataUrl(fallbackItem.image)
        continue
      }
      urls[cat.id] = '/icons/icon-192x192.png'
    }
    return urls
  }, [catsMeta, imageMap, items, itemImageUrls])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter((it) => (it.name || '').toLowerCase().includes(term))
  }, [items, q])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const it of filtered) {
      const arr = map.get(it.categoryId) || []
      arr.push(it)
      map.set(it.categoryId, arr)
    }
    const groups = catsMeta
      .map(c => ({ id: c.id, name: c.name, items: map.get(c.id) || [] }))
      .filter(g => g.items.length > 0)
    const term = q.trim()
    if (term) {
      groups.sort((a,b) => (b.items.length - a.items.length) || a.name.localeCompare(b.name))
    }
    return groups
  }, [filtered, catsMeta, q])

  useEffect(() => {
    const term = q.trim()
    if (!term) { setOpenCats(new Set()); return }
    const first = grouped.length ? grouped[0].id : null
    setOpenCats(first ? new Set([first]) : new Set())
  }, [q, grouped])

  // ── Bill handlers ──
  function addLine(it) {
    setBill((prev) => {
      const key = it.id
      const cur = prev[key]
      const qty = (cur?.qty || 0) + 1
      return { ...prev, [key]: { item: it, qty } }
    })
    if (q.trim()) setOpenCats(new Set())
  }
  function decLine(key) {
    setBill((prev) => {
      const cur = prev[key]
      if (!cur) return prev
      const qty = (cur.qty || 0) - 1
      const next = { ...prev }
      if (qty <= 0) delete next[key]; else next[key] = { ...cur, qty }
      return next
    })
  }
  function incLine(key) {
    setBill((prev) => {
      const cur = prev[key]
      if (!cur) return prev
      return { ...prev, [key]: { ...cur, qty: (cur.qty || 0) + 1 } }
    })
  }
  function clearBill() { setBill({}) }

  const lines = Object.values(bill)
  const subtotal = lines.reduce((s, l) => s + (Number(l.item?.rate ?? l.item?.price) || 0) * (l.qty || 0), 0)
  const grandTotal = subtotal

  const buildPaymentPayload = (method) => {
    const normalized = normalizePaymentMethod(method)
    const collectedBy = user?.uid || user?.email || 'pos'
    const nowIso = new Date().toISOString()
    const payload = {
      method: normalized,
      status: normalized === 'cod' ? 'pending' : 'paid',
      collectedBy,
      collectedAt: nowIso,
      metadata: {
        channel: 'pos',
        terminal: 'counter',
        recordedAt: nowIso,
      },
    }
    if (normalized !== 'cod') {
      payload.reference = `POS-${Date.now().toString(36)}`
    }
    return payload
  }

  async function handleCheckoutNext() {
    if (checkoutStep === 1) {
       if (!guestMode) {
         if (!customerDetails.name.trim()) { pushToast('Enter customer name', 'error'); return }
         if (!/^\d{10}$/.test(customerDetails.phone)) { pushToast('Enter valid 10-digit phone', 'error'); return }
       }
       setCheckoutStep(2)
    } else if (checkoutStep === 2) {
       if (payMethod === 'cod') {
          setOtpSending(true)
          try {
           const otpDoc = await getRandomOtp()
           const code = otpDoc?.code || String(Math.floor(1000 + Math.random() * 9000))
           setExpectedOtp(code)

           // Place order immediately; OTP will be sent to Cash Manager and verified in Orders page.
           await submitBill({ otpVerified: false, navigateToOrders: true, otpValue: code })
          } catch (e) {
             pushToast('OTP Error: ' + e.message, 'error')
          } finally {
             setOtpSending(false)
          }
       } else if (payMethod === 'online') {
         try {
           // Get Razorpay key from environment
           const keyId = await getRazorpayKeyId()
           if (!keyId) {
             throw new Error('Online payments are not configured. Please check browser console for details, or contact admin to add RAZORPAY_KEY_ID to Vercel environment variables.')
           }
           if (!grandTotal || grandTotal <= 0) throw new Error('Amount must be greater than zero.')

           const razorpayOrder = await createRazorpayOrder(Number(grandTotal))
           const RazorpayCtor = await ensureRazorpay()
           let settled = false
           const paymentResponse = await new Promise((resolve, reject) => {
             const instance = new RazorpayCtor({
               key: keyId,
               amount: razorpayOrder.amount,
               currency: razorpayOrder.currency,
               name: BRAND_LONG,
               description: 'POS dine-in payment',
               order_id: razorpayOrder.orderId,
               prefill: {
                 name: customerDetails.name || 'Dine-in Guest',
                 contact: customerDetails.phone || '',
               },
               notes: { source: 'admin_pos' },
               handler: (response) => {
                 if (settled) return
                 settled = true
                 resolve(response)
               },
               modal: {
                 ondismiss: () => { if (!settled) { settled = true; reject(new Error('Payment cancelled')) } }
               }
             })
             instance.on('payment.failed', (event) => {
               if (settled) return
               settled = true
               const description = event?.error?.description || 'Payment failed'
               reject(new Error(description))
             })
             instance.open()
           })

           const verification = await verifyRazorpayPayment({
             orderId: razorpayOrder.orderId,
             paymentId: paymentResponse.razorpay_payment_id,
             signature: paymentResponse.razorpay_signature,
           })
           if (!verification?.valid) {
             throw new Error('Payment verification failed.')
           }

           const paymentOverride = {
             method: 'online',
             status: 'paid',
             reference: paymentResponse.razorpay_payment_id,
             gateway: 'razorpay',
             orderId: razorpayOrder.orderId,
           }

           await submitBill({ otpVerified: true, navigateToOrders: true, paymentOverride })
         } catch (e) {
           console.error('Online payment failed', e)
           pushToast(e.message || 'Online payment failed', 'error')
         }
       } else {
         await submitBill()
       }
    }
  }

    async function submitBill({ otpVerified = false, navigateToOrders = false, otpValue = null, paymentOverride = null } = {}) {
    if (!lines.length) { pushToast('Add items to bill', 'error'); return }
    try {
      setSubmitting(true)

      const userIdForOrder = guestMode ? await ensureGuestUser() : null
      const orderItems = lines.map(({ item, qty }) => ({ name: item.name, rate: Number(item.rate ?? item.price) || 0, qty }))
      const payment = paymentOverride || buildPaymentPayload(payMethod)
      const customer = { 
        dineIn: true, 
        servedBy: user?.email || user?.uid || 'biller', 
        payment,
        name: guestMode ? 'Guest' : (customerDetails.name || 'Guest'),
        phone: guestMode ? '' : (customerDetails.phone || '')
      }
      
      let createdOrderNo = null
      if (editOrder && editOrder.id) {
        const targetUserId = editOrder.userId || (guestMode ? GUEST_USER_ID : null)
        await updateOrder(targetUserId, editOrder.id, { items: orderItems, subtotal, customer, orderType: 'dine-in', source: 'pos', totalAmount: grandTotal }, user?.uid || user?.email || 'pos')
        pushToast(`Order updated #${editOrder.orderNo || editOrder.id}`, 'success')
        setEditOrder(null)
        await refreshRecent()
      } else {
        createdOrderNo = await generateDailyOrderNo('dine-in', user?.uid || user?.email || 'POS')
        const now = new Date()
        const guestMeta = guestMode ? {
          guestOrder: true,
          guestOrderDate: now.toISOString().slice(0, 10),
          guestOrderAt: now.toISOString(),
        } : {}

        const effectiveOtp = otpValue || expectedOtp
        const shouldAttachOtp = payMethod === 'cod' && !!effectiveOtp
        const otpMeta = shouldAttachOtp ? {
          cashManagerOtp: effectiveOtp,
          cashManagerOtpFor: 'dine-in-cod',
          cashManagerOtpVerified: !!otpVerified,
          cashManagerOtpVerifiedAt: otpVerified ? new Date().toISOString() : null,
          cashManagerOtpVerifiedBy: otpVerified ? (user?.email || user?.uid || 'pos') : null,
        } : {}

        const initialStatus = otpVerified || payment?.status === 'paid' ? 'preparing' : 'placed'

        const id = await createOrder({
          userId: userIdForOrder,
          customer,
          items: orderItems,
          orderType: 'dine-in',
          source: 'pos',
          orderNo: createdOrderNo,
          totalAmount: grandTotal,
          status: initialStatus,
          ...guestMeta,
          ...otpMeta,
        })
        setSuccess({ id, orderNo: createdOrderNo, items: orderItems, subtotal, total: grandTotal, payment })
        pushToast(`Bill created #${createdOrderNo}`, 'success')
        await refreshRecent()

        if (navigateToOrders || (shouldAttachOtp && !otpVerified)) {
          navigate('/admin/orders', { state: { highlightOrderId: createdOrderNo, autoOpen: true } })
        }
      }
      
      // Send Invoice automatically if phone provided
      if (customerDetails.phone) {
          const phoneRaw = customerDetails.phone
          const finalOrderNo = (editOrder?.orderNo) || createdOrderNo || ''
          const itemsSummary = Array.isArray(orderItems)
            ? orderItems
              .map(it => `${Number(it.qty || 1)}x ${String(it.name || '').trim()}`.trim())
              .filter(Boolean)
              .join(', ')
              .slice(0, 1000)
            : ''
          const payload = {
            templateName: 'venkys_bill',
            templateLanguage: 'en',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: (customerDetails.name || 'Customer').trim() || 'Customer' },
                  { type: 'text', text: String(finalOrderNo) },
                  { type: 'text', text: String(Number(grandTotal || 0)) },
                  { type: 'text', text: itemsSummary || '-' },
                ]
              }
            ]
          }
          try { 
            const res = await sendWhatsAppInvoice(phoneRaw, payload)
            if (res?.__error) {
               console.warn('WhatsApp invoice failed', res)
               pushToast('WhatsApp invoice failed: ' + (res.message || res.__error), 'warning')
            }
          } catch (e) { 
            console.warn('WhatsApp invoice failed', e)
            pushToast('WhatsApp invoice failed', 'warning')
          }
      }

      setCheckoutStep(0)
      setCustomerDetails({ name: '', phone: '' })
      setExpectedOtp(null)
      clearBill(); setQ(''); setSuccessPhone('')
    } catch (e) {
      console.error('submitBill failed', e)
      pushToast(e.message || 'Failed to create bill', 'error')
    } finally { setSubmitting(false) }
  }

  async function loadAllOrders() {
    const res = await fetchAllOrders()
    const list = Array.isArray(res?.orders) ? res.orders : Array.isArray(res) ? res : []
    setAllOrders(list)
  }

  // ── Calculator ──
  function calcAppend(ch) { setCalcExpr((s) => (s + ch)) }
  function calcClear() { setCalcExpr('') }

  // Safe math evaluator — no Function/eval, recursive-descent parser for +, -, *, /, ()
  function safeMathEval(expr) {
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g) || []
    let pos = 0
    const peek = () => tokens[pos]
    const next = () => tokens[pos++]
    function parseExpr() {
      let left = parseTerm()
      while (peek() === '+' || peek() === '-') {
        const op = next()
        const right = parseTerm()
        left = op === '+' ? left + right : left - right
      }
      return left
    }
    function parseTerm() {
      let left = parseFactor()
      while (peek() === '*' || peek() === '/') {
        const op = next()
        const right = parseFactor()
        left = op === '*' ? left * right : left / right
      }
      return left
    }
    function parseFactor() {
      if (peek() === '(') { next(); const v = parseExpr(); next(); return v }
      const t = next()
      return t === undefined ? 0 : Number(t)
    }
    const result = parseExpr()
    if (!Number.isFinite(result)) throw new Error('Invalid')
    return result
  }

  function calcEval() {
    try {
      const safe = calcExpr.replace(/[^0-9+\-*/().]/g, '')
      const val = safeMathEval(safe || '0')
      setCalcExpr(String(val))
    } catch { setCalcExpr('Err') }
  }

  const viewOrderHistory = viewOrder ? getStatusHistory(viewOrder) : []
  const viewOrderPayment = viewOrder?.payment || null

  // ── Render ──
  return (
    <div className="page-wrap py-6 pb-32">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold"><span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Biller POS</span></h2>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" onClick={clearBill}>Clear</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCalc(s => !s)} title="Calculator">🧮</button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
        <input 
          ref={searchInputRef}
          type="text" 
          className="input input-bordered w-full pl-10" 
          placeholder="Search items..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
      </div>

      {showCalc && (
        <>
          <div className="fixed inset-0 z-40" onClick={()=>setShowCalc(false)} />
          <div className="fixed right-4 top-20 z-50 w-56 rounded-xl border border-primary/40 bg-base-100/90 backdrop-blur shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">Calculator</div>
              <button className="btn btn-ghost btn-xs" onClick={()=>setShowCalc(false)}>✕</button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input className="input input-bordered input-xs flex-1" value={calcExpr} onChange={(e)=>setCalcExpr(e.target.value)} />
              <button className="btn btn-xs" onClick={calcClear}>C</button>
              <button className="btn btn-primary btn-xs" onClick={calcEval}>=</button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','+','('].map(ch => (
                <button key={ch} className="btn btn-ghost btn-xs" onClick={()=>calcAppend(ch)}>{ch}</button>
              ))}
              <button className="btn btn-ghost btn-xs" onClick={()=>calcAppend(')')}>)</button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      {!selectedCategory && !q ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {catsMeta.map(cat => {
             const isBroken = !!brokenCatImages[cat.id]
             const imgUrl = !isBroken ? (catImageUrls[cat.id] || null) : null
             return (
               <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition cursor-pointer active:scale-95 rounded-2xl">
                 <figure className="px-4 pt-4">
                   {imgUrl ? (
                     <img
                       src={imgUrl}
                       alt={cat.name}
                       className="rounded-xl h-32 w-full object-cover bg-base-200"
                       onError={() => setBrokenCatImages(prev => ({ ...prev, [cat.id]: true }))}
                     />
                   ) : (
                     <div className="rounded-xl h-32 w-full bg-base-200 grid place-items-center text-base-content/30">
                       <MdRestaurantMenu className="text-4xl" />
                     </div>
                   )}
                 </figure>
                 <div className="card-body items-center text-center p-4">
                   <h2 className="card-title text-sm">{cat.name}</h2>
                 </div>
               </div>
             )
          })}
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Sidebar Categories */}
          <div className="w-48 shrink-0 overflow-y-auto pr-2 hidden md:block border-r border-base-200">
            <button 
              className="btn btn-sm btn-ghost w-full justify-start mb-2 gap-2" 
              onClick={() => { setSelectedCategory(null); setQ('') }}
            >
              <MdKeyboardReturn /> All Categories
            </button>
            <div className="flex flex-col gap-1">
              {catsMeta.map(cat => {
                const isBroken = !!brokenCatImages[cat.id]
                const imgUrl = !isBroken ? (catImageUrls[cat.id] || null) : null
                const hasImage = !!imgUrl
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-sm justify-start text-left h-auto py-2 ${selectedCategory?.id === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <div className="avatar placeholder">
                      <div className="w-6 h-6 rounded bg-base-300 text-base-content/50">
                        {hasImage ? (
                          <img
                            src={imgUrl}
                            alt=""
                            className="object-cover"
                            onError={() => setBrokenCatImages(prev => ({ ...prev, [cat.id]: true }))}
                          />
                        ) : (
                          <span className="text-xs">{cat.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <span className="truncate flex-1">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="flex items-center gap-2 mb-4 md:hidden">
               <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedCategory(null); setQ('') }}>
                 <MdKeyboardReturn /> Back
               </button>
               <h3 className="font-bold text-lg truncate">{selectedCategory?.name || 'Search Results'}</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
               {(q ? filtered : (grouped.find(g => g.id === selectedCategory?.id)?.items || [])).map(it => {
                  const isBroken = !!brokenItemImages[it.id]
                  const imgUrl = !isBroken ? (itemImageUrls[it.id] || null) : null
                  const qty = bill[it.id]?.qty || 0
                  return (
                    <button key={it.id} type="button" className={`group relative rounded-lg border bg-base-100 p-2 text-left shadow-sm transition ${qty > 0 ? 'border-primary ring-1 ring-primary' : 'border-base-300 hover:border-primary/50'}`} onClick={() => addLine(it)}>
                      <div className="w-full aspect-[5/4] rounded-lg overflow-hidden bg-base-200 grid place-items-center relative">
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={() => setBrokenItemImages(prev => ({ ...prev, [it.id]: true }))}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center bg-base-200 text-base-content/20 ${imgUrl ? 'hidden' : 'flex'}`}>
                           <MdRestaurantMenu className="text-4xl" />
                        </div>
                        {qty > 0 && (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl z-10">
                              {qty}
                           </div>
                        )}
                      </div>
                      <div className="mt-1.5 text-[11px] font-medium leading-tight line-clamp-2 min-h-[2.1em]">{it.name}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">₹{Number(it.rate ?? it.price) || 0}</div>
                      {qty > 0 && (
                         <div className="mt-2 flex items-center justify-between bg-base-200 rounded p-1" onClick={e => e.stopPropagation()}>
                            <div className="btn btn-xs btn-ghost px-1 h-6 min-h-0" onClick={() => decLine(it.id)}>-</div>
                            <div className="text-xs font-bold">{qty}</div>
                            <div className="btn btn-xs btn-ghost px-1 h-6 min-h-0" onClick={() => incLine(it.id)}>+</div>
                         </div>
                      )}
                    </button>
                  )
               })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Checkout Bar */}
      {lines.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-64 md:right-8 z-30">
           <div className="bg-base-100 shadow-2xl rounded-2xl p-4 flex justify-between items-center border border-primary/20 max-w-2xl mx-auto">
              <div className="flex items-center gap-4">
                 <div className="indicator">
                    <span className="indicator-item badge badge-primary">{lines.reduce((a,b)=>a+b.qty,0)}</span>
                    <button className="btn btn-circle btn-ghost btn-sm" onClick={clearBill}>✕</button>
                 </div>
                 <div>
                    <div className="text-xs opacity-70">Total</div>
                    <div className="font-bold text-lg">₹{grandTotal}</div>
                 </div>
              </div>
              <button
                onClick={() => {
                  setGuestMode(false)
                  setCustomerDetails({ name: '', phone: '' })
                  setActiveContactField(null)
                  setShowContactDropdown(false)
                  setCheckoutStep(1)
                }}
                className="btn btn-primary px-8"
              >
                Checkout
              </button>
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutStep > 0 && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
               {checkoutStep === 1 && 'Customer Details'}
               {checkoutStep === 2 && 'Payment Method'}
            </h3>
            
            {checkoutStep === 1 && (
               <div className="space-y-4">
                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text">Mode</span>
                    </label>
                    <div className="join w-full">
                      <input
                        className="btn join-item"
                        type="radio"
                        name="biller-customer-mode"
                        aria-label="Customer"
                        checked={!guestMode}
                        onChange={() => {
                          setGuestMode(false)
                          setCustomerDetails({ name: '', phone: '' })
                          setActiveContactField('name')
                        }}
                      />
                      <input
                        className="btn join-item"
                        type="radio"
                        name="biller-customer-mode"
                        aria-label="Guest"
                        checked={guestMode}
                        onChange={() => {
                          setGuestMode(true)
                          setCustomerDetails({ name: '', phone: '' })
                          setActiveContactField(null)
                          setShowContactDropdown(false)
                          // Skip the details step entirely
                          setCheckoutStep(2)
                        }}
                      />
                    </div>
                  </div>

                  {!guestMode && (
                    <>
                      <div className="form-control relative">
                        <label className="label"><span className="label-text">Name</span></label>
                        <input
                          className="input input-bordered"
                          value={customerDetails.name}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                            setCustomerDetails(s => ({ ...s, name: clean }))
                          }}
                          onFocus={() => { setActiveContactField('name'); if (contactSuggestions.length) setShowContactDropdown(true) }}
                          onBlur={() => setTimeout(() => setShowContactDropdown(false), 150)}
                          placeholder="Customer Name"
                          autoFocus
                        />
                        {activeContactField === 'name' && showContactDropdown && contactSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {contactSuggestions.map((contact, idx) => (
                              <button
                                key={`${contact.phone}-${idx}`}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center justify-between border-b border-base-200 last:border-0"
                                onMouseDown={(ev) => {
                                  ev.preventDefault()
                                  setCustomerDetails({ name: contact.name, phone: contact.phone })
                                  setShowContactDropdown(false)
                                  setActiveContactField(null)
                                }}
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-xs opacity-60">{contact.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="form-control relative">
                        <label className="label"><span className="label-text">Phone</span></label>
                        <input
                          className="input input-bordered tabular-nums"
                          value={customerDetails.phone}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setCustomerDetails(s => ({ ...s, phone: clean }))
                          }}
                          onFocus={() => { setActiveContactField('phone'); if (contactSuggestions.length) setShowContactDropdown(true) }}
                          onBlur={() => setTimeout(() => setShowContactDropdown(false), 150)}
                          placeholder="10-digit Mobile"
                          maxLength={10}
                          inputMode="numeric"
                        />
                        {activeContactField === 'phone' && showContactDropdown && contactSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {contactSuggestions.map((contact, idx) => (
                              <button
                                key={`${contact.phone}-${idx}`}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center justify-between border-b border-base-200 last:border-0"
                                onMouseDown={(ev) => {
                                  ev.preventDefault()
                                  setCustomerDetails({ name: contact.name, phone: contact.phone })
                                  setShowContactDropdown(false)
                                  setActiveContactField(null)
                                }}
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-xs opacity-60">{contact.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
               </div>
            )}

            {checkoutStep === 2 && (
               <div className="grid gap-2">
                  {PAYMENT_OPTIONS.map(opt => (
                     <button key={opt.key} onClick={() => setPayMethod(opt.key)} className={`btn justify-start h-auto py-3 ${payMethod === opt.key ? 'btn-primary' : 'btn-outline'}`}>
                        <opt.icon className="w-6 h-6 mr-2" />
                        <div className="text-left">
                           <div className="font-bold">{opt.label}</div>
                           <div className="text-xs font-normal opacity-70">{opt.helper}</div>
                        </div>
                     </button>
                  ))}
               </div>
            )}

            <div className="modal-action">
               <button className="btn" onClick={() => setCheckoutStep(0)}>Cancel</button>
               <button className="btn btn-primary" onClick={handleCheckoutNext} disabled={otpSending || submitting}>
                {otpSending ? 'Sending...' : submitting ? 'Processing...' : (checkoutStep === 1 ? 'Next' : 'Place')}
               </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-[80]">
          {confettiActive && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="confetti">
                {Array.from({ length: 120 }).map((_, i) => {
                  const left = Math.random() * 100
                  const delay = Math.random() * 0.6
                  const duration = 2.6 + Math.random() * 2
                  const colors = ['#f59e0b','#ef4444','#22c55e','#3b82f6','#eab308']
                  const bg = colors[i % colors.length]
                  const style = { left: `${left}%`, backgroundColor: bg, animationDuration: `${duration}s`, animationDelay: `${delay}s` }
                  return <span key={i} style={style}></span>
                })}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50" onClick={()=>setSuccess(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-md border border-primary/40">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold">Order Placed</div>
                <button className="btn btn-ghost btn-xs" onClick={()=>setSuccess(null)}>✕</button>
              </div>
              <div className="p-4">
                <div className="text-center mb-3">
                  <div className="text-lg font-bold">{BRAND_LONG}</div>
                  <div className="text-xs opacity-70">Dine-in | POS</div>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div>Order #</div>
                  <div className="font-mono font-semibold">{success.orderNo}</div>
                </div>
                <div className="flex items-center justify-between text-xs opacity-70 mb-3">
                  <div>{new Date().toLocaleDateString()}</div>
                  <div>{new Date().toLocaleTimeString()}</div>
                </div>
                <div className="divider my-2" />
                <div className="space-y-1 mb-2">
                  {(success.items && success.items.length > 0) ? success.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="truncate mr-2">{it.name} <span className="opacity-60">× {it.qty}</span></div>
                      <div>₹{(Number(it.rate ?? it.price) || 0) * Number(it.qty||0)}</div>
                    </div>
                  )) : (
                    <div className="text-xs opacity-70">Items saved with order.</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="opacity-80">Subtotal</div>
                  <div>₹{success.subtotal ?? 0}</div>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <div>Total</div>
                  <div>₹{success.total ?? success.subtotal ?? 0}</div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase opacity-70">Payment</div>
                    <div className="font-semibold">{formatPaymentMethod(success.payment?.method || payMethod)}</div>
                  </div>
                  <span className={`badge ${paymentStatusBadge(success.payment?.status || 'paid')}`}>{(success.payment?.status || 'paid').toUpperCase()}</span>
                </div>
                <div className="mt-4 text-center">
                  <button className="btn btn-primary" onClick={()=>setSuccess(null)}>Done</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

```

### Admin Orders.jsx (venkys_admin/src/pages/Orders.jsx)
`$lang
// Orders — Order management and fulfilment dashboard
import { useCallback, useEffect, useRef, useState } from 'react'

import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useLocation } from 'react-router-dom'
import { MdWarningAmber, MdPrint } from 'react-icons/md'

import AdminLayout from '../layouts/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { fetchAllOrders, nextOrderStatus, updateOrder, deductStockForOrder, getAvatarUrl, fetchAppSettings, sendWhatsAppInvoice, sendOtpViaWhatsApp, sendOrderMessengerViaWhatsApp, isCounterDocId } from '../lib/data'
import { db } from '../lib/firebase'
import { printOrderReceiptViaRawBT, shouldUseRawBT } from '../lib/rawbtPrint'

export default function Orders() {
  const location = useLocation()
  const { confirmState, resolveConfirm, pushToast } = useUI()
  const { user, roleLoading, isStaffMember } = useAuth()

  // ── State & refs ──
  const [orders, setOrders] = useState([])
  const [liveEnabled] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const historyHeaderRefs = useRef({})
  const [openHistoryKey, setOpenHistoryKey] = useState(null)
  const [cashManagerPhones, setCashManagerPhones] = useState([])
  const [orderMessengerPhones, setOrderMessengerPhones] = useState([])
  const notifiedRef = useRef(new Set())

  // ── Helpers ──
  function normalizeWhatsappPhone(phone) {
    const raw = String(phone || '').trim()
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return `91${digits}`
    if (digits.length === 12 && digits.startsWith('91')) return digits
    return digits
  }

  function isOnlineOrder(o) {
    const source = String(o?.source || '').toLowerCase()
    if (source === 'pos') return false
    const method = String(o?.payment?.method || o?.customer?.payment?.method || '').toLowerCase()
    return method === 'online' || method === 'razorpay'
  }

  const buildOrderAddressString = useCallback((o) => {
    const raw = o?.address ?? o?.customer?.address ?? o?.deliveryAddress ?? ''
    if (!raw) return '-'
    if (typeof raw === 'string') return raw.trim() || '-'
    if (typeof raw === 'object') {
      const parts = [raw.line1, raw.line2, raw.landmark, raw.city, raw.state, raw.pin]
        .map(v => (v == null ? '' : String(v).trim()))
        .filter(Boolean)
      return parts.length ? parts.join(', ') : '-'
    }
    return String(raw).trim() || '-'
  }, [])

  const buildOrderMessengerData = useCallback((o) => {
    const customerName = String(o?.customer?.name || o?.name || 'Customer').trim() || 'Customer'
    const totalAmount = Number(o?.totalAmount ?? o?.subtotal ?? 0)
    const address = buildOrderAddressString(o)
    return { customerName, totalAmount, address }
  }, [buildOrderAddressString])

  function playNewOrderSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.value = 0.03
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
      osc.onended = () => { try { ctx.close() } catch { /* noop */ } }
    } catch (e) {
      console.error('Audio beep failed', e)
    }
  }

  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpModalOrder, setOtpModalOrder] = useState(null)
  const [otpValue, setOtpValue] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpResendBusy, setOtpResendBusy] = useState(false)

  // ── OTP verification ──
  function isDineInCod(o) {
    const type = String(o?.orderType || '').toLowerCase()
    const method = String(o?.payment?.method || o?.customer?.payment?.method || '').toLowerCase()
    return type === 'dine-in' && method === 'cod'
  }

  function openOtpModalForOrder(o) {
    setOtpModalOrder(o)
    setOtpValue('')
    setOtpModalOpen(true)
  }

  async function verifyOtpAndAccept(o, rawOtp) {
    if (!o || o.status !== 'placed') return
    if (!isDineInCod(o)) return
    if (!o.cashManagerOtp) {
      pushToast('OTP not found on this order', 'warning')
      return
    }
    if (o.cashManagerOtpVerified) return

    const typed = String(rawOtp || '').trim()
    const expected = String(o.cashManagerOtp).trim()
    if (!typed || typed !== expected) {
      pushToast('Incorrect OTP', 'error')
      return
    }

    setOtpBusy(true)
    try {
      const collectedAt = new Date().toISOString()
      await updateOrder(o.userId || null, o.id, {
        status: 'preparing',
        cashManagerOtpVerified: true,
        cashManagerOtpVerifiedAt: collectedAt,
        cashManagerOtpVerifiedBy: user?.email || user?.uid || 'staff',
        payment: {
          ...(o.payment || {}),
          status: 'paid',
          collectedAt,
          collectedBy: user?.email || user?.uid || 'staff',
          metadata: { ...(o.payment?.metadata || {}), verifiedBy: 'otp' },
        },
      }, user?.email)

      if (Array.isArray(o.items)) {
        deductStockForOrder(o.items).catch(err => console.error('Stock deduction failed', err))
      }

      setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'preparing', cashManagerOtpVerified: true, payment: { ...(o.payment || {}), status: 'paid', collectedAt, collectedBy: user?.email || user?.uid || 'staff', metadata: { ...(o.payment?.metadata || {}), verifiedBy: 'otp' } } } : x))
      pushToast('Order accepted', 'success')
      setOtpModalOpen(false)
      setOtpModalOrder(null)
      setOtpValue('')
    } catch (err) {
      console.error('[Orders] OTP accept failed:', err)
      pushToast('Failed to accept order', 'error')
    } finally {
      setOtpBusy(false)
    }
  }

  async function resendOtpForOrder(o) {
    if (!o) return
    if (!isDineInCod(o)) {
      pushToast('OTP resend only applies to dine-in COD orders', 'warning')
      return
    }
    if (!o.cashManagerOtp) {
      pushToast('OTP not found on this order', 'warning')
      return
    }
    if (!Array.isArray(cashManagerPhones) || cashManagerPhones.length === 0) {
      pushToast('Cash manager phone(s) not configured', 'error')
      return
    }

    setOtpResendBusy(true)
    try {
      const orderRef = o.orderNo || o.id
      const otp = String(o.cashManagerOtp).trim()

      // Send the same OTP to all cash-manager phones simultaneously
      const results = await Promise.allSettled(
        cashManagerPhones.map((p) => sendOtpViaWhatsApp(p, otp, orderRef))
      )
      const successCount = results.filter(r => r.status === 'fulfilled' && !r.value?.__error).length
      if (successCount === 0) {
        const firstErr = results.find(r => r.status === 'fulfilled' && r.value?.__error)?.value
        throw new Error(firstErr?.message || firstErr?.__error || 'WhatsApp send failed')
      }

      const resentAt = new Date().toISOString()
      const nextCount = Number(o.cashManagerOtpResentCount || 0) + 1
      await updateOrder(o.userId || null, o.id, {
        cashManagerOtpResentAt: resentAt,
        cashManagerOtpResentBy: user?.email || user?.uid || 'staff',
        cashManagerOtpResentCount: nextCount,
      }, user?.email)

      setOrders(arr => arr.map(x => x.id === o.id ? { ...x, cashManagerOtpResentAt: resentAt, cashManagerOtpResentBy: user?.email || user?.uid || 'staff', cashManagerOtpResentCount: nextCount } : x))
      pushToast('OTP resent', 'success')
    } catch (err) {
      console.error('[Orders] OTP resend failed:', err)
      pushToast(err?.message || 'Failed to resend OTP', 'error')
    } finally {
      setOtpResendBusy(false)
    }
  }

  const printOrderBill = (order) => {
    if (!order) return

    // Mobile/tablet/PWA: use RawBT deep-link printing (Android)
    if (shouldUseRawBT()) {
      try {
        printOrderReceiptViaRawBT(order, { title: "Venky's Cheat Mealz", width: 42 })
      } catch (e) {
        console.error('[Orders] RawBT print failed', e)
        pushToast('RawBT print failed. Please ensure RawBT is installed and try again.', 'error', 5000)
      }
      return
    }

    const w = window.open('', '_blank', 'width=280,height=600')
    if (!w) {
        alert('Please allow popups to print the bill')
        return
    }
    
    // Helper to truncate/wrap text for thermal printer (72mm ≈ 42 chars at 9pt monospace)
    const wrapText = (text, maxLen = 32) => {
      if (!text || text.length <= maxLen) return text
      const words = text.split(' ')
      const lines = []
      let current = ''
      for (const word of words) {
        if ((current + ' ' + word).trim().length <= maxLen) {
          current = current ? current + ' ' + word : word
        } else {
          if (current) lines.push(current)
          current = word.length > maxLen ? word.slice(0, maxLen) : word
        }
      }
      if (current) lines.push(current)
      return lines.join('<br/>')
    }

    const itemsHtml = (order.items || []).map(item => {
      const itemName = String(item.name || '').trim()
      const qty = Number(item.qty) || 1
      const rate = Number(item.rate ?? item.price) || 0
      const lineTotal = (qty * rate).toFixed(0)
      // Format: "2x Chicken Burger" on one line, price right-aligned on next line if name is long
      const nameWrapped = wrapText(itemName, 28)
      return `
        <tr>
          <td style="padding: 2px 0; vertical-align: top; width: 25px;">${qty}x</td>
          <td style="padding: 2px 0; vertical-align: top;">${nameWrapped}</td>
          <td style="text-align: right; padding: 2px 0; vertical-align: top; white-space: nowrap; width: 50px;">₹${lineTotal}</td>
        </tr>
      `
    }).join('')

    const dateStr = order.createdAt?.seconds 
      ? new Date(order.createdAt.seconds * 1000).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
      : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    const total = Number(order.totalAmount || order.subtotal || 0).toFixed(0)
    const addr = order.address || order.customer?.address || {}
    const addressParts = [addr?.line1, addr?.line2, addr?.city].filter(Boolean)
    const addressStr = addressParts.length > 0 ? wrapText(addressParts.join(', '), 32) : ''
    const customerName = wrapText(String(order.customer?.name || order.name || 'Guest'), 32)
    const orderRef = String(order.orderNo || order.id || '').slice(-8)
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill #${orderRef}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', 'Courier', monospace; 
            font-size: 9pt;
            line-height: 1.3;
            width: 72mm;
            max-width: 72mm;
            margin: 0;
            padding: 4mm 2mm;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .small { font-size: 8pt; }
          .header { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #000; }
          .title { font-size: 11pt; font-weight: bold; margin-bottom: 3px; }
          .section { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          td { padding: 2px 0; vertical-align: top; word-wrap: break-word; }
          .totals { border-top: 1px dashed #000; padding-top: 6px; margin-top: 8px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; line-height: 1.2; }
          .footer { text-align: center; margin-top: 12px; font-size: 8pt; }
          @page { 
            size: 72mm auto;
            margin: 0;
          }
          @media print {
            body { 
              width: 72mm;
              max-width: 72mm;
              padding: 2mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="title">Venky's Cheat Mealz</div>
          <div class="small">Order #${orderRef}</div>
          <div class="small">${dateStr}</div>
        </div>
        
        <div class="section small">
          <div class="bold">${customerName}</div>
          ${order.customer?.phone || order.phone ? `<div>${order.customer?.phone || order.phone}</div>` : ''}
          ${addressStr ? `<div style="margin-top: 2px;">${addressStr}</div>` : ''}
        </div>
        
        <table>
          ${itemsHtml}
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span class="bold">₹${Number(order.subtotal || 0).toFixed(0)}</span>
          </div>
          ${order.deliveryFee ? `<div class="total-row"><span>Delivery:</span><span>₹${Number(order.deliveryFee).toFixed(0)}</span></div>` : ''}
          ${order.discount ? `<div class="total-row"><span>Discount:</span><span>-₹${Number(order.discount).toFixed(0)}</span></div>` : ''}
          <div class="total-row" style="font-size: 11pt; margin-top: 4px; padding-top: 4px; border-top: 1px solid #000;">
            <span class="bold">TOTAL:</span>
            <span class="bold">₹${total}</span>
          </div>
          <div class="total-row small" style="margin-top: 3px;">
            <span>Payment:</span>
            <span style="text-transform: uppercase;">${order.payment?.method || 'COD'}</span>
          </div>
          ${order.payment?.status === 'paid' ? '<div class="center small" style="margin-top: 3px;">✓ PAID</div>' : ''}
        </div>
        
        <div class="footer">
          Thank you for ordering!<br/>
          Visit us again 🍗
        </div>
        
        <script>
          setTimeout(() => {
            window.print();
          }, 300);
        </script>
      </body>
      </html>
    `
    w.document.write(html)
    w.document.close()
  }

  // ── Side-effects ──
  useEffect(() => {
    fetchAppSettings().then(s => {
      const to10 = (v) => {
        const digits = String(v || '').replace(/\D/g, '')
        const no91 = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
        return no91.length === 10 ? no91 : ''
      }

      const cm = Array.isArray(s?.cashManagerPhones) ? s.cashManagerPhones : []
      const cmList = cm.map(to10).filter(Boolean)
      setCashManagerPhones(cmList)

      const list = Array.isArray(s?.orderMessengerPhones) ? s.orderMessengerPhones : []
      setOrderMessengerPhones(list.map(to10).filter(Boolean))
    })
  }, [])

  useEffect(() => {
    // Wait for role to load before setting up listener
    if (!liveEnabled || roleLoading || !user || !isStaffMember) return undefined
    const qy = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qy, (snap) => {
      const newOrders = snap.docs
        .filter(d => !isCounterDocId(d.id))
        .map(d => ({ id: d.id, ...d.data() }))
      
      // Check for new placed orders
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const order = change.doc.data()
          // Skip counter documents
          if (isCounterDocId(change.doc.id)) return
          
          // Only notify for orders created very recently (e.g. last 1 minute) to avoid noise on reload
          // But 'added' in snapshot usually means new to the query. 
          // If we load 100 orders, all are 'added'. We need to distinguish initial load.
          // Actually, onSnapshot fires with all docs as 'added' initially.
          // We can check if the timestamp is very recent.
          const isRecent = order.createdAt?.toMillis ? (Date.now() - order.createdAt.toMillis() < 60000) : true
          
          if (order.status === 'placed' && isRecent) {
            // Play sound
            playNewOrderSound()

            const id = change.doc.id
            if (!id || notifiedRef.current.has(id)) return
            notifiedRef.current.add(id)

            // Notifications are intentionally handled at their source:
            // - Order messenger: sent by customer app when order is created
            // - Cash manager OTP: sent by admin biller when dine-in COD bill is created
          }
        }
      })
      setOrders(newOrders)
    }, (err) => {
      console.error('[Orders] onSnapshot error:', err)
    })
    return () => unsub()
  }, [liveEnabled, roleLoading, user, isStaffMember, cashManagerPhones, orderMessengerPhones, buildOrderMessengerData])

  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const result = await fetchAllOrders()
      setOrders(Array.isArray(result?.orders) ? result.orders : Array.isArray(result) ? result : [])
    } finally { setLoadingOrders(false) }
  }

  // ── Filtering & metrics ──
  const statusFlow = ['placed', 'preparing', 'ready', 'delivered']
  function statusColor(s) { return s==='placed'?'badge-info':s==='preparing'?'badge-warning':s==='ready'?'badge-success':s==='delivered'?'badge-neutral':s==='rejected'?'badge-error':'badge-ghost' }
  const baseFiltered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  function orderSearchText(o) { return [o.id,o.name,o.customer?.name,o.address?.name,o.phone,o.customer?.phone,o.address?.phone,o.contact?.phone].filter(Boolean).join(' ').toLowerCase() }
  const q = (orderSearch||'').trim().toLowerCase()
  const filteredOrders = q ? baseFiltered.filter(o => orderSearchText(o).includes(q) || (o.id||'').toLowerCase().includes(q)) : baseFiltered
  const metrics = statusFlow.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc }, { all: orders.length, rejected: orders.filter(o => o.status === 'rejected').length })

  async function acceptOrder(o) { 
    if (o.status !== 'placed') return; 
    try {
      // For dine-in COD orders, OTP (if present) must be verified before accepting.
      if (isDineInCod(o) && o.cashManagerOtp && !o.cashManagerOtpVerified) {
        openOtpModalForOrder(o)
        return
      }
      await updateOrder(o.userId || null, o.id, { status: 'preparing' }, user?.email); 
      // Deduct stock when order is accepted
      if (Array.isArray(o.items)) {
        deductStockForOrder(o.items).catch(err => console.error('Stock deduction failed', err))
      }
      setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'preparing' } : x)) 
    } catch (err) {
      console.error('[Orders] Failed to accept order:', o.id, err)
    }
  }
  async function rejectOrder(o) { if (o.status !== 'placed') return; await updateOrder(o.userId || null, o.id, { status: 'rejected' }, user?.email); setOrders(arr => arr.map(x => x.id === o.id ? { ...x, status: 'rejected' } : x)) }
  async function advanceOrder(o) { 
    const next = nextOrderStatus(o.status); 
    if (next === o.status) return; 
    await updateOrder(o.userId || null, o.id, { status: next }, user?.email); 
    setOrders((arr) => arr.map(x => x.id === o.id ? { ...x, status: next } : x))
    
    // Send Google review request if order just became delivered
    if (next === 'delivered' && o.status !== 'delivered') {
      const phone = o.customer?.phone || o.phone
      if (phone) {
        try {
          const settings = await fetchAppSettings()
          const googlePlaceId = settings.googlePlaceId
          if (googlePlaceId) {
            const reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
            const message = `Thank you for your order at Venky's Cheat Mealz! 🍽️\n\nWe hope you enjoyed your meal. Your feedback helps us improve! Please take a moment to share your experience:\n\n${reviewUrl}\n\nThank you! 😊`
            await sendWhatsAppInvoice(phone, { text: message })
          }
        } catch (err) {
          console.error('[Orders] Failed to send review request:', err)
        }
      }
    }
  }

  function progressPercent(s) { const idx = statusFlow.indexOf(s); if (idx === -1) return 0; return ((idx + 1) / statusFlow.length) * 100 }
  function toggleHistory(key, el) { const beforeTop = el?.getBoundingClientRect?.().top; setOpenHistoryKey(prev => (prev === key ? null : key)); requestAnimationFrame(() => { const afterTop = el?.getBoundingClientRect?.().top; if (typeof beforeTop === 'number' && typeof afterTop === 'number') { window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: 'auto' }) } }) }

  // If navigated from the Biller, auto-open the newly created order.
  useEffect(() => {
    const st = location?.state
    const highlightId = st?.highlightOrderId
    const autoOpen = !!st?.autoOpen
    if (!autoOpen || !highlightId || !orders.length) return
    const target = orders.find(o => o.id === highlightId || o.orderNo === highlightId)
    if (!target) return
    setSelectedOrder(target)
    setOrderModalOpen(true)
  }, [location, orders])

  // ── Render ──
  return (
    <AdminLayout section="orders">
      {otpModalOpen && otpModalOrder && (
        <dialog open className="modal modal-open z-[200]">
          <div className="modal-box z-[210]">
            <h3 className="font-bold text-lg">Verify OTP</h3>
            <p className="text-sm opacity-70 mt-1">Enter OTP to accept this dine-in COD order.</p>

            <div className="mt-4">
              <div className="text-xs opacity-60 mb-1">Order</div>
              <div className="font-mono text-sm">{otpModalOrder.orderNo || otpModalOrder.id}</div>
            </div>

            <div className="mt-4">
              <input
                className="input input-bordered w-full text-center font-mono text-xl tracking-widest"
                value={otpValue}
                onChange={(e) => {
                  const expectedLen = otpModalOrder?.cashManagerOtp ? String(otpModalOrder.cashManagerOtp).trim().length : 6
                  setOtpValue(e.target.value.replace(/\D/g, '').slice(0, Math.max(expectedLen, 4)))
                }}
                inputMode="numeric"
                placeholder="Enter OTP"
                autoFocus
              />
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                disabled={otpBusy || otpResendBusy}
                onClick={() => resendOtpForOrder(otpModalOrder)}
              >
                {otpResendBusy ? 'Resending…' : 'Resend OTP'}
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (otpBusy) return
                  setOtpModalOpen(false)
                  setOtpModalOrder(null)
                  setOtpValue('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={otpBusy || otpResendBusy}
                onClick={() => verifyOtpAndAccept(otpModalOrder, otpValue)}
              >
                {otpBusy ? 'Verifying…' : 'Verify & Accept'}
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop z-[205]"
            onClick={() => {
              if (otpBusy) return
              setOtpModalOpen(false)
              setOtpModalOrder(null)
              setOtpValue('')
            }}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight" style={{lineHeight:'1.1', color:'var(--color-base-content)'}}>
          Orders
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="hidden md:block" />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="join w-full md:w-80">
              <input className="input input-bordered join-item input-sm w-full" placeholder="Search id, name or phone" value={orderSearch} onChange={(e)=> setOrderSearch(e.target.value)} />
              {orderSearch && (<button className="btn btn-sm join-item" onClick={()=> setOrderSearch('')}>Clear</button>)}
            </div>
            <button className="btn btn-sm btn-outline" onClick={loadOrders} disabled={loadingOrders} title="Refresh">
              {loadingOrders ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="stat admin-surface-alt p-4"><div className="stat-title text-xs">Total</div><div className="stat-value text-lg">{metrics.all}</div></div>
          {statusFlow.map(s => (
            <div key={s} className="stat admin-surface-alt p-4"><div className="stat-title text-xs capitalize flex items-center gap-1"><span>{s}</span></div><div className="stat-value text-lg">{metrics[s]}</div></div>
          ))}
          <div className="stat admin-surface-alt p-4"><div className="stat-title text-xs capitalize">Rejected</div><div className="stat-value text-lg">{metrics.rejected}</div></div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', ...statusFlow, 'rejected'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`btn btn-xs ${statusFilter === f ? 'btn-primary' : 'btn-ghost'} rounded-full`}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>

        {/* Derived groups: Today and History */}
        {(() => {
          const today = new Date()
          function addDays(d, delta) { const x = new Date(d); x.setDate(x.getDate()+delta); return x }
          function dateKey(d) { const dt = d instanceof Date ? d : (d?.seconds ? new Date(d.seconds * 1000) : null); if (!dt) return 'unknown'; const y = dt.getFullYear(); const m = String(dt.getMonth()+1).padStart(2,'0'); const da = String(dt.getDate()).padStart(2,'0'); return `${y}-${m}-${da}` }
          const todayKey = dateKey(today); const yesterdayKey = dateKey(addDays(today, -1))
          const groups = new Map();
          filteredOrders.forEach(o => { const key = dateKey(o.createdAt); const arr = groups.get(key) || []; arr.push(o); groups.set(key, arr) })
          const orderedKeys = Array.from(groups.keys()).sort((a,b)=> a<b ? 1 : a>b ? -1 : 0)
          const renderCard = (o, frozen = false) => {
            const next = nextOrderStatus(o.status); const advanceDisabled = next === o.status
            const createdAt = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null
            const time24 = createdAt ? createdAt.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : null
            const isPos = (o.source || '').toLowerCase() === 'pos'
            const pct = progressPercent(o.status); const isDelivered = o.status === 'delivered'; const isRejected = o.status === 'rejected'
            const isActive = o.status === 'placed' || o.status === 'preparing'
            return (
              <div
                key={o.id}
                className={`card admin-panel group cursor-pointer transition overflow-hidden hover:border-primary/20 hover:shadow-xl ${isRejected ? 'opacity-70' : ''} ${isDelivered ? 'border-success/40 bg-success/10' : ''} ${isActive && !frozen ? 'order-card-active' : ''}`}
                onClick={() => { setSelectedOrder(o); setOrderModalOpen(true) }}
              >
                <div className="card-body p-4 gap-3">
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold tracking-wide">#{o.id.slice(-6)}</div>
                        <span className={`badge badge-ghost badge-xs ${isPos ? 'text-purple-600' : 'text-sky-600'}`} title={isPos ? 'Placed from Admin Biller (POS)' : 'Placed from Consumer App'}>{isPos ? 'Biller' : 'App'}</span>
                      </div>
                      <div className="text-[11px] opacity-60 flex gap-2">
                        {time24 && <span>{time24}</span>}
                        <span>{o.items?.length || 0} items</span>
                        <span>₹{o.subtotal}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge badge-sm ${statusColor(o.status)} capitalize`}>{o.status}</span>
                      {o.status === 'placed' && (
                        <div className="flex gap-1" onClick={(e)=> e.stopPropagation()}>
                          <button className="btn btn-xs btn-success" onClick={() => acceptOrder(o)} disabled={frozen} title={frozen ? 'Actions disabled for past orders' : 'Accept'}>Accept</button>
                          <button className="btn btn-xs btn-error" onClick={() => rejectOrder(o)} disabled={frozen} title={frozen ? 'Actions disabled for past orders' : 'Reject'}>Reject</button>
                        </div>
                      )}
                      {o.status !== 'placed' && o.status !== 'rejected' && (
                        <button className="btn btn-xs btn-primary" onClick={(e) => { e.stopPropagation(); if (!frozen) advanceOrder(o) }} disabled={advanceDisabled || frozen} title={frozen ? 'Actions disabled for past orders' : (advanceDisabled ? 'Final state reached' : `Advance to ${next}`)}>
                          {advanceDisabled ? 'Complete' : `Mark ${next}`}
                        </button>
                      )}
                    </div>
                  </div>
                  {o.status !== 'rejected' && (
                    <div className="mb-3">
                      <div className="h-1.5 w-full rounded-full bg-base-300/50 overflow-hidden">
                        <div className="order-progress-bar h-full bg-gradient-to-r from-primary to-secondary" style={{ width: pct + '%' }} />
                      </div>
                      <div className="flex justify-between mt-1">{statusFlow.map(s => (<span key={s} className={`flex-1 text-center text-[9px] tracking-wide uppercase ${o.status === s ? 'text-primary font-semibold' : 'opacity-40'}`}>{s[0]}</span>))}</div>
                    </div>
                  )}
                  <div className="text-[11px] flex flex-wrap gap-2">
                    {o.items?.slice(0,5).map((it, idx) => (<span key={it.id || `item-${idx}`} className="px-2 py-0.5 rounded-full bg-base-200/70 border border-base-300/60 group-hover:border-primary/50 transition">{it.name}×{it.qty}</span>))}
                    {o.items?.length > 5 && (<span className="opacity-60">+{o.items.length - 5} more</span>)}
                  </div>
                  {o.payment?.method && (<div className="mt-2 text-[10px] uppercase tracking-wide opacity-60">{o.payment.method}</div>)}
                  {(() => { const idx = statusFlow.indexOf(o.status); const pending = statusFlow.slice(idx + 1); if (!pending.length) return null; const nextMissing = pending[0]; return (
                    <div className="mt-2 text-[11px] text-warning flex items-center gap-1"><MdWarningAmber className="w-4 h-4" /><span>Not marked as {nextMissing} yet</span></div>
                  )})()}
                  <div className="pt-1 flex justify-end"><button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setOrderModalOpen(true) }}>View</button></div>
                </div>
              </div>
            )
          }

          const chunks = orderedKeys.reduce((acc, k) => { const list = groups.get(k) || []; if (k === todayKey) { acc.today = { placed: list.filter(o => o.status === 'placed'), preparing: list.filter(o => o.status === 'preparing'), ready: list.filter(o => o.status === 'ready'), delivered: list.filter(o => o.status === 'delivered'), rejected: list.filter(o => o.status === 'rejected') } } else { acc.history.push({ key: k, list }) } return acc }, { today: null, history: [] })
          return (
            <div className="space-y-6">
              {chunks.today && (
                <div>
                  <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-semibold">Today</h3><div className="text-xs opacity-60">{Object.values(chunks.today).reduce((n, arr)=> n + arr.length, 0)} orders</div></div>
                  {(['placed','preparing','ready','delivered','rejected']).map(bucket => { const arr = chunks.today[bucket]; if (!arr || arr.length === 0) return null; return (
                    <div key={bucket} className="mb-4"><div className="text-sm font-medium mb-2 capitalize flex items-center gap-2"><span className={`badge ${statusColor(bucket)} badge-sm`}></span><span>{bucket}</span><span className="opacity-60">({arr.length})</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{arr.map(o => renderCard(o))}</div></div>
                  )})}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-semibold">Order history</h3><span className="text-xs opacity-60">{chunks.history.reduce((n, g)=> n + g.list.length, 0)} orders</span></div>
                {chunks.history.length === 0 && <div className="opacity-60 text-sm">No previous days.</div>}
                <div className="space-y-3">
                  {chunks.history.map(g => { const title = g.key === yesterdayKey ? 'Yesterday' : new Date(g.key + 'T00:00:00').toLocaleDateString(); const open = openHistoryKey === g.key; return (
                    <div key={g.key} className={`collapse collapse-arrow admin-panel transition ${open ? 'ring-1 ring-primary/20' : ''}`}>
                      <input type="checkbox" checked={open} onChange={() => toggleHistory(g.key, historyHeaderRefs.current[g.key])} />
                      <div className="collapse-title text-sm font-medium flex items-center justify-between" ref={(el)=>{ if (el) historyHeaderRefs.current[g.key] = el }}>
                        <span>{title}</span>
                        <span className="badge badge-ghost badge-sm">{g.list.length}</span>
                      </div>
                      <div className="collapse-content"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{g.list.map(o => renderCard(o, true))}</div></div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {orderModalOpen && selectedOrder && (
        <dialog open className="modal modal-open z-[100]">
          <div className="modal-box z-[110]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Order #{selectedOrder.id.slice(-6)} 
                <span className={`badge ${statusColor(selectedOrder.status)} badge-sm capitalize`}>{selectedOrder.status}</span>
              </h3>
              <div className="text-xs opacity-60 font-mono">
                Placed: {selectedOrder.createdAt?.seconds ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
              </div>
            </div>
            
            <div className="space-y-6 text-sm">
              {/* Customer & Address Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-base-200/30 rounded-xl border border-base-200">
                <div className="flex items-start gap-4">
                   <div className="avatar">
                     <div className="w-16 h-16 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-2">
                       <img src={getAvatarUrl(selectedOrder.customer || { name: selectedOrder.name || 'Guest' })} alt="Avatar" />
                     </div>
                   </div>
                   <div className="min-w-0 flex-1">
                     <div className="font-bold text-lg">{selectedOrder.customer?.name || selectedOrder.name || 'Guest'}</div>
                     <button
                       className="text-lg font-mono text-primary hover:underline flex items-center gap-2 mt-1"
                       onClick={() => {
                         const phone = selectedOrder.customer?.phone || selectedOrder.phone;
                         if (phone && confirm(`Call ${phone}?`)) {
                           window.location.href = `tel:${phone}`;
                         }
                       }}
                     >
                       {selectedOrder.customer?.phone || selectedOrder.phone || 'No phone'} 📞
                     </button>
                     <div className="text-[10px] opacity-50 mt-1 break-all">ID: {selectedOrder.id}</div>
                   </div>
                </div>
                <div className="pl-0 md:pl-4 md:border-l border-base-300/50">
                  {(() => {
                    const addr = selectedOrder.address || selectedOrder.customer?.address || {}
                    const addressParts = [addr?.line1, addr?.line2, addr?.city, addr?.pin].filter(Boolean)
                    const hasAddress = addressParts.length > 0
                    const hasCoords = addr?.lat && addr?.lng
                    return (
                      <>
                        <div className="font-bold text-xs uppercase opacity-50 mb-1">Delivery Address</div>
                        <div className="text-xs leading-relaxed mb-2">
                          {hasAddress ? addressParts.join(', ') : 'No address provided'}
                        </div>
                        
                        {/* Explicit Lat/Lng Display */}
                        {(addr?.lat || addr?.lng) && (
                          <div className="text-[10px] font-mono opacity-60 mb-2 select-all">
                            Lat: {addr?.lat || 'N/A'}, Lng: {addr?.lng || 'N/A'}
                          </div>
                        )}

                        {hasCoords ? (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline btn-primary gap-1 w-full">
                            Open in Google Maps ↗
                          </a>
                        ) : (
                          <button disabled className="btn btn-xs btn-outline gap-1 w-full opacity-50">
                            No Location Coordinates
                          </button>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Embedded Map */}
              {(() => {
                const addr = selectedOrder.address || selectedOrder.customer?.address || {}
                if (!addr?.lat || !addr?.lng) return null
                return (
                  <div className="w-full h-64 rounded-xl overflow-hidden border border-base-300 shadow-inner bg-base-200 relative">
                     <iframe 
                       width="100%" 
                       height="100%" 
                       frameBorder="0" 
                       scrolling="no" 
                       marginHeight="0" 
                       marginWidth="0" 
                       src={`https://maps.google.com/maps?q=${addr.lat},${addr.lng}&z=15&output=embed`}
                       className="absolute inset-0"
                       title="Customer Location"
                     ></iframe>
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-1">Payment Details</div>
                  <div className="space-y-1 opacity-80">
                    <div className="text-lg font-bold">₹{selectedOrder.subtotal}</div>
                    <div className="badge badge-outline uppercase text-xs font-bold">{selectedOrder.payment?.method || 'COD'}</div>
                  </div>
                </div>
                <div>
                  {/* Timestamps moved to header, keeping update time here if needed or removing */}
                  {selectedOrder.updatedAt?.seconds && (
                    <div className="text-xs opacity-60 text-right">
                      Last updated: {new Date(selectedOrder.updatedAt.seconds * 1000).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {(() => { const idx = statusFlow.indexOf(selectedOrder.status); const pending = statusFlow.slice(idx + 1); if (!pending.length) return null; const nextMissing = pending[0]; return (
                <div className="alert alert-warning py-2 min-h-0"><div className="flex items-center gap-2"><MdWarningAmber className="w-5 h-5" /><span className="text-sm">Not marked as {nextMissing} yet</span></div></div>
              )})()}
              
              <div>
                <div className="font-medium mb-1">Items ({selectedOrder.items?.length || 0})</div>
                <div className="overflow-x-auto rounded border border-base-300/60">
                  <table className="table table-xs w-full">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td>
                            <div className="flex items-center gap-2">
                              {it.imageUrl && <img src={it.imageUrl} alt="" className="w-8 h-8 rounded object-cover bg-base-200" />}
                              <span className="font-medium">{it.name}</span>
                            </div>
                          </td>
                          <td className="text-right font-bold">{it.qty}</td>
                          <td className="text-right">₹{Number(it.rate ?? it.price) || 0}</td>
                          <td className="text-right">₹{(Number(it.rate ?? it.price) || 0) * (it.qty || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-action flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'placed' && (<><button className="btn btn-sm btn-success" onClick={() => { acceptOrder(selectedOrder) }}>Accept</button><button className="btn btn-sm btn-error" onClick={() => { rejectOrder(selectedOrder) }}>Reject</button></>)}
                {selectedOrder.status !== 'placed' && selectedOrder.status !== 'rejected' && nextOrderStatus(selectedOrder.status) !== selectedOrder.status && (<button className="btn btn-sm btn-primary" onClick={() => { advanceOrder(selectedOrder) }}>Mark {nextOrderStatus(selectedOrder.status)}</button>)}
                <button className="btn btn-sm btn-ghost gap-2 border-base-300" onClick={() => printOrderBill(selectedOrder)}>
                  <MdPrint className="w-4 h-4" /> Print Bill
                </button>
              </div>
              <button className="btn btn-sm" onClick={() => { setOrderModalOpen(false); setSelectedOrder(null) }}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => { setOrderModalOpen(false); setSelectedOrder(null) }}><button>close</button></form>
        </dialog>
      )}
      {/* Page-scoped Confirm Modal */}
      {confirmState && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-semibold text-lg mb-3">Confirm</h3>
            <div role="alert" className="alert alert-warning">
              <span className="whitespace-pre-wrap text-sm">{confirmState.message || 'Confirm action?'}</span>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => resolveConfirm(false)}>{confirmState.cancelText || 'Cancel'}</button>
              <button className="btn btn-error" onClick={() => resolveConfirm(true)}>{confirmState.confirmText || 'Delete'}</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => resolveConfirm(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}


    </AdminLayout>
  )
}

```

### Admin inventory/order side effects (venkys_admin/src/lib/data-inventory.js)
`$lang
// Raw materials / inventory management (admin)
import { collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, serverTimestamp, increment, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { logInventoryChange, sendLogEmail } from './auditLog'
import { fetchMenuCategories } from './data-menu'
import { normalizeWhatsappPhone, apiUrl, getAuthHeaders } from './data-common'

function normalizeMaterialName(name) {
  return String(name || '').trim()
}

function materialNameKey(name) {
  return normalizeMaterialName(name).toLowerCase().replace(/\s+/g, ' ')
}

async function assertUniqueMaterialName(name, ignoreId = null) {
  const key = materialNameKey(name)
  if (!key) throw new Error('Material name is required')
  const snap = await getDocs(collection(db, 'raw_materials'))
  const found = snap.docs.find(d => {
    if (ignoreId && d.id === ignoreId) return false
    const data = d.data() || {}
    const existingKey = data.nameKey || materialNameKey(data.name)
    return existingKey === key
  })
  if (found) throw new Error('Material with this name already exists')
}

export async function fetchRawMaterials() {
  try {
    const snap = await getDocs(collection(db, 'raw_materials'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('fetchRawMaterials failed', e)
    return []
  }
}

export async function saveRawMaterial(data, performedBy = 'admin') {
  const { id, ...rest } = data
  const normalizedName = normalizeMaterialName(rest?.name)
  if (!normalizedName) throw new Error('Material name is required')
  await assertUniqueMaterialName(normalizedName, id || null)
  const payload = { ...rest, name: normalizedName, nameKey: materialNameKey(normalizedName), updatedAt: serverTimestamp() }

  if (id) {
    const ref = doc(db, 'raw_materials', id)
    const beforeSnap = await getDoc(ref)
    const before = beforeSnap.exists() ? { id, ...beforeSnap.data() } : null

    await setDoc(ref, payload, { merge: true })

    const afterSnap = await getDoc(ref)
    const after = afterSnap.exists() ? { id, ...afterSnap.data() } : null

    await logInventoryChange('update', id, before, after, performedBy, {
      reason: 'Inventory item updated'
    }).catch(err => console.error('Failed to log inventory update:', err))

    return id
  } else {
    const ref = await addDoc(collection(db, 'raw_materials'), { ...payload, createdAt: serverTimestamp() })
    const newId = ref.id

    await logInventoryChange('create', newId, null, { id: newId, ...payload }, performedBy, {
      reason: 'New inventory item created'
    }).catch(err => console.error('Failed to log inventory creation:', err))

    return newId
  }
}

export async function deleteRawMaterial(id, performedBy = 'admin') {
  if (!id) return
  const ref = doc(db, 'raw_materials', id)
  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? { id, ...beforeSnap.data() } : null

  await deleteDoc(ref)

  await logInventoryChange('delete', id, before, null, performedBy, {
    reason: 'Inventory item deleted'
  }).catch(err => console.error('Failed to log inventory deletion:', err))
}

export async function updateRawMaterialStock(id, delta) {
  if (!id || !delta) return
  const ref = doc(db, 'raw_materials', id)
  await setDoc(ref, {
    stock: increment(Number(delta)),
    updatedAt: serverTimestamp()
  }, { merge: true })
}

// Deduct stock for accepted/confirmed orders using ingredient maps
export async function deductStockForOrder(orderItems) {
  if (!Array.isArray(orderItems) || !orderItems.length) return

  const categories = await fetchMenuCategories()
  const itemMap = new Map()
  categories.forEach(cat => {
    if (Array.isArray(cat.items)) {
      cat.items.forEach(item => {
        itemMap.set(item.name, item)
      })
    }
  })

  const batch = writeBatch(db)
  let hasUpdates = false
  const affectedMaterialIds = new Set()

  for (const orderItem of orderItems) {
    const menuName = orderItem.name || orderItem.itemName
    const qty = Number(orderItem.qty || orderItem.quantity || 1)
    const menuItem = itemMap.get(menuName)

    if (menuItem && Array.isArray(menuItem.ingredients)) {
      for (const ing of menuItem.ingredients) {
        if (ing.materialId && ing.quantity) {
          const deduction = Number(ing.quantity) * qty
          const ref = doc(db, 'raw_materials', ing.materialId)
          batch.update(ref, { stock: increment(-deduction) })
          affectedMaterialIds.add(ing.materialId)
          hasUpdates = true
        }
      }
    }
  }

  if (hasUpdates) {
    await batch.commit()
    // Check affected materials for low stock and send alerts
    checkLowStockAlerts([...affectedMaterialIds]).catch(err =>
      console.error('Low stock alert check failed:', err)
    )
  }
}

/**
 * Check materials against their alert thresholds and send email + WhatsApp alerts
 * for any that have dropped below the threshold.
 */
async function checkLowStockAlerts(materialIds) {
  if (!materialIds.length) return

  const lowItems = []
  for (const id of materialIds) {
    const snap = await getDoc(doc(db, 'raw_materials', id))
    if (!snap.exists()) continue
    const data = snap.data()
    const stock = Number(data.stock || 0)
    const threshold = Number(data.lowStockThreshold || 0)
    if (threshold > 0 && stock <= threshold) {
      lowItems.push({ id, name: data.name || id, stock, threshold, unit: data.unit || '' })
    }
  }

  if (!lowItems.length) return

  // Build alert message
  const lines = lowItems.map(m => `• ${m.name}: ${m.stock} ${m.unit} remaining (alert at ${m.threshold} ${m.unit})`)
  const message = `🚨 Low Stock Alert\n\nThe following items are running low:\n${lines.join('\n')}\n\nPlease restock soon.`

  // 1) Send email alert
  sendLogEmail('stock_low_alert', message, {
    items: lowItems.map(m => ({ name: m.name, stock: m.stock, threshold: m.threshold, unit: m.unit })),
  })

  // 2) Send WhatsApp alert to cash manager phones
  try {
    const { fetchAppSettings } = await import('./data-settings')
    const settings = await fetchAppSettings()
    const phones = Array.isArray(settings?.cashManagerPhones) ? [...settings.cashManagerPhones] : []

    if (phones.length > 0) {
      const headers = await getAuthHeaders()
      for (const phone of phones) {
        const normalized = normalizeWhatsappPhone(phone)
        if (!normalized) continue
        fetch(apiUrl('/api/send-whatsapp'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({
            phone: normalized,
            payload: {
              templateName: 'venkys_stock_alert',
              templateLanguage: 'en',
              components: [
                {
                  type: 'body',
                  parameters: lowItems.slice(0, 3).map(m => ({
                    type: 'text',
                    text: `${m.name}: ${m.stock} ${m.unit}`
                  }))
                }
              ],
              // Fallback: send as plain text if template doesn't exist
              fallbackText: message,
            }
          })
        }).catch(() => { /* silent */ })
      }
    }
  } catch {
    // WhatsApp alert is best-effort, don't block
  }
}

```

### Admin order data layer (venkys_admin/src/lib/data-orders.js)
`$lang
// Order-related data functions (admin)
import { collection, doc, getDocs, getDoc, query, where, setDoc, serverTimestamp, orderBy, runTransaction, increment, limit as fsLimit, startAfter, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from './firebase'
import { isCounterDocId, DAILY_COUNTER_DOC, formatUserSegment, normalizeWhatsappPhone, apiUrl, getAuthHeaders } from './data-common'
import { logOrderChange } from './auditLog'
import { fetchAppSettings } from './data-settings'
import { sendWhatsAppInvoice } from './data-whatsapp'

// ── Order number generation ──

// Generate a daily-reset order number
export async function generateDailyOrderNo(orderType = 'dine-in', userId = null) {
  const type = String(orderType || 'dine-in').toLowerCase()
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateKey = `${y}${m}${d}`
  const counterRef = doc(db, 'miscellaneous', DAILY_COUNTER_DOC)
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const data = snap.exists() ? snap.data() : {}
    const currentDateKey = data.currentDate || ''
    const currentTotal = currentDateKey === dateKey ? (Number(data.total) || 0) : 0
    const newTotal = currentTotal + 1
    tx.set(counterRef, {
      currentDate: dateKey,
      total: newTotal,
      lastOrderType: type,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return newTotal
  })
  const seq = String(next).padStart(4, '0')
  const segment = formatUserSegment(userId)
  return `${dateKey}-${seq}-${segment}`
}

export async function createOrder({
  userId = null,
  customer = {},
  items,
  orderType = 'delivery',
  source = 'web',
  orderNo = null,
  taxRate = null,
  taxAmount = null,
  totalAmount = null,
  status = 'placed',
  guestOrder = null,
  guestOrderDate = null,
  guestOrderAt = null,
  cashManagerOtp = null,
  cashManagerOtpFor = null,
  cashManagerOtpVerified = null,
  cashManagerOtpVerifiedAt = null,
  cashManagerOtpVerifiedBy = null,
} = {}) {
  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    throw new Error('Order must include at least one item')
  }

  const normalizedItems = safeItems.map((item, idx) => {
    const rate = Number(item?.rate ?? item?.price) || 0
    const qty = Number(item?.qty) || 0
    const total = Math.round(rate * qty)
    const normalized = {
      id: item?.id || `item-${idx + 1}`,
      name: String(item?.name || `Item ${idx + 1}`).trim(),
      rate,
      qty,
      total,
    }
    if (item?.mrp != null) normalized.mrp = Number(item.mrp) || null
    if (item?.discountPercent != null) normalized.discountPercent = Number(item.discountPercent) || null
    if (item?.variantLabel) normalized.variantLabel = String(item.variantLabel)
    if (item?.note) normalized.note = String(item.note)
    if (item?.modifiers) normalized.modifiers = item.modifiers
    return normalized
  })
  const subtotal = Math.round(normalizedItems.reduce((sum, it) => sum + (Number(it.total) || ((it.rate || 0) * it.qty)), 0))
  const normalizedTaxRate = typeof taxRate === 'number' ? taxRate : (taxRate != null ? Number(taxRate) : null)
  const normalizedTaxAmount = taxAmount != null ? Math.round(Number(taxAmount)) : (normalizedTaxRate != null ? Math.round(subtotal * normalizedTaxRate) : null)
  const resolvedTotalAmount = totalAmount != null ? Math.round(Number(totalAmount)) : Math.round(subtotal + (normalizedTaxAmount || 0))
  const resolvedOrderNo = orderNo || await generateDailyOrderNo(orderType, userId || customer?.servedBy || customer?.phone || null)

  const payment = (() => {
    const raw = customer?.payment && typeof customer.payment === 'object' ? customer.payment : {}
    return {
      method: raw.method || 'cod',
      status: raw.status || 'pending',
      reference: raw.reference || null,
      collectedBy: raw.collectedBy || null,
      collectedAt: raw.collectedAt || null,
      metadata: raw.metadata || null,
    }
  })()

  const customerPayload = {
    name: customer?.name ? String(customer.name).trim() : '',
    phone: customer?.phone ? String(customer.phone).trim() : '',
    address: customer?.address || '',
    instructions: customer?.instructions || '',
    landmark: customer?.landmark || '',
    servedBy: customer?.servedBy || '',
    table: customer?.table || '',
    payment,
  }
  if (customer?.email) customerPayload.email = String(customer.email).trim()
  if (customer?.geoHash) customerPayload.geoHash = customer.geoHash
  if (customer?.location) customerPayload.location = customer.location

  const statusActor = source === 'pos' ? 'pos' : (userId ? `user:${userId}` : 'guest')
  const nowTs = Timestamp.now()
  const normalizedStatus = String(status || 'placed').toLowerCase()
  const safeStatus = ['placed', 'preparing', 'ready', 'delivered', 'rejected'].includes(normalizedStatus) ? normalizedStatus : 'placed'

  const base = {
    userId: userId || null,
    customer: customerPayload,
    items: normalizedItems,
    subtotal,
    orderType,
    source,
    orderNo: resolvedOrderNo,
    status: safeStatus,
    statusHistory: [{ status: safeStatus, at: nowTs, actor: statusActor }],
    payment,
    totalAmount: resolvedTotalAmount,
    revisionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const normalizedOrderType = String(orderType || '').toLowerCase()
  const normalizedPayMethod = String(payment?.method || '').toLowerCase()
  const needsManagerOtp = normalizedOrderType === 'dine-in' && normalizedPayMethod === 'cod'
  if (needsManagerOtp) {
    const providedOtp = String(cashManagerOtp || '').trim()
    if (providedOtp) {
      base.cashManagerOtp = providedOtp
      base.cashManagerOtpFor = String(cashManagerOtpFor || 'dine-in-cod')
    } else {
      let otp = ''
      try {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          const buf = new Uint32Array(1)
          crypto.getRandomValues(buf)
          otp = String(buf[0] % 1000000).padStart(6, '0')
        } else {
          otp = String(Math.floor(100000 + Math.random() * 900000))
        }
      } catch {
        otp = String(Math.floor(100000 + Math.random() * 900000))
      }
      base.cashManagerOtp = otp
      base.cashManagerOtpFor = 'dine-in-cod'
    }
  }

  if (cashManagerOtpVerified != null) base.cashManagerOtpVerified = !!cashManagerOtpVerified
  if (cashManagerOtpVerifiedAt) base.cashManagerOtpVerifiedAt = cashManagerOtpVerifiedAt
  if (cashManagerOtpVerifiedBy) base.cashManagerOtpVerifiedBy = cashManagerOtpVerifiedBy
  if (guestOrder != null) base.guestOrder = !!guestOrder
  if (guestOrderDate) base.guestOrderDate = String(guestOrderDate)
  if (guestOrderAt) base.guestOrderAt = String(guestOrderAt)
  if (normalizedTaxRate != null) base.taxRate = normalizedTaxRate
  if (normalizedTaxAmount != null) base.taxAmount = normalizedTaxAmount

  const topRef = doc(db, 'orders', resolvedOrderNo)
  await setDoc(topRef, base)
  try { void notifyCashManagerOnOrder(resolvedOrderNo, base) } catch { /* noop */ }
  return resolvedOrderNo
}

// ── Notifications ──

async function notifyCashManagerOnOrder(orderId, orderPayload) {
  try {
    const settings = await fetchAppSettings()
    const phones = (Array.isArray(settings?.cashManagerPhones) ? settings.cashManagerPhones : [])
      .map((p) => normalizeWhatsappPhone(p)).filter(Boolean)
    if (!phones.length) return { __skipped: 'no_cash_manager_phone' }

    const orderNo = orderPayload?.orderNo || orderId
    const type = String(orderPayload?.orderType || '').toLowerCase()
    const method = String(orderPayload?.payment?.method || '').toLowerCase()
    const otp = orderPayload?.cashManagerOtp

    if (!(type === 'dine-in' && method === 'cod' && otp)) {
      return { __skipped: 'not_dinein_cod_or_missing_otp', orderNo }
    }

    const rawButtonParam = otp ? String(otp) : String(orderNo || '')
    const buttonParam = rawButtonParam.replace(/\s+/g, '').slice(0, 15)
    const templatePayload = {
      templateName: 'venkys_otp',
      templateLanguage: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(otp) },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: buttonParam }],
        },
      ]
    }
    const results = await Promise.allSettled(phones.map((p) => sendWhatsAppInvoice(p, templatePayload)))
    const ok = results.filter(r => r.status === 'fulfilled' && !r.value?.__error).length
    if (ok === 0) {
      const firstErr = results.find(r => r.status === 'fulfilled' && r.value?.__error)?.value
      try {
        console.warn('[OTP Template Failed]', JSON.stringify({
          error: firstErr?.__error,
          message: firstErr?.message,
          details: firstErr?.data?.error?.error_data?.details,
          template: { name: 'venkys_otp', language: 'en', bodyParamCount: 1, urlButtonIndex0Param: buttonParam }
        }, null, 2))
      } catch {}
      await Promise.allSettled(phones.map((p) => sendWhatsAppInvoice(p, { text: `OTP: ${otp}` })))
      return { __error: firstErr?.__error || 'template_failed', message: firstErr?.message || 'Template send failed' }
    }
    return { ok, total: phones.length }
  } catch (e) {
    return { __error: 'notify_failed', message: String(e) }
  }
}

// ── Order mutations ──

export async function updateOrder(userId, orderId, data = {}, actor = null) {
  if (!orderId) throw new Error('Missing orderId')
  const patch = (data && typeof data === 'object') ? { ...data } : {}

  let beforeState = null
  let afterState = null

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId)
    const requestedUserId = userId || null
    let orderSnap = await tx.get(orderRef)
    let legacyNestedRef = null

    if (!orderSnap.exists() && requestedUserId) {
      const nestedRef = doc(db, 'users', requestedUserId, 'orders', orderId)
      const nestedSnap = await tx.get(nestedRef)
      if (nestedSnap.exists()) {
        orderSnap = nestedSnap
        legacyNestedRef = nestedRef
      }
    }

    if (!orderSnap.exists()) throw new Error('Order not found')

    const prev = orderSnap.data() || {}
    beforeState = { id: orderId, ...prev }
    const resolvedUserId = requestedUserId || prev.userId || null
    const actorId = actor || (resolvedUserId ? `user:${resolvedUserId}` : 'admin')

    const updatePayload = { ...patch, updatedAt: serverTimestamp(), revisionCount: increment(1) }
    if (Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status !== prev.status) {
      updatePayload.statusHistory = arrayUnion({
        status: patch.status,
        note: patch.statusNote || null,
        actor: actorId,
        at: Timestamp.now(),
      })
    }
    delete updatePayload.statusNote
    afterState = { id: orderId, ...prev, ...updatePayload }

    if (legacyNestedRef) {
      tx.set(orderRef, { ...prev, ...updatePayload, userId: resolvedUserId || null }, { merge: true })
      try { tx.delete(legacyNestedRef) } catch { /* noop */ }
    } else {
      tx.set(orderRef, updatePayload, { merge: true })
    }
  })

  if (beforeState && afterState) {
    await logOrderChange('update', orderId, beforeState, afterState, actor || 'system', {
      userId,
      reason: `Order ${patch.status ? `status changed to ${patch.status}` : 'updated'}`
    }).catch(err => console.error('Failed to log order update:', err))
  }
}

// ── Order queries ──

export async function fetchOrder(userId, orderId) {
  const topSnap = await getDoc(doc(db, 'orders', orderId))
  if (topSnap.exists()) return { id: topSnap.id, ...topSnap.data() }
  if (userId) {
    const nestedSnap = await getDoc(doc(db, 'users', userId, 'orders', orderId))
    return nestedSnap.exists() ? { id: nestedSnap.id, ...nestedSnap.data() } : null
  }
  return null
}

export async function fetchAllOrders({ maxResults = 500, startDate = null, afterDoc = null } = {}) {
  try {
    const constraints = []
    if (startDate) {
      const ts = startDate instanceof Date ? Timestamp.fromDate(startDate) : startDate
      constraints.push(where('createdAt', '>=', ts))
    }
    constraints.push(orderBy('createdAt', 'desc'))
    if (afterDoc) constraints.push(startAfter(afterDoc))
    if (maxResults) constraints.push(fsLimit(maxResults))
    const snap = await getDocs(query(collection(db, 'orders'), ...constraints))
    const list = snap.docs
      .filter((d) => !isCounterDocId(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
    return {
      orders: list,
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: maxResults ? snap.docs.length >= maxResults : false,
    }
  } catch (err) {
    console.error('[firestore] fetchAllOrders failed', err)
    return { orders: [], lastDoc: null, hasMore: false, __error: 'other' }
  }
}

export async function fetchRecentOrders(limitCount = 10, sourceFilter = null) {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), fsLimit(Math.max(10, limitCount))))
    let list = snap.docs
      .filter((d) => !isCounterDocId(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
    if (sourceFilter) list = list.filter(o => (o.source || null) === sourceFilter)
    if (list.length > limitCount) list = list.slice(0, limitCount)
    return list
  } catch (err) {
    console.error('[firestore] fetchRecentOrders failed', err)
    return []
  }
}

export function nextOrderStatus(current) {
  const flow = ['placed', 'preparing', 'ready', 'delivered']
  const idx = flow.indexOf(current)
  return idx === -1 ? flow[0] : (idx < flow.length - 1 ? flow[idx + 1] : flow[idx])
}

export async function fetchLatestUserOrder(userId) {
  if (!userId) return null
  const orders = await fetchUserOrders(userId)
  return orders.length ? orders[0] : null
}

export async function fetchUserOrders(userId) {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId), fsLimit(100)))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => {
      const ta = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0)
      const tb = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0)
      return tb - ta
    })
    return list
  } catch (err) {
    try {
      const nested = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc')))
      return nested.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch {
      console.error('[firestore] fetchUserOrders failed:', err)
      return []
    }
  }
}

```

### Admin WhatsApp data layer (venkys_admin/src/lib/data-whatsapp.js)
`$lang
// WhatsApp messaging functions (admin)
import { normalizeWhatsappPhone, apiUrl, getAuthHeaders } from './data-common'

export async function sendWhatsAppInvoice(phone, payload) {
  try {
    const normalizedPhone = normalizeWhatsappPhone(phone)
    if (!normalizedPhone) {
      return { __skipped: 'missing_phone' }
    }
    const url = apiUrl('/api/send-whatsapp')
    const authHeaders = await getAuthHeaders()
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ phone: normalizedPhone, payload })
    })
    let body = null
    try { body = await res.json() } catch { /* ignore non-JSON responses */ }
    if (res.ok) {
      return body || {}
    }
    const errObj = { __error: 'http_error', status: res.status, ...(body || {}) }
    try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
    return errObj
  } catch (e) {
    const errObj = { __error: 'network', message: String(e) }
    try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
    return errObj
  }
}

// Template-based order notification via /api/send-order-messenger
export async function sendOrderMessengerViaWhatsApp(phone, { customerName, totalAmount, address } = {}) {
  try {
    const normalizedPhone = String(phone || '').replace(/\D/g, '')
    if (!normalizedPhone || normalizedPhone.length < 10) return { __skipped: 'missing_phone' }
    const url = apiUrl('/api/send-order-messenger')
    const authHeaders = await getAuthHeaders()
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        phone: normalizedPhone,
        customerName: String(customerName || '').trim(),
        totalAmount,
        address: String(address || '').trim(),
      }),
    })
    let body = null
    try { body = await res.json() } catch { /* ignore */ }
    if (res.ok) return body || {}
    const errObj = { __error: 'http_error', status: res.status, ...(body || {}) }
    try { console.warn('[order_messenger] send failed', JSON.stringify(errObj, null, 2)) } catch {}
    return errObj
  } catch (e) {
    return { __error: 'network', message: String(e) }
  }
}

// Send OTP via WhatsApp using template with plain-text fallback
export async function sendOtpViaWhatsApp(phone, otp, orderRef = '') {
  if (!phone) {
    return { __error: 'missing_phone' }
  }
  const rawButtonParam = otp ? String(otp) : String(orderRef || '')
  const buttonParam = rawButtonParam.replace(/\s+/g, '').slice(0, 15) || '0'
  const templatePayload = {
    templateName: 'venkys_otp',
    templateLanguage: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: String(otp) },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: buttonParam }],
      },
    ]
  }
  const res = await sendWhatsAppInvoice(phone, templatePayload)
  if (!res?.__error) {
    return res
  }
  const textMessage = orderRef
    ? `🔐 Dine-in COD OTP\nOrder: ${orderRef}\nOTP: ${otp}`
    : `🔐 Your OTP: ${otp}`
  return await sendWhatsAppInvoice(phone, { text: textMessage })
}

```

## 11. COMPONENT INVENTORY

### Customer components/pages
`$lang
- `src/components/AuthModal.jsx`: auth modal for login/signup flows.
- `src/components/CartDrawer.jsx`: slide-out cart review and checkout entry.
- `src/components/CategoriesBar.jsx`: category navigation bar with horizontal scrolling arrows.
- `src/components/ErrorBoundary.jsx`: global runtime fallback UI.
- `src/components/FilterBar.jsx`: veg/non-veg and sorting controls.
- `src/components/FloatingCartBar.jsx`: sticky cart CTA with subtotal and checkout button.
- `src/components/InstallPWA.jsx`: install prompt button for supported browsers.
- `src/components/ItemModal.jsx`: full item detail / variants modal with add-to-cart.
- `src/components/MenuItemCard.jsx`: product card with pricing, image, qty controls.
- `src/components/NavBar.jsx`: top navigation, search, auth, theme/cart affordances.
- `src/components/PolicyPage.jsx`: shared policy-page renderer.
- `src/components/ProfileCompletionAlert.jsx`: nudges signed-in users to complete profile/address data.
- `src/components/QuickDock.jsx`: bottom mobile navigation dock.
- `src/pages/About.jsx`: public about page.
- `src/pages/ActiveOrders.jsx`: live active-order tracking page.
- `src/pages/CancellationRefunds.jsx`: policy page.
- `src/pages/Checkout.jsx`: full checkout/payment/address/order placement flow.
- `src/pages/Contact.jsx`: contact info and WhatsApp/contact actions.
- `src/pages/Home.jsx`: core menu browsing/search/filter page.
- `src/pages/NotFound.jsx`: 404 page.
- `src/pages/Privacy.jsx`: privacy policy page.
- `src/pages/Profile.jsx`: profile, addresses, orders, reorder support.
- `src/pages/Shipping.jsx`: shipping/delivery policy page.
- `src/pages/Terms.jsx`: terms page.
```

### Admin components/pages
`$lang
- `src/components/AdminNav.jsx`: top navigation and utility controls for admin/POS.
- `src/components/AuthModal.jsx`: admin auth modal.
- `src/components/AuthSkeleton.jsx`: loading shell while auth/roles resolve.
- `src/components/ErrorBoundary.jsx`: admin-wide runtime fallback UI.
- `src/components/InstallPWA.jsx`: admin install prompt button.
- `src/pages/AdminBiller.jsx`: POS billing / dine-in order creation/editing.
- `src/pages/Analytics.jsx`: sales and operational analytics dashboard.
- `src/pages/Appearance.jsx`: menu ordering / spotlight configuration UI.
- `src/pages/AuditLogs.jsx`: audit log browser.
- `src/pages/Delivery.jsx`: mostly placeholder delivery dashboard.
- `src/pages/Inventory.jsx`: large menu/image/inventory/category management UI.
- `src/pages/Orders.jsx`: live order operations dashboard.
- `src/pages/Settings.jsx`: business settings, WhatsApp tests, staff management.
- `src/pages/StockManager.jsx`: focused raw-material stock manager.
```

## 12. BUILD & DEPLOYMENT CONFIG

### Customer vercel.json (venkys/vercel.json)
`$lang
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(self)" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/send-whatsapp", "destination": "/api/send-whatsapp.js" },
    { "source": "/api/:match*", "destination": "/api/:match*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "crons": [
    {
      "path": "/api/sync-business-profile",
      "schedule": "0 6 */2 * *"
    }
  ]
}

```

### Admin vercel.json (venkys_admin/vercel.json)
`$lang
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/send-whatsapp", "destination": "/api/send-whatsapp.js" },
    { "source": "/api/:match*", "destination": "/api/:match*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

```

### Customer firebase.json (venkys/firebase.json)
`$lang
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "site": "venkys-durgapur",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "cleanUrls": true,
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}

```

### Admin firebase.json (venkys_admin/firebase.json)
`$lang
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "site": "venkys-admin",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}

```

### Customer index.html (venkys/index.html)
`$lang
<!doctype html>
<html lang="en" data-theme="venkys_light">
  <head>
    <meta charset="UTF-8" />
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TP0M45QL81"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-TP0M45QL81');
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#facc15" />
    <meta name="description" content="Order delicious chicken dishes online from Venky's Chicken Xperience Durgapur. Fast delivery, dine-in & takeaway." />
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Venky's Chicken Xperience Durgapur" />
    <meta property="og:description" content="Order delicious chicken dishes online. Fast delivery, dine-in & takeaway." />
    <meta property="og:image" content="/icons/Logo.png" />
    <meta property="og:url" content="https://venkys.vercel.app/" />
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/icons/Logo.png" />
    <link rel="shortcut icon" type="image/png" href="/icons/Logo.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/Logo.png" />
    <title>Venky's Chicken Xperience Durgapur</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

### Admin index.html (venkys_admin/index.html)
`$lang
<!doctype html>
<html lang="en" data-theme="venkys_light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#facc15" />
    <meta name="description" content="Admin dashboard & POS for Venky's Chicken Xperience Durgapur. Manage orders, menu, staff and inventory." />
    <meta name="robots" content="noindex, nofollow" />
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/icons/Logo.png" />
    <link rel="shortcut icon" type="image/png" href="/icons/Logo.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/Logo.png" />
    <title>Venky's Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

### Deployment/build notes
`$lang
- Build command in both apps: `npm run build` -> `vite build`.
- Output directory in both apps: `dist/`.
- Firebase Hosting configs also point to `dist/`.
- Vercel rewrites all non-API routes to `index.html` for SPA behavior.
- Customer Vercel config also defines a cron hitting `/api/sync-business-profile` every 2 days at 06:00 UTC (`0 6 */2 * *`).
- No `Dockerfile`, `docker-compose`, `netlify.toml`, `.github/workflows/`, `Procfile`, `render.yaml`, or similar CI/CD config was found.
```

## 13. KNOWN ISSUES / TODOs

### TODO / FIXME / HACK / console usage
`$lang
venkys\api\create-order.js:97:    console.warn('[create-order] Price verification failed, allowing order:', err.message)
venkys\api\create-order.js:159:    console.error('create-order error', e)
venkys_admin\api\create-order.js:74:    console.error('create-order error', e)
venkys\PRICING_PAYMENT_DETAILS.txt:140:Note: The file contains a TODO security note: server should recompute/verify the amount from server-known cart data (do not trust client amount in production).
venkys_admin\api\verify-payment.js:65:    console.error('verify-payment error', e)
venkys\api\send-log-email.js:108:    console.error('Email send error:', error)
venkys_admin\api\send-log-email.js:108:    console.error('Email send error:', error)
venkys_admin\api\send-whatsapp.js:144:        console.error('[send-whatsapp] WA error', JSON.stringify(r.data))
venkys_admin\api\send-whatsapp.js:147:        console.error('[send-whatsapp] WA error (stringify failed)', err)
venkys\api\send-order-messenger.js:121:    console.error('[send-order-messenger] Error:', e)
venkys\api\send-whatsapp.js:141:      try { console.error('[send-whatsapp] WA error', JSON.stringify(r.data)) } catch {}
venkys_admin\api\lib\rateLimiter.js:164:      console.warn('[rateLimiter] Email notification failed:', response.status)
venkys_admin\api\lib\rateLimiter.js:167:    console.error('[rateLimiter] Failed to send email:', err.message)
venkys_admin\api\lib\rateLimiter.js:209:    console.error('[rateLimiter] Failed to log violation:', err.message)
venkys_admin\api\lib\rateLimiter.js:229:      console.warn('[rateLimiter] Kill switch activated')
venkys_admin\api\lib\rateLimiter.js:263:          .catch(err => console.error('[rateLimiter] Log error:', err))
venkys_admin\api\lib\rateLimiter.js:273:        console.warn('[rateLimiter] Redis error, falling back to in-memory:', redisErr.message)
venkys_admin\api\lib\rateLimiter.js:314:      .catch(err => console.error('[rateLimiter] Log error:', err))
venkys\api\lib\rateLimiter.js:167:      console.warn('[rateLimiter] Email notification failed:', response.status)
venkys\api\lib\rateLimiter.js:170:    console.error('[rateLimiter] Failed to send email:', err.message)
venkys\api\lib\rateLimiter.js:212:    console.error('[rateLimiter] Failed to log violation:', err.message)
venkys\api\lib\rateLimiter.js:232:      console.warn('[rateLimiter] Kill switch activated')
venkys\api\lib\rateLimiter.js:267:          .catch(err => console.error('[rateLimiter] Log error:', err))
venkys\api\lib\rateLimiter.js:278:        console.warn('[rateLimiter] Redis error, falling back to in-memory:', redisErr.message)
venkys\api\lib\rateLimiter.js:319:      .catch(err => console.error('[rateLimiter] Log error:', err))
venkys\api\sync-business-profile.js:178:    console.error('Sync business profile error:', error)
venkys\api\verify-payment.js:68:    console.error('verify-payment error', err)
venkys\api\wa-webhook.js:74:            console.log(`[wa-webhook] received ${messages.length} message(s)`)
venkys\api\wa-webhook.js:77:            console.log(`[wa-webhook] received ${statuses.length} status update(s)`)
venkys\api\wa-webhook.js:84:    console.error('[wa-webhook] error', e)
venkys\src\context\AuthContext.jsx:36:          console.warn('Failed to ensure user doc:', e)
venkys\src\context\UIContext.jsx:72:    console.warn('[UIContext] useUI called outside of provider – returning no-op fallback. Wrap app with <UIProvider/> to enable full functionality.')
venkys\src\components\ErrorBoundary.jsx:17:      console.error('[ErrorBoundary]', error, errorInfo)
venkys_admin\src\context\AuthContext.jsx:63:      console.error('[AuthContext] Role check failed:', err)
venkys_admin\src\main.jsx:30:  console.error('[Unhandled Rejection]', event.reason)
venkys_admin\src\layouts\AdminLayout.jsx:42:                    try { toast.action.onClick?.() } catch (err) { console.warn('[toast action] failed', err) }
venkys_admin\src\components\AdminNav.jsx:195:        console.error('Bluetooth connection error:', error)
venkys\src\pwa.js:13:    console.log('PWA installed')
venkys\src\main.jsx:34:  console.error('[Unhandled Rejection]', event.reason)
venkys_admin\src\lib\auditLog.js:29:      console.warn('[AuditLog] Email API returned', res.status, data)
venkys_admin\src\lib\auditLog.js:31:      console.warn('[AuditLog] Email skipped by API:', data.__skipped)
venkys_admin\src\lib\auditLog.js:34:    console.warn('[AuditLog] Email send failed:', err.message || err)
venkys_admin\src\lib\auditLog.js:122:    console.error('[AuditLog] Failed to log change:', error)
venkys_admin\src\components\ErrorBoundary.jsx:17:      console.error('[ErrorBoundary]', error, errorInfo)
venkys_admin\src\lib\data-cart.js:11:    console.warn('saveCart failed', e)
venkys_admin\src\pages\AdminBiller.jsx:247:        }).catch(err => console.warn('Failed to fetch images', err))
venkys_admin\src\pages\AdminBiller.jsx:537:           console.error('Online payment failed', e)
venkys_admin\src\pages\AdminBiller.jsx:640:               console.warn('WhatsApp invoice failed', res)
venkys_admin\src\pages\AdminBiller.jsx:644:            console.warn('WhatsApp invoice failed', e)
venkys_admin\src\pages\AdminBiller.jsx:654:      console.error('submitBill failed', e)
venkys\src\lib\data-cart.js:32:    console.warn('loadCart failed', e)
venkys\src\lib\data-cart.js:63:    console.warn('saveCart failed', e)
venkys_admin\src\lib\data-images.js:36:      console.warn('fetchImagesByIds failed for', id, e)
venkys_admin\src\lib\data-images.js:127:    console.warn('deleteImageById failed', imageId, e)
venkys_admin\src\lib\data-images.js:144:    console.error('removeCategoryImage failed', e)
venkys_admin\src\pages\AuditLogs.jsx:213:      console.error('Failed to load logs:', error)
venkys\src\lib\data-images.js:40:      console.warn('fetchImagesByIds failed for', id, e)
venkys_admin\src\lib\data-inventory.js:34:    console.error('fetchRawMaterials failed', e)
venkys_admin\src\lib\data-inventory.js:58:    }).catch(err => console.error('Failed to log inventory update:', err))
venkys_admin\src\lib\data-inventory.js:67:    }).catch(err => console.error('Failed to log inventory creation:', err))
venkys_admin\src\lib\data-inventory.js:83:  }).catch(err => console.error('Failed to log inventory deletion:', err))
venkys_admin\src\lib\data-inventory.js:135:      console.error('Low stock alert check failed:', err)
venkys_admin\src\lib\data-menu.js:40:    console.error('[firestore] fetchMenuCategories failed:', err)
venkys_admin\src\lib\data-menu.js:221:    console.error('[firestore] migrateRemoveCategoryNameFields failed', err)
venkys_admin\src\lib\data-menu.js:237:    console.error('[firestore] fetchMenuItems failed:', err)
venkys_admin\src\lib\data-menu.js:247:    console.error('[firestore] fetchItems failed:', err)
venkys\src\lib\data-orders.js:140:      console.warn('[orders] Skipping top-level order write due to permission-denied rule.')
venkys\src\lib\data-orders.js:194:        console.error('[notifyOrderMessengers] Error sending to', phone, e)
venkys\src\lib\data-orders.js:204:    console.error('[notifyOrderMessengers] Error:', e)
venkys\src\lib\data-orders.js:229:      try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
venkys\src\lib\data-orders.js:235:    try { console.warn('[wa] send failed', errObj) } catch {}
venkys\src\lib\data-orders.js:323:    console.error('[firestore] fetchAllOrders failed', err)
venkys\src\lib\data-orders.js:340:    console.error('[firestore] fetchRecentOrders failed', err)
venkys\src\lib\data-orders.js:373:        console.warn('[firestore] Orders read denied by rules for current user.', err)
venkys\src\lib\data-orders.js:377:    console.error('[firestore] fetchUserOrders failed:', err)
venkys\src\lib\data-menu.js:45:      console.warn('[firestore] Public read denied for menu. Update rules to allow read.', err)
venkys\src\lib\data-menu.js:48:    console.error('[firestore] fetchMenuCategories failed:', err)
venkys_admin\src\lib\data-payments.js:21:      console.error('[fetchPublicConfig] Failed:', errorMsg)
venkys_admin\src\lib\data-payments.js:28:    console.error('[fetchPublicConfig] Exception:', e)
venkys_admin\src\lib\data-payments.js:40:    console.error('[getRazorpayKeyId] Failed to fetch config:', e)
venkys_admin\src\lib\data-orders.js:220:        console.warn('[OTP Template Failed]', JSON.stringify({
venkys_admin\src\lib\data-orders.js:291:    }).catch(err => console.error('Failed to log order update:', err))
venkys_admin\src\lib\data-orders.js:327:    console.error('[firestore] fetchAllOrders failed', err)
venkys_admin\src\lib\data-orders.js:342:    console.error('[firestore] fetchRecentOrders failed', err)
venkys_admin\src\lib\data-orders.js:374:      console.error('[firestore] fetchUserOrders failed:', err)
venkys\src\pages\Checkout.jsx:363:      console.warn('[checkout] Order snapshot error:', err);
venkys\src\pages\Checkout.jsx:580:          console.warn('[checkout] reverseGeocode failed', err)
venkys\src\pages\Checkout.jsx:691:        console.warn('[checkout] geocode fallback failed', err)
venkys\src\pages\Checkout.jsx:994:             console.warn('Failed to send WhatsApp bill', err)
venkys\src\pages\Checkout.jsx:998:        console.warn('Error preparing WhatsApp bill', e)
venkys\src\pages\Checkout.jsx:1040:      console.error(e)
venkys\src\pages\Checkout.jsx:1146:            console.error('Failed to save address', e)
venkys\src\lib\data-settings.js:13:      try { await setDoc(ref, { ...fallback, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] appearance doc init failed', err) }
venkys\src\lib\data-settings.js:37:      try { await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] appearance spotlight backfill failed', err) }
venkys_admin\src\lib\data-settings.js:17:        console.warn('[firestore] unable to prime appearance doc', err)
venkys_admin\src\lib\data-settings.js:44:      try { await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] unable to backfill spotlight field', err) }
venkys_admin\src\lib\data-settings.js:48:    console.error('[firestore] fetchAppearanceSettings failed', e)
venkys_admin\src\lib\data-settings.js:211:  }).catch(err => console.error('Failed to log settings update:', err))
venkys\src\lib\data-user.js:50:    console.warn('fetchUserProfile failed', e)
venkys_admin\src\pages\Orders.jsx:87:      console.error('Audio beep failed', e)
venkys_admin\src\pages\Orders.jsx:144:        deductStockForOrder(o.items).catch(err => console.error('Stock deduction failed', err))
venkys_admin\src\pages\Orders.jsx:153:      console.error('[Orders] OTP accept failed:', err)
venkys_admin\src\pages\Orders.jsx:201:      console.error('[Orders] OTP resend failed:', err)
venkys_admin\src\pages\Orders.jsx:216:        console.error('[Orders] RawBT print failed', e)
venkys_admin\src\pages\Orders.jsx:425:      console.error('[Orders] onSnapshot error:', err)
venkys_admin\src\pages\Orders.jsx:458:        deductStockForOrder(o.items).catch(err => console.error('Stock deduction failed', err))
venkys_admin\src\pages\Orders.jsx:462:      console.error('[Orders] Failed to accept order:', o.id, err)
venkys_admin\src\pages\Orders.jsx:485:          console.error('[Orders] Failed to send review request:', err)
venkys_admin\src\lib\data-staff.js:26:    console.error('[firestore] fetchStaff failed', err)
venkys_admin\src\lib\data-staff.js:38:    console.error('[firestore] getStaffMember failed', err)
venkys_admin\src\pages\Inventory.jsx:398:      console.error(err)
venkys_admin\src\lib\data-user.js:78:    console.warn('fetchUserProfile failed', e)
venkys_admin\src\lib\data-whatsapp.js:23:    try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
venkys_admin\src\lib\data-whatsapp.js:27:    try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
venkys_admin\src\lib\data-whatsapp.js:53:    try { console.warn('[order_messenger] send failed', JSON.stringify(errObj, null, 2)) } catch {}
venkys\src\lib\firebase.js:18:    if (!val) console.warn(`[firebase] Missing env for ${key}`)
venkys\src\pages\Contact.jsx:24:      .catch(err => console.error('Error fetching contact data:', err))
venkys_admin\src\lib\deliverySettings.js:35:    console.warn('[deliverySettings] fetch failed', err)
venkys_admin\src\lib\firebase.js:17:    if (!val) console.warn(`[firebase] Missing env for ${key}`)
venkys\src\lib\google.js:136:    console.warn('geocodeAddress failed', e)
venkys\src\pages\Profile.jsx:127:      console.error('[profile] Real-time orders error:', err);
venkys\src\pages\Profile.jsx:145:      console.error('[profile] Failed to refresh orders', err);
venkys\src\pages\Profile.jsx:196:        console.error('[profile] Failed to load profile', err);
venkys\src\pages\Profile.jsx:217:        console.error('[profile] Failed to load addresses', err);
venkys\src\pages\Profile.jsx:377:          console.warn('[profile] geocode fallback failed', err)
venkys\src\lib\whatsapp.js:71:    console.warn('Cannot send WhatsApp bill: Missing order or customer phone')
venkys_admin\src\lib\storeStatus.js:28:    console.warn('[storeStatus] fetch failed', err)
```

### Potential commented-out code / suspicious commented blocks
`$lang
venkys_admin/src\sw.js:11:  try { await cache.addAll([...APP_SHELL, ...urls]) } catch { /* noop */ }
venkys_admin/src\components\InstallPWA.jsx:38:          } catch { /* noop */ }
venkys/src\sw.js:6:// This array is replaced at build time by vite-plugin-pwa (workbox-inject-manifest)
venkys/src\sw.js:16:  try { await cache.addAll([...APP_SHELL, ...urls]) } catch { /* noop */ }
venkys/src\hooks\usePlacesAutocomplete.js:30:    // Reuse existing instance if already attached to avoid duplicate listeners.
venkys/src\layouts\Layout.jsx:14:// Removed custom hook to avoid invalid hook call caused by duplicate React resolution in some setups.
venkys_admin/src\pages\Settings.jsx:529:            } catch { /* noop */ } finally { setAppSettingsLoading(false) }
venkys_admin/src\pages\Orders.jsx:85:      osc.onended = () => { try { ctx.close() } catch { /* noop */ } }
venkys_admin/src\lib\data-images.js:57:          try { store.removeItem(k) } catch { /* ignore */ }
venkys_admin/src\lib\data-images.js:59:      } catch { /* ignore */ }
venkys_admin/src\lib\data-images.js:61:  } catch { /* ignore */ }
venkys/src\components\FilterBar.jsx:67:                onClick={() => { onSortChange && onSortChange(opt.key); setOpen(false); try { toggleRef.current?.blur() } catch { /* noop */ } }}
venkys/src\components\MenuItemCard.jsx:37:    /* noop */
venkys/src\components\InstallPWA.jsx:56:          } catch { /* noop */ }
venkys/src\components\NavBar.jsx:26:  try { saved = localStorage.getItem('theme') } catch { /* noop */ }
venkys/src\components\NavBar.jsx:30:  try { cloud = await getUserTheme(user.uid) } catch { /* noop */ }
venkys/src\components\NavBar.jsx:37:  try { await setUserTheme(user.uid, next) } catch { /* noop */ }
venkys/src\components\NavBar.jsx:40:  try { localStorage.setItem('theme', next) } catch { /* noop */ }
venkys/src\components\NavBar.jsx:172:    try { inputRef.current?.blur() } catch { /* noop */ }
venkys/src\components\NavBar.jsx:320:                  try { localStorage.setItem('theme', next) } catch { /* noop */ }
venkys/src\components\NavBar.jsx:321:                  if (user) { try { await setUserTheme(user.uid, next) } catch { /* noop */ } }
venkys_admin/src\lib\data-orders.js:173:  try { void notifyCashManagerOnOrder(resolvedOrderNo, base) } catch { /* noop */ }
venkys_admin/src\lib\data-orders.js:281:      try { tx.delete(legacyNestedRef) } catch { /* noop */ }
venkys_admin/src\lib\data-payments.js:56:  try { body = await res.json() } catch { /* ignore */ }
venkys_admin/src\lib\data-payments.js:71:  try { body = await res.json() } catch { /* ignore */ }
venkys/src\pages\Checkout.jsx:910:            } catch { /* noop */ }
venkys/src\pages\Checkout.jsx:1007:            try { summary = await fetchOrder(null, orderIdValue) } catch { /* noop */ }
venkys/src\lib\data-orders.js:133:      try { void notifyOrderMessengers(base) } catch { /* noop */ }
venkys/src\lib\data-orders.js:187:        try { body = await res.json() } catch { /* ignore */ }
venkys/src\lib\data-orders.js:283:      try { tx.delete(legacyNestedRef) } catch { /* noop */ }
venkys/src\pages\Home.jsx:276:      // if (!location.state?.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' })
venkys/src\pages\Home.jsx:591:          } catch { /* noop */ }
venkys/src\lib\data-payments.js:25:  } catch { /* noop */ }
venkys_admin/src\lib\data-whatsapp.js:50:    try { body = await res.json() } catch { /* ignore */ }
venkys/src\lib\userData.js:19:    // await updateDoc(ref, { updatedAt: serverTimestamp() })
```

### Known issue highlights
`$lang
- `venkys/PRICING_PAYMENT_DETAILS.txt` contains a TODO-style security warning that the server should recompute/verify the amount from server-known cart data and not trust client amount in production.
- `venkys/src/pages/Profile.jsx` contains several implementation-artifact comments about removing duplicated blocks, suggesting risky manual edits left in the file.
- Both apps log heavily to console in production code paths, especially around payments, Firestore failures, WhatsApp, and rate limiter flows.
```

## 14. LIGHTHOUSE / PERFORMANCE HINTS

### Large image files
`$lang

 Length FullName                                                             
 ------ --------                                                             
5364887 D:\My projects\Venky's_Cheat_Mealz\venkys_admin\dist\icons\Logo.png  
5364887 D:\My projects\Venky's_Cheat_Mealz\venkys_admin\public\icons\Logo.png
5364887 D:\My projects\Venky's_Cheat_Mealz\venkys\dist\icons\Logo.png        
5364887 D:\My projects\Venky's_Cheat_Mealz\venkys\public\icons\Logo.png
```

### robots.txt / sitemap.xml search
`$lang

```

### Relevant img tag snippets
`$lang
    <article ref={cardRef} className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-base-300/25 bg-base-100 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_26px_48px_-20px_rgba(239,68,68,0.35)] cursor-pointer ${shakeActive ? 'animate-cart-shake' : ''}`} onClick={() => openItem(item)}>
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
      <div className="relative m-4 overflow-hidden rounded-2xl border border-base-300/20 bg-gradient-to-br from-base-200 via-base-100/60 to-base-100 cursor-pointer">
        <div className="relative aspect-[5/4] cursor-pointer">
          {img ? (
            <img
              src={img}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-base-content/40">

             return (
               <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition cursor-pointer active:scale-95 rounded-2xl">
                 <figure className="px-4 pt-4">
                   {imgUrl ? (
                     <img
                       src={imgUrl}
                       alt={cat.name}
                       className="rounded-xl h-32 w-full object-cover bg-base-200"
                       onError={() => setBrokenCatImages(prev => ({ ...prev, [cat.id]: true }))}
                     />
                   ) : (
                     <div className="rounded-xl h-32 w-full bg-base-200 grid place-items-center text-base-content/30">
                       <MdRestaurantMenu className="text-4xl" />
                     </div>
                   )}
                 </figure>
                 <div className="card-body items-center text-center p-4">
                   <h2 className="card-title text-sm">{cat.name}</h2>
                 </div>
               </div>
             )
          })}
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Sidebar Categories */}
          <div className="w-48 shrink-0 overflow-y-auto pr-2 hidden md:block border-r border-base-200">
            <button 
              className="btn btn-sm btn-ghost w-full justify-start mb-2 gap-2" 
              onClick={() => { setSelectedCategory(null); setQ('') }}
            >
              <MdKeyboardReturn /> All Categories
            </button>
            <div className="flex flex-col gap-1">
              {catsMeta.map(cat => {
                const isBroken = !!brokenCatImages[cat.id]
                const imgUrl = !isBroken ? (catImageUrls[cat.id] || null) : null
                const hasImage = !!imgUrl
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-sm justify-start text-left h-auto py-2 ${selectedCategory?.id === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <div className="avatar placeholder">
                      <div className="w-6 h-6 rounded bg-base-300 text-base-content/50">
                        {hasImage ? (
                          <img
                            src={imgUrl}
                            alt=""
                            className="object-cover"
                            onError={() => setBrokenCatImages(prev => ({ ...prev, [cat.id]: true }))}
                          />
                        ) : (
                          <span className="text-xs">{cat.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <span className="truncate flex-1">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="flex items-center gap-2 mb-4 md:hidden">
               <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedCategory(null); setQ('') }}>
                 <MdKeyboardReturn /> Back
               </button>
               <h3 className="font-bold text-lg truncate">{selectedCategory?.name || 'Search Results'}</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
               {(q ? filtered : (grouped.find(g => g.id === selectedCategory?.id)?.items || [])).map(it => {
                  const isBroken = !!brokenItemImages[it.id]
                  const imgUrl = !isBroken ? (itemImageUrls[it.id] || null) : null
                  const qty = bill[it.id]?.qty || 0
                  return (
                    <button key={it.id} type="button" className={`group relative rounded-lg border bg-base-100 p-2 text-left shadow-sm transition ${qty > 0 ? 'border-primary ring-1 ring-primary' : 'border-base-300 hover:border-primary/50'}`} onClick={() => addLine(it)}>
                      <div className="w-full aspect-[5/4] rounded-lg overflow-hidden bg-base-200 grid place-items-center relative">
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={() => setBrokenItemImages(prev => ({ ...prev, [it.id]: true }))}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center bg-base-200 text-base-content/20 ${imgUrl ? 'hidden' : 'flex'}`}>
                           <MdRestaurantMenu className="text-4xl" />

                                   }}
                                />
                                {/* Variant Image */}
                                <div className="z-10 relative flex items-center" onClick={e => e.stopPropagation()}>
                                  {group.imageId ? (
                                    <div className="tooltip" data-tip="Change image">
                                      <img 
                                        src={catImages[group.imageId] || ''} 
                                        alt="" 
                                        className="w-8 h-8 rounded border border-base-300 object-cover cursor-pointer hover:opacity-80"
                                        onClick={() => document.getElementById(`var-file-${group.id}`).click()}
                                      />
                                    </div>
                                  ) : (
                                    <button
```

### useEffect call sites
`$lang
venkys_admin/src\components\AuthModal.jsx:25:  useEffect(() => {
venkys_admin/src\components\InstallPWA.jsx:8:  useEffect(() => {
venkys_admin/src\context\AuthContext.jsx:70:  useEffect(() => {
venkys_admin/src\components\AdminNav.jsx:90:  useEffect(() => {
venkys_admin/src\components\AdminNav.jsx:99:  useEffect(() => {
venkys_admin/src\components\AdminNav.jsx:129:  useEffect(() => {
venkys_admin/src\components\AdminNav.jsx:138:  useEffect(() => {
venkys_admin/src\components\AdminNav.jsx:145:  useEffect(() => {
venkys_admin/src\components\AuthSkeleton.jsx:10:  useEffect(() => {
venkys_admin/src\components\AuthSkeleton.jsx:16:  useEffect(() => {
venkys_admin/src\pages\Analytics.jsx:47:  useEffect(() => {
venkys_admin/src\pages\Analytics.jsx:64:  useEffect(() => {
venkys_admin/src\pages\AdminBiller.jsx:166:  useEffect(() => {
venkys_admin/src\pages\AdminBiller.jsx:174:  useEffect(() => {
venkys_admin/src\pages\AdminBiller.jsx:254:  useEffect(() => {
venkys_admin/src\pages\AdminBiller.jsx:263:  useEffect(() => { refreshRecent() }, [])
venkys_admin/src\pages\AdminBiller.jsx:266:  useEffect(() => {
venkys_admin/src\pages\AdminBiller.jsx:304:  useEffect(() => {
venkys_admin/src\pages\AdminBiller.jsx:392:  useEffect(() => {
venkys/src\layouts\Layout.jsx:19:  useEffect(() => {
venkys/src\components\AuthModal.jsx:25:  useEffect(() => {
venkys_admin/src\pages\Appearance.jsx:68:  useEffect(() => {
venkys_admin/src\pages\Appearance.jsx:94:  useEffect(() => { fetchMenuCategories().then(setCategories).catch(()=>{}) }, [])
venkys_admin/src\pages\Appearance.jsx:95:  useEffect(() => {
venkys_admin/src\pages\Appearance.jsx:125:  useEffect(() => {
venkys_admin/src\pages\Appearance.jsx:144:  useEffect(() => {
venkys_admin/src\pages\AuditLogs.jsx:192:  useEffect(() => {
venkys_admin/src\pages\AuditLogs.jsx:270:  useEffect(() => {
venkys/src\components\CategoriesBar.jsx:46:  useEffect(() => {
venkys/src\components\CategoriesBar.jsx:58:  useEffect(() => {
venkys/src\components\CategoriesBar.jsx:72:  useEffect(() => {
venkys/src\components\CategoriesBar.jsx:87:  useEffect(() => {
venkys/src\hooks\useClickOutside.js:19:  useEffect(() => {
venkys/src\hooks\useDeliveryLocation.js:19:  useEffect(() => {
venkys/src\hooks\usePlacesAutocomplete.js:26:  useEffect(() => {
venkys/src\context\AuthContext.jsx:26:  useEffect(() => {
venkys/src\context\CartContext.jsx:86:  useEffect(() => {
venkys/src\context\CartContext.jsx:125:  useEffect(() => {
venkys/src\components\FilterBar.jsx:18:  useEffect(() => {
venkys/src\components\FilterBar.jsx:27:  useEffect(() => {
venkys/src\pages\ActiveOrders.jsx:149:  useEffect(() => {
venkys/src\pages\ActiveOrders.jsx:160:  useEffect(() => {
venkys/src\pages\ActiveOrders.jsx:213:  useEffect(() => {
venkys/src\components\InstallPWA.jsx:9:  useEffect(() => {
venkys/src\components\ItemModal.jsx:19:  useEffect(() => {
venkys/src\pages\Checkout.jsx:116:  useEffect(() => {
venkys/src\pages\Checkout.jsx:346:  useEffect(() => {
venkys/src\pages\Checkout.jsx:369:  useEffect(() => {
venkys/src\pages\Checkout.jsx:393:  useEffect(() => {
venkys/src\pages\Checkout.jsx:404:  useEffect(() => {
venkys/src\pages\Checkout.jsx:425:  useEffect(() => {
venkys/src\pages\Checkout.jsx:481:  useEffect(() => {
venkys/src\pages\Checkout.jsx:492:  useEffect(() => {
venkys/src\pages\Contact.jsx:16:  useEffect(() => {
venkys/src\pages\Home.jsx:21:  useEffect(() => {
venkys/src\pages\Home.jsx:63:  useEffect(() => {
venkys/src\pages\Home.jsx:80:  useEffect(() => {
venkys/src\pages\Home.jsx:203:  useEffect(() => {
venkys/src\pages\Home.jsx:215:  useEffect(() => {
venkys/src\pages\Home.jsx:241:  useEffect(() => {
venkys/src\pages\Home.jsx:260:  useEffect(() => {
venkys/src\pages\Home.jsx:305:  useEffect(() => {
venkys/src\pages\Home.jsx:519:  useEffect(() => {
venkys/src\pages\Home.jsx:557:  useEffect(() => {
venkys/src\pages\Home.jsx:567:  useEffect(() => {
venkys/src\pages\Home.jsx:573:  useEffect(() => {
venkys/src\components\NavBar.jsx:22:  useEffect(() => {
venkys/src\components\NavBar.jsx:44:  useEffect(() => {
venkys/src\components\NavBar.jsx:47:  useEffect(() => {
venkys/src\components\NavBar.jsx:79:  useEffect(() => {
venkys/src\components\NavBar.jsx:154:  useEffect(() => {
venkys/src\components\NavBar.jsx:203:  useEffect(() => {
venkys/src\components\MenuItemCard.jsx:50:  useEffect(() => {
venkys/src\pages\Profile.jsx:79:  useEffect(() => {
venkys/src\pages\Profile.jsx:95:  useEffect(() => {
venkys/src\pages\Profile.jsx:153:  useEffect(() => {
venkys/src\pages\Profile.jsx:204:  useEffect(() => {
venkys/src\pages\Profile.jsx:327:  useEffect(() => {
venkys_admin/src\pages\Inventory.jsx:63:  useEffect(() => {
venkys_admin/src\pages\Inventory.jsx:70:  useEffect(() => {
venkys_admin/src\pages\Inventory.jsx:77:  useEffect(() => {
venkys_admin/src\pages\Inventory.jsx:92:  useEffect(() => {
venkys_admin/src\pages\Inventory.jsx:107:  useEffect(() => {
venkys_admin/src\pages\Orders.jsx:369:  useEffect(() => {
venkys_admin/src\pages\Orders.jsx:386:  useEffect(() => {
venkys_admin/src\pages\Orders.jsx:495:  useEffect(() => {
venkys_admin/src\pages\Settings.jsx:54:  useEffect(() => {
venkys_admin/src\pages\Settings.jsx:61:  useEffect(() => {
venkys_admin/src\pages\Settings.jsx:103:  useEffect(() => {
venkys_admin/src\pages\Settings.jsx:113:  useEffect(() => {
venkys_admin/src\pages\StockManager.jsx:99:  useEffect(() => { loadData() }, [loadData])
```

### Lint results (hooks / unused vars / misc warnings) - customer
`$lang

> venkys@0.0.0 lint
> eslint .


D:\My projects\Venky's_Cheat_Mealz\venkys\api\lib\verifyAuth.js
  72:12  warning  'err' is defined but never used  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys\src\components\CategoriesBar.jsx
   8:9  warning  'navigate' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                         no-unused-vars
  55:6  warning  React Hook useEffect has a missing dependency: 'updateArrows'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\My projects\Venky's_Cheat_Mealz\venkys\src\components\MenuItemCard.jsx
  178:9  warning  'addBtnText' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys\src\context\CartContext.jsx
  58:22  warning  'openAuth' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys\src\lib\data-menu.js
  2:52  warning  'serverTimestamp' is defined but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys\src\pages\Checkout.jsx
    55:10  warning  'paymentStatusBadgeClass' is defined but never used. Allowed unused vars must match /^[A-Z_]/u                                                              no-unused-vars
    69:30  warning  'setQty' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                                      no-unused-vars
    69:38  warning  'remove' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                                      no-unused-vars
    98:10  warning  'latestOrderSummary' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                          no-unused-vars
   102:10  warning  'geoError' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                                    no-unused-vars
   164:6   warning  React Hook useCallback has missing dependencies: 'phoneRegex' and 'pinRegex'. Either include them or remove the dependency array                            react-hooks/exhaustive-deps
   207:6   warning  React Hook useCallback has missing dependencies: 'addressFields', 'contactFields', and 'paymentFields'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
   644:8   warning  'error' is defined but never used                                                                                                                           no-unused-vars
  1068:9   warning  'describePaymentMethod' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                       no-unused-vars
  1072:9   warning  'paymentIsOnline' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                             no-unused-vars
  1073:9   warning  'locationOutsideRegion' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                       no-unused-vars
  1076:9   warning  'invalidHint' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u                                                                 no-unused-vars
  1109:21  warning  'e' is defined but never used                                                                                                                               no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys\src\pages\Home.jsx
  410:9  warning  'totalActiveItems' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys\src\pages\Profile.jsx
  23:10  warning  'getProfileCompletion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

✖ 21 problems (0 errors, 21 warnings)
```

### Lint results (hooks / unused vars / misc warnings) - admin
`$lang

> venkys_admin@0.0.1 lint
> eslint .


D:\My projects\Venky's_Cheat_Mealz\venkys_admin\api\lib\verifyAuth.js
  72:12  warning  'err' is defined but never used  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\components\AdminNav.jsx
   4:10  warning  'doc' is defined but never used. Allowed unused vars must match /^[A-Z_]/u        no-unused-vars
   4:15  warning  'getDoc' is defined but never used. Allowed unused vars must match /^[A-Z_]/u     no-unused-vars
   4:23  warning  'updateDoc' is defined but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars
  11:10  warning  'db' is defined but never used. Allowed unused vars must match /^[A-Z_]/u         no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\lib\data-orders.js
  4:88  warning  'apiUrl' is defined but never used. Allowed unused vars must match /^[A-Z_]/u          no-unused-vars
  4:96  warning  'getAuthHeaders' is defined but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\lib\data-settings.js
  236:12  warning  'e' is defined but never used  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\lib\rawbtPrint.js
  13:3  warning  Unused eslint-disable directive (no problems were reported from 'no-unsafe-optional-chaining')

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\AdminBiller.jsx
   56:10  warning  'getLatestStatus' is defined but never used. Allowed unused vars must match /^[A-Z_]/u            no-unused-vars
   66:10  warning  'statusBadgeClass' is defined but never used. Allowed unused vars must match /^[A-Z_]/u           no-unused-vars
  105:10  warning  'loading' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u           no-unused-vars
  106:10  warning  'openCats' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u          no-unused-vars
  155:10  warning  'successPhone' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u      no-unused-vars
  157:10  warning  'showAllOrders' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u     no-unused-vars
  157:25  warning  'setShowAllOrders' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars
  158:10  warning  'allOrders' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u         no-unused-vars
  159:21  warning  'setViewOrder' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u      no-unused-vars
  161:10  warning  'appSettings' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u       no-unused-vars
  659:18  warning  'loadAllOrders' is defined but never used. Allowed unused vars must match /^[A-Z_]/u              no-unused-vars
  711:9   warning  'viewOrderHistory' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars
  712:9   warning  'viewOrderPayment' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\Analytics.jsx
  42:22  warning  'setCustomFrom' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars
  43:20  warning  'setCustomTo' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u    no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\Appearance.jsx
   31:9   warning  'scrollerRef' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u          no-unused-vars
  177:12  warning  'moveAppearance' is defined but never used. Allowed unused vars must match /^[A-Z_]/u                no-unused-vars
  449:9   warning  'applySpotlightPatch' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\AuditLogs.jsx
  57:9  warning  'parts' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\Delivery.jsx
  5:11  warning  'user' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\Inventory.jsx
  134:6  warning  React Hook useEffect has a missing dependency: 'categories'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\Orders.jsx
  11:150  warning  'sendOrderMessengerViaWhatsApp' is defined but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars
  35:12   warning  'normalizeWhatsappPhone' is defined but never used. Allowed unused vars must match /^[A-Z_]/u         no-unused-vars
  44:12   warning  'isOnlineOrder' is defined but never used. Allowed unused vars must match /^[A-Z_]/u                  no-unused-vars

D:\My projects\Venky's_Cheat_Mealz\venkys_admin\src\pages\StockManager.jsx
   63:11  warning  'user' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u     no-unused-vars
  275:18  warning  'quickUpdateStock' is defined but never used. Allowed unused vars must match /^[A-Z_]/u  no-unused-vars

✖ 35 problems (0 errors, 35 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

### Performance/accessibility findings
`$lang
- Extremely large image asset: `public/icons/Logo.png` is ~5.36 MB in both apps and is also copied into `dist/`; this is a very large favicon/app icon and should be optimized.
- No `robots.txt` or `sitemap.xml` exists for either app.
- Customer `index.html` has description + OG tags, but no canonical tag and no robots tag.
- Admin `index.html` has `robots noindex,nofollow`, but no OG tags or canonical tag.
- Alt tags:
  - customer menu card image uses meaningful `alt={item.name}`.
  - several admin images intentionally use empty `alt=""` for decorative/category thumbnails.
  - no obvious missing-alt cases were confirmed from the inspected snippets.
- Confirmed React Hook dependency warnings from lint:
  - customer `src/components/CategoriesBar.jsx`: missing `updateArrows` dependency.
  - customer `src/pages/Checkout.jsx`: missing dependencies in `useCallback` blocks.
  - admin `src/pages/Inventory.jsx`: missing `categories` dependency in `useEffect`.
```


End of audit.
