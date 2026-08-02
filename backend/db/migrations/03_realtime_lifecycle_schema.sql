-- =============================================
-- MIGRATION 03: Realtime Order Lifecycle, Timestamps & Auto-Assignments
-- Supporting Customer, Picker, Delivery Partner, and Admin Dashboard
-- =============================================

-- 1. Ensure order_table / orders status column supports full lifecycle enum
-- Statuses: placed, assigned_to_picker, picking_in_progress, picking_complete, order_confirmed, assigned_to_delivery, out_for_delivery, delivered, cancelled

ALTER TABLE order_table ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'placed';

-- Create alias view 'orders' pointing to 'order_table' for standard naming compatibility
CREATE OR REPLACE VIEW orders AS
SELECT 
  order_id AS id,
  order_id,
  order_status AS status,
  order_status,
  order_date AS created_at,
  order_date,
  store_id,
  customer_id,
  picker_id,
  delivery_partner_id,
  assigned_partner_id,
  assigned_at,
  total_amount
FROM order_table;

-- 2. Add columns to items (and order_items view) for per-item lifecycle & authoritative server timestamp
ALTER TABLE items ADD COLUMN IF NOT EXISTS unavailable_marked_at TIMESTAMPTZ;
ALTER TABLE items ADD COLUMN IF NOT EXISTS customer_decision TEXT; -- skip, self_select, picker_choice, auto_skip_timeout
ALTER TABLE items ADD COLUMN IF NOT EXISTS substitute_product_id TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, available, unavailable, picker_choice_pending, substituted, skipped

-- Re-create / Update order_items alias view pointing to items table
CREATE OR REPLACE VIEW order_items AS
SELECT 
  id,
  id AS list_id,
  order_id,
  id AS product_id,
  product_name,
  brand,
  category,
  price,
  quantity,
  qty_requested,
  status,
  unavailable_marked_at,
  customer_decision,
  substitute_product_id,
  replacement_item_id,
  sub_rules,
  aisle,
  rack,
  shelf,
  image_url,
  created_at,
  updated_at
FROM items;

-- 3. Create assignments table for tracking worker load and round-robin auto-assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES order_table(order_id) ON DELETE CASCADE,
  picker_id UUID,
  delivery_partner_id UUID REFERENCES delivery_partners(id),
  role TEXT NOT NULL DEFAULT 'picker', -- picker, delivery
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, rejected
  assigned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_assignments_picker ON assignments(picker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_delivery ON assignments(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_assignments_order ON assignments(order_id);

-- 4. Views for least-busy auto-assignment logic (fewest currently active assignments)
CREATE OR REPLACE VIEW active_picker_assignments AS
SELECT 
  picker_id,
  COUNT(id)::int AS active_count
FROM assignments
WHERE role = 'picker' AND status = 'active'
GROUP BY picker_id;

CREATE OR REPLACE VIEW active_driver_assignments AS
SELECT 
  delivery_partner_id,
  COUNT(id)::int AS active_count
FROM assignments
WHERE role = 'delivery' AND status = 'active'
GROUP BY delivery_partner_id;

-- 5. Enable Supabase Realtime on core tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_table;
    ALTER PUBLICATION supabase_realtime ADD TABLE items;
    ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication setup skipped or already enabled: %', SQLERRM;
END $$;
