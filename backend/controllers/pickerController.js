const supabase = require('../lib/supabaseClient');

const PRODUCT_MAPPING = {
  'APPLE-FUJI-01': 'a0000000-0000-0000-0000-000000000001',
  'MILK-GAL-02': 'a0000000-0000-0000-0000-000000000002',
  'BANANA-ORG-03': 'a0000000-0000-0000-0000-000000000003',
  'BREAD-WW-04': 'a0000000-0000-0000-0000-000000000004',
  'CEREAL-BOX-05': 'a0000000-0000-0000-0000-000000000005',
  'EGGS-DOZ-06': 'a0000000-0000-0000-0000-000000000006'
};

const INVERSE_PRODUCT_MAPPING = {
  'a0000000-0000-0000-0000-000000000001': 'APPLE-FUJI-01',
  'a0000000-0000-0000-0000-000000000002': 'MILK-GAL-02',
  'a0000000-0000-0000-0000-000000000003': 'BANANA-ORG-03',
  'a0000000-0000-0000-0000-000000000004': 'BREAD-WW-04',
  'a0000000-0000-0000-0000-000000000005': 'CEREAL-BOX-05',
  'a0000000-0000-0000-0000-000000000006': 'EGGS-DOZ-06'
};

// Regex to validate standard UUIDs
const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const getOrderForPicker = async (req, res) => {
  const { order_id } = req.params;

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
          list,
          item_id,
          qty_requested,
          sub_rules,
          status,
          replacement_item_id
        )
      `)
      .eq('order_id', order_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order with ID ${order_id} does not exist.`
        });
      }

      console.error('Supabase Query Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order data.'
      });
    }

    // Map UUIDs back to frontend product codes and list back to list_id
    if (data && data.items) {
      data.items = data.items.map(item => {
        const { list, ...rest } = item;
        return {
          list_id: list,
          ...rest,
          item_id: INVERSE_PRODUCT_MAPPING[item.item_id] || item.item_id,
          replacement_item_id: INVERSE_PRODUCT_MAPPING[item.replacement_item_id] || item.replacement_item_id || null
        };
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

const getActiveRun = async (req, res) => {
  res.status(200).json({ message: 'Active run placeholder' });
};

const handleNotFound = async (req, res) => {
  res.status(200).json({ message: 'Not found item handled placeholder' });
};

const updateItemStatus = async (req, res) => {
  const { list_id } = req.params;
  const { status, replacement_item_id } = req.body;

  if (!list_id || !isValidUUID(list_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid list_id format. Must be a valid UUID.'
    });
  }

  const validStatuses = ['found', 'not_found', 'replaced', 'awaiting_customer'];
  if (!status || !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const normalizedStatus = status.toLowerCase();

  // Map to DB status representation (lowercase status constraint)
  const dbStatusMap = {
    found: 'found',
    not_found: 'not_found',
    replaced: 'replaced',
    awaiting_customer: 'awaiting_customer'
  };

  try {
    const dbReplacementId = replacement_item_id ? (PRODUCT_MAPPING[replacement_item_id] || replacement_item_id) : null;

    const { data, error } = await supabase
      .from('item_table')
      .update({
        status: dbStatusMap[normalizedStatus],
        replacement_item_id: (normalizedStatus === 'replaced' || normalizedStatus === 'awaiting_customer') ? dbReplacementId : null
      })
      .eq('list', list_id)
      .select()
      .single();

    if (error) {
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

  if (!order_id || !isValidUUID(order_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid order_id format. Must be a valid UUID.'
    });
  }

  try {
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

    const { data: items, error: itemsError } = await supabase
      .from('item_table')
      .select('list, item_id, status')
      .eq('order_id', order_id);

    if (itemsError) {
      console.error('Supabase Items Query Error:', itemsError);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve order items.'
      });
    }

    // Check if any items are pending or awaiting customer response
    const incompleteItems = items.filter(item => {
      const s = String(item.status).toLowerCase();
      return s === 'pending' || s === 'awaiting_customer';
    });

    if (incompleteItems.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot complete order. Some items are still pending or awaiting customer response.',
        pending_items: incompleteItems
      });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('order_table')
      .update({ order_status: 'FINALIZED' })
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