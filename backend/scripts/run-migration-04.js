const fs = require('fs');
const path = require('path');
const supabase = require('../lib/supabaseClient');

/**
 * Migration 04 – Add substitution preference columns and backfill missing product categories.
 * Executes raw SQL via Supabase RPC "execute_sql" if available, otherwise logs the statements
 * for manual execution.
 */
async function applyMigration() {
  console.log('Applying Migration 04 to Supabase...');
  const sqlStatements = `
    -- 1. Add substitution_preference to order_items
    ALTER TABLE order_items
      ADD COLUMN substitution_preference VARCHAR(20)
        CHECK (substitution_preference IN ('auto_substitute','ask_first','skip'));

    -- 2. Add default_substitution_preference to orders (order-level default)
    ALTER TABLE orders
      ADD COLUMN default_substitution_preference VARCHAR(20)
        CHECK (default_substitution_preference IN ('auto_substitute','ask_first','skip'))
        DEFAULT 'ask_first';

    -- 3. Backfill existing order_items with the order's default preference
    UPDATE order_items oi
    SET substitution_preference = o.default_substitution_preference
    FROM orders o
    WHERE oi.order_id = o.order_id AND oi.substitution_preference IS NULL;

    -- 4. Backfill missing product categories (if any)
    UPDATE products p
    SET category = 'uncategorized'
    WHERE category IS NULL OR category = '';
  `;

  // Attempt to run via RPC (requires a Postgres function "execute_sql" on Supabase)
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql: sqlStatements });
    if (error) {
      console.warn('Supabase RPC "execute_sql" not available or failed. Printing SQL for manual run:');
      console.log(sqlStatements);
    } else {
      console.log('Migration executed via RPC, result:', data);
    }
  } catch (e) {
    console.warn('Error invoking RPC, falling back to manual SQL output.');
    console.log(sqlStatements);
  }
}

applyMigration();
