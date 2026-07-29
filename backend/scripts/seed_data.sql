-- =============================================
-- NO-DELIVERY: FRESH TEST SEED DATA
-- Run this AFTER nuke_all_data.sql
-- Covers every table & every status so you can
-- verify the full workflow end-to-end.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. STORES
-- ─────────────────────────────────────────────
INSERT INTO stores (id, name) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'FreshMart - Koramangala'),
  ('a2222222-2222-2222-2222-222222222222', 'QuickStop - Indiranagar'),
  ('a3333333-3333-3333-3333-333333333333', 'MegaBasket - Whitefield');

-- ─────────────────────────────────────────────
-- 2. DELIVERY PARTNERS  (one per status)
-- ─────────────────────────────────────────────
INSERT INTO delivery_partners (id, name, status) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Ravi Kumar',    'AVAILABLE'),
  ('b2222222-2222-2222-2222-222222222222', 'Priya Sharma',  'AVAILABLE'),
  ('b3333333-3333-3333-3333-333333333333', 'Arjun Reddy',   'BUSY'),
  ('b4444444-4444-4444-4444-444444444444', 'Sneha Patel',   'OFFLINE');

-- ─────────────────────────────────────────────
-- 3. ORDERS  (one per meaningful status)
-- ─────────────────────────────────────────────

-- Order 1 ── PENDING (just placed, no picker yet)
INSERT INTO order_table (order_id, order_status, order_date, store_id, customer_id, total_amount)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'PENDING',
  now() - interval '5 minutes',
  'a1111111-1111-1111-1111-111111111111',
  'd0000001-0000-0000-0000-000000000001',
  125.50
);

-- Order 2 ── PICKING (picker is in store, picking items)
INSERT INTO order_table (order_id, order_status, order_date, store_id, customer_id, picker_id, total_amount)
VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'PICKING',
  now() - interval '15 minutes',
  'a1111111-1111-1111-1111-111111111111',
  'd0000002-0000-0000-0000-000000000002',
  'd0000010-0000-0000-0000-000000000010',
  230.00
);

-- Order 3 ── AWAITING_SUBSTITUTION (customer decision pending)
INSERT INTO order_table (order_id, order_status, order_date, store_id, customer_id, picker_id, total_amount)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'AWAITING_SUBSTITUTION',
  now() - interval '25 minutes',
  'a2222222-2222-2222-2222-222222222222',
  'd0000003-0000-0000-0000-000000000003',
  'd0000010-0000-0000-0000-000000000010',
  89.75
);

-- Order 4 ── FINALIZED (ready for delivery partner assignment)
INSERT INTO order_table (order_id, order_status, order_date, finalized_at, store_id, customer_id, picker_id, total_amount)
VALUES (
  'c4444444-4444-4444-4444-444444444444',
  'FINALIZED',
  now() - interval '40 minutes',
  now() - interval '5 minutes',
  'a2222222-2222-2222-2222-222222222222',
  'd0000004-0000-0000-0000-000000000004',
  'd0000010-0000-0000-0000-000000000010',
  310.25
);

-- Order 5 ── ASSIGNED (partner on the way)
INSERT INTO order_table (order_id, order_status, order_date, finalized_at, store_id, customer_id, picker_id, delivery_partner_id, assigned_partner_id, assigned_at, total_amount)
VALUES (
  'c5555555-5555-5555-5555-555555555555',
  'ASSIGNED',
  now() - interval '1 hour',
  now() - interval '30 minutes',
  'a3333333-3333-3333-3333-333333333333',
  'd0000005-0000-0000-0000-000000000005',
  'd0000010-0000-0000-0000-000000000010',
  'b3333333-3333-3333-3333-333333333333',
  'b3333333-3333-3333-3333-333333333333',
  now() - interval '25 minutes',
  450.00
);

-- Order 6 ── DELIVERED (completed order, for metrics)
INSERT INTO order_table (order_id, order_status, order_date, finalized_at, store_id, customer_id, picker_id, delivery_partner_id, assigned_partner_id, assigned_at, total_amount)
VALUES (
  'c6666666-6666-6666-6666-666666666666',
  'DELIVERED',
  now() - interval '2 hours',
  now() - interval '1 hour 30 minutes',
  'a1111111-1111-1111-1111-111111111111',
  'd0000006-0000-0000-0000-000000000006',
  'd0000010-0000-0000-0000-000000000010',
  'b1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  now() - interval '1 hour 25 minutes',
  175.00
);

