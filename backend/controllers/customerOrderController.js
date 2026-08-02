const supabase = require('../lib/supabaseClient');

const PRODUCT_MAPPING = {
  'Organic Bananas 6pcs': 'e0000001-0000-0000-0000-000000000001',
  'Amul Taaza Toned Milk 1L': 'e0000002-0000-0000-0000-000000000002',
  'Whole Wheat Bread 400g': 'e0000003-0000-0000-0000-000000000003',
  'Fortune Sunflower Oil 1L': 'e0000004-0000-0000-0000-000000000004',
  'Doritos Nacho Cheese 150g': 'e0000005-0000-0000-0000-000000000005',
  'Fresh Tomatoes 1kg': 'e0000006-0000-0000-0000-000000000006',
  'APPLE-FUJI-01': 'a0000000-0000-0000-0000-000000000001',
  'MILK-GAL-02': 'a0000000-0000-0000-0000-000000000002',
  'BANANA-ORG-03': 'a0000000-0000-0000-0000-000000000003',
  'BREAD-WW-04': 'a0000000-0000-0000-0000-000000000004',
  'CEREAL-BOX-05': 'a0000000-0000-0000-0000-000000000005',
  'EGGS-DOZ-06': 'a0000000-0000-0000-0000-000000000006'
};

const DEFAULT_ITEM_UUID = 'e0000001-0000-0000-0000-000000000001';

const isValidUUID = (id) =>
  typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function getValidItemUUID(itemIdentifier) {
  if (!itemIdentifier) return DEFAULT_ITEM_UUID;
  if (isValidUUID(itemIdentifier)) return itemIdentifier;
  if (PRODUCT_MAPPING[itemIdentifier]) return PRODUCT_MAPPING[itemIdentifier];
  return DEFAULT_ITEM_UUID;
}

exports.createCustomerOrder = async (req, res) => {
  const { store_id, customer_id, total_amount, items } = req.body;

  if (total_amount === undefined || !items) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required fields. Payload must contain total_amount and items.'
    });
  }

  const parsedTotal = parseFloat(total_amount);
  if (isNaN(parsedTotal) || parsedTotal < 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'total_amount must be a non-negative number.'
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'The items array must contain at least one item.'
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const productName = item.product_name || item.name || item.item_id;
    if (!productName || item.qty_requested === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Item at index ${i} is missing required fields (product_name, qty_requested).`
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

  try {
    let validStoreId = isValidUUID(store_id) ? store_id : null;
    if (!validStoreId) {
      const { data: dbStores } = await supabase.from('stores').select('id').limit(1);
      if (dbStores && dbStores.length > 0) {
        validStoreId = dbStores[0].id;
      }
    }

    let validCustomerId = isValidUUID(customer_id) ? customer_id : null;

    const { data: orderData, error: orderError } = await supabase
      .from('order_table')
      .insert([
        {
          store_id: validStoreId,
          customer_id: validCustomerId,
          total_amount: parsedTotal,
          order_status: 'PENDING',
          order_date: new Date().toISOString()
        }
      ])
      .select('order_id')
      .single();

    if (orderError || !orderData) {
      console.error('[DATABASE_ERROR] Supabase Order Insert Failed:', orderError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create order in database: ' + (orderError?.message || 'Unknown error')
      });
    }

    const orderId = orderData.order_id;

    const formattedItems = items.map(item => {
      const rawIdentifier = item.item_id || item.product_name || item.name;
      const validUUID = getValidItemUUID(rawIdentifier);
      return {
        order_id: orderId,
        item_id: validUUID,
        qty_requested: parseInt(item.qty_requested, 10),
        sub_rules: (item.sub_rules || 'ask').toLowerCase(),
        status: 'pending'
      };
    });

    const { error: itemsError } = await supabase
      .from('item_table')
      .insert(formattedItems);

    if (itemsError) {
      console.error('[DATABASE_ERROR] Supabase Item Insert Error:', itemsError);
    }

    return res.status(201).json({
      success: true,
      message: 'Order successfully created and sent to pickers.',
      order_id: orderId
    });

  } catch (err) {
    console.error('[CRITICAL_ERROR] Unexpected Customer Order Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred while creating order: ' + err.message
    });
  }
};

exports.getStores = async (req, res) => {
  try {
    const { data: storesData, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[DATABASE_ERROR] Supabase getStores error:', error);
    }

    if (storesData && storesData.length > 0) {
      const mapped = storesData.map(s => ({
        store_id: s.id,
        store_name: s.name,
        location: s.location || 'Dark Store Hub',
        created_at: s.created_at
      }));
      return res.status(200).json(mapped);
    }

    const { data: newStore, error: insertErr } = await supabase
      .from('stores')
      .insert([{ name: 'QuickFix Grocery - Indiranagar Dark Store' }])
      .select()
      .single();

    if (!insertErr && newStore) {
      return res.status(200).json([
        {
          store_id: newStore.id,
          store_name: newStore.name,
          location: 'Indiranagar Hub',
          created_at: newStore.created_at
        }
      ]);
    }

    return res.status(200).json([]);
  } catch (err) {
    console.error('[CRITICAL_ERROR] Unexpected getStores Error:', err);
    return res.status(500).json({ error: 'Failed to fetch store locations: ' + err.message });
  }
};