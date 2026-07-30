-- 1. Create the store_table first (since order_table depends on it)
CREATE TABLE store_table (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL
);

-- 2. Create or Update the order_table
CREATE TABLE order_table (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_status TEXT NOT NULL DEFAULT 'pending_pick',
    order_date TIMESTAMPTZ DEFAULT NOW(),
    store_id UUID REFERENCES store_table(store_id),
    customer_id UUID, -- Assuming customers also use UUIDs
    picker_id UUID,   -- Assuming pickers also use UUIDs
    total_amount DECIMAL(10, 2) DEFAULT 0.00
);

-- 3. Create or Update the item_table
CREATE TABLE item_table (
    list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES order_table(order_id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    sub_rules TEXT CHECK (sub_rules IN ('auto', 'skip', 'ask')),
    qty_requested INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'found', 'not_found', 'replaced')),
    replacement_item_id TEXT,
    item_price DECIMAL(10, 2) DEFAULT 0.00
);