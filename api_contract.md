# no-delivery — Full Frontend ↔ Backend API Contract

> **Base URL:** `http://localhost:5000`  
> **Content-Type:** `application/json` (all POST / PATCH requests)

---

## System Overview

```
Browser (React, port 3000)
    │
    ├─ CustomerCheckout page  ─────► /api/customer/*
    │     ├─ CartUI.jsx              Place orders, fetch stores
    │     └─ ReviewSubstitutesModal  Poll order status, resolve substitutions
    │
    ├─ PickerRun page ────────────► /api/picker/*
    │     └─ ActiveRunUI.jsx         List orders, load items, update per-item status, finalize
    │
    └─ (Driver / Admin / Dispatch)  ► /api/driver/*  /api/dispatch/*  /api/admin/*
```

---

## Important: Product ID Mapping

The React frontend uses **string product codes**. The database stores **UUID `item_id` values**.  
The backend transparently translates between them so neither side needs to change.

| Frontend Code  | Database UUID                            |
|----------------|------------------------------------------|
| `APPLE-FUJI-01` | `a0000000-0000-0000-0000-000000000001` |
| `MILK-GAL-02`   | `a0000000-0000-0000-0000-000000000002` |
| `BANANA-ORG-03` | `a0000000-0000-0000-0000-000000000003` |
| `BREAD-WW-04`   | `a0000000-0000-0000-0000-000000000004` |
| `CEREAL-BOX-05` | `a0000000-0000-0000-0000-000000000005` |
| `EGGS-DOZ-06`   | `a0000000-0000-0000-0000-000000000006` |

> **Rule:** Incoming frontend product codes → mapped to UUIDs before DB insert.  
> Outgoing DB UUID results → mapped back to string codes before API response.

---

## Item Status State Machine

```
pending  →  found          (picker marks item located)
         →  not_found      (picker marks item missing, sub_rules = skip/auto)
         →  awaiting_customer  (picker marks not found, sub_rules = ask)

awaiting_customer  →  not_found   (customer chooses "skip")
                   →  replaced    (customer chooses "substitute")
```

Valid database status values: `pending`, `found`, `not_found`, `replaced`, `awaiting_customer`

---

## 1. Customer Domain — `/api/customer`

### 1.1  GET `/api/customer/stores`

**Caller:** `CartUI.jsx` — on component mount, to populate the store selector dropdown.

**Request:** No body, no params.

**Success Response `200`:**
```json
[
  {
    "store_id": "2986fc02-542c-4afc-9ed2-f45527c9e9b0",
    "store_name": "Metro Grocers",
    "created_at": "2026-07-31T08:00:00.000Z"
  }
]
```
> Note: The backend reads `stores.id` and `stores.name` from the database and maps them to `store_id` / `store_name` for the frontend.

**Error Responses:**
| Status | When |
|--------|------|
| `500` | Supabase failure |

---

### 1.2  POST `/api/customer/order`

**Caller:** `CartUI.jsx` — when the user clicks **"Place Order"**.

**Request Body:**
```json
{
  "store_id":     "2986fc02-542c-4afc-9ed2-f45527c9e9b0",
  "customer_id":  "22222222-2222-2222-2222-222222222222",
  "total_amount": 12.97,
  "items": [
    {
      "item_id":       "APPLE-FUJI-01",
      "qty_requested": 2,
      "sub_rules":     "ask",
      "item_price":    1.50
    },
    {
      "item_id":       "MILK-GAL-02",
      "qty_requested": 1,
      "sub_rules":     "skip",
      "item_price":    4.99
    }
  ]
}
```

**Field Constraints:**
| Field | Type | Rules |
|-------|------|-------|
| `store_id` | UUID string | Must be a valid UUID referencing a row in `stores` |
| `customer_id` | UUID string | Must be a valid UUID |
| `total_amount` | number | Non-negative float |
| `items` | array | At least 1 item |
| `items[].item_id` | string | Frontend code (`APPLE-FUJI-01`) or raw UUID |
| `items[].qty_requested` | integer | Positive integer ≥ 1 |
| `items[].sub_rules` | string | `ask`, `auto`, or `skip` |

