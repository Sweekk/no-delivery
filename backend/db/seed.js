const supabase = require('../lib/supabaseClient');

async function seed() {
  console.log('Starting database seeding...');

  try {
    // 1. Clean up existing tables
    console.log('Cleaning up existing data...');
    
    // Delete in reverse order of dependencies to respect foreign key constraints
    const { error: deleteItemsErr } = await supabase.from('item_table').delete().neq('item_id', '');
    if (deleteItemsErr) console.warn('Warning deleting from item_table:', deleteItemsErr.message);

    const { error: deleteOrdersErr } = await supabase.from('order_table').delete().neq('order_status', '');
    if (deleteOrdersErr) console.warn('Warning deleting from order_table:', deleteOrdersErr.message);

    const { error: deleteStoresErr } = await supabase.from('store_table').delete().neq('store_name', '');
    if (deleteStoresErr) console.warn('Warning deleting from store_table:', deleteStoresErr.message);

    // 2. Insert mock stores
    console.log('Inserting mock store...');
    const { data: storeData, error: storeErr } = await supabase
      .from('store_table')
      .insert([
        { store_name: 'Metro Grocers' }
      ])
      .select();

    if (storeErr) {
      throw new Error(`Failed to insert store: ${storeErr.message}`);
    }
    const store = storeData[0];
    console.log(`Successfully created store: ${store.store_name} (${store.store_id})`);

    // 3. Insert mock orders
    console.log('Inserting mock orders...');
    const orderDate1 = new Date();
    const orderDate2 = new Date(Date.now() - 3600000); // 1 hour ago
    
    const { data: orderData, error: orderErr } = await supabase
      .from('order_table')
      .insert([
        {
          order_status: 'pending_pick',
          order_date: orderDate1.toISOString(),
          store_id: store.store_id,
          total_amount: 24.50
        },
        {
          order_status: 'picked',
          order_date: orderDate2.toISOString(),
          store_id: store.store_id,
          total_amount: 15.99
        }
      ])
      .select();

    if (orderErr) {
      throw new Error(`Failed to insert orders: ${orderErr.message}`);
    }
    
    const order1 = orderData[0];
    const order2 = orderData[1];
    console.log(`Successfully created ${orderData.length} orders.`);

    // 4. Insert mock items
    console.log('Inserting mock checklist items...');
    const { error: itemsErr } = await supabase
      .from('item_table')
      .insert([
        {
          order_id: order1.order_id,
          item_id: 'Cereal Box',
          sub_rules: 'ask',
          qty_requested: 2,
          status: 'pending',
          item_price: 4.99
        },
        {
          order_id: order1.order_id,
          item_id: 'Fresh Milk 1L',
          sub_rules: 'auto',
          qty_requested: 1,
          status: 'pending',
          item_price: 2.50
        },
        {
          order_id: order1.order_id,
          item_id: 'Organic Bananas',
          sub_rules: 'skip',
          qty_requested: 5,
          status: 'pending',
          item_price: 0.79
        },
        {
          order_id: order2.order_id,
          item_id: 'Whole Wheat Bread',
          sub_rules: 'skip',
          qty_requested: 1,
          status: 'found',
          item_price: 3.49
        }
      ]);

    if (itemsErr) {
      throw new Error(`Failed to insert items: ${itemsErr.message}`);
    }

    console.log('Successfully seeded database tables!');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
}

seed();