-- ─────────────────────────────────────────────
-- 4. ITEMS  (linked to specific orders)
-- ─────────────────────────────────────────────

-- Items for Order 1 (PENDING) ── all items still PENDING
INSERT INTO item_table (order_id, item_id, sub_rules, qty_requested, status) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'e0000001-0000-0000-0000-000000000001', 'ask',  2, 'PENDING'),
  ('c1111111-1111-1111-1111-111111111111', 'e0000002-0000-0000-0000-000000000002', 'auto', 1, 'PENDING'),
  ('c1111111-1111-1111-1111-111111111111', 'e0000003-0000-0000-0000-000000000003', 'skip', 3, 'PENDING');

-- Items for Order 2 (PICKING) ── some picked, one still pending
INSERT INTO item_table (order_id, item_id, sub_rules, qty_requested, status) VALUES
  ('c2222222-2222-2222-2222-222222222222', 'e0000004-0000-0000-0000-000000000004', 'ask',  1, 'PICKED'),
  ('c2222222-2222-2222-2222-222222222222', 'e0000005-0000-0000-0000-000000000005', 'ask',  2, 'PENDING');

-- Items for Order 3 (AWAITING_SUBSTITUTION) ── one needs customer decision
INSERT INTO item_table (list, order_id, item_id, sub_rules, qty_requested, status, replacement_item_id) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'e0000006-0000-0000-0000-000000000006', 'ask',  1, 'PICKED', NULL),
  ('f2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'e0000007-0000-0000-0000-000000000007', 'ask',  1, 'SUBSTITUTED', 'e0000099-0000-0000-0000-000000000099');

-- Items for Order 4 (FINALIZED) ── all resolved
INSERT INTO item_table (order_id, item_id, sub_rules, qty_requested, status) VALUES
  ('c4444444-4444-4444-4444-444444444444', 'e0000008-0000-0000-0000-000000000008', 'ask',  2, 'PICKED'),
  ('c4444444-4444-4444-4444-444444444444', 'e0000009-0000-0000-0000-000000000009', 'skip', 1, 'SKIPPED'),
  ('c4444444-4444-4444-4444-444444444444', 'e0000010-0000-0000-0000-000000000010', 'auto', 1, 'CONFIRMED');

-- Items for Order 6 (DELIVERED) ── all resolved
INSERT INTO item_table (order_id, item_id, sub_rules, qty_requested, status) VALUES
  ('c6666666-6666-6666-6666-666666666666', 'e0000011-0000-0000-0000-000000000011', 'ask',  3, 'PICKED'),
  ('c6666666-6666-6666-6666-666666666666', 'e0000012-0000-0000-0000-000000000012', 'ask',  1, 'SUBSTITUTED');

-- ─────────────────────────────────────────────
-- 5. SUBSTITUTIONS  (linked to specific items)
-- ─────────────────────────────────────────────

-- Substitution for Order 3, item f2222222 (status = pending, customer hasn't decided)
INSERT INTO substitutions (order_item_id, original_product_id, proposed_product_id, status) VALUES
  ('f2222222-2222-2222-2222-222222222222', 'e0000007-0000-0000-0000-000000000007', 'e0000099-0000-0000-0000-000000000099', 'pending');

-- Substitution that was accepted (for delivered order)
INSERT INTO substitutions (order_item_id, original_product_id, proposed_product_id, status)
SELECT list, 'e0000012-0000-0000-0000-000000000012', 'e0000098-0000-0000-0000-000000000098', 'accepted'
FROM item_table
WHERE order_id = 'c6666666-6666-6666-6666-666666666666'
  AND item_id = 'e0000012-0000-0000-0000-000000000012'
LIMIT 1;


-- ─────────────────────────────────────────────
-- 6. VERIFICATION QUERIES
-- Run these to confirm everything is correct
-- ─────────────────────────────────────────────

-- Row counts per table
SELECT 'stores'             AS tbl, COUNT(*) AS cnt FROM stores
UNION ALL SELECT 'delivery_partners', COUNT(*) FROM delivery_partners
UNION ALL SELECT 'order_table',       COUNT(*) FROM order_table
UNION ALL SELECT 'item_table',        COUNT(*) FROM item_table
UNION ALL SELECT 'substitutions',     COUNT(*) FROM substitutions;

-- Orders by status
SELECT order_status, COUNT(*) AS cnt
FROM order_table
GROUP BY order_status
ORDER BY order_status;

-- Admin dashboard views (should return data)
SELECT * FROM store_substitution_rates;
SELECT * FROM store_fulfillment_times;