**Backend Processing:**
1. Validates all fields and UUID formats.
2. Inserts a row into `order_table` with `store_id`, `customer_id`, `total_amount` → gets back `order_id`.
3. Maps frontend product codes to database UUIDs via `PRODUCT_MAPPING`.
4. Bulk-inserts all items into `item_table` with `status = 'pending'` (DB default).
5. If item insert fails, deletes the orphaned order row and returns an error.

**Success Response `201`:**
```json
{
  "message": "Order successfully created and sent to pickers.",
  "order_id": "943fe5f5-0c91-419b-a73d-625583cbaf7c"
}
```
> `CartUI.jsx` saves this `order_id` to `localStorage` as `active_order_id` so the **ReviewSubstitutesModal** can begin tracking automatically.

**Error Responses:**
| Status | When |
|--------|------|
| `400` | Missing fields, invalid UUID, bad `total_amount`, empty items array, missing item fields |
| `422` | DB check constraint violation (e.g., invalid `sub_rules` value) |
| `500` | Unexpected server / DB error |

---

### 1.3  GET `/api/customer/order/:order_id/status`

**Caller:** `ReviewSubstitutesModal.jsx` — on mount and every 5 seconds (polling).

**URL Params:**
| Param | Type | Description |
|-------|------|-------------|
| `order_id` | UUID | The `order_id` returned from `POST /api/customer/order` |

**Backend Processing:**
1. Joins `order_table` with `item_table` using Supabase nested select.
2. Maps `item_table.list` (PK) → `list_id` in the response.
3. Maps DB UUIDs in `item_id` and `replacement_item_id` back to frontend product codes.

**Success Response `200`:**
```json
{
  "order_id":     "943fe5f5-0c91-419b-a73d-625583cbaf7c",
  "order_status": "PENDING",
  "order_date":   "2026-07-31T08:05:38.196Z",
  "items": [
    {
      "list_id":             "1ba697c1-3d11-4a1f-bbab-049b1ebc970d",
      "item_id":             "APPLE-FUJI-01",
      "qty_requested":       2,
      "sub_rules":           "ask",
      "status":              "awaiting_customer",
      "replacement_item_id": null
    }
  ]
}
```

**What the frontend does with it:**
- Renders live picking status badges per item.
- If any item has `status === 'awaiting_customer'`, auto-opens the resolution modal for that item.
- The modal uses `list_id` to target the `PATCH /resolve` call.

**Error Responses:**
| Status | When |
|--------|------|
| `404` | Order ID not found |
| `500` | DB error |

---

### 1.4  PATCH `/api/customer/item/:list_id/resolve`

**Caller:** `ReviewSubstitutesModal.jsx` — when customer clicks "Skip" or "Substitute" in the resolution modal.

**URL Params:**
| Param | Type | Description |
|-------|------|-------------|
| `list_id` | UUID | The `list_id` from the item in the order status response |

**Request Body:**
```json
{
  "action": "substitute",
  "replacement_item_id": "BANANA-ORG-03"
}
```
Or for skipping:
```json
{
  "action": "skip",
  "replacement_item_id": null
}
```

**Field Constraints:**
| Field | Values | Notes |
|-------|--------|-------|
| `action` | `"skip"` or `"substitute"` | Required |
| `replacement_item_id` | Frontend product code string | Required only when `action = "substitute"` |

**Backend Processing:**
1. Maps `action` → new DB status: `"skip"` → `not_found`, `"substitute"` → `replaced`.
2. Maps the frontend `replacement_item_id` product code to a DB UUID via `PRODUCT_MAPPING`.
3. Updates `item_table` WHERE `list = list_id` AND `status = 'awaiting_customer'` (security guard — prevents double updates).

**Success Response `200`:**
```json
{
  "message": "Item successfully marked as replaced.",
  "data": {
    "list": "1ba697c1-3d11-4a1f-bbab-049b1ebc970d",
    "order_id": "943fe5f5-0c91-419b-a73d-625583cbaf7c",
    "item_id": "a0000000-0000-0000-0000-000000000001",
    "status": "replaced",
    "replacement_item_id": "a0000000-0000-0000-0000-000000000003"
  }
}
```

**Error Responses:**
| Status | When |
|--------|------|
| `400` | Invalid `action`, missing `replacement_item_id` when substituting |
| `404` | Item not found OR item is not currently `awaiting_customer` |
| `500` | Unexpected error |

---

