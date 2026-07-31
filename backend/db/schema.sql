-- =============================================
-- NO-DELIVERY: Database Schema
-- Naming style per architecture diagram
-- =============================================

-- STORES
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- DELIVERY PARTNERS
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, OFFLINE
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE delivery_partners DISABLE ROW LEVEL SECURITY;

-- ORDER TABLE
CREATE TABLE IF NOT EXISTS order_table (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PICKING, AWAITING_SUBSTITUTION, FINALIZED, ASSIGNED, DELIVERED
  order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  finalized_at TIMESTAMP WITH TIME ZONE,
  store_id UUID REFERENCES stores(id),
  customer_id UUID,
  picker_id UUID,
  delivery_partner_id UUID REFERENCES delivery_partners(id),
  assigned_partner_id UUID REFERENCES delivery_partners(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  total_amount NUMERIC(10, 2)
);
ALTER TABLE order_table DISABLE ROW LEVEL SECURITY;

-- ITEM TABLE (from customer's list)
CREATE TABLE IF NOT EXISTS item_table (
  list UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES order_table(order_id) ON DELETE CASCADE,
  item_id UUID,
  sub_rules VARCHAR(10) NOT NULL DEFAULT 'ask', -- auto, skip, ask
  qty_requested INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PICKED, SUBSTITUTED, SKIPPED, CONFIRMED
  replacement_item_id UUID
);
ALTER TABLE item_table DISABLE ROW LEVEL SECURITY;

-- SUBSTITUTIONS LOG
CREATE TABLE IF NOT EXISTS substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES item_table(list) ON DELETE CASCADE,
  original_product_id UUID,
  proposed_product_id UUID,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, timed_out
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE substitutions DISABLE ROW LEVEL SECURITY;

-- =============================================
-- DATABASE-LEVEL GUARD
-- Prevents delivery partner assignment unless order_status = 'FINALIZED'
-- =============================================
CREATE OR REPLACE FUNCTION verify_order_finalized_before_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.assigned_partner_id IS NOT NULL OR NEW.delivery_partner_id IS NOT NULL) THEN
    IF (
      OLD.order_status IS DISTINCT FROM 'FINALIZED' AND
      OLD.order_status IS DISTINCT FROM 'ASSIGNED' AND
      NEW.order_status IS DISTINCT FROM 'FINALIZED' AND
      NEW.order_status IS DISTINCT FROM 'ASSIGNED'
    ) THEN
      RAISE EXCEPTION 'Database Guard Block: Order % cannot be assigned a delivery partner when status is %',
        NEW.order_id, OLD.order_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_guard_delivery_assignment ON order_table;

CREATE TRIGGER trigger_guard_delivery_assignment
  BEFORE UPDATE ON order_table
  FOR EACH ROW
  EXECUTE FUNCTION verify_order_finalized_before_assignment();

-- =============================================
-- ADMIN METRICS VIEW: Substitution rate per store
-- =============================================
CREATE OR REPLACE VIEW store_substitution_rates AS
SELECT
  s.id AS store_id,
  s.name AS store_name,
  COUNT(DISTINCT o.order_id)::int AS total_orders,
  COUNT(DISTINCT CASE
    WHEN it.status IN ('SUBSTITUTED', 'SKIPPED') THEN o.order_id
    ELSE NULL
  END)::int AS orders_with_substitution,
  ROUND(
    COALESCE(
      (COUNT(DISTINCT CASE WHEN it.status IN ('SUBSTITUTED', 'SKIPPED') THEN o.order_id END)::numeric
       / NULLIF(COUNT(DISTINCT o.order_id), 0)::numeric) * 100.0,
      0.0
    ), 1
  )::float AS substitution_rate
FROM stores s
LEFT JOIN order_table o ON o.store_id = s.id
LEFT JOIN item_table it ON it.order_id = o.order_id
GROUP BY s.id, s.name;

-- =============================================
-- ADMIN METRICS VIEW: Average fulfillment time per store (minutes)
-- =============================================
CREATE OR REPLACE VIEW store_fulfillment_times AS
SELECT
  s.id AS store_id,
  s.name AS store_name,
  COUNT(o.order_id)::int AS order_count,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (o.finalized_at - o.order_date)) / 60.0)::numeric,
    1
  )::float AS average_minutes
FROM stores s
JOIN order_table o ON o.store_id = s.id
WHERE o.finalized_at IS NOT NULL
GROUP BY s.id, s.name;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'delivery', 'picker', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;


