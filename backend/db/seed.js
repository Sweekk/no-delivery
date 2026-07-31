const supabase = require('../lib/supabaseClient');

async function seed() {
  console.log('Starting database seeding...');

  try {
    // 1. Clean up existing tables
    console.log('Cleaning up existing data...');
    
    // Delete in reverse order of dependencies to respect foreign key constraints
    const { error: deleteSubsErr } = await supabase.from('substitutions').delete().neq('status', 'invalid-status-placeholder');
    if (deleteSubsErr) console.warn('Warning deleting from substitutions:', deleteSubsErr.message);

    const { error: deleteItemsErr } = await supabase.from('item_table').delete().neq('status', 'invalid-status-placeholder');
    if (deleteItemsErr) console.warn('Warning deleting from item_table:', deleteItemsErr.message);

    const { error: deleteOrdersErr } = await supabase.from('order_table').delete().neq('order_status', 'invalid-status-placeholder');
    if (deleteOrdersErr) console.warn('Warning deleting from order_table:', deleteOrdersErr.message);

    const { error: deleteStoresErr } = await supabase.from('stores').delete().neq('name', 'invalid-store-placeholder');
    if (deleteStoresErr) console.warn('Warning deleting from stores:', deleteStoresErr.message);

    const { error: deletePartnersErr } = await supabase.from('delivery_partners').delete().neq('name', 'invalid-partner-placeholder');
    if (deletePartnersErr) console.warn('Warning deleting from delivery_partners:', deletePartnersErr.message);

    // 2. Insert mock stores
    console.log('Inserting mock store...');
    const { data: storeData, error: storeErr } = await supabase
      .from('stores')
      .insert([
        { name: 'Metro Grocers' },
        { name: 'QuickFix Indiranagar' }
      ])
      .select();

    if (storeErr) {
      throw new Error(`Failed to insert store: ${storeErr.message}`);
    }
    const store = storeData[0];
    console.log(`Successfully created store: ${store.name} (${store.id})`);

    // Insert mock delivery partners
    console.log('Inserting mock delivery partners...');
    await supabase.from('delivery_partners').insert([
      { name: 'Ramesh Kumar', status: 'AVAILABLE' },
      { name: 'Priya Sharma', status: 'BUSY' }
    ]);

    // 3. Insert mock orders
    console.log('Inserting mock orders...');
    const orderDate1 = new Date();
    const orderDate2 = new Date(Date.now() - 3600000); // 1 hour ago
    
    const { data: orderData, error: orderErr } = await supabase
      .from('order_table')
      .insert([
        {
          order_status: 'PENDING',
          order_date: orderDate1.toISOString(),
          store_id: store.id,
          total_amount: 24.50
        },
        {
          order_status: 'FINALIZED',
          order_date: orderDate2.toISOString(),
          store_id: store.id,
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
          item_id: 'e0000001-0000-0000-0000-000000000001',
          sub_rules: 'ask',
          qty_requested: 2,
          status: 'PENDING'
        },
        {
          order_id: order1.order_id,
          item_id: 'e0000002-0000-0000-0000-000000000002',
          sub_rules: 'auto',
          qty_requested: 1,
          status: 'PENDING'
        },
        {
          order_id: order1.order_id,
          item_id: 'e0000003-0000-0000-0000-000000000003',
          sub_rules: 'skip',
          qty_requested: 5,
          status: 'PENDING'
        },
        {
          order_id: order2.order_id,
          item_id: 'e0000004-0000-0000-0000-000000000004',
          sub_rules: 'skip',
          qty_requested: 1,
          status: 'PICKED'
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
