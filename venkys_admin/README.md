# 🔧 Venky's Cheat Mealz - Admin App

> The administrative dashboard and Point-of-Sale (POS) system for Venky's Cheat Mealz restaurant. This application enables staff to manage orders, inventory, analytics, and operations—all from a single interface.

---

## 📖 Table of Contents

1. [What is This App?](#-what-is-this-app)
2. [System Architecture Overview](#-system-architecture-overview)
3. [Features Overview](#-features-overview)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [Role-Based Access](#-role-based-access)
9. [Pages Explained](#-pages-explained)
10. [Components Explained](#-components-explained)
11. [Context Providers](#-context-providers)
12. [Library Functions](#-library-functions)
13. [API Routes](#-api-routes)
14. [How Things Work](#-how-things-work)
16. [Thermal Printing](#-thermal-printing)
17. [Data Models](#-data-models)
18. [Deployment](#-deployment)
19. [Troubleshooting](#-troubleshooting)

---

## 🎯 What is This App?

This is the **Staff-Facing Administrative Application** of the Venky's Cheat Mealz food ordering system. It serves as the operational command center where staff can:

1. **Manage Orders** - View, accept, update status, and fulfill customer orders
2. **Point-of-Sale (POS)** - Take in-person orders for dine-in and counter pickup
3. **Inventory Management** - Add, edit, and organize menu items and categories
4. **Analytics** - View sales reports, revenue trends, and popular items
5. **Appearance Control** - Configure spotlight sections and category ordering
6. **Staff Management** - Add team members with role-based permissions
7. **Delivery Coordination** - Assign orders to delivery staff and track fulfillment

### How This App Interacts with the Customer App

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CUSTOMER APP ←→ ADMIN APP INTERACTION               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   CUSTOMER APP                          ADMIN APP                   │
│   ────────────                          ─────────                   │
│                                                                     │
│   Customer browses menu ◄────────────── Admin updates menu items    │
│                                         (Inventory page)            │
│                                                                     │
│   Customer sees spotlight ◄──────────── Admin configures spotlight  │
│   (Hot Deals, Chef Specials)            (Appearance page)           │
│                                                                     │
│   Customer places order ─────────────► Order appears in Orders page │
│                                                                     │
│   Customer tracks status ◄───────────── Staff updates order status  │
│   (Real-time updates)                   (Orders page)               │
│                                                                     │
│   Customer sees "Store Closed" ◄─────── Admin toggles store status  │
│                                         (Settings page)             │
│                                                                     │
│   ─────────────────── SHARED FIREBASE DATABASE ───────────────────  │
│                                                                     │
│   Collections: menu, orders, users, images, appearance, settings    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Why a Separate Admin App?**
- **Security**: Admin functionality is completely isolated from customer-facing code
- **Role Enforcement**: Only authenticated staff with proper roles can access
- **Optimized UX**: Different UI patterns for operational use (tables, bulk actions)
- **Deployment Flexibility**: Can be deployed to a separate subdomain with stricter access

---

## 🏗️ System Architecture Overview

### Admin App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       ADMIN APPLICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PRESENTATION LAYER                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Pages: Orders, Biller, Inventory, Analytics, etc.  │  │  │
│  │  │  └─ Role-gated via AuthContext                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                    STATE LAYER                            │  │
│  │  ├─ AuthContext (User + Role + Permissions)               │  │
│  │  └─ UIContext (Toasts, Confirmations)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                    DATA LAYER                             │  │
│  │  ├─ data.js (Menu, Orders, Settings CRUD)                 │  │
│  │  ├─ userData.js (Staff management)                        │  │
│  │  ├─ auditLog.js (Activity logging)                        │  │
│  │  └─ rawbtPrint.js (Thermal receipt generation)            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                  EXTERNAL SERVICES                        │  │
│  │  ├─ Firebase (Auth + Firestore + Storage)                 │  │
│  │  ├─ Razorpay (POS payment processing)                     │  │
│  │  └─ RawBT (Thermal printing via Bluetooth)                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Role-Based Page Access Flow

```
User attempts to access a page
         │
         ▼
AuthContext checks:
         │
         ├─► Is user authenticated?
         │   └─ No → Redirect to login
         │
         ├─► What is user's role? (from Firestore users/{uid})
         │
         ├─► role === 'superAdmin' or 'admin'
         │   └─ Full access to all pages ✓
         │
         ├─► role === 'staff'
         │   └─ Check `pages` array in user document
         │      ├─ Page in array → Allow access ✓
         │      └─ Page not in array → Redirect to default page
         │
         └─► role === 'delivery'
             └─ Only /delivery page accessible
```

---

## ✨ Features Overview

### Core Operational Features

| Feature | Description | Business Value |
|---------|-------------|----------------|
| 📋 **Orders** | Real-time order queue with status management | Process orders efficiently, reduce wait times |
| 💰 **POS/Biller** | In-person order taking with payment | Handle walk-in customers, dine-in orders |
| 📦 **Inventory** | Full menu CRUD with pricing, images, variants | Keep menu current, manage availability |
| 📊 **Analytics** | Revenue, orders, popular items dashboards | Data-driven business decisions |
| 🎨 **Appearance** | Spotlight configuration, category ordering | Control customer app presentation |
| ⚙️ **Settings** | Store status, contact info, staff management | Centralized configuration |
| 🚚 **Delivery** | Order assignment and tracking | Coordinate delivery operations |
| 📜 **Audit Logs** | Activity tracking for accountability | Security and compliance |

### Technical Features

| Feature | Implementation | Why It Matters |
|---------|----------------|----------------|
| 🔐 **Role-Based Access** | Firestore user documents with `role` and `pages` fields | Principle of least privilege |
| 🖨️ **Thermal Printing** | ESC/POS commands via RawBT app | Professional receipt output |
| 📴 **Store Toggle** | Real-time Firestore flag | Instantly pause online ordering |
| 📈 **Real-time Updates** | Firestore `onSnapshot` listeners | No page refresh needed |

---

## 🛠️ Tech Stack

### Core Technologies

| Technology | Version | Purpose | Why We Chose It |
|------------|---------|---------|-----------------|
| **React** | 19.x | UI Framework | Component-based, excellent for complex admin UIs |
| **Vite** | 7.x | Build Tool | Fast development with HMR, optimized production builds |
| **Firebase** | 11.x | Backend Services | Shared database with customer app, real-time capabilities |
| **Razorpay** | SDK | POS Payments | Same gateway for consistency, supports all Indian methods |

### Frontend Libraries

| Library | Purpose | How It's Used |
|---------|---------|---------------|
| **Tailwind CSS** | Utility-first CSS | All styling via utility classes |
| **daisyUI** | Component library | Admin-friendly components (tables, tabs, modals) |
| **Recharts** | Charts & graphs | Analytics dashboards, revenue trends |
| **React Router** | Client-side routing | SPA navigation between admin pages |
| **React Icons** | Icon library | Consistent Material Design icons |

### Backend Services

| Service | Purpose | Admin-Specific Usage |
|---------|---------|---------------------|
| **Firebase Auth** | Authentication | Staff login verification |
| **Firestore** | Database | Menu management, order updates, settings |
| **Firebase Storage** | File storage | Menu item images, category images |
| **RawBT** | Thermal printing | Receipt printing via Bluetooth |

### Thermal Printing Stack

| Component | Purpose |
|-----------|---------|
| **RawBT App** | Android app that receives print intents and routes to Bluetooth printers |
| **ESC/POS Commands** | Industry-standard thermal printer command language |
| **rawbtPrint.js** | Custom library that generates ESC/POS-formatted receipt data |

---

## 📁 Project Structure

```
venkys_admin/
├── api/                    # 🌐 Backend API functions (Vercel)
│   ├── lib/                # Helper functions
│   │   └── rateLimiter.js  # Prevents spam/abuse
│   ├── create-order.js     # Creates Razorpay order (for POS)
│   ├── verify-payment.js   # Verifies payment
│   ├── send-order-messenger.js # Notifies about orders
│   ├── public-config.js    # Public settings
│   ├── send-log-email.js   # Email notifications
│   └── health.js           # Health check
│
├── public/                 # 📂 Static files
│   └── icons/              # App icons
│
├── src/                    # 📱 Main application code
│   ├── components/         # 🧩 Reusable UI pieces
│   │   ├── AdminNav.jsx    # Side navigation menu
│   │   ├── AuthModal.jsx   # Login popup
│   │   ├── AuthSkeleton.jsx # Loading state
│   │   └── InstallPWA.jsx  # Install prompt
│   │
│   ├── context/            # 🔄 Global state
│   │   ├── AuthContext.jsx # Login state + role checking
│   │   └── UIContext.jsx   # UI state (toasts, modals)
│   │
│   ├── layouts/            # 📐 Page layouts
│   │   └── AdminLayout.jsx # Wrapper with sidebar
│   │
│   ├── lib/                # 📚 Utility functions
│   │   ├── firebase.js     # Firebase setup
│   │   ├── data.js         # Database operations
│   │   ├── userData.js     # User/staff operations
│   │   ├── storeStatus.js  # Store open/closed status
│   │   └── deliverySettings.js # Delivery zone config
│   │
│   ├── pages/              # 📄 Full pages
│   │   ├── AdminBiller.jsx # POS / Biller page
│   │   ├── Orders.jsx      # Order management
│   │   ├── Inventory.jsx   # Menu management
│   │   ├── Analytics.jsx   # Reports & charts
│   │   ├── Appearance.jsx  # Spotlight & ordering
│   │   ├── Settings.jsx    # App settings
│   │   ├── Delivery.jsx    # Delivery management
│   │   ├── StockManager.jsx # Raw materials
│   │   └── AuditLogs.jsx   # Activity logs
│   │
│   ├── App.jsx             # Main app
│   ├── main.jsx            # Entry point
│   ├── index.css           # Global styles
│   └── sw.js               # Service worker
│
├── index.html              # HTML entry
├── package.json            # Dependencies
├── vite.config.js          # Build config
├── tailwind.config.js      # Styling config
├── firebase.json           # Firebase hosting
└── firestore.rules         # Database security
```

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Firebase account** - [Sign up](https://firebase.google.com/)
3. **Same Firebase project as customer app**

### Step-by-Step Setup

#### Step 1: Navigate to the Project
```bash
cd "D:\My projects\Venky's_Cheat_Mealz\venkys_admin"
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Set Up Environment Variables
Create `.env` file:

```env
# Firebase Configuration (SAME as customer app)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Razorpay (for POS payments)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key


# API URL
VITE_API_BASE_URL=https://your-admin.vercel.app

# CORS
CORS_ORIGIN=https://admin.your-domain.com,http://localhost:5174
```

#### Step 4: Run the App
```bash
npm run dev
```

Open `http://localhost:5174` (or whichever port Vite shows).

---

## 🔐 Environment Variables

### Firebase Variables

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase authentication |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | Image storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Notifications |
| `VITE_FIREBASE_APP_ID` | App identifier |

### Razorpay Variables

| Variable | Purpose |
|----------|---------|
| `VITE_RAZORPAY_KEY_ID` | Public key for frontend |
| `RAZORPAY_KEY_ID` | Key for backend |
| `RAZORPAY_KEY_SECRET` | Secret (NEVER expose!) |


| Variable | Purpose |
|----------|---------|
| `WA_ACCESS_TOKEN` | API authentication token |

---

## 👥 Role-Based Access

The admin app has different roles with different permissions:

### Roles Explained

| Role | Description | Who Uses It |
|------|-------------|-------------|
| **Super Admin** | Full access to everything | Restaurant owner |
| **Admin** | Full access to everything | Manager |
| **Staff** | Configurable access | Counter staff, kitchen |
| **Delivery** | Only delivery page | Delivery drivers |

### Page Access by Role

| Page | Super Admin | Admin | Staff | Delivery |
|------|-------------|-------|-------|----------|
| Orders | ✅ | ✅ | ⚙️ | ❌ |
| Biller (POS) | ✅ | ✅ | ⚙️ | ❌ |
| Inventory | ✅ | ✅ | ⚙️ | ❌ |
| Analytics | ✅ | ✅ | ⚙️ | ❌ |
| Appearance | ✅ | ✅ | ⚙️ | ❌ |
| Settings | ✅ | ✅ | ⚙️ | ❌ |
| Delivery | ✅ | ✅ | ⚙️ | ✅ |
| Logs | ✅ | ✅ | ⚙️ | ❌ |

**⚙️ = Configurable by admin**

### How to Add Staff

1. Go to **Settings** page
2. Click **"Add Staff"** button
3. Enter their email address
4. Select their role (Staff or Delivery)
5. For Staff role, check which pages they can access
6. Click **Save**

The staff member can then log in with that email.

---

## 📄 Pages Explained

### 1. Admin Biller / POS (`/biller`)
**File:** `src/pages/AdminBiller.jsx`

This is for taking orders in person - like when someone comes to the counter or orders over the phone.

**What you can do:**
- 🍕 **Browse menu** by category tiles
- ➕ **Add items** to the bill
- 🧮 **Adjust quantities** and see total
- 💳 **Accept payment** (Online or Cash)
- 🔢 **Generate OTP** for COD orders (dine-in verification)
- 🖨️ **Print receipt** for the customer

**How OTP Works (Dine-In COD):**
1. Staff creates order and selects "Cash on Delivery"
2. System generates a 4-digit OTP
4. When customer pays, staff enters OTP to verify
5. Order is marked as paid

```
Customer orders → Staff creates bill → COD selected
                                            │
                                            ▼
                                    OTP generated (e.g., 1234)
                                            │
                                            ▼
                                            │
                                            ▼
                              Customer pays cash at counter
                                            │
                                            ▼
                              Staff enters OTP to verify
                                            │
                                            ▼
                                    Order marked PAID ✅
```

### 2. Orders (`/orders`)
**File:** `src/pages/Orders.jsx`

See and manage all orders from the customer app.

**What you can do:**
- 📋 **View all orders** with filters (status, date)
- 🔄 **Update status** (Preparing → Ready → Out for Delivery → Delivered)
- 👁️ **View order details** (items, customer info, address)
- 🔢 **Verify OTP** for COD orders
- 🖨️ **Print receipt** or kitchen ticket
- ❌ **Cancel orders** if needed

**Order Statuses:**

| Status | What it Means | Next Step |
|--------|---------------|-----------|
| `pending` | Just placed, needs confirmation | Accept or Reject |
| `confirmed` | Accepted, waiting for kitchen | Start preparing |
| `preparing` | Kitchen is cooking | Ready for pickup/delivery |
| `ready` | Food is ready | Assign delivery or call customer |
| `out_for_delivery` | Driver is on the way | Wait for delivery |
| `delivered` | Customer received food | Done! |
| `cancelled` | Order was cancelled | No further action |

### 3. Inventory (`/inventory`)
**File:** `src/pages/Inventory.jsx`

Manage your entire menu - categories, items, prices, images.

**What you can do:**
- 📂 **Manage categories** (add, rename, delete, reorder)
- 🍕 **Add menu items** with name, price, description
- 💰 **Set pricing** (MRP, selling price, discount %)
- 📷 **Upload images** for items
- 🟢🔴 **Mark veg/non-veg**
- ✅❌ **Enable/disable items** (out of stock)
- 🔧 **Bulk edit** pricing across multiple items

**Pricing Logic:**

```
MRP (Maximum Retail Price) = The "crossed out" price
Rate (Selling Price) = What customer actually pays
Discount % = Automatically calculated from MRP and Rate

Example:
  MRP: ₹200
  Rate: ₹150
  Discount: 25% (shown as "25% OFF")
```

### 4. Analytics (`/analytics`)
**File:** `src/pages/Analytics.jsx`

See how your business is doing with charts and numbers.

**What it shows:**
- 💰 **Total Revenue** - How much money came in
- 📦 **Total Orders** - How many orders were placed
- 🍕 **Items Sold** - Total quantity of items sold
- 👥 **Unique Customers** - How many different people ordered
- 📈 **Revenue Chart** - Graph showing sales over time
- 🏆 **Top Items** - Most popular menu items
- 🥧 **Payment Breakdown** - Online vs COD pie chart

**Time Filters:**
- Today
- Yesterday
- Last 7 Days
- All Time
- Custom Date Range

### 5. Appearance (`/appearance`)
**File:** `src/pages/Appearance.jsx`

Customize how the menu looks in the customer app.

**What you can do:**
- ⭐ **Hot Deals** - Feature items in the "Hot Deals" spotlight
- 👨‍🍳 **Chef Specials** - Feature items in "Chef's Special" section
- 📂 **Reorder Categories** - Drag to change category display order
- 👁️ **Hide/Show Sections** - Toggle visibility of spotlight sections

### 6. Settings (`/settings`)
**File:** `src/pages/Settings.jsx`

Configure the app and manage staff.

**Sections:**

#### Store Status
- 🟢 **Open/Closed Toggle** - Pause accepting online orders
- Useful for closing during off-hours or when too busy

#### Contact Info
- 📍 **Shop Address** - Your restaurant's address
- 📞 **Shop Phone** - Contact number
- 👨‍🍳 **Chef Name** - Displayed in app

#### Delivery Settings
- 📍 **Center Location** - Latitude/longitude of restaurant
- 📏 **Delivery Radius** - How far you deliver (in km)

- 📱 **Cash Manager Phones** - Who receives OTP for dine-in COD
- 📱 **Order Messenger Phones** - Who receives new order notifications

**⚠️ IMPORTANT: Phone Number Format**
- Store as **10 digits only** (no country code)
- Example: `9876543210` ✅
- NOT: `919876543210` ❌
- NOT: `+919876543210` ❌


#### Staff Management
- ➕ **Add Staff** - Add new team members
- ✏️ **Edit Staff** - Change permissions
- ❌ **Remove Staff** - Revoke access

### 7. Delivery (`/delivery`)
**File:** `src/pages/Delivery.jsx`

Manage deliveries and delivery staff.

**What it shows:**
- 📦 **Pending Deliveries** - Orders ready to go out
- 🏍️ **Assign Driver** - Assign order to delivery person
- 📍 **Delivery Address** - Where to deliver
- ✅ **Mark Delivered** - Complete the delivery

### 8. Stock Manager (`/stock`)
**File:** `src/pages/StockManager.jsx`

Track raw materials and ingredients.

**What you can do:**
- 📦 **Add Raw Materials** - Chicken, Cheese, Bread, etc.
- 📊 **Track Quantities** - How much you have
- ⚠️ **Low Stock Alerts** - Get warned when running low
- 🔗 **Link to Items** - Which items use which ingredients

### 9. Audit Logs (`/logs`)
**File:** `src/pages/AuditLogs.jsx`

See who did what and when - for accountability.

**What it tracks:**
- 📝 **Order Changes** - Status updates, cancellations
- 🔧 **Settings Changes** - Who changed what setting
- 👤 **Staff Actions** - Who logged in, what they did
- ⏰ **Timestamps** - When each action happened

---

## 🧩 Components Explained

### AdminNav (`AdminNav.jsx`)
The sidebar navigation menu.

**What it shows:**
- Logo at the top
- Navigation links based on user's role
- Currently active page highlighted
- Logout button at bottom

### AuthModal (`AuthModal.jsx`)
Login popup for staff.

**Features:**
- Email/Password login
- Google Sign-In
- Shows error messages if login fails
- Only allows staff with proper roles

### AdminLayout (`AdminLayout.jsx`)
Wrapper that provides consistent layout.

**What it does:**
- Shows the sidebar navigation
- Main content area
- Header with page title
- Handles responsive layout

---

## 🔄 Context Providers

### AuthContext (`AuthContext.jsx`)
Manages login and role-based access.

**What it provides:**
```javascript
{
  user,           // Current logged-in user
  loading,        // Loading state
  isAdmin,        // Is user an admin?
  isSuperAdmin,   // Is user super admin?
  isStaff,        // Is user staff?
  isDelivery,     // Is user delivery?
  staffPages,     // Which pages staff can access
  defaultPage,    // Staff's default landing page
  refreshRole,    // Re-check role after changes
}
```

**How Role Checking Works:**
1. User logs in with Firebase Auth
2. System checks `users` collection for their role
3. If `role === 'admin'`, full access
4. If `role === 'staff'`, check `pages` field for allowed pages
5. If `role === 'delivery'`, only delivery page

### UIContext (`UIContext.jsx`)
Manages UI state.

**What it provides:**
- `pushToast(message, type)` - Show notification
- `confirm(message)` - Show confirmation dialog

---

## 📚 Library Functions

### data.js
All database operations.

**Key Functions:**

| Function | What it Does |
|----------|--------------|
| `fetchMenuCategories()` | Get all categories and items |
| `upsertMenuCategory(category)` | Create or update category |
| `addMenuItems(categoryId, items)` | Add items to category |
| `setMenuItems(categoryId, items)` | Replace all items in category |
| `removeMenuItem(categoryId, index)` | Delete an item |
| `fetchAllOrders()` | Get all orders |
| `updateOrderStatus(orderId, status)` | Change order status |
| `fetchAppSettings()` | Get app configuration |
| `saveAppSettings(settings)` | Save configuration |
| `fetchStaff()` | Get all staff members |
| `addStaffMember(email, role, pages)` | Add new staff |
| `removeStaffMember(email)` | Remove staff access |

### storeStatus.js
Store open/closed state.

| Function | What it Does |
|----------|--------------|
| `fetchStoreStatus()` | Get current open/closed state |
| `setStoreOpen(isOpen)` | Change store status |

### deliverySettings.js
Delivery zone configuration.

| Function | What it Does |
|----------|--------------|
| `fetchDeliverySettings()` | Get delivery zone settings |
| `saveDeliverySettings(settings)` | Update delivery zone |

---

## 🌐 API Routes

### POST `/api/create-order`
Creates Razorpay order for POS payments.

### POST `/api/verify-payment`
Verifies Razorpay payment signature.


**For OTP (Cash Manager):**
```json
{
  "phone": "9876543210",
  "template": "venkys_cash_manager_otp",
  "language": "en",
  "bodyParams": ["1234"]  // The OTP code
}
```

### POST `/api/send-order-messenger`
Notifies staff about new orders.

```json
{
  "phone": "9876543210",
  "customerName": "John",
  "total": "450",
  "address": "123 Main St"
}
```

### GET `/api/health`
Health check endpoint.

---

## ⚙️ How Things Work

### How the POS/Biller Works

```
┌─────────────────────────────────────────────────────────────┐
│                    POS BILLING FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Staff selects category tile                             │
│           │                                                 │
│           ▼                                                 │
│  2. Items grid appears for that category                    │
│           │                                                 │
│           ▼                                                 │
│  3. Staff clicks items to add to bill                       │
│           │                                                 │
│           ▼                                                 │
│  4. Bill shows items, quantities, total                     │
│           │                                                 │
│           ▼                                                 │
│  5. Staff selects payment method:                           │
│                                                             │
│     ┌─ ONLINE PAYMENT:                                      │
│     │  └─→ Razorpay checkout opens                          │
│     │  └─→ Customer pays with UPI/Card                      │
│     │  └─→ Payment verified                                 │
│     │  └─→ Order created as PAID                            │
│     │                                                       │
│     └─ CASH ON DELIVERY (Dine-In):                          │
│        └─→ OTP generated (4 digits)                         │
│        └─→ Order created with status PENDING_OTP            │
│        └─→ Customer pays cash                               │
│        └─→ Staff enters OTP to verify                       │
│        └─→ Order marked as PAID                             │
│                                                             │
│  6. Receipt can be printed                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### How Order Management Works

```
NEW ORDER (from customer app)
         │
         ▼
┌─────────────────┐
│    PENDING      │ ← Order just placed
└────────┬────────┘
         │ Staff clicks "Confirm"
         ▼
┌─────────────────┐
│   CONFIRMED     │ ← Accepted, waiting for kitchen
└────────┬────────┘
         │ Staff clicks "Start Preparing"
         ▼
┌─────────────────┐
│   PREPARING     │ ← Kitchen is cooking
└────────┬────────┘
         │ Staff clicks "Ready"
         ▼
┌─────────────────┐
│     READY       │ ← Food is ready
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
PICKUP    DELIVERY
    │         │
    │         ▼
    │  ┌─────────────────┐
    │  │OUT FOR DELIVERY │ ← Driver has the order
    │  └────────┬────────┘
    │           │
    └─────┬─────┘
          │
          ▼
┌─────────────────┐
│   DELIVERED     │ ← Customer received food
└─────────────────┘
```

### How Staff Permissions Work

```
User logs in
      │
      ▼
Check users/{uid} document in Firestore
      │
      ▼
Read 'role' field
      │
      ├── role: 'admin' or 'superAdmin'
      │      └─→ Full access to all pages
      │
      ├── role: 'staff'
      │      └─→ Check 'pages' field
      │            Example: { orders: true, biller: true }
      │            └─→ Only show allowed pages in sidebar
      │
      └── role: 'delivery'
             └─→ Only delivery page accessible
```

---



### 1. Cash Manager OTP (Dine-In COD)

When a dine-in customer wants to pay cash:

1. Staff creates the order in POS
2. System generates 4-digit OTP
3. OTP is sent to all "Cash Manager" phones
4. Template used: `venkys_cash_manager_otp`

**Setup Required:**
- Template must accept 1 body parameter (the OTP)
- Add Cash Manager phone numbers in Settings

### 2. Order Messenger (New Order Alerts)

When a customer places an order:

1. Order is saved to database
3. Template used: `venkys_order_messenger`
4. Contains: Customer name, Total amount, Delivery address

**Setup Required:**
- Template must accept 3 body parameters (name, total, address)
- Add Order Messenger phone numbers in Settings

### Phone Number Rules

**CRITICAL:** Always store phone numbers as 10 digits only!

```
✅ CORRECT: 9876543210
❌ WRONG: 919876543210
❌ WRONG: +919876543210
❌ WRONG: 91-9876543210
```


---

## 🖨️ Thermal Printing

The admin app supports printing receipts on 72mm thermal printers.

### How it Works

1. **RawBT App**: Install on Android device
2. **Bluetooth Printer**: Pair with phone
3. **Print**: Click print button in Orders or POS
4. **Output**: Formatted receipt on thermal paper

### Receipt Format

```
================================
    VENKY'S CHEAT MEALZ
================================
Order #: VCM-12345
Date: 15 Jan 2024, 10:30 AM
--------------------------------
Item              Qty    Amount
--------------------------------
Cheese Burger      2      ₹340
Pepperoni Pizza    1      ₹250
Coke               2       ₹80
--------------------------------
Subtotal:                 ₹670
Delivery:                  ₹30
--------------------------------
TOTAL:                    ₹700
--------------------------------
Payment: Cash on Delivery

Customer: John Doe
Phone: 9876543210
Address: 123 Main Street...
================================
     Thank you! Visit again
================================
```

### Setting Up Thermal Printing

1. Install **RawBT** app on Android
2. Pair Bluetooth thermal printer
3. Set RawBT as default print handler
4. Click print in admin app
5. Receipt prints automatically

---

## � Data Models

The Admin App shares the same Firestore database as the Customer App. Below are the key collections and their schemas from an administrative perspective.

### Collections Overview (Admin Perspective)

```
firestore/
├── menu/                    # 📦 Managed by Inventory page
│   └── {categoryId}/
│       ├── name: string
│       ├── order: number     # Display order in customer app
│       ├── imageId: string?
│       └── items: array[MenuItem]
│
├── orders/                  # 📋 Managed by Orders page
│   └── {orderId}/
│       ├── status: string    # Staff updates this
│       ├── otp: string?      # For COD verification
│       └── ...orderData
│
├── users/                   # 👥 Managed by Settings > Staff
│   └── {userId}/
│       ├── role: string      # 'admin'|'staff'|'delivery'
│       ├── pages: object     # { orders: true, biller: true }
│       └── ...userData
│
├── appearance/              # 🎨 Managed by Appearance page
│   └── settings/
│       ├── spotlight: {
│       │   hotDeals: string[]      # Item IDs
│       │   chefSpecials: string[]
│       │   hiddenHotDeals: boolean
│       │   hiddenChefSpecials: boolean
│       │   hiddenSpotlight: boolean
│       │ }
│       └── categoriesOrder: string[]
│
├── miscellaneous/           # ⚙️ Managed by Settings page
│   └── settings/
│       ├── open: boolean           # Store status toggle
│       ├── shopAddress: string
│       ├── shopPhone: string
│       ├── cashManagerPhones: string[]   # Receive OTPs
│       └── orderMessengerPhones: string[] # Receive order alerts
│
├── raw_materials/           # 📦 Managed by Stock Manager
│   └── {materialId}/
│       ├── name: string
│       ├── unit: string      # 'kg', 'pcs', 'L'
│       ├── quantity: number
│       └── lowStockThreshold: number
│
└── audit_logs/              # 📜 Viewed in Audit Logs page
    └── {logId}/
        ├── action: string    # 'order_status_change', 'menu_update'
        ├── userId: string
        ├── details: object
        └── timestamp: Timestamp
```

### Order Status Lifecycle

Orders transition through the following states (managed via Orders page):

```typescript
type OrderStatus = 
  | 'pending'           // Just placed, awaiting confirmation
  | 'confirmed'         // Accepted by staff
  | 'preparing'         // Kitchen is cooking
  | 'ready'             // Ready for pickup/handoff
  | 'out_for_delivery'  // With delivery driver
  | 'delivered'         // Successfully received by customer
  | 'cancelled';        // Order was cancelled

// Status transition rules (enforced in UI):
// pending → confirmed OR cancelled
// confirmed → preparing OR cancelled
// preparing → ready
// ready → out_for_delivery (delivery) OR delivered (pickup)
// out_for_delivery → delivered
```

### Staff Role Schema

```typescript
interface StaffUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'superAdmin' | 'admin' | 'staff' | 'delivery';
  
  // Only for role === 'staff'
  pages?: {
    orders?: boolean;
    biller?: boolean;
    inventory?: boolean;
    analytics?: boolean;
    appearance?: boolean;
    settings?: boolean;
    delivery?: boolean;
    logs?: boolean;
  };
  
  // Default page when staff logs in (first allowed page)
  defaultPage?: string;
  
  createdAt: Timestamp;
  addedBy?: string;  // UID of admin who added this staff
}
```

### Audit Log Entry Schema

```typescript
interface AuditLogEntry {
  id: string;           // Auto-generated
  action: string;       // e.g., 'order_status_change', 'menu_item_added'
  userId: string;       // UID of staff who performed action
  userName?: string;    // Display name at time of action
  
  // Context-dependent details
  details: {
    orderId?: string;
    previousStatus?: string;
    newStatus?: string;
    itemName?: string;
    categoryId?: string;
    // ... varies by action type
  };
  
  timestamp: Timestamp;
  ipAddress?: string;
}
```

### OTP Verification Flow (COD Orders)

```typescript
// When creating a COD order in POS:
interface CODOrder extends Order {
  paymentMethod: 'cod';
  paymentStatus: 'pending';
  otp: string;              // 4-digit code, e.g., "1234"
  otpGeneratedAt: Timestamp;
  otpVerified: boolean;     // Initially false
  otpVerifiedAt?: Timestamp;
  otpVerifiedBy?: string;   // UID of staff who verified
}

// Staff enters OTP to verify → sets otpVerified = true
```

---

## �🚢 Deployment

### Deploy to Firebase Hosting

```bash
# Build the app
npm run build

# Deploy
npm run deploy
# or
npx firebase deploy --only hosting:venkys-admin
```

### Deploy to Vercel (APIs)

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy triggers automatically on push

### Quick Deploy
```bash
npm run deploy
```

---

## 🐛 Troubleshooting

### Common Issues

#### "Access Denied" after login
**Cause:** User doesn't have admin/staff role in database.
**Solution:**
1. Check `users` collection in Firebase
2. Find the user's document
3. Add `role: 'admin'` or `role: 'staff'`

**Causes & Solutions:**
1. Check `WA_PHONE_NUMBER_ID` and `WA_ACCESS_TOKEN` are set
2. Verify template is approved in Meta Business
3. Check phone number is 10 digits (not 12 with 91)
4. Check Vercel function logs for errors

#### "OTP not received"
**Causes & Solutions:**
1. Check Cash Manager phones in Settings
2. Verify phones are 10 digits
4. Check template has 1 body parameter

#### "Print not working"
**Solutions:**
1. Install RawBT app on Android
2. Pair Bluetooth printer
3. Set RawBT as print handler
4. Try printing a test page from RawBT first

#### "Page not loading"
**Solutions:**
1. Clear browser cache
2. Check browser console for errors
3. Verify Firebase is configured correctly
4. Check Firestore rules allow reads

#### "Staff can't access page"
**Solutions:**
1. Go to Settings → Staff Management
2. Edit the staff member
3. Enable the page they need access to
4. Click Save

### Debug Tips

1. **Browser Console (F12)** - Check for JavaScript errors
2. **Network Tab** - See if API calls are failing
3. **Vercel Logs** - Check serverless function errors
4. **Firebase Console** - Check Firestore data and Auth logs

---

## 📝 Scripts Reference

| Command | What it Does |
|---------|--------------|
| `npm run dev` | Start development server (usually localhost:5174) |
| `npm run build` | Build for production (creates `dist` folder) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code for errors with ESLint |
| `npm run deploy` | Build and deploy to Firebase Hosting |

---

## 🔗 Related Applications

This Admin App is part of a two-app system:

| Application | Purpose | Location |
|-------------|---------|----------|
| **Customer App** | Public-facing ordering interface | `venkys/` |
| **Admin App** (this) | Staff dashboard and operations | `venkys_admin/` |

### Shared Resources

Both applications share:
- **Firebase Project** - Same authentication, database, and storage
- **API Functions** - Both use Vercel serverless functions
- **Database Collections** - `menu`, `orders`, `users`, `images`, etc.

### Data Flow Between Apps

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ADMIN APP writes to:                                           │
│  ├─ menu/{categoryId}        → Customer App reads for display   │
│  ├─ orders/{orderId}/status  → Customer App shows updates       │
│  ├─ appearance/settings      → Customer App renders spotlight   │
│  └─ miscellaneous/settings   → Customer App checks store status │
│                                                                 │
│  CUSTOMER APP writes to:                                        │
│  ├─ orders/{orderId}         → Admin App shows in queue         │
│  ├─ users/{userId}           → Admin App can view customer info │
│  └─ carts/{userId}           → (Not read by Admin App)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### Authentication Security
- Only users with explicit roles in Firestore can access Admin App
- Role is checked on every page load via AuthContext
- Firebase Auth tokens expire and are refreshed automatically

### Database Security
- Firestore rules enforce role-based access
- Admin operations require `role === 'admin'` or `role === 'superAdmin'`
- Staff operations are limited to their allowed pages

### API Security
- Vercel functions validate requests before processing
- Razorpay signatures are verified server-side
- Rate limiting prevents abuse

---

## 📚 Additional Resources

### For Developers

- [React 19 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Admin Documentation](https://firebase.google.com/docs)
- [Razorpay Integration Guide](https://razorpay.com/docs/)
- [Recharts Documentation](https://recharts.org/)

### For Deployment

- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

---

## 📞 Support

For technical support:
1. Check the browser's Developer Console (F12) for JavaScript errors
2. Review the Network tab for failed API requests
3. Check Vercel function logs for serverless errors
4. Review Firebase Console for database/auth issues
5. Raise an issue in the repository with detailed reproduction steps

---

## 📄 License

This project is proprietary software developed for Venky's Cheat Mealz.

---

**Venky's Cheat Mealz - Administrative Application**  
*Built with React, Firebase, and modern web technologies*
