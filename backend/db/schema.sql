-- Table definitions for Supabase (PostgreSQL)

-- Example tables for no-delivery system
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  customer_id UUID,
  picker_id UUID,
  total_amount NUMERIC(10, 2)
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  quantity INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., picked, substitute_requested, resolved
  substitute_product_id UUID
);

CREATE TABLE IF NOT EXISTS substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  original_product_id UUID,
  proposed_product_id UUID,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, timed_out
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
