# API Contracts & Supabase Data Shapes

## Supabase Tables

### `orders`
- `id` (uuid, primary key)
- `created_at` (timestamp)
- `status` (text: pending, picking, finalized, dispatched)
- `customer_id` (uuid)
- `picker_id` (uuid)
- `total_amount` (numeric)

### `order_items`
- `id` (uuid, primary key)
- `order_id` (uuid)
- `product_id` (uuid)
- `quantity` (int)
- `status` (text: pending, picked, substitute_requested, resolved)
- `substitute_product_id` (uuid)

### `substitutions`
- `id` (uuid, primary key)
- `order_item_id` (uuid)
- `original_product_id` (uuid)
- `proposed_product_id` (uuid)
- `status` (text: pending, accepted, rejected, timed_out)
- `created_at` (timestamp)

## API Endpoints

- `POST /api/orders` - Create new checkout order
- `GET /api/orders/:id` - Fetch order status and items
- `GET /api/picker/active-run` - Get assigned active run for picker
- `POST /api/picker/item-not-found` - Flag an item as missing
- `POST /api/substitution/request` - Propose substitute item
- `POST /api/substitution/respond` - Customer response to substitute
- `POST /api/dispatch/finalize` - Validate order fulfillment and finalize
- `POST /api/dispatch/assign` - Assign dispatch driver
- `GET /api/admin/metrics` - Fetch analytics metrics
- `GET /api/admin/flagged-stores` - Fetch list of flagged stores
