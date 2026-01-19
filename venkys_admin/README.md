# 🔧 Venky's Cheat Mealz - Admin App

> The powerful admin dashboard for Venky's Cheat Mealz restaurant. Staff can manage orders, inventory, analytics, and more - all from one place!

---

## 📖 Table of Contents

1. [What is This App?](#-what-is-this-app)
2. [Features Overview](#-features-overview)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Getting Started](#-getting-started)
6. [Environment Variables](#-environment-variables)
7. [Role-Based Access](#-role-based-access)
8. [Pages Explained](#-pages-explained)
9. [Components Explained](#-components-explained)
10. [Context Providers](#-context-providers)
11. [Library Functions](#-library-functions)
12. [API Routes](#-api-routes)
13. [How Things Work](#-how-things-work)
14. [WhatsApp Integration](#-whatsapp-integration)
15. [Thermal Printing](#-thermal-printing)
16. [Deployment](#-deployment)
17. [Troubleshooting](#-troubleshooting)

---

## 🎯 What is This App?

This is the "behind the scenes" app that restaurant staff use to run the business. Think of it as the control center:

- 📋 **See new orders** as they come in
- 👨‍🍳 **Tell the kitchen** what to prepare
- 🏍️ **Assign delivery** to drivers
- 📦 **Manage the menu** (add/edit/remove items)
- 📊 **See how the business is doing** (sales, popular items)
- ⚙️ **Configure settings** (delivery zone, phone numbers)

It's like the cockpit of an airplane - all the controls in one place! ✈️

---

## ✨ Features Overview

### Core Features

| Feature | What it Does |
|---------|--------------|
| 📋 **Orders Management** | See all orders, update status, print receipts |
| 💰 **POS / Biller** | Take orders in person (for dine-in or counter pickup) |
| 📦 **Inventory** | Add/edit menu items, categories, prices |
| 📊 **Analytics** | Sales reports, popular items, revenue charts |
| 🎨 **Appearance** | Customize spotlight items, category order |
| ⚙️ **Settings** | Store info, staff management, phone numbers |
| 🚚 **Delivery** | Manage delivery staff, assign orders |
| 📜 **Audit Logs** | Track who did what and when |

### Special Features

| Feature | What it Does |
|---------|--------------|
| 🔐 **Role-Based Access** | Different staff see different pages |
| 🔢 **OTP Verification** | Verify dine-in COD orders with OTP |
| 📱 **WhatsApp Notifications** | Send order updates, OTP codes |
| 🖨️ **Thermal Printing** | Print receipts on 72mm thermal printers |
| 📴 **Store Toggle** | Pause/resume accepting online orders |
| 👥 **Staff Management** | Add/remove staff, set permissions |

---

## 🛠️ Tech Stack

| Technology | What it Does | Think of it as... |
|------------|--------------|-------------------|
| **React 19** | The framework for building the UI | The blueprint of the building |
| **Vite 7** | Super fast development tool | Power tools for quick building |
| **Firebase** | Database + Authentication | The vault storing all data |
| **Razorpay** | Payment processing for POS | The cash register |
| **Tailwind CSS** | Styling framework | Paint and decorations |
| **daisyUI** | Pre-made components | Pre-built furniture |
| **Recharts** | Charts and graphs | The analytics displays |
| **React Icons** | Beautiful icons | Signage and symbols |
| **RawBT** | Thermal printer app | The receipt printer driver |

---

## 📁 Project Structure

```
venkys_admin/
├── api/                    # 🌐 Backend API functions (Vercel)
│   ├── lib/                # Helper functions
│   │   └── rateLimiter.js  # Prevents spam/abuse
│   ├── create-order.js     # Creates Razorpay order (for POS)
│   ├── verify-payment.js   # Verifies payment
│   ├── send-whatsapp.js    # Sends WhatsApp (OTP, etc.)
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

# WhatsApp Cloud API
WA_PHONE_NUMBER_ID=your_whatsapp_phone_id
WA_ACCESS_TOKEN=your_whatsapp_access_token

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

### WhatsApp Variables

| Variable | Purpose |
|----------|---------|
| `WA_PHONE_NUMBER_ID` | WhatsApp Business number |
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
3. OTP is sent to configured "Cash Manager" phones via WhatsApp
4. When customer pays, staff enters OTP to verify
5. Order is marked as paid

```
Customer orders → Staff creates bill → COD selected
                                            │
                                            ▼
                                    OTP generated (e.g., 1234)
                                            │
                                            ▼
                              WhatsApp sent to Cash Manager(s)
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

#### Phone Numbers (WhatsApp)
- 📱 **Cash Manager Phones** - Who receives OTP for dine-in COD
- 📱 **Order Messenger Phones** - Who receives new order notifications

**⚠️ IMPORTANT: Phone Number Format**
- Store as **10 digits only** (no country code)
- Example: `9876543210` ✅
- NOT: `919876543210` ❌
- NOT: `+919876543210` ❌

The system automatically adds `91` when sending WhatsApp.

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

### POST `/api/send-whatsapp`
Sends WhatsApp messages (OTP, notifications).

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
│        └─→ OTP sent to Cash Manager(s) via WhatsApp         │
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

## 📱 WhatsApp Integration

The admin app uses WhatsApp Cloud API for two purposes:

### 1. Cash Manager OTP (Dine-In COD)

When a dine-in customer wants to pay cash:

1. Staff creates the order in POS
2. System generates 4-digit OTP
3. OTP is sent to all "Cash Manager" phones
4. Template used: `venkys_cash_manager_otp`

**Setup Required:**
- Create WhatsApp template `venkys_cash_manager_otp` in Meta Business
- Template must accept 1 body parameter (the OTP)
- Add Cash Manager phone numbers in Settings

### 2. Order Messenger (New Order Alerts)

When a customer places an order:

1. Order is saved to database
2. System sends WhatsApp to all "Order Messenger" phones
3. Template used: `venkys_order_messenger`
4. Contains: Customer name, Total amount, Delivery address

**Setup Required:**
- Create WhatsApp template `venkys_order_messenger` in Meta Business
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

The system automatically adds `91` prefix when sending to WhatsApp API.

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

## 🚢 Deployment

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

#### "WhatsApp not sending"
**Causes & Solutions:**
1. Check `WA_PHONE_NUMBER_ID` and `WA_ACCESS_TOKEN` are set
2. Verify template is approved in Meta Business
3. Check phone number is 10 digits (not 12 with 91)
4. Check Vercel function logs for errors

#### "OTP not received"
**Causes & Solutions:**
1. Check Cash Manager phones in Settings
2. Verify phones are 10 digits
3. Check WhatsApp template `venkys_cash_manager_otp` exists
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
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code for errors |
| `npm run deploy` | Build and deploy to Firebase |

---

## 🔗 Related Apps

- **Customer App** (`venkys/`) - For customers to order food
- **Admin App** (`venkys_admin/`) - This app, for staff

Both apps share the same Firebase project for:
- Authentication (same user accounts)
- Firestore (same database)
- Storage (same images)

---

## 📞 Support

For technical support, contact the development team or check the main repository.

---

Made with ❤️ for Venky's Cheat Mealz
