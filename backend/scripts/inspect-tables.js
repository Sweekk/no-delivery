const supabase = require('../lib/supabaseClient');

async function inspectTables() {
  console.log('--- INSPECTING TABLES ---');
  
  // Try querying 'products' vs 'item_table' vs 'stores' etc.
  const tables = ['products', 'product_table', 'item_table', 'order_table', 'orders', 'order_items', 'substitutions', 'stores'];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table '${t}': ERR - ${error.message}`);
    } else {
      console.log(`Table '${t}': EXISTS (${data ? data.length : 0} rows sample)`);
    }
  }
}

inspectTables().then(() => process.exit(0));
