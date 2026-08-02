-- =============================================
-- MIGRATION 02: Standardize Items Table & Database Schema
-- Single standardized 'items' table with product_name and full catalog/checklist attributes
-- =============================================

-- 1. Create standardized 'items' table if not exists
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  barcode TEXT,
  sku TEXT,
  image_url TEXT,
  quantity INT DEFAULT 1,
  unit TEXT,
  price NUMERIC(10, 2) DEFAULT 0.00,
  stock INT DEFAULT 0,
  minimum_stock INT DEFAULT 0,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  status TEXT DEFAULT 'pending',
  order_id UUID REFERENCES order_table(order_id) ON DELETE CASCADE,
  sub_rules TEXT DEFAULT 'ask',
  replacement_item_id TEXT,
  qty_requested INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS or set open policies so client & server operations succeed seamlessly
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- 2. Create view / alias 'item_table' pointing to 'items' for backwards compatibility
CREATE OR REPLACE VIEW item_table AS
SELECT 
  id AS list,
  id AS list_id,
  id,
  order_id,
  id AS item_id,
  product_name,
  brand,
  category,
  sub_rules,
  qty_requested,
  status,
  replacement_item_id,
  price,
  created_at
FROM items;

-- 3. Indexes for high performance queries
CREATE INDEX IF NOT EXISTS idx_items_order_id ON items(order_id);
CREATE INDEX IF NOT EXISTS idx_items_product_name ON items(product_name);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
