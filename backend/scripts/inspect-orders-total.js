const supabase = require('../lib/supabaseClient');

async function inspectOrders() {
  console.log('--- INSPECTING ORDERS & ITEMS ---');
  const { data: orders } = await supabase.from('order_table').select('*').limit(10);
  console.log('Orders:', orders);

  if (orders && orders.length > 0) {
    for (const o of orders) {
      const { data: items } = await supabase.from('item_table').select('*').eq('order_id', o.order_id);
      console.log(`Order ${o.order_id} total_amount=${o.total_amount}, items:`, items);
    }
  }
}

inspectOrders().then(() => process.exit(0));
