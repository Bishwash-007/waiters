# Waiter App Flow Documentation

This document explains the complete waiter workflow for Bliss Cafe, with API references from [`curl.md`](./curl.md) and [`app_curl.md`](./app_curl.md).

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Login](#authentication--login)
3. [Branch & Table Selection](#branch--table-selection)
4. [Taking an Order](#taking-an-order)
5. [Editing an Order](#editing-an-order)
6. [Placing/Confirming an Order (Send to Kitchen)](#placingconfirming-an-order-send-to-kitchen)
7. [Viewing Orders (Active/KDS)](#viewing-orders-activekds)
8. [Order Status Transitions](#order-status-transitions)
9. [Additional Orders for Same Table](#additional-orders-for-same-table)
10. [Checkout & Payment](#checkout--payment)
11. [Important Notes & Rules](#important-notes--rules)

---

## Overview

- **Role Required:** `waiter` (or `receptionist`, `branch_manager`, `org_owner`, `super_admin`)
- **Customer not required:** Waiters can take orders without creating/selecting a customer. `customerId` can be `null` or omitted.
- **Branch confined:** Waiters are typically confined to their assigned branch. They can only work with tables/orders in that branch.
- **Money is server-calculated:** Never send `unitPrice`, `subtotal`, `totalAmount` when creating orders. The backend calculates from menu items.

---

## Authentication & Login

### 1. Login

**Endpoint:** `POST /auth/login`  
**Auth:** None (Tenant required)  
**Reference:** [curl.md - Authentication](./curl.md#authentication)

```bash
curl -sS -X POST "$BASE_URL/auth/login" \
  -H "X-Tenant-Id: $TENANT" \
  -H 'Content-Type: application/json' \
  -d '{"email":"waiter@testcafe.test","password":"password123"}'
```

**Response:**

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "userId": "...",
    "email": "waiter@testcafe.test",
    "role": "waiter",
    "tenantId": "...",
    "branchId": "..."
  }
}
```

### 2. Get Current User (Optional)

**Endpoint:** `GET /auth/me`  
**Auth:** Bearer token

```bash
curl -sS -X GET "$BASE_URL/auth/me" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. Token Refresh

**Endpoint:** `POST /auth/refresh`  
**Auth:** None (Tenant required)

```bash
curl -sS -X POST "$BASE_URL/auth/refresh" \
  -H "X-Tenant-Id: $TENANT" \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"..."}'
```

---

## Branch & Table Selection

### 1. View Branches

**Endpoint:** `GET /branches`  
**Auth:** Bearer token  
**Reference:** [curl.md - Branches and tables](./curl.md#branches-and-tables)

```bash
curl -sS -X GET "$BASE_URL/branches" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 2. View Tables for Branch

**Endpoint:** `GET /branches/:branchId/tables`  
**Auth:** Bearer token

```bash
curl -sS -X GET "$BASE_URL/branches/$BRANCH_ID/tables" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Flow:**

1. After login, get branch info from user or fetch branches
2. Load tables for that branch
3. Display tables with status (free/occupied/reserved)
4. Select a table to start taking an order

---

## Taking an Order

### 1. Browse Menu

**Endpoints:**

- `GET /menu/categories?branchId=<branchId>` - View categories
- `GET /menu/items?branchId=<branchId>` - View items with prices

**Reference:** [curl.md - Menu](./curl.md#menu)

```bash
curl -sS -X GET "$BASE_URL/menu/categories?branchId=$BRANCH_ID" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

curl -sS -X GET "$BASE_URL/menu/items?branchId=$BRANCH_ID" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 2. Build Cart & Create Order

**Endpoint:** `POST /orders`  
**Auth:** Bearer token  
**Roles:** `super_admin`, `org_owner`, `branch_manager`, `receptionist`, `waiter`  
**Reference:** [curl.md - Orders and KDS](./curl.md#orders-and-kds) / [app_curl.md](./app_curl.md#orders-take-orders--place-orders)

```bash
curl -sS -X POST "$BASE_URL/orders" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "branchId": "'$BRANCH_ID'",
    "tableId": "<tableId>",
    "orderType": "dine_in",
    "customerId": null,
    "items": [
      {
        "menuItemId": "<menuItemId>",
        "quantity": 2,
        "notes": "no sugar",
        "modifiers": [
          {"name": "Size", "optionName": "Large"}
        ]
      }
    ]
  }'
```

**Notes:**

- For **dine_in**, `tableId` is required
- For **takeaway/delivery**, `tableId` can be omitted or `null`
- `customerId` is **optional** - can be `null` (no customer required)
- `clientActionId` can be used for idempotency on retries
- Do **not** send `unitPrice`, `subtotal`, or `totalAmount`
- Order is created with status `placed` by default

---

## Editing an Order

### Important Limitation

**There is NO `PATCH /orders/:id` endpoint and NO way to add items to an existing order.**

Once an order is created via `POST /orders`, the items are immutable. You cannot:

- Add more items to the same order
- Remove items from an existing order
- Edit quantities of existing items
- Change modifiers on existing items

### What CAN be done

- **View order details:** `GET /orders/:id` (now returns items + modifiers)
- **Change status:** `POST /orders/:id/transition`
- **Cancel order:** Transition to `cancelled` if allowed by state machine

If you need to modify items, you must follow the [Additional Orders for Same Table](#additional-orders-for-same-table) flow.

---

## Placing/Confirming an Order (Send to Kitchen)

After creating the order (status: `placed`), the waiter must **confirm/place** it to send it to the kitchen.

**Endpoint:** `POST /orders/:id/transition`  
**Auth:** Bearer token  
**Roles:** All staff roles (including waiter)

```bash
curl -sS -X POST "$BASE_URL/orders/<orderId>/transition" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"confirmed"}'
```

**Flow:**

1. Create order → status `placed`
2. Confirm order → status `confirmed` (sent to kitchen)
3. Kitchen updates to `preparing` → `ready`

---

## Viewing Orders (Active/KDS)

### Active Orders for Branch

**Endpoint:** `GET /orders/branches/:branchId/active`  
**Auth:** Bearer token  
**Returns:** All orders not `completed` or `cancelled` (KDS snapshot)

```bash
curl -sS "$BASE_URL/orders/branches/$BRANCH_ID/active" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### All Orders for Branch

**Endpoint:** `GET /orders/branches/:branchId`  
**Auth:** Bearer token

```bash
curl -sS "$BASE_URL/orders/branches/$BRANCH_ID" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get Single Order Details

**Endpoint:** `GET /orders/:id`  
**Auth:** Bearer token  
**Now returns:** Full order with `items[]` including `name`, `quantity`, `unit_price`, `notes`, `status`, and `modifiers[]`

```bash
curl -sS "$BASE_URL/orders/<orderId>" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Order Status Transitions

### Allowed Transition Graph

```
placed           -> confirmed, cancelled
confirmed        -> preparing, cancelled
preparing        -> ready, cancelled
ready            -> served, cancelled
served           -> awaiting_payment, cancelled
awaiting_payment -> paid, cancelled
paid             -> completed
completed        -> (terminal)
cancelled        -> (terminal)
```

### Waiter Actions by Status

| Status             | Waiter Action                                            | Transition To                                 |
| ------------------ | -------------------------------------------------------- | --------------------------------------------- |
| `placed`           | Place/Confirm order to kitchen                           | `confirmed`                                   |
| `confirmed`        | Usually done by kitchen, but waiter can cancel if needed | `cancelled`                                   |
| `preparing`        | Kitchen action, waiter can monitor                       | -                                             |
| `ready`            | Serve to customer                                        | `served`                                      |
| `served`           | Ready for checkout/payment                               | `awaiting_payment` (or use checkout endpoint) |
| `awaiting_payment` | Proceed to checkout                                      | -                                             |
| `paid`             | Mark complete (usually auto)                             | `completed`                                   |

**Note:** `paid` is normally reached via payment settlement, not manual transition. Use `POST /orders/:id/checkout` to initiate payment.

---

## Additional Orders for Same Table

If a customer orders another item after some time (e.g., another coffee), **you cannot add to the existing order**.

### Flow

1. Go back to **Tables** → Select the same table
2. Go to **Menu** → Add new item(s)
3. **Create a NEW order** via `POST /orders` with the same `tableId` and `branchId`
4. **Confirm the new order** via `POST /orders/:id/transition` with `status: "confirmed"` to send to kitchen

```bash
# Create second order for same table
curl -sS -X POST "$BASE_URL/orders" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "branchId": "'$BRANCH_ID'",
    "tableId": "'$TABLE_ID'",
    "orderType": "dine_in",
    "customerId": null,
    "items": [{"menuItemId": "<coffee-id>", "quantity": 1}]
  }'
```

### Important Notes

- Each order is separate with its own `order_id`
- KDS will show both orders for that table
- Multiple open orders can exist for the same table
- The waiter order-details screen shows only the items for the selected order
- **Checkout is per-order** - Each order must be checked out separately via `POST /orders/:id/checkout`
- There is currently **no "merge orders" or "combined bill"** functionality

---

## Checkout & Payment

### 1. Start Checkout

**Endpoint:** `POST /orders/:id/checkout`  
**Auth:** Bearer token  
**Roles:** `super_admin`, `org_owner`, `branch_manager`, `receptionist`, `waiter`  
**Reference:** [curl.md - Checkout, payments and webhooks](./curl.md#checkout-payments-and-webhooks)

```bash
curl -sS -X POST "$BASE_URL/orders/<orderId>/checkout" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "payment": { "id": "...", "status": "pending", "amount": "250.00" },
  "qr": {
    "provider": "stripe",
    "orderId": "...",
    "amount": 250.0,
    "format": "url",
    "data": "https://checkout.stripe.com/...",
    "expiresAt": null
  }
}
```

### 2. Check Payment Status

**Endpoint:** `GET /payments/order/:orderId`  
**Auth:** Bearer token

```bash
curl -sS "$BASE_URL/payments/order/<orderId>" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. After Payment

- Payment webhooks will update payment status
- Order typically moves to `paid` then `completed`
- Table may be freed when all orders for that table are closed

---

## Important Notes & Rules

### Branch Scope

- Waiters are branch-confined - they can only access their assigned branch
- Trying to access another branch will return `403`
- Org-wide roles (`org_owner`, `super_admin`) can access all branches

### Subscription State

- If tenant subscription is `past_due`, writes are blocked (returns `402`) - only reads allowed
- If subscription is `cancelled`, all tenant routes return `402`
- Exempt routes: `/auth`, `/billing`, `/onboarding`, `/platform`, `/webhooks`

### Rate Limiting

- Most routes: 300/min (configurable via `RATE_LIMIT_DEFAULT`)
- Login: 20/min, Refresh: 30/min
- Returns `429` with `Retry-After` header when exceeded

### Validation

- Request bodies are validated - invalid data returns `400` with array of validation errors
- Money fields are ignored from client - always calculated server-side

### Order Creation Rules

- `tableId` required for `dine_in` orders
- `customerId` optional (can be null)
- Items array must have at least 1 item
- Each item must reference a valid menu item from the tenant
- Modifiers must match the menu item's modifiers

### Key Differences

| Action           | Method                                                      | Notes                                |
| ---------------- | ----------------------------------------------------------- | ------------------------------------ |
| Take order       | `POST /orders`                                              | Creates order with status `placed`   |
| Send to kitchen  | `POST /orders/:id/transition` with `{"status":"confirmed"}` | Places order                         |
| Edit order items | **Not possible**                                            | Must create new order for same table |
| Serve order      | `POST /orders/:id/transition` with `{"status":"served"}`    | After ready                          |
| Checkout         | `POST /orders/:id/checkout`                                 | Initiates payment per order          |

---

## Quick Reference

| Step               | Endpoint                            | Method |
| ------------------ | ----------------------------------- | ------ |
| Login              | `/auth/login`                       | POST   |
| Get Tables         | `/branches/:branchId/tables`        | GET    |
| Get Menu           | `/menu/categories`, `/menu/items`   | GET    |
| Create Order       | `/orders`                           | POST   |
| Confirm Order      | `/orders/:id/transition`            | POST   |
| View Active Orders | `/orders/branches/:branchId/active` | GET    |
| View Order Details | `/orders/:id`                       | GET    |
| Update Status      | `/orders/:id/transition`            | POST   |
| Checkout           | `/orders/:id/checkout`              | POST   |
| Check Payment      | `/payments/order/:orderId`          | GET    |

For complete API details, see [`curl.md`](./curl.md).
