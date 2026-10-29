# Bliss Cafe Waiter Mobile App - React Native + Expo Requirements

## Overview
Build a mobile waiter app for Bliss Cafe using React Native with Expo. The app allows waiters to take orders, place orders to kitchen, manage tables, and process payments. No customer registration/login required from the waiter's side.

**Backend:** NestJS API at `http://localhost:3000` (or configured BASE_URL)  
**API Reference:** See `app_curl.md` for waiter-specific endpoints

---

## Tech Stack
- **Framework:** React Native with Expo (SDK ~52+)
- **Navigation:** Expo Router or React Navigation (Bottom Tabs + Stack)
- **State Management:** Zustand or React Context API
- **API Calls:** Axios with interceptors
- **Storage:** Expo SecureStore for tokens, AsyncStorage for app settings
- **UI Components:** NativeBase, Gluestack UI, or React Native Paper
- **Real-time (Optional):** Socket.IO client for KDS updates
- **Forms:** React Hook Form + Zod validation

---

## Authentication
### Requirements
- Login screen with email/password
- Store access token securely (Expo SecureStore)
- Auto-refresh token on expiry (using refresh token)
- Persist login session
- Logout functionality
- Get current user info (`/auth/me`)
- Handle 401/403 errors globally

### API Endpoints
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Screens
- **LoginScreen** - Email, password, tenant selection (or pre-configured)

---

## App Architecture

### Navigation Structure
```
App
├── Auth Stack (if not logged in)
│   └── Login
└── Main Tab Navigator (if logged in)
    ├── Tables (Home)
    ├── Menu/Orders
    ├── Active Orders (KDS View)
    └── Profile
```

### Global State
- **AuthStore:** user, accessToken, refreshToken, tenantId, branchId, role
- **CartStore:** current order draft (branchId, tableId, orderType, items, notes)
- **OrderStore:** active orders list

---

## Screens

### 1. Login Screen
**Route:** `/login`
**Purpose:** Authenticate waiter

**Components:**
- Tenant ID input (or dropdown)
- Email input
- Password input (secure)
- Login button
- Loading state

**API:** `POST /auth/login`

**Validation:**
- Email format
- Password required

---

### 2. Tables Screen (Home)
**Route:** `/(tabs)/tables`
**Purpose:** View and select tables for taking orders

**Components:**
- Branch selector (if multiple branches, though waiter is usually branch-confined)
- Table grid/list with status indicators
- Status colors: Available, Occupied, Reserved
- Refresh button/pull to refresh
- Filter by status

**API:**
- `GET /branches` - Get branches
- `GET /branches/:branchId/tables` - Get tables

**Actions:**
- Tap table → Navigate to Menu screen with tableId pre-selected
- Show active order count per table (if occupied)

---

### 3. Menu Screen
**Route:** `/(tabs)/menu` or `/order/create`
**Purpose:** Browse menu and build order (take order)

**Components:**
- Category tabs/filters
- Menu item cards (image, name, price, availability)
- Item details modal (modifiers, notes)
- Cart/Floating cart button with item count & total
- Search bar
- Back to tables

**API:**
- `GET /menu/categories?branchId=...`
- `GET /menu/items?branchId=...`

**Cart Functionality:**
- Add item to cart
- Select modifiers (if any)
- Add notes per item
- Adjust quantity (+/-)
- Remove item
- View cart summary

**State:** Use CartStore

---

### 4. Cart/Review Order Screen
**Route:** `/order/review`
**Purpose:** Review order before placing

**Components:**
- Order type selector (dine_in/takeaway/delivery)
- Table selection (pre-filled if from table)
- Customer field (optional - can be left empty)
- Order items list with modifiers & notes
- Order summary (subtotal, tax, discount, total)
- Special instructions
- "Place Order" button
- "Add more items" button

**API:** `POST /orders`

**Request Body:**
```json
{
  "branchId": "...",
  "tableId": "...",
  "orderType": "dine_in",
  "customerId": null,
  "items": [
    {
      "menuItemId": "...",
      "quantity": 1,
      "notes": "...",
      "modifiers": [{"name": "...", "optionName": "..."}]
    }
  ]
}
```

**Actions:**
- Validate cart not empty
- Create order via API
- On success: Clear cart, navigate to Active Orders or show confirmation
- Optionally transition to `confirmed` automatically or ask waiter

---

### 5. Active Orders Screen (Orders List)
**Route:** `/(tabs)/orders`
**Purpose:** View all active orders for the branch

