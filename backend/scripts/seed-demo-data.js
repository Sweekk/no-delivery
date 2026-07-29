const supabase = require('../lib/supabaseClient');

async function seedDemoData() {
  console.log('--- SEEDING DEMO DATA INTO SUPABASE ---\n');

  try {
    // 1. Create a Finalized Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          status: 'FINALIZED',
          total_amount: 49.99,
        },
      ])
      .select()
      .single();

    if (orderErr) {
      console.error('Failed to insert demo order:', orderErr.message);
      return;
    }
    console.log('Created Finalized Order UUID:', order.id);

    // 2. Create resolved Order Items
    const { error: itemErr } = await supabase.from('order_items').insert([
      {
        order_id: order.id,
        quantity: 2,
        status: 'picked',
        resolution_status: 'CONFIRMED',
      },
      {
        order_id: order.id,
        quantity: 1,
        status: 'resolved',
        resolution_status: 'SUBSTITUTED',
      },
    ]);

    if (itemErr) {
      console.error('Failed to insert order items:', itemErr.message);
      return;
    }
    console.log('Created resolved items for Order:', order.id);

    // 3. Create an AVAILABLE Delivery Partner
    const { data: partner, error: partnerErr } = await supabase
      .from('delivery_partners')
      .insert([
        {
          name: 'Ramesh Kumar (Demo Partner)',
          status: 'AVAILABLE',
        },
      ])
      .select()
      .single();

    if (partnerErr) {
      console.error('Failed to insert delivery partner:', partnerErr.message);
      return;
    }
    console.log('Created Available Delivery Partner:', partner);

    console.log('\n--- SEED COMPLETE ---');
    console.log(`\nNow test curl with real Order UUID:`);
    console.log(`curl -X POST http://localhost:5000/api/dispatch/assign/${order.id}`);
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

seedDemoData();
