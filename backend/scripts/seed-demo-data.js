const supabase = require('../lib/supabaseClient');

async function seedDemoData() {
  console.log('--- SEEDING DEMO DATA INTO SUPABASE ---\n');

  try {
    // 1. Create Demo Store
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .insert([{ name: 'QuickFIx Grocery - Indiranagar' }])
      .select()
      .single();

    if (storeErr && !storeErr.message.includes('duplicate')) {
      console.log('Store creation info:', storeErr.message);
    }
    const storeId = store?.id;

    // 2. Create Demo Delivery Partners
    const { data: partners, error: partnerErr } = await supabase
      .from('delivery_partners')
      .insert([
        { name: 'Ramesh Kumar', status: 'AVAILABLE' },
        { name: 'Priya Sharma', status: 'BUSY' },
        { name: 'Arjun Singh', status: 'AVAILABLE' }
      ])
      .select();

    if (partnerErr) {
      console.log('Partner creation info:', partnerErr.message);
    }

    // 3. Create Orders in order_table
    const { data: orders, error: orderErr } = await supabase
      .from('order_table')
      .insert([
        {
          order_status: 'FINALIZED',
          total_amount: 450.50,
          store_id: storeId,
          finalized_at: new Date().toISOString()
        },
        {
          order_status: 'PICKING',
          total_amount: 280.00,
          store_id: storeId
        },
        {
          order_status: 'AWAITING_SUBSTITUTION',
          total_amount: 620.75,
          store_id: storeId
        },
        {
          order_status: 'DELIVERED',
          total_amount: 199.00,
          store_id: storeId,
          finalized_at: new Date(Date.now() - 3600000).toISOString()
        }
      ])
      .select();

    if (orderErr) {
      console.error('Order creation error:', orderErr.message);
    } else {
      console.log(`Inserted ${orders.length} orders successfully into order_table!`);
    }

    console.log('\n--- SEED COMPLETE ---');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

seedDemoData();