**Components:**
- Tab filters: All, Placed, Preparing, Ready, Served
- Order card (Order #, Table, Items summary, Status, Time elapsed)
- Status badge with color
- Pull to refresh
- "View Details" button
- Quick actions based on status

**API:**
- `GET /orders/branches/:branchId/active`

**Quick Actions:**
- Placed → Confirm (Place order)
- Preparing → Mark Ready
- Ready → Serve
- Served → Checkout/Payment

---

### 6. Order Details Screen
**Route:** `/order/[id]`
**Purpose:** View full order details and take actions

**Components:**
- Order header (Order ID, Status, Table, Time)
- Items list with modifiers and notes
- Order timeline/status history (optional)
- Price breakdown
- Action buttons based on status and role
- "Print Receipt" (optional)

**API:**
- `GET /orders/:id`
- `POST /orders/:id/transition`
- `POST /orders/:id/checkout`

**Actions:**
- Transition status
- Initiate checkout
- Cancel order (if allowed)

---

### 7. Checkout/Payment Screen
**Route:** `/order/[id]/checkout`
**Purpose:** Process payment for order

**Components:**
- Order summary
- Total amount
- Payment method selection (based on available providers)
- "Generate QR/Checkout" button
- Payment status
- "Mark as Paid" (if manual/cash)
- View payment details

**API:**
- `POST /orders/:id/checkout` - Start checkout
- `GET /payments/order/:orderId` - Check payment status

**Flow:**
1. Initiate checkout
2. Show QR code or redirect to payment URL
3. Poll for payment status or wait for webhook
4. On success, mark order as paid/completed

---

### 8. Profile Screen
**Route:** `/(tabs)/profile`
**Purpose:** User info and settings

**Components:**
- User info (name, email, role, branch)
- Branch info
- Settings (tenant, base URL)
- Logout button
- App version

**API:** `GET /auth/me`

---

## Features

### Core Features
- [x] Login/Logout
- [x] View tables
- [x] Browse menu by category
- [x] Take order (create order without customer)
- [x] Add items with modifiers and notes
- [x] Place order (confirm to kitchen)
- [x] View active orders
- [xTab] Update order status
- [x] Checkout and process payment
- [x] Branch-scoped access

### Nice to Have
- [ ] Offline mode with queue (sync when online)
- [ ] Push notifications for order ready
- [ ] Print receipt via Bluetooth printer
- [ ] Split bill
- [ ] Apply discount (if allowed)
- [ ] Order history
- [ ] Dark mode
- [ ] Multi-language
- [ ] Real-time updates via Socket.IO

---

## API Integration

### Base Configuration
```typescript
// config/api.ts
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  tenantId: process# process.env.EXPO_PUBLIC_TENANT_ID || '',
};
```

### Axios Instance
```typescript
// services/api.ts
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'X-Tenant-Id: API_CONFIG.tenantId,
    'Content-Type': 'application/json',
  },
});
</styl>
``` 

### Interceptors
- Request: Add Authorization header with access token
- Response: Handle 401 → refresh token or logout

---

## UI/UX Requirements
- **Mobile-first:** Optimized for phones (portrait)
- **Fast:** Minimal taps to take and place an order
- **Clear status:** Color-coded order statuses
- **Offline-aware:** Show network status
- **Touch-friendly:** Large buttons for restaurant environment
- **Simple:** No complex customer management needed

---

## Permissions & Roles
Waiter can access:
- Tables, Menu
- Orders (create, read, transition within branch)
- Checkout & Payments
- Customers (optional)

Waiter cannot access:
- Inventory, Staff management, Reporting, Billing, Platform admin

---

## Environment Variables
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_TENANT_ID=beanhouse
```

---

## Testing Requirements
- Unit tests for stores and utils
- Component tests with React Native Testing Library
- Integration tests for API calls
- E2E tests with Detox (optional)

---

## Deployment
- **Development:** `npx expo start`
- **Build:** EAS Build for Android/iOS
- **Distribution:** Internal testing or app stores

---

## Notes
- **No customer required:** Waiter can take orders without creating/selecting a customer. `customerId` can be omitted or null.
- **Branch scope enforced:** App should respect branch confinement from token.
- **Money computed server-side:** Never calculate prices on client.
- **Idempotency:** Consider adding `clientActionId` for order creation retries.
- **Rate limiting:** App should handle 429 responses gracefully.
