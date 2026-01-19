# 🍔 Venky's Cheat Mealz - Customer App

> A modern, fast, and beautiful food ordering app for Venky's Cheat Mealz restaurant. Customers can browse the menu, add items to their cart, and place orders with various payment options.

---

## 📖 Table of Contents

1. [What is This App?](#-what-is-this-app)
2. [Features Overview](#-features-overview)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Getting Started](#-getting-started)
6. [Environment Variables](#-environment-variables)
7. [Pages Explained](#-pages-explained)
8. [Components Explained](#-components-explained)
9. [Context Providers](#-context-providers)
10. [Hooks](#-hooks)
11. [Library Functions](#-library-functions)
12. [API Routes](#-api-routes)
13. [How Things Work](#-how-things-work)
14. [Deployment](#-deployment)
15. [Troubleshooting](#-troubleshooting)

---

## 🎯 What is This App?

Imagine you're hungry and want to order food from Venky's Cheat Mealz restaurant. Instead of calling them or going there physically, you can:

1. **Open this app** on your phone or computer
2. **Browse the menu** with beautiful pictures and descriptions
3. **Add items to your cart** (like putting things in a shopping basket)
4. **Choose how you want to pay** (online with UPI/card or cash when food arrives)
5. **Enter your address** and **place your order**
6. **Track your order** in real-time until it arrives!

It's like having the restaurant in your pocket! 📱

---

## ✨ Features Overview

### For Customers

| Feature | What it Does |
|---------|--------------|
| 🍕 **Menu Browsing** | See all food items organized by categories (Burgers, Pizzas, Drinks, etc.) |
| 🔍 **Search** | Type what you want and find it instantly |
| 🏷️ **Filters** | Filter by Veg/Non-Veg, price range, and more |
| 🛒 **Shopping Cart** | Add items, change quantities, see total |
| 💳 **Multiple Payments** | Pay with UPI, Card, Net Banking, or Cash on Delivery |
| 📍 **Address Management** | Save multiple delivery addresses |
| 👤 **User Accounts** | Sign up with Email, Google, or Phone Number |
| 📱 **PWA Support** | Install the app on your phone like a native app |
| 🔔 **Order Tracking** | See real-time status of your orders |
| ⭐ **Hot Deals & Specials** | See chef's special items and discounts |

### Technical Features

| Feature | What it Does |
|---------|--------------|
| ⚡ **Super Fast** | Built with Vite for lightning-fast loading |
| 📱 **Works Offline** | Service Worker caches the app for offline use |
| 🔒 **Secure Payments** | Razorpay integration with signature verification |
| 🗄️ **Cloud Database** | Firebase Firestore for real-time data |
| 🔐 **Secure Authentication** | Firebase Auth with multiple sign-in methods |
| 📲 **WhatsApp Notifications** | Get order updates on WhatsApp |

---

## 🛠️ Tech Stack

Think of these as the tools and materials used to build the app:

| Technology | What it Does | Think of it as... |
|------------|--------------|-------------------|
| **React 19** | The framework for building the user interface | The blueprint and structure of a building |
| **Vite 7** | Super fast development and build tool | The power tools that make building fast |
| **Firebase** | Authentication + Database (Firestore) | The secure vault that stores all data |
| **Razorpay** | Payment processing | The cash register that handles money |
| **Tailwind CSS** | Styling framework | The paint and decorations |
| **daisyUI** | Pre-made UI components | Pre-built furniture you can use |
| **React Router** | Page navigation | The hallways connecting rooms |
| **React Icons** | Beautiful icons | The signage and symbols |
| **Vercel** | Hosts the API functions | The internet address where APIs live |
| **Firebase Hosting** | Hosts the website | The internet address where the app lives |

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

## 🚢 Deployment

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

## 📞 Support

For technical support, contact the development team or raise an issue in the repository.

---

Made with ❤️ for Venky's Cheat Mealz
