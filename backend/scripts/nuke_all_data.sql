-- =============================================
-- NO-DELIVERY: NUKE ALL DATA
-- Deletes every row from every table.
-- Order matters: child tables first → parent tables last
-- (to respect foreign-key constraints)
-- =============================================

-- 1. Substitutions  (references item_table)
DELETE FROM substitutions;

-- 2. Item table      (references order_table)
DELETE FROM item_table;

-- 3. Order table     (references stores, delivery_partners)
DELETE FROM order_table;

-- 4. Delivery partners (no children left)
DELETE FROM delivery_partners;

-- 5. Stores           (no children left)
DELETE FROM stores;

-- Confirm everything is empty
SELECT 'stores'             AS table_name, COUNT(*) AS row_count FROM stores
UNION ALL
SELECT 'delivery_partners', COUNT(*) FROM delivery_partners
UNION ALL
SELECT 'order_table',       COUNT(*) FROM order_table
UNION ALL
SELECT 'item_table',        COUNT(*) FROM item_table
UNION ALL
SELECT 'substitutions',     COUNT(*) FROM substitutions;
