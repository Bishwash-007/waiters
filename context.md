# Waiters Mobile App Context

## Product

This is a React Native/Expo mobile application for café waiters.

Waiters can:

- Sign in with staff credentials
- View and manage tables
- Take dine-in orders
- Browse menu items and add them to orders
- Send orders to the kitchen
- Monitor and manage active orders
- Edit orders
- Process checkout and payments
- View and manage their profile

Customer registration and customer login are not part of this app.

## Authentication

The waiter authentication flow is:

1. Sign in with email and password.
2. Navigate to sign-up when no account exists.
3. Navigate to forgot-password when credentials are forgotten.
4. Use bearer access tokens for authenticated API requests.
5. Include the tenant header on tenant-scoped requests.

Relevant API documentation: [docs/curl.md](./docs/curl.md).

The waiter role is `waiter`. Branch-scoped tokens must only access their assigned branch.

## Main Navigation

The authenticated application has three tabs:

1. Tables
2. Orders
3. Profile

Use Expo Router for navigation. Routes live under [src/app/](./src/app/).

## Tables Flow

The Tables screen displays the current branch tables in a grid or `FlatList`.

Each table should show:

- Table number or name
- Availability status
- Occupancy
- Active order indicator
- Reservation information when available

Supported table states may include:

- Available
- Occupied
- Reserved
- Billing
- Out of service

Selecting a table navigates to the order-taking screen. The waiter can browse the branch menu, choose quantities, configure modifiers, add notes, and review the current order summary.

After placing an order:

1. Send the order to the kitchen through the API.
2. Show a success toast.
3. Refresh the table state.
4. Navigate back to Tables or Orders.
5. Never hide API errors behind a success-shaped fallback.

## Order-Taking Screen

The order-taking screen should include:

- Selected table information
- Menu category filters
- Menu search
- Menu item cards or rows
- Quantity controls
- Modifiers and add-ons
- Item notes
- Current order summary
- Subtotal
- Tax or service charge when returned by the API
- Discounts when applicable
- Grand total
- Place order action

On mobile, the order summary may use a bottom sheet or fixed bottom panel. Bottom actions must remain above the safe-area inset.

Recommended route:

```text
(screens)/ordertaking/[tableId]
```

## Orders Flow

The Orders tab lists active and historical branch orders.

Display a filter-pill row with:

- All
- Placed
- Confirmed
- Preparing
- Ready
- Served
- Awaiting payment
- Paid
- Cancelled

Support sorting by:

- Newest
- Oldest
- Table
- Status
- Total amount

Selecting an order navigates to order details.

## Order Details

The order details screen should show:

- Order number
- Table
- Waiter
- Created time
- Order status
- Ordered items
- Modifiers
- Notes
- Editable quantities where permitted
- Price breakdown
- Payment state
- Kitchen state

Possible actions:

- Edit order
- Add or remove items
- Send changes to the kitchen
- Mark served
- Start checkout
- View payments
- Cancel the order when allowed

Order lifecycle:

```text
placed
→ confirmed
→ preparing
→ ready
→ served
→ awaiting_payment
→ paid
```

Cancellation is allowed only for statuses supported by the API.

## Checkout and Payments

Use the real order checkout endpoint:

```text
POST /orders/:id/checkout
```

Do not use the legacy `POST /checkout` endpoint for actual payment processing.

Checkout should:

1. Confirm that the order can be checked out.
2. Show the final total.
3. Start checkout.
4. Display the returned QR or hosted-checkout payload.
5. Refresh or poll payment status.
6. Show success or failure.
7. Refresh the order and table.
8. Release the table after successful payment when supported.

Supported payment methods may include cash, card, wallet, and QR payment.

Payment status must come from the API, not only local UI state.

Configure the API host with the Expo public environment variable
`EXPO_PUBLIC_API_URL`. Development defaults to `http://localhost:3000`; native
devices should use a host reachable from the device instead of `localhost`.

## Profile

The Profile tab should include:

- Waiter name
- Email
- Role
- Assigned branch
- Account details
- Session information
- Logout

Logout must clear local access and refresh tokens after the API session is ended.

## API Conventions

See [docs/curl.md](./docs/curl.md) for the complete API cookbook.

Tenant-scoped requests require:

```http
X-Tenant-Id: <tenant UUID or slug>
Authorization: Bearer <access token>
```

JSON requests require:

```http
Content-Type: application/json
```

Common response codes:

- `400` validation error
- `401` missing or invalid authentication
- `402` subscription restriction
- `403` forbidden role, branch, or tenant access
- `404` resource not found
- `409` state conflict
- `422` unsupported or unprocessable operation
- `429` rate limit exceeded

Show actionable loading, empty, error, and success states. Disable duplicate submissions while requests are pending.

## UI and Code Conventions

- Mobile-first Expo/React Native implementation
- Expo Router for all navigation
- `SafeAreaProvider` at the app root
- `SafeAreaView` for screen content and bottom actions
- Shared `Header` component on screens
- Light and dark mode support
- Monochrome design tokens
- Poppins for display and headings
- Inter for body text
- Lucide icons through [src/constants/icons.ts](./src/constants/icons.ts)
- Reusable UI components from [src/components/ui/](./src/components/ui/)
- `FlatList` for long lists
- Explicit API errors; no broad silent catches
- Confirm destructive actions

## Existing UI Components

Use existing components before creating new ones:

- Button
- TextInput
- SearchInput
- Select
- Tabs
- Header
- Card
- Badge
- Alert
- ModalDialog
- BottomSheet
- Loading
- EmptyState
- Pagination
- Slider
- Toggle
- Checkbox
- Radio

## Expected Routes

```text
(auth)/sign-in
(auth)/sign-up
(auth)/forgot-password
(auth)/forgot-password/verify-code

(tabs)/tables
(tabs)/orders
(tabs)/profile

(screens)/ordertaking/[tableId]
(screens)/orderdetails/[id]
(screens)/orderdetails/summary/[id]
(screens)/checkout/[id]
```
