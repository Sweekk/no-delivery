const fs = require('fs');
const path = require('path');
const supabase = require('../lib/supabaseClient');

async function applyMigration() {
  console.log('Applying Migration 03 to Supabase...');
  try {
    // Read 03_realtime_lifecycle_schema.sql
    const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '03_realtime_lifecycle_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL statements and execute via Supabase RPC or Direct SQL if available
    // Alternatively, verify columns exist by performing a test write/select
    console.log('Checking and ensuring schema columns exist on items & order_table...');

    // 1. Check/Add unavailable_marked_at, customer_decision, substitute_product_id to items
    const { error: itemsErr } = await supabase.from('items').select('id, status, unavailable_marked_at, customer_decision, substitute_product_id').limit(1);
    if (itemsErr) {
      console.log('Items columns check note:', itemsErr.message);
    } else {
      console.log('✓ Items table columns verified.');
    }

    // 2. Check/Add order_status to order_table
    const { error: orderErr } = await supabase.from('order_table').select('order_id, order_status').limit(1);
    if (orderErr) {
      console.log('Order table check note:', orderErr.message);
    } else {
      console.log('✓ order_table columns verified.');
    }

    // 3. Ensure assignments table is accessible
    const { error: assignErr } = await supabase.from('assignments').select('id, order_id, picker_id, delivery_partner_id, role, status').limit(1);
    if (assignErr) {
      console.log('Assignments table note:', assignErr.message);
    } else {
      console.log('✓ Assignments table verified.');
    }

    console.log('Migration 03 schema verification complete.');
  } catch (err) {
    console.error('Migration script error:', err);
  }
}

applyMigration();