## 2. Picker Domain — `/api/picker`

### 2.1  GET `/api/picker/orders`

**Caller:** `PickerRun.jsx` — on page load and on "Refresh Lists" click.

**Request:** No body, no params.

**Success Response `200`:** Array of all orders from `order_table`, latest first.
```json
[
  {
    "order_id":            "943fe5f5-0c91-419b-a73d-625583cbaf7c",
    "order_status":        "PENDING",
    "order_date":          "2026-07-31T08:05:38.196Z",
    "finalized_at":        null,
    "store_id":            "2986fc02-542c-4afc-9ed2-f45527c9e9b0",
    "customer_id":         "22222222-2222-2222-2222-222222222222",
    "picker_id":           null,
    "delivery_partner_id": null,
    "assigned_partner_id": null,
    "assigned_at":         null,
    "total_amount":        12.97
  }
]
```

> `PickerRun.jsx` uses `order_status` to style the card badge and determine whether to mark it "Order Received" on click.

---

### 2.2  PATCH `/api/picker/order/:order_id/status`

**Caller:** `PickerRun.jsx` — when a receipt card is clicked and current status is `pending` or `pending_pick`.

**URL Params:** `order_id` (UUID)

**Request Body:**
```json
{ "status": "order received" }
```

**Success Response `200`:**
```json
{
  "message": "Order status updated successfully",
  "data": { "order_id": "...", "order_status": "order received", ... }
}
```

---

### 2.3  GET `/api/picker/order/:order_id`

**Caller:** `ActiveRunUI.jsx` — on mount and every 5 seconds (polling) to get live item status.

**URL Params:** `order_id` (UUID)

**Backend Processing:**
1. Joins `order_table` with `item_table`.
2. Maps `item_table.list` → `list_id` in response.
3. Maps DB UUIDs for `item_id` / `replacement_item_id` back to frontend product codes.

**Success Response `200`:**
```json
{
  "order_id":     "943fe5f5-0c91-419b-a73d-625583cbaf7c",
  "order_status": "PENDING",
  "order_date":   "2026-07-31T08:05:38.196Z",
  "items": [
    {
      "list_id":             "1ba697c1-3d11-4a1f-bbab-049b1ebc970d",
      "item_id":             "APPLE-FUJI-01",
      "qty_requested":       2,
      "sub_rules":           "ask",
      "status":              "pending",
      "replacement_item_id": null
    }
  ]
}
```

> `ActiveRunUI.jsx` uses `list_id` as the key for each item row and for targeting status updates.  
> `item_id` is looked up in its local `PRODUCTS_CATALOG` to render the item name and emoji.

**Error Responses:**
| Status | When |
|--------|------|
| `400` | Invalid UUID format |
| `404` | Order not found |
| `500` | DB error |

---

### 2.4  PATCH `/api/picker/item/:list_id`

**Caller:** `ActiveRunUI.jsx` — when picker taps "Found", "Not Found", or when `sub_rules = ask` and item not found (sends `awaiting_customer`).

**URL Params:** `list_id` (UUID — the `list_id` from the item object)

**Request Body:**
```json
{ "status": "found" }
```
Or when not found with sub_rules = ask:
```json
{ "status": "awaiting_customer" }
```
Or when replacing (auto rule):
```json
{
  "status": "replaced",
  "replacement_item_id": "BANANA-ORG-03"
}
```

**Field Constraints:**
| Field | Valid Values |
|-------|-------------|
| `status` | `found`, `not_found`, `replaced`, `awaiting_customer` |
| `replacement_item_id` | Frontend product code — required only when status is `replaced` or `awaiting_customer` |

**Backend Processing:**
1. Validates `list_id` is a valid UUID.
2. Validates `status` is one of the 4 allowed values.
3. Maps `replacement_item_id` product code → DB UUID if provided.
4. Updates `item_table` WHERE `list = list_id`.

**Success Response `200`:**
```json
{
  "message": "Item updated successfully",
  "data": {
    "list": "1ba697c1-...",
    "status": "found",
    "replacement_item_id": null,
    ...
  }
}
```

> `ActiveRunUI.jsx` performs **optimistic UI update** first (instant local state), then calls this endpoint in the background. If it fails, an error banner is shown.

**Error Responses:**
| Status | When |
|--------|------|
| `400` | Invalid UUID or invalid status value |
| `404` | Item not found |
| `500` | DB error |

