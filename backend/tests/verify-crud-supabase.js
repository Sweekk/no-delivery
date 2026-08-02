const supabase = require('../lib/supabaseClient');

async function testSupabaseCRUD() {
  console.log('==============================================');
  console.log('  RUNNING SUPABASE FULL CRUD & SCHEMA VERIFICATION');
  console.log('==============================================\n');

  try {
    // 1. STORES VERIFICATION
    console.log('1. Testing Stores Table...');
    let { data: stores, error: storeErr } = await supabase.from('stores').select('*');
    if (storeErr) throw new Error('Stores Select Failed: ' + storeErr.message);

    if (stores.length === 0) {
      console.log('   Stores table empty. Creating default test store...');
      const { data: newStore, error: insertStoreErr } = await supabase
        .from('stores')
        .insert([{ name: 'QuickFix Indiranagar Dark Store', location: 'Indiranagar' }])
        .select()
        .single();
      if (insertStoreErr) throw new Error('Store Insert Failed: ' + insertStoreErr.message);
      stores = [newStore];
    }
    const testStoreId = stores[0].id;
    console.log(`   ✓ Stores Verified. Found ${stores.length} store(s). Active ID: ${testStoreId}`);

    // 2. CREATE (Insert Order & Items)
    console.log('\n2. Testing CREATE (Order & Items)...');
    const { data: newOrder, error: orderErr } = await supabase
      .from('order_table')
      .insert([{
        store_id: testStoreId,
        order_status: 'PENDING',
        total_amount: 350.00,
        order_date: new Date().toISOString()
      }])
      .select('order_id')
      .single();

    if (orderErr) throw new Error('Order Create Failed: ' + orderErr.message);
    const testOrderId = newOrder.order_id;
    console.log(`   ✓ Order Created: ${testOrderId}`);

    const testItem = {
      order_id: testOrderId,
      item_id: 'a0000000-0000-0000-0000-000000000001',
      sub_rules: 'ask',
      qty_requested: 2,
      status: 'pending'
    };

    const { data: insertedItems, error: itemInsertErr } = await supabase
      .from('item_table')
      .insert([testItem])
      .select();

    if (itemInsertErr) throw new Error('Item Create Failed: ' + itemInsertErr.message);
    const testItemListId = insertedItems[0].list;
    console.log(`   ✓ Item Created with product_name/item_id "${insertedItems[0].item_id}", list ID: ${testItemListId}`);

    // 3. READ (Fetch Order & Items)
    console.log('\n3. Testing READ (Fetch Order & Items)...');
    const { data: fetchedOrder, error: readErr } = await supabase
      .from('order_table')
      .select('*, items:item_table(*), stores(name)')
      .eq('order_id', testOrderId)
      .single();

    if (readErr) throw new Error('Order Read Failed: ' + readErr.message);
    console.log(`   ✓ Order Read Successful. Status: ${fetchedOrder.order_status}, Item count: ${fetchedOrder.items?.length}`);

    // 4. UPDATE (Update Item Status to SUBSTITUTED & Order Status to FINALIZED)
    console.log('\n4. Testing UPDATE (Item Status & Order Status)...');
    const { data: updatedItem, error: updateItemErr } = await supabase
      .from('item_table')
      .update({ status: 'SUBSTITUTED', replacement_item_id: 'a0000000-0000-0000-0000-000000000002' })
      .eq('list', testItemListId)
      .select();

    if (updateItemErr) throw new Error('Item Update Failed: ' + updateItemErr.message);
    console.log(`   ✓ Item Updated. New Status: ${updatedItem[0].status}, Replacement: ${updatedItem[0].replacement_item_id}`);

    const { data: updatedOrder, error: updateOrderErr } = await supabase
      .from('order_table')
      .update({ order_status: 'FINALIZED', finalized_at: new Date().toISOString() })
      .eq('order_id', testOrderId)
      .select();

    if (updateOrderErr) throw new Error('Order Update Failed: ' + updateOrderErr.message);
    console.log(`   ✓ Order Updated. New Status: ${updatedOrder[0].order_status}`);

    // 5. SEARCH & FILTER
    console.log('\n5. Testing SEARCH & FILTER...');
    const { data: searchResults, error: searchErr } = await supabase
      .from('item_table')
      .select('*')
      .eq('status', 'SUBSTITUTED');

    if (searchErr) throw new Error('Search Failed: ' + searchErr.message);
    console.log(`   ✓ Search Successful. Found ${searchResults.length} SUBSTITUTED item(s).`);

    // 6. DELETE (Clean up test item and order)
    console.log('\n6. Testing DELETE...');
    const { error: deleteErr } = await supabase
      .from('order_table')
      .delete()
      .eq('order_id', testOrderId);

    if (deleteErr) throw new Error('Delete Failed: ' + deleteErr.message);
    console.log('   ✓ Order & CASCADE Items Deleted Successfully.');

    console.log('\n==============================================');
    console.log('  ALL SUPABASE CRUD OPERATIONS PASSED 100% SUCCESS');
    console.log('==============================================\n');

  } catch (err) {
    console.error('\n❌ CRUD TEST ERROR:', err.message);
    process.exit(1);
  }
}

testSupabaseCRUD();
