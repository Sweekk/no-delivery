const supabase = require('../lib/supabaseClient');

<<<<<<< HEAD
const PRODUCT_MAPPING = {
  'APPLE-FUJI-01': 'a0000000-0000-0000-0000-000000000001',
  'MILK-GAL-02': 'a0000000-0000-0000-0000-000000000002',
  'BANANA-ORG-03': 'a0000000-0000-0000-0000-000000000003',
  'BREAD-WW-04': 'a0000000-0000-0000-0000-000000000004',
  'CEREAL-BOX-05': 'a0000000-0000-0000-0000-000000000005',
  'EGGS-DOZ-06': 'a0000000-0000-0000-0000-000000000006'
};

=======
>>>>>>> bdev
// Regex to validate standard UUIDs
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

exports.createCustomerOrder = async (req, res) => {
  const { store_id, customer_id, total_amount, items } = req.body;

  // 1. Payload Validation
  if (!store_id || !customer_id || total_amount === undefined || !items) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required fields. Payload must contain store_id, customer_id, total_amount, and items.'
    });
  }

  // Verify UUID formats
  if (!isValidUUID(store_id) || !isValidUUID(customer_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid UUID format for store_id or customer_id.'
    });
  }

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
<<<<<<< HEAD
    if (!item.item_id || item.qty_requested === undefined || !item.sub_rules) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Item at index ${i} is missing required fields (item_id, qty_requested, sub_rules).`
=======
    if (!item.item_id || item.qty_requested === undefined || !item.sub_rules || item.item_price === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Item at index ${i} is missing required fields (item_id, qty_requested, sub_rules, item_price).`
>>>>>>> bdev
      });
    }

    const qty = parseInt(item.qty_requested, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Item at index ${i} has invalid qty_requested. Must be a positive integer.`
      });
    }
<<<<<<< HEAD
=======

    const price = parseFloat(item.item_price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Item at index ${i} has invalid item_price. Must be a non-negative number.`
      });
    }
>>>>>>> bdev
  }

  let orderId = null;

  try {
    // Step 1 - Create Order: Insert store_id, customer_id, total_amount into order_table
    // Configure insert call to return order_id
    const { data: orderData, error: orderError } = await supabase
      .from('order_table')
      .insert([
        {
          store_id,
          customer_id,
          total_amount: parsedTotal
        }
      ])
      .select('order_id')
      .single();

    if (orderError) {
      console.error('Supabase Step 1 - Order Insert Error:', orderError);
      return res.status(400).json({
        error: 'Bad Request',
        message: `Failed to create order: ${orderError.message}`
      });
    }

    orderId = orderData.order_id;

    // Step 2 - Format Items: Inject generated order_id into every item
    const formattedItems = items.map(item => ({
      order_id: orderId,
<<<<<<< HEAD
      item_id: PRODUCT_MAPPING[item.item_id] || item.item_id,
      qty_requested: parseInt(item.qty_requested, 10),
      sub_rules: item.sub_rules
=======
      item_id: item.item_id,
      qty_requested: parseInt(item.qty_requested, 10),
      sub_rules: item.sub_rules,
      item_price: parseFloat(item.item_price)
>>>>>>> bdev
    }));

    // Step 3 - Bulk Insert Items: Single bulk insert into item_table
    const { error: itemsError } = await supabase
      .from('item_table')
      .insert(formattedItems);

    if (itemsError) {
      console.error('Supabase Step 3 - Bulk Insert Items Error:', itemsError);

      // Attempt to clean up orphaned order
      const { error: deleteError } = await supabase
        .from('order_table')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) {
        console.error('Orphan Cleanup Failed:', deleteError.message);
      }

      // Check for constraint validation failures
      if (itemsError.code === '23514') {
        return res.status(422).json({
          error: 'Unprocessable Entity',
<<<<<<< HEAD
          message: `Constraint validation failure. Details: ${itemsError.message}`
=======
          message: `Constraint violation. Check if sub_rules is valid ('auto', 'skip', 'ask'). Details: ${itemsError.message}`
>>>>>>> bdev
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: `Item insert failed: ${itemsError.message}. Successfully deleted orphaned order.`
      });
    }

    // Expected Output Success response
    return res.status(201).json({
      message: 'Order successfully created and sent to pickers.',
      order_id: orderId
    });

  } catch (err) {
    console.error('Unexpected Customer Order Error:', err);
    if (orderId) {
      // Attempt cleanup
      await supabase.from('order_table').delete().eq('order_id', orderId);
    }
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during checkout.'
    });
  }
};

exports.getStores = async (req, res) => {
  try {
    const { data, error } = await supabase
<<<<<<< HEAD
      .from('stores')
      .select('*')
      .order('name', { ascending: true });
=======
      .from('store_table')
      .select('*')
      .order('store_name', { ascending: true });
>>>>>>> bdev

    if (error) {
      console.error('Supabase getStores Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve stores.'
      });
    }

<<<<<<< HEAD
    // Map properties for UI backwards compatibility
    const mapped = data.map(s => ({
      store_id: s.id,
      store_name: s.name,
      created_at: s.created_at
    }));

    return res.status(200).json(mapped);
=======
    return res.status(200).json(data);
>>>>>>> bdev
  } catch (err) {
    console.error('Unexpected getStores Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};
