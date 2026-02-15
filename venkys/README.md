# 🍔 Venky's Cheat Mealz - Customer App

> A Progressive Web Application (PWA) for online food ordering, built with React 19 and Firebase. This is the customer-facing frontend where users browse the menu, manage their cart, and place orders with integrated payment processing.

---

## 📖 Table of Contents

1. [What is This App?](#-what-is-this-app)
2. [System Architecture Overview](#-system-architecture-overview)
3. [Features Overview](#-features-overview)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [Pages Explained](#-pages-explained)
9. [Components Explained](#-components-explained)
10. [Context Providers](#-context-providers)
11. [Hooks](#-hooks)
12. [Library Functions](#-library-functions)
13. [API Routes](#-api-routes)
14. [How Things Work](#-how-things-work)
15. [Data Models](#-data-models)
16. [Deployment](#-deployment)
17. [Troubleshooting](#-troubleshooting)

---

## 🎯 What is This App?

This is the **Customer-Facing Application** of the Venky's Cheat Mealz food ordering system. It serves as the digital storefront where customers can:

1. **Browse the menu** - View food items organized by categories with images, descriptions, and pricing
2. **Manage a shopping cart** - Add, remove, and adjust quantities of items
3. **Authenticate** - Create accounts and sign in using Email/Password, Google OAuth, or Phone OTP
4. **Place orders** - Complete checkout with online payment (Razorpay) or Cash on Delivery
5. **Track orders** - View real-time order status updates
6. **Manage profile** - Save delivery addresses and personal information

### How This App Fits in the System

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VENKY'S CHEAT MEALZ SYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐          ┌─────────────────┐                   │
│  │  CUSTOMER APP   │          │   ADMIN APP     │                   │
│  │  (This App)     │          │ (venkys_admin/) │                   │
│  │                 │          │                 │                   │
│  │  • Browse Menu  │          │  • Manage Menu  │                   │
│  │  • Place Orders │◄────────►│  • View Orders  │                   │
│  │  • Track Status │          │  • Update Status│                   │
│  │  • User Profile │          │  • Analytics    │                   │
│  └────────┬────────┘          └────────┬────────┘                   │
│           │                            │                            │
│           └────────────┬───────────────┘                            │
│                        │                                            │
│                        ▼                                            │
│           ┌─────────────────────────┐                               │
│           │    FIREBASE BACKEND     │                               │
│           ├─────────────────────────┤                               │
│           │ • Firestore (Database)  │                               │
│           │ • Auth (User Accounts)  │                               │
│           │ • Storage (Images)      │                               │
│           └─────────────────────────┘                               │
│                        │                                            │
│           ┌────────────┴────────────┐                               │
│           │                         │                               │
│           ▼                         ▼                               │
│  ┌─────────────────┐     ┌─────────────────┐                        │
│  │ VERCEL FUNCTIONS│     │  RAZORPAY API   │                        │
│  │ (Serverless)    │     │  (Payments)     │                        │
│  │                 │     │                 │                        │
│  │ • create-order  │     │ • Process UPI   │                        │
│  │ • verify-payment│     │ • Process Cards │                        │
│  │ • send-whatsapp │     │ • Verify Sigs   │                        │
│  └─────────────────┘     └─────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Why Two Apps?**
- The **Customer App** is public-facing, optimized for browsing and ordering
- The **Admin App** is staff-only, optimized for order management and business operations
- Both apps share the same Firebase backend, ensuring data consistency

---

## 🏗️ System Architecture Overview

### Frontend Architecture

The application follows a **component-based architecture** using React 19 with the following layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Pages (Home, Checkout, Profile, ActiveOrders, etc.)        ││
│  │  └─ Composed of reusable Components                         ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                        STATE MANAGEMENT                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  React Context Providers                                    ││
│  │  ├─ AuthContext (User authentication state)                 ││
│  │  ├─ CartContext (Shopping cart state + persistence)         ││
│  │  └─ UIContext (Modal states, toasts, UI flags)              ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                        DATA ACCESS LAYER                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Library Functions (src/lib/)                               ││
│  │  ├─ data.js (Firestore CRUD operations)                     ││
│  │  ├─ userData.js (User profile operations)                   ││
│  │  ├─ firebase.js (SDK initialization)                        ││
│  │  └─ deliverySettings.js (Geo-validation)                    ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ├─ Firebase (Auth + Firestore + Storage)                   ││
│  │  ├─ Razorpay (Payment Gateway)                              ││
│  │  ├─ Google Places API (Address Autocomplete)                ││
│  │  └─ Vercel Serverless Functions (Backend APIs)              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Pattern

The application uses a **unidirectional data flow**:

1. **User Action** → Component triggers an action (e.g., "Add to Cart")
2. **Context Update** → Context provider processes the action and updates state
3. **Side Effects** → State change triggers persistence (localStorage or Firestore)
4. **Re-render** → React re-renders affected components with new state

---

## ✨ Features Overview

### Customer-Facing Features

| Feature | Description | Implementation Details |
|---------|-------------|------------------------|
| 🍕 **Menu Browsing** | Hierarchical menu organized by categories | Fetched from Firestore `menu` collection, cached locally |
| 🔍 **Search** | Real-time search across all menu items | Client-side filtering with debounced input (300ms) |
| 🏷️ **Filters** | Veg/Non-Veg toggle, price-based sorting | Implemented in `FilterBar.jsx`, applied in `Home.jsx` |
| 🛒 **Shopping Cart** | Persistent cart with quantity management | `CartContext` with dual persistence (localStorage + Firestore) |
| 💳 **Payments** | UPI, Card, Net Banking, COD | Razorpay SDK integration with server-side verification |
| 📍 **Address Management** | Save/edit multiple delivery addresses | Stored in user's Firestore document |
| 👤 **Authentication** | Email/Password, Google OAuth, Phone OTP | Firebase Auth with multiple providers |
| 📱 **PWA Support** | Installable, works offline | Service Worker + Web App Manifest |
| 🔔 **Order Tracking** | Real-time status updates | Firestore real-time listeners (`onSnapshot`) |
| ⭐ **Spotlight Sections** | Hot Deals, Chef's Specials | Configurable from Admin app, stored in `appearance` doc |

### Technical Features

| Feature | What It Does | Why It Matters |
|---------|--------------|----------------|
| ⚡ **Vite Build** | Sub-second HMR, optimized production bundles | Faster development, better user experience |
| 📱 **Service Worker** | Caches static assets for offline access | App works without internet, faster repeat visits |
| 🔒 **Payment Verification** | HMAC-SHA256 signature validation | Prevents payment fraud and replay attacks |
| 🗄️ **Real-time Database** | Firestore with live listeners | Instant order status updates without polling |
| 🔐 **Secure Auth** | Firebase Authentication | Industry-standard security, no password storage |
| 📲 **WhatsApp Integration** | Order notifications via WhatsApp Cloud API | High delivery rate, customers prefer WhatsApp |

---

## 🛠️ Tech Stack

### Core Technologies

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| **React** | 19.x | UI Framework | Component-based architecture, large ecosystem, excellent performance with concurrent features |
| **Vite** | 7.x | Build Tool | 10x faster than Webpack, native ES modules, instant HMR |
| **Firebase** | 11.x | Backend-as-a-Service | Real-time database, built-in auth, no server maintenance required |
| **Razorpay** | SDK | Payment Gateway | Leading Indian payment gateway, supports UPI/Cards/Net Banking, easy integration |

### Frontend Libraries

| Library | Purpose | How It's Used |
|---------|---------|---------------|
| **Tailwind CSS** | Utility-first CSS framework | All styling via utility classes, no custom CSS files needed |
| **daisyUI** | Tailwind component library | Pre-built components (buttons, modals, cards) with theme support |
| **React Router** | Client-side routing | SPA navigation between pages without full page reloads |
| **React Icons** | Icon library | Consistent iconography across the app (Material Design icons) |

### Backend Services

| Service | Purpose | How It's Used |
|---------|---------|---------------|
| **Firebase Auth** | User authentication | Email/password, Google OAuth, Phone OTP verification |
| **Firestore** | NoSQL database | Stores menu, orders, user profiles, settings |
| **Firebase Storage** | File storage | Menu item images, category images |
| **Vercel Functions** | Serverless backend | API routes for payment processing, WhatsApp integration |
| **Google Places API** | Address autocomplete | Suggests addresses as user types, provides geocoding |
| **WhatsApp Cloud API** | Notifications | Order confirmations, status updates to customers |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and error detection |
| **PostCSS** | CSS processing (used by Tailwind) |
| **Firebase CLI** | Deployment and emulator |
| **Vercel CLI** | API function deployment |

---

## 📁 Project Structure

```
venkys/
├── api/                    # 🌐 Backend API functions (run on Vercel)
│   ├── lib/                # Helper functions for APIs
│   │   └── rateLimiter.js  # Prevents too many requests
│   ├── create-order.js     # Creates Razorpay payment order
│   ├── verify-payment.js   # Verifies payment was successful
│   ├── send-whatsapp.js    # Sends WhatsApp messages
│   ├── send-order-messenger.js # Notifies staff of new orders
│   ├── wa-webhook.js       # Receives WhatsApp replies
│   ├── public-config.js    # Public settings endpoint
│   ├── send-log-email.js   # Sends email notifications
│   ├── sync-business-profile.js # Syncs Google Business data
│   └── health.js           # Health check endpoint
│
├── public/                 # 📂 Static files served as-is
│   └── icons/              # App icons for PWA
│
├── src/                    # 📱 Main application code
│   ├── assets/             # Static data files
│   │   └── menu.json       # Fallback menu data
│   │
│   ├── components/         # 🧩 Reusable UI pieces
│   │   ├── NavBar.jsx      # Top navigation bar
│   │   ├── CategoriesBar.jsx # Category filter bar
│   │   ├── FilterBar.jsx   # Veg/Non-veg filters
│   │   ├── MenuItemCard.jsx # Individual food item card
│   │   ├── ItemModal.jsx   # Popup when clicking an item
│   │   ├── CartDrawer.jsx  # Side panel showing cart
│   │   ├── FloatingCartBar.jsx # Bottom bar showing cart summary
│   │   ├── AuthModal.jsx   # Login/Signup popup
│   │   ├── ProfileCompletionAlert.jsx # Reminds to complete profile
│   │   ├── InstallPWA.jsx  # "Add to Home Screen" prompt
│   │   ├── QuickDock.jsx   # Quick action buttons
│   │   ├── Footer.jsx      # Page footer
│   │   └── PolicyPage.jsx  # Reusable policy page template
│   │
│   ├── context/            # 🔄 Global state managers
│   │   ├── AuthContext.jsx # Who is logged in?
│   │   ├── CartContext.jsx # What's in the cart?
│   │   └── UIContext.jsx   # UI state (modals, toasts)
│   │
│   ├── hooks/              # 🎣 Custom React hooks
│   │   ├── useDeliveryLocation.js # Manages delivery address
│   │   └── usePlacesAutocomplete.js # Google Places suggestions
│   │
│   ├── layouts/            # 📐 Page layouts
│   │   └── Layout.jsx      # Main app layout wrapper
│   │
│   ├── lib/                # 📚 Utility functions
│   │   ├── firebase.js     # Firebase configuration
│   │   ├── data.js         # Database operations
│   │   ├── userData.js     # User profile operations
│   │   ├── deliverySettings.js # Delivery zone settings
│   │   ├── google.js       # Google API helpers
│   │   ├── imageCache.js   # Image caching utilities
│   │   └── whatsapp.js     # WhatsApp API helpers
│   │
│   ├── pages/              # 📄 Full pages
│   │   ├── Home.jsx        # Main menu page
│   │   ├── Checkout.jsx    # Payment & address page
│   │   ├── Profile.jsx     # User profile page
│   │   ├── ActiveOrders.jsx # Order tracking page
│   │   ├── SearchPage.jsx  # Search results page
│   │   ├── About.jsx       # About us page
│   │   ├── Contact.jsx     # Contact info page
│   │   ├── Privacy.jsx     # Privacy policy
│   │   ├── Terms.jsx       # Terms & conditions
│   │   ├── Shipping.jsx    # Delivery policy
│   │   ├── CancellationRefunds.jsx # Refund policy
│   │   └── NotFound.jsx    # 404 error page
│   │
│   ├── services/           # 🔧 External services
│   │   └── location.js     # Location/GPS services
│   │
│   ├── App.jsx             # Main app component
│   ├── App.css             # Global styles
│   ├── main.jsx            # App entry point
│   ├── index.css           # Base CSS
│   ├── brand.js            # Brand constants
│   ├── pwa.js              # PWA registration
│   └── sw.js               # Service worker
│
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
├── eslint.config.js        # Code linting rules
├── firebase.json           # Firebase hosting config
├── firestore.rules         # Database security rules
└── vercel.json             # Vercel deployment config
```

---

## 🚀 Getting Started

### Prerequisites (What you need first)

1. **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js) - A package manager
3. **Git** - For version control - [Download here](https://git-scm.com/)
4. A **Firebase** account - [Sign up free](https://firebase.google.com/)
5. A **Razorpay** account - [Sign up here](https://razorpay.com/)
6. A **Vercel** account - [Sign up free](https://vercel.com/)

### Step-by-Step Setup

#### Step 1: Get the Code
```bash
# Navigate to your projects folder
cd "D:\My projects\Venky's_Cheat_Mealz"

# Go into the customer app folder
cd venkys
```

#### Step 2: Install Dependencies
```bash
# This downloads all the required packages
npm install
```
This is like gathering all the ingredients before cooking. It might take a few minutes.

#### Step 3: Set Up Environment Variables
Create a file called `.env` in the `venkys` folder with these settings:

```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Razorpay (from Razorpay Dashboard)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# Google Places (from Google Cloud Console)
VITE_GOOGLE_PLACES_API_KEY=your_google_api_key

# API URL (where your backend APIs are hosted)
VITE_API_BASE_URL=https://your-app.vercel.app

# WhatsApp Cloud API (from Meta Business)
WA_PHONE_NUMBER_ID=your_whatsapp_phone_id
WA_ACCESS_TOKEN=your_whatsapp_access_token

# CORS Settings
CORS_ORIGIN=https://your-domain.com,http://localhost:5173
```

#### Step 4: Run the App
```bash
# Start the development server
npm run dev
```

Open your browser and go to `http://localhost:5173` - You should see the app! 🎉

---

## 🔐 Environment Variables

Here's what each environment variable does:

### Firebase Variables (for database and login)

| Variable | Purpose | Where to Find |
|----------|---------|---------------|
| `VITE_FIREBASE_API_KEY` | Identifies your app to Firebase | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domain for authentication | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Your unique project ID | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Where images are stored | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | For push notifications | Same as above |
| `VITE_FIREBASE_APP_ID` | Unique app identifier | Same as above |

### Razorpay Variables (for payments)

| Variable | Purpose | Where to Find |
|----------|---------|---------------|
| `VITE_RAZORPAY_KEY_ID` | Public key shown to customers | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_ID` | Same key for backend | Same as above |
| `RAZORPAY_KEY_SECRET` | Secret key (NEVER share!) | Same as above (click "Show") |

### WhatsApp Variables (for notifications)

| Variable | Purpose | Where to Find |
|----------|---------|---------------|
| `WA_PHONE_NUMBER_ID` | Your WhatsApp Business number ID | Meta Business Suite → WhatsApp → API Setup |
| `WA_ACCESS_TOKEN` | Authentication token | Same as above |

---

## 📄 Pages Explained

### 1. Home Page (`/`)
**File:** `src/pages/Home.jsx`

This is the main page customers see when they open the app.

**What it shows:**
- 🔥 **Spotlight Section** - Hot deals and chef's specials at the top
- 📂 **Categories** - Horizontal scrolling bar to filter by food type
- 🍕 **Menu Items** - Grid of all food items with images, prices, and "Add to Cart" buttons
- 🔍 **Search & Filters** - Search bar and veg/non-veg filter

**How it works:**
1. When the page loads, it fetches all menu items from Firebase
2. Items are grouped by category (Burgers, Pizzas, etc.)
3. Clicking an item opens the Item Modal with more details
4. Clicking "Add to Cart" adds the item to your cart

### 2. Checkout Page (`/checkout`)
**File:** `src/pages/Checkout.jsx`

This is where customers complete their order.

**What it shows:**
- 🛒 **Cart Summary** - All items in cart with quantities and prices
- 📍 **Delivery Address** - Option to add/select delivery address
- 💳 **Payment Options** - UPI, Card, Net Banking, or Cash on Delivery
- ✅ **Order Button** - Final button to place the order

**How it works:**
1. Checks if user is logged in (if not, shows login prompt)
2. User enters/selects delivery address
3. User chooses payment method:
   - **Online Payment**: Opens Razorpay checkout, verifies payment, then creates order
   - **Cash on Delivery**: Creates order immediately, pay when food arrives
4. On success, clears cart and shows confirmation

### 3. Profile Page (`/profile`)
**File:** `src/pages/Profile.jsx`

User's personal information and settings.

**What it shows:**
- 👤 **User Info** - Name, email, phone number
- 📍 **Saved Addresses** - List of delivery addresses
- 📜 **Order History** - Past orders with status

**How it works:**
1. Fetches user data from Firebase
2. User can edit their name and phone number
3. User can add/edit/delete delivery addresses
4. Shows all past orders with details

### 4. Active Orders Page (`/active-orders`)
**File:** `src/pages/ActiveOrders.jsx`

Track orders that are being prepared or delivered.

**What it shows:**
- 📦 **Order Cards** - Each active order with status
- ⏱️ **Timeline** - Order progress (Placed → Preparing → Out for Delivery → Delivered)
- 📍 **Delivery Details** - Address where food is being delivered

**How it works:**
1. Fetches orders with status NOT "delivered" or "cancelled"
2. Updates in real-time using Firebase listeners
3. Shows estimated time and current status

### 5. Search Page (`/search`)
**File:** `src/pages/SearchPage.jsx`

Search results when customer types in the search bar.

**What it shows:**
- 🔍 **Search Results** - Items matching the search query
- 🏷️ **Filters** - Refine search results

### 6. Policy Pages
- **About** (`/about`) - Information about the restaurant
- **Contact** (`/contact`) - Contact information and location map
- **Privacy** (`/privacy`) - Privacy policy
- **Terms** (`/terms`) - Terms of service
- **Shipping** (`/shipping`) - Delivery/shipping policy
- **Cancellation & Refunds** (`/cancellation`) - Refund policy

### 7. 404 Page (`/*`)
**File:** `src/pages/NotFound.jsx`

Shows when someone visits a page that doesn't exist.

---

## 🧩 Components Explained

### NavBar (`NavBar.jsx`)
The top bar you see on every page.

**What it does:**
- Shows the restaurant logo
- Shows search icon
- Shows user avatar (or login button if not logged in)
- Shows cart icon with item count

### CategoriesBar (`CategoriesBar.jsx`)
The horizontal scrolling bar with category buttons.

**What it does:**
- Shows all food categories (Burgers, Pizzas, etc.)
- Click a category to jump to that section
- Currently selected category is highlighted

### FilterBar (`FilterBar.jsx`)
Quick filters for the menu.

**What it does:**
- Toggle between "All", "Veg Only", "Non-Veg Only"
- Filter by price range
- Sort by price or popularity

### MenuItemCard (`MenuItemCard.jsx`)
Individual card showing one food item.

**What it shows:**
- 📷 Food image
- 📝 Name and description
- 💰 Price (with discount if any)
- 🟢/🔴 Veg/Non-Veg indicator
- ➕ Add to cart button (or quantity selector if already in cart)

### ItemModal (`ItemModal.jsx`)
Popup that appears when you click on a food item.

**What it shows:**
- Large image of the food
- Full description
- All available variants (sizes, options)
- Customization options
- Quantity selector
- Add to cart button

### CartDrawer (`CartDrawer.jsx`)
Side panel that slides out showing your cart.

**What it shows:**
- All items in cart
- Quantity controls for each item
- Remove button for each item
- Subtotal
- "Proceed to Checkout" button

### FloatingCartBar (`FloatingCartBar.jsx`)
The bar at the bottom of the screen showing cart summary.

**What it shows:**
- Number of items in cart
- Total amount
- "View Cart" button

### AuthModal (`AuthModal.jsx`)
Login/Signup popup.

**What it does:**
- Switch between Login and Signup tabs
- Email + Password authentication
- Google Sign-In button
- Phone number OTP authentication
- Shows error messages if login fails

### ProfileCompletionAlert (`ProfileCompletionAlert.jsx`)
Banner reminding user to complete their profile.

**When it shows:**
- User is logged in but hasn't set their phone number
- Clicking it opens the profile page

### InstallPWA (`InstallPWA.jsx`)
"Add to Home Screen" prompt for mobile users.

**What it does:**
- Detects if the app can be installed
- Shows install button
- Guides user through installation

### Footer (`Footer.jsx`)
Bottom section of every page.

**What it shows:**
- Links to policy pages
- Social media links
- Copyright information

---

## 🔄 Context Providers

Context providers are like a shared memory that all parts of the app can access.

### AuthContext (`AuthContext.jsx`)
**Purpose:** Manages who is logged in.

**What it provides:**
- `user` - The currently logged in user (or null)
- `loading` - Whether we're still checking login status
- `login(email, password)` - Function to log in
- `signup(email, password, name)` - Function to create account
- `logout()` - Function to log out
- `loginWithGoogle()` - Google sign-in
- `sendOtp(phone)` - Send OTP to phone
- `verifyOtp(code)` - Verify the OTP code

### CartContext (`CartContext.jsx`)
**Purpose:** Manages the shopping cart.

**What it provides:**
- `items` - Object containing all cart items
- `entries` - Array version of items for easy looping
- `subtotal` - Total price of all items
- `totalQty` - Total number of items
- `add(item, qty)` - Add item to cart
- `remove(id)` - Remove item from cart
- `setQty(id, qty)` - Change item quantity
- `clear()` - Empty the cart

**Special Features:**
- **Guest Cart**: If not logged in, cart is saved in browser's localStorage
- **Cloud Sync**: If logged in, cart is saved to Firebase
- **Merge on Login**: When you log in, guest cart merges with your saved cart

### UIContext (`UIContext.jsx`)
**Purpose:** Manages UI state like popups and notifications.

**What it provides:**
- `openAuth()` / `closeAuth()` - Open/close login modal
- `openCart()` / `closeCart()` - Open/close cart drawer
- `pushToast(message, type)` - Show notification message

---

## 🎣 Hooks

Hooks are reusable pieces of logic.

### useDeliveryLocation
**Purpose:** Manages the selected delivery address.

**What it does:**
- Loads saved addresses from user profile
- Validates if address is within delivery zone
- Calculates delivery fee based on distance

### usePlacesAutocomplete
**Purpose:** Provides address suggestions as you type.

**What it does:**
- Connects to Google Places API
- Returns address suggestions
- Gets full address details when selected

---

## 📚 Library Functions

### firebase.js
Sets up Firebase connection.

```javascript
// Exports:
export { auth }     // For authentication
export { db }       // For database
export { storage }  // For file storage
```

### data.js
All database operations for menu and orders.

**Key Functions:**

| Function | What it Does |
|----------|--------------|
| `fetchMenuCategories()` | Gets all categories and their items from database |
| `fetchOrders(userId)` | Gets all orders for a user |
| `createOrder(orderData)` | Creates a new order in database |
| `loadCart(userId)` | Loads user's saved cart |
| `saveCart(userId, items)` | Saves cart to database |
| `fetchAppSettings()` | Gets app settings (phone numbers, address) |

### userData.js
User profile operations.

**Key Functions:**

| Function | What it Does |
|----------|--------------|
| `ensureUserDocument(user)` | Creates user profile if doesn't exist |
| `updateUserProfile(uid, data)` | Updates user's name, phone, etc. |
| `addAddress(uid, address)` | Adds a new delivery address |
| `removeAddress(uid, addressId)` | Deletes an address |

### deliverySettings.js
Delivery zone configuration.

**Key Functions:**

| Function | What it Does |
|----------|--------------|
| `fetchDeliverySettings()` | Gets delivery zone settings |
| `isWithinDeliveryZone(lat, lng)` | Checks if address is deliverable |
| `calculateDeliveryFee(distance)` | Calculates delivery charge |

### whatsapp.js
WhatsApp notification functions.

**Key Functions:**

| Function | What it Does |
|----------|--------------|
| `sendOrderConfirmation(order)` | Sends order confirmation to customer |
| `notifyOrderMessengers(order)` | Notifies staff about new order |

---

## 🌐 API Routes

These are backend functions that run on Vercel's servers.

### POST `/api/create-order`
**Purpose:** Creates a Razorpay payment order.

**Request:**
```json
{
  "amount": 450,
  "cartChecksum": "abc123"
}
```

**Response:**
```json
{
  "orderId": "order_ABC123",
  "amount": 45000,
  "currency": "INR"
}
```

### POST `/api/verify-payment`
**Purpose:** Verifies that a payment was successful.

**Request:**
```json
{
  "orderId": "order_ABC123",
  "paymentId": "pay_XYZ789",
  "signature": "signature_string"
}
```

**Response:**
```json
{
  "valid": true
}
```

### POST `/api/send-whatsapp`
**Purpose:** Sends a WhatsApp message.

**Request:**
```json
{
  "phone": "9876543210",
  "template": "hello_world",
  "language": "en_US"
}
```

### POST `/api/send-order-messenger`
**Purpose:** Notifies staff about a new order via WhatsApp.

**Request:**
```json
{
  "phone": "9876543210",
  "customerName": "John",
  "total": "450",
  "address": "123 Main St"
}
```

### GET `/api/health`
**Purpose:** Checks if the API is working.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET `/api/public-config`
**Purpose:** Gets public configuration settings.

### POST `/api/wa-webhook`
**Purpose:** Receives incoming WhatsApp messages.

### POST `/api/sync-business-profile`
**Purpose:** Syncs data from Google Business Profile.

### POST `/api/send-log-email`
**Purpose:** Sends email notifications for errors/logs.

---

## ⚙️ How Things Work

### How Ordering Works (Step by Step)

```
1. Customer browses menu
   └─→ Home.jsx fetches menu from fetchMenuCategories()

2. Customer adds item to cart
   └─→ CartContext updates, saves to localStorage/Firebase

3. Customer goes to checkout
   └─→ Checkout.jsx loads, shows cart summary

4. Customer enters address
   └─→ usePlacesAutocomplete suggests addresses
   └─→ Address validated against delivery zone

5. Customer chooses payment method:
   
   ┌─ If ONLINE PAYMENT:
   │  └─→ Frontend calls /api/create-order
   │  └─→ Razorpay checkout opens
   │  └─→ Customer completes payment
   │  └─→ Frontend calls /api/verify-payment
   │  └─→ If verified, order created in Firebase
   │
   └─ If CASH ON DELIVERY:
      └─→ Order created directly in Firebase

6. Order is saved
   └─→ createOrder() saves to Firestore

7. Staff is notified
   └─→ /api/send-order-messenger sends WhatsApp

8. Customer tracks order
   └─→ ActiveOrders.jsx shows real-time status
```

### How Authentication Works

```
User clicks "Login"
       ↓
AuthModal opens
       ↓
User chooses method:
├── Email/Password → Firebase signInWithEmailAndPassword
├── Google → Firebase signInWithPopup (Google)
└── Phone → Firebase signInWithPhoneNumber + OTP
       ↓
On success → AuthContext.user is set
       ↓
UI updates to show logged-in state
```

### How Cart Syncing Works

```
┌─────────────────────────────────────────────┐
│           GUEST USER (Not Logged In)        │
├─────────────────────────────────────────────┤
│  Cart ←→ localStorage (browser storage)     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            LOGGED-IN USER                   │
├─────────────────────────────────────────────┤
│  Cart ←→ Firebase Firestore (cloud)         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           WHEN USER LOGS IN                 │
├─────────────────────────────────────────────┤
│  1. Load cloud cart                         │
│  2. Load localStorage cart                  │
│  3. Merge both (add quantities)             │
│  4. Save merged cart to cloud               │
│  5. Clear localStorage                      │
└─────────────────────────────────────────────┘
```

### How Payments Work

```
┌──────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Customer clicks "Pay Now"                                   │
│           │                                                  │
│           ▼                                                  │
│  Frontend sends amount to /api/create-order                  │
│           │                                                  │
│           ▼                                                  │
│  Vercel function creates Razorpay order                      │
│  Returns: orderId, amount, currency                          │
│           │                                                  │
│           ▼                                                  │
│  Frontend opens Razorpay Checkout popup                      │
│  Customer enters UPI/Card details                            │
│           │                                                  │
│           ▼                                                  │
│  On success, Razorpay returns:                               │
│  - orderId, paymentId, signature                             │
│           │                                                  │
│           ▼                                                  │
│  Frontend sends these to /api/verify-payment                 │
│           │                                                  │
│           ▼                                                  │
│  Vercel function verifies signature using HMAC-SHA256        │
│  Returns: { valid: true } or { valid: false }                │
│           │                                                  │
│           ▼                                                  │
│  If valid → Create order in Firestore                        │
│  If invalid → Show error, don't create order                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## � Data Models

Understanding the database structure is essential for working with this application. All data is stored in Firebase Firestore.

### Firestore Collections Overview

```
firestore/
├── menu/                    # Menu categories and items
│   └── {categoryId}/        # e.g., "Burgers", "Pizzas"
│       ├── name: string
│       ├── imageId: string?
│       └── items: array[MenuItem]
│
├── orders/                  # Customer orders
│   └── {orderId}/
│       ├── userId, status, items, total, ...
│
├── users/                   # User profiles
│   └── {userId}/
│       ├── displayName, phone, addresses, ...
│
├── carts/                   # Persistent shopping carts
│   └── {userId}/
│       └── items: object
│
├── images/                  # Image metadata
│   └── {imageId}/
│       ├── data: base64
│       ├── mime: string
│
├── appearance/              # UI customization
│   └── settings/
│       ├── spotlight: object
│
└── miscellaneous/           # App-wide settings
    └── settings/
        ├── open: boolean
        ├── shopAddress, shopPhone, ...
```

### MenuItem Schema

Each menu item stored in a category's `items` array:

```typescript
interface MenuItem {
  name: string;                    // "Cheese Burger"
  rate: number;                    // Selling price (e.g., 99)
  mrp?: number;                    // Maximum retail price (e.g., 120)
  discountPercent?: number;        // Calculated or explicit discount
  desc?: string;                   // Item description
  veg: boolean;                    // true = vegetarian, false = non-veg
  active: boolean;                 // Whether item is available
  imageId?: string;                // Reference to images collection
  rating?: number;                 // Average rating (1-5)
  components?: Component[];        // Customizable components
  isCustom?: boolean;              // Whether item is customizable
  variants?: Variant[];            // Size/flavor variants
}

interface Variant {
  name: string;                    // "Half", "Full", "Tandoori"
  rate: number;
  mrp?: number;
  discountPercent?: number;
  sizes?: Size[];                  // Nested sizes for multi-level variants
  imageId?: string;                // Variant-specific image
}
```

### Order Schema

```typescript
interface Order {
  id: string;                      // Auto-generated order ID
  userId: string;                  // Firebase Auth UID
  customerName: string;
  customerPhone: string;
  
  // Items purchased (snapshot at time of order)
  items: Array<{
    id: string;
    name: string;
    rate: number;
    qty: number;
  }>;
  
  // Pricing
  subtotal: number;                // Sum of (rate * qty) for all items
  deliveryFee: number;
  total: number;                   // subtotal + deliveryFee
  
  // Delivery
  address: {
    fullAddress: string;
    lat: number;
    lng: number;
  };
  
  // Payment
  paymentMethod: 'online' | 'cod';
  paymentStatus: 'paid' | 'pending' | 'failed';
  razorpayOrderId?: string;        // Only for online payments
  razorpayPaymentId?: string;
  
  // Status tracking
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 
          'out_for_delivery' | 'delivered' | 'cancelled';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### User Schema

```typescript
interface User {
  uid: string;                     // Firebase Auth UID
  email?: string;
  displayName?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  photoURL?: string;
  
  // Role (for admin app access)
  role?: 'customer' | 'staff' | 'admin' | 'superAdmin';
  pages?: string[];                // For staff: which pages they can access
  
  // Delivery addresses
  addresses?: Address[];
  defaultAddressId?: string;
  
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

interface Address {
  id: string;                      // Generated UUID
  label?: string;                  // "Home", "Work", etc.
  fullAddress: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}
```

### Cart Schema (Firestore)

```typescript
// Stored in carts/{userId}
interface CartDocument {
  items: {
    [itemId: string]: {
      id: string;
      name: string;
      rate: number;
      qty: number;
      mrp?: number;
      imageId?: string;
    }
  };
  updatedAt: Timestamp;
}
```

### Pricing Logic

The pricing system follows these rules:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRICING CALCULATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STORED IN DATABASE:                                        │
│  • rate (selling price) - ALWAYS stored                     │
│  • mrp (maximum retail price) - Optional                    │
│  • discountPercent - Optional (can be derived)              │
│                                                             │
│  DISPLAY LOGIC:                                             │
│                                                             │
│  If discountPercent is explicitly set:                      │
│    → Use it directly (e.g., 10%)                            │
│    → Recalculate MRP: mrp = rate / (1 - discount/100)       │
│                                                             │
│  If discountPercent is NOT set but MRP exists:              │
│    → Derive discount: ((mrp - rate) / mrp) * 100            │
│                                                             │
│  If only rate exists:                                       │
│    → Show rate only, no discount badge                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## �🚢 Deployment

### Deploy to Firebase Hosting (Frontend)

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   # or
   npx firebase deploy --only hosting:venkys-durgapur
   ```

### Deploy to Vercel (API Functions)

1. **Connect your GitHub repo to Vercel**
2. **Add environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Quick Deploy Command
```bash
npm run deploy
```

This runs `npm run build` followed by `firebase deploy`.

---

## 🐛 Troubleshooting

### Common Issues

#### "Cannot find module 'firebase'"
**Solution:** Run `npm install` to install dependencies.

#### "Firebase: Error (auth/invalid-api-key)"
**Solution:** Check your `.env` file has the correct Firebase API key.

#### "Razorpay checkout not opening"
**Solution:** 
1. Check `VITE_RAZORPAY_KEY_ID` is set correctly
2. Make sure you're using HTTPS in production

#### "Address autocomplete not working"
**Solution:**
1. Check `VITE_GOOGLE_PLACES_API_KEY` is set
2. Make sure Places API is enabled in Google Cloud Console

#### "Order not saving"
**Solution:**
1. Check Firebase Firestore rules allow writes
2. Check user is authenticated
3. Check browser console for specific errors

#### "WhatsApp notifications not sending"
**Solution:**
1. Check `WA_PHONE_NUMBER_ID` and `WA_ACCESS_TOKEN`
2. Make sure WhatsApp template is approved
3. Check phone number format (10 digits, no country code stored)

### Debug Mode

Add `?debug=true` to any URL to see detailed logs in the console.

### Getting Help

1. Check the browser's Developer Console (F12) for errors
2. Check Vercel function logs for API errors
3. Check Firebase Console for database/auth errors

---

## 📝 Scripts Reference

| Command | What it Does |
|---------|--------------|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Build for production (creates `dist` folder) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code for errors |
| `npm run deploy` | Build and deploy to Firebase |

---

## 🎨 Customization

### Changing Brand Colors

Edit `tailwind.config.js`:
```javascript
// Primary color, secondary color, accent, etc.
```

### Changing Restaurant Name

Edit `src/brand.js`:
```javascript
export const BRAND_SHORT = "Venky's"
export const BRAND_LONG = "Venky's Cheat Mealz"
```

### Adding New Menu Items

Menu items are managed through the Admin App. See `venkys_admin` README.

---

## 🔗 Related Applications

This Customer App is part of a two-app system:

| Application | Purpose | Location |
|-------------|---------|----------|
| **Customer App** (this) | Public-facing ordering interface | `venkys/` |
| **Admin App** | Staff dashboard and operations | `venkys_admin/` |

### Shared Resources

Both applications share:
- **Firebase Project** - Same authentication, database, and storage
- **API Functions** - Both use Vercel serverless functions
- **Database Collections** - `menu`, `orders`, `users`, `images`, etc.
- **WhatsApp Integration** - Same Meta Business account

### Development Workflow

When making changes that affect both apps:

1. **Menu Changes** → Updated in Admin App → Reflected in Customer App automatically
2. **User Accounts** → Created in either app → Accessible from both
3. **Orders** → Created in Customer App → Managed in Admin App

---

## 📚 Additional Resources

### For Developers

- [React 19 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Razorpay Integration Guide](https://razorpay.com/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### For Deployment

- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

---

## 📞 Support

For technical support:
1. Check the browser's Developer Console (F12) for errors
2. Review Vercel function logs for API errors
3. Check Firebase Console for database/auth issues
4. Raise an issue in the repository with detailed steps to reproduce

---

## 📄 License

This project is proprietary software developed for Venky's Cheat Mealz.

---

**Venky's Cheat Mealz - Customer Application**  
*Built with React, Firebase, and modern web technologies*
