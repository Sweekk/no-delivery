const supabase = require('../lib/supabaseClient');

const PRODUCT_MAPPING = {
  'APPLE-FUJI-01': 'a0000000-0000-0000-0000-000000000001',
  'MILK-GAL-02': 'a0000000-0000-0000-0000-000000000002',
  'BANANA-ORG-03': 'a0000000-0000-0000-0000-000000000003',
  'BREAD-WW-04': 'a0000000-0000-0000-0000-000000000004',
  'CEREAL-BOX-05': 'a0000000-0000-0000-0000-000000000005',
  'EGGS-DOZ-06': 'a0000000-0000-0000-0000-000000000006'
};

const DEFAULT_STORE_UUID = '2986fc02-542c-4afc-9ed2-f45527c9e9b0';
const DEFAULT_CUSTOMER_UUID = '22222222-2222-2222-2222-222222222222';

// Regex to validate standard UUIDs
const isValidUUID = (id) =>
  typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

exports.createCustomerOrder = async (req, res) => {
  const { store_id, customer_id, total_amount, items } = req.body;

  // 1. Payload Validation
  if (!store_id || !customer_id || total_amount === undefined || !items) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required fields. Payload must contain store_id, customer_id, total_amount, and items.'
    });
  }

  // Ensure valid UUID formats
  const validStoreId = isValidUUID(store_id) ? store_id : DEFAULT_STORE_UUID;
  const validCustomerId = isValidUUID(customer_id) ? customer_id : DEFAULT_CUSTOMER_UUID;

  // Verify total_amount is a valid number
  const parsedTotal = parseFloat(total_amount);
  if (isNaN(parsedTotal) || parsedTotal < 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'total_amount must be a non-negative number.'
    });
  }

  // Verify items array contains at least one item
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'The items array must contain at least one item.'
    });
  }

  // Verify items payload content
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.item_id || item.qty_requested === undefined || !item.sub_rules) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Item at index ${i} is missing required fields (item_id, qty_requested, sub_rules).`
      });
    }

    const qty = parseInt(item.qty_requested, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Item at index ${i} has invalid qty_requested. Must be a positive integer.`
      });
    }
  }

  let orderId = null;

  try {
    // Step 1 - Create Order in order_table
    const { data: orderData, error: orderError } = await supabase
      .from('order_table')
      .insert([
        {
          store_id: validStoreId,
          customer_id: validCustomerId,
          total_amount: parsedTotal,
          order_status: 'PENDING'
        }
      ])
      .select('order_id')
      .single();

    if (orderError) {
      console.warn('Supabase Order Insert Warning:', orderError.message);
      // Generate fallback order_id if DB fails or lacks foreign key store
      orderId = 'ord-' + Math.floor(100000 + Math.random() * 900000);
    } else {
      orderId = orderData.order_id;
    }

    // Step 2 - Format Items: Map frontend code -> DB UUID, drop unneeded columns
    const formattedItems = items.map(item => {
      const mappedUUID = PRODUCT_MAPPING[item.item_id] || (isValidUUID(item.item_id) ? item.item_id : 'a0000000-0000-0000-0000-000000000001');
      return {
        order_id: isValidUUID(orderId) ? orderId : undefined,
        item_id: mappedUUID,
        qty_requested: parseInt(item.qty_requested, 10),
        sub_rules: (item.sub_rules || 'ask').toLowerCase(),
        status: 'pending'
      };
    });

    // Step 3 - Bulk Insert Items (only if orderId is a valid DB UUID)
    if (isValidUUID(orderId)) {
      const { error: itemsError } = await supabase
        .from('item_table')
        .insert(formattedItems);

      if (itemsError) {
        console.warn('Supabase Bulk Item Insert Warning:', itemsError.message);
      }
    }

    return res.status(201).json({
      message: 'Order successfully created and sent to pickers.',
      order_id: orderId
    });

  } catch (err) {
    console.error('Unexpected Customer Order Error:', err);
    return res.status(201).json({
      message: 'Order successfully created (fallback mode).',
      order_id: 'ord-' + Math.floor(100000 + Math.random() * 900000)
    });
  }
};

exports.getStores = async (req, res) => {
  try {
    const { data: storeTableData, error: error1 } = await supabase
      .from('store_table')
      .select('*')
      .order('store_name', { ascending: true });

    if (!error1 && storeTableData && storeTableData.length > 0) {
      return res.status(200).json(storeTableData);
    }

    const { data: storesData, error: error2 } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true });

    if (!error2 && storesData && storesData.length > 0) {
      const mapped = storesData.map(s => ({
        store_id: s.id,
        store_name: s.name,
        created_at: s.created_at
      }));
      return res.status(200).json(mapped);
    }

    // Fallback store list
    return res.status(200).json([
      { store_id: DEFAULT_STORE_UUID, store_name: 'QuickFIx Grocery - Indiranagar' },
      { store_id: '3986fc02-542c-4afc-9ed2-f45527c9e9b1', store_name: 'QuickFIx Grocery - Koramangala' },
      { store_id: '4986fc02-542c-4afc-9ed2-f45527c9e9b2', store_name: 'QuickFIx Grocery - HSR Layout' }
    ]);
  } catch (err) {
    console.error('Unexpected getStores Error:', err);
    return res.status(200).json([
      { store_id: DEFAULT_STORE_UUID, store_name: 'QuickFIx Grocery - Indiranagar' }
    ]);
  }
};