---

### 2.5  POST `/api/picker/order/:order_id/complete`

**Caller:** `ActiveRunUI.jsx` — when picker clicks "Submit Checklist to DB". The button is disabled until all items have a non-`pending`, non-`awaiting_customer` status.

**URL Params:** `order_id` (UUID)

**Request Body:** Empty (no body needed).

**Backend Processing:**
1. Checks all `item_table` rows for this order.
2. If any item is still `pending` or `awaiting_customer` → rejects with `400`.
3. Otherwise → updates `order_table.order_status` to `'FINALIZED'`.

**Success Response `200`:**
```json
{
  "message": "Order completed successfully",
  "data": {
    "order_id": "943fe5f5-...",
    "order_status": "FINALIZED",
    ...
  }
}
```

**Error Responses:**
| Status | When |
|--------|------|
| `400` | Still has pending/awaiting items |
| `404` | Order not found |
| `500` | DB error |

---

## 3. Driver Domain — `/api/driver`

### 3.1  GET `/api/driver/orders/ready`

**Caller:** Driver dashboard — lists all orders ready for pickup.

**Request:** No body, no params.

**Backend Processing:** Queries `order_table` WHERE `order_status = 'FINALIZED'`, joins `store_table` view for the store name.

**Success Response `200`:**
```json
[
  {
    "order_id":     "b58b55f5-...",
    "order_status": "FINALIZED",
    "order_date":   "2026-07-31T07:03:11.693Z",
    "total_amount": 15.99,
    "customer_id":  "22222222-2222-2222-2222-222222222222",
    "picker_id":    null,
    "store": {
      "store_name": "Metro Grocers"
    }
  }
]
```

---

### 3.2  PATCH `/api/driver/order/:order_id/deliver`

**Caller:** Driver dashboard — when driver marks an order delivered.

**URL Params:** `order_id` (UUID)

**Request Body:** Empty.

**Constraint:** Order status must be `FINALIZED` or `ASSIGNED`. Rejects otherwise.

**Success Response `200`:** Full updated `order_table` row with `order_status: "DELIVERED"`.

**Error Responses:**
| Status | When |
|--------|------|
| `400` | Invalid UUID |
| `404` | Order not found OR status lifecycle violation |
| `500` | DB error |

---

## 4. Dispatch Domain — `/api/dispatch`

> ⚠️ These endpoints are **placeholders** and return mock responses.

| Method | Path | Returns |
|--------|------|---------|
| `POST` | `/api/dispatch/finalize` | `{ message: "Order finalization placeholder" }` |
| `POST` | `/api/dispatch/assign` | `{ message: "Driver assignment placeholder" }` |

---

## 5. Admin Domain — `/api/admin`

> ⚠️ These endpoints are **placeholders** and return mock responses.

| Method | Path | Returns |
|--------|------|---------|
| `GET` | `/api/admin/metrics` | `{ message: "Admin metrics placeholder" }` |
| `GET` | `/api/admin/flagged-stores` | `{ message: "Flagged stores placeholder" }` |

---

## 6. End-to-End Flow Summary

```
1. CUSTOMER places order
   CartUI  →  GET /api/customer/stores             (populate dropdown)
   CartUI  →  POST /api/customer/order             (place order, save order_id to localStorage)

2. CUSTOMER tracks order
   ReviewSubstitutesModal  →  GET /api/customer/order/:id/status  (every 5s)
   [if item.status === 'awaiting_customer']
   ReviewSubstitutesModal  →  PATCH /api/customer/item/:list_id/resolve

3. PICKER receives and processes order
   PickerRun  →  GET /api/picker/orders             (list all orders)
   PickerRun  →  PATCH /api/picker/order/:id/status  (mark "order received")
   ActiveRunUI  →  GET /api/picker/order/:id         (load item checklist, every 5s)
   [for each item]
   ActiveRunUI  →  PATCH /api/picker/item/:list_id   (found / not_found / awaiting_customer)
   [when all items resolved]
   ActiveRunUI  →  POST /api/picker/order/:id/complete

4. DRIVER delivers order
   DriverDashboard  →  GET /api/driver/orders/ready
   DriverDashboard  →  PATCH /api/driver/order/:id/deliver
```
