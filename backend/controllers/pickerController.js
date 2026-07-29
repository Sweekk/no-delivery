const supabase = require('../lib/supabaseClient'); // Adjust path to your supabaseClient.js

// Regex to validate standard UUIDs
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const getOrderForPicker = async (req, res) => {
  const { order_id } = req.params;

  // TEST CASE 2: Catch badly formatted IDs before hitting the database
  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('order_table')
      .select(`
        order_id,
        order_status,
        order_date,
        items:item_table (
          list_id,
          item_id,
          qty_requested,
          sub_rules,
          status,
          replacement_item_id
        )
      `)
      .eq('order_id', order_id)
      .single();

    // Handle Supabase errors
    if (error) {
      // TEST CASE 3: Catch 0 rows returned
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }

      // TEST CASE 4: Catch general database failures
      console.error('Supabase Query Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order data.'
      });
    }

    // TEST CASE 1: Happy Path
    return res.status(200).json(data);

  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const getActiveRun = async (req, res) => {
  res.status(200).json({ message: 'Active run placeholder' });
};

const handleNotFound = async (req, res) => {
  res.status(200).json({ message: 'Not found item handled placeholder' });
};

const updateItemStatus = async (req, res) => {
  const { list_id } = req.params;
  const { status, replacement_item_id } = req.body;

  // 1. Validate the UUID
  if (!list_id || !isValidUUID(list_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid list_id format. Must be a valid UUID.'
    });
  }

  // 2. Validate the status
  const validStatuses = ['pending', 'found', 'not_found', 'replaced'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  // 3. Business Logic: Require replacement ID if status is 'replaced'
  if (status === 'replaced' && !replacement_item_id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'replacement_item_id is required when status is "replaced".'
    });
  }

  try {
    // 4. Prepare the payload
    const updatePayload = {
      status,
      // If the status is NOT 'replaced', clear out any existing replacement_item_id
      replacement_item_id: status === 'replaced' ? replacement_item_id : null
    };

    // 5. Execute the update in Supabase
    const { data, error } = await supabase
      .from('item_table')
      .update(updatePayload)
      .eq('list_id', list_id)
      .select() // Return the updated row
      .single();

    if (error) {
      // Handle the '0 rows returned' error if list_id doesn't exist
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Item with list_id ${list_id} does not exist.`
        });
      }
      console.error('Supabase Update Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update item status.'
      });
    }

    return res.status(200).json({
      message: 'Item updated successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const completeOrder = async (req, res) => {
  const { order_id } = req.params;

  // 1. Validate UUID format
  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  try {
    // 2. Retrieve order to ensure it exists
    const { data: order, error: orderError } = await supabase
      .from('order_table')
      .select('order_id, order_status')
      .eq('order_id', order_id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }
      console.error('Supabase Query Error:', orderError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order details.'
      });
    }

    // 3. Query all items for this order
    const { data: items, error: itemsError } = await supabase
      .from('item_table')
      .select('list_id, item_id, status')
      .eq('order_id', order_id);

    if (itemsError) {
      console.error('Supabase Items Query Error:', itemsError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order items.'
      });
    }

    // 4. Check if any items are pending
    const pendingItems = items.filter(item => item.status === 'pending');
    if (pendingItems.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot complete order. Some items are still pending.',
        pending_items: pendingItems
      });
    }

    // 5. Update order_status to 'picked'
    const { data: updatedOrder, error: updateError } = await supabase
      .from('order_table')
      .update({ order_status: 'picked' })
      .eq('order_id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase Order Update Error:', updateError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to finalize order status.'
      });
    }

    return res.status(200).json({
      message: 'Order completed successfully',
      data: updatedOrder
    });

  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('order_table')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Supabase getOrders Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve orders.'
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

const updateOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  const { status } = req.body;

  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  if (!status) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status is required.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('order_table')
      .update({ order_status: status })
      .eq('order_id', order_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }
      console.error('Supabase Update Order Status Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update order status.'
      });
    }

    return res.status(200).json({
      message: 'Order status updated successfully',
      data
    });
  } catch (err) {
    console.error('Unexpected Controller Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    });
  }
};

module.exports = {
  getOrderForPicker,
  getActiveRun,
  updateItemStatus,
  handleNotFound,
  completeOrder,
  getOrders,
  updateOrderStatus
